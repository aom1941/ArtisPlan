export type TouchGestureId = 
  | 'two_finger_tap'
  | 'two_finger_double_tap'
  | 'three_finger_tap'
  | 'three_finger_double_tap'
  | 'four_finger_tap'
  | 'three_finger_hold'
  | 'two_finger_pinch_in'
  | 'four_finger_swipe_down';

export type CanvasActionId =
  | 'open_command_palette'
  | 'clear_layer'
  | 'toggle_heatmap'
  | 'save_version'
  | 'undo'
  | 'redo'
  | 'fit_screen'
  | 'toggle_brush_studio'
  | 'toggle_search'
  | 'toggle_layers'
  | 'toggle_time_machine'
  | 'toggle_shortcuts'
  | 'eyedropper'
  | 'toggle_fullscreen';

export interface GestureActionDefinition {
  id: CanvasActionId;
  label: string;
  shortDescription: string;
  icon: string;
  category: 'Layer & Canvas' | 'Analysis & History' | 'Tools & Modes' | 'Navigation';
  color: string;
  requiresConfirmation?: boolean;
}

export interface TouchGestureBinding {
  gestureId: TouchGestureId;
  gestureName: string;
  description: string;
  fingerCount: number;
  pattern: 'tap' | 'double_tap' | 'hold' | 'pinch' | 'swipe';
  actionId: CanvasActionId;
  enabled: boolean;
}

export interface TouchGestureSettings {
  enabled: boolean;
  tapTimeout: number; // ms to resolve single vs double tap (e.g. 250ms)
  holdDuration: number; // ms for long press (e.g. 500ms)
  maxMovementTolerance: number; // max movement (px) during a tap to avoid conflict with pinch/pan
  showVisualFeedback: boolean;
  hapticFeedback: boolean;
  bindings: TouchGestureBinding[];
}

export interface ActiveTouchPoint {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  startTime: number;
  history: Array<{ x: number; y: number; time: number }>;
  radius?: number;
}

export type GesturePhase = 
  | 'idle'
  | 'tracking'
  | 'holding'
  | 'swiping'
  | 'pinching'
  | 'waiting_double_tap'
  | 'recognized'
  | 'cancelled';

export interface GestureLiveState {
  phase: GesturePhase;
  activeTouches: ActiveTouchPoint[];
  centroid: { x: number; y: number };
  fingerCount: number;
  holdProgress: number; // 0.0 to 1.0
  potentialGesture?: TouchGestureBinding | null;
  recognizedGesture?: {
    gestureId: TouchGestureId;
    actionId: CanvasActionId;
    label: string;
    icon: string;
    focalPoint: { x: number; y: number };
    timestamp: number;
  } | null;
  tapSequenceCount: number;
  distance?: number;
  swipeDirection?: 'down' | 'up' | 'left' | 'right' | null;
  movementDistance: number;
  isWithinTolerance: boolean;
}

export interface TouchPointSample {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  startTime: number;
  history?: Array<{ x: number; y: number; time: number }>;
}

export interface GestureFeedbackState {
  id: string;
  actionId: CanvasActionId;
  label: string;
  icon: string;
  x: number;
  y: number;
  timestamp: number;
}
