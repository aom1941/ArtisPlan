import type { ProjectData } from '../types';
import type { HeatmapSettings, HotspotCluster } from '../types/heatmap';

// Generate color lookup tables for different heat palettes
function getColorGradientLUT(palette: HeatmapSettings['colorScale']): Uint8ClampedArray {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Uint8ClampedArray(256 * 4);

  const grad = ctx.createLinearGradient(0, 0, 256, 0);

  switch (palette) {
    case 'thermal':
      // Blue -> Cyan -> Green -> Yellow -> Red -> White
      grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.15, 'rgba(30, 64, 175, 0.4)');
      grad.addColorStop(0.35, 'rgba(6, 182, 212, 0.7)');
      grad.addColorStop(0.55, 'rgba(34, 197, 94, 0.85)');
      grad.addColorStop(0.75, 'rgba(234, 179, 8, 0.95)');
      grad.addColorStop(0.9, 'rgba(239, 68, 68, 1)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 1)');
      break;
    case 'cyber_cyan':
      // Deep Navy -> Electric Purple -> Neon Cyan -> White
      grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.2, 'rgba(15, 23, 42, 0.4)');
      grad.addColorStop(0.4, 'rgba(147, 51, 234, 0.75)');
      grad.addColorStop(0.7, 'rgba(6, 182, 212, 0.9)');
      grad.addColorStop(0.9, 'rgba(103, 232, 249, 1)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 1)');
      break;
    case 'inferno':
      // Dark Violet -> Magenta -> Orange -> Bright Gold
      grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.2, 'rgba(76, 29, 149, 0.4)');
      grad.addColorStop(0.45, 'rgba(219, 39, 119, 0.75)');
      grad.addColorStop(0.7, 'rgba(249, 115, 22, 0.9)');
      grad.addColorStop(0.9, 'rgba(251, 191, 36, 1)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 1)');
      break;
    case 'emerald_matrix':
      // Deep Forest -> Jade -> Vibrant Lime -> Glow Mint
      grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.2, 'rgba(6, 78, 59, 0.4)');
      grad.addColorStop(0.45, 'rgba(16, 185, 129, 0.75)');
      grad.addColorStop(0.75, 'rgba(132, 204, 22, 0.9)');
      grad.addColorStop(0.95, 'rgba(167, 243, 208, 1)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 1)');
      break;
    case 'monochrome_glow':
      grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.3, 'rgba(100, 116, 139, 0.5)');
      grad.addColorStop(0.65, 'rgba(203, 213, 225, 0.85)');
      grad.addColorStop(0.9, 'rgba(248, 250, 252, 0.95)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 1)');
      break;
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 1);
  return ctx.getImageData(0, 0, 256, 1).data;
}

// Pre-render a radial blur brush stamp for fast GPU-like alpha accumulation
const stampCache = new Map<number, HTMLCanvasElement>();

function getRadialBrushStamp(radius: number): HTMLCanvasElement {
  const roundedRadius = Math.max(8, Math.round(radius));
  if (stampCache.has(roundedRadius)) {
    return stampCache.get(roundedRadius)!;
  }

  const canvas = document.createElement('canvas');
  const size = roundedRadius * 2;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const radial = ctx.createRadialGradient(
      roundedRadius,
      roundedRadius,
      0,
      roundedRadius,
      roundedRadius,
      roundedRadius
    );
    radial.addColorStop(0, 'rgba(0,0,0,1)');
    radial.addColorStop(0.3, 'rgba(0,0,0,0.6)');
    radial.addColorStop(0.7, 'rgba(0,0,0,0.2)');
    radial.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, size, size);
  }

  stampCache.set(roundedRadius, canvas);
  return canvas;
}

