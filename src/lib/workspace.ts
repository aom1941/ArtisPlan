/**
 * Nextcloud-backed manual export actions — replaces the Google Drive/Docs/
 * Sheets integration this app originally shipped with (Google AI Studio
 * boilerplate, requiring a Google OAuth consent flow for a privacy-first,
 * self-hosted stack). Reuses the same WebDAV client/config as
 * lib/nextcloudSync.ts (the automatic project-state sync); this file covers
 * the user-triggered "Backup Now" / "Export Brief" / "Export Timeline"
 * actions instead.
 *
 * No OAuth/login flow: Nextcloud access comes entirely from the
 * VITE_NEXTCLOUD_* env vars (a Nextcloud App Password), so there's nothing
 * to "connect" interactively — either it's configured or these actions stay
 * unavailable, the same "clean disable" pattern used throughout this stack.
 *
 * Note: browsing recently-uploaded Drive images (the old fetchDriveRecentImages)
 * has no equivalent here and was dropped rather than faked — see
 * NextcloudWorkspaceModal.tsx.
 */
import type { ProjectData } from '../types';
import { isNextcloudConfigured, getNextcloudClient, ensureNextcloudDir, NEXTCLOUD_URL } from './nextcloudSync';

export { isNextcloudConfigured };

const EXPORTS_DIR = '/ArtisPlan/exports';

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function safeFileStem(title: string): string {
  return title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'project';
}

/**
 * Best-effort "open in Nextcloud Files" deep link using the standard Files
 * app URL shape. Exact behavior depends on the server's version/config, so
 * this is a convenience for the UI, not a guarantee — callers should treat a
 * missing/wrong link as harmless.
 */
function filesAppUrl(dir: string, fileName: string): string | undefined {
  if (!NEXTCLOUD_URL) return undefined;
  try {
    const origin = new URL(NEXTCLOUD_URL).origin;
    return `${origin}/index.php/apps/files/?dir=${encodeURIComponent(dir)}&openfile=${encodeURIComponent(fileName)}`;
  } catch {
    return undefined;
  }
}

export interface NextcloudExportResult {
  path: string;
  fileName: string;
  url?: string;
}

// ==========================================
// NEXTCLOUD BACKUP (full project JSON snapshot + optional canvas render)
// ==========================================

export async function backupProjectToNextcloud(
  project: ProjectData,
  canvasPngBlob?: Blob
): Promise<{ jsonResult: NextcloudExportResult; imageResult?: NextcloudExportResult }> {
  if (!isNextcloudConfigured()) {
    throw new Error('Nextcloud ist nicht konfiguriert — siehe .env.example.');
  }
  await ensureNextcloudDir(EXPORTS_DIR);
  const client = getNextcloudClient();
  const stem = safeFileStem(project.title);
  const stamp = timestamp();

  const jsonName = `${stem}_backup_${stamp}.json`;
  const jsonPath = `${EXPORTS_DIR}/${jsonName}`;
  await client.putFileContents(jsonPath, JSON.stringify(project, null, 2), { overwrite: true });
  const jsonResult: NextcloudExportResult = {
    path: jsonPath,
    fileName: jsonName,
    url: filesAppUrl(EXPORTS_DIR, jsonName),
  };

  let imageResult: NextcloudExportResult | undefined;
  if (canvasPngBlob) {
    const imgName = `${stem}_render_${stamp}.png`;
    const imgPath = `${EXPORTS_DIR}/${imgName}`;
    const buffer = new Uint8Array(await canvasPngBlob.arrayBuffer());
    await client.putFileContents(imgPath, buffer, { overwrite: true });
    imageResult = { path: imgPath, fileName: imgName, url: filesAppUrl(EXPORTS_DIR, imgName) };
  }

  return { jsonResult, imageResult };
}

// ==========================================
// PROJECT BRIEF EXPORT (Markdown — replaces the Google Docs export)
// ==========================================

export async function exportProjectBriefToNextcloud(project: ProjectData): Promise<NextcloudExportResult> {
  if (!isNextcloudConfigured()) {
    throw new Error('Nextcloud ist nicht konfiguriert — siehe .env.example.');
  }
  await ensureNextcloudDir(EXPORTS_DIR);

  const paletteText = project.moodboard.palette
    .map(p => `- **${p.name}** (\`${p.hex}\`) — ${p.role}`)
    .join('\n');
  const keywordsText = project.moodboard.keywords.join(', ');
  const tipsText = project.moodboard.compositionTips.map(t => `- ${t}`).join('\n');
  const milestonesText = project.timeline.milestones
    .map(m => `- **[${m.status.toUpperCase()}] ${m.phase}: ${m.title}** (${m.startDate} – ${m.endDate})\n  Tasks: ${m.tasks.join(', ')}`)
    .join('\n\n');

  const markdown = `# ArtisPlan Creative Project Specification

**Project:** ${project.title}
**Created:** ${new Date(project.createdAt).toLocaleDateString()} · **Status:** ${project.status.toUpperCase()}

## 1. Project Overview & Concept

${project.description || 'No description provided.'}

**Moodboard Concept:** ${project.moodboard.title || 'Visual Exploration'}
**Aesthetic:** ${project.moodboard.aesthetic}
**Emotional Mood:** ${project.moodboard.mood}
**Vision Summary:** ${project.moodboard.summary}

## 2. Color Script & Palette Specification

${paletteText || 'No custom palette locked.'}

**Lighting Style:** ${project.moodboard.lightingStyle}
**Texture & Brush Focus:** ${project.moodboard.textureFocus}
**Aesthetic Keywords:** ${keywordsText}

## 3. Artistic Composition Guidelines

${tipsText || 'Follow rule of thirds and dynamic silhouettes.'}

## 4. Production Timeline & Deliverables

**Total Estimated Hours:** ${project.timeline.totalEstimatedHours}h

${milestonesText}

---
_Generated automatically by ArtisPlan Studio_
`;

  const fileName = `${safeFileStem(project.title)}_brief_${timestamp()}.md`;
  const path = `${EXPORTS_DIR}/${fileName}`;
  await getNextcloudClient().putFileContents(path, markdown, { overwrite: true });
  return { path, fileName, url: filesAppUrl(EXPORTS_DIR, fileName) };
}

// ==========================================
// TIMELINE EXPORT (CSV — replaces the Google Sheets export)
// ==========================================

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportTimelineToNextcloud(project: ProjectData): Promise<NextcloudExportResult> {
  if (!isNextcloudConfigured()) {
    throw new Error('Nextcloud ist nicht konfiguriert — siehe .env.example.');
  }
  await ensureNextcloudDir(EXPORTS_DIR);

  const headers = ['Phase', 'Milestone Title', 'Description', 'Start Date', 'End Date', 'Status', 'Color Tag', 'Sub-Tasks Checklist'];
  const rows = project.timeline.milestones.map(m => [
    m.phase, m.title, m.description, m.startDate, m.endDate, m.status.toUpperCase(), m.color, m.tasks.join('; '),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => csvEscape(String(cell))).join(','))
    .join('\n');

  const fileName = `${safeFileStem(project.title)}_timeline_${timestamp()}.csv`;
  const path = `${EXPORTS_DIR}/${fileName}`;
  await getNextcloudClient().putFileContents(path, csv, { overwrite: true });
  return { path, fileName, url: filesAppUrl(EXPORTS_DIR, fileName) };
}
