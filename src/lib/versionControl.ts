import type { ProjectData, ProjectVersion, VersionDiff } from '../types';
import { sanitizeProject, createDefaultProject } from './storage';

const VERSIONS_STORAGE_PREFIX = 'artisplan_versions_';

/**
 * Generate initial realistic sample versions if none exist for the default project.
 */
export const getSeedVersions = (rawProject: ProjectData): ProjectVersion[] => {
  const project = sanitizeProject(rawProject);
  const baseTime = new Date(project.createdAt).getTime();

  // Create v1: Rough Gesture Thumbnail
  const v1Snapshot: ProjectData = {
    ...project,
    updatedAt: new Date(baseTime - 86400000 * 3).toISOString(),
    status: 'planning',
    strokes: [
      {
        id: 'strk-v1-1',
        tool: 'pencil',
        size: 3,
        color: '#94A3B8',
        opacity: 0.6,
        layerId: 'layer-sketch',
        createdAt: baseTime - 86400000 * 3,
        points: [
          { x: 300, y: 350, pressure: 0.5 },
          { x: 350, y: 320, pressure: 0.7 },
          { x: 420, y: 290, pressure: 0.8 },
          { x: 480, y: 300, pressure: 0.6 }
        ]
      }
    ],
    stickies: [(project.stickies && project.stickies[0]) || {
      id: 'stk-v1',
      text: 'Initial concept: Focus on rain reflection perspective!',
      x: 200,
      y: 160,
      width: 220,
      height: 120,
      color: '#FEF08A',
      rotation: -1,
      author: 'Art Director',
      layerId: 'layer-annotations',
      createdAt: baseTime - 86400000 * 3
    }]
  };

  // Create v2: Character Lineart & Perspective Guide
  const v2Snapshot: ProjectData = {
    ...project,
    updatedAt: new Date(baseTime - 86400000 * 2).toISOString(),
    status: 'in-progress',
    strokes: [
      ...v1Snapshot.strokes,
      {
        id: 'strk-v2-1',
        tool: 'pen',
        size: 4,
        color: '#60A5FA',
        opacity: 0.85,
        layerId: 'layer-sketch',
        createdAt: baseTime - 86400000 * 2,
        points: [
          { x: 320, y: 330, pressure: 0.4 },
          { x: 380, y: 290, pressure: 0.7 },
          { x: 440, y: 280, pressure: 0.9 },
          { x: 500, y: 330, pressure: 0.5 }
        ]
      }
    ]
  };

  // Create v3: Base Color Blocking & Neon Flats Pass
  const v3Snapshot: ProjectData = {
    ...project,
    updatedAt: new Date(baseTime - 86400000 * 1).toISOString(),
    status: 'in-progress',
    strokes: [
      ...v2Snapshot.strokes,
      {
        id: 'strk-v3-1',
        tool: 'brush',
        size: 22,
        color: '#EC4899',
        opacity: 0.5,
        layerId: 'layer-color',
        createdAt: baseTime - 86400000 * 1,
        points: [
          { x: 280, y: 400, pressure: 0.4 },
          { x: 380, y: 430, pressure: 0.8 },
          { x: 480, y: 420, pressure: 0.7 },
          { x: 550, y: 390, pressure: 0.3 }
        ]
      }
    ]
  };

  // Create v4: Volumetric Lighting & Cyan Highlights (Current Project State)
  const v4Snapshot: ProjectData = {
    ...project,
    updatedAt: new Date(baseTime - 3600000 * 2).toISOString()
  };

  return [
    {
      id: `ver-${project.id}-v1`,
      projectId: project.id,
      versionNumber: 1,
      label: 'Initial Composition & Perspective Grid',
      description: 'First exploratory thumbnail establishing 2-point horizon vanishing lines and framing box.',
      createdAt: new Date(baseTime - 86400000 * 3).toISOString(),
      author: 'Lead Artist',
      tag: 'sketch',
      isStarred: true,
      stats: {
        strokeCount: v1Snapshot.strokes.length,
        layerCount: v1Snapshot.layers.length,
        imageCount: v1Snapshot.images.length,
        stickyCount: v1Snapshot.stickies.length,
        shapeCount: v1Snapshot.shapes.length,
        annotationCount: v1Snapshot.annotations.length
      },
      snapshot: v1Snapshot
    },
    {
      id: `ver-${project.id}-v2`,
      projectId: project.id,
      versionNumber: 2,
      label: 'Character Lineart & Collar Contour',
      description: 'Detailed ink contours for cybernetic coat and umbrella silhouette with clean stroke weights.',
      createdAt: new Date(baseTime - 86400000 * 2).toISOString(),
      author: 'Lead Artist',
      tag: 'lineart',
      isStarred: false,
      stats: {
        strokeCount: v2Snapshot.strokes.length,
        layerCount: v2Snapshot.layers.length,
        imageCount: v2Snapshot.images.length,
        stickyCount: v2Snapshot.stickies.length,
        shapeCount: v2Snapshot.shapes.length,
        annotationCount: v2Snapshot.annotations.length
      },
      snapshot: v2Snapshot
    },
    {
      id: `ver-${project.id}-v3`,
      projectId: project.id,
      versionNumber: 3,
      label: 'Neon Flats & Asphalt Underpainting',
      description: 'Applied base color blocking with electric magenta underpainting and wet pavement midtones.',
      createdAt: new Date(baseTime - 86400000 * 1).toISOString(),
      author: 'Concept Dept',
      tag: 'color',
      isStarred: true,
      stats: {
        strokeCount: v3Snapshot.strokes.length,
        layerCount: v3Snapshot.layers.length,
        imageCount: v3Snapshot.images.length,
        stickyCount: v3Snapshot.stickies.length,
        shapeCount: v3Snapshot.shapes.length,
        annotationCount: v3Snapshot.annotations.length
      },
      snapshot: v3Snapshot
    },
    {
      id: `ver-${project.id}-v4`,
      projectId: project.id,
      versionNumber: 4,
      label: 'Volumetric Cyan Glow & Rain Reflections',
      description: 'Full keyframe integration with glowing signage, art director critiques, and moodboard palette.',
      createdAt: new Date(baseTime - 3600000 * 2).toISOString(),
      author: 'Lead Artist',
      tag: 'milestone',
      isStarred: true,
      stats: {
        strokeCount: v4Snapshot.strokes.length,
        layerCount: v4Snapshot.layers.length,
        imageCount: v4Snapshot.images.length,
        stickyCount: v4Snapshot.stickies.length,
        shapeCount: v4Snapshot.shapes.length,
        annotationCount: v4Snapshot.annotations.length
      },
      snapshot: v4Snapshot
    }
  ];
};

