import type { ProjectData } from '../types';

const STORAGE_KEY_PREFIX = 'artisplan_project_';
const ACTIVE_PROJECT_KEY = 'artisplan_active_project_id';
const ALL_PROJECTS_META_KEY = 'artisplan_projects_list';

export const createDefaultProject = (id = 'project-default', title = 'Neo-Tokyo Cyberpunk Illustration'): ProjectData => {
  const now = new Date();
  const addDays = (d: number) => {
    const r = new Date(now);
    r.setDate(r.getDate() + d);
    return r.toISOString().split('T')[0];
  };

  return {
    id,
    title,
    description: 'High-energy keyframe illustration exploring rain-slicked neon alleys, mechanical textures, and atmospheric silhouette contrast.',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    status: 'in-progress',
    layers: [
      { id: 'layer-bg', name: 'Background & Atmosphere', visible: true, locked: false, opacity: 1 },
      { id: 'layer-sketch', name: 'Gesture & Lineart', visible: true, locked: false, opacity: 1 },
      { id: 'layer-color', name: 'Color & Lighting Pass', visible: true, locked: false, opacity: 0.9 },
      { id: 'layer-annotations', name: 'Art Director Notes', visible: true, locked: false, opacity: 1 }
    ],
    guides: [
      {
        id: 'guide-1',
        name: 'Top Composition Margin',
        orientation: 'horizontal',
        position: 120,
        color: '#06B6D4',
        locked: false,
        visible: true,
        createdAt: Date.now() - 50000
      },
      {
        id: 'guide-2',
        name: 'Left Focal Baseline',
        orientation: 'vertical',
        position: 200,
        color: '#F43F5E',
        locked: false,
        visible: true,
        createdAt: Date.now() - 40000
      },
      {
        id: 'guide-3',
        name: 'Right Boundary Anchor',
        orientation: 'vertical',
        position: 960,
        color: '#10B981',
        locked: false,
        visible: true,
        createdAt: Date.now() - 30000
      }
    ],
    strokes: [
      // Sample expressive initial sketch strokes
      {
        id: 'strk-1',
        tool: 'pencil',
        size: 3,
        color: '#60A5FA',
        opacity: 0.7,
        layerId: 'layer-sketch',
        createdAt: Date.now() - 100000,
        points: [
          { x: 300, y: 350, pressure: 0.5 },
          { x: 340, y: 310, pressure: 0.7 },
          { x: 400, y: 280, pressure: 0.8 },
          { x: 460, y: 290, pressure: 0.6 },
          { x: 500, y: 340, pressure: 0.4 }
        ]
      },
      {
        id: 'strk-2',
        tool: 'brush',
        size: 18,
        color: '#EC4899',
        opacity: 0.4,
        layerId: 'layer-color',
        createdAt: Date.now() - 90000,
        points: [
          { x: 280, y: 400, pressure: 0.3 },
          { x: 380, y: 430, pressure: 0.8 },
          { x: 480, y: 420, pressure: 0.7 },
          { x: 550, y: 390, pressure: 0.2 }
        ]
      }
    ],
    images: [
      {
        id: 'img-ref-1',
        src: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80',
        title: 'Neon Alleyway Mood',
        x: 650,
        y: 180,
        width: 280,
        height: 200,
        rotation: 0,
        opacity: 0.95,
        locked: false,
        layerId: 'layer-bg',
        tags: ['lighting', 'neon', 'cityscape']
      },
      {
        id: 'img-ref-2',
        src: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
        title: 'Impasto Brush Texture',
        x: 650,
        y: 410,
        width: 280,
        height: 190,
        rotation: 0,
        opacity: 0.9,
        locked: false,
        layerId: 'layer-bg',
        tags: ['texture', 'brushwork']
      }
    ],
    stickies: [
      {
        id: 'sticky-1',
        text: '💡 Focal Key: Keep the cyan rim light popping on the jacket collar. Push warm rim light on the umbrella edge!',
        x: 200,
        y: 160,
        width: 220,
        height: 140,
        color: '#FEF08A',
        rotation: -2,
        author: 'Lead Artist',
        layerId: 'layer-annotations',
        createdAt: Date.now()
      },
      {
        id: 'sticky-2',
        text: '🎨 Target Palette: Cyan #06B6D4, Magenta #EC4899, Deep Navy #0F172A',
        x: 440,
        y: 140,
        width: 190,
        height: 110,
        color: '#BAE6FD',
        rotation: 1.5,
        author: 'Concept Dept',
        layerId: 'layer-annotations',
        createdAt: Date.now()
      }
    ],
    texts: [
      {
        id: 'txt-1',
        text: 'NEO-TOKYO // KEYFRAME CONCEPT 01',
        x: 220,
        y: 80,
        fontSize: 22,
        fontFamily: 'Outfit',
        color: '#F43F5E',
        rotation: 0,
        layerId: 'layer-annotations'
      }
    ],
    shapes: [
      {
        id: 'shp-1',
        shapeType: 'rectangle',
        x: 180,
        y: 60,
        width: 780,
        height: 580,
        strokeColor: '#38BDF8',
        fillColor: 'transparent',
        strokeWidth: 2,
        rotation: 0,
        layerId: 'layer-annotations'
      }
    ],
    annotations: [
      {
        id: 'anno-1',
        x: 410,
        y: 320,
        title: 'Check perspective convergence',
        author: 'Art Director',
        color: '#EF4444',
        status: 'open',
        layerId: 'layer-annotations',
        createdAt: new Date().toISOString(),
        comments: [
          {
            id: 'c-1',
            author: 'Art Director',
            text: 'Ensure the two-point perspective vanishing line aligns with the glowing billboard horizon!',
            createdAt: '10m ago'
          }
        ]
      }
    ],
    moodboard: {
      id: 'mb-1',
      title: 'Neon Noir & Cyber Rainstorm',
      summary: 'High-contrast rain-soaked cityscape paired with glowing volumetric neon lighting and tactile brushwork.',
      aesthetic: 'Cyberpunk Concept Art',
      mood: 'Atmospheric & Electric',
      palette: [
        { hex: '#0F172A', name: 'Obsidian Midnight', role: 'Base Void' },
        { hex: '#1E293B', name: 'Deep Asphalt Slate', role: 'Atmospheric Midtone' },
        { hex: '#06B6D4', name: 'Electric Cyan Glow', role: 'Primary Key Light' },
        { hex: '#F43F5E', name: 'Vibrant Neon Rose', role: 'Focal Accent' },
        { hex: '#FDE047', name: 'Amber Street Refraction', role: 'Specular Glint' }
      ],
      keywords: ['Volumetric Fog', 'Specular Reflection', 'Cybernetic Detail', 'High Saturation Accents', 'Gouache Textures'],
      compositionTips: [
        'Place the primary character in the lower-third junction for cinematic scale.',
        'Use rain reflection streaks on asphalt to guide eye movement to the focal core.',
        'Preserve deep blacks in 40% of the canvas to maximize neon luminescence.'
      ],
      lightingStyle: 'Direct complementary neon cross-lighting with rim glow',
      textureFocus: 'Wet surfaces with hard specular edges and dry brush mist',
      suggestedReferences: [
        { query: 'Blade Runner atmospheric concept art', type: 'Lighting' },
        { query: 'Shinjuku rain photography night', type: 'Color' },
        { query: 'Futuristic motorcycle mechanical design', type: 'Props' }
      ],
      images: [
        {
          id: 'mb-img-1',
          url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
          caption: 'Neon sign reflections on rain puddle',
          tags: ['reflections', 'water', 'neon'],
          colorAccent: '#06B6D4'
        },
        {
          id: 'mb-img-2',
          url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
          caption: 'Cyber aesthetics & mechanical design',
          tags: ['hardware', 'cyberpunk', 'props'],
          colorAccent: '#F43F5E'
        },
        {
          id: 'mb-img-3',
          url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80',
          caption: 'Atmospheric moody skyline',
          tags: ['skyline', 'fog', 'night'],
          colorAccent: '#1E293B'
        }
      ],
      createdAt: now.toISOString()
    },
    timeline: {
      id: 'tl-1',
      projectName: 'Neo-Tokyo Cyberpunk Illustration',
      projectType: 'Concept Art & Matte Painting',
      totalEstimatedHours: 36,
      milestones: [
        {
          id: 'ms-1',
          phase: 'Phase 1: Research & Mood Board',
          title: 'Reference Gathering & Color Script',
          description: 'Collect lighting references, lock neon palette swatches, and define moodboard.',
          startDate: addDays(0),
          endDate: addDays(3),
          status: 'completed',
          color: '#3B82F6',
          tasks: ['Lock color palette & lighting key', 'Curate 12 reference images', 'Establish canvas DPI & ratio'],
          completedTasks: ['Lock color palette & lighting key', 'Curate 12 reference images']
        },
        {
          id: 'ms-2',
          phase: 'Phase 2: Thumbnails & Lineart',
          title: 'Composition Sketches & Perspective Grid',
          description: 'Explore 4 silhouette variations, lock camera perspective, and refine character lineart.',
          startDate: addDays(3),
          endDate: addDays(8),
          status: 'in-progress',
          color: '#8B5CF6',
          tasks: ['Draw 4 dynamic compositional thumbnails', 'Set 2-point perspective guide', 'Refine focal character lineart'],
          completedTasks: ['Draw 4 dynamic compositional thumbnails']
        },
        {
          id: 'ms-3',
          phase: 'Phase 3: Color Blocking & Value Map',
          title: 'Underpainting & Atmospheric Lighting',
          description: 'Block in flat local colors, set shadow ambient occlusion, and paint neon volumetric glow.',
          startDate: addDays(8),
          endDate: addDays(14),
          status: 'pending',
          color: '#EC4899',
          tasks: ['Block flat base color masks', 'Establish warm vs cool rim light', 'Render wet street reflections'],
          completedTasks: []
        },
        {
          id: 'ms-4',
          phase: 'Phase 4: Detailing & Final Polish',
          title: 'Mechanical Props, Rain Particles & Grading',
          description: 'Detail face and props, paint rain splashes and color grade final tonal values.',
          startDate: addDays(14),
          endDate: addDays(20),
          status: 'pending',
          color: '#10B981',
          tasks: ['Render cybernetic textures & metals', 'Add atmospheric rain mist & bokeh', 'Export backup to Google Drive & Docs'],
          completedTasks: []
        }
      ],
      updatedAt: now.toISOString()
    },
    referenceGallery: [
      {
        id: 'ref-1',
        title: 'Neon Tokyo Street Night',
        category: 'Lighting & Mood',
        url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=700&q=80',
        tags: ['rain', 'neon', 'night', 'cyan'],
        dominantHex: '#06B6D4',
        notes: 'Notice the vertical light streaks stretching down the asphalt.',
        createdAt: now.toISOString()
      },
      {
        id: 'ref-2',
        title: 'Cyberpunk Character Silhouette',
        category: 'Characters',
        url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80',
        tags: ['costume', 'jacket', 'gadget'],
        dominantHex: '#F43F5E',
        notes: 'Great collar profile and glowing headset details.',
        createdAt: now.toISOString()
      },
      {
        id: 'ref-3',
        title: 'Foggy Skyscraper Rooftops',
        category: 'Environments',
        url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=700&q=80',
        tags: ['fog', 'rooftops', 'depth'],
        dominantHex: '#1E293B',
        notes: 'Atmospheric depth layering reference.',
        createdAt: now.toISOString()
      },
      {
        id: 'ref-4',
        title: 'Expressive Color Study in Magenta',
        category: 'Color Studies',
        url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=700&q=80',
        tags: ['palette', 'brushwork', 'vibrant'],
        dominantHex: '#EC4899',
        notes: 'Loose painterly brush strokes for clothing folds.',
        createdAt: now.toISOString()
      }
    ],
    colorSwatches: [
      '#0F172A', '#1E293B', '#475569', '#94A3B8', '#F8FAFC',
      '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
      '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E', '#FFFFFF'
    ],
    canvasSettings: {
      backgroundColor: '#121216',
      gridPattern: 'grid',
      gridSize: 40,
      gridOpacity: 0.25,
      snapToGrid: true,
      subdivisions: 5,
      gridColor: 'auto',
      showOriginAxis: true,
      showCoordinates: false,
      showRulers: false
    }
  };
};

