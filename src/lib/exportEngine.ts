import type { 
  ProjectData, 
  DrawingStroke, 
  CanvasShape, 
  CanvasSticky, 
  CanvasText, 
  CanvasAnnotation, 
  CanvasImage 
} from '../types';
import type { HeatmapSettings } from '../types/heatmap';
import { renderCanvasGrid } from './gridEngine';
import { renderAdvancedBrushStroke } from './brushEngine';
import { renderActivityHeatmap } from '../utils/heatmapEngine';

export type ExportFormat = 'png' | 'svg' | 'jpeg' | 'webp';
export type ExportAreaMode = 'viewport' | 'artwork' | 'custom';
export type ExportBackgroundMode = 'theme' | 'transparent' | 'white' | 'dark' | 'oled' | 'sepia' | 'custom';

export interface ExportOptions {
  format: ExportFormat;
  scale: 1 | 2 | 3 | 4; // Multiplier for PNG/JPEG/WebP
  areaMode: ExportAreaMode;
  backgroundMode: ExportBackgroundMode;
  customBackgroundColor?: string;
  includeGrid: boolean;
  includeAnnotations: boolean;
  includeStickies: boolean;
  includeTexts: boolean;
  includeImages: boolean;
  includeHeatmap: boolean;
  selectedLayerIds?: string[]; // If provided, only include these layers
  customBounds?: { x: number; y: number; width: number; height: number };
  padding?: number; // Margin around artwork bounds
  jpegQuality?: number; // 0.1 to 1.0
  customTitle?: string;
}

export interface ExportResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  format: ExportFormat;
  filename: string;
  fileSizeBytes: number;
}

/**
 * Calculates the bounding box of all canvas artwork content
 */
export function calculateArtworkBounds(project: ProjectData, padding: number = 40): {
  x: number;
  y: number;
  width: number;
  height: number;
  isEmpty: boolean;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const visibleLayerIds = new Set(
    project.layers.filter(l => l.visible).map(l => l.id)
  );

  // Strokes
  project.strokes.forEach(stroke => {
    if (!visibleLayerIds.has(stroke.layerId)) return;
    const r = (stroke.size || 4) / 2;
    stroke.points.forEach(pt => {
      minX = Math.min(minX, pt.x - r);
      minY = Math.min(minY, pt.y - r);
      maxX = Math.max(maxX, pt.x + r);
      maxY = Math.max(maxY, pt.y + r);
    });
  });

  // Shapes
  project.shapes.forEach(shape => {
    if (!visibleLayerIds.has(shape.layerId)) return;
    const sMinX = Math.min(shape.x, shape.x + shape.width);
    const sMaxX = Math.max(shape.x, shape.x + shape.width);
    const sMinY = Math.min(shape.y, shape.y + shape.height);
    const sMaxY = Math.max(shape.y, shape.y + shape.height);
    minX = Math.min(minX, sMinX);
    minY = Math.min(minY, sMinY);
    maxX = Math.max(maxX, sMaxX);
    maxY = Math.max(maxY, sMaxY);
  });

  // Texts
  project.texts.forEach(txt => {
    if (!visibleLayerIds.has(txt.layerId)) return;
    minX = Math.min(minX, txt.x);
    minY = Math.min(minY, txt.y);
    maxX = Math.max(maxX, txt.x + Math.max(100, (txt.text.length * (txt.fontSize || 16) * 0.6)));
    maxY = Math.max(maxY, txt.y + (txt.fontSize || 16) * 1.5);
  });

  // Stickies
  project.stickies.forEach(st => {
    if (!visibleLayerIds.has(st.layerId)) return;
    minX = Math.min(minX, st.x);
    minY = Math.min(minY, st.y);
    maxX = Math.max(maxX, st.x + st.width);
    maxY = Math.max(maxY, st.y + st.height);
  });

  // Images
  project.images.forEach(img => {
    if (!visibleLayerIds.has(img.layerId)) return;
    minX = Math.min(minX, img.x);
    minY = Math.min(minY, img.y);
    maxX = Math.max(maxX, img.x + img.width);
    maxY = Math.max(maxY, img.y + img.height);
  });

  // Annotations
  project.annotations.forEach(anno => {
    if (!visibleLayerIds.has(anno.layerId)) return;
    minX = Math.min(minX, anno.x - 20);
    minY = Math.min(minY, anno.y - 20);
    maxX = Math.max(maxX, anno.x + 20);
    maxY = Math.max(maxY, anno.y + 20);
  });

  if (minX === Infinity || minY === Infinity) {
    return {
      x: -400,
      y: -300,
      width: 800,
      height: 600,
      isEmpty: true
    };
  }

  const boundedX = minX - padding;
  const boundedY = minY - padding;
  const boundedW = Math.max(100, (maxX - minX) + padding * 2);
  const boundedH = Math.max(100, (maxY - minY) + padding * 2);

  return {
    x: boundedX,
    y: boundedY,
    width: boundedW,
    height: boundedH,
    isEmpty: false
  };
}

