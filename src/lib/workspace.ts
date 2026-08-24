import type { ProjectData } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

const CLIENT_ID = '11972199461-elmh033d221vr8ketn3dtphcnt3628f5.apps.googleusercontent.com';
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets'
].join(' ');

let tokenClient: any = null;
let currentAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

export const isGoogleAuthAvailable = () => {
  return typeof window !== 'undefined' && typeof window.google !== 'undefined';
};

export const getStoredAccessToken = (): string | null => {
  if (currentAccessToken && Date.now() < tokenExpiresAt) {
    return currentAccessToken;
  }
  const stored = localStorage.getItem('artisplan_gauth_token');
  const exp = Number(localStorage.getItem('artisplan_gauth_exp') || 0);
  if (stored && Date.now() < exp) {
    currentAccessToken = stored;
    tokenExpiresAt = exp;
    return stored;
  }
  return null;
};

export const saveAccessToken = (token: string, expiresInSeconds: number = 3500) => {
  currentAccessToken = token;
  tokenExpiresAt = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem('artisplan_gauth_token', token);
  localStorage.setItem('artisplan_gauth_exp', String(tokenExpiresAt));
};

export const logoutGoogle = () => {
  currentAccessToken = null;
  tokenExpiresAt = 0;
  localStorage.removeItem('artisplan_gauth_token');
  localStorage.removeItem('artisplan_gauth_exp');
  localStorage.removeItem('artisplan_gauth_user');
};