export const sanitizeProject = (raw: Partial<ProjectData> | null | undefined): ProjectData => {
  const fallback = createDefaultProject(raw?.id || 'project-default', raw?.title || 'Untitled Project');
  if (!raw) return fallback;

  const validLayers = Array.isArray(raw.layers) && raw.layers.length > 0
    ? raw.layers
    : fallback.layers;

  return {
    id: raw.id || fallback.id,
    title: raw.title || fallback.title,
    description: raw.description ?? fallback.description,
    createdAt: raw.createdAt || fallback.createdAt,
    updatedAt: raw.updatedAt || new Date().toISOString(),
    status: raw.status || fallback.status,
    layers: validLayers,
    strokes: Array.isArray(raw.strokes) ? raw.strokes : [],
    images: Array.isArray(raw.images) ? raw.images : [],
    stickies: Array.isArray(raw.stickies) ? raw.stickies : [],
    texts: Array.isArray(raw.texts) ? raw.texts : [],
    shapes: Array.isArray(raw.shapes) ? raw.shapes : [],
    annotations: Array.isArray(raw.annotations) ? raw.annotations : [],
    guides: Array.isArray(raw.guides) 
      ? raw.guides 
      : Array.isArray(raw.canvasSettings?.manualGuides) 
      ? raw.canvasSettings.manualGuides 
      : (fallback.guides || []),
    moodboard: raw.moodboard ? {
      ...fallback.moodboard,
      ...raw.moodboard,
      palette: Array.isArray(raw.moodboard.palette) ? raw.moodboard.palette : fallback.moodboard.palette,
      images: Array.isArray(raw.moodboard.images) ? raw.moodboard.images : [],
      keywords: Array.isArray(raw.moodboard.keywords) ? raw.moodboard.keywords : [],
      compositionTips: Array.isArray(raw.moodboard.compositionTips) ? raw.moodboard.compositionTips : [],
      suggestedReferences: Array.isArray(raw.moodboard.suggestedReferences) ? raw.moodboard.suggestedReferences : []
    } : fallback.moodboard,
    timeline: raw.timeline ? {
      ...fallback.timeline,
      ...raw.timeline,
      milestones: Array.isArray(raw.timeline.milestones) ? raw.timeline.milestones : fallback.timeline.milestones
    } : fallback.timeline,
    referenceGallery: Array.isArray(raw.referenceGallery) ? raw.referenceGallery : fallback.referenceGallery,
    colorSwatches: Array.isArray(raw.colorSwatches) && raw.colorSwatches.length > 0 ? raw.colorSwatches : fallback.colorSwatches,
    canvasSettings: {
      backgroundColor: raw.canvasSettings?.backgroundColor || '#121216',
      gridPattern: raw.canvasSettings?.gridPattern || 'grid',
      gridSize: raw.canvasSettings?.gridSize || 40,
      gridOpacity: raw.canvasSettings?.gridOpacity ?? 0.25,
      snapToGrid: raw.canvasSettings?.snapToGrid ?? true,
      subdivisions: raw.canvasSettings?.subdivisions ?? 5,
      gridColor: raw.canvasSettings?.gridColor || 'auto',
      showOriginAxis: raw.canvasSettings?.showOriginAxis ?? true,
      showCoordinates: raw.canvasSettings?.showCoordinates ?? false,
      showRulers: raw.canvasSettings?.showRulers ?? false,
      enableSmartGuides: raw.canvasSettings?.enableSmartGuides ?? true
    }
  };
};

