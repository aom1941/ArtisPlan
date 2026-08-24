import { ProjectData } from '../types';
import { sanitizeProject, createDefaultProject } from './storage';

export const CURRENT_SCHEMA_VERSION = 2;

/**
 * Validates, repairs, and migrates stored project payloads to the current schema.
 * Handles missing fields, legacy structure migrations, and guarantees array invariants.
 */
export function sanitizeAndMigrateProject(raw: unknown): ProjectData {
  if (!raw || typeof raw !== 'object') {
    return createDefaultProject();
  }

  const project = sanitizeProject(raw as Partial<ProjectData>);
  const schemaVersion = typeof project.schemaVersion === 'number' ? project.schemaVersion : 1;
  const revision = typeof project.revision === 'number' ? project.revision : 1;

  return {
    ...project,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    revision: schemaVersion < CURRENT_SCHEMA_VERSION ? revision + 1 : revision,
  };
}