export interface ActivityHeatmapRenderOptions {
  ctx: CanvasRenderingContext2D;
  project: ProjectData;
  settings: HeatmapSettings;
  activeLayerId: string;
  pan: { x: number; y: number };
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * High-performance offscreen Canvas Density Accumulator & Colorizer
 */
export function renderActivityHeatmap({
  ctx,
  project,
  settings,
  activeLayerId,
  pan,
  zoom,
  viewportWidth,
  viewportHeight
}: ActivityHeatmapRenderOptions): void {
  if (!settings.enabled) return;

  const visibleLayerIds = new Set(
    project.layers.filter(l => l.visible).map(l => l.id)
  );

  const now = Date.now();
  const timeLimit = settings.timeWindowMinutes && settings.timeWindowMinutes > 0
    ? now - settings.timeWindowMinutes * 60 * 1000
    : 0;

  // Filter strokes
  const targetStrokes = project.strokes.filter(s => {
    if (!visibleLayerIds.has(s.layerId)) return false;
    if (settings.onlyActiveLayer && s.layerId !== activeLayerId) return false;
    if (timeLimit > 0 && s.createdAt && s.createdAt < timeLimit) return false;
    return true;
  });

  // Calculate offscreen scale (downscale factor for rapid calculation & smooth blur)
  const scaleDown = Math.max(1, Math.min(3, Math.round(1 / zoom)));
  const offWidth = Math.max(64, Math.floor(viewportWidth / scaleDown));
  const offHeight = Math.max(64, Math.floor(viewportHeight / scaleDown));

  const offCanvas = document.createElement('canvas');
  offCanvas.width = offWidth;
  offCanvas.height = offHeight;
  const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
  if (!offCtx) return;

  // Transform offscreen to match viewport transform
  offCtx.save();
  offCtx.scale(1 / scaleDown, 1 / scaleDown);
  offCtx.translate(pan.x, pan.y);
  offCtx.scale(zoom, zoom);

  const stampRadius = Math.max(12, settings.radius);
  const stamp = getRadialBrushStamp(stampRadius);
  const stampOffset = stampRadius;

  // Set alpha accumulation intensity
  const baseAlpha = Math.max(0.04, Math.min(0.8, 0.15 * settings.intensity));
  offCtx.globalAlpha = baseAlpha;
  offCtx.globalCompositeOperation = 'lighter'; // Accumulate brightness

  // 1. Accumulate Stroke Points
  targetStrokes.forEach(stroke => {
    const pts = stroke.points;
    if (!pts || pts.length === 0) return;

    if (settings.metric === 'strokes') {
      // Sample key points along the stroke
      const step = Math.max(1, Math.floor(pts.length / 4));
      for (let i = 0; i < pts.length; i += step) {
        const pt = pts[i];
        offCtx.drawImage(stamp, pt.x - stampOffset, pt.y - stampOffset);
      }
    } else {
      // Metric is 'points' or 'recent_edits' or 'all_objects'
      // Sample every 2nd point for high-resolution density
      for (let i = 0; i < pts.length; i += 2) {
        const pt = pts[i];
        offCtx.drawImage(stamp, pt.x - stampOffset, pt.y - stampOffset);
      }
    }
  });

  // 2. Accumulate other canvas objects if 'all_objects' or 'recent_edits'
  if (settings.metric === 'all_objects' || settings.metric === 'recent_edits') {
    offCtx.globalAlpha = baseAlpha * 1.5;

    // Stickies
    project.stickies.forEach(stk => {
      if (settings.onlyActiveLayer && stk.layerId !== activeLayerId) return;
      if (timeLimit > 0 && stk.createdAt && stk.createdAt < timeLimit) return;
      const cx = stk.x + stk.width / 2;
      const cy = stk.y + stk.height / 2;
      offCtx.drawImage(stamp, cx - stampOffset, cy - stampOffset);
    });

    // Shapes
    project.shapes.forEach(shp => {
      if (settings.onlyActiveLayer && shp.layerId !== activeLayerId) return;
      const cx = shp.x + shp.width / 2;
      const cy = shp.y + shp.height / 2;
      offCtx.drawImage(stamp, cx - stampOffset, cy - stampOffset);
    });

    // Texts
    project.texts.forEach(txt => {
      if (settings.onlyActiveLayer && txt.layerId !== activeLayerId) return;
      offCtx.drawImage(stamp, txt.x - stampOffset + 40, txt.y - stampOffset + 15);
    });

    // Annotations
    project.annotations.forEach(ann => {
      if (settings.onlyActiveLayer && ann.layerId !== activeLayerId) return;
      offCtx.drawImage(stamp, ann.x - stampOffset, ann.y - stampOffset);
    });
  }

  offCtx.restore();

  // Colorize the accumulated grayscale density map
  const imgData = offCtx.getImageData(0, 0, offWidth, offHeight);
  const data = imgData.data;
  const lut = getColorGradientLUT(settings.colorScale);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]; // Alpha accumulator value
    if (alpha > 0) {
      // Map alpha level (0..255) to the gradient palette LUT
      const lutIndex = Math.min(255, Math.floor(alpha)) * 4;
      data[i] = lut[lutIndex]; // R
      data[i + 1] = lut[lutIndex + 1]; // G
      data[i + 2] = lut[lutIndex + 2]; // B
      data[i + 3] = Math.floor(lut[lutIndex + 3] * (alpha / 255) * settings.opacity * 255);
    }
  }

  offCtx.putImageData(imgData, 0, 0);

  // Blit colorized heatmap back onto the main canvas
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(offCanvas, 0, 0, offWidth, offHeight, 0, 0, viewportWidth, viewportHeight);
  ctx.restore();
}

