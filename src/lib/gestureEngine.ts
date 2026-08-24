import type { 
  TouchGestureId, 
  CanvasActionId, 
  GestureActionDefinition, 
  TouchGestureBinding, 
  TouchGestureSettings, 
  TouchPointSample,
  ActiveTouchPoint,
  GestureLiveState,
  GesturePhase
} from '../types/gestures';

export const GESTURE_ACTIONS_CATALOG: Record<CanvasActionId, GestureActionDefinition> = {
  open_command_palette: {
    id: 'open_command_palette',
    label: 'Open Command Palette',
    shortDescription: 'Radial touch HUD with fast tool triggers',
    icon: 'Sparkles',
    category: 'Tools & Modes',
    color: '#8B5CF6'
  },
  clear_layer: {
    id: 'clear_layer',
    label: 'Clear Active Layer',
    shortDescription: 'Purge all strokes & content on active layer',
    icon: 'Trash2',
    category: 'Layer & Canvas',
    color: '#EF4444',
    requiresConfirmation: true
  },
  toggle_heatmap: {
    id: 'toggle_heatmap',
    label: 'Toggle Activity Heatmap',
    shortDescription: 'Display stroke density & focal hotspots',
    icon: 'Flame',
    category: 'Analysis & History',
    color: '#F43F5E'
  },
  save_version: {
    id: 'save_version',
    label: 'Save Version Snapshot',
    shortDescription: 'Capture full milestone in Time Machine',
    icon: 'Save',
    category: 'Analysis & History',
    color: '#10B981'
  },
  undo: {
    id: 'undo',
    label: 'Undo Action',
    shortDescription: 'Step backward in canvas history',
    icon: 'Undo2',
    category: 'Layer & Canvas',
    color: '#3B82F6'
  },
  redo: {
    id: 'redo',
    label: 'Redo Action',
    shortDescription: 'Step forward in canvas history',
    icon: 'Redo2',
    category: 'Layer & Canvas',
    color: '#06B6D4'
  },
  fit_screen: {
    id: 'fit_screen',
    label: 'Fit to Screen',
    shortDescription: 'Frame and center all artwork elements',
    icon: 'Maximize2',
    category: 'Navigation',
    color: '#EAB308'
  },
  toggle_brush_studio: {
    id: 'toggle_brush_studio',
    label: 'Open Brush Studio',
    shortDescription: 'Configure brush dynamics & wet media jitter',
    icon: 'Paintbrush',
    category: 'Tools & Modes',
    color: '#EC4899'
  },
  toggle_search: {
    id: 'toggle_search',
    label: 'Search Canvas Objects',
    shortDescription: 'Find stickies, text, shapes & layers',
    icon: 'Search',
    category: 'Tools & Modes',
    color: '#6366F1'
  },
  toggle_layers: {
    id: 'toggle_layers',
    label: 'Toggle Layers Panel',
    shortDescription: 'Inspect, reorder and lock canvas layers',
    icon: 'Layers',
    category: 'Layer & Canvas',
    color: '#F97316'
  },
  toggle_time_machine: {
    id: 'toggle_time_machine',
    label: 'Open Time Machine',
    shortDescription: 'Browse version rollback & diff comparison',
    icon: 'History',
    category: 'Analysis & History',
    color: '#14B8A6'
  },
  eyedropper: {
    id: 'eyedropper',
    label: 'Eyedropper Color Picker',
    shortDescription: 'Sample pigment directly from pixel under finger',
    icon: 'Pipette',
    category: 'Tools & Modes',
    color: '#A855F7'
  },
  toggle_shortcuts: {
    id: 'toggle_shortcuts',
    label: 'Shortcuts & Gestures',
    shortDescription: 'Open keyboard & touch reference guide',
    icon: 'HelpCircle',
    category: 'Tools & Modes',
    color: '#64748B'
  },
  toggle_fullscreen: {
    id: 'toggle_fullscreen',
    label: 'Toggle Focus Mode',
    shortDescription: 'Hide surrounding panels for distraction-free drawing',
    icon: 'Expand',
    category: 'Navigation',
    color: '#6366F1'
  }
};