/**
 * Resolves the background hex color for a given theme or background mode
 */
export function getExportBackgroundColor(
  mode: ExportBackgroundMode, 
  theme: string, 
  customColor?: string
): string | null {
  if (mode === 'transparent') return null;
  if (mode === 'custom' && customColor) return customColor;
  if (mode === 'white') return '#FFFFFF';
  if (mode === 'dark') return '#121216';
  if (mode === 'oled') return '#000000';
  if (mode === 'sepia') return '#F5EBE1';

  // Mode is 'theme'
  switch (theme) {
    case 'light': return '#F8FAFC';
    case 'oled': return '#000000';
    case 'sepia': return '#F5EBE1';
    case 'dark':
    default:
      return '#0E0E12';
  }
}

/**
 * High-Resolution PNG / JPEG / WebP Export Engine
 */
export async function renderCanvasToRasterBlob(params: {
  project: ProjectData;
  viewportWidth: number;
  viewportHeight: number;
  pan: { x: number; y: number };
  zoom: number;
  theme: string;
  heatmapSettings?: HeatmapSettings;
  options: ExportOptions;
}): Promise<ExportResult> {
  const { project, viewportWidth, viewportHeight, pan, zoom, theme, heatmapSettings, options } = params;

  let exportBounds = { x: 0, y: 0, width: viewportWidth, height: viewportHeight };
  let renderPan = { ...pan };
  let renderZoom = zoom;

  if (options.areaMode === 'viewport') {
    // Current visible viewport in screen pixels
    exportBounds = {
      x: 0,
      y: 0,
      width: viewportWidth,
      height: viewportHeight
    };
    renderPan = { ...pan };
    renderZoom = zoom;
  } else if (options.areaMode === 'artwork') {
    // Exact artwork bounding box in world coordinates
    const bounds = calculateArtworkBounds(project, options.padding ?? 40);
    exportBounds = {
      x: 0,
      y: 0,
      width: Math.round(bounds.width),
      height: Math.round(bounds.height)
    };
    renderPan = { x: -bounds.x, y: -bounds.y };
    renderZoom = 1;
  } else if (options.areaMode === 'custom' && options.customBounds) {
    exportBounds = {
      x: 0,
      y: 0,
      width: options.customBounds.width,
      height: options.customBounds.height
    };
    renderPan = { x: -options.customBounds.x, y: -options.customBounds.y };
    renderZoom = 1;
  }

  const scale = options.scale || 1;
  const targetWidth = Math.max(1, Math.round(exportBounds.width * scale));
  const targetHeight = Math.max(1, Math.round(exportBounds.height * scale));

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = targetWidth;
  offscreenCanvas.height = targetHeight;
  const ctx = offscreenCanvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create 2D canvas context for export');
  }

  // 1. Fill Background
  const bgColor = getExportBackgroundColor(options.backgroundMode, theme, options.customBackgroundColor);
  if (bgColor && options.format !== 'png') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (bgColor && options.format === 'png' && options.backgroundMode !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    ctx.clearRect(0, 0, targetWidth, targetHeight);
  }

  // Apply Export Scale & Coordinate Transformation
  ctx.save();
  ctx.scale(scale, scale);

  if (options.areaMode === 'viewport') {
    ctx.translate(renderPan.x, renderPan.y);
    ctx.scale(renderZoom, renderZoom);
  } else {
    ctx.translate(renderPan.x, renderPan.y);
  }

  // 2. Render Canvas Grid (if toggled on)
  if (options.includeGrid && project.canvasSettings.gridPattern !== 'none') {
    renderCanvasGrid({
      ctx,
      settings: project.canvasSettings,
      viewportWidth: exportBounds.width,
      viewportHeight: exportBounds.height,
      pan: options.areaMode === 'viewport' ? renderPan : { x: 0, y: 0 },
      zoom: options.areaMode === 'viewport' ? renderZoom : 1,
      theme
    });
  }

  // Filter layers if layerIds specified
  const allowedLayerIds = new Set(
    options.selectedLayerIds || project.layers.filter(l => l.visible).map(l => l.id)
  );

  // 3. Render Reference Images (if toggled on)
  if (options.includeImages && project.images.length > 0) {
    for (const img of project.images) {
      if (!allowedLayerIds.has(img.layerId)) continue;
      try {
        const htmlImg = await loadImageElement(img.src);
        ctx.save();
        ctx.globalAlpha = img.opacity ?? 1.0;
        ctx.drawImage(htmlImg, img.x, img.y, img.width, img.height);
        ctx.restore();
      } catch (err) {
        console.warn('Could not render image onto export canvas:', img.title, err);
      }
    }
  }

  // 4. Render Drawing Strokes
  project.strokes.forEach(stroke => {
    if (!allowedLayerIds.has(stroke.layerId)) return;
    drawExportStroke(ctx, stroke);
  });

  // 5. Render Shapes
  project.shapes.forEach(shape => {
    if (!allowedLayerIds.has(shape.layerId)) return;
    drawExportShape(ctx, shape);
  });

  // 6. Render Heatmap Layer (if toggled on and settings exist)
  if (options.includeHeatmap && heatmapSettings?.enabled) {
    renderActivityHeatmap({
      ctx,
      project,
      settings: heatmapSettings,
      activeLayerId: 'all',
      pan: renderPan,
      zoom: renderZoom,
      viewportWidth: exportBounds.width,
      viewportHeight: exportBounds.height
    });
  }

  // 7. Render Sticky Notes (if toggled on)
  if (options.includeStickies) {
    project.stickies.forEach(sticky => {
      if (!allowedLayerIds.has(sticky.layerId)) return;
      drawExportSticky(ctx, sticky);
    });
  }

  // 8. Render Text Labels (if toggled on)
  if (options.includeTexts) {
    project.texts.forEach(txt => {
      if (!allowedLayerIds.has(txt.layerId)) return;
      drawExportText(ctx, txt);
    });
  }

  // 9. Render Annotations (if toggled on)
  if (options.includeAnnotations) {
    project.annotations.forEach(anno => {
      if (!allowedLayerIds.has(anno.layerId)) return;
      drawExportAnnotation(ctx, anno);
    });
  }

  ctx.restore();

  // Convert to Blob and Data URL
  const mimeType = options.format === 'jpeg' 
    ? 'image/jpeg' 
    : options.format === 'webp' 
    ? 'image/webp' 
    : 'image/png';

  const quality = options.jpegQuality || 0.95;

  const blob = await new Promise<Blob>((resolve, reject) => {
    offscreenCanvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas toBlob failed'));
      },
      mimeType,
      quality
    );
  });

  const dataUrl = offscreenCanvas.toDataURL(mimeType, quality);
  const sanitizedTitle = (project.title || 'ArtisPlan-Canvas').replace(/[^a-zA-Z0-9-_]/g, '_');
  const timestamp = new Date().toISOString().slice(0, 10);
  const scaleTag = scale > 1 ? `@${scale}x` : '';
  const filename = `${sanitizedTitle}-${timestamp}${scaleTag}.${options.format}`;

  return {
    blob,
    dataUrl,
    width: targetWidth,
    height: targetHeight,
    format: options.format,
    filename,
    fileSizeBytes: blob.size
  };
}

