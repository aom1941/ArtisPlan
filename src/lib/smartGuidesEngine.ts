import type { ProjectData, CanvasCustomGuide } from '../types';
import { getItemBounds, type CanvasObjectBounds, type SelectedElementRef } from './alignmentEngine';

export type SmartGuideSnapType =
  | 'center-center'
  | 'edge-edge'
  | 'edge-center'
  | 'origin-axis'
  | 'center-origin'
  | 'dimension-match'
  | 'equal-gap'
  | 'manual-guide';

export interface SmartGuideAnchorPoint {
  x: number;
  y: number;
  type: 'moving-center' | 'moving-edge' | 'target-center' | 'target-edge' | 'origin' | 'gap-endpoint';
  label?: string;
}

export interface SmartGuideLine {
  id: string;
  orientation: 'horizontal' | 'vertical';
  coord: number; // canvas x (if vertical) or canvas y (if horizontal)
  start: number; // canvas y-min (if vertical) or canvas x-min (if horizontal)
  end: number;   // canvas y-max (if vertical) or canvas x-max (if horizontal)
  snapType: SmartGuideSnapType;
  label?: string;
  subLabel?: string;
  targetId?: string;
  matchedCoordType?: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'origin';
  gapSize?: number;
  gapIntervals?: Array<{ start: number; end: number; coord: number }>;
  anchorPoints?: SmartGuideAnchorPoint[];
  isLocked?: boolean;
  targetBounds?: CanvasObjectBounds;
  movingBounds?: { x: number; y: number; width: number; height: number };
  color?: string;
}

export interface SmartGuideSnapResult {
  snappedX: number;
  snappedY: number;
  dx: number; // Applied delta correction in X
  dy: number; // Applied delta correction in Y
  guides: SmartGuideLine[];
  hasSnapped: boolean;
  snappedAxes: { x: boolean; y: boolean };
  snappedGuideIds: string[];
}

export interface SmartResizeSnapResult {
  snappedWidth: number;
  snappedHeight: number;
  snappedX: number;
  snappedY: number;
  guides: SmartGuideLine[];
  hasSnapped: boolean;
}

export interface CandidateTarget {
  id: string;
  type: string;
  bounds: CanvasObjectBounds;
}

/**
 * Retrieves all visible non-selected objects on the canvas to act as snap targets.
 */
export function getCandidateTargets(
  project: ProjectData,
  excludeIds: Set<string>,
  activeLayerOnly: boolean = false,
  activeLayerId?: string
): CandidateTarget[] {
  const visibleLayerIds = new Set(project.layers.filter(l => l.visible).map(l => l.id));
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

  // Shapes
  project.shapes.forEach(s => checkItem({ type: 'shape', id: s.id }, s.layerId));
  // Images (unlocked or locked references)
  project.images.forEach(img => checkItem({ type: 'image', id: img.id }, img.layerId));
  // Stickies
  project.stickies.forEach(st => checkItem({ type: 'sticky', id: st.id }, st.layerId));
  // Texts
  project.texts.forEach(t => checkItem({ type: 'text', id: t.id }, t.layerId));
  // Annotation Pins
  project.annotations.forEach(a => checkItem({ type: 'annotation', id: a.id }, a.layerId));

  return candidates;
}

/**
 * Calculates smart guide snapping when moving an object or bounding box.
 */
