/**
 * Werkstatt Roadmap Sync
 *
 * Bridges ArtisPlan's Timeline (project.timeline) into the self-hosted
 * "Project Companion OS" stack — specifically werkstatt_sdk's RoadmapEngine,
 * reached through Project Companion OS's existing /api/werkstatt/* proxy
 * (project-companion-os/backend/main.py), which forwards to werkstatt_mcp's
 * HTTP API adapter on :8791.
 *
 * Follows the same "clean disable" convention used throughout the sibling
 * Gemini Ink OS app (see lib/taxApi.ts there): if VITE_WERKSTATT_API_URL is
 * not set, every export here is a silent no-op — ArtisPlan keeps working
 * standalone with zero dependency on this backend being reachable.
 *
 * Configuration (.env.local):
 *   VITE_WERKSTATT_API_URL="http://127.0.0.1:9999/api/werkstatt"
 *   VITE_WERKSTATT_TOKEN=""            # only needed outside the iframe — see below
 *   VITE_WERKSTATT_DOMAIN_TAG="02_KERAMIK"
 *
 * When ArtisPlan is embedded as the "Werkstatt" app's iframe inside Project
 * Companion OS (see project-companion-os/frontend/main.js), the OS passes its
 * own API token via the `auth_token` URL query string automatically — the
 * same pattern already used for elster-ready-accounting / picas-fingerprint-explorer.
 * That takes priority over VITE_WERKSTATT_TOKEN, so no manual config is
 * needed in the embedded case.
 */

import type { ProjectData } from '../types';

export const WERKSTATT_API_URL = import.meta.env.VITE_WERKSTATT_API_URL || '';
export const WERKSTATT_DOMAIN_TAG = import.meta.env.VITE_WERKSTATT_DOMAIN_TAG || '02_KERAMIK';

export const isWerkstattSyncConfigured = () => !!WERKSTATT_API_URL;

function getOsToken(): string {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('auth_token');
    if (fromUrl) return fromUrl;
  } catch {
    // window/location unavailable — fall through to the env fallback
  }
  return import.meta.env.VITE_WERKSTATT_TOKEN || '';
}

interface WerkstattRoadmapPayload {
  domain_tag: string;
  milestones: Record<string, unknown>[];
  confirm: string;
}

/**
 * Maps ArtisPlan's ProjectMilestone[] onto the werkstatt roadmap's opaque
 * milestone JSON (werkstatt_sdk.RoadmapEngine stores it as-is, no server-side
 * schema). projectType/totalEstimatedHours have no home in that schema
 * (roadmaps are milestones-only) and stay ArtisPlan-local for now.
 */
function toRoadmapPayload(project: ProjectData): WerkstattRoadmapPayload {
  const milestones = (project.timeline?.milestones || []).map((m) => ({
    id: m.id,
    phase: m.phase,
    title: m.title,
    description: m.description,
    startDate: m.startDate,
    endDate: m.endDate,
    status: m.status,
    color: m.color,
    tasks: m.tasks,
    completedTasks: m.completedTasks || [],
  }));

  return {
    domain_tag: WERKSTATT_DOMAIN_TAG,
    milestones,
    // RoadmapEngine.update_roadmap() rejects overwriting an existing roadmap
    // unless confirm === 'AUTORISIERT' — a guard against callers that don't
    // know a roadmap already exists accidentally clobbering it. This sync
    // client is the deliberate, authorized owner of the roadmap it pushes
    // to, so it always sends the confirmation.
    confirm: 'AUTORISIERT',
  };
}

/**
 * Push the current project's timeline to werkstatt_sdk as a roadmap keyed by
 * the project title. Best-effort: throws on failure so the caller decides
 * whether to log/ignore it, but never mutates ArtisPlan state — canvas work
 * must keep working even if Project Companion OS is offline.
 */
export async function syncTimelineToWerkstatt(project: ProjectData): Promise<void> {
  if (!isWerkstattSyncConfigured()) return;

  const projectName = (project.title || project.id).trim();
  if (!projectName) return;

  const token = getOsToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-OS-Token'] = token;

  const res = await fetch(`${WERKSTATT_API_URL}/roadmaps/${encodeURIComponent(projectName)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(toRoadmapPayload(project)),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Werkstatt-Sync ${projectName} → ${res.status}: ${text}`);
  }
}
