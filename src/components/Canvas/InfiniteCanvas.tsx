import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  ProjectData, 
  CanvasTool, 
  DrawingStroke, 
  StrokePoint, 
  CanvasImage, 
  CanvasSticky, 
  CanvasText, 
  CanvasShape, 
  CanvasAnnotation,
  StylusSettings,
  ShapeType,
  BrushPreset,
  EraserMode,
  CanvasGroup
} from '../../types';
import type { HeatmapSettings, HotspotCluster } from '../../types/heatmap';
import { renderActivityHeatmap, detectActivityHotspots } from '../../utils/heatmapEngine';
import { 
  renderAdvancedBrushStroke, 
  getActiveBrushPreset 
} from '../../lib/brushEngine';
import { StrokeStabilizer, type StabilizerTether } from '../../lib/strokeStabilizer';
import { 
  renderCanvasGrid, 
  renderCanvasRulers, 
  snapPointToGrid 
} from '../../lib/gridEngine';
import { GridCanvasPill } from './GridCanvasPill';
import { SelectionActionBar } from './SelectionActionBar';
import { CanvasContextMenu } from './CanvasContextMenu';
import { alignCanvasObjects, getItemBounds, type CanvasAlignmentAction } from '../../lib/alignmentEngine';
import { SmartGuidesVisualOverlay } from './SmartGuidesVisualOverlay';
import { 
  computeSmartGuidesOnMove, 
  computeSmartGuidesOnResize, 
  computeSmartGuidesOnShapeDraw, 
  getCandidateTargets, 
  type SmartGuideLine,
  type ResizeHandlePosition 
} from '../../lib/smartGuidesEngine';
import { hapticEngine } from '../../lib/hapticFeedback';
import type { TouchGestureSettings, CanvasActionId, TouchGestureId } from '../../types/gestures';
import { 
  TouchGestureRecognizer, 
  loadTouchSettings, 
  GESTURE_ACTIONS_CATALOG 
} from '../../lib/gestureEngine';
import { TouchCommandPalette } from './TouchCommandPalette';
import { GestureToastFeedback } from './GestureToastFeedback';
import { TouchGestureVisualOverlay } from './TouchGestureVisualOverlay';
import type { GestureLiveState } from '../../types/gestures';
import { 
  MessageSquare, 
  Trash2, 
  Move, 
  Lock, 
  Unlock, 
  Eye, 
  Sparkles, 
  Maximize2, 
  ExternalLink, 
  Flame, 
  Target,
  Group,
  Ungroup,
  Copy,
  Layers,
  Tag
} from 'lucide-react';

interface InfiniteCanvasProps {
  project: ProjectData;
  setProject: React.Dispatch<React.SetStateAction<ProjectData>>;
  activeTool: CanvasTool;
  activeColor: string;
  strokeSize: number;
  activeOpacity: number;
  selectedShapeType: ShapeType;
  activeLayerId: string;
  stylusSettings: StylusSettings;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  pan: { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  onOpenAnnotation: (annotation: CanvasAnnotation) => void;
  onColorPick: (colorHex: string) => void;
  onRecordHistory: () => void;
  theme: 'dark' | 'light' | 'oled' | 'sepia';
  activeBrushPreset?: BrushPreset;
  highlightedId?: string | null;
  heatmapSettings?: HeatmapSettings;
  onSelectHotspot?: (hotspot: HotspotCluster) => void;
  stabilization?: number;
  touchSettings?: TouchGestureSettings;
  onExecuteGestureAction?: (actionId: CanvasActionId) => void;
  onOpenGestureSettings?: () => void;
  eraserMode?: EraserMode;
  onSelectionChange?: (selected: Array<{ type: 'image' | 'sticky' | 'text' | 'shape' | 'annotation'; id: string }>) => void;
  onAlign?: (action: CanvasAlignmentAction, target: 'selection' | 'canvas') => void;
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
  project,
  setProject,
  activeTool,
  activeColor,
  strokeSize,
  activeOpacity,
  selectedShapeType,
  activeLayerId,
  stylusSettings,
  zoom,
  setZoom,
  pan,
  setPan,
  onOpenAnnotation,
  onColorPick,
  onRecordHistory,
  theme,
  activeBrushPreset,
  highlightedId,
  heatmapSettings,
  onSelectHotspot,
  stabilization,
  touchSettings,
  onExecuteGestureAction,
  onOpenGestureSettings,
  eraserMode = 'stroke',
  onSelectionChange,
  onAlign
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Real-time Stroke Stabilization Engine
  const stabilizerRef = useRef<StrokeStabilizer>(new StrokeStabilizer());
  const [activeTether, setActiveTether] = useState<StabilizerTether | null>(null);

  // Touch Gesture Command HUD & Feedback State
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [paletteFocalPoint, setPaletteFocalPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [toastFeedback, setToastFeedback] = useState<{
    actionId: CanvasActionId | null;
    label: string;
    gestureName?: string;
    visible: boolean;
  }>({ actionId: null, label: '', visible: false });
  const toastTimeoutRef = useRef<number | null>(null);
  const [gestureLiveState, setGestureLiveState] = useState<GestureLiveState | null>(null);

  const effectiveTouchSettings = touchSettings || loadTouchSettings();
  const gestureRecognizerRef = useRef<TouchGestureRecognizer | null>(null);

  // Active layer metadata helper
  const safeLayers = Array.isArray(project.layers) && project.layers.length > 0
    ? project.layers
    : [{ id: 'layer-sketch', name: 'Gesture & Lineart', visible: true, locked: false, opacity: 1 }];
  const activeLayer = safeLayers.find(l => l.id === activeLayerId) || safeLayers[0];

  const showToast = useCallback((actionId: CanvasActionId, label: string, gestureName?: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastFeedback({ actionId, label, gestureName, visible: true });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastFeedback(prev => ({ ...prev, visible: false }));
    }, 1800);
  }, []);

  const handleActionDispatch = useCallback((actionId: CanvasActionId, gestureName?: string) => {
    const actDef = GESTURE_ACTIONS_CATALOG[actionId];
    if (actDef) {
      showToast(actionId, actDef.label, gestureName);
    }

    if (actionId === 'open_command_palette') {
      setShowCommandPalette(true);
      return;
    }

    if (onExecuteGestureAction) {
      onExecuteGestureAction(actionId);
    } else if (actionId === 'clear_layer') {
      onRecordHistory();
      setProject(prev => ({
        ...prev,
        strokes: prev.strokes.filter(s => s.layerId !== activeLayerId),
        texts: prev.texts.filter(t => t.layerId !== activeLayerId),
        stickies: prev.stickies.filter(st => st.layerId !== activeLayerId),
        shapes: prev.shapes.filter(sh => sh.layerId !== activeLayerId)
      }));
    }
  }, [activeLayerId, onExecuteGestureAction, onRecordHistory, setProject, showToast]);

  // Sync gesture recognizer with settings and dispatch callback
  useEffect(() => {
    gestureRecognizerRef.current = new TouchGestureRecognizer(
      effectiveTouchSettings,
      (gestureId: TouchGestureId, focal: { x: number; y: number }) => {
        const binding = effectiveTouchSettings.bindings.find(b => b.gestureId === gestureId && b.enabled);
        if (!binding) return;

        if (binding.actionId === 'open_command_palette') {
          setPaletteFocalPoint(focal);
          setShowCommandPalette(true);
          showToast('open_command_palette', 'Command HUD', binding.gestureName);
        } else {
          handleActionDispatch(binding.actionId, binding.gestureName);
        }
      },
      (liveState: GestureLiveState) => {
        setGestureLiveState(liveState);
      }
    );
  }, [effectiveTouchSettings, handleActionDispatch, showToast]);

  // Interaction State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [activeSnapPoint, setActiveSnapPoint] = useState<{ x: number; y: number } | null>(null);

  // Shape in progress
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [currentShapePreview, setCurrentShapePreview] = useState<CanvasShape | null>(null);