/**
 * Cluster Activity Points into Major Hotspots for Highlighting & Quick-Jumps
 */
export function detectActivityHotspots(
  project: ProjectData,
  activeLayerId: string,
  onlyActiveLayer: boolean = false
): HotspotCluster[] {
  const visibleLayerIds = new Set(
    project.layers.filter(l => l.visible).map(l => l.id)
  );

  const points: Array<{ x: number; y: number; weight: number; time?: number }> = [];

  project.strokes.forEach(s => {
    if (!visibleLayerIds.has(s.layerId)) return;
    if (onlyActiveLayer && s.layerId !== activeLayerId) return;

    const pts = s.points;
    if (!pts || pts.length === 0) return;

    // Use centroid of stroke with weight proportional to point count
    let sumX = 0;
    let sumY = 0;
    pts.forEach(p => {
      sumX += p.x;
      sumY += p.y;
    });

    points.push({
      x: sumX / pts.length,
      y: sumY / pts.length,
      weight: Math.min(10, Math.max(1, pts.length / 5)),
      time: s.createdAt
    });
  });

  // Add notes, shapes, text centroids
  project.stickies.forEach(stk => {
    if (onlyActiveLayer && stk.layerId !== activeLayerId) return;
    points.push({
      x: stk.x + stk.width / 2,
      y: stk.y + stk.height / 2,
      weight: 8,
      time: stk.createdAt
    });
  });

  project.shapes.forEach(shp => {
    if (onlyActiveLayer && shp.layerId !== activeLayerId) return;
    points.push({
      x: shp.x + shp.width / 2,
      y: shp.y + shp.height / 2,
      weight: 6
    });
  });

  project.texts.forEach(txt => {
    if (onlyActiveLayer && txt.layerId !== activeLayerId) return;
    points.push({
      x: txt.x + 50,
      y: txt.y + 20,
      weight: 5
    });
  });

  if (points.length === 0) return [];

  // Simple distance clustering (Grid bucket or radius merge)
  const CLUSTER_RADIUS = 300;
  const rawClusters: Array<{
    x: number;
    y: number;
    weight: number;
    count: number;
    lastActive?: number;
  }> = [];

  points.forEach(pt => {
    let merged = false;
    for (const c of rawClusters) {
      const dist = Math.hypot(c.x - pt.x, c.y - pt.y);
      if (dist < CLUSTER_RADIUS) {
        // Merge with weighted centroid
        const totalWeight = c.weight + pt.weight;
        c.x = (c.x * c.weight + pt.x * pt.weight) / totalWeight;
        c.y = (c.y * c.weight + pt.y * pt.weight) / totalWeight;
        c.weight = totalWeight;
        c.count += 1;
        if (pt.time && (!c.lastActive || pt.time > c.lastActive)) {
          c.lastActive = pt.time;
        }
        merged = true;
        break;
      }
    }

    if (!merged) {
      rawClusters.push({
        x: pt.x,
        y: pt.y,
        weight: pt.weight,
        count: 1,
        lastActive: pt.time
      });
    }
  });

  if (rawClusters.length === 0) return [];

  const maxWeight = Math.max(...rawClusters.map(c => c.weight), 1);

  // Convert to formatted HotspotClusters sorted by density
  return rawClusters
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6)
    .map((c, index) => {
      const densityScore = Math.min(100, Math.round((c.weight / maxWeight) * 100));
      return {
        id: `hotspot-${index + 1}`,
        x: Math.round(c.x),
        y: Math.round(c.y),
        density: densityScore,
        strokeCount: Math.round(c.count * 0.7),
        pointCount: Math.round(c.weight * 5),
        objectCount: c.count,
        lastActiveAt: c.lastActive,
        description:
          index === 0
            ? 'Primary High-Density Focal Area'
            : index === 1
            ? 'Secondary Creation Hotspot'
            : `Focal Region #${index + 1}`
      };
    });
}