export const requestGoogleLogin = (): Promise<{ token: string; user?: any }> => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      reject(new Error('Google Identity Services script not loaded.'));
      return;
    }

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (resp: any) => {
        if (resp.error) {
          reject(new Error(resp.error_description || resp.error));
          return;
        }
        if (resp.access_token) {
          saveAccessToken(resp.access_token, Number(resp.expires_in) || 3500);
          
          // Try to fetch basic profile
          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${resp.access_token}` }
            });
            const userData = await userRes.json();
            localStorage.setItem('artisplan_gauth_user', JSON.stringify(userData));
            resolve({ token: resp.access_token, user: userData });
          } catch {
            resolve({ token: resp.access_token });
          }
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

export const getStoredGoogleUser = () => {
  try {
    const raw = localStorage.getItem('artisplan_gauth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ==========================================
// GOOGLE DRIVE BACKUP & EXPORT
// ==========================================

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink?: string;
}

export const backupProjectToGoogleDrive = async (
  token: string, 
  project: ProjectData,
  canvasPngBlob?: Blob
): Promise<{ jsonResult: DriveUploadResult; imageResult?: DriveUploadResult }> => {
  // 1. Check or create 'ArtisPlan Studio' folder in Drive
  let folderId = await getOrCreateDriveFolder(token, 'ArtisPlan Studio Backups');

  // 2. Upload Project JSON
  const jsonContent = JSON.stringify(project, null, 2);
  const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
  const jsonName = `${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_backup_${new Date().toISOString().split('T')[0]}.json`;

  const jsonResult = await uploadFileToDrive(token, jsonBlob, jsonName, 'application/json', folderId);

  // 3. Upload Canvas Render image if provided
  let imageResult: DriveUploadResult | undefined;
  if (canvasPngBlob) {
    const imgName = `${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_render_${new Date().toISOString().split('T')[0]}.png`;
    imageResult = await uploadFileToDrive(token, canvasPngBlob, imgName, 'image/png', folderId);
  }

  return { jsonResult, imageResult };
};

async function getOrCreateDriveFolder(token: string, folderName: string): Promise<string> {
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listData = await listRes.json();
  if (listData.files && listData.files.length > 0) {
    return listData.files[0].id;
  }

  // Create folder
  const meta = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(meta)
  });
  const folder = await createRes.json();
  return folder.id;
}

async function uploadFileToDrive(
  token: string, 
  blob: Blob, 
  fileName: string, 
  mimeType: string,
  folderId?: string
): Promise<DriveUploadResult> {
  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive Upload Failed: ${errorText}`);
  }

  const data = await res.json();
  return {
    fileId: data.id,
    fileName: data.name,
    webViewLink: data.webViewLink
  };
}

export const fetchDriveRecentImages = async (token: string): Promise<Array<{ id: string; name: string; thumbnailLink?: string; webViewLink?: string }>> => {
  const query = "mimeType contains 'image/' and trashed = false";
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=20&fields=files(id,name,thumbnailLink,webViewLink)&orderBy=modifiedTime desc`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return data.files || [];
};

// ==========================================
// GOOGLE DOCS EXPORT (Project Brief & Lore)
// ==========================================

export const exportProjectToGoogleDocs = async (token: string, project: ProjectData): Promise<{ docId: string; docUrl: string }> => {
  const docTitle = `${project.title} - Creative Project Brief & Style Guide`;
  
  // 1. Create Google Doc
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: docTitle })
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Google Doc: ${err}`);
  }

  const docData = await createRes.json();
  const documentId = docData.documentId;

  // 2. Build structured document content
  const paletteText = project.moodboard.palette
    .map(p => `  • ${p.name} (${p.hex}) - ${p.role}`)
    .join('\n');

  const keywordsText = project.moodboard.keywords.join(', ');
  const tipsText = project.moodboard.compositionTips.map(t => `  • ${t}`).join('\n');
  const milestonesText = project.timeline.milestones
    .map(m => `  [${m.status.toUpperCase()}] ${m.phase}: ${m.title} (${m.startDate} ~ ${m.endDate})\n    Tasks: ${m.tasks.join(', ')}`)
    .join('\n\n');

  const fullText = `ARTISPLAN CREATIVE PROJECT SPECIFICATION
Project: ${project.title}
Created: ${new Date(project.createdAt).toLocaleDateString()} | Status: ${project.status.toUpperCase()}

========================================
1. PROJECT OVERVIEW & CONCEPT
========================================
${project.description || 'No description provided.'}

Moodboard Concept: ${project.moodboard.title || 'Visual Exploration'}
Aesthetic: ${project.moodboard.aesthetic}
Emotional Mood: ${project.moodboard.mood}
Vision Summary: ${project.moodboard.summary}

========================================
2. COLOR SCRIPT & PALETTE SPECIFICATION
========================================
${paletteText || 'No custom palette locked.'}

Lighting Style: ${project.moodboard.lightingStyle}
Texture & Brush Focus: ${project.moodboard.textureFocus}
Aesthetic Keywords: ${keywordsText}

========================================
3. ARTISTIC COMPOSITION GUIDELINES
========================================
${tipsText || 'Follow rule of thirds and dynamic silhouettes.'}

========================================
4. PRODUCTION TIMELINE & DELIVERABLES
========================================
Total Estimated Hours: ${project.timeline.totalEstimatedHours}h
Milestones:
${milestonesText}

========================================
Generated automatically by ArtisPlan Studio
`;

  // 3. Batch insert text into document
  await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: fullText
          }
        }
      ]
    })
  });

  return {
    docId: documentId,
    docUrl: `https://docs.google.com/document/d/${documentId}/edit`
  };
};

// ==========================================
// GOOGLE SHEETS EXPORT (Project Timeline & Tasks)
// ==========================================

export const exportTimelineToGoogleSheets = async (token: string, project: ProjectData): Promise<{ sheetId: string; sheetUrl: string }> => {
  const sheetTitle = `${project.title} - Production Tracker & Milestones`;

  // 1. Create Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title: sheetTitle }
    })
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Google Sheet: ${err}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // 2. Populate Headers and Milestone rows
  const headers = [
    'Phase',
    'Milestone Title',
    'Description',
    'Start Date',
    'End Date',
    'Status',
    'Color Tag',
    'Sub-Tasks Checklist'
  ];

  const rows = project.timeline.milestones.map(m => [
    m.phase,
    m.title,
    m.description,
    m.startDate,
    m.endDate,
    m.status.toUpperCase(),
    m.color,
    m.tasks.join('; ')
  ]);

  const values = [
    [`PROJECT: ${project.title}`, `Status: ${project.status}`, `Total Hours: ${project.timeline.totalEstimatedHours}h`],
    [],
    headers,
    ...rows
  ];

  // 3. Write values to Sheet
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:H${values.length}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values
    })
  });

  return {
    sheetId: spreadsheetId,
    sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  };
};
