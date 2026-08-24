/**
 * Self-hosted project sync via Nextcloud WebDAV — replaces the Firebase
 * Firestore realtime sync + anonymous auth this app originally shipped with
 * (Google AI Studio boilerplate, pointed at a "picas-9e875" cloud project
 * this app has no real ownership of).
 *
 * Mirrors the sibling repo's lib/webdav.ts conventions exactly, including
 * the VITE_NEXTCLOUD_* variable names, so one Nextcloud instance/App
 * Password serves both frontends.
 *
 * Important behavioral difference from the old Firestore sync: WebDAV has
 * no push/subscribe mechanism, so there is no live cross-device realtime
 * sync here — only a one-shot pull on project load (fetchProjectFromNextcloud)
 * and a debounced push on every local change (saveProjectToNextcloud), same
 * cadence as the local autosave. localStorage (see lib/storage.ts) stays the
 * source of truth either way; Nextcloud sync is best-effort and never blocks
 * or fails canvas usage.
 *
 * Configuration (.env.local):
 *   VITE_NEXTCLOUD_URL="https://cloud.example.tld/remote.php/dav/files/<user>"
 *   VITE_NEXTCLOUD_USER="<user>"
 *   VITE_NEXTCLOUD_APP_PASSWORD="<app password, not the account password>"
 *
 * Like the sibling repo's Nextcloud client, the WebDAV endpoint needs CORS
 * enabled for this app's origin — see that repo's README for the Nextcloud
 * `cors` app / reverse-proxy setup.
 */
import { createClient, WebDAVClient } from 'webdav';
import type { ProjectData } from '../types';
import { sanitizeProject } from './storage';

export const NEXTCLOUD_URL = import.meta.env.VITE_NEXTCLOUD_URL;
export const NEXTCLOUD_USER = import.meta.env.VITE_NEXTCLOUD_USER;
export const NEXTCLOUD_APP_PASSWORD = import.meta.env.VITE_NEXTCLOUD_APP_PASSWORD;

export const isNextcloudConfigured = () =>
  !!NEXTCLOUD_URL && !!NEXTCLOUD_USER && !!NEXTCLOUD_APP_PASSWORD;

export const PROJECTS_DIR = '/ArtisPlan/projects';

let client: WebDAVClient | null = null;
let dirEnsured = false;

/** Shared WebDAV client, also reused by lib/workspace.ts for manual exports. */
export function getNextcloudClient(): WebDAVClient {
  if (!client) {
    if (!isNextcloudConfigured()) {
      throw new Error(
        'Nextcloud ist nicht konfiguriert — VITE_NEXTCLOUD_URL, VITE_NEXTCLOUD_USER und ' +
        'VITE_NEXTCLOUD_APP_PASSWORD in .env.local setzen.'
      );
    }
    client = createClient(NEXTCLOUD_URL!, {
      username: NEXTCLOUD_USER!,
      password: NEXTCLOUD_APP_PASSWORD!,
    });
  }
  return client;
}

/** Ensures a directory (relative to the WebDAV root) exists, creating it recursively if not. */
export async function ensureNextcloudDir(dir: string): Promise<void> {
  const c = getNextcloudClient();
  if (!(await c.exists(dir))) {
    await c.createDirectory(dir, { recursive: true });
  }
}

async function ensureProjectsDir(): Promise<void> {
  if (dirEnsured) return;
  await ensureNextcloudDir(PROJECTS_DIR);
  dirEnsured = true;
}

function projectPath(projectId: string): string {
  return `${PROJECTS_DIR}/${encodeURIComponent(projectId)}.json`;
}

/** Best-effort push of the full project state. Never throws — returns false on any failure. */
export async function saveProjectToNextcloud(project: ProjectData): Promise<boolean> {
  if (!isNextcloudConfigured()) return false;
  try {
    await ensureProjectsDir();
    await getNextcloudClient().putFileContents(projectPath(project.id), JSON.stringify(project, null, 2), {
      overwrite: true,
    });
    return true;
  } catch (err) {
    console.warn('Nextcloud-Sync fehlgeschlagen (nicht kritisch, lokale Speicherung bleibt intakt):', err);
    return false;
  }
}

/** One-shot pull of a project's last-synced state. Never throws — returns null if unavailable/missing. */
export async function fetchProjectFromNextcloud(projectId: string): Promise<ProjectData | null> {
  if (!isNextcloudConfigured()) return null;
  try {
    const c = getNextcloudClient();
    const path = projectPath(projectId);
    if (!(await c.exists(path))) return null;
    const raw = (await c.getFileContents(path, { format: 'text' })) as string;
    return sanitizeProject(JSON.parse(raw) as Partial<ProjectData>);
  } catch (err) {
    console.warn('Konnte Projekt nicht von Nextcloud laden:', err);
    return null;
  }
}
