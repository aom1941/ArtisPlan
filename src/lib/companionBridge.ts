/**
 * Project Companion OS Bridge
 *
 * Talks directly to the same self-hosted "Project Companion OS" FastAPI
 * backend that werkstattSync.ts already pushes the Timeline into — but for
 * the OS's own core endpoints (Ideen-Pool, System Vitals) rather than the
 * werkstatt_sdk roadmap proxy. Kept as a separate file (mirrors the
 * one-lib-per-integration convention: lib/webdav.ts, lib/taxApi.ts,
 * werkstattSync.ts) since this talks to a different set of routes.
 *
 * Follows the same "clean disable" convention as every other optional
 * integration here: if the OS isn't reachable/configured, every export is a
 * silent no-op or resolves to an empty result — ArtisPlan keeps working
 * standalone with zero dependency on Project Companion OS being up.
 *
 * Configuration (.env.local):
 *   VITE_COMPANION_API_URL="http://127.0.0.1:9999/api"
 *
 * If VITE_COMPANION_API_URL is unset but VITE_WERKSTATT_API_URL is (the
 * existing Timeline-sync var, e.g. "http://127.0.0.1:9999/api/werkstatt"),
 * the OS base URL is derived from it by stripping the "/werkstatt" suffix —
 * both point at the same Project Companion OS instance in the documented
 * setup, so this avoids asking for the same host twice. When embedded as the
 * "Werkstatt" app's iframe (see project-companion-os/frontend/main.js), the
 * OS token arrives via the same ?auth_token= query param werkstattSync.ts
 * already reads (see getOsToken there) — no extra config needed in that case.
 */

import { WERKSTATT_API_URL, getOsToken } from './werkstattSync';
import type { ProjectData } from '../types';

const EXPLICIT_COMPANION_API_URL = import.meta.env.VITE_COMPANION_API_URL || '';

function deriveCompanionApiUrl(): string {
  if (EXPLICIT_COMPANION_API_URL) return EXPLICIT_COMPANION_API_URL.replace(/\/$/, '');
  if (!WERKSTATT_API_URL) return '';
  return WERKSTATT_API_URL.replace(/\/werkstatt\/?$/, '');
}

export const COMPANION_API_URL = deriveCompanionApiUrl();

export const isCompanionConfigured = () => !!COMPANION_API_URL;

function authHeaders(): Record<string, string> {
  const token = getOsToken();
  return token ? { 'X-OS-Token': token } : {};
}

export interface IdeaPoolItem {
  id: string;
  title: string;
  type: string;
  memo: string;
  tags: string[];
  status: string;
  date: string;
  media_url: string | null;
}

/**
 * Reads the OS's SQLite-backed Ideen-Pool (/api/ideas). Returns an empty
 * list rather than throwing on any failure — the Gallery's idea-import panel
 * treats "no ideas" and "OS unreachable" the same way (nothing to show).
 */
export async function fetchIdeaPool(): Promise<IdeaPoolItem[]> {
  if (!isCompanionConfigured()) return [];
  try {
    const res = await fetch(`${COMPANION_API_URL}/ideas`, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.ideas) ? data.ideas : [];
  } catch {
    return [];
  }
}

export interface CompanionVitals {
  cpu_percent: number;
  ram_used_gb: number;
  ram_total_gb: number;
  vram_ollama_percent: number;
  ollama_model: string;
  status: string;
}

/**
 * Reads the OS's /api/vitals (psutil-backed CPU/RAM + a static Ollama VRAM
 * estimate — same endpoint the OS's own desktop widget polls). Returns null
 * on any failure so the Navbar pill can render nothing instead of stale data.
 */
export async function fetchCompanionVitals(): Promise<CompanionVitals | null> {
  if (!isCompanionConfigured()) return null;
  try {
    const res = await fetch(`${COMPANION_API_URL}/vitals`, { headers: authHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

interface AnnotationDigestEntry {
  id: string;
  title: string;
  author: string;
  status: string;
  createdAt: string;
}

/**
 * Pushes the project's currently-open (non-resolved) canvas annotations to
 * the OS as a per-project digest, so Project Companion OS can surface them
 * as an agentic sticky note on the desktop (see backend/main.py's
 * /api/annotations/{project} and frontend/main.js's annotation-digest
 * polling). Best-effort, mirrors syncTimelineToWerkstatt: throws on failure
 * so the caller decides whether to log/ignore, never mutates ArtisPlan state.
 */
export async function pushAnnotationDigest(project: ProjectData): Promise<void> {
  if (!isCompanionConfigured()) return;

  const projectName = (project.title || project.id).trim();
  if (!projectName) return;

  const openAnnotations: AnnotationDigestEntry[] = (project.annotations || [])
    .filter((a) => a.status !== 'resolved')
    .map((a) => ({ id: a.id, title: a.title, author: a.author, status: a.status, createdAt: a.createdAt }));

  const res = await fetch(`${COMPANION_API_URL}/annotations/${encodeURIComponent(projectName)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ open_annotations: openAnnotations }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Annotation-Digest-Sync ${projectName} → ${res.status}: ${text}`);
  }
}
