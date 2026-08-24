import type { ProjectData, CanvasShape, CanvasImage, CanvasSticky, CanvasText, CanvasAnnotation } from '../types';

export type CanvasAlignmentAction = 
  | 'align-left'
  | 'align-center-h'
  | 'align-right'
  | 'align-top'
  | 'align-center-v'
  | 'align-bottom'
  | 'distribute-h'
  | 'distribute-v'
  | 'center-canvas-h'
  | 'center-canvas-v'
  | 'center-canvas-both'
  | 'snap-to-grid'
  | 'snap-to-nearest-object'
  | 'equalize-width'
  | 'equalize-height';

export interface SelectedElementRef {
  type: 'shape' | 'sticky' | 'text' | 'image' | 'annotation';
  id: string;
}

export interface CanvasObjectBounds {
  id: string;
  type: 'shape' | 'sticky' | 'text' | 'image' | 'annotation';
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  right: number;
  bottom: number;
}

export interface EnclosingBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Calculates standard dimensions and bounding boxes for any canvas item.
 */
export function getItemBounds(
  project: ProjectData,
  item: SelectedElementRef
): CanvasObjectBounds | null {
  if (item.type === 'shape') {
    const shape = project.shapes.find(s => s.id === item.id);
    if (!shape) return null;
    const x = Math.min(shape.x, shape.x + shape.width);
    const y = Math.min(shape.y, shape.y + shape.height);
    const width = Math.abs(shape.width);
    const height = Math.abs(shape.height);
    return {
      id: shape.id,
      type: 'shape',
      x,
      y,
      width: Math.max(10, width),
      height: Math.max(10, height),
      centerX: x + width / 2,
      centerY: y + height / 2,
      right: x + width,
      bottom: y + height
    };
  }

  if (item.type === 'sticky') {
    const sticky = project.stickies.find(st => st.id === item.id);
    if (!sticky) return null;
    return {
      id: sticky.id,
      type: 'sticky',
      x: sticky.x,
      y: sticky.y,
      width: sticky.width,
      height: sticky.height,
      centerX: sticky.x + sticky.width / 2,
      centerY: sticky.y + sticky.height / 2,
      right: sticky.x + sticky.width,
      bottom: sticky.y + sticky.height
    };
  }

  if (item.type === 'image') {
    const img = project.images.find(i => i.id === item.id);
    if (!img) return null;
    return {
      id: img.id,
      type: 'image',
      x: img.x,
      y: img.y,
      width: img.width,
      height: img.height,
      centerX: img.x + img.width / 2,
      centerY: img.y + img.height / 2,
      right: img.x + img.width,
      bottom: img.y + img.height
    };
  }

  if (item.type === 'text') {
    const txt = project.texts.find(t => t.id === item.id);
    if (!txt) return null;
    const estimatedWidth = Math.max(80, (txt.text?.length || 6) * (txt.fontSize || 16) * 0.6 + 20);
    const estimatedHeight = Math.max(32, (txt.fontSize || 16) * 1.5);
    return {
      id: txt.id,
      type: 'text',
      x: txt.x,
      y: txt.y,
      width: estimatedWidth,
      height: estimatedHeight,
      centerX: txt.x + estimatedWidth / 2,
      centerY: txt.y + estimatedHeight / 2,
      right: txt.x + estimatedWidth,
      bottom: txt.y + estimatedHeight
    };
  }

  if (item.type === 'annotation') {
    const anno = project.annotations.find(a => a.id === item.id);
    if (!anno) return null;
    const size = 32;
    return {
      id: anno.id,
      type: 'annotation',
      x: anno.x - size / 2,
      y: anno.y - size / 2,
      width: size,
      height: size,
      centerX: anno.x,
      centerY: anno.y,
      right: anno.x + size / 2,
      bottom: anno.y + size / 2
    };
  }

  return null;
}

/**
 * Computes bounding frame enclosing all selected objects.
 */