  // Multi-selection & Grouping State
  const [selectedElements, setSelectedElements] = useState<Array<{
    type: 'image' | 'sticky' | 'text' | 'shape' | 'annotation';
    id: string;
  }>>([]);
  const [marqueeBox, setMarqueeBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [activeSmartGuides, setActiveSmartGuides] = useState<SmartGuideLine[]>([]);
  const lastSnapKeyRef = useRef<string>('');
  const dragStartCoordsRef = useRef<{ x: number; y: number } | null>(null);
  const initialItemPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const initialSelectionBoundsRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const resizingStateRef = useRef<{
    handle: ResizeHandlePosition;
    initialBounds: { x: number; y: number; width: number; height: number };
    initialItems: Map<string, any>;
  } | null>(null);
  const hasRecordedEraserHistoryRef = useRef(false);

  // Sync selectedElements with parent
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedElements);
    }
  }, [selectedElements, onSelectionChange]);

  // Backward compatibility convenience for single item queries
  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null;

  // Group helpers
  const getElementGroupId = useCallback((type: string, id: string): string | undefined => {
    if (type === 'shape') return project.shapes.find(s => s.id === id)?.groupId;
    if (type === 'image') return project.images.find(i => i.id === id)?.groupId;
    if (type === 'sticky') return project.stickies.find(s => s.id === id)?.groupId;
    if (type === 'text') return project.texts.find(t => t.id === id)?.groupId;
    return undefined;
  }, [project]);

  const getGroupItems = useCallback((groupId: string): Array<{ type: 'image' | 'sticky' | 'text' | 'shape' | 'annotation'; id: string }> => {
    if (!groupId) return [];
    const items: Array<{ type: 'image' | 'sticky' | 'text' | 'shape' | 'annotation'; id: string }> = [];
    project.shapes.filter(s => s.groupId === groupId).forEach(s => items.push({ type: 'shape', id: s.id }));
    project.images.filter(i => i.groupId === groupId).forEach(i => items.push({ type: 'image', id: i.id }));
    project.stickies.filter(st => st.groupId === groupId).forEach(st => items.push({ type: 'sticky', id: st.id }));
    project.texts.filter(t => t.groupId === groupId).forEach(t => items.push({ type: 'text', id: t.id }));
    return items;
  }, [project]);

  const expandWithGroups = useCallback((items: Array<{ type: 'image' | 'sticky' | 'text' | 'shape' | 'annotation'; id: string }>) => {
    const result: Array<{ type: 'image' | 'sticky' | 'text' | 'shape' | 'annotation'; id: string }> = [];
    const visited = new Set<string>();

    for (const it of items) {
      const key = `${it.type}-${it.id}`;
      if (visited.has(key)) continue;
      visited.add(key);
      result.push(it);

      const gid = getElementGroupId(it.type, it.id);
      if (gid) {
        const gItems = getGroupItems(gid);
        for (const git of gItems) {
          const gKey = `${git.type}-${git.id}`;
          if (!visited.has(gKey)) {
            visited.add(gKey);
            result.push(git);
          }
        }
      }
    }
    return result;
  }, [getElementGroupId, getGroupItems]);

  // Combined Bounding Box & Group Status calculation for floating action bar & canvas overlay
  const selectionBounds = useMemo(() => {
    if (selectedElements.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let sampleColor: string | undefined = undefined;
    let allLocked = true;
    let hasAnyLocked = false;
    const groupIds = new Set<string>();

    for (const item of selectedElements) {
      if (item.type === 'shape') {
        const shape = project.shapes.find(s => s.id === item.id);
        if (shape) {
          const sx = Math.min(shape.x, shape.x + shape.width);
          const sy = Math.min(shape.y, shape.y + shape.height);
          const sw = Math.max(20, Math.abs(shape.width));
          const sh = Math.max(20, Math.abs(shape.height));
          minX = Math.min(minX, sx);
          minY = Math.min(minY, sy);
          maxX = Math.max(maxX, sx + sw);
          maxY = Math.max(maxY, sy + sh);
          if (!sampleColor) sampleColor = shape.strokeColor;
          allLocked = false;
          if (shape.groupId) groupIds.add(shape.groupId);
        }
      } else if (item.type === 'sticky') {
        const sticky = project.stickies.find(s => s.id === item.id);
        if (sticky) {
          minX = Math.min(minX, sticky.x);
          minY = Math.min(minY, sticky.y);
          maxX = Math.max(maxX, sticky.x + sticky.width);
          maxY = Math.max(maxY, sticky.y + sticky.height);
          if (!sampleColor) sampleColor = sticky.color;
          allLocked = false;
          if (sticky.groupId) groupIds.add(sticky.groupId);
        }
      } else if (item.type === 'text') {
        const txt = project.texts.find(t => t.id === item.id);
        if (txt) {
          minX = Math.min(minX, txt.x);
          minY = Math.min(minY, txt.y);
          maxX = Math.max(maxX, txt.x + 140);
          maxY = Math.max(maxY, txt.y + 35);
          if (!sampleColor) sampleColor = txt.color;
          allLocked = false;
          if (txt.groupId) groupIds.add(txt.groupId);
        }
      } else if (item.type === 'image') {
        const img = project.images.find(i => i.id === item.id);
        if (img) {
          minX = Math.min(minX, img.x);
          minY = Math.min(minY, img.y);
          maxX = Math.max(maxX, img.x + img.width);
          maxY = Math.max(maxY, img.y + img.height);
          if (img.locked) hasAnyLocked = true;
          else allLocked = false;
          if (img.groupId) groupIds.add(img.groupId);
        }
      } else if (item.type === 'annotation') {
        const anno = project.annotations.find(a => a.id === item.id);
        if (anno) {
          minX = Math.min(minX, anno.x - 16);
          minY = Math.min(minY, anno.y - 16);
          maxX = Math.max(maxX, anno.x + 16);
          maxY = Math.max(maxY, anno.y + 16);
          allLocked = false;
        }
      }
    }

    if (minX === Infinity) return null;

    const isGrouped = groupIds.size === 1 && selectedElements.length > 1;
    const canGroup = selectedElements.length >= 2;
    const canUngroup = groupIds.size > 0;
    const singleType = selectedElements.length === 1 
      ? selectedElements[0].type 
      : (isGrouped ? ('group' as const) : ('multiple' as const));

    return {
      x: minX,
      y: minY,
      width: Math.max(30, maxX - minX),
      height: Math.max(30, maxY - minY),
      color: sampleColor,
      isLocked: selectedElements.length === 1 && allLocked && hasAnyLocked,
      isGrouped,
      canGroup,
      canUngroup,
      singleType,
      selectedCount: selectedElements.length,
      groupId: groupIds.size === 1 ? Array.from(groupIds)[0] : undefined
    };
  }, [selectedElements, project]);

  // Backward compatibility selectedItemData
  const selectedItemData = selectionBounds ? {
    type: selectionBounds.singleType,
    id: selectedElements[0]?.id || '',
    x: selectionBounds.x,
    y: selectionBounds.y,
    width: selectionBounds.width,
    height: selectionBounds.height,
    color: selectionBounds.color,
    isLocked: selectionBounds.isLocked
  } : null;

  // Unified Deletion Handler (Individual or Selection)
  const deleteElement = useCallback((id: string, type: 'image' | 'sticky' | 'text' | 'shape' | 'annotation') => {
    onRecordHistory();
    if (type === 'shape') {
      setProject(prev => ({ ...prev, shapes: prev.shapes.filter(s => s.id !== id) }));
    } else if (type === 'sticky') {
      setProject(prev => ({ ...prev, stickies: prev.stickies.filter(s => s.id !== id) }));
    } else if (type === 'text') {
      setProject(prev => ({ ...prev, texts: prev.texts.filter(t => t.id !== id) }));
    } else if (type === 'image') {
      setProject(prev => ({ ...prev, images: prev.images.filter(i => i.id !== id) }));
    } else if (type === 'annotation') {
      setProject(prev => ({ ...prev, annotations: prev.annotations.filter(a => a.id !== id) }));
    }
    setSelectedElements(prev => prev.filter(item => !(item.type === type && item.id === id)));
    showToast('undo', 'Element removed (Ctrl+Z to Undo)');
  }, [onRecordHistory, setProject, showToast]);

  const handleDeleteSelectedElements = useCallback(() => {
    if (selectedElements.length === 0) return;
    onRecordHistory();
    const count = selectedElements.length;
    const selectedShapeIds = new Set(selectedElements.filter(s => s.type === 'shape').map(s => s.id));
    const selectedImageIds = new Set(selectedElements.filter(s => s.type === 'image').map(s => s.id));
    const selectedStickyIds = new Set(selectedElements.filter(s => s.type === 'sticky').map(s => s.id));
    const selectedTextIds = new Set(selectedElements.filter(s => s.type === 'text').map(s => s.id));
    const selectedAnnoIds = new Set(selectedElements.filter(s => s.type === 'annotation').map(s => s.id));

    setProject(prev => ({
      ...prev,
      shapes: prev.shapes.filter(s => !selectedShapeIds.has(s.id)),
      images: prev.images.filter(i => !selectedImageIds.has(i.id)),
      stickies: prev.stickies.filter(st => !selectedStickyIds.has(st.id)),
      texts: prev.texts.filter(t => !selectedTextIds.has(t.id)),
      annotations: prev.annotations.filter(a => !selectedAnnoIds.has(a.id))
    }));
    setSelectedElements([]);
    showToast('undo', `Removed ${count} item${count > 1 ? 's' : ''} (Ctrl+Z to Undo)`);
  }, [selectedElements, onRecordHistory, setProject, showToast]);

  // Group Selected Objects (Ctrl+G)
  const handleGroupSelectedElements = useCallback(() => {
    if (selectedElements.length < 2) return;
    onRecordHistory();
    const newGroupId = `grp-${Date.now()}`;
    const selectedIds = new Set(selectedElements.map(s => `${s.type}-${s.id}`));

    setProject(prev => {
      const updatedShapes = prev.shapes.map(s => selectedIds.has(`shape-${s.id}`) ? { ...s, groupId: newGroupId } : s);
      const updatedImages = prev.images.map(i => selectedIds.has(`image-${i.id}`) ? { ...i, groupId: newGroupId } : i);
      const updatedStickies = prev.stickies.map(st => selectedIds.has(`sticky-${st.id}`) ? { ...st, groupId: newGroupId } : st);
      const updatedTexts = prev.texts.map(t => selectedIds.has(`text-${t.id}`) ? { ...t, groupId: newGroupId } : t);

      const existingGroups = prev.groups || [];
      const newGroup: CanvasGroup = {
        id: newGroupId,
        name: `Group ${existingGroups.length + 1}`
      };

      return {
        ...prev,
        shapes: updatedShapes,
        images: updatedImages,
        stickies: updatedStickies,
        texts: updatedTexts,
        groups: [...existingGroups, newGroup]
      };
    });

    showToast('save_version', `Grouped ${selectedElements.length} elements (Ctrl+G)`);
  }, [selectedElements, onRecordHistory, setProject, showToast]);

  // Ungroup Selected Elements (Ctrl+Shift+G)
  const handleUngroupSelectedElements = useCallback(() => {
    if (selectedElements.length === 0) return;
    onRecordHistory();
    const selectedIds = new Set(selectedElements.map(s => `${s.type}-${s.id}`));

    setProject(prev => {
      const updatedShapes = prev.shapes.map(s => selectedIds.has(`shape-${s.id}`) ? { ...s, groupId: undefined } : s);
      const updatedImages = prev.images.map(i => selectedIds.has(`image-${i.id}`) ? { ...i, groupId: undefined } : i);
      const updatedStickies = prev.stickies.map(st => selectedIds.has(`sticky-${st.id}`) ? { ...st, groupId: undefined } : st);
      const updatedTexts = prev.texts.map(t => selectedIds.has(`text-${t.id}`) ? { ...t, groupId: undefined } : t);

      const remainingGroupIds = new Set([
        ...updatedShapes.map(s => s.groupId).filter(Boolean),
        ...updatedImages.map(i => i.groupId).filter(Boolean),
        ...updatedStickies.map(s => s.groupId).filter(Boolean),
        ...updatedTexts.map(t => t.groupId).filter(Boolean)
      ]);

      const updatedGroups = (prev.groups || []).filter(g => remainingGroupIds.has(g.id));

      return {
        ...prev,
        shapes: updatedShapes,
        images: updatedImages,
        stickies: updatedStickies,
        texts: updatedTexts,
        groups: updatedGroups
      };
    });

    showToast('undo', 'Ungrouped elements (Ctrl+Shift+G)');
  }, [selectedElements, onRecordHistory, setProject, showToast]);

  // Duplicate Selected Items or Groups (Ctrl+D)
  const handleDuplicateSelectedElements = useCallback(() => {
    if (selectedElements.length === 0) return;
    onRecordHistory();
    const offset = 25;
    const timestamp = Date.now();
    const hasGroup = selectedElements.some(s => getElementGroupId(s.type, s.id));
    const newGroupId = hasGroup ? `grp-${timestamp}` : undefined;

    const newSelected: Array<{ type: 'image' | 'sticky' | 'text' | 'shape' | 'annotation'; id: string }> = [];
    const newShapes: CanvasShape[] = [];
    const newImages: CanvasImage[] = [];
    const newStickies: CanvasSticky[] = [];
    const newTexts: CanvasText[] = [];

    for (const item of selectedElements) {
      const newId = `${item.type}-${timestamp}-${Math.floor(Math.random() * 1000)}`;
      if (item.type === 'shape') {
        const orig = project.shapes.find(s => s.id === item.id);
        if (orig) {
          const dup: CanvasShape = { ...orig, id: newId, x: orig.x + offset, y: orig.y + offset, groupId: newGroupId };
          newShapes.push(dup);
          newSelected.push({ type: 'shape', id: newId });
        }
      } else if (item.type === 'image') {
        const orig = project.images.find(i => i.id === item.id);
        if (orig) {
          const dup: CanvasImage = { ...orig, id: newId, x: orig.x + offset, y: orig.y + offset, groupId: newGroupId };
          newImages.push(dup);
          newSelected.push({ type: 'image', id: newId });
        }
      } else if (item.type === 'sticky') {
        const orig = project.stickies.find(st => st.id === item.id);
        if (orig) {
          const dup: CanvasSticky = { ...orig, id: newId, x: orig.x + offset, y: orig.y + offset, groupId: newGroupId };
          newStickies.push(dup);
          newSelected.push({ type: 'sticky', id: newId });
        }
      } else if (item.type === 'text') {
        const orig = project.texts.find(t => t.id === item.id);
        if (orig) {
          const dup: CanvasText = { ...orig, id: newId, x: orig.x + offset, y: orig.y + offset, groupId: newGroupId };
          newTexts.push(dup);
          newSelected.push({ type: 'text', id: newId });
        }
      }
    }

    setProject(prev => ({
      ...prev,
      shapes: [...prev.shapes, ...newShapes],
      images: [...prev.images, ...newImages],
      stickies: [...prev.stickies, ...newStickies],
      texts: [...prev.texts, ...newTexts],
      groups: newGroupId ? [...(prev.groups || []), { id: newGroupId, name: `Group ${(prev.groups?.length || 0) + 1}` }] : prev.groups
    }));

    setSelectedElements(newSelected);
    showToast('save_version', `Duplicated ${newSelected.length} object${newSelected.length > 1 ? 's' : ''}`);
  }, [selectedElements, project, onRecordHistory, setProject, showToast, getElementGroupId]);

  // Change color for selected items
  const handleChangeSelectedColor = useCallback((color: string) => {
    if (selectedElements.length === 0) return;
    const selectedShapeIds = new Set(selectedElements.filter(s => s.type === 'shape').map(s => s.id));
    const selectedStickyIds = new Set(selectedElements.filter(s => s.type === 'sticky').map(s => s.id));
    const selectedTextIds = new Set(selectedElements.filter(s => s.type === 'text').map(s => s.id));

    setProject(prev => ({
      ...prev,
      shapes: prev.shapes.map(s => selectedShapeIds.has(s.id) ? { ...s, strokeColor: color } : s),
      stickies: prev.stickies.map(st => selectedStickyIds.has(st.id) ? { ...st, color } : st),
      texts: prev.texts.map(t => selectedTextIds.has(t.id) ? { ...t, color } : t)
    }));
  }, [selectedElements, setProject]);

  // Bring Forward / Send Backward
  const handleBringForward = useCallback(() => {
    if (selectedElements.length === 0) return;
    onRecordHistory();
    const selectedIds = new Set(selectedElements.map(s => s.id));

    setProject(prev => {
      const remainingShapes = prev.shapes.filter(s => !selectedIds.has(s.id));
      const targetShapes = prev.shapes.filter(s => selectedIds.has(s.id));
      const remainingImages = prev.images.filter(i => !selectedIds.has(i.id));
      const targetImages = prev.images.filter(i => selectedIds.has(i.id));

      return {
        ...prev,
        shapes: [...remainingShapes, ...targetShapes],
        images: [...remainingImages, ...targetImages]
      };
    });
  }, [selectedElements, onRecordHistory, setProject]);

  const handleSendBackward = useCallback(() => {
    if (selectedElements.length === 0) return;
    onRecordHistory();
    const selectedIds = new Set(selectedElements.map(s => s.id));

    setProject(prev => {
      const remainingShapes = prev.shapes.filter(s => !selectedIds.has(s.id));
      const targetShapes = prev.shapes.filter(s => selectedIds.has(s.id));
      const remainingImages = prev.images.filter(i => !selectedIds.has(i.id));
      const targetImages = prev.images.filter(i => selectedIds.has(i.id));

      return {
        ...prev,
        shapes: [...targetShapes, ...remainingShapes],
        images: [...targetImages, ...remainingImages]
      };
    });
  }, [selectedElements, onRecordHistory, setProject]);

  // Toggle Lock
  const handleToggleSelectedLock = useCallback(() => {
    if (selectedElements.length === 0) return;
    const imageIds = new Set(selectedElements.filter(s => s.type === 'image').map(s => s.id));
    if (imageIds.size === 0) return;

    setProject(prev => ({
      ...prev,
      images: prev.images.map(img => imageIds.has(img.id) ? { ...img, locked: !img.locked } : img)
    }));
  }, [selectedElements, setProject]);

  // Select All Canvas Objects (Ctrl+A)
  const handleSelectAll = useCallback(() => {
    const visibleLayerIds = new Set((project.layers || []).filter(l => l.visible).map(l => l.id));
    const items: Array<{ type: 'image' | 'sticky' | 'text' | 'shape' | 'annotation'; id: string }> = [
      ...(project.shapes || []).filter(s => visibleLayerIds.has(s.layerId)).map(s => ({ type: 'shape' as const, id: s.id })),
      ...(project.images || []).filter(i => visibleLayerIds.has(i.layerId) && !i.locked).map(i => ({ type: 'image' as const, id: i.id })),
      ...(project.stickies || []).filter(st => visibleLayerIds.has(st.layerId)).map(st => ({ type: 'sticky' as const, id: st.id })),
      ...(project.texts || []).filter(t => visibleLayerIds.has(t.layerId)).map(t => ({ type: 'text' as const, id: t.id }))
    ];
    setSelectedElements(items);
    showToast('save_version', `Selected all ${items.length} canvas objects`);
  }, [project, showToast]);

  // Extract all unique project tags
  const allProjectTags = useMemo(() => {
    const tagSet = new Set<string>();
    (project.images || []).forEach(img => img.tags?.forEach(t => tagSet.add(t.toLowerCase().replace(/^#/, ''))));
    (project.stickies || []).forEach(st => {
      st.tags?.forEach(t => tagSet.add(t.toLowerCase().replace(/^#/, '')));
      const matches = st.text?.match(/#[a-zA-Z0-9_\-]+/g);
      if (matches) matches.forEach(m => tagSet.add(m.substring(1).toLowerCase()));
    });
    (project.texts || []).forEach(txt => txt.tags?.forEach(t => tagSet.add(t.toLowerCase().replace(/^#/, ''))));
    (project.shapes || []).forEach(sh => sh.tags?.forEach(t => tagSet.add(t.toLowerCase().replace(/^#/, ''))));
    (project.annotations || []).forEach(an => an.tags?.forEach(t => tagSet.add(t.toLowerCase().replace(/^#/, ''))));
    return Array.from(tagSet);
  }, [project.images, project.stickies, project.texts, project.shapes, project.annotations]);

  // Compute active tags on current selection
  const currentSelectionTags = useMemo(() => {
    if (selectedElements.length === 0) return [];
    const tagsSet = new Set<string>();
    for (const item of selectedElements) {
      if (item.type === 'image') {
        const img = project.images.find(i => i.id === item.id);
        img?.tags?.forEach(t => tagsSet.add(t.toLowerCase().replace(/^#/, '')));
      } else if (item.type === 'sticky') {
        const st = project.stickies.find(s => s.id === item.id);
        st?.tags?.forEach(t => tagsSet.add(t.toLowerCase().replace(/^#/, '')));
        const matches = st?.text?.match(/#[a-zA-Z0-9_\-]+/g);
        if (matches) matches.forEach(m => tagsSet.add(m.substring(1).toLowerCase()));
      } else if (item.type === 'text') {
        const txt = project.texts.find(t => t.id === item.id);
        txt?.tags?.forEach(t => tagsSet.add(t.toLowerCase().replace(/^#/, '')));
      } else if (item.type === 'shape') {
        const sh = project.shapes.find(s => s.id === item.id);
        sh?.tags?.forEach(t => tagsSet.add(t.toLowerCase().replace(/^#/, '')));
      } else if (item.type === 'annotation') {
        const an = project.annotations.find(a => a.id === item.id);
        an?.tags?.forEach(t => tagsSet.add(t.toLowerCase().replace(/^#/, '')));
      }
    }
    return Array.from(tagsSet);
  }, [selectedElements, project]);

  // Add Tag to Selected Elements
  const handleAddSelectedTag = useCallback((rawTag: string) => {
    if (selectedElements.length === 0) return;
    const cleanTag = rawTag.trim().toLowerCase().replace(/^#/, '');
    if (!cleanTag) return;

    onRecordHistory();
    const selectedImageIds = new Set(selectedElements.filter(s => s.type === 'image').map(s => s.id));
    const selectedStickyIds = new Set(selectedElements.filter(s => s.type === 'sticky').map(s => s.id));
    const selectedTextIds = new Set(selectedElements.filter(s => s.type === 'text').map(s => s.id));
    const selectedShapeIds = new Set(selectedElements.filter(s => s.type === 'shape').map(s => s.id));
    const selectedAnnoIds = new Set(selectedElements.filter(s => s.type === 'annotation').map(s => s.id));

    setProject(prev => ({
      ...prev,
      images: prev.images.map(img => {
        if (!selectedImageIds.has(img.id)) return img;
        const current = img.tags || [];
        if (current.map(t => t.toLowerCase().replace(/^#/, '')).includes(cleanTag)) return img;
        return { ...img, tags: [...current, cleanTag] };
      }),
      stickies: prev.stickies.map(st => {
        if (!selectedStickyIds.has(st.id)) return st;
        const current = st.tags || [];
        if (current.map(t => t.toLowerCase().replace(/^#/, '')).includes(cleanTag)) return st;
        return { ...st, tags: [...current, cleanTag] };
      }),
      texts: prev.texts.map(t => {
        if (!selectedTextIds.has(t.id)) return t;
        const current = t.tags || [];
        if (current.map(tg => tg.toLowerCase().replace(/^#/, '')).includes(cleanTag)) return t;
        return { ...t, tags: [...current, cleanTag] };
      }),
      shapes: prev.shapes.map(sh => {
        if (!selectedShapeIds.has(sh.id)) return sh;
        const current = sh.tags || [];
        if (current.map(tg => tg.toLowerCase().replace(/^#/, '')).includes(cleanTag)) return sh;
        return { ...sh, tags: [...current, cleanTag] };
      }),
      annotations: prev.annotations.map(an => {
        if (!selectedAnnoIds.has(an.id)) return an;
        const current = an.tags || [];
        if (current.map(tg => tg.toLowerCase().replace(/^#/, '')).includes(cleanTag)) return an;
        return { ...an, tags: [...current, cleanTag] };
      })
    }));

    showToast('save_version', `Tagged #${cleanTag}`);
  }, [selectedElements, onRecordHistory, setProject, showToast]);

  // Remove Tag from Selected Elements
  const handleRemoveSelectedTag = useCallback((rawTag: string) => {
    if (selectedElements.length === 0) return;
    const cleanTag = rawTag.trim().toLowerCase().replace(/^#/, '');

    onRecordHistory();
    const selectedImageIds = new Set(selectedElements.filter(s => s.type === 'image').map(s => s.id));
    const selectedStickyIds = new Set(selectedElements.filter(s => s.type === 'sticky').map(s => s.id));
    const selectedTextIds = new Set(selectedElements.filter(s => s.type === 'text').map(s => s.id));
    const selectedShapeIds = new Set(selectedElements.filter(s => s.type === 'shape').map(s => s.id));
    const selectedAnnoIds = new Set(selectedElements.filter(s => s.type === 'annotation').map(s => s.id));

    setProject(prev => ({
      ...prev,
      images: prev.images.map(img => {
        if (!selectedImageIds.has(img.id)) return img;
        return { ...img, tags: (img.tags || []).filter(t => t.toLowerCase().replace(/^#/, '') !== cleanTag) };
      }),
      stickies: prev.stickies.map(st => {
        if (!selectedStickyIds.has(st.id)) return st;
        const regex = new RegExp(`(^|\\s)#${cleanTag}\\b`, 'gi');
        const updatedText = st.text ? st.text.replace(regex, '$1').trim() : '';
        return { 
          ...st, 
          text: updatedText,
          tags: (st.tags || []).filter(t => t.toLowerCase().replace(/^#/, '') !== cleanTag) 
        };
      }),
      texts: prev.texts.map(t => {
        if (!selectedTextIds.has(t.id)) return t;
        return { ...t, tags: (t.tags || []).filter(tg => tg.toLowerCase().replace(/^#/, '') !== cleanTag) };
      }),
      shapes: prev.shapes.map(sh => {
        if (!selectedShapeIds.has(sh.id)) return sh;
        return { ...sh, tags: (sh.tags || []).filter(tg => tg.toLowerCase().replace(/^#/, '') !== cleanTag) };
      }),
      annotations: prev.annotations.map(an => {
        if (!selectedAnnoIds.has(an.id)) return an;
        return { ...an, tags: (an.tags || []).filter(tg => tg.toLowerCase().replace(/^#/, '') !== cleanTag) };
      })
    }));

    showToast('undo', `Removed #${cleanTag}`);
  }, [selectedElements, onRecordHistory, setProject, showToast]);

  // Clear All Tags from Selected Elements
  const handleClearSelectedTags = useCallback(() => {
    if (selectedElements.length === 0) return;
    onRecordHistory();
    const selectedImageIds = new Set(selectedElements.filter(s => s.type === 'image').map(s => s.id));
    const selectedStickyIds = new Set(selectedElements.filter(s => s.type === 'sticky').map(s => s.id));
    const selectedTextIds = new Set(selectedElements.filter(s => s.type === 'text').map(s => s.id));
    const selectedShapeIds = new Set(selectedElements.filter(s => s.type === 'shape').map(s => s.id));
    const selectedAnnoIds = new Set(selectedElements.filter(s => s.type === 'annotation').map(s => s.id));

    setProject(prev => ({
      ...prev,
      images: prev.images.map(img => selectedImageIds.has(img.id) ? { ...img, tags: [] } : img),
      stickies: prev.stickies.map(st => selectedStickyIds.has(st.id) ? { ...st, tags: [] } : st),
      texts: prev.texts.map(t => selectedTextIds.has(t.id) ? { ...t, tags: [] } : t),
      shapes: prev.shapes.map(sh => selectedShapeIds.has(sh.id) ? { ...sh, tags: [] } : sh),
      annotations: prev.annotations.map(an => selectedAnnoIds.has(an.id) ? { ...an, tags: [] } : an)
    }));

    showToast('undo', 'Cleared all tags on selection');
  }, [selectedElements, onRecordHistory, setProject, showToast]);

  // Execute Alignment on Selected Objects (or entire canvas if none selected)
  const handleAlignSelectedElements = useCallback((action: CanvasAlignmentAction, target: 'selection' | 'canvas') => {
    let targets = selectedElements;
    if (targets.length === 0) {
      const visibleLayerIds = new Set((project.layers || []).filter(l => l.visible).map(l => l.id));
      targets = [
        ...(project.shapes || []).filter(s => visibleLayerIds.has(s.layerId)).map(s => ({ type: 'shape' as const, id: s.id })),
        ...(project.images || []).filter(i => visibleLayerIds.has(i.layerId) && !i.locked).map(i => ({ type: 'image' as const, id: i.id })),
        ...(project.stickies || []).filter(st => visibleLayerIds.has(st.layerId)).map(st => ({ type: 'sticky' as const, id: st.id })),
        ...(project.texts || []).filter(t => visibleLayerIds.has(t.layerId)).map(t => ({ type: 'text' as const, id: t.id }))
      ];
    }

    if (targets.length === 0) {
      showToast('undo', 'No canvas objects found to align');
      return;
    }

    onRecordHistory();
    const result = alignCanvasObjects(project, targets, action, {
      canvasCenter: { x: 0, y: 0 },
      gridSize: project.canvasSettings?.gridSize || 20,
      alignTo: target
    });

    setProject(result.updatedProject);
    showToast('save_version', result.feedback);
  }, [selectedElements, project, onRecordHistory, setProject, showToast]);

  // Global delete, duplicate, group, ungroup, align keyboard listener
  useEffect(() => {
    const handleElementKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Group shortcut: Ctrl+G / Cmd+G (without shift)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'g') {
        if (selectedElements.length >= 2) {
          e.preventDefault();
          handleGroupSelectedElements();
          return;
        }
      }

      // Ungroup shortcut: Ctrl+Shift+G / Cmd+Shift+G
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'g') {
        if (selectedElements.length > 0) {
          e.preventDefault();
          handleUngroupSelectedElements();
          return;
        }
      }

      // Alignment shortcuts: Alt + Shift + Arrow / Keys
      if (e.altKey && e.shiftKey && selectedElements.length > 0) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleAlignSelectedElements('align-left', 'selection');
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleAlignSelectedElements('align-right', 'selection');
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          handleAlignSelectedElements('align-top', 'selection');
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          handleAlignSelectedElements('align-bottom', 'selection');
          return;
        }
        if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          handleAlignSelectedElements('align-center-h', 'selection');
          return;
        }
        if (e.key.toLowerCase() === 'v') {
          e.preventDefault();
          handleAlignSelectedElements('align-center-v', 'selection');
          return;
        }
        if (e.key.toLowerCase() === 'c' || e.key === '0') {
          e.preventDefault();
          handleAlignSelectedElements('center-canvas-both', 'canvas');
          return;
        }
      }

      // Select All: Ctrl+A / Cmd+A
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      if (selectedElements.length > 0) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          handleDeleteSelectedElements();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setSelectedElements([]);
          setContextMenu(null);
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          handleDuplicateSelectedElements();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleElementKeyDown);
    return () => window.removeEventListener('keydown', handleElementKeyDown);
  }, [
    selectedElements, 
    handleDeleteSelectedElements, 
    handleDuplicateSelectedElements, 
    handleGroupSelectedElements, 
    handleUngroupSelectedElements, 
    handleSelectAll
  ]);

  // Real-time Stroke & Shape Eraser helper
  const eraseStrokesAtCoords = useCallback((cx: number, cy: number) => {
    const eraseRadius = Math.max(12, strokeSize);
    const visibleLayerIds = new Set((project.layers || []).filter(l => l.visible).map(l => l.id));

    let erasedCount = 0;
    const remainingStrokes = (project.strokes || []).filter(stroke => {
      if (!visibleLayerIds.has(stroke.layerId)) return true;
      for (const pt of stroke.points) {
        const dx = pt.x - cx;
        const dy = pt.y - cy;
        if (dx * dx + dy * dy <= (eraseRadius + (stroke.size || 4) / 2) ** 2) {
          erasedCount++;
          return false;
        }
      }
      return true;
    });

    const remainingShapes = (project.shapes || []).filter(shape => {
      if (!visibleLayerIds.has(shape.layerId)) return true;
      const minX = Math.min(shape.x, shape.x + shape.width) - eraseRadius;
      const maxX = Math.max(shape.x, shape.x + shape.width) + eraseRadius;
      const minY = Math.min(shape.y, shape.y + shape.height) - eraseRadius;
      const maxY = Math.max(shape.y, shape.y + shape.height) + eraseRadius;
      if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY) {
        erasedCount++;
        return false;
      }
      return true;
    });

    if (erasedCount > 0) {
      if (!hasRecordedEraserHistoryRef.current) {
        onRecordHistory();
        hasRecordedEraserHistoryRef.current = true;
      }
      setProject(prev => ({
        ...prev,
        strokes: remainingStrokes,
        shapes: remainingShapes
      }));
    }
  }, [strokeSize, project, onRecordHistory, setProject]);

  // Pinch touch state
  const touchDistanceRef = useRef<number | null>(null);

  // Screen to Canvas Coordinates helper
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const canvasX = (screenX - pan.x) / zoom;
    const canvasY = (screenY - pan.y) / zoom;
    return { x: canvasX, y: canvasY };
  }, [pan, zoom]);

  // Main Canvas Render Loop
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Apply Pan & Zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Render Grid / Pattern / Guide Overlays
    renderCanvasGrid({
      ctx,
      settings: project.canvasSettings,
      viewportWidth: width,
      viewportHeight: height,
      pan,
      zoom,
      theme,
      snapIndicatorPoint: activeSnapPoint
    });

    // Get visible layers
    const visibleLayerIds = new Set(
      (project.layers || []).filter(l => l.visible).map(l => l.id)
    );

    // Render Completed Strokes
    (project.strokes || []).forEach(stroke => {
      if (!visibleLayerIds.has(stroke.layerId)) return;
      drawSingleStroke(ctx, stroke);
    });

    // Render In-Progress Stroke
    if (currentStroke) {
      drawSingleStroke(ctx, currentStroke);
    }

    // Render In-Progress Shape Preview
    if (currentShapePreview) {
      drawSingleShape(ctx, currentShapePreview);
    }

    // Render Shapes
    project.shapes.forEach(shape => {
      if (!visibleLayerIds.has(shape.layerId)) return;
      drawSingleShape(ctx, shape);

      // Render selection outline if selected
      if (selectedElement && selectedElement.type === 'shape' && selectedElement.id === shape.id) {
        ctx.save();
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = Math.max(1, 1.5 / zoom);
        ctx.setLineDash([4 / zoom, 4 / zoom]);
        const pad = 4 / zoom;
        const minX = Math.min(shape.x, shape.x + shape.width);
        const minY = Math.min(shape.y, shape.y + shape.height);
        const w = Math.abs(shape.width);
        const h = Math.abs(shape.height);
        ctx.strokeRect(minX - pad, minY - pad, w + pad * 2, h + pad * 2);
        
        // Corner handles
        ctx.fillStyle = '#06B6D4';
        const handleSize = 6 / zoom;
        ctx.fillRect(minX - pad - handleSize / 2, minY - pad - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(minX + w + pad - handleSize / 2, minY - pad - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(minX - pad - handleSize / 2, minY + h + pad - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(minX + w + pad - handleSize / 2, minY + h + pad - handleSize / 2, handleSize, handleSize);
        ctx.restore();
      }

      // Render glowing highlight ring if focused in search
      if (highlightedId && highlightedId === shape.id) {
        ctx.save();
        ctx.strokeStyle = '#22D3EE';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.shadowColor = '#06B6D4';
        ctx.shadowBlur = 15;
        const pad = 6;
        ctx.strokeRect(shape.x - pad, shape.y - pad, shape.width + pad * 2, shape.height + pad * 2);
        ctx.restore();
      }
    });

    // Render Activity Heatmap Layer
    if (heatmapSettings?.enabled) {
      renderActivityHeatmap({
        ctx,
        project,
        settings: heatmapSettings,
        activeLayerId,
        pan,
        zoom,
        viewportWidth: width,
        viewportHeight: height
      });
    }

    // Render Real-time Stroke Stabilization Tether & Dynamic Inertia Guide
    const currentStabLevel = stabilization !== undefined ? stabilization : (stylusSettings.stabilization ?? ((stylusSettings.smoothing || 4) * 10));
    if (activeTether && isDrawing && currentStabLevel > 0) {
      ctx.save();
      // Elastic guide tether line connecting raw pointer to stabilized anchor
      ctx.beginPath();
      ctx.moveTo(activeTether.anchor.x, activeTether.anchor.y);
      ctx.lineTo(activeTether.cursor.x, activeTether.cursor.y);
      ctx.strokeStyle = theme === 'light' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(244, 63, 94, 0.55)';
      ctx.lineWidth = Math.max(1, 1.5 / zoom);
      ctx.setLineDash([4 / zoom, 3 / zoom]);
      ctx.stroke();

      // Deadzone tether radius aura
      if (activeTether.radius > 2) {
        ctx.beginPath();
        ctx.arc(activeTether.cursor.x, activeTether.cursor.y, activeTether.radius, 0, Math.PI * 2);
        ctx.strokeStyle = theme === 'light' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(244, 63, 94, 0.25)';
        ctx.lineWidth = Math.max(0.75, 1 / zoom);
        ctx.setLineDash([2 / zoom, 2 / zoom]);
        ctx.stroke();
      }

      // Cursor physical tip dot (Red/Rose accent)
      ctx.beginPath();
      ctx.arc(activeTether.cursor.x, activeTether.cursor.y, Math.max(2, 3.5 / zoom), 0, Math.PI * 2);
      ctx.fillStyle = theme === 'light' ? '#EF4444' : '#FB7185';
      ctx.fill();

      // Stabilized line anchor head (Glowing white core)
      ctx.beginPath();
      ctx.arc(activeTether.anchor.x, activeTether.anchor.y, Math.max(1.5, 2.5 / zoom), 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();

    // Render Screen Rulers if enabled
    if (project.canvasSettings.showRulers) {
      renderCanvasRulers({
        ctx,
        viewportWidth: width,
        viewportHeight: height,
        pan,
        zoom,
        gridSize: project.canvasSettings.gridSize || 40,
        theme
      });
    }
  }, [pan, zoom, project.strokes, project.shapes, project.layers, project.canvasSettings, currentStroke, currentShapePreview, theme, highlightedId, heatmapSettings, activeLayerId, activeTether, isDrawing, stabilization, stylusSettings, activeSnapPoint]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle Window Resize
  useEffect(() => {
    const handleResize = () => redrawCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  // Drawing Strokes Logic
  const drawSingleStroke = (ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (stroke.points.length === 0) return;

    // Advanced Brush Preset Engine Rendering
    if (stroke.tool === 'brush' || stroke.customDynamics) {
      const brushToUse = stroke.customDynamics || activeBrushPreset;
      if (brushToUse) {
        renderAdvancedBrushStroke(
          ctx, 
          stroke.points, 
          stroke.color, 
          stroke.size, 
          stroke.opacity, 
          brushToUse, 
          stylusSettings.pressureSensitivity
        );
        return;
      }
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'highlighter') {
      ctx.globalAlpha = 0.35 * stroke.opacity;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * 3;
      ctx.lineCap = 'square';
    } else if (stroke.tool === 'pencil') {
      ctx.globalAlpha = 0.75 * stroke.opacity;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.setLineDash([1, 1]); // Grainy pencil effect
    } else if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = stroke.size * 2;
    } else {
      // Pen
      ctx.globalAlpha = stroke.opacity;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
    }

    const pts = stroke.points;
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke.color;
      ctx.fill();
      ctx.restore();
      return;
    }

    // Smooth Bézier Spline Curves with pressure taper
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      
      // Dynamic pressure width scaling if stylus
      if (pts[i].pressure && pts[i].pressure > 0) {
        const pressureScale = 0.5 + pts[i].pressure * stylusSettings.pressureSensitivity;
        ctx.lineWidth = Math.max(1, stroke.size * pressureScale);
      }
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }

    if (pts.length > 1) {
      const last = pts[pts.length - 1];
      ctx.lineTo(last.x, last.y);
    }

    ctx.stroke();
    ctx.restore();
  };

  const drawSingleShape = (ctx: CanvasRenderingContext2D, shape: CanvasShape) => {
    ctx.save();
    ctx.strokeStyle = shape.strokeColor;
    ctx.lineWidth = shape.strokeWidth;
    ctx.fillStyle = shape.fillColor;

    const { x, y, width, height } = shape;

    if (shape.shapeType === 'rectangle') {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 8);
      if (shape.fillColor !== 'transparent') ctx.fill();
      ctx.stroke();
    } else if (shape.shapeType === 'circle') {
      ctx.beginPath();
      const rx = Math.abs(width / 2);
      const ry = Math.abs(height / 2);
      const cx = x + width / 2;
      const cy = y + height / 2;
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      if (shape.fillColor !== 'transparent') ctx.fill();
      ctx.stroke();
    } else if (shape.shapeType === 'line') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y + height);
      ctx.stroke();
    } else if (shape.shapeType === 'arrow') {
      const headlen = 15;
      const tox = x + width;
      const toy = y + height;
      const angle = Math.atan2(toy - y, tox - x);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(tox, toy);
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(tox, toy);
      ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = shape.strokeColor;
      ctx.fill();
    } else if (shape.shapeType === 'frame') {
      // Artboard frame with dashed border and header tag
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
      ctx.fillStyle = shape.strokeColor;
      ctx.font = '12px Outfit, sans-serif';
      ctx.fillText('Frame: Composition Box', x + 6, y - 6);
    }

    ctx.restore();
  };

  // Select & Start Multi-Drag Helper
  const handleSelectAndStartDrag = useCallback((
    e: React.PointerEvent,
    item: { type: 'image' | 'sticky' | 'text' | 'shape' | 'annotation'; id: string },
    rawCoords: { x: number; y: number }
  ) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();

    const isModifier = e.shiftKey || e.metaKey || e.ctrlKey;
    const isAlreadySelected = selectedElements.some(s => s.type === item.type && s.id === item.id);

    let nextSelected = [...selectedElements];
    if (isModifier) {
      if (isAlreadySelected) {
        nextSelected = nextSelected.filter(s => !(s.type === item.type && s.id === item.id));
      } else {
        nextSelected = expandWithGroups([...nextSelected, item]);
      }
    } else {
      if (!isAlreadySelected) {
        nextSelected = expandWithGroups([item]);
      }
    }
    setSelectedElements(nextSelected);

    // Capture start coords and initial positions for all elements in nextSelected
    dragStartCoordsRef.current = { x: rawCoords.x, y: rawCoords.y };
    initialItemPositionsRef.current.clear();

    for (const sel of nextSelected) {
      const key = `${sel.type}-${sel.id}`;
      if (sel.type === 'shape') {
        const s = project.shapes.find(sh => sh.id === sel.id);
        if (s) initialItemPositionsRef.current.set(key, { x: s.x, y: s.y });
      } else if (sel.type === 'image') {
        const img = project.images.find(i => i.id === sel.id);
        if (img && !img.locked) initialItemPositionsRef.current.set(key, { x: img.x, y: img.y });
      } else if (sel.type === 'sticky') {
        const st = project.stickies.find(s => s.id === sel.id);
        if (st) initialItemPositionsRef.current.set(key, { x: st.x, y: st.y });
      } else if (sel.type === 'text') {
        const t = project.texts.find(txt => txt.id === sel.id);
        if (t) initialItemPositionsRef.current.set(key, { x: t.x, y: t.y });
      } else if (sel.type === 'annotation') {
        const a = project.annotations.find(an => an.id === sel.id);
        if (a) initialItemPositionsRef.current.set(key, { x: a.x, y: a.y });
      }
    }

    // Compute bounding box for smart guide snapping
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const sel of nextSelected) {
      const b = getItemBounds(project, sel);
      if (b) {
        minX = Math.min(minX, b.x);
        minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.right);
        maxY = Math.max(maxY, b.bottom);
      }
    }
    if (minX !== Infinity) {
      initialSelectionBoundsRef.current = {
        x: minX,
        y: minY,
        width: Math.max(10, maxX - minX),
        height: Math.max(10, maxY - minY)
      };
    } else {
      initialSelectionBoundsRef.current = null;
    }
  }, [activeTool, selectedElements, expandWithGroups, project]);

  // Start Resizing from Selection Frame Handles
  const handleStartResize = useCallback((
    e: React.PointerEvent,
    handle: ResizeHandlePosition
  ) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    e.preventDefault();

    if (!selectionBounds) return;

    const initialItems = new Map<string, any>();
    for (const sel of selectedElements) {
      if (sel.type === 'shape') {
        const s = project.shapes.find(sh => sh.id === sel.id);
        if (s) initialItems.set(`shape-${s.id}`, { ...s });
      } else if (sel.type === 'image') {
        const img = project.images.find(i => i.id === sel.id);
        if (img && !img.locked) initialItems.set(`image-${img.id}`, { ...img });
      } else if (sel.type === 'sticky') {
        const st = project.stickies.find(s => s.id === sel.id);
        if (st) initialItems.set(`sticky-${st.id}`, { ...st });
      } else if (sel.type === 'text') {
        const t = project.texts.find(txt => txt.id === sel.id);
        if (t) initialItems.set(`text-${t.id}`, { ...t });
      }
    }

    resizingStateRef.current = {
      handle,
      initialBounds: {
        x: selectionBounds.x,
        y: selectionBounds.y,
        width: selectionBounds.width,
        height: selectionBounds.height
      },
      initialItems
    };
  }, [activeTool, selectionBounds, selectedElements, project]);

  // Pointer Down (Stylus, Touch, Mouse)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Check Palm Rejection: If enabled and input is touch, don't draw (only pan)
    const isStylus = e.pointerType === 'pen';
    const isTouch = e.pointerType === 'touch';

    if (stylusSettings.palmRejection && isTouch && activeTool !== 'hand') {
      // Touch palm rejection: let touch act as pan instead
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Spacebar or Hand tool or Middle click => Pan
    if (activeTool === 'hand' || e.button === 1 || e.buttons === 4) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const rawCoords = getCanvasCoords(e.clientX, e.clientY);
    const snapResult = snapPointToGrid(rawCoords, project.canvasSettings);
    const x = snapResult.x;
    const y = snapResult.y;
    const pressure = isStylus ? (e.pressure || 0.5) : 0.6;

    if (snapResult.didSnap) {
      setActiveSnapPoint(snapResult);
    }

    // Dismiss context menu if open
    if (contextMenu) {
      setContextMenu(null);
    }

    // Select Tool Hit Testing & Marquee initiation
    if (activeTool === 'select') {
      const visibleLayerIds = new Set((project.layers || []).filter(l => l.visible).map(l => l.id));
      const clickedShape = [...(project.shapes || [])].reverse().find(shape => {
        if (!visibleLayerIds.has(shape.layerId)) return false;
        const minX = Math.min(shape.x, shape.x + shape.width);
        const maxX = Math.max(shape.x, shape.x + shape.width);
        const minY = Math.min(shape.y, shape.y + shape.height);
        const maxY = Math.max(shape.y, shape.y + shape.height);
        return rawCoords.x >= minX && rawCoords.x <= maxX && rawCoords.y >= minY && rawCoords.y <= maxY;
      });

      if (clickedShape) {
        handleSelectAndStartDrag(e, { type: 'shape', id: clickedShape.id }, rawCoords);
        return;
      }

      // If clicked on canvas without modifier keys, clear selection and start Marquee Box
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        setSelectedElements([]);
      }
      setMarqueeBox({
        startX: rawCoords.x,
        startY: rawCoords.y,
        currentX: rawCoords.x,
        currentY: rawCoords.y
      });
      return;
    }

    // Stroke-Level Eraser Tool
    if (activeTool === 'eraser' && eraserMode === 'stroke') {
      setIsDrawing(true);
      hasRecordedEraserHistoryRef.current = false;
      eraseStrokesAtCoords(rawCoords.x, rawCoords.y);
      return;
    }

    // Eyedropper Tool
    if (activeTool === 'eyedropper') {
      sampleColorAtPoint(e.clientX, e.clientY);
      return;
    }

    // Sticky Note Creation
    if (activeTool === 'sticky') {
      onRecordHistory();
      const newSticky: CanvasSticky = {
        id: `sticky-${Date.now()}`,
        text: 'New creative note...',
        x,
        y,
        width: 180,
        height: 120,
        color: '#FEF08A',
        rotation: 0,
        author: 'Artist',
        layerId: activeLayerId,
        createdAt: Date.now()
      };
      setProject(prev => ({
        ...prev,
        stickies: [...prev.stickies, newSticky]
      }));
      return;
    }

    // Text Creation
    if (activeTool === 'text') {
      onRecordHistory();
      const newText: CanvasText = {
        id: `txt-${Date.now()}`,
        text: 'Type concept text...',
        x,
        y,
        fontSize: 20,
        fontFamily: 'Outfit',
        color: activeColor,
        rotation: 0,
        layerId: activeLayerId
      };
      setProject(prev => ({
        ...prev,
        texts: [...prev.texts, newText]
      }));
      return;
    }

    // Annotation Pin Creation
    if (activeTool === 'annotation') {
      onRecordHistory();
      const newAnno: CanvasAnnotation = {
        id: `anno-${Date.now()}`,
        x,
        y,
        title: 'Review Annotation',
        author: 'Team Reviewer',
        color: '#EF4444',
        status: 'open',
        layerId: activeLayerId,
        createdAt: new Date().toISOString(),
        comments: [
          {
            id: `c-${Date.now()}`,
            author: 'Team Reviewer',
            text: 'Please check lighting and gesture balance here.',
            createdAt: 'Just now'
          }
        ]
      };
      setProject(prev => ({
        ...prev,
        annotations: [...prev.annotations, newAnno]
      }));
      onOpenAnnotation(newAnno);
      return;
    }

    // Shapes Tool
    if (activeTool === 'shape') {
      setShapeStart({ x, y });
      setCurrentShapePreview({
        id: `shp-${Date.now()}`,
        shapeType: selectedShapeType,
        x,
        y,
        width: 0,
        height: 0,
        strokeColor: activeColor,
        fillColor: 'transparent',
        strokeWidth: strokeSize,
        rotation: 0,
        layerId: activeLayerId
      });
      return;
    }

    // Drawing Tools (Pen, Brush, Pencil, Highlighter, Eraser)
    if (['pen', 'brush', 'pencil', 'highlighter', 'eraser'].includes(activeTool)) {
      onRecordHistory();
      setIsDrawing(true);

      const effectiveStabilization = stabilization !== undefined 
        ? stabilization 
        : (stylusSettings.stabilization ?? ((stylusSettings.smoothing || 4) * 10));

      const initialPoint = stabilizerRef.current.beginStroke({ x: rawCoords.x, y: rawCoords.y, pressure }, effectiveStabilization);
      setActiveTether(null);

      const newStroke: DrawingStroke = {
        id: `strk-${Date.now()}`,
        tool: activeTool as any,
        points: [initialPoint],
        color: activeColor,
        size: strokeSize,
        opacity: activeOpacity,
        layerId: activeLayerId,
        createdAt: Date.now(),
        ...(activeTool === 'brush' && activeBrushPreset ? { customDynamics: activeBrushPreset } : {})
      };
      setCurrentStroke(newStroke);
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    const rawCoords = getCanvasCoords(e.clientX, e.clientY);
    const snapResult = snapPointToGrid(rawCoords, project.canvasSettings);
    const x = snapResult.x;
    const y = snapResult.y;
    const isStylus = e.pointerType === 'pen';
    const pressure = isStylus ? (e.pressure || 0.5) : 0.6;
    const isSmartGuidesEnabled = project.canvasSettings?.enableSmartGuides !== false;

    // Resizing selection with Smart Dynamic Guides
    if (resizingStateRef.current && selectedElements.length > 0) {
      const { handle, initialBounds, initialItems } = resizingStateRef.current;
      const selectedIds = new Set<string>(selectedElements.map(s => s.id));
      const candidates = getCandidateTargets(project, selectedIds);

      let newX = initialBounds.x;
      let newY = initialBounds.y;
      let newWidth = initialBounds.width;
      let newHeight = initialBounds.height;

      if (isSmartGuidesEnabled) {
        const resizeSnap = computeSmartGuidesOnResize(initialBounds, rawCoords, handle, candidates, {
          zoom,
          minDimension: 20
        });
        const snapToGuides = project.canvasSettings?.snapToGuides !== false;
        if (snapToGuides) {
          newX = resizeSnap.snappedX;
          newY = resizeSnap.snappedY;
          newWidth = resizeSnap.snappedWidth;
          newHeight = resizeSnap.snappedHeight;
        }
        setActiveSmartGuides(resizeSnap.guides);

        if (resizeSnap.hasSnapped) {
          const snapKey = resizeSnap.guides.map(g => g.id).join('|');
          if (snapKey !== lastSnapKeyRef.current) {
            lastSnapKeyRef.current = snapKey;
            if (project.canvasSettings?.enableHapticFeedback !== false) {
              hapticEngine.triggerSnapHaptic(snapKey, { intensity: 'light' });
            }
          }
        } else {
          lastSnapKeyRef.current = '';
        }
      } else {
        if (['e', 'ne', 'se'].includes(handle)) {
          newWidth = Math.max(20, rawCoords.x - initialBounds.x);
        } else if (['w', 'nw', 'sw'].includes(handle)) {
          const right = initialBounds.x + initialBounds.width;
          newWidth = Math.max(20, right - rawCoords.x);
          newX = right - newWidth;
        }
        if (['s', 'se', 'sw'].includes(handle)) {
          newHeight = Math.max(20, rawCoords.y - initialBounds.y);
        } else if (['n', 'ne', 'nw'].includes(handle)) {
          const bottom = initialBounds.y + initialBounds.height;
          newHeight = Math.max(20, bottom - rawCoords.y);
          newY = bottom - newHeight;
        }
        setActiveSmartGuides([]);
      }

      const scaleX = newWidth / Math.max(1, initialBounds.width);
      const scaleY = newHeight / Math.max(1, initialBounds.height);

      setProject(prev => {
        const nextShapes = prev.shapes.map(s => {
          const init = initialItems.get(`shape-${s.id}`);
          if (!init) return s;
          if (selectedElements.length === 1 && selectedElements[0].type === 'shape') {
            return { ...s, x: newX, y: newY, width: newWidth, height: newHeight };
          }
          const relX = (init.x - initialBounds.x) * scaleX;
          const relY = (init.y - initialBounds.y) * scaleY;
          return {
            ...s,
            x: newX + relX,
            y: newY + relY,
            width: Math.max(10, init.width * scaleX),
            height: Math.max(10, init.height * scaleY)
          };
        });

        const nextImages = prev.images.map(img => {
          const init = initialItems.get(`image-${img.id}`);
          if (!init || img.locked) return img;
          if (selectedElements.length === 1 && selectedElements[0].type === 'image') {
            return { ...img, x: newX, y: newY, width: newWidth, height: newHeight };
          }
          const relX = (init.x - initialBounds.x) * scaleX;
          const relY = (init.y - initialBounds.y) * scaleY;
          return {
            ...img,
            x: newX + relX,
            y: newY + relY,
            width: Math.max(20, init.width * scaleX),
            height: Math.max(20, init.height * scaleY)
          };
        });

        const nextStickies = prev.stickies.map(st => {
          const init = initialItems.get(`sticky-${st.id}`);
          if (!init) return st;
          if (selectedElements.length === 1 && selectedElements[0].type === 'sticky') {
            return { ...st, x: newX, y: newY, width: newWidth, height: newHeight };
          }
          const relX = (init.x - initialBounds.x) * scaleX;
          const relY = (init.y - initialBounds.y) * scaleY;
          return {
            ...st,
            x: newX + relX,
            y: newY + relY,
            width: Math.max(60, init.width * scaleX),
            height: Math.max(40, init.height * scaleY)
          };
        });

        const nextTexts = prev.texts.map(t => {
          const init = initialItems.get(`text-${t.id}`);
          if (!init) return t;
          const relX = (init.x - initialBounds.x) * scaleX;
          const relY = (init.y - initialBounds.y) * scaleY;
          return {
            ...t,
            x: newX + relX,
            y: newY + relY
          };
        });

        return {
          ...prev,
          shapes: nextShapes,
          images: nextImages,
          stickies: nextStickies,
          texts: nextTexts
        };
      });
      return;
    }

    // Moving multiple selected elements or groups (Drag & Drop) with Smart Dynamic Guides
    if (dragStartCoordsRef.current && selectedElements.length > 0 && initialItemPositionsRef.current.size > 0) {
      const rawDx = rawCoords.x - dragStartCoordsRef.current.x;
      const rawDy = rawCoords.y - dragStartCoordsRef.current.y;

      let dx = rawDx;
      let dy = rawDy;

      if (isSmartGuidesEnabled && initialSelectionBoundsRef.current) {
        const movingBox = {
          x: initialSelectionBoundsRef.current.x + rawDx,
          y: initialSelectionBoundsRef.current.y + rawDy,
          width: initialSelectionBoundsRef.current.width,
          height: initialSelectionBoundsRef.current.height
        };

        const selectedIds = new Set<string>(selectedElements.map(s => s.id));
        const candidates = getCandidateTargets(project, selectedIds);
        const guideSnap = computeSmartGuidesOnMove(movingBox, candidates, {
          zoom,
          snapThreshold: project.canvasSettings?.snapThreshold ?? 10,
          includeOrigin: project.canvasSettings?.showOriginAxis ?? true,
          detectGaps: true
        });

        const snapToGuides = project.canvasSettings?.snapToGuides !== false;
        if (snapToGuides) {
          dx = rawDx + guideSnap.dx;
          dy = rawDy + guideSnap.dy;
        }

        setActiveSmartGuides(guideSnap.guides);

        // Tactile vibration & acoustic micro-tick on snap lock
        if (guideSnap.hasSnapped) {
          const snapKey = guideSnap.snappedGuideIds.join('|') || `${Math.round(guideSnap.snappedX)},${Math.round(guideSnap.snappedY)}`;
          if (snapKey !== lastSnapKeyRef.current) {
            lastSnapKeyRef.current = snapKey;
            if (project.canvasSettings?.enableHapticFeedback !== false) {
              hapticEngine.triggerSnapHaptic(snapKey, {
                intensity: guideSnap.snappedAxes.x && guideSnap.snappedAxes.y ? 'strong' : 'medium',
                enableAudio: true,
                enableVibration: true
              });
            }
          }
        } else {
          lastSnapKeyRef.current = '';
        }
      } else if (project.canvasSettings?.snapToGrid) {
        const targetSnap = snapPointToGrid({ x: rawDx, y: rawDy }, project.canvasSettings);
        dx = targetSnap.x;
        dy = targetSnap.y;
        setActiveSmartGuides([]);
      } else {
        setActiveSmartGuides([]);
      }

      setProject(prev => {
        const nextShapes = prev.shapes.map(s => {
          const init = initialItemPositionsRef.current.get(`shape-${s.id}`);
          return init ? { ...s, x: init.x + dx, y: init.y + dy } : s;
        });
        const nextImages = prev.images.map(img => {
          const init = initialItemPositionsRef.current.get(`image-${img.id}`);
          return (init && !img.locked) ? { ...img, x: init.x + dx, y: init.y + dy } : img;
        });
        const nextStickies = prev.stickies.map(st => {
          const init = initialItemPositionsRef.current.get(`sticky-${st.id}`);
          return init ? { ...st, x: init.x + dx, y: init.y + dy } : st;
        });
        const nextTexts = prev.texts.map(t => {
          const init = initialItemPositionsRef.current.get(`text-${t.id}`);
          return init ? { ...t, x: init.x + dx, y: init.y + dy } : t;
        });
        const nextAnnotations = prev.annotations.map(a => {
          const init = initialItemPositionsRef.current.get(`annotation-${a.id}`);
          return init ? { ...a, x: init.x + dx, y: init.y + dy } : a;
        });

        return {
          ...prev,
          shapes: nextShapes,
          images: nextImages,
          stickies: nextStickies,
          texts: nextTexts,
          annotations: nextAnnotations
        };
      });
      return;
    }

    // Updating Marquee drag box
    if (marqueeBox) {
      setMarqueeBox(prev => prev ? { ...prev, currentX: rawCoords.x, currentY: rawCoords.y } : null);
      return;
    }

    // Erasing strokes in real time
    if (isDrawing && activeTool === 'eraser' && eraserMode === 'stroke') {
      eraseStrokesAtCoords(rawCoords.x, rawCoords.y);
      return;
    }

    // Updating Shape in progress with Smart Dynamic Guides
    if (shapeStart && currentShapePreview) {
      let targetX = x;
      let targetY = y;

      if (isSmartGuidesEnabled) {
        const candidates = getCandidateTargets(project, new Set<string>());
        const drawSnap = computeSmartGuidesOnShapeDraw(shapeStart, rawCoords, candidates, { zoom });
        targetX = drawSnap.snappedCurrent.x;
        targetY = drawSnap.snappedCurrent.y;
        setActiveSmartGuides(drawSnap.guides);

        if (drawSnap.hasSnapped) {
          const snapKey = drawSnap.guides.map(g => g.id).join('|');
          if (snapKey !== lastSnapKeyRef.current) {
            lastSnapKeyRef.current = snapKey;
            if (project.canvasSettings?.enableHapticFeedback !== false) {
              hapticEngine.triggerSnapHaptic(snapKey, { intensity: 'light' });
            }
          }
        } else {
          lastSnapKeyRef.current = '';
        }
      } else {
        setActiveSmartGuides([]);
        if (snapResult.didSnap) {
          setActiveSnapPoint(snapResult);
        } else {
          setActiveSnapPoint(null);
        }
      }

      const width = targetX - shapeStart.x;
      const height = targetY - shapeStart.y;
      setCurrentShapePreview(prev => prev ? {
        ...prev,
        x: width < 0 ? targetX : shapeStart.x,
        y: height < 0 ? targetY : shapeStart.y,
        width: Math.abs(width),
        height: Math.abs(height)
      } : null);
      return;
    }

    // Adding stabilized stroke points
    if (isDrawing && currentStroke) {
      const { point, tether } = stabilizerRef.current.addPoint({ x: rawCoords.x, y: rawCoords.y, pressure });
      setActiveTether(tether);

      if (point) {
        setCurrentStroke(prev => {
          if (!prev) return null;
          return {
            ...prev,
            points: [...prev.points, point]
          };
        });
      }
    }
  };

  // Pointer Up
  const handlePointerUp = () => {
    setActiveSnapPoint(null);
    setActiveSmartGuides([]);
    lastSnapKeyRef.current = '';
    hapticEngine.reset();

    if (isPanning) {
      setIsPanning(false);
    }

    if (resizingStateRef.current) {
      if (onRecordHistory) onRecordHistory();
      resizingStateRef.current = null;
    }

    if (dragStartCoordsRef.current) {
      if (onRecordHistory) onRecordHistory();
      dragStartCoordsRef.current = null;
      initialItemPositionsRef.current.clear();
      initialSelectionBoundsRef.current = null;
    }

    // Finalize Marquee Selection Box
    if (marqueeBox) {
      const minX = Math.min(marqueeBox.startX, marqueeBox.currentX);
      const maxX = Math.max(marqueeBox.startX, marqueeBox.currentX);
      const minY = Math.min(marqueeBox.startY, marqueeBox.currentY);
      const maxY = Math.max(marqueeBox.startY, marqueeBox.currentY);

      // Only perform selection if dragged a significant box
      if (maxX - minX > 5 || maxY - minY > 5) {
        const visibleLayerIds = new Set((project.layers || []).filter(l => l.visible).map(l => l.id));
        const enclosedItems: Array<{ type: 'image' | 'sticky' | 'text' | 'shape' | 'annotation'; id: string }> = [];

        // Intersect shapes
        (project.shapes || []).filter(s => visibleLayerIds.has(s.layerId)).forEach(s => {
          const sMinX = Math.min(s.x, s.x + s.width);
          const sMaxX = Math.max(s.x, s.x + s.width);
          const sMinY = Math.min(s.y, s.y + s.height);
          const sMaxY = Math.max(s.y, s.y + s.height);
          if (sMinX < maxX && sMaxX > minX && sMinY < maxY && sMaxY > minY) {
            enclosedItems.push({ type: 'shape', id: s.id });
          }
        });

        // Intersect images
        (project.images || []).filter(i => visibleLayerIds.has(i.layerId) && !i.locked).forEach(i => {
          if (i.x < maxX && (i.x + i.width) > minX && i.y < maxY && (i.y + i.height) > minY) {
            enclosedItems.push({ type: 'image', id: i.id });
          }
        });

        // Intersect stickies
        (project.stickies || []).filter(st => visibleLayerIds.has(st.layerId)).forEach(st => {
          if (st.x < maxX && (st.x + st.width) > minX && st.y < maxY && (st.y + st.height) > minY) {
            enclosedItems.push({ type: 'sticky', id: st.id });
          }
        });

        // Intersect texts
        project.texts.filter(t => visibleLayerIds.has(t.layerId)).forEach(t => {
          if (t.x < maxX && (t.x + 140) > minX && t.y < maxY && (t.y + 35) > minY) {
            enclosedItems.push({ type: 'text', id: t.id });
          }
        });

        const expanded = expandWithGroups(enclosedItems);
        setSelectedElements(expanded);
      }
      setMarqueeBox(null);
    }

    if (activeTool === 'eraser' && eraserMode === 'stroke') {
      setIsDrawing(false);
      hasRecordedEraserHistoryRef.current = false;
      return;
    }

    if (currentShapePreview && shapeStart) {
      if (currentShapePreview.width > 5 || currentShapePreview.height > 5) {
        onRecordHistory();
        setProject(prev => ({
          ...prev,
          shapes: [...prev.shapes, currentShapePreview]
        }));
      }
      setCurrentShapePreview(null);
      setShapeStart(null);
    }

    if (isDrawing && currentStroke) {
      const finalPoints = stabilizerRef.current.finishStroke();
      setActiveTether(null);

      if (finalPoints.length > 0) {
        const finalizedStroke: DrawingStroke = {
          ...currentStroke,
          points: finalPoints
        };
        setProject(prev => ({
          ...prev,
          strokes: [...prev.strokes, finalizedStroke]
        }));
      }
      setIsDrawing(false);
      setCurrentStroke(null);
    }
  };

  // Touch Handlers (Multi-Finger Gesture Recognition & Pinch-to-Zoom)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gestureRecognizerRef.current) {
      gestureRecognizerRef.current.handleTouchStart(e.nativeEvent);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gestureRecognizerRef.current) {
      gestureRecognizerRef.current.handleTouchMove(e.nativeEvent);
    }

    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);

      if (touchDistanceRef.current !== null) {
        const factor = dist / touchDistanceRef.current;
        setZoom(prev => Math.min(Math.max(0.15, prev * factor), 5.0));
      }
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gestureRecognizerRef.current) {
      gestureRecognizerRef.current.handleTouchEnd(e.nativeEvent);
    }
    if (e.touches.length < 2) {
      touchDistanceRef.current = null;
    }
  };

  const handleTouchCancel = () => {
    if (gestureRecognizerRef.current) {
      gestureRecognizerRef.current.handleTouchCancel();
    }
    touchDistanceRef.current = null;
  };

  // Wheel Zoom & Pan
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom with trackpad pinch or mousewheel+ctrl
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom(prev => Math.min(Math.max(0.15, prev * zoomFactor), 5.0));
    } else {
      // Regular Pan
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  // Color Sampler (Eyedropper)
  const sampleColorAtPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const px = Math.floor((clientX - rect.left) * dpr);
    const py = Math.floor((clientY - rect.top) * dpr);
    const pixel = ctx.getImageData(px, py, 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
    onColorPick(hex);
  };

  // Element removal helper
  const deleteSticky = (id: string) => {
    onRecordHistory();
    setProject(prev => ({
      ...prev,
      stickies: prev.stickies.filter(s => s.id !== id)
    }));
  };

  const deleteImage = (id: string) => {
    onRecordHistory();
    setProject(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== id)
    }));
  };

  const toggleImageLock = (id: string) => {
    setProject(prev => ({
      ...prev,
      images: prev.images.map(img => img.id === id ? { ...img, locked: !img.locked } : img)
    }));
  };

  // Right-Click Context Menu Trigger
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rawCoords = getCanvasCoords(e.clientX, e.clientY);
    const visibleLayerIds = new Set((project.layers || []).filter(l => l.visible).map(l => l.id));

    // Hit test to see if right-clicked on an object
    const hitShape = [...(project.shapes || [])].reverse().find(shape => {
      if (!visibleLayerIds.has(shape.layerId)) return false;
      const minX = Math.min(shape.x, shape.x + shape.width);
      const maxX = Math.max(shape.x, shape.x + shape.width);
      const minY = Math.min(shape.y, shape.y + shape.height);
      const maxY = Math.max(shape.y, shape.y + shape.height);
      return rawCoords.x >= minX && rawCoords.x <= maxX && rawCoords.y >= minY && rawCoords.y <= maxY;
    });

    const hitSticky = [...(project.stickies || [])].reverse().find(st => {
      if (!visibleLayerIds.has(st.layerId)) return false;
      return rawCoords.x >= st.x && rawCoords.x <= (st.x + st.width) && rawCoords.y >= st.y && rawCoords.y <= (st.y + st.height);
    });

    const hitImage = [...(project.images || [])].reverse().find(img => {
      if (!visibleLayerIds.has(img.layerId)) return false;
      return rawCoords.x >= img.x && rawCoords.x <= (img.x + img.width) && rawCoords.y >= img.y && rawCoords.y <= (img.y + img.height);
    });

    const hitText = [...(project.texts || [])].reverse().find(txt => {
      if (!visibleLayerIds.has(txt.layerId)) return false;
      return rawCoords.x >= txt.x && rawCoords.x <= (txt.x + 140) && rawCoords.y >= txt.y && rawCoords.y <= (txt.y + 35);
    });

    const hitItem = hitShape 
      ? { type: 'shape' as const, id: hitShape.id }
      : hitSticky
      ? { type: 'sticky' as const, id: hitSticky.id }
      : hitImage
      ? { type: 'image' as const, id: hitImage.id }
      : hitText
      ? { type: 'text' as const, id: hitText.id }
      : null;

    if (hitItem) {
      const isAlreadySelected = selectedElements.some(s => s.type === hitItem.type && s.id === hitItem.id);
      if (!isAlreadySelected) {
        setSelectedElements(expandWithGroups([hitItem]));
      }
    }

    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <div 
      ref={containerRef}
      id="artisplan-infinite-canvas-container"
      className={`relative w-full h-full overflow-hidden select-none cursor-${activeTool === 'hand' || isPanning ? 'grab' : activeTool === 'eyedropper' ? 'crosshair' : 'crosshair'}`}
      style={{
        backgroundColor: theme === 'light' ? '#F4F4F5' : theme === 'oled' ? '#000000' : theme === 'sepia' ? '#FBF0D9' : '#18181B',
        touchAction: 'none'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onWheel={handleWheel}
    >
      {/* Dynamic Gesture HUD Toast Feedback */}
      <GestureToastFeedback
        actionId={toastFeedback.actionId}
        label={toastFeedback.label}
        gestureName={toastFeedback.gestureName}
        visible={toastFeedback.visible}
      />

      {/* Real-time Multi-Finger Gesture Path & Feedback Overlay */}
      <TouchGestureVisualOverlay
        liveState={gestureLiveState}
        settings={effectiveTouchSettings}
        theme={theme}
        onSimulateGesture={(gId) => gestureRecognizerRef.current?.simulateGesture(gId)}
      />

      {/* Floating Selection Action Bar with Group/Ungroup/Transform Controls & Quick Tagging */}
      {selectionBounds && (
        <SelectionActionBar
          elementType={selectionBounds.singleType}
          elementId={selectedElements[0]?.id}
          selectedCount={selectionBounds.selectedCount}
          isGrouped={selectionBounds.isGrouped}
          canGroup={selectionBounds.canGroup}
          canUngroup={selectionBounds.canUngroup}
          x={selectionBounds.x}
          y={selectionBounds.y}
          width={selectionBounds.width}
          height={selectionBounds.height}
          zoom={zoom}
          pan={pan}
          isLocked={selectionBounds.isLocked}
          onGroup={handleGroupSelectedElements}
          onUngroup={handleUngroupSelectedElements}
          onDelete={handleDeleteSelectedElements}
          onDuplicate={handleDuplicateSelectedElements}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onToggleLock={selectionBounds.selectedCount === 1 ? handleToggleSelectedLock : undefined}
          onChangeColor={handleChangeSelectedColor}
          currentColor={selectionBounds.color}
          tags={currentSelectionTags}
          allAvailableTags={allProjectTags}
          onAddTag={handleAddSelectedTag}
          onRemoveTag={handleRemoveSelectedTag}
          onClearTags={handleClearSelectedTags}
          onAlign={handleAlignSelectedElements}
          onClose={() => setSelectedElements([])}
          theme={theme}
        />
      )}

      {/* Context Menu (Right Click) */}
      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedCount={selectionBounds?.selectedCount || 0}
          isGrouped={selectionBounds?.isGrouped || false}
          canGroup={selectionBounds?.canGroup || false}
          canUngroup={selectionBounds?.canUngroup || false}
          isLocked={selectionBounds?.isLocked}
          onGroup={handleGroupSelectedElements}
          onUngroup={handleUngroupSelectedElements}
          onDuplicate={handleDuplicateSelectedElements}
          onDelete={handleDeleteSelectedElements}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onToggleLock={handleToggleSelectedLock}
          onOpenQuickTags={() => {
            // Context menu option for quick tagging
            if (selectedElements.length > 0) {
              // Focus action bar or show toast
              showToast('save_version', 'Use floating "Tags" button to manage metadata');
            }
          }}
          onSelectAll={handleSelectAll}
          onDeselect={() => setSelectedElements([])}
          onAlign={handleAlignSelectedElements}
          onClose={() => setContextMenu(null)}
          theme={theme}
        />
      )}

      {/* Floating Touch Command Palette HUD */}
      {showCommandPalette && (
        <TouchCommandPalette
          focalPoint={paletteFocalPoint}
          activeLayerName={activeLayer.name}
          onExecuteAction={(actionId) => handleActionDispatch(actionId)}
          onOpenGestureSettings={() => {
            if (onOpenGestureSettings) onOpenGestureSettings();
          }}
          onClose={() => setShowCommandPalette(false)}
          theme={theme === 'sepia' ? 'light' : theme}
        />
      )}

      {/* Floating Canvas Grid & Snapping Quick Pill */}
      <div className="absolute top-4 right-4 z-30 pointer-events-auto">
        <GridCanvasPill
          settings={project.canvasSettings}
          onChange={(newSettings) => {
            setProject(prev => ({
              ...prev,
              canvasSettings: newSettings
            }));
          }}
          theme={theme}
        />
      </div>

      {/* Underlying WebGL / Canvas Drawing surface */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Interactive Transformable DOM Layer (Images, Stickies, Text, Annotation Pins, Group Bounding Boxes) */}
      <div 
        className="absolute inset-0 origin-top-left pointer-events-none z-20"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      >
        {/* Dynamic Magnetic Smart Alignment & Center Guidelines Overlay */}
        <SmartGuidesVisualOverlay guides={activeSmartGuides} zoom={zoom} pan={pan} />

        {/* Marquee Drag Selection Rectangle */}
        {marqueeBox && (
          <div 
            className="absolute border border-cyan-400 bg-cyan-400/10 pointer-events-none z-30 rounded-sm"
            style={{
              left: `${Math.min(marqueeBox.startX, marqueeBox.currentX)}px`,
              top: `${Math.min(marqueeBox.startY, marqueeBox.currentY)}px`,
              width: `${Math.abs(marqueeBox.currentX - marqueeBox.startX)}px`,
              height: `${Math.abs(marqueeBox.currentY - marqueeBox.startY)}px`
            }}
          />
        )}

        {/* Multi-Selection & Group Bounding Frame Indicator with Interactive Resize Handles */}
        {selectionBounds && (
          <div 
            className="absolute border-2 border-dashed border-cyan-400/90 pointer-events-none z-30 rounded-xl transition-all"
            style={{
              left: `${selectionBounds.x - 6}px`,
              top: `${selectionBounds.y - 6}px`,
              width: `${selectionBounds.width + 12}px`,
              height: `${selectionBounds.height + 12}px`
            }}
          >
            {/* Header Badge */}
            <div className="absolute -top-7 left-0 px-2 py-0.5 rounded-md bg-cyan-500 text-black font-bold text-[10px] tracking-wide flex items-center gap-1.5 shadow-md whitespace-nowrap">
              {selectionBounds.isGrouped ? (
                <>
                  <Group className="w-3 h-3" />
                  <span>Group ({selectionBounds.selectedCount} objects)</span>
                </>
              ) : selectionBounds.selectedCount > 1 ? (
                <>
                  <Layers className="w-3 h-3" />
                  <span>{selectionBounds.selectedCount} objects selected</span>
                </>
              ) : (
                <span className="capitalize">{selectionBounds.singleType}</span>
              )}
            </div>

            {/* 8 Magnetic Precision Resize Handles */}
            {!selectionBounds.isLocked && activeTool === 'select' && (
              <>
                {/* NW */}
                <div
                  className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-sm shadow-md pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform z-40"
                  onPointerDown={(e) => handleStartResize(e, 'nw')}
                  title="Resize Top-Left"
                />
                {/* N */}
                <div
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-cyan-500 rounded-sm shadow-md pointer-events-auto cursor-ns-resize hover:scale-125 transition-transform z-40"
                  onPointerDown={(e) => handleStartResize(e, 'n')}
                  title="Resize Top"
                />
                {/* NE */}
                <div
                  className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-sm shadow-md pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform z-40"
                  onPointerDown={(e) => handleStartResize(e, 'ne')}
                  title="Resize Top-Right"
                />
                {/* E */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-sm shadow-md pointer-events-auto cursor-ew-resize hover:scale-125 transition-transform z-40"
                  onPointerDown={(e) => handleStartResize(e, 'e')}
                  title="Resize Right"
                />
                {/* SE */}
                <div
                  className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-sm shadow-md pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform z-40"
                  onPointerDown={(e) => handleStartResize(e, 'se')}
                  title="Resize Bottom-Right"
                />
                {/* S */}
                <div
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-cyan-500 rounded-sm shadow-md pointer-events-auto cursor-ns-resize hover:scale-125 transition-transform z-40"
                  onPointerDown={(e) => handleStartResize(e, 's')}
                  title="Resize Bottom"
                />
                {/* SW */}
                <div
                  className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-sm shadow-md pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform z-40"
                  onPointerDown={(e) => handleStartResize(e, 'sw')}
                  title="Resize Bottom-Left"
                />
                {/* W */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-sm shadow-md pointer-events-auto cursor-ew-resize hover:scale-125 transition-transform z-40"
                  onPointerDown={(e) => handleStartResize(e, 'w')}
                  title="Resize Left"
                />
              </>
            )}
          </div>
        )}

        {/* Pinned Reference Images */}
        {project.images.map(img => {
          const isFocused = highlightedId === img.id;
          const isSelected = selectedElements.some(s => s.type === 'image' && s.id === img.id);

          return (
            <div
              key={img.id}
              className={`absolute group pointer-events-auto rounded-xl border transition-all ${
                isFocused || isSelected
                  ? 'border-cyan-400 ring-4 ring-cyan-400/50 shadow-[0_0_30px_rgba(6,182,212,0.6)] scale-[1.01]'
                  : img.locked
                  ? 'border-neutral-700/60 shadow-md'
                  : 'border-neutral-600/80 hover:border-cyan-400 shadow-md'
              }`}
              style={{
                left: `${img.x}px`,
                top: `${img.y}px`,
                width: `${img.width}px`,
                height: `${img.height}px`,
                opacity: img.opacity
              }}
              onPointerDown={(e) => {
                const coords = getCanvasCoords(e.clientX, e.clientY);
                handleSelectAndStartDrag(e, { type: 'image', id: img.id }, coords);
              }}
            >
              {isFocused && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-cyan-400 text-black font-bold text-[10px] tracking-wide shadow-xl flex items-center gap-1 z-30 whitespace-nowrap animate-bounce">
                  Targeted Reference
                </div>
              )}
              {img.groupId && (
                <div className="absolute -top-6 left-2 px-1.5 py-0.2 rounded bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 font-mono text-[9px] flex items-center gap-1 z-20 backdrop-blur">
                  <Group className="w-2.5 h-2.5" /> Grouped
                </div>
              )}
              <img 
                src={img.src} 
                alt={img.title} 
                className="w-full h-full object-cover rounded-xl select-none"
                draggable={false}
                referrerPolicy="no-referrer"
              />
              {/* Overlay Toolbar */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-neutral-950/80 p-1 rounded-lg backdrop-blur z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElements([{ type: 'image', id: img.id }]);
                  }}
                  className="p-1 text-neutral-300 hover:text-cyan-400 transition-colors"
                  title="Quick Tag Image"
                >
                  <Tag className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => toggleImageLock(img.id)} 
                  className="p-1 text-neutral-300 hover:text-white"
                  title={img.locked ? "Unlock Image" : "Lock Position"}
                >
                  {img.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
                <button 
                  onClick={() => deleteElement(img.id, 'image')} 
                  className="p-1 text-neutral-300 hover:text-rose-400"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Title badge */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-neutral-950/80 text-[10px] font-medium text-neutral-300 backdrop-blur truncate max-w-[80%]">
                {img.title}
              </div>
              {/* Tag Badges */}
              {img.tags && img.tags.length > 0 && (
                <div className="absolute bottom-2 right-2 flex flex-wrap gap-1 max-w-[65%] justify-end pointer-events-none z-10">
                  {img.tags.slice(0, 3).map((t, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded-md bg-cyan-950/90 text-cyan-300 text-[9px] font-mono border border-cyan-500/40 backdrop-blur shadow-sm">
                      #{t.replace(/^#/, '')}
                    </span>
                  ))}
                  {img.tags.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-cyan-950/90 text-cyan-400 text-[9px] font-mono border border-cyan-500/40 shadow-sm">
                      +{img.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Sticky Notes */}
        {project.stickies.map(sticky => {
          const isFocused = highlightedId === sticky.id;
          const isSelected = selectedElements.some(s => s.type === 'sticky' && s.id === sticky.id);

          return (
            <div
              key={sticky.id}
              className={`absolute pointer-events-auto rounded-xl p-3 shadow-lg flex flex-col justify-between group transition-all ${
                isFocused || isSelected
                  ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-black shadow-[0_0_30px_rgba(6,182,212,0.6)] scale-105'
                  : ''
              }`}
              style={{
                left: `${sticky.x}px`,
                top: `${sticky.y}px`,
                width: `${sticky.width}px`,
                minHeight: `${sticky.height}px`,
                backgroundColor: sticky.color,
                transform: `rotate(${sticky.rotation}deg)`,
                color: '#1E293B'
              }}
              onPointerDown={(e) => {
                const coords = getCanvasCoords(e.clientX, e.clientY);
                handleSelectAndStartDrag(e, { type: 'sticky', id: sticky.id }, coords);
              }}
            >
              {isFocused && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-cyan-400 text-black font-bold text-[10px] tracking-wide shadow-xl flex items-center gap-1 z-30 whitespace-nowrap animate-bounce">
                  Targeted Note
                </div>
              )}
              <div className="flex items-center justify-between pb-1 border-b border-black/10 text-[10px] font-bold tracking-wider opacity-60">
                <div className="flex items-center gap-1">
                  <span>{sticky.author || 'NOTE'}</span>
                  {sticky.groupId && <Group className="w-2.5 h-2.5 text-cyan-800" />}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElements([{ type: 'sticky', id: sticky.id }]);
                    }}
                    className="hover:text-cyan-800 transition-colors p-0.5"
                    title="Quick Tag Note"
                  >
                    <Tag className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => deleteElement(sticky.id, 'sticky')}
                    className="hover:text-rose-600 transition-colors p-0.5"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <textarea
                value={sticky.text}
                onChange={(e) => {
                  const text = e.target.value;
                  setProject(prev => ({
                    ...prev,
                    stickies: prev.stickies.map(s => s.id === sticky.id ? { ...s, text } : s)
                  }));
                }}
                className="w-full h-full bg-transparent resize-none border-none outline-none text-xs font-medium leading-relaxed font-sans pt-2"
                placeholder="Write artist thought..."
              />
              {/* Sticky Tags */}
              {sticky.tags && sticky.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-black/10">
                  {sticky.tags.map((t, idx) => (
                    <span key={idx} className="px-1 py-0.2 rounded bg-black/10 text-black/80 font-mono text-[9px]">
                      #{t.replace(/^#/, '')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Text Labels */}
        {project.texts.map(txt => {
          const isFocused = highlightedId === txt.id;
          const isSelected = selectedElements.some(s => s.type === 'text' && s.id === txt.id);

          return (
            <div
              key={txt.id}
              className={`absolute pointer-events-auto group px-2 py-1 rounded transition-all ${
                isFocused || isSelected
                  ? 'ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)] bg-cyan-950/40'
                  : 'hover:outline hover:outline-1 hover:outline-cyan-500'
              }`}
              style={{
                left: `${txt.x}px`,
                top: `${txt.y}px`,
                color: txt.color,
                fontSize: `${txt.fontSize}px`,
                fontFamily: txt.fontFamily || 'Outfit'
              }}
              onPointerDown={(e) => {
                const coords = getCanvasCoords(e.clientX, e.clientY);
                handleSelectAndStartDrag(e, { type: 'text', id: txt.id }, coords);
              }}
            >
              {isFocused && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-cyan-400 text-black font-bold text-[10px] tracking-wide shadow-xl flex items-center gap-1 z-30 whitespace-nowrap animate-bounce">
                  Targeted Text
                </div>
              )}
              <input
                type="text"
                value={txt.text}
                onChange={(e) => {
                  const text = e.target.value;
                  setProject(prev => ({
                    ...prev,
                    texts: prev.texts.map(t => t.id === txt.id ? { ...t, text } : t)
                  }));
                }}
                className="bg-transparent border-none outline-none font-bold tracking-wide"
                style={{ color: txt.color }}
              />
              {/* Text tags badge */}
              {txt.tags && txt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5 pointer-events-none">
                  {txt.tags.map((t, idx) => (
                    <span key={idx} className="px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-300 font-mono text-[9px] border border-cyan-500/40">
                      #{t.replace(/^#/, '')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Collaborative Annotation Pins */}
        {project.annotations.map(anno => {
          const isFocused = highlightedId === anno.id;
          const isSelected = selectedElements.some(s => s.type === 'annotation' && s.id === anno.id);

          return (
            <div
              key={anno.id}
              className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: `${anno.x}px`, top: `${anno.y}px` }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenAnnotation(anno);
              }}
              onPointerDown={(e) => {
                const coords = getCanvasCoords(e.clientX, e.clientY);
                handleSelectAndStartDrag(e, { type: 'annotation', id: anno.id }, coords);
              }}
            >
              {isFocused && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-cyan-400 text-black font-bold text-[10px] tracking-wide shadow-xl flex items-center gap-1 z-30 whitespace-nowrap animate-bounce">
                  Targeted Pin
                </div>
              )}
              <div className={`relative flex items-center justify-center w-8 h-8 rounded-full shadow-xl transition-transform transform ${
                isFocused || isSelected
                  ? 'ring-4 ring-cyan-400 scale-125 shadow-[0_0_25px_rgba(6,182,212,0.8)]'
                  : 'group-hover:scale-110'
              } ${
                anno.status === 'resolved' 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-rose-500 text-white animate-bounce'
              }`}>
                <MessageSquare className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white text-neutral-900 rounded-full text-[8px] font-bold flex items-center justify-center">
                  {anno.comments.length}
                </span>
              </div>
              {/* Hover Tooltip */}
              <div className="absolute left-10 top-0 bg-neutral-950/90 text-white px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none backdrop-blur border border-neutral-800">
                <span className="font-bold text-rose-400">{anno.author}:</span> {anno.title}
              </div>
            </div>
          );
        })}

        {/* Dynamic Activity Heatmap Hotspot Badges */}
        {heatmapSettings?.enabled && heatmapSettings.showHotspotBadges && (
          detectActivityHotspots(project, activeLayerId, heatmapSettings.onlyActiveLayer).map((hotspot, idx) => (
            <div
              key={hotspot.id}
              className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              style={{ left: `${hotspot.x}px`, top: `${hotspot.y}px` }}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectHotspot) onSelectHotspot(hotspot);
              }}
            >
              {/* Pulsing Concentric Radar Ring */}
              <div className="absolute -inset-4 rounded-full border border-rose-500/50 animate-ping pointer-events-none" />
              
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-950/90 border border-rose-500/80 shadow-2xl backdrop-blur text-white text-[11px] font-bold tracking-tight hover:scale-110 transition-transform shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                <span className="text-rose-200">Hotspot #{idx + 1}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-mono">
                  {hotspot.density}%
                </span>
              </div>

              {/* Hover Info Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-neutral-950/95 text-white px-2.5 py-1 rounded-lg text-[10px] whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-neutral-800">
                {hotspot.strokeCount} strokes • {hotspot.pointCount} points (Click to focus)
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