/**
 * Load all stored versions for a specific project.
 */
export const loadProjectVersions = (rawProject: ProjectData): ProjectVersion[] => {
  const project = sanitizeProject(rawProject);
  try {
    const raw = localStorage.getItem(`${VERSIONS_STORAGE_PREFIX}${project.id}`);
    if (raw) {
      const parsed: ProjectVersion[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .map(v => ({
            ...v,
            snapshot: sanitizeProject(v.snapshot)
          }))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    }
  } catch (err) {
    console.warn("Could not load project versions:", err);
  }

  // Seed default versions for this project
  const seed = getSeedVersions(project);
  saveProjectVersions(project.id, seed);
  return seed;
};

/**
 * Save versions list to localStorage.
 */
export const saveProjectVersions = (projectId: string, versions: ProjectVersion[]) => {
  try {
    localStorage.setItem(`${VERSIONS_STORAGE_PREFIX}${projectId}`, JSON.stringify(versions));
  } catch (err) {
    console.error("Failed to save project versions:", err);
  }
};

/**
 * Create and save a new version snapshot.
 */
export const createVersionSnapshot = (
  rawProject: ProjectData,
  label: string,
  description: string,
  tag: ProjectVersion['tag'] = 'milestone',
  author: string = 'Artist'
): ProjectVersion => {
  const project = sanitizeProject(rawProject);
  const existing = loadProjectVersions(project);
  const nextVersionNum = existing.length > 0 
    ? Math.max(...existing.map(v => v.versionNumber)) + 1 
    : 1;

  const newVersion: ProjectVersion = {
    id: `ver-${project.id}-${Date.now()}`,
    projectId: project.id,
    versionNumber: nextVersionNum,
    label: label.trim() || `Version ${nextVersionNum}`,
    description: description.trim() || 'Manual canvas snapshot',
    createdAt: new Date().toISOString(),
    author,
    tag,
    isStarred: false,
    stats: {
      strokeCount: (project.strokes || []).length,
      layerCount: (project.layers || []).length,
      imageCount: (project.images || []).length,
      stickyCount: (project.stickies || []).length,
      shapeCount: (project.shapes || []).length,
      annotationCount: (project.annotations || []).length
    },
    snapshot: JSON.parse(JSON.stringify(project))
  };

  const updated = [...existing, newVersion];
  saveProjectVersions(project.id, updated);
  return newVersion;
};

/**
 * Toggle starred status of a version.
 */
export const toggleVersionStarred = (projectId: string, versionId: string): ProjectVersion[] => {
  const versions = loadProjectVersions(createDefaultProject(projectId));
  const updated = versions.map(v => {
    if (v.id === versionId) {
      return { ...v, isStarred: !v.isStarred };
    }
    return v;
  });
  saveProjectVersions(projectId, updated);
  return updated;
};

/**
 * Delete a specific version snapshot.
 */
export const deleteVersionSnapshot = (projectId: string, versionId: string): ProjectVersion[] => {
  const versions = loadProjectVersions(createDefaultProject(projectId));
  const updated = versions.filter(v => v.id !== versionId);
  saveProjectVersions(projectId, updated);
  return updated;
};

/**
 * Calculate detailed diff between two versions.
 */
export const calculateVersionDiff = (rawOlder: ProjectData, rawNewer: ProjectData): VersionDiff => {
  const older = sanitizeProject(rawOlder);
  const newer = sanitizeProject(rawNewer);

  const oldStrokeIds = new Set((older.strokes || []).map(s => s.id));
  const newStrokeIds = new Set((newer.strokes || []).map(s => s.id));

  let strokesAdded = 0;
  let strokesRemoved = 0;

  (newer.strokes || []).forEach(s => {
    if (!oldStrokeIds.has(s.id)) strokesAdded++;
  });
  (older.strokes || []).forEach(s => {
    if (!newStrokeIds.has(s.id)) strokesRemoved++;
  });

  const layersDelta = (newer.layers || []).length - (older.layers || []).length;

  const oldElementsCount = (older.images || []).length + (older.stickies || []).length + (older.texts || []).length + (older.shapes || []).length;
  const newElementsCount = (newer.images || []).length + (newer.stickies || []).length + (newer.texts || []).length + (newer.shapes || []).length;
  
  const elementsAdded = Math.max(0, newElementsCount - oldElementsCount);
  const elementsRemoved = Math.max(0, oldElementsCount - newElementsCount);

  const hasMoodboardChanged = JSON.stringify(older.moodboard?.palette || []) !== JSON.stringify(newer.moodboard?.palette || []) ||
    (older.moodboard?.images || []).length !== (newer.moodboard?.images || []).length;

  const hasTimelineChanged = (older.timeline?.milestones || []).length !== (newer.timeline?.milestones || []).length;

  const description: string[] = [];
  if (strokesAdded > 0) description.push(`Added ${strokesAdded} new brush stroke${strokesAdded > 1 ? 's' : ''}`);
  if (strokesRemoved > 0) description.push(`Removed ${strokesRemoved} brush stroke${strokesRemoved > 1 ? 's' : ''}`);
  if (layersDelta > 0) description.push(`Created ${layersDelta} new layer${layersDelta > 1 ? 's' : ''}`);
  else if (layersDelta < 0) description.push(`Removed ${Math.abs(layersDelta)} layer${Math.abs(layersDelta) > 1 ? 's' : ''}`);
  if (elementsAdded > 0) description.push(`Placed ${elementsAdded} canvas element${elementsAdded > 1 ? 's' : ''}`);
  if (hasMoodboardChanged) description.push('Moodboard palette or reference cards updated');
  if (hasTimelineChanged) description.push('Project milestones updated');
  if (description.length === 0) description.push('Minor metadata or positioning adjustments');

  return {
    strokesAdded,
    strokesRemoved,
    layersDelta,
    elementsAdded,
    elementsRemoved,
    hasMoodboardChanged,
    hasTimelineChanged,
    description
  };
};