export function getEnclosingBounds(boundsList: CanvasObjectBounds[]): EnclosingBounds | null {
  if (boundsList.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const b of boundsList) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.right);
    maxY = Math.max(maxY, b.bottom);
  }

  const width = Math.max(0, maxX - minX);
  const height = Math.max(0, maxY - minY);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2
  };
}

export interface AlignmentOptions {
  canvasCenter?: { x: number; y: number };
  gridSize?: number;
  alignTo?: 'selection' | 'canvas';
}

/**
 * Executes alignment, distribution, or center snapping on selected objects.
 * Returns the modified project data and a human-readable feedback label.
 */
export function alignCanvasObjects(
  project: ProjectData,
  selectedElements: SelectedElementRef[],
  action: CanvasAlignmentAction,
  options: AlignmentOptions = {}
): { updatedProject: ProjectData; feedback: string } {
  if (selectedElements.length === 0) {
    return { updatedProject: project, feedback: 'No objects selected to align' };
  }

  const boundsList: CanvasObjectBounds[] = [];
  for (const el of selectedElements) {
    const b = getItemBounds(project, el);
    if (b) boundsList.push(b);
  }

  if (boundsList.length === 0) {
    return { updatedProject: project, feedback: 'Selected objects could not be measured' };
  }

  const enclosing = getEnclosingBounds(boundsList);
  if (!enclosing) {
    return { updatedProject: project, feedback: 'Error computing object boundaries' };
  }

  const targetCenter = options.canvasCenter || { x: 0, y: 0 };
  const gridSize = options.gridSize || 20;
  const isMultiple = boundsList.length >= 2;
  const isAlignToCanvas = options.alignTo === 'canvas' || !isMultiple;

  // Clone project elements
  const shapeMap = new Map(project.shapes.map(s => [s.id, { ...s }]));
  const stickyMap = new Map(project.stickies.map(st => [st.id, { ...st }]));
  const imageMap = new Map(project.images.map(img => [img.id, { ...img }]));
  const textMap = new Map(project.texts.map(t => [t.id, { ...t }]));
  const annoMap = new Map(project.annotations.map(a => [a.id, { ...a }]));

  let feedbackMessage = '';

  const updateItemPosition = (
    item: CanvasObjectBounds, 
    newX: number, 
    newY: number, 
    newWidth?: number, 
    newHeight?: number
  ) => {
    if (item.type === 'shape') {
      const sh = shapeMap.get(item.id);
      if (sh) {
        sh.x = newX;
        sh.y = newY;
        if (newWidth !== undefined) sh.width = newWidth;
        if (newHeight !== undefined) sh.height = newHeight;
      }
    } else if (item.type === 'sticky') {
      const st = stickyMap.get(item.id);
      if (st) {
        st.x = newX;
        st.y = newY;
        if (newWidth !== undefined) st.width = newWidth;
        if (newHeight !== undefined) st.height = newHeight;
      }
    } else if (item.type === 'image') {
      const img = imageMap.get(item.id);
      if (img && !img.locked) {
        img.x = newX;
        img.y = newY;
        if (newWidth !== undefined) img.width = newWidth;
        if (newHeight !== undefined) img.height = newHeight;
      }
    } else if (item.type === 'text') {
      const txt = textMap.get(item.id);
      if (txt) {
        txt.x = newX;
        txt.y = newY;
      }
    } else if (item.type === 'annotation') {
      const anno = annoMap.get(item.id);
      if (anno) {
        anno.x = newX + item.width / 2;
        anno.y = newY + item.height / 2;
      }
    }
  };

  switch (action) {
    case 'align-left': {
      const targetLeft = isAlignToCanvas ? targetCenter.x - enclosing.width / 2 : enclosing.minX;
      for (const item of boundsList) {
        updateItemPosition(item, targetLeft, item.y);
      }
      feedbackMessage = `Aligned ${boundsList.length} object${boundsList.length > 1 ? 's' : ''} to Left`;
      break;
    }

    case 'align-center-h': {
      const targetCenterX = isAlignToCanvas ? targetCenter.x : enclosing.centerX;
      for (const item of boundsList) {
        const newX = targetCenterX - item.width / 2;
        updateItemPosition(item, newX, item.y);
      }
      feedbackMessage = `Aligned ${boundsList.length} object${boundsList.length > 1 ? 's' : ''} to Horizontal Center`;
      break;
    }

    case 'align-right': {
      const targetRight = isAlignToCanvas ? targetCenter.x + enclosing.width / 2 : enclosing.maxX;
      for (const item of boundsList) {
        const newX = targetRight - item.width;
        updateItemPosition(item, newX, item.y);
      }
      feedbackMessage = `Aligned ${boundsList.length} object${boundsList.length > 1 ? 's' : ''} to Right`;
      break;
    }

    case 'align-top': {
      const targetTop = isAlignToCanvas ? targetCenter.y - enclosing.height / 2 : enclosing.minY;
      for (const item of boundsList) {
        updateItemPosition(item, item.x, targetTop);
      }
      feedbackMessage = `Aligned ${boundsList.length} object${boundsList.length > 1 ? 's' : ''} to Top`;
      break;
    }

    case 'align-center-v': {
      const targetCenterY = isAlignToCanvas ? targetCenter.y : enclosing.centerY;
      for (const item of boundsList) {
        const newY = targetCenterY - item.height / 2;
        updateItemPosition(item, item.x, newY);
      }
      feedbackMessage = `Aligned ${boundsList.length} object${boundsList.length > 1 ? 's' : ''} to Vertical Middle`;
      break;
    }

    case 'align-bottom': {
      const targetBottom = isAlignToCanvas ? targetCenter.y + enclosing.height / 2 : enclosing.maxY;
      for (const item of boundsList) {
        const newY = targetBottom - item.height;
        updateItemPosition(item, item.x, newY);
      }
      feedbackMessage = `Aligned ${boundsList.length} object${boundsList.length > 1 ? 's' : ''} to Bottom`;
      break;
    }

    case 'distribute-h': {
      if (boundsList.length < 3) {
        // Fallback to center alignment if fewer than 3 items
        const targetCenterX = enclosing.centerX;
        for (const item of boundsList) {
          updateItemPosition(item, targetCenterX - item.width / 2, item.y);
        }
        feedbackMessage = 'Distributed across centers';
        break;
      }

      // Sort by X coordinate
      const sorted = [...boundsList].sort((a, b) => a.x - b.x);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpan = last.right - first.x;
      const totalItemWidth = sorted.reduce((sum, item) => sum + item.width, 0);
      const remainingSpace = totalSpan - totalItemWidth;

      if (remainingSpace > 0) {
        // Evenly space gaps
        const gap = remainingSpace / (sorted.length - 1);
        let currX = first.x;
        for (let i = 0; i < sorted.length; i++) {
          const item = sorted[i];
          updateItemPosition(item, currX, item.y);
          currX += item.width + gap;
        }
      } else {
        // Evenly space centers
        const centerSpan = last.centerX - first.centerX;
        const step = centerSpan / (sorted.length - 1);
        for (let i = 0; i < sorted.length; i++) {
          const item = sorted[i];
          const newCenterX = first.centerX + i * step;
          updateItemPosition(item, newCenterX - item.width / 2, item.y);
        }
      }
      feedbackMessage = `Distributed ${boundsList.length} objects horizontally`;
      break;
    }

    case 'distribute-v': {
      if (boundsList.length < 3) {
        const targetCenterY = enclosing.centerY;
        for (const item of boundsList) {
          updateItemPosition(item, item.x, targetCenterY - item.height / 2);
        }
        feedbackMessage = 'Distributed across vertical centers';
        break;
      }

      // Sort by Y coordinate
      const sorted = [...boundsList].sort((a, b) => a.y - b.y);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpan = last.bottom - first.y;
      const totalItemHeight = sorted.reduce((sum, item) => sum + item.height, 0);
      const remainingSpace = totalSpan - totalItemHeight;

      if (remainingSpace > 0) {
        // Evenly space gaps
        const gap = remainingSpace / (sorted.length - 1);
        let currY = first.y;
        for (let i = 0; i < sorted.length; i++) {
          const item = sorted[i];
          updateItemPosition(item, item.x, currY);
          currY += item.height + gap;
        }
      } else {
        // Evenly space centers
        const centerSpan = last.centerY - first.centerY;
        const step = centerSpan / (sorted.length - 1);
        for (let i = 0; i < sorted.length; i++) {
          const item = sorted[i];
          const newCenterY = first.centerY + i * step;
          updateItemPosition(item, item.x, newCenterY - item.height / 2);
        }
      }
      feedbackMessage = `Distributed ${boundsList.length} objects vertically`;
      break;
    }

    case 'center-canvas-h': {
      const dx = targetCenter.x - enclosing.centerX;
      for (const item of boundsList) {
        updateItemPosition(item, item.x + dx, item.y);
      }
      feedbackMessage = `Centered selection horizontally on canvas (${Math.round(targetCenter.x)}px)`;
      break;
    }

    case 'center-canvas-v': {
      const dy = targetCenter.y - enclosing.centerY;
      for (const item of boundsList) {
        updateItemPosition(item, item.x, item.y + dy);
      }
      feedbackMessage = `Centered selection vertically on canvas (${Math.round(targetCenter.y)}px)`;
      break;
    }

    case 'center-canvas-both': {
      const dx = targetCenter.x - enclosing.centerX;
      const dy = targetCenter.y - enclosing.centerY;
      for (const item of boundsList) {
        updateItemPosition(item, item.x + dx, item.y + dy);
      }
      feedbackMessage = `Snapped selection to Canvas Origin / Center (${Math.round(targetCenter.x)}, ${Math.round(targetCenter.y)})`;
      break;
    }

    case 'snap-to-grid': {
      for (const item of boundsList) {
        const snappedX = Math.round(item.x / gridSize) * gridSize;
        const snappedY = Math.round(item.y / gridSize) * gridSize;
        updateItemPosition(item, snappedX, snappedY);
      }
      feedbackMessage = `Snapped ${boundsList.length} object${boundsList.length > 1 ? 's' : ''} to ${gridSize}px grid`;
      break;
    }

    case 'snap-to-nearest-object': {
      // Find all visible unselected objects
      const selectedIdSet = new Set(boundsList.map(b => b.id));
      const unselectedBounds: CanvasObjectBounds[] = [];

      for (const s of project.shapes) {
        if (!selectedIdSet.has(s.id)) {
          const b = getItemBounds(project, { type: 'shape', id: s.id });
          if (b) unselectedBounds.push(b);
        }
      }
      for (const st of project.stickies) {
        if (!selectedIdSet.has(st.id)) {
          const b = getItemBounds(project, { type: 'sticky', id: st.id });
          if (b) unselectedBounds.push(b);
        }
      }
      for (const img of project.images) {
        if (!selectedIdSet.has(img.id)) {
          const b = getItemBounds(project, { type: 'image', id: img.id });
          if (b) unselectedBounds.push(b);
        }
      }
      for (const txt of project.texts) {
        if (!selectedIdSet.has(txt.id)) {
          const b = getItemBounds(project, { type: 'text', id: txt.id });
          if (b) unselectedBounds.push(b);
        }
      }

      if (unselectedBounds.length === 0) {
        feedbackMessage = 'No other objects found on canvas to snap to';
        break;
      }

      // Find closest neighbor
      let bestDx = 0;
      let bestDy = 0;
      let minDistance = Infinity;

      for (const unselected of unselectedBounds) {
        const dist = Math.hypot(unselected.centerX - enclosing.centerX, unselected.centerY - enclosing.centerY);
        if (dist < minDistance) {
          minDistance = dist;
          // Test horizontal snap: left to left, left to right, center to center
          const dxOptions = [
            unselected.x - enclosing.minX,
            unselected.right - enclosing.minX,
            unselected.centerX - enclosing.centerX,
            unselected.x - enclosing.maxX,
            unselected.right - enclosing.maxX
          ];
          const closestDx = dxOptions.reduce((prev, curr) => Math.abs(curr) < Math.abs(prev) ? curr : prev, Infinity);

          const dyOptions = [
            unselected.y - enclosing.minY,
            unselected.bottom - enclosing.minY,
            unselected.centerY - enclosing.centerY,
            unselected.y - enclosing.maxY,
            unselected.bottom - enclosing.maxY
          ];
          const closestDy = dyOptions.reduce((prev, curr) => Math.abs(curr) < Math.abs(prev) ? curr : prev, Infinity);

          bestDx = Math.abs(closestDx) < 120 ? closestDx : 0;
          bestDy = Math.abs(closestDy) < 120 ? closestDy : 0;
        }
      }

      if (bestDx !== 0 || bestDy !== 0) {
        for (const item of boundsList) {
          updateItemPosition(item, item.x + bestDx, item.y + bestDy);
        }
        feedbackMessage = 'Snapped selection to closest neighbor object';
      } else {
        feedbackMessage = 'Nearest object is aligned';
      }
      break;
    }

    case 'equalize-width': {
      const maxWidth = Math.max(...boundsList.map(b => b.width));
      for (const item of boundsList) {
        updateItemPosition(item, item.x, item.y, maxWidth, item.height);
      }
      feedbackMessage = `Equalized width to ${Math.round(maxWidth)}px across ${boundsList.length} objects`;
      break;
    }

    case 'equalize-height': {
      const maxHeight = Math.max(...boundsList.map(b => b.height));
      for (const item of boundsList) {
        updateItemPosition(item, item.x, item.y, item.width, maxHeight);
      }
      feedbackMessage = `Equalized height to ${Math.round(maxHeight)}px across ${boundsList.length} objects`;
      break;
    }

    default:
      break;
  }

  const updatedProject: ProjectData = {
    ...project,
    shapes: Array.from(shapeMap.values()),
    stickies: Array.from(stickyMap.values()),
    images: Array.from(imageMap.values()),
    texts: Array.from(textMap.values()),
    annotations: Array.from(annoMap.values())
  };

  return { updatedProject, feedback: feedbackMessage };
}