export const loadLocalProject = (projectId?: string): ProjectData => {
  try {
    const idToLoad = projectId || localStorage.getItem(ACTIVE_PROJECT_KEY) || 'project-default';
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${idToLoad}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      const sanitized = sanitizeProject(parsed);
      return sanitized;
    }
  } catch (err) {
    console.warn("Could not load from localStorage:", err);
  }
  const defaultProj = createDefaultProject();
  saveLocalProject(defaultProj);
  return defaultProj;
};

export const saveLocalProject = (project: ProjectData) => {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${project.id}`, JSON.stringify(project));
    localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
    
    // Update project meta list
    const metaListStr = localStorage.getItem(ALL_PROJECTS_META_KEY);
    let metaList: Array<{ id: string; title: string; updatedAt: string }> = metaListStr ? JSON.parse(metaListStr) : [];
    const existingIndex = metaList.findIndex(m => m.id === project.id);
    if (existingIndex >= 0) {
      metaList[existingIndex] = { id: project.id, title: project.title, updatedAt: new Date().toISOString() };
    } else {
      metaList.unshift({ id: project.id, title: project.title, updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(ALL_PROJECTS_META_KEY, JSON.stringify(metaList));
  } catch (err) {
    console.error("Failed to save project locally:", err);
  }
};

export const listAllLocalProjects = (): Array<{ id: string; title: string; updatedAt: string }> => {
  try {
    const raw = localStorage.getItem(ALL_PROJECTS_META_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [{ id: 'project-default', title: 'Neo-Tokyo Cyberpunk Illustration', updatedAt: new Date().toISOString() }];
};