export const DEFAULT_TOUCH_BINDINGS: TouchGestureBinding[] = [
  {
    gestureId: 'two_finger_tap',
    gestureName: '2-Finger Tap',
    description: 'Quick tap with two fingers anywhere on canvas',
    fingerCount: 2,
    pattern: 'tap',
    actionId: 'undo',
    enabled: true
  },
  {
    gestureId: 'two_finger_double_tap',
    gestureName: '2-Finger Double Tap',
    description: 'Rapid double tap with two fingers',
    fingerCount: 2,
    pattern: 'double_tap',
    actionId: 'redo',
    enabled: true
  },
  {
    gestureId: 'three_finger_tap',
    gestureName: '3-Finger Tap',
    description: 'Quick tap with three fingers on canvas',
    fingerCount: 3,
    pattern: 'tap',
    actionId: 'open_command_palette',
    enabled: true
  },
  {
    gestureId: 'three_finger_double_tap',
    gestureName: '3-Finger Double Tap',
    description: 'Rapid double tap with three fingers',
    fingerCount: 3,
    pattern: 'double_tap',
    actionId: 'toggle_heatmap',
    enabled: true
  },
  {
    gestureId: 'four_finger_tap',
    gestureName: '4-Finger Tap',
    description: 'Quick tap with four fingers on canvas',
    fingerCount: 4,
    pattern: 'tap',
    actionId: 'clear_layer',
    enabled: true
  },
  {
    gestureId: 'three_finger_hold',
    gestureName: '3-Finger Hold / Long Press',
    description: 'Rest three fingers stationary for ~500ms',
    fingerCount: 3,
    pattern: 'hold',
    actionId: 'save_version',
    enabled: true
  },
  {
    gestureId: 'four_finger_swipe_down',
    gestureName: '4-Finger Swipe Down',
    description: 'Drag four fingers downwards in a swipe motion',
    fingerCount: 4,
    pattern: 'swipe',
    actionId: 'toggle_fullscreen',
    enabled: true
  },
  {
    gestureId: 'two_finger_pinch_in',
    gestureName: '2-Finger Pinch In',
    description: 'Pinch two fingers together rapidly',
    fingerCount: 2,
    pattern: 'pinch',
    actionId: 'fit_screen',
    enabled: true
  }
];

export const DEFAULT_TOUCH_SETTINGS: TouchGestureSettings = {
  enabled: true,
  tapTimeout: 260,
  holdDuration: 520,
  maxMovementTolerance: 20,
  showVisualFeedback: true,
  hapticFeedback: true,
  bindings: DEFAULT_TOUCH_BINDINGS
};

const GESTURES_STORAGE_KEY = 'artisplan_touch_gesture_settings';

export const loadTouchSettings = (): TouchGestureSettings => {
  try {
    const raw = localStorage.getItem(GESTURES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_TOUCH_SETTINGS,
        ...parsed,
        bindings: DEFAULT_TOUCH_BINDINGS.map(def => {
          const found = parsed.bindings?.find((b: TouchGestureBinding) => b.gestureId === def.gestureId);
          return found ? { ...def, ...found } : def;
        })
      };
    }
  } catch (err) {
    console.warn('Could not load touch gesture settings:', err);
  }
  return DEFAULT_TOUCH_SETTINGS;
};