export function computeSmartGuidesOnMove(
  movingBounds: { x: number; y: number; width: number; height: number },
  candidates: CandidateTarget[],
  options: {
    snapThreshold?: number; // In screen pixels (default 10px magnetic snapping threshold)
    zoom?: number;
    includeOrigin?: boolean;
    detectGaps?: boolean;
    manualGuides?: CanvasCustomGuide[];
  } = {}
): SmartGuideSnapResult {
  const zoom = options.zoom || 1;
  // Screen-adjusted magnetic snap threshold: 10 screen pixels converted to canvas coordinates
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
    snapType: SmartGuideSnapType;
    label: string;
    targetBounds?: CanvasObjectBounds;
    matchedType?: 'left' | 'center' | 'right' | 'origin';
    color?: string;
  } | null = null;

  let bestSnapY: {
    delta: number;
    coord: number;
    snapType: SmartGuideSnapType;
    label: string;
    targetBounds?: CanvasObjectBounds;
    matchedType?: 'top' | 'middle' | 'bottom' | 'origin';
    color?: string;
  } | null = null;

  // 1. Check Origin Snap (x = 0, y = 0)
  if (includeOrigin) {
    // Vertical origin (x = 0)
    const originTests = [
      { current: centerX, delta: 0 - centerX, type: 'center-origin' as const, label: 'Canvas Center X (0)' },
      { current: currentX, delta: 0 - currentX, type: 'origin-axis' as const, label: 'Origin Axis (Left = 0)' },
      { current: right, delta: 0 - right, type: 'origin-axis' as const, label: 'Origin Axis (Right = 0)' }
    ];

    for (const t of originTests) {
      if (Math.abs(t.delta) <= threshold) {
        if (!bestSnapX || Math.abs(t.delta) < Math.abs(bestSnapX.delta)) {
          bestSnapX = {
            delta: t.delta,
            coord: 0,
            snapType: t.type === 'center-origin' ? 'center-origin' : 'origin-axis',
            label: t.label,
            matchedType: 'origin'
          };
        }
      }
    }

    // Horizontal origin (y = 0)
    const originYTests = [
      { current: centerY, delta: 0 - centerY, type: 'center-origin' as const, label: 'Canvas Center Y (0)' },
      { current: currentY, delta: 0 - currentY, type: 'origin-axis' as const, label: 'Origin Axis (Top = 0)' },
      { current: bottom, delta: 0 - bottom, type: 'origin-axis' as const, label: 'Origin Axis (Bottom = 0)' }
    ];

    for (const t of originYTests) {
      if (Math.abs(t.delta) <= threshold) {
        if (!bestSnapY || Math.abs(t.delta) < Math.abs(bestSnapY.delta)) {
          bestSnapY = {
            delta: t.delta,
            coord: 0,
            snapType: t.type === 'center-origin' ? 'center-origin' : 'origin-axis',
            label: t.label,
            matchedType: 'origin'
          };
        }
      }
    }
  }

  // 1.5 Check Manual Custom Magnetic Guidelines
  if (options.manualGuides && options.manualGuides.length > 0) {
    for (const mg of options.manualGuides) {
      if (mg.visible === false) continue;

      if (mg.orientation === 'vertical') {
        const tests = [
          { current: centerX, delta: mg.position - centerX, matchedType: 'center' as const, label: `Guide: ${mg.name} (Center)` },
          { current: currentX, delta: mg.position - currentX, matchedType: 'left' as const, label: `Guide: ${mg.name} (Left)` },
          { current: right, delta: mg.position - right, matchedType: 'right' as const, label: `Guide: ${mg.name} (Right)` }
        ];

        for (const t of tests) {
          if (Math.abs(t.delta) <= threshold) {
            if (!bestSnapX || Math.abs(t.delta) < Math.abs(bestSnapX.delta)) {
              bestSnapX = {
                delta: t.delta,
                coord: mg.position,
                snapType: 'manual-guide',
                label: t.label,
                matchedType: t.matchedType,
                color: mg.color
              };
            }
          }
        }
      } else if (mg.orientation === 'horizontal') {
        const tests = [
          { current: centerY, delta: mg.position - centerY, matchedType: 'middle' as const, label: `Guide: ${mg.name} (Center)` },
          { current: currentY, delta: mg.position - currentY, matchedType: 'top' as const, label: `Guide: ${mg.name} (Top)` },
          { current: bottom, delta: mg.position - bottom, matchedType: 'bottom' as const, label: `Guide: ${mg.name} (Bottom)` }
        ];

        for (const t of tests) {
          if (Math.abs(t.delta) <= threshold) {
            if (!bestSnapY || Math.abs(t.delta) < Math.abs(bestSnapY.delta)) {
              bestSnapY = {
                delta: t.delta,
                coord: mg.position,
                snapType: 'manual-guide',
                label: t.label,
                matchedType: t.matchedType,
                color: mg.color
              };
            }
          }
        }
      }
    }
  }

  // 2. Check Candidate Target Objects
  for (const candidate of candidates) {
    const cb = candidate.bounds;

    // --- Vertical Alignment (X coordinates) ---
    // Moving points to test: Left (currentX), Center (centerX), Right (right)
    // Target points to align with: cb.x, cb.centerX, cb.right
    const xAlignments = [
      // Center to Center
      {
        delta: cb.centerX - centerX,
        coord: cb.centerX,
        snapType: 'center-center' as const,
        label: 'Center Alignment',
        matchedType: 'center' as const
      },
      // Left to Left
      {
        delta: cb.x - currentX,
        coord: cb.x,
        snapType: 'edge-edge' as const,
        label: 'Left Edge Align',
        matchedType: 'left' as const
      },
      // Right to Right
      {
        delta: cb.right - right,
        coord: cb.right,
        snapType: 'edge-edge' as const,
        label: 'Right Edge Align',
        matchedType: 'right' as const
      },
      // Left to Right
      {
        delta: cb.right - currentX,
        coord: cb.right,
        snapType: 'edge-edge' as const,
        label: 'Adjacent Edge Align',
        matchedType: 'left' as const
      },
      // Right to Left
      {
        delta: cb.x - right,
        coord: cb.x,
        snapType: 'edge-edge' as const,
        label: 'Adjacent Edge Align',
        matchedType: 'right' as const
      },
      // Center to Left Edge
      {
        delta: cb.x - centerX,
        coord: cb.x,
        snapType: 'edge-center' as const,
        label: 'Center to Edge',
        matchedType: 'center' as const
      },
      // Center to Right Edge
      {
        delta: cb.right - centerX,
        coord: cb.right,
        snapType: 'edge-center' as const,
        label: 'Center to Edge',
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

    // --- Horizontal Alignment (Y coordinates) ---
    // Moving points to test: Top (currentY), Center (centerY), Bottom (bottom)
    // Target points to align with: cb.y, cb.centerY, cb.bottom
    const yAlignments = [
      // Center to Center
      {
        delta: cb.centerY - centerY,
        coord: cb.centerY,
        snapType: 'center-center' as const,
        label: 'Center Alignment',
        matchedType: 'middle' as const
      },
      // Top to Top
      {
        delta: cb.y - currentY,
        coord: cb.y,
        snapType: 'edge-edge' as const,
        label: 'Top Edge Align',
        matchedType: 'top' as const
      },
      // Bottom to Bottom
      {
        delta: cb.bottom - bottom,
        coord: cb.bottom,
        snapType: 'edge-edge' as const,
        label: 'Bottom Edge Align',
        matchedType: 'bottom' as const
      },
      // Top to Bottom
      {
        delta: cb.bottom - currentY,
        coord: cb.bottom,
        snapType: 'edge-edge' as const,
        label: 'Adjacent Edge Align',
        matchedType: 'top' as const
      },
      // Bottom to Top
      {
        delta: cb.y - bottom,
        coord: cb.y,
        snapType: 'edge-edge' as const,
        label: 'Adjacent Edge Align',
        matchedType: 'bottom' as const
      },
      // Center to Top Edge
      {
        delta: cb.y - centerY,
        coord: cb.y,
        snapType: 'edge-center' as const,
        label: 'Center to Edge',
        matchedType: 'middle' as const
      },
      // Center to Bottom Edge
      {
        delta: cb.bottom - centerY,
        coord: cb.bottom,
        snapType: 'edge-center' as const,
        label: 'Center to Edge',
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
  const snappedCenterX = snappedX + width / 2;
  const snappedCenterY = snappedY + height / 2;
  const snappedRight = snappedX + width;
  const snappedBottom = snappedY + height;

  const guides: SmartGuideLine[] = [];
  const snappedGuideIds: string[] = [];

  // Generate Vertical Guide Line
  if (bestSnapX) {
    const coord = bestSnapX.coord;
    let minY = Math.min(snappedY, bestSnapX.targetBounds?.y ?? snappedY);
    let maxY = Math.max(snappedBottom, bestSnapX.targetBounds?.bottom ?? snappedBottom);

    const anchorPoints: SmartGuideAnchorPoint[] = [];

    // Moving element anchor point
    anchorPoints.push({
      x: coord,
      y: snappedCenterY,
      type: bestSnapX.matchedType === 'center' ? 'moving-center' : 'moving-edge',
      label: bestSnapX.matchedType === 'center' ? 'Center' : 'Edge'
    });

    // Target element anchor point
    if (bestSnapX.targetBounds) {
      anchorPoints.push({
        x: coord,
        y: bestSnapX.targetBounds.centerY,
        type: 'target-center',
        label: 'Target Center'
      });
    }

    // Check all other candidate targets that share this same coordinate to extend the line
    for (const c of candidates) {
      const cb = c.bounds;
      if (
        Math.abs(cb.x - coord) < 0.5 ||
        Math.abs(cb.centerX - coord) < 0.5 ||
        Math.abs(cb.right - coord) < 0.5
      ) {
        minY = Math.min(minY, cb.y);
        maxY = Math.max(maxY, cb.bottom);
        anchorPoints.push({
          x: coord,
          y: cb.centerY,
          type: 'target-center',
          label: 'Aligned Target'
        });
      }
    }

    // Add visual breathing padding
    const padding = 16 / zoom;
    const guideId = `guide-v-${Math.round(coord)}`;
    snappedGuideIds.push(guideId);

    guides.push({
      id: guideId,
      orientation: 'vertical',
      coord,
      start: minY - padding,
      end: maxY + padding,
      snapType: bestSnapX.snapType,
      label: bestSnapX.label,
      subLabel: `X: ${Math.round(coord)}`,
      matchedCoordType: bestSnapX.matchedType,
      anchorPoints,
      isLocked: true,
      targetBounds: bestSnapX.targetBounds,
      movingBounds: { x: snappedX, y: snappedY, width, height },
      color: bestSnapX.color
    });
  }

  // Generate Horizontal Guide Line
  if (bestSnapY) {
    const coord = bestSnapY.coord;
    let minX = Math.min(snappedX, bestSnapY.targetBounds?.x ?? snappedX);
    let maxX = Math.max(snappedRight, bestSnapY.targetBounds?.right ?? snappedRight);

    const anchorPoints: SmartGuideAnchorPoint[] = [];

    // Moving element anchor point
    anchorPoints.push({
      x: snappedCenterX,
      y: coord,
      type: bestSnapY.matchedType === 'middle' ? 'moving-center' : 'moving-edge',
      label: bestSnapY.matchedType === 'middle' ? 'Center' : 'Edge'
    });

    // Target element anchor point
    if (bestSnapY.targetBounds) {
      anchorPoints.push({
        x: bestSnapY.targetBounds.centerX,
        y: coord,
        type: 'target-center',
        label: 'Target Center'
      });
    }

    for (const c of candidates) {
      const cb = c.bounds;
      if (
        Math.abs(cb.y - coord) < 0.5 ||
        Math.abs(cb.centerY - coord) < 0.5 ||
        Math.abs(cb.bottom - coord) < 0.5
      ) {
        minX = Math.min(minX, cb.x);
        maxX = Math.max(maxX, cb.right);
        anchorPoints.push({
          x: cb.centerX,
          y: coord,
          type: 'target-center',
          label: 'Aligned Target'
        });
      }
    }

    const padding = 16 / zoom;
    const guideId = `guide-h-${Math.round(coord)}`;
    snappedGuideIds.push(guideId);

    guides.push({
      id: guideId,
      orientation: 'horizontal',
      coord,
      start: minX - padding,
      end: maxX + padding,
      snapType: bestSnapY.snapType,
      label: bestSnapY.label,
      subLabel: `Y: ${Math.round(coord)}`,
      matchedCoordType: bestSnapY.matchedType,
      anchorPoints,
      isLocked: true,
      targetBounds: bestSnapY.targetBounds,
      movingBounds: { x: snappedX, y: snappedY, width, height },
      color: bestSnapY.color
    });
  }

  // Equal Spacing Gap Detection (when detectGaps is true or default)
  if (options.detectGaps !== false && candidates.length >= 2) {
    const gapGuides = detectEqualGapGuides(
      { x: snappedX, y: snappedY, width, height, centerX: snappedCenterX, centerY: snappedCenterY, right: snappedRight, bottom: snappedBottom },
      candidates,
      threshold,
      zoom
    );
    gapGuides.forEach(g => snappedGuideIds.push(g.id));
    guides.push(...gapGuides);
  }

  return {
    snappedX,
    snappedY,
    dx: finalDx,
    dy: finalDy,
    guides,
    hasSnapped: bestSnapX !== null || bestSnapY !== null,
    snappedAxes: {
      x: bestSnapX !== null,
      y: bestSnapY !== null
    },
    snappedGuideIds
  };
}

/**
 * Detects equal gaps between the moving object and flanking targets (horizontal & vertical).
 */
function detectEqualGapGuides(
  moving: { x: number; y: number; width: number; height: number; centerX: number; centerY: number; right: number; bottom: number },
  candidates: CandidateTarget[],
  threshold: number,
  zoom: number
): SmartGuideLine[] {
  const result: SmartGuideLine[] = [];

  // 1. Horizontal Gaps (Left Target -> Moving -> Right Target)
  const leftCandidates = candidates
    .filter(c => c.bounds.right <= moving.x + threshold)
    .sort((a, b) => b.bounds.right - a.bounds.right);

  const rightCandidates = candidates
    .filter(c => c.bounds.x >= moving.right - threshold)
    .sort((a, b) => a.bounds.x - b.bounds.x);

  if (leftCandidates.length > 0 && rightCandidates.length > 0) {
    const leftTarget = leftCandidates[0].bounds;
    const rightTarget = rightCandidates[0].bounds;

    const gapLeft = moving.x - leftTarget.right;
    const gapRight = rightTarget.x - moving.right;

    if (gapLeft > 10 && gapRight > 10 && Math.abs(gapLeft - gapRight) <= threshold) {
      const avgY = (moving.centerY + leftTarget.centerY + rightTarget.centerY) / 3;
      result.push({
        id: `gap-h-${Math.round(gapLeft)}`,
        orientation: 'horizontal',
        coord: avgY,
        start: leftTarget.right,
        end: rightTarget.x,
        snapType: 'equal-gap',
        label: `Equal Gap: ${Math.round(gapLeft)}px`,
        gapSize: Math.round(gapLeft),
        gapIntervals: [
          { start: leftTarget.right, end: moving.x, coord: avgY },
          { start: moving.right, end: rightTarget.x, coord: avgY }
        ]
      });
    }
  }

  // 2. Vertical Gaps (Top Target -> Moving -> Bottom Target)
  const topCandidates = candidates
    .filter(c => c.bounds.bottom <= moving.y + threshold)
    .sort((a, b) => b.bounds.bottom - a.bounds.bottom);

  const bottomCandidates = candidates
    .filter(c => c.bounds.y >= moving.bottom - threshold)
    .sort((a, b) => a.bounds.y - b.bounds.y);

  if (topCandidates.length > 0 && bottomCandidates.length > 0) {
    const topTarget = topCandidates[0].bounds;
    const bottomTarget = bottomCandidates[0].bounds;

    const gapTop = moving.y - topTarget.bottom;
    const gapBottom = bottomTarget.y - moving.bottom;

    if (gapTop > 10 && gapBottom > 10 && Math.abs(gapTop - gapBottom) <= threshold) {
      const avgX = (moving.centerX + topTarget.centerX + bottomTarget.centerX) / 3;
      result.push({
        id: `gap-v-${Math.round(gapTop)}`,
        orientation: 'vertical',
        coord: avgX,
        start: topTarget.bottom,
        end: bottomTarget.y,
        snapType: 'equal-gap',
        label: `Equal Gap: ${Math.round(gapTop)}px`,
        gapSize: Math.round(gapTop),
        gapIntervals: [
          { start: topTarget.bottom, end: moving.y, coord: avgX },
          { start: moving.bottom, end: bottomTarget.y, coord: avgX }
        ]
      });
    }
  }

  return result;
}

export type ResizeHandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/**
 * Calculates smart guide snapping when resizing an object from a given handle.
 */
export function computeSmartGuidesOnResize(
  initialBounds: { x: number; y: number; width: number; height: number },
  currentCoords: { x: number; y: number },
  handle: ResizeHandlePosition,
  candidates: CandidateTarget[],
  options: {
    snapThreshold?: number;
    zoom?: number;
    maintainAspectRatio?: boolean;
    minDimension?: number;
  } = {}
): SmartResizeSnapResult {
  const zoom = options.zoom || 1;
  const threshold = (options.snapThreshold ?? 6) / zoom;
  const minDim = options.minDimension || 20;

  let x = initialBounds.x;
  let y = initialBounds.y;
  let width = initialBounds.width;
  let height = initialBounds.height;

  let targetX = currentCoords.x;
  let targetY = currentCoords.y;

  const guides: SmartGuideLine[] = [];
  let hasSnapped = false;

  // Horizontal resizing (Handles: w, nw, sw vs e, ne, se)
  if (['e', 'ne', 'se'].includes(handle)) {
    // Modifying East edge (targetX is new right edge)
    let bestSnap: { coord: number; delta: number; label: string; snapType: SmartGuideSnapType } | null = null;

    // Check origin
    if (Math.abs(targetX - 0) <= threshold) {
      bestSnap = { coord: 0, delta: 0 - targetX, label: 'Canvas Center X (0)', snapType: 'origin-axis' };
    }

    // Check candidate targets
    for (const c of candidates) {
      const cb = c.bounds;
      // Edge alignment
      const tests = [
        { coord: cb.right, label: 'Right Edge Align', type: 'edge-edge' as const },
        { coord: cb.x, label: 'Left Edge Align', type: 'edge-edge' as const },
        { coord: cb.centerX, label: 'Center Alignment', type: 'edge-center' as const }
      ];

      for (const t of tests) {
        const delta = t.coord - targetX;
        if (Math.abs(delta) <= threshold) {
          if (!bestSnap || Math.abs(delta) < Math.abs(bestSnap.delta)) {
            bestSnap = { coord: t.coord, delta, label: t.label, snapType: t.type };
          }
        }
      }

      // Check dimension match (width matching another item's width)
      const matchingWidthRight = x + cb.width;
      const widthDelta = matchingWidthRight - targetX;
      if (Math.abs(widthDelta) <= threshold) {
        if (!bestSnap || Math.abs(widthDelta) < Math.abs(bestSnap.delta)) {
          bestSnap = {
            coord: matchingWidthRight,
            delta: widthDelta,
            label: `Width Match: ${Math.round(cb.width)}px`,
            snapType: 'dimension-match'
          };
        }
      }
    }

    if (bestSnap) {
      targetX += bestSnap.delta;
      hasSnapped = true;
      guides.push({
        id: `resize-v-${Math.round(targetX)}`,
        orientation: 'vertical',
        coord: targetX,
        start: Math.min(y - 20, 0),
        end: Math.max(y + height + 20, targetY),
        snapType: bestSnap.snapType,
        label: bestSnap.label,
        subLabel: `W: ${Math.max(minDim, Math.round(targetX - x))}px`
      });
    }

    width = Math.max(minDim, targetX - x);
  } else if (['w', 'nw', 'sw'].includes(handle)) {
    // Modifying West edge (targetX is new left edge)
    const originalRight = initialBounds.x + initialBounds.width;
    let bestSnap: { coord: number; delta: number; label: string; snapType: SmartGuideSnapType } | null = null;

    if (Math.abs(targetX - 0) <= threshold) {
      bestSnap = { coord: 0, delta: 0 - targetX, label: 'Canvas Center X (0)', snapType: 'origin-axis' };
    }

    for (const c of candidates) {
      const cb = c.bounds;
      const tests = [
        { coord: cb.x, label: 'Left Edge Align', type: 'edge-edge' as const },
        { coord: cb.right, label: 'Right Edge Align', type: 'edge-edge' as const },
        { coord: cb.centerX, label: 'Center Alignment', type: 'edge-center' as const }
      ];

      for (const t of tests) {
        const delta = t.coord - targetX;
        if (Math.abs(delta) <= threshold) {
          if (!bestSnap || Math.abs(delta) < Math.abs(bestSnap.delta)) {
            bestSnap = { coord: t.coord, delta, label: t.label, snapType: t.type };
          }
        }
      }
    }

    if (bestSnap) {
      targetX += bestSnap.delta;
      hasSnapped = true;
      guides.push({
        id: `resize-v-${Math.round(targetX)}`,
        orientation: 'vertical',
        coord: targetX,
        start: Math.min(y - 20, 0),
        end: Math.max(y + height + 20, targetY),
        snapType: bestSnap.snapType,
        label: bestSnap.label,
        subLabel: `X: ${Math.round(targetX)}`
      });
    }

    const newWidth = Math.max(minDim, originalRight - targetX);
    x = originalRight - newWidth;
    width = newWidth;
  }

  // Vertical resizing (Handles: s, se, sw vs n, ne, nw)
  if (['s', 'se', 'sw'].includes(handle)) {
    // Modifying South edge (targetY is new bottom edge)
    let bestSnap: { coord: number; delta: number; label: string; snapType: SmartGuideSnapType } | null = null;

    if (Math.abs(targetY - 0) <= threshold) {
      bestSnap = { coord: 0, delta: 0 - targetY, label: 'Canvas Center Y (0)', snapType: 'origin-axis' };
    }

    for (const c of candidates) {
      const cb = c.bounds;
      const tests = [
        { coord: cb.bottom, label: 'Bottom Edge Align', type: 'edge-edge' as const },
        { coord: cb.y, label: 'Top Edge Align', type: 'edge-edge' as const },
        { coord: cb.centerY, label: 'Center Alignment', type: 'edge-center' as const }
      ];

      for (const t of tests) {
        const delta = t.coord - targetY;
        if (Math.abs(delta) <= threshold) {
          if (!bestSnap || Math.abs(delta) < Math.abs(bestSnap.delta)) {
            bestSnap = { coord: t.coord, delta, label: t.label, snapType: t.type };
          }
        }
      }

      // Check dimension match (height matching another item's height)
      const matchingHeightBottom = y + cb.height;
      const heightDelta = matchingHeightBottom - targetY;
      if (Math.abs(heightDelta) <= threshold) {
        if (!bestSnap || Math.abs(heightDelta) < Math.abs(bestSnap.delta)) {
          bestSnap = {
            coord: matchingHeightBottom,
            delta: heightDelta,
            label: `Height Match: ${Math.round(cb.height)}px`,
            snapType: 'dimension-match'
          };
        }
      }
    }

    if (bestSnap) {
      targetY += bestSnap.delta;
      hasSnapped = true;
      guides.push({
        id: `resize-h-${Math.round(targetY)}`,
        orientation: 'horizontal',
        coord: targetY,
        start: Math.min(x - 20, 0),
        end: Math.max(x + width + 20, targetX),
        snapType: bestSnap.snapType,
        label: bestSnap.label,
        subLabel: `H: ${Math.max(minDim, Math.round(targetY - y))}px`
      });
    }

    height = Math.max(minDim, targetY - y);
  } else if (['n', 'ne', 'nw'].includes(handle)) {
    // Modifying North edge (targetY is new top edge)
    const originalBottom = initialBounds.y + initialBounds.height;
    let bestSnap: { coord: number; delta: number; label: string; snapType: SmartGuideSnapType } | null = null;

    if (Math.abs(targetY - 0) <= threshold) {
      bestSnap = { coord: 0, delta: 0 - targetY, label: 'Canvas Center Y (0)', snapType: 'origin-axis' };
    }

    for (const c of candidates) {
      const cb = c.bounds;
      const tests = [
        { coord: cb.y, label: 'Top Edge Align', type: 'edge-edge' as const },
        { coord: cb.bottom, label: 'Bottom Edge Align', type: 'edge-edge' as const },
        { coord: cb.centerY, label: 'Center Alignment', type: 'edge-center' as const }
      ];

      for (const t of tests) {
        const delta = t.coord - targetY;
        if (Math.abs(delta) <= threshold) {
          if (!bestSnap || Math.abs(delta) < Math.abs(bestSnap.delta)) {
            bestSnap = { coord: t.coord, delta, label: t.label, snapType: t.type };
          }
        }
      }
    }

    if (bestSnap) {
      targetY += bestSnap.delta;
      hasSnapped = true;
      guides.push({
        id: `resize-h-${Math.round(targetY)}`,
        orientation: 'horizontal',
        coord: targetY,
        start: Math.min(x - 20, 0),
        end: Math.max(x + width + 20, targetX),
        snapType: bestSnap.snapType,
        label: bestSnap.label,
        subLabel: `Y: ${Math.round(targetY)}`
      });
    }

    const newHeight = Math.max(minDim, originalBottom - targetY);
    y = originalBottom - newHeight;
    height = newHeight;
  }

  return {
    snappedWidth: width,
    snappedHeight: height,
    snappedX: x,
    snappedY: y,
    guides,
    hasSnapped
  };
}

/**
 * Calculates smart guide snapping when interactively drawing a new shape.
 */
export function computeSmartGuidesOnShapeDraw(
  origin: { x: number; y: number },
  current: { x: number; y: number },
  candidates: CandidateTarget[],
  options: {
    snapThreshold?: number;
    zoom?: number;
  } = {}
): {
  snappedCurrent: { x: number; y: number };
  guides: SmartGuideLine[];
  hasSnapped: boolean;
} {
  const zoom = options.zoom || 1;
  const threshold = (options.snapThreshold ?? 6) / zoom;

  let curX = current.x;
  let curY = current.y;
  const guides: SmartGuideLine[] = [];
  let hasSnapped = false;

  // 1. Check X alignment against candidate targets & origin
  let bestX: { coord: number; delta: number; label: string; snapType: SmartGuideSnapType } | null = null;
  if (Math.abs(curX - 0) <= threshold) {
    bestX = { coord: 0, delta: 0 - curX, label: 'Origin X (0)', snapType: 'origin-axis' };
  }

  for (const c of candidates) {
    const cb = c.bounds;
    const tests = [
      { coord: cb.x, label: 'Left Edge Align', type: 'edge-edge' as const },
      { coord: cb.centerX, label: 'Center Alignment', type: 'edge-center' as const },
      { coord: cb.right, label: 'Right Edge Align', type: 'edge-edge' as const }
    ];
    for (const t of tests) {
      const d = t.coord - curX;
      if (Math.abs(d) <= threshold) {
        if (!bestX || Math.abs(d) < Math.abs(bestX.delta)) {
          bestX = { coord: t.coord, delta: d, label: t.label, snapType: t.type };
        }
      }
    }
  }

  if (bestX) {
    curX += bestX.delta;
    hasSnapped = true;
    guides.push({
      id: `shape-draw-v-${Math.round(curX)}`,
      orientation: 'vertical',
      coord: curX,
      start: Math.min(origin.y, curY) - 20,
      end: Math.max(origin.y, curY) + 20,
      snapType: bestX.snapType,
      label: bestX.label,
      subLabel: `W: ${Math.round(Math.abs(curX - origin.x))}px`
    });
  }

  // 2. Check Y alignment against candidate targets & origin
  let bestY: { coord: number; delta: number; label: string; snapType: SmartGuideSnapType } | null = null;
  if (Math.abs(curY - 0) <= threshold) {
    bestY = { coord: 0, delta: 0 - curY, label: 'Origin Y (0)', snapType: 'origin-axis' };
  }

  for (const c of candidates) {
    const cb = c.bounds;
    const tests = [
      { coord: cb.y, label: 'Top Edge Align', type: 'edge-edge' as const },
      { coord: cb.centerY, label: 'Center Alignment', type: 'edge-center' as const },
      { coord: cb.bottom, label: 'Bottom Edge Align', type: 'edge-edge' as const }
    ];
    for (const t of tests) {
      const d = t.coord - curY;
      if (Math.abs(d) <= threshold) {
        if (!bestY || Math.abs(d) < Math.abs(bestY.delta)) {
          bestY = { coord: t.coord, delta: d, label: t.label, snapType: t.type };
        }
      }
    }
  }

  if (bestY) {
    curY += bestY.delta;
    hasSnapped = true;
    guides.push({
      id: `shape-draw-h-${Math.round(curY)}`,
      orientation: 'horizontal',
      coord: curY,
      start: Math.min(origin.x, curX) - 20,
      end: Math.max(origin.x, curX) + 20,
      snapType: bestY.snapType,
      label: bestY.label,
      subLabel: `H: ${Math.round(Math.abs(curY - origin.y))}px`
    });
  }

  return {
    snappedCurrent: { x: curX, y: curY },
    guides,
    hasSnapped
  };
}