/**
 * Standalone High-Fidelity Vector SVG Export Engine
 */
export function renderCanvasToSVG(params: {
  project: ProjectData;
  viewportWidth: number;
  viewportHeight: number;
  pan: { x: number; y: number };
  zoom: number;
  theme: string;
  options: ExportOptions;
}): { svgString: string; filename: string; width: number; height: number; blob: Blob } {
  const { project, viewportWidth, viewportHeight, pan, zoom, theme, options } = params;

  let viewBoxX = 0;
  let viewBoxY = 0;
  let svgWidth = viewportWidth;
  let svgHeight = viewportHeight;

  if (options.areaMode === 'viewport') {
    viewBoxX = -pan.x / zoom;
    viewBoxY = -pan.y / zoom;
    svgWidth = viewportWidth;
    svgHeight = viewportHeight;
  } else if (options.areaMode === 'artwork') {
    const bounds = calculateArtworkBounds(project, options.padding ?? 40);
    viewBoxX = bounds.x;
    viewBoxY = bounds.y;
    svgWidth = bounds.width;
    svgHeight = bounds.height;
  } else if (options.areaMode === 'custom' && options.customBounds) {
    viewBoxX = options.customBounds.x;
    viewBoxY = options.customBounds.y;
    svgWidth = options.customBounds.width;
    svgHeight = options.customBounds.height;
  }

  const allowedLayerIds = new Set(
    options.selectedLayerIds || project.layers.filter(l => l.visible).map(l => l.id)
  );

  const bgColor = getExportBackgroundColor(options.backgroundMode, theme, options.customBackgroundColor);

  const parts: string[] = [];

  // SVG Header with XML declaration & namespace
  parts.push(
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${viewBoxX} ${viewBoxY} ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">`,
    `  <defs>`,
    `    <style>`,
    `      .svg-text { font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }`,
    `      .sticky-font { font-family: system-ui, sans-serif; font-size: 12px; }`,
    `    </style>`
  );

  // Grid pattern definition if requested
  if (options.includeGrid && project.canvasSettings.gridPattern !== 'none') {
    const gridSize = project.canvasSettings.gridSize || 40;
    const gridOpacity = project.canvasSettings.gridOpacity ?? 0.25;
    const gridStrokeColor = theme === 'light' ? `rgba(15,23,42,${gridOpacity})` : `rgba(255,255,255,${gridOpacity})`;

    parts.push(
      `    <pattern id="artisplan-export-grid" width="${gridSize}" height="${gridSize}" patternUnits="userSpaceOnUse">`,
      `      <path d="M ${gridSize} 0 L 0 0 0 ${gridSize}" fill="none" stroke="${gridStrokeColor}" stroke-width="0.75" />`,
      `    </pattern>`
    );
  }

  parts.push(`  </defs>`);

  // Background rect
  if (bgColor && options.backgroundMode !== 'transparent') {
    parts.push(`  <rect x="${viewBoxX}" y="${viewBoxY}" width="${svgWidth}" height="${svgHeight}" fill="${bgColor}" />`);
  }

  // Grid layer
  if (options.includeGrid && project.canvasSettings.gridPattern !== 'none') {
    parts.push(`  <rect x="${viewBoxX}" y="${viewBoxY}" width="${svgWidth}" height="${svgHeight}" fill="url(#artisplan-export-grid)" />`);
  }

  // 1. Reference Images
  if (options.includeImages) {
    project.images.forEach(img => {
      if (!allowedLayerIds.has(img.layerId)) return;
      const safeTitle = escapeXml(img.title || 'Image');
      parts.push(
        `  <!-- Image: ${safeTitle} -->`,
        `  <image href="${escapeXml(img.src)}" x="${img.x}" y="${img.y}" width="${img.width}" height="${img.height}" opacity="${img.opacity ?? 1}" preserveAspectRatio="xMidYMid slice" />`
      );
    });
  }

  // 2. Vector Strokes Group
  parts.push(`  <g id="drawing-strokes">`);
  project.strokes.forEach(stroke => {
    if (!allowedLayerIds.has(stroke.layerId)) return;
    if (stroke.points.length === 0) return;

    if (stroke.points.length === 1) {
      const pt = stroke.points[0];
      parts.push(`    <circle cx="${pt.x}" cy="${pt.y}" r="${stroke.size / 2}" fill="${stroke.color}" opacity="${stroke.opacity}" />`);
      return;
    }

    // Build Bézier Spline Path Data
    const pts = stroke.points;
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      d += ` Q ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}, ${xc.toFixed(2)} ${yc.toFixed(2)}`;
    }
    if (pts.length > 1) {
      const last = pts[pts.length - 1];
      d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
    }

    let strokeWidth = stroke.size;
    let strokeOpacity = stroke.opacity;
    let strokeLineCap = 'round';
    let strokeDash = '';

    if (stroke.tool === 'highlighter') {
      strokeOpacity = 0.35 * stroke.opacity;
      strokeWidth = stroke.size * 3;
      strokeLineCap = 'square';
    } else if (stroke.tool === 'pencil') {
      strokeOpacity = 0.75 * stroke.opacity;
      strokeDash = 'stroke-dasharray="1 2"';
    }

    parts.push(
      `    <path d="${d}" fill="none" stroke="${stroke.color}" stroke-width="${strokeWidth}" stroke-linecap="${strokeLineCap}" stroke-linejoin="round" opacity="${strokeOpacity}" ${strokeDash} />`
    );
  });
  parts.push(`  </g>`);

  // 3. Vector Shapes
  parts.push(`  <g id="canvas-shapes">`);
  project.shapes.forEach(shape => {
    if (!allowedLayerIds.has(shape.layerId)) return;
    const { x, y, width, height, strokeColor, fillColor, strokeWidth } = shape;

    if (shape.shapeType === 'rectangle') {
      parts.push(`    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`);
    } else if (shape.shapeType === 'circle') {
      const rx = Math.abs(width / 2);
      const ry = Math.abs(height / 2);
      const cx = x + width / 2;
      const cy = y + height / 2;
      parts.push(`    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`);
    } else if (shape.shapeType === 'line') {
      parts.push(`    <line x1="${x}" y1="${y}" x2="${x + width}" y2="${y + height}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" />`);
    } else if (shape.shapeType === 'arrow') {
      const tox = x + width;
      const toy = y + height;
      const angle = Math.atan2(toy - y, tox - x);
      const headlen = 16;
      const p1x = tox - headlen * Math.cos(angle - Math.PI / 6);
      const p1y = toy - headlen * Math.sin(angle - Math.PI / 6);
      const p2x = tox - headlen * Math.cos(angle + Math.PI / 6);
      const p2y = toy - headlen * Math.sin(angle + Math.PI / 6);

      parts.push(
        `    <line x1="${x}" y1="${y}" x2="${tox}" y2="${toy}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" />`,
        `    <polygon points="${tox},${toy} ${p1x},${p1y} ${p2x},${p2y}" fill="${strokeColor}" />`
      );
    } else if (shape.shapeType === 'frame') {
      parts.push(
        `    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-dasharray="6 4" />`,
        `    <text x="${x + 8}" y="${y - 8}" fill="${strokeColor}" font-size="12" class="svg-text">Composition Frame</text>`
      );
    }
  });
  parts.push(`  </g>`);

  // 4. Vector Sticky Notes
  if (options.includeStickies) {
    parts.push(`  <g id="sticky-notes">`);
    project.stickies.forEach(st => {
      if (!allowedLayerIds.has(st.layerId)) return;
      const lines = st.text.split('\n');
      const safeAuthor = escapeXml(st.author || 'NOTE');
      parts.push(
        `    <g transform="translate(${st.x}, ${st.y}) rotate(${st.rotation || 0})">`,
        `      <rect x="0" y="0" width="${st.width}" height="${st.height}" rx="12" fill="${st.color}" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))" />`,
        `      <text x="12" y="18" fill="#475569" font-size="10" font-weight="bold" letter-spacing="1" class="svg-text">${safeAuthor}</text>`,
        `      <line x1="12" y1="24" x2="${st.width - 12}" y2="24" stroke="rgba(0,0,0,0.08)" stroke-width="1" />`,
        `      <text x="12" y="42" fill="#1E293B" class="sticky-font">`
      );
      lines.forEach((line, idx) => {
        parts.push(`        <tspan x="12" dy="${idx === 0 ? 0 : 16}">${escapeXml(line)}</tspan>`);
      });
      parts.push(`      </text>`, `    </g>`);
    });
    parts.push(`  </g>`);
  }

  // 5. Vector Texts
  if (options.includeTexts) {
    parts.push(`  <g id="canvas-texts">`);
    project.texts.forEach(txt => {
      if (!allowedLayerIds.has(txt.layerId)) return;
      parts.push(
        `    <text x="${txt.x}" y="${txt.y + (txt.fontSize || 16)}" fill="${txt.color}" font-size="${txt.fontSize || 16}" font-weight="bold" class="svg-text">${escapeXml(txt.text)}</text>`
      );
    });
    parts.push(`  </g>`);
  }

  // 6. Vector Annotations
  if (options.includeAnnotations) {
    parts.push(`  <g id="collaborative-annotations">`);
    project.annotations.forEach(anno => {
      if (!allowedLayerIds.has(anno.layerId)) return;
      const pinColor = anno.color || '#F43F5E';
      parts.push(
        `    <g transform="translate(${anno.x}, ${anno.y})">`,
        `      <circle cx="0" cy="0" r="14" fill="${pinColor}" stroke="#FFFFFF" stroke-width="2.5" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.4))" />`,
        `      <text x="0" y="4" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="bold" class="svg-text">!</text>`,
        `      <rect x="20" y="-12" width="${Math.max(60, anno.title.length * 7 + 16)}" height="24" rx="6" fill="#18181B" stroke="#3F3F46" stroke-width="1" opacity="0.9" />`,
        `      <text x="28" y="4" fill="#F4F4F5" font-size="10" font-weight="500" class="svg-text">${escapeXml(anno.title)}</text>`,
        `    </g>`
      );
    });
    parts.push(`  </g>`);
  }

  parts.push(`</svg>`);

  const svgString = parts.join('\n');
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const sanitizedTitle = (project.title || 'ArtisPlan-Canvas').replace(/[^a-zA-Z0-9-_]/g, '_');
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${sanitizedTitle}-${timestamp}.svg`;

  return {
    svgString,
    filename,
    width: Math.round(svgWidth),
    height: Math.round(svgHeight),
    blob
  };
}

/**
 * Downloads a Blob directly to the user's computer
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Copies a PNG Blob to the system clipboard
 */
export async function copyBlobToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error('ClipboardItem API not supported in this browser');
    }
    const item = new ClipboardItem({ [blob.type]: blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.error('Failed to copy image to clipboard:', err);
    return false;
  }
}

/**
 * Copies SVG text string to system clipboard
 */
export async function copySvgToClipboard(svgString: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(svgString);
    return true;
  } catch (err) {
    console.error('Failed to copy SVG text to clipboard:', err);
    return false;
  }
}

// -------------------------------------------------------------
// INTERNAL DRAWING HELPERS FOR RASTER EXPORT
// -------------------------------------------------------------

function drawExportStroke(ctx: CanvasRenderingContext2D, stroke: DrawingStroke) {
  if (stroke.points.length === 0) return;

  // Handle custom brush presets
  if (stroke.tool === 'brush' && stroke.customDynamics) {
    renderAdvancedBrushStroke(
      ctx,
      stroke.points,
      stroke.color,
      stroke.size,
      stroke.opacity,
      stroke.customDynamics as any,
      1.0
    );
    return;
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
    ctx.setLineDash([1, 1]);
  } else if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = stroke.size * 2;
  } else {
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

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  if (pts.length > 1) {
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawExportShape(ctx: CanvasRenderingContext2D, shape: CanvasShape) {
  ctx.save();
  ctx.strokeStyle = shape.strokeColor;
  ctx.lineWidth = shape.strokeWidth;
  ctx.fillStyle = shape.fillColor;

  const { x, y, width, height } = shape;

  if (shape.shapeType === 'rectangle') {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, width, height, 8);
    } else {
      ctx.rect(x, y, width, height);
    }
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
    const headlen = 16;
    const tox = x + width;
    const toy = y + height;
    const angle = Math.atan2(toy - y, tox - x);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = shape.strokeColor;
    ctx.fill();
  } else if (shape.shapeType === 'frame') {
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
    ctx.fillStyle = shape.strokeColor;
    ctx.font = '12px Outfit, sans-serif';
    ctx.fillText('Frame', x + 6, y - 6);
  }

  ctx.restore();
}

function drawExportSticky(ctx: CanvasRenderingContext2D, sticky: CanvasSticky) {
  ctx.save();
  ctx.translate(sticky.x, sticky.y);
  if (sticky.rotation) {
    ctx.rotate((sticky.rotation * Math.PI) / 180);
  }

  // Sticky Card Shadow & Background
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = sticky.color || '#FEF08A';

  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(0, 0, sticky.width, sticky.height, 12);
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, sticky.width, sticky.height);
  }

  ctx.shadowColor = 'transparent';

  // Author header
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText((sticky.author || 'NOTE').toUpperCase(), 12, 18);

  // Line separator
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(12, 24);
  ctx.lineTo(sticky.width - 12, 24);
  ctx.stroke();

  // Text contents
  ctx.fillStyle = '#1E293B';
  ctx.font = '12px sans-serif';
  const lines = (sticky.text || '').split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, 12, 42 + i * 16);
  });

  ctx.restore();
}

function drawExportText(ctx: CanvasRenderingContext2D, txt: CanvasText) {
  ctx.save();
  ctx.font = `bold ${txt.fontSize || 16}px ${txt.fontFamily || 'Outfit'}, sans-serif`;
  ctx.fillStyle = txt.color || '#FFFFFF';
  ctx.fillText(txt.text, txt.x, txt.y + (txt.fontSize || 16));
  ctx.restore();
}

function drawExportAnnotation(ctx: CanvasRenderingContext2D, anno: CanvasAnnotation) {
  ctx.save();
  ctx.translate(anno.x, anno.y);

  // Pin circle
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fillStyle = anno.color || '#F43F5E';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 6;
  ctx.fill();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Pin symbol
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', 0, 0);

  // Title tag pill
  ctx.textAlign = 'left';
  ctx.font = '500 10px sans-serif';
  const textWidth = ctx.measureText(anno.title).width;
  ctx.fillStyle = 'rgba(24, 24, 27, 0.9)';
  ctx.fillRect(20, -11, textWidth + 14, 22);
  ctx.strokeStyle = '#3F3F46';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, -11, textWidth + 14, 22);

  ctx.fillStyle = '#F4F4F5';
  ctx.fillText(anno.title, 27, 3);

  ctx.restore();
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