export const saveTouchSettings = (settings: TouchGestureSettings) => {
  try {
    localStorage.setItem(GESTURES_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save touch settings:', err);
  }
};

/**
 * Recognizer for Multi-Finger Touch Tap, Hold, and Swipe Patterns with Live Feedback
 */
export class TouchGestureRecognizer {
  private settings: TouchGestureSettings;
  private activeTouches: Map<number, ActiveTouchPoint> = new Map();
  private maxFingerCountInSession: number = 0;
  private sessionStartTime: number = 0;
  private holdTimer: number | null = null;
  private holdAnimFrame: number | null = null;
  private holdStartTimestamp: number = 0;
  private pendingTapTimer: number | null = null;
  private lastTapTimestamp: number = 0;
  private lastTapFingerCount: number = 0;
  private lastTapFocalPoint: { x: number; y: number } = { x: 0, y: 0 };
  private onGestureTrigger: (gestureId: TouchGestureId, focalPoint: { x: number; y: number }) => void;
  private onLiveStateChange?: (state: GestureLiveState) => void;
  private currentLiveState: GestureLiveState;
  private simulationTimer: number | null = null;

  constructor(
    settings: TouchGestureSettings,
    onGestureTrigger: (gestureId: TouchGestureId, focalPoint: { x: number; y: number }) => void,
    onLiveStateChange?: (state: GestureLiveState) => void
  ) {
    this.settings = settings;
    this.onGestureTrigger = onGestureTrigger;
    this.onLiveStateChange = onLiveStateChange;
    this.currentLiveState = this.createInitialLiveState();
  }

  public setLiveStateListener(listener: ((state: GestureLiveState) => void) | undefined) {
    this.onLiveStateChange = listener;
  }

  public updateSettings(newSettings: TouchGestureSettings) {
    this.settings = newSettings;
  }

  private createInitialLiveState(): GestureLiveState {
    return {
      phase: 'idle',
      activeTouches: [],
      centroid: { x: 0, y: 0 },
      fingerCount: 0,
      holdProgress: 0,
      potentialGesture: null,
      recognizedGesture: null,
      tapSequenceCount: 0,
      movementDistance: 0,
      isWithinTolerance: true
    };
  }

  private notifyLiveState(overrides?: Partial<GestureLiveState>) {
    if (!this.onLiveStateChange) return;

    const touchesArray = Array.from(this.activeTouches.values());
    const count = touchesArray.length;
    const centroid = this.calculateFocalPoint();
    const movementDist = this.calculateMaxMovement();
    const isWithinTol = movementDist <= this.settings.maxMovementTolerance;

    let potGesture: TouchGestureBinding | null = null;
    if (count >= 2) {
      potGesture = this.settings.bindings.find(b => b.fingerCount === count && b.enabled) || null;
    }

    this.currentLiveState = {
      ...this.currentLiveState,
      activeTouches: touchesArray,
      fingerCount: count,
      centroid,
      movementDistance: movementDist,
      isWithinTolerance: isWithinTol,
      potentialGesture: potGesture,
      ...overrides
    };

    this.onLiveStateChange(this.currentLiveState);
  }

  public handleTouchStart(e: TouchEvent): { handled: boolean; fingerCount: number } {
    if (!this.settings.enabled) return { handled: false, fingerCount: e.touches.length };

    const now = performance.now();
    const count = e.touches.length;

    this.cancelHoldAnimation();

    if (this.activeTouches.size === 0) {
      this.sessionStartTime = now;
      this.maxFingerCountInSession = count;
    } else {
      this.maxFingerCountInSession = Math.max(this.maxFingerCountInSession, count);
    }

    // Record new touches with position history for path tracing
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      this.activeTouches.set(t.identifier, {
        id: t.identifier,
        x: t.clientX,
        y: t.clientY,
        startX: t.clientX,
        startY: t.clientY,
        startTime: now,
        history: [{ x: t.clientX, y: t.clientY, time: now }],
        radius: (t.radiusX || 15)
      });
    }

    const focal = this.calculateFocalPoint();
    const isStationary = this.isMovementWithinTolerance();

    // Schedule 3-Finger Hold recognition if 3 fingers down
    if (count === 3 && isStationary) {
      this.holdStartTimestamp = now;
      this.startHoldAnimation(focal);
      this.holdTimer = window.setTimeout(() => {
        if (this.activeTouches.size === 3 && this.isMovementWithinTolerance()) {
          this.triggerGesture('three_finger_hold', focal);
          this.notifyLiveState({
            phase: 'recognized',
            holdProgress: 1.0
          });
          this.resetSession();
        }
      }, this.settings.holdDuration);
    } else {
      this.notifyLiveState({
        phase: count >= 2 ? 'tracking' : 'idle',
        holdProgress: 0
      });
    }

    return { handled: count >= 2, fingerCount: count };
  }

  public handleTouchMove(e: TouchEvent): void {
    if (!this.settings.enabled) return;

    const now = performance.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const existing = this.activeTouches.get(t.identifier);
      if (existing) {
        existing.x = t.clientX;
        existing.y = t.clientY;
        existing.history.push({ x: t.clientX, y: t.clientY, time: now });
        if (existing.history.length > 60) {
          existing.history.shift();
        }
      }
    }

    const isWithinTol = this.isMovementWithinTolerance();

    // Check for swipe gesture (e.g. 4 fingers moving down together)
    if (this.activeTouches.size === 4 && !isWithinTol) {
      const isSwipeDown = this.checkSwipeDirection('down');
      if (isSwipeDown) {
        this.cancelHoldAnimation();
        this.notifyLiveState({
          phase: 'swiping',
          swipeDirection: 'down'
        });
        return;
      }
    }

    // Check for 2-finger pinch
    if (this.activeTouches.size === 2) {
      const touches = Array.from(this.activeTouches.values());
      const curDist = Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y);
      const startDist = Math.hypot(touches[0].startX - touches[1].startX, touches[0].startY - touches[1].startY);
      
      this.notifyLiveState({
        phase: Math.abs(curDist - startDist) > 30 ? 'pinching' : 'tracking',
        distance: curDist
      });
      return;
    }

    // If movement exceeds tolerance during hold, cancel hold timer
    if (!isWithinTol) {
      this.cancelHoldAnimation();
      this.notifyLiveState({
        phase: 'tracking',
        holdProgress: 0
      });
    } else {
      this.notifyLiveState();
    }
  }

  public handleTouchEnd(e: TouchEvent): { handled: boolean } {
    if (!this.settings.enabled) return { handled: false };

    this.cancelHoldAnimation();

    const now = performance.now();
    const remainingCount = e.touches.length;
    const focal = this.calculateFocalPoint();
    const isStationary = this.isMovementWithinTolerance();
    const sessionDuration = now - this.sessionStartTime;

    // Check if 4-finger swipe was completed
    if (this.maxFingerCountInSession === 4 && this.checkSwipeDirection('down')) {
      const binding = this.settings.bindings.find(b => b.gestureId === 'four_finger_swipe_down' && b.enabled);
      if (binding) {
        this.triggerGesture('four_finger_swipe_down', focal);
        this.resetActiveTouches();
        this.resetSession();
        return { handled: true };
      }
    }

    // When all fingers leave the screen, evaluate whether a tap pattern occurred
    if (remainingCount === 0) {
      const maxFingers = this.maxFingerCountInSession;
      this.resetActiveTouches();

      if (isStationary && sessionDuration < 450) {
        if (maxFingers === 2) {
          this.evaluateMultiTap(2, focal, now);
          return { handled: true };
        } else if (maxFingers === 3) {
          this.evaluateMultiTap(3, focal, now);
          return { handled: true };
        } else if (maxFingers === 4) {
          this.triggerGesture('four_finger_tap', focal);
          return { handled: true };
        }
      }
      this.resetSession();
    } else {
      // Remove ended touches from active tracker
      for (let i = 0; i < e.changedTouches.length; i++) {
        this.activeTouches.delete(e.changedTouches[i].identifier);
      }
      this.notifyLiveState();
    }

    return { handled: false };
  }

  public handleTouchCancel(): void {
    this.cancelHoldAnimation();
    this.resetSession();
    this.notifyLiveState({ phase: 'cancelled' });
  }

  private startHoldAnimation(focal: { x: number; y: number }) {
    const duration = this.settings.holdDuration;
    const start = performance.now();

    const step = () => {
      if (this.activeTouches.size !== 3 || !this.isMovementWithinTolerance()) {
        this.cancelHoldAnimation();
        return;
      }
      const elapsed = performance.now() - start;
      const progress = Math.min(1.0, elapsed / duration);

      this.notifyLiveState({
        phase: 'holding',
        holdProgress: progress,
        centroid: focal
      });

      if (progress < 1.0) {
        this.holdAnimFrame = requestAnimationFrame(step);
      }
    };

    this.holdAnimFrame = requestAnimationFrame(step);
  }

  private cancelHoldAnimation() {
    if (this.holdTimer) {
      window.clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
    if (this.holdAnimFrame) {
      cancelAnimationFrame(this.holdAnimFrame);
      this.holdAnimFrame = null;
    }
  }

  private evaluateMultiTap(fingerCount: number, focal: { x: number; y: number }, now: number) {
    const timeSinceLast = now - this.lastTapTimestamp;
    const isDoubleTapWindow = timeSinceLast < this.settings.tapTimeout && this.lastTapFingerCount === fingerCount;

    if (isDoubleTapWindow) {
      // Double tap detected! Clear single tap pending timer
      if (this.pendingTapTimer) {
        window.clearTimeout(this.pendingTapTimer);
        this.pendingTapTimer = null;
      }
      this.lastTapTimestamp = 0;
      this.lastTapFingerCount = 0;

      if (fingerCount === 2) {
        this.triggerGesture('two_finger_double_tap', focal);
      } else if (fingerCount === 3) {
        this.triggerGesture('three_finger_double_tap', focal);
      }
    } else {
      // Record first tap and schedule resolution in case second tap arrives
      this.lastTapTimestamp = now;
      this.lastTapFingerCount = fingerCount;
      this.lastTapFocalPoint = focal;

      this.notifyLiveState({
        phase: 'waiting_double_tap',
        tapSequenceCount: 1,
        centroid: focal
      });

      this.pendingTapTimer = window.setTimeout(() => {
        if (fingerCount === 2) {
          this.triggerGesture('two_finger_tap', this.lastTapFocalPoint);
        } else if (fingerCount === 3) {
          this.triggerGesture('three_finger_tap', this.lastTapFocalPoint);
        }
        this.pendingTapTimer = null;
        this.lastTapTimestamp = 0;
        this.lastTapFingerCount = 0;
        this.notifyLiveState({
          phase: 'idle',
          tapSequenceCount: 0
        });
      }, this.settings.tapTimeout);
    }
  }

  private triggerGesture(gestureId: TouchGestureId, focal: { x: number; y: number }) {
    const binding = this.settings.bindings.find(b => b.gestureId === gestureId && b.enabled);
    const actionDef = binding ? GESTURE_ACTIONS_CATALOG[binding.actionId] : null;

    if (this.settings.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(35);
      } catch {
        // Safe fallback
      }
    }

    if (binding && actionDef) {
      this.notifyLiveState({
        phase: 'recognized',
        recognizedGesture: {
          gestureId,
          actionId: binding.actionId,
          label: actionDef.label,
          icon: actionDef.icon,
          focalPoint: focal,
          timestamp: Date.now()
        }
      });
    }

    this.onGestureTrigger(gestureId, focal);
  }

  private checkSwipeDirection(targetDir: 'down' | 'up' | 'left' | 'right'): boolean {
    if (this.activeTouches.size === 0) return false;
    let matchCount = 0;
    for (const t of this.activeTouches.values()) {
      const deltaY = t.y - t.startY;
      const deltaX = t.x - t.startX;
      if (targetDir === 'down' && deltaY > 50 && Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
        matchCount++;
      } else if (targetDir === 'up' && deltaY < -50 && Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
        matchCount++;
      } else if (targetDir === 'right' && deltaX > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        matchCount++;
      } else if (targetDir === 'left' && deltaX < -50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        matchCount++;
      }
    }
    return matchCount === this.activeTouches.size;
  }

  private calculateFocalPoint(): { x: number; y: number } {
    if (this.activeTouches.size === 0) {
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    let sumX = 0;
    let sumY = 0;
    this.activeTouches.forEach(t => {
      sumX += t.x;
      sumY += t.y;
    });
    return {
      x: sumX / this.activeTouches.size,
      y: sumY / this.activeTouches.size
    };
  }

  private calculateMaxMovement(): number {
    let maxDist = 0;
    for (const t of this.activeTouches.values()) {
      const dist = Math.hypot(t.x - t.startX, t.y - t.startY);
      if (dist > maxDist) maxDist = dist;
    }
    return maxDist;
  }

  private isMovementWithinTolerance(): boolean {
    return this.calculateMaxMovement() <= this.settings.maxMovementTolerance;
  }

  private resetActiveTouches() {
    this.activeTouches.clear();
  }

  private resetSession() {
    this.activeTouches.clear();
    this.maxFingerCountInSession = 0;
    this.cancelHoldAnimation();
    this.notifyLiveState({
      phase: 'idle',
      holdProgress: 0,
      activeTouches: [],
      fingerCount: 0
    });
  }

  /**
   * Programmatic simulation for desktop users and sandbox testing
   */
  public simulateGesture(
    gestureId: TouchGestureId, 
    customFocal?: { x: number; y: number }
  ) {
    if (this.simulationTimer) {
      window.clearTimeout(this.simulationTimer);
      this.simulationTimer = null;
    }

    const focal = customFocal || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const now = performance.now();
    const binding = this.settings.bindings.find(b => b.gestureId === gestureId) || DEFAULT_TOUCH_BINDINGS.find(b => b.gestureId === gestureId);
    const fingerCount = binding?.fingerCount || 2;

    const simulatedTouches: ActiveTouchPoint[] = [];
    const radius = 55;
    for (let i = 0; i < fingerCount; i++) {
      const angle = (i / fingerCount) * Math.PI * 2 - Math.PI / 2;
      const x = focal.x + Math.cos(angle) * radius;
      const y = focal.y + Math.sin(angle) * radius;
      simulatedTouches.push({
        id: 1000 + i,
        x,
        y,
        startX: x,
        startY: y,
        startTime: now,
        history: [
          { x: x - 5, y: y - 5, time: now - 30 },
          { x, y, time: now }
        ],
        radius: 18
      });
    }

    this.activeTouches.clear();
    simulatedTouches.forEach(t => this.activeTouches.set(t.id, t));

    if (binding?.pattern === 'hold') {
      this.startHoldAnimation(focal);
      this.simulationTimer = window.setTimeout(() => {
        this.triggerGesture(gestureId, focal);
        this.resetSession();
      }, this.settings.holdDuration);
    } else if (binding?.pattern === 'double_tap') {
      this.notifyLiveState({
        phase: 'waiting_double_tap',
        tapSequenceCount: 1,
        centroid: focal
      });
      this.simulationTimer = window.setTimeout(() => {
        this.triggerGesture(gestureId, focal);
        this.resetSession();
      }, 160);
    } else if (binding?.pattern === 'swipe') {
      this.notifyLiveState({
        phase: 'swiping',
        swipeDirection: 'down',
        centroid: focal
      });
      this.simulationTimer = window.setTimeout(() => {
        this.triggerGesture(gestureId, focal);
        this.resetSession();
      }, 250);
    } else {
      this.notifyLiveState({
        phase: 'tracking',
        centroid: focal
      });
      this.simulationTimer = window.setTimeout(() => {
        this.triggerGesture(gestureId, focal);
        this.resetSession();
      }, 180);
    }
  }
}

