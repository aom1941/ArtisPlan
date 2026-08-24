export type CanvasTool = 
  | 'select'
  | 'pen'
  | 'brush'
  | 'pencil'
  | 'highlighter'
  | 'eraser'
  | 'shape'
  | 'sticky'
  | 'text'
  | 'annotation'
  | 'eyedropper'
  | 'hand';

export type EraserMode = 'stroke' | 'pixel';

export type ShapeType = 'rectangle' | 'circle' | 'arrow' | 'line' | 'frame';

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
}

export interface DrawingStroke {
  id: string;
  tool: 'pen' | 'brush' | 'pencil' | 'highlighter' | 'eraser';
  points: StrokePoint[];
  color: string;
  size: number;
  opacity: number;
  layerId: string;
  createdAt: number;
  brushPresetId?: string;
  customDynamics?: {
    shapeType?: BrushShapeType;
    textureType?: BrushTextureType;
    hardness?: number;
    roundness?: number;
    angle?: number;
    spacing?: number;
    bristleCount?: number;
    wetEdge?: number;
    smudgeStrength?: number;
    flow?: number;
  };
  groupId?: string;
}

export interface CanvasGroup {
  id: string;
  name?: string;
  layerId?: string;
  locked?: boolean;
}

export interface CanvasImage {
  id: string;
  src: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  layerId: string;
  groupId?: string;
  tags?: string[];
  driveFileId?: string;
}

export interface CanvasSticky {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string; // e.g. '#FEF08A' (yellow), '#BAE6FD' (blue), '#BBF7D0' (green), '#FBCFE8' (pink)
  rotation: number;
  author: string;
  layerId: string;
  groupId?: string;
  tags?: string[];
  createdAt: number;
}

export interface CanvasText {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  rotation: number;
  layerId: string;
  groupId?: string;
  tags?: string[];
}

export interface CanvasShape {
  id: string;
  shapeType: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  rotation: number;
  layerId: string;
  groupId?: string;
  tags?: string[];
}

export interface AnnotationComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  avatar?: string;
}

export interface CanvasAnnotation {
  id: string;
  x: number;
  y: number;
  title: string;
  author: string;
  color: string;
  status: 'open' | 'in-progress' | 'resolved';
  comments: AnnotationComment[];
  layerId: string;
  tags?: string[];
  createdAt: string;
}

export interface CanvasLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface PaletteColor {
  hex: string;
  name: string;
  role: string;
}

export interface MoodboardData {
  id: string;
  title: string;
  summary: string;
  aesthetic: string;
  mood: string;
  palette: PaletteColor[];
  keywords: string[];
  compositionTips: string[];
  lightingStyle: string;
  textureFocus: string;
  suggestedReferences: Array<{ query: string; type: string }>;
  images: Array<{
    id: string;
    url: string;
    caption: string;
    tags: string[];
    colorAccent?: string;
  }>;
  createdAt: string;
}

export interface MilestoneTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectMilestone {
  id: string;
  phase: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  color: string;
  tasks: string[];
  completedTasks?: string[];
}

export interface ProjectTimeline {
  id: string;
  projectName: string;
  projectType: string;
  totalEstimatedHours: number;
  milestones: ProjectMilestone[];
  updatedAt: string;
}

export interface ReferenceImageItem {
  id: string;
  title: string;
  category: 'Characters' | 'Environments' | 'Lighting & Mood' | 'Props & Objects' | 'Color Studies' | 'Anatomy & Poses';
  url: string;
  tags: string[];
  dominantHex?: string;
  notes?: string;
  aspectRatio?: number;
  driveFileId?: string;
  createdAt: string;
}

export type GridPatternType = 
  | 'grid'
  | 'dots'
  | 'paper'
  | 'isometric'
  | 'cross'
  | 'triangular'
  | 'rule-of-thirds'
  | 'none';

export interface CanvasCustomGuide {
  id: string;
  name: string;
  orientation: 'horizontal' | 'vertical';
  position: number; // coordinate on canvas in pixels (X for vertical, Y for horizontal)
  color: string; // custom hex color code
  locked: boolean; // whether guide can be dragged on canvas
  visible: boolean; // whether guide is visible and magnetically snaps
  createdAt?: number;
}

export interface CanvasGridSettings {
  backgroundColor: string;
  gridPattern: GridPatternType;
  gridSize: number;
  gridOpacity?: number;
  snapToGrid?: boolean;
  gridColor?: string;
  subdivisions?: number;
  showCoordinates?: boolean;
  showRulers?: boolean;
  showOriginAxis?: boolean;
  enableSmartGuides?: boolean;
  snapToGuides?: boolean; // Snap-to-guide magnetic attraction toggle (default true)
  enableHapticFeedback?: boolean; // Haptic vibration and audio feedback on snap
  snapThreshold?: number; // Magnetic snapping distance threshold in px (default 10px)
  stickySnapResistance?: number; // Breakaway threshold for sticky latch
  manualGuides?: CanvasCustomGuide[];
}

export interface ProjectData {
  id: string;
  schemaVersion?: number; // Schema migration version (current: 2)
  revision?: number; // Monotonic edit revision counter for cloud sync conflict detection
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: 'planning' | 'in-progress' | 'polishing' | 'completed';
  strokes: DrawingStroke[];
  images: CanvasImage[];
  stickies: CanvasSticky[];
  texts: CanvasText[];
  shapes: CanvasShape[];
  annotations: CanvasAnnotation[];
  layers: CanvasLayer[];
  groups?: CanvasGroup[];
  guides?: CanvasCustomGuide[]; // User-managed manual magnetic guidelines
  moodboard: MoodboardData;
  timeline: ProjectTimeline;
  referenceGallery: ReferenceImageItem[];
  colorSwatches: string[];
  canvasSettings: CanvasGridSettings;
  lastCloudSync?: string;
}

