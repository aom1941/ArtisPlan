import { 
  ProjectData, 
  DrawingStroke, 
  CanvasImage, 
  CanvasSticky, 
  CanvasText, 
  CanvasShape, 
  CanvasAnnotation, 
  CanvasLayer, 
  CanvasCustomGuide, 
  MoodboardData, 
  ProjectTimeline 
} from '../types';
import { sanitizeAndMigrateProject } from './projectMigration';

/**
 * Domain Mutation Layer:
 * Ensures all mutations bump `updatedAt` and `revision` monotonically,
 * maintain layer invariants, and return clean immutable copies.
 */
export const ProjectMutations = {
  /**
   * Applies an arbitrary updater function with automatic revision and timestamp bump.
   */
  apply: (project: ProjectData, updater: (draft: ProjectData) => Partial<ProjectData>): ProjectData => {
    const changes = updater(project);
    return sanitizeAndMigrateProject({
      ...project,
      ...changes,
      revision: (project.revision || 1) + 1,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Updates project metadata (title, description, status).
   */
  updateMetadata: (project: ProjectData, meta: { title?: string; description?: string; status?: ProjectData['status'] }): ProjectData => {
    return ProjectMutations.apply(project, () => ({
      ...(meta.title !== undefined && { title: meta.title.trim() || 'Untitled Project' }),
      ...(meta.description !== undefined && { description: meta.description }),
      ...(meta.status !== undefined && { status: meta.status }),
    }));
  },

  /**
   * Adds strokes.
   */
  addStrokes: (project: ProjectData, strokes: DrawingStroke[]): ProjectData => {
    if (!strokes.length) return project;
    return ProjectMutations.apply(project, (p) => ({
      strokes: [...p.strokes, ...strokes],
    }));
  },

  /**
   * Sets strokes.
   */
  setStrokes: (project: ProjectData, strokes: DrawingStroke[]): ProjectData => {
    return ProjectMutations.apply(project, () => ({ strokes }));
  },

  /**
   * Sets layers.
   */
  setLayers: (project: ProjectData, layers: CanvasLayer[]): ProjectData => {
    return ProjectMutations.apply(project, () => ({ layers }));
  },

  /**
   * Sets custom guidelines.
   */
  setGuides: (project: ProjectData, guides: CanvasCustomGuide[]): ProjectData => {
    return ProjectMutations.apply(project, () => ({ guides }));
  },

  /**
   * Sets moodboard data.
   */
  setMoodboard: (project: ProjectData, moodboard: MoodboardData): ProjectData => {
    return ProjectMutations.apply(project, () => ({ moodboard }));
  },

  /**
   * Sets timeline data.
   */
  setTimeline: (project: ProjectData, timeline: ProjectTimeline): ProjectData => {
    return ProjectMutations.apply(project, () => ({ timeline }));
  },
};