// ---------------------------------------------------------------------------
// Enhanced Magnetic Snapping & Dynamic Guide Lines Engine
// ---------------------------------------------------------------------------

export type MagneticSnapType =
  | 'center-center'
  | 'edge-edge'
  | 'edge-center'
  | 'origin-axis'
  | 'center-origin'
  | 'dimension-match'
  | 'equal-gap';

export interface MagneticGuideLine {
  id: string;
  orientation: 'horizontal' | 'vertical';
  coord: number;
  start: number;
  end: number;
  snapType: MagneticSnapType;
  label?: string;
  subLabel?: string;
  targetId?: string;
  matchedCoordType?: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'origin';
  gapSize?: number;
  gapIntervals?: Array<{ start: number; end: number; coord: number }>;
}

export interface MagneticSnapResult {
  snappedX: number;
  snappedY: number;
  dx: number;
  dy: number;
  guides: MagneticGuideLine[];
  hasSnapped: boolean;
}

export interface CandidateTarget {
  id: string;
  type: string;
  bounds: CanvasObjectBounds;
}

/**
 * Retrieves all visible non-selected objects on the canvas as candidate snap targets.
 */
export function getCandidateTargets(
  project: ProjectData,
  excludeIds: Set<string>,
  activeLayerOnly: boolean = false,
  activeLayerId?: string
): CandidateTarget[] {
  const visibleLayerIds = new Set((project.layers || []).filter(l => l.visible).map(l => l.id));
  const candidates: CandidateTarget[] = [];

  const checkItem = (ref: SelectedElementRef, layerId?: string) => {
    if (excludeIds.has(ref.id) || excludeIds.has(`${ref.type}-${ref.id}`)) return;
    if (layerId && !visibleLayerIds.has(layerId)) return;
    if (activeLayerOnly && activeLayerId && layerId !== activeLayerId) return;

    const bounds = getItemBounds(project, ref);
    if (bounds && bounds.width > 0 && bounds.height > 0) {
      candidates.push({
        id: ref.id,
        type: ref.type,
        bounds
      });
    }
  };

  (project.shapes || []).forEach(s => checkItem({ type: 'shape', id: s.id }, s.layerId));
  (project.images || []).forEach(img => checkItem({ type: 'image', id: img.id }, img.layerId));
  (project.stickies || []).forEach(st => checkItem({ type: 'sticky', id: st.id }, st.layerId));
  (project.texts || []).forEach(t => checkItem({ type: 'text', id: t.id }, t.layerId));
  (project.annotations || []).forEach(a => checkItem({ type: 'annotation', id: a.id }, a.layerId));

  return candidates;
}