export interface StylusSettings {
  palmRejection: boolean; // Only draw with stylus pointer events
  pressureSensitivity: number; // 0.1 to 2.0
  smoothing: number; // 1 to 10
  stabilization?: number; // Real-time stroke stabilization 0 to 100%
  lowLatency: boolean;
  vibrationFeedback: boolean;
  touchPanZoom: boolean;
}

export interface KeyboardShortcuts {
  [action: string]: string;
}

export interface GoogleAuthUser {
  name?: string;
  email?: string;
  picture?: string;
  accessToken?: string;
  expiresAt?: number;
}

// ----------------------------------------------------
// Version Control & Time Machine Types
// ----------------------------------------------------
export interface ProjectVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  label: string;
  description: string;
  createdAt: string;
  author: string;
  tag: 'milestone' | 'sketch' | 'lineart' | 'color' | 'lighting' | 'detail' | 'auto' | 'release';
  isStarred?: boolean;
  thumbnailUrl?: string;
  stats: {
    strokeCount: number;
    layerCount: number;
    imageCount: number;
    stickyCount: number;
    shapeCount: number;
    annotationCount: number;
  };
  snapshot: ProjectData;
}

export interface VersionDiff {
  strokesAdded: number;
  strokesRemoved: number;
  layersDelta: number;
  elementsAdded: number;
  elementsRemoved: number;
  hasMoodboardChanged: boolean;
  hasTimelineChanged: boolean;
  description: string[];
}

// ----------------------------------------------------
// Advanced Brush Engine & Customization Types
// ----------------------------------------------------
export type BrushShapeType = 
  | 'round'
  | 'chisel'
  | 'flat'
  | 'fan'
  | 'stipple'
  | 'calligraphy'
  | 'pencil_grain'
  | 'dry_bristle'
  | 'airbrush'
  | 'splatter'
  | 'halftone'
  | 'charcoal'
  | 'stamp';

export type BrushTextureType = 
  | 'smooth'
  | 'watercolor_paper'
  | 'linen_canvas'
  | 'rough_charcoal'
  | 'halftone_dots'
  | 'noise'
  | 'newsprint';

export type PressureCurveType = 'linear' | 'soft' | 'firm' | 's_curve';

export interface BrushStampConfig {
  enabled: boolean;
  imageUrl: string; // Base64 data URL, SVG data URL, or asset URL
  name?: string;
  tintWithColor: boolean; // Tint as monochrome mask using brush color vs full-color image
  followStrokeDirection: boolean; // Rotate image tangent to stroke path
  scatterJitter: number; // 0 - 100% perpendicular scatter from stroke line
  rotationJitter: number; // 0 - 100% random angle jitter
  scaleJitter: number; // 0 - 100% random scale variation
  spacing: number; // Stamp step spacing (% of size, 10% to 300%)
  invertMask?: boolean; // Invert luminance mask for custom uploads
  threshold?: number; // 0-255 luminance cut-off for transparency cutout
  countPerStep?: number; // 1 to 5 instances per step
}

export interface BrushPreset {
  id: string;
  name: string;
  category: 'Inking & Lines' | 'Pencils & Charcoal' | 'Oils & Acrylics' | 'Watercolor & Wash' | 'Special & FX' | 'Stamps & Patterns' | 'Custom';
  description: string;
  iconName?: string;
  isCustom?: boolean;
  author?: string;
  createdAt?: string;

  // 1. Shape & Tip Dynamics
  shape: {
    type: BrushShapeType;
    hardness: number; // 0 (soft airbrush) to 100 (hard pixel)
    roundness: number; // 10% (flat slit) to 100% (circle)
    angle: number; // 0 - 360 deg
    spacing: number; // 1% (continuous ribbon) to 100% (stamped dots)
    sizeJitter: number; // 0 - 100%
    angleJitter: number; // 0 - 100%
    bristleCount: number; // 1 to 24 fibers
  };

  // 2. Stamp Configuration (when shape.type === 'stamp' or stamp.enabled is true)
  stamp?: BrushStampConfig;

  // 3. Pressure & Stylus Dynamics
  dynamics: {
    pressureSize: boolean; // Pressure scales width
    pressureOpacity: boolean; // Pressure scales opacity
    pressureFlow: boolean; // Pressure scales ink flow rate
    tiltSensitivity: boolean; // Stylus tilt expands angle/width (e.g. pencil shading)
    velocitySensitivity: number; // Speed modulation -100% to +100%
    pressureCurve: PressureCurveType;
    minSizeRatio: number; // 0.05 to 1.0
  };

  // 4. Texture & Grain
  texture: {
    type: BrushTextureType;
    scale: number; // 20% to 300%
    depth: number; // 0% (no grain) to 100% (heavy paper teeth)
    contrast: number; // 0 - 100%
    blendMode: 'normal' | 'multiply' | 'overlay' | 'screen' | 'color_dodge';
  };

  // 5. Wetness, Flow & Blending
  wetness: {
    flow: number; // 10% - 100%
    wetEdge: number; // 0 - 100% (watercolor darker drying edge)
    smudgeStrength: number; // 0 - 100% (acrylic blending with canvas color)
    bleedRadius: number; // 0 - 20px
  };

  // 6. Stroke Stabilizer & Taper
  stabilizer: {
    streamline: number; // 0 - 100 (bezier curve stabilizer)
    taperStart: number; // 0 - 100
    taperEnd: number; // 0 - 100
    snapToLineAssist: boolean;
  };
}