/**
 * Computes magnetic snapping lines when an object being moved is within 10px (or specified threshold)
 * of another object's edge or center point.
 */
export function computeMagneticSnapping(
  movingBounds: { x: number; y: number; width: number; height: number },
  candidates: CandidateTarget[],
  options: {
    snapThreshold?: number; // 10px magnetic snapping threshold default
    zoom?: number;
    includeOrigin?: boolean;
  } = {}
): MagneticSnapResult {
  const zoom = options.zoom || 1;
  // 10px magnetic threshold adjusted for zoom screen space
  const threshold = (options.snapThreshold ?? 10) / zoom;
  const includeOrigin = options.includeOrigin ?? true;

  const currentX = movingBounds.x;
  const currentY = movingBounds.y;
  const width = movingBounds.width;
  const height = movingBounds.height;
  const centerX = currentX + width / 2;
  const centerY = currentY + height / 2;
  const right = currentX + width;
  const bottom = currentY + height;

  let bestSnapX: {
    delta: number;
    coord: number;
    snapType: MagneticSnapType;
    label: string;
    targetBounds?: CanvasObjectBounds;
    matchedType: 'left' | 'center' | 'right' | 'origin';
  } | null = null;

  let bestSnapY: {
    delta: number;
    coord: number;
    snapType: MagneticSnapType;
    label: string;
    targetBounds?: CanvasObjectBounds;
    matchedType: 'top' | 'middle' | 'bottom' | 'origin';
  } | null = null;

  // 1. Origin Axises (X = 0, Y = 0)
  if (includeOrigin) {
    const originTestsX = [
      { current: centerX, delta: 0 - centerX, type: 'center-origin' as const, label: 'Canvas Center X (0)' },
      { current: currentX, delta: 0 - currentX, type: 'origin-axis' as const, label: 'Origin Axis (Left = 0)' },
      { current: right, delta: 0 - right, type: 'origin-axis' as const, label: 'Origin Axis (Right = 0)' }
    ];

    for (const t of originTestsX) {
      if (Math.abs(t.delta) <= threshold) {
        if (!bestSnapX || Math.abs(t.delta) < Math.abs(bestSnapX.delta)) {
          bestSnapX = {
            delta: t.delta,
            coord: 0,
            snapType: t.type,
            label: t.label,
            matchedType: 'origin'
          };
        }
      }
    }

    const originTestsY = [
      { current: centerY, delta: 0 - centerY, type: 'center-origin' as const, label: 'Canvas Center Y (0)' },
      { current: currentY, delta: 0 - currentY, type: 'origin-axis' as const, label: 'Origin Axis (Top = 0)' },
      { current: bottom, delta: 0 - bottom, type: 'origin-axis' as const, label: 'Origin Axis (Bottom = 0)' }
    ];

    for (const t of originTestsY) {
      if (Math.abs(t.delta) <= threshold) {
        if (!bestSnapY || Math.abs(t.delta) < Math.abs(bestSnapY.delta)) {
          bestSnapY = {
            delta: t.delta,
            coord: 0,
            snapType: t.type,
            label: t.label,
            matchedType: 'origin'
          };
        }
      }
    }
  }

  // 2. Candidate Target Objects (Edges and Center Points within 10px)
  for (const candidate of candidates) {
    const cb = candidate.bounds;

    // --- Vertical Magnetic Snapping (X coords) ---
    const xAlignments = [
      // Center Point to Center Point
      {
        delta: cb.centerX - centerX,
        coord: cb.centerX,
        snapType: 'center-center' as const,
        label: 'Center Point Align',
        matchedType: 'center' as const
      },
      // Left Edge to Left Edge
      {
        delta: cb.x - currentX,
        coord: cb.x,
        snapType: 'edge-edge' as const,
        label: 'Left Edge Snap',
        matchedType: 'left' as const
      },
      // Right Edge to Right Edge
      {
        delta: cb.right - right,
        coord: cb.right,
        snapType: 'edge-edge' as const,
        label: 'Right Edge Snap',
        matchedType: 'right' as const
      },
      // Left Edge to Right Edge (Touching/Adjacent)
      {
        delta: cb.right - currentX,
        coord: cb.right,
        snapType: 'edge-edge' as const,
        label: 'Adjacent Edge Snap',
        matchedType: 'left' as const
      },
      // Right Edge to Left Edge (Touching/Adjacent)
      {
        delta: cb.x - right,
        coord: cb.x,
        snapType: 'edge-edge' as const,
        label: 'Adjacent Edge Snap',
        matchedType: 'right' as const
      },
      // Center Point to Left Edge
      {
        delta: cb.x - centerX,
        coord: cb.x,
        snapType: 'edge-center' as const,
        label: 'Center to Left Edge',
        matchedType: 'center' as const
      },
      // Center Point to Right Edge
      {
        delta: cb.right - centerX,
        coord: cb.right,
        snapType: 'edge-center' as const,
        label: 'Center to Right Edge',
        matchedType: 'center' as const
      },
      // Left Edge to Center Point
      {
        delta: cb.centerX - currentX,
        coord: cb.centerX,
        snapType: 'edge-center' as const,
        label: 'Left Edge to Center Point',
        matchedType: 'left' as const
      },
      // Right Edge to Center Point
      {
        delta: cb.centerX - right,
        coord: cb.centerX,
        snapType: 'edge-center' as const,
        label: 'Right Edge to Center Point',
        matchedType: 'right' as const
      }
    ];

    for (const align of xAlignments) {
      if (Math.abs(align.delta) <= threshold) {
        if (!bestSnapX || Math.abs(align.delta) < Math.abs(bestSnapX.delta)) {
          bestSnapX = {
            delta: align.delta,
            coord: align.coord,
            snapType: align.snapType,
            label: align.label,
            targetBounds: cb,
            matchedType: align.matchedType
          };
        }
      }
    }

    // --- Horizontal Magnetic Snapping (Y coords) ---
    const yAlignments = [
      // Center Point to Center Point
      {
        delta: cb.centerY - centerY,
        coord: cb.centerY,
        snapType: 'center-center' as const,
        label: 'Center Point Align',
        matchedType: 'middle' as const
      },
      // Top Edge to Top Edge
      {
        delta: cb.y - currentY,
        coord: cb.y,
        snapType: 'edge-edge' as const,
        label: 'Top Edge Snap',
        matchedType: 'top' as const
      },
      // Bottom Edge to Bottom Edge
      {
        delta: cb.bottom - bottom,
        coord: cb.bottom,
        snapType: 'edge-edge' as const,
        label: 'Bottom Edge Snap',
        matchedType: 'bottom' as const
      },
      // Top Edge to Bottom Edge (Touching/Adjacent)
      {
        delta: cb.bottom - currentY,
        coord: cb.bottom,
        snapType: 'edge-edge' as const,
        label: 'Adjacent Edge Snap',
        matchedType: 'top' as const
      },
      // Bottom Edge to Top Edge (Touching/Adjacent)
      {
        delta: cb.y - bottom,
        coord: cb.y,
        snapType: 'edge-edge' as const,
        label: 'Adjacent Edge Snap',
        matchedType: 'bottom' as const
      },
      // Center Point to Top Edge
      {
        delta: cb.y - centerY,
        coord: cb.y,
        snapType: 'edge-center' as const,
        label: 'Center to Top Edge',
        matchedType: 'middle' as const
      },
      // Center Point to Bottom Edge
      {
        delta: cb.bottom - centerY,
        coord: cb.bottom,
        snapType: 'edge-center' as const,
        label: 'Center to Bottom Edge',
        matchedType: 'middle' as const
      },
      // Top Edge to Center Point
      {
        delta: cb.centerY - currentY,
        coord: cb.centerY,
        snapType: 'edge-center' as const,
        label: 'Top Edge to Center Point',
        matchedType: 'top' as const
      },
      // Bottom Edge to Center Point
      {
        delta: cb.centerY - bottom,
        coord: cb.centerY,
        snapType: 'edge-center' as const,
        label: 'Bottom Edge to Center Point',
        matchedType: 'bottom' as const
      }
    ];

    for (const align of yAlignments) {
      if (Math.abs(align.delta) <= threshold) {
        if (!bestSnapY || Math.abs(align.delta) < Math.abs(bestSnapY.delta)) {
          bestSnapY = {
            delta: align.delta,
            coord: align.coord,
            snapType: align.snapType,
            label: align.label,
            targetBounds: cb,
            matchedType: align.matchedType
          };
        }
      }
    }
  }

  const finalDx = bestSnapX ? bestSnapX.delta : 0;
  const finalDy = bestSnapY ? bestSnapY.delta : 0;

  const snappedX = currentX + finalDx;
  const snappedY = currentY + finalDy;
  const snappedRight = snappedX + width;
  const snappedBottom = snappedY + height;

  const guides: MagneticGuideLine[] = [];

  // Temporary Magnetic Snapping Line (Vertical)
  if (bestSnapX) {
    const coord = bestSnapX.coord;
    let minY = Math.min(snappedY, bestSnapX.targetBounds?.y ?? snappedY);
    let maxY = Math.max(snappedBottom, bestSnapX.targetBounds?.bottom ?? snappedBottom);

    for (const c of candidates) {
      const cb = c.bounds;
      if (
        Math.abs(cb.x - coord) < 0.5 ||
        Math.abs(cb.centerX - coord) < 0.5 ||
        Math.abs(cb.right - coord) < 0.5
      ) {
        minY = Math.min(minY, cb.y);
        maxY = Math.max(maxY, cb.bottom);
      }
    }

    const padding = 16 / zoom;
    guides.push({
      id: `magnetic-v-${Math.round(coord)}`,
      orientation: 'vertical',
      coord,
      start: minY - padding,
      end: maxY + padding,
      snapType: bestSnapX.snapType,
      label: bestSnapX.label,
      subLabel: `X: ${Math.round(coord)}`,
      matchedCoordType: bestSnapX.matchedType
    });
  }

  // Temporary Magnetic Snapping Line (Horizontal)
  if (bestSnapY) {
    const coord = bestSnapY.coord;
    let minX = Math.min(snappedX, bestSnapY.targetBounds?.x ?? snappedX);
    let maxX = Math.max(snappedRight, bestSnapY.targetBounds?.right ?? snappedRight);

    for (const c of candidates) {
      const cb = c.bounds;
      if (
        Math.abs(cb.y - coord) < 0.5 ||
        Math.abs(cb.centerY - coord) < 0.5 ||
        Math.abs(cb.bottom - coord) < 0.5
      ) {
        minX = Math.min(minX, cb.x);
        maxX = Math.max(maxX, cb.right);
      }
    }

    const padding = 16 / zoom;
    guides.push({
      id: `magnetic-h-${Math.round(coord)}`,
      orientation: 'horizontal',
      coord,
      start: minX - padding,
      end: maxX + padding,
      snapType: bestSnapY.snapType,
      label: bestSnapY.label,
      subLabel: `Y: ${Math.round(coord)}`,
      matchedCoordType: bestSnapY.matchedType
    });
  }

  return {
    snappedX,
    snappedY,
    dx: finalDx,
    dy: finalDy,
    guides,
    hasSnapped: bestSnapX !== null || bestSnapY !== null
  };
}

