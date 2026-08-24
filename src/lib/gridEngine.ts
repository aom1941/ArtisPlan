import type { CanvasGridSettings, GridPatternType } from '../types';

export const GRID_COLOR_PRESETS = [
  { id: 'auto', name: 'Auto (Adaptive)', color: 'auto', border: 'border-zinc-500' },
  { id: 'cyan', name: 'Electric Cyan', color: '#06B6D4', border: 'border-cyan-500' },
  { id: 'slate', name: 'Cool Slate', color: '#94A3B8', border: 'border-slate-400' },
  { id: 'white', name: 'Pure White', color: '#FFFFFF', border: 'border-zinc-200' },
  { id: 'amber', name: 'Warm Amber', color: '#F59E0B', border: 'border-amber-500' },
  { id: 'rose', name: 'Neon Rose', color: '#F43F5E', border: 'border-rose-500' },
  { id: 'emerald', name: 'Mint Emerald', color: '#10B981', border: 'border-emerald-500' },
  { id: 'violet', name: 'Deep Violet', color: '#8B5CF6', border: 'border-purple-500' }
];

export const GRID_SIZE_PRESETS = [10, 20, 30, 40, 50, 60, 80, 100, 120, 160, 200];

export const DEFAULT_GRID_SETTINGS: CanvasGridSettings = {
  backgroundColor: '#121216',
  gridPattern: 'grid',
  gridSize: 40,
  gridOpacity: 0.25,
  snapToGrid: true,
  gridColor: 'auto',
  subdivisions: 5,
  showCoordinates: false,
  showRulers: false,
  showOriginAxis: true,
  enableSmartGuides: true
};

/**
 * Calculates snapped point based on active grid settings
 */
export function snapPointToGrid(
  point: { x: number; y: number },
  settings: CanvasGridSettings,
  threshold?: number,
  zoom: number = 1
): { x: number; y: number; didSnap: boolean } {
  if (!settings.snapToGrid || settings.gridPattern === 'none') {
    return { x: point.x, y: point.y, didSnap: false };
  }

  const gridSize = Math.max(5, settings.gridSize || 40);

  if (settings.gridPattern === 'isometric' || settings.gridPattern === 'triangular') {
    // Isometric triangular grid vertex snapping
    const h = gridSize * (Math.sqrt(3) / 2);
    const row = Math.round(point.y / h);
    const isOdd = Math.abs(row) % 2 === 1;
    const xOffset = isOdd ? gridSize / 2 : 0;
    const col = Math.round((point.x - xOffset) / gridSize);
    
    const snappedX = col * gridSize + xOffset;
    const snappedY = row * h;

    if (threshold !== undefined && threshold > 0) {
      const dist = Math.hypot(point.x - snappedX, point.y - snappedY);
      if (dist > threshold / zoom) {
        return { x: point.x, y: point.y, didSnap: false };
      }
    }

    return { x: snappedX, y: snappedY, didSnap: true };
  }

  // Standard orthogonal grid, dots, paper, cross, rule-of-thirds
  const snappedX = Math.round(point.x / gridSize) * gridSize;
  const snappedY = Math.round(point.y / gridSize) * gridSize;

  if (threshold !== undefined && threshold > 0) {
    const dist = Math.hypot(point.x - snappedX, point.y - snappedY);
    if (dist > threshold / zoom) {
      return { x: point.x, y: point.y, didSnap: false };
    }
  }

  return { x: snappedX, y: snappedY, didSnap: true };
}

/**
 * Snaps a bounding dimension (width/height) to the nearest grid step
 */
export function snapDimension(dim: number, gridSize: number): number {
  const size = Math.max(5, gridSize || 40);
  const snapped = Math.round(dim / size) * size;
  return Math.max(size, snapped);
}

/**
 * Snaps an entire rectangular bounding box
 */
export function snapBoundingBox(
  box: { x: number; y: number; width: number; height: number },
  settings: CanvasGridSettings
): { x: number; y: number; width: number; height: number } {
  if (!settings.snapToGrid || settings.gridPattern === 'none') {
    return { ...box };
  }

  const gridSize = Math.max(5, settings.gridSize || 40);
  const start = snapPointToGrid({ x: box.x, y: box.y }, settings);
  const width = Math.max(gridSize, Math.round(box.width / gridSize) * gridSize);
  const height = Math.max(gridSize, Math.round(box.height / gridSize) * gridSize);

  return {
    x: start.x,
    y: start.y,
    width,
    height
  };
}

/**
 * Returns RGBA color string based on grid configuration and theme
 */
function resolveGridRgba(
  customColor: string | undefined,
  opacity: number,
  appTheme: string,
  isMajor: boolean = false
): string {
  const effectiveOpacity = Math.min(1, Math.max(0.02, isMajor ? opacity * 1.7 : opacity));

  if (customColor && customColor !== 'auto') {
    // If hex, convert to rgba
    if (customColor.startsWith('#')) {
      let hex = customColor.replace('#', '');
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      const num = parseInt(hex, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${effectiveOpacity})`;
    }
    return customColor;
  }

  // Theme-adaptive default
  if (appTheme === 'light') {
    return isMajor ? `rgba(15, 23, 42, ${effectiveOpacity * 1.4})` : `rgba(30, 41, 59, ${effectiveOpacity})`;
  } else if (appTheme === 'sepia') {
    return isMajor ? `rgba(120, 80, 40, ${effectiveOpacity * 1.5})` : `rgba(140, 100, 60, ${effectiveOpacity})`;
  } else if (appTheme === 'oled') {
    return isMajor ? `rgba(255, 255, 255, ${effectiveOpacity * 1.6})` : `rgba(255, 255, 255, ${effectiveOpacity * 0.9})`;
  } else {
    // dark
    return isMajor ? `rgba(226, 232, 240, ${effectiveOpacity * 1.5})` : `rgba(203, 213, 225, ${effectiveOpacity})`;
  }
}

/**
 * Main High-Performance Grid Rendering Routine
 */
export function renderCanvasGrid(params: {
  ctx: CanvasRenderingContext2D;
  settings: CanvasGridSettings;
  viewportWidth: number;
  viewportHeight: number;
  pan: { x: number; y: number };
  zoom: number;
  theme: string;
  snapIndicatorPoint?: { x: number; y: number } | null;
}) {
  const { ctx, settings, viewportWidth, viewportHeight, pan, zoom, theme, snapIndicatorPoint } = params;

  if (settings.gridPattern === 'none') {
    // If pattern is none but snap indicator or origin axis is requested, still render those
    if (settings.showOriginAxis) {
      renderOriginAxes(ctx, pan, zoom, viewportWidth, viewportHeight, theme);
    }
    if (snapIndicatorPoint && settings.snapToGrid) {
      renderSnapIndicator(ctx, snapIndicatorPoint, settings, zoom, theme);
    }
    return;
  }

  const gridSize = Math.max(5, settings.gridSize || 40);
  const opacity = settings.gridOpacity ?? 0.25;
  const subdivisions = settings.subdivisions ?? 5;

  const baseColor = resolveGridRgba(settings.gridColor, opacity, theme, false);
  const majorColor = resolveGridRgba(settings.gridColor, opacity, theme, true);

  // Viewport bounds in world space
  const startX = Math.floor((-pan.x / zoom) / gridSize) * gridSize - gridSize * 2;
  const startY = Math.floor((-pan.y / zoom) / gridSize) * gridSize - gridSize * 2;
  const endX = startX + (viewportWidth / zoom) + gridSize * 4;
  const endY = startY + (viewportHeight / zoom) + gridSize * 4;

  ctx.save();

  // 1. Render Specific Grid Pattern
  switch (settings.gridPattern) {
    case 'grid': {
      // Orthogonal Graph Grid with Subdivisions
      ctx.lineWidth = Math.max(0.5, 0.75 / zoom);

      // Minor lines
      ctx.beginPath();
      ctx.strokeStyle = baseColor;
      for (let x = startX; x <= endX; x += gridSize) {
        const lineIdx = Math.round(x / gridSize);
        if (subdivisions > 1 && lineIdx % subdivisions === 0) continue; // skip major
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += gridSize) {
        const lineIdx = Math.round(y / gridSize);
        if (subdivisions > 1 && lineIdx % subdivisions === 0) continue; // skip major
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();

      // Major subdivision lines
      if (subdivisions > 1) {
        ctx.beginPath();
        ctx.strokeStyle = majorColor;
        ctx.lineWidth = Math.max(1, 1.25 / zoom);
        for (let x = startX; x <= endX; x += gridSize) {
          const lineIdx = Math.round(x / gridSize);
          if (lineIdx % subdivisions === 0) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
          }
        }
        for (let y = startY; y <= endY; y += gridSize) {
          const lineIdx = Math.round(y / gridSize);
          if (lineIdx % subdivisions === 0) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
          }
        }
        ctx.stroke();
      }
      break;
    }

    case 'dots': {
      // Dot Matrix Grid
      const minorRadius = Math.max(0.8, 1.1 / Math.min(zoom, 1.2));
      const majorRadius = Math.max(1.6, 2.2 / Math.min(zoom, 1.2));

      ctx.fillStyle = baseColor;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        const xIdx = Math.round(x / gridSize);
        const isMajorX = subdivisions > 1 && xIdx % subdivisions === 0;

        for (let y = startY; y <= endY; y += gridSize) {
          const yIdx = Math.round(y / gridSize);
          const isMajor = isMajorX && subdivisions > 1 && yIdx % subdivisions === 0;

          if (!isMajor) {
            ctx.moveTo(x + minorRadius, y);
            ctx.arc(x, y, minorRadius, 0, Math.PI * 2);
          }
        }
      }
      ctx.fill();

      // Major accent dots
      if (subdivisions > 1) {
        ctx.fillStyle = majorColor;
        ctx.beginPath();
        for (let x = startX; x <= endX; x += gridSize) {
          const xIdx = Math.round(x / gridSize);
          if (xIdx % subdivisions !== 0) continue;

          for (let y = startY; y <= endY; y += gridSize) {
            const yIdx = Math.round(y / gridSize);
            if (yIdx % subdivisions === 0) {
              ctx.moveTo(x + majorRadius, y);
              ctx.arc(x, y, majorRadius, 0, Math.PI * 2);
            }
          }
        }
        ctx.fill();
      }
      break;
    }

    case 'cross': {
      // Blueprint Crosshairs
      const arm = Math.min(gridSize * 0.22, Math.max(3, 5 / zoom));
      ctx.lineWidth = Math.max(0.75, 1 / zoom);
      ctx.strokeStyle = baseColor;
      ctx.beginPath();

      for (let x = startX; x <= endX; x += gridSize) {
        for (let y = startY; y <= endY; y += gridSize) {
          // Horizontal tick
          ctx.moveTo(x - arm, y);
          ctx.lineTo(x + arm, y);
          // Vertical tick
          ctx.moveTo(x, y - arm);
          ctx.lineTo(x, y + arm);
        }
      }
      ctx.stroke();

      // Major intersection rings
      if (subdivisions > 1) {
        ctx.strokeStyle = majorColor;
        ctx.lineWidth = Math.max(1, 1.2 / zoom);
        ctx.beginPath();
        for (let x = startX; x <= endX; x += gridSize) {
          const xIdx = Math.round(x / gridSize);
          if (xIdx % subdivisions !== 0) continue;

          for (let y = startY; y <= endY; y += gridSize) {
            const yIdx = Math.round(y / gridSize);
            if (yIdx % subdivisions === 0) {
              const ringR = Math.max(2, 3 / zoom);
              ctx.moveTo(x + ringR, y);
              ctx.arc(x, y, ringR, 0, Math.PI * 2);
            }
          }
        }
        ctx.stroke();
      }
      break;
    }

    case 'isometric': {
      // 30° / 60° Isometric Triangular Grid
      const h = gridSize * (Math.sqrt(3) / 2);
      ctx.lineWidth = Math.max(0.5, 0.75 / zoom);
      ctx.strokeStyle = baseColor;

      ctx.beginPath();
      // Horizontal lines
      for (let y = startY; y <= endY; y += h) {
        ctx.moveTo(startX - viewportWidth, y);
        ctx.lineTo(endX + viewportWidth, y);
      }

      // Diagonal +30° lines (slope = tan(30°) = 1/sqrt(3))
      // and -30° lines
      const diagSpan = (endX - startX) + (endY - startY) * 2;
      for (let offset = -diagSpan; offset <= diagSpan; offset += gridSize) {
        // Line 1: +60° / 30° angle
        ctx.moveTo(offset, startY - viewportHeight);
        ctx.lineTo(offset + (endY - startY + viewportHeight * 2) / Math.tan(Math.PI / 3), endY + viewportHeight);

        // Line 2: -60° / -30° angle
        ctx.moveTo(offset, startY - viewportHeight);
        ctx.lineTo(offset - (endY - startY + viewportHeight * 2) / Math.tan(Math.PI / 3), endY + viewportHeight);
      }
      ctx.stroke();
      break;
    }

    case 'triangular': {
      // Equilateral Triangular Hex Lattice
      const h = gridSize * (Math.sqrt(3) / 2);
      ctx.lineWidth = Math.max(0.5, 0.75 / zoom);
      ctx.strokeStyle = baseColor;
      ctx.beginPath();

      // Horizontal lines
      for (let y = startY; y <= endY; y += h) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }

      // 60-degree slanted diagonals
      const span = (endX - startX) + (endY - startY) * 2;
      for (let d = startX - span; d <= endX + span; d += gridSize) {
        ctx.moveTo(d, startY);
        ctx.lineTo(d + (endY - startY) / Math.sqrt(3), endY);

        ctx.moveTo(d, startY);
        ctx.lineTo(d - (endY - startY) / Math.sqrt(3), endY);
      }
      ctx.stroke();
      break;
    }

    case 'paper': {
      // Ruled Notebook / Artist Paper lines
      ctx.lineWidth = Math.max(0.5, 0.7 / zoom);
      ctx.strokeStyle = baseColor;
      ctx.beginPath();

      const lineGap = gridSize * 1.25;
      for (let y = startY; y <= endY; y += lineGap) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();

      // Red/Warm vertical margin guide line at x = 0
      ctx.strokeStyle = theme === 'light' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(244, 63, 94, 0.3)';
      ctx.lineWidth = Math.max(1, 1.5 / zoom);
      ctx.beginPath();
      ctx.moveTo(0, startY);
      ctx.lineTo(0, endY);
      ctx.stroke();
      break;
    }

    case 'rule-of-thirds': {
      // Rule of Thirds & Golden Ratio Guides
      ctx.lineWidth = Math.max(0.75, 1 / zoom);
      ctx.strokeStyle = baseColor;
      ctx.beginPath();

      // 3x3 Grid centered around origin with frame dimensions based on gridSize * 12
      const frameW = gridSize * 16;
      const frameH = gridSize * 10;
      const frameX = -frameW / 2;
      const frameY = -frameH / 2;

      // Outer Frame
      ctx.strokeRect(frameX, frameY, frameW, frameH);

      // Rule of thirds division lines
      ctx.moveTo(frameX + frameW / 3, frameY);
      ctx.lineTo(frameX + frameW / 3, frameY + frameH);
      ctx.moveTo(frameX + (frameW * 2) / 3, frameY);
      ctx.lineTo(frameX + (frameW * 2) / 3, frameY + frameH);

      ctx.moveTo(frameX, frameY + frameH / 3);
      ctx.lineTo(frameX + frameW, frameY + frameH / 3);
      ctx.moveTo(frameX, frameY + (frameH * 2) / 3);
      ctx.lineTo(frameX + frameW, frameY + (frameH * 2) / 3);
      ctx.stroke();

      // Power point focal target rings
      const junctions = [
        { x: frameX + frameW / 3, y: frameY + frameH / 3 },
        { x: frameX + (frameW * 2) / 3, y: frameY + frameH / 3 },
        { x: frameX + frameW / 3, y: frameY + (frameH * 2) / 3 },
        { x: frameX + (frameW * 2) / 3, y: frameY + (frameH * 2) / 3 }
      ];

      ctx.strokeStyle = majorColor;
      junctions.forEach(j => {
        ctx.beginPath();
        ctx.arc(j.x, j.y, 8 / zoom, 0, Math.PI * 2);
        ctx.stroke();
      });
      break;
    }
  }

  // 2. Render Coordinate Labels if enabled
  if (settings.showCoordinates && (settings.gridPattern === 'grid' || settings.gridPattern === 'dots' || settings.gridPattern === 'cross')) {
    renderCoordinatesOverlay(ctx, startX, startY, endX, endY, gridSize, subdivisions, zoom, theme);
  }

  // 3. Render Origin Axes if enabled
  if (settings.showOriginAxis) {
    renderOriginAxes(ctx, pan, zoom, viewportWidth, viewportHeight, theme);
  }

  // 4. Render Magnetic Snap Target Indicator
  if (snapIndicatorPoint && settings.snapToGrid) {
    renderSnapIndicator(ctx, snapIndicatorPoint, settings, zoom, theme);
  }

  ctx.restore();
}

/**
 * Renders Coordinate Labels at major grid intersections
 */
function renderCoordinatesOverlay(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  gridSize: number,
  subdivisions: number,
  zoom: number,
  theme: string
) {
  const step = gridSize * Math.max(1, subdivisions);
  const fontSize = Math.max(9, Math.min(12, 11 / zoom));
  ctx.font = `${fontSize}px JetBrains Mono, monospace`;
  ctx.fillStyle = theme === 'light' ? 'rgba(100, 116, 139, 0.7)' : 'rgba(148, 163, 184, 0.6)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  for (let x = startX; x <= endX; x += step) {
    for (let y = startY; y <= endY; y += step) {
      if (x === 0 && y === 0) continue; // handled by origin
      const text = `${Math.round(x)},${Math.round(y)}`;
      ctx.fillText(text, x + 3 / zoom, y + 3 / zoom);
    }
  }
}

/**
 * Renders prominent Origin (0,0) Coordinate Axes
 */
function renderOriginAxes(
  ctx: CanvasRenderingContext2D,
  pan: { x: number; y: number },
  zoom: number,
  viewportWidth: number,
  viewportHeight: number,
  theme: string
) {
  const startX = (-pan.x / zoom) - 200;
  const endX = (viewportWidth - pan.x) / zoom + 200;
  const startY = (-pan.y / zoom) - 200;
  const endY = (viewportHeight - pan.y) / zoom + 200;

  ctx.save();

  // X Axis (Red / Coral)
  ctx.strokeStyle = theme === 'light' ? 'rgba(239, 68, 68, 0.65)' : 'rgba(244, 63, 94, 0.75)';
  ctx.lineWidth = Math.max(1.5, 2 / zoom);
  ctx.beginPath();
  ctx.moveTo(startX, 0);
  ctx.lineTo(endX, 0);
  ctx.stroke();

  // Y Axis (Cyan / Emerald)
  ctx.strokeStyle = theme === 'light' ? 'rgba(14, 165, 233, 0.65)' : 'rgba(6, 182, 212, 0.75)';
  ctx.beginPath();
  ctx.moveTo(0, startY);
  ctx.lineTo(0, endY);
  ctx.stroke();

  // Center (0,0) Target Marker
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(2.5, 4 / zoom), 0, Math.PI * 2);
  ctx.fill();

  // Origin Label Badge
  const badgeFont = `${Math.max(10, 12 / zoom)}px Outfit, sans-serif`;
  ctx.font = badgeFont;
  ctx.fillStyle = theme === 'light' ? '#0F172A' : '#F8FAFC';
  ctx.shadowBlur = 4;
  ctx.fillText('(0, 0)', 6 / zoom, -6 / zoom);

  ctx.restore();
}

/**
 * Renders Visual Magnetic Snap Target Indicator & Alignment Guides
 */
function renderSnapIndicator(
  ctx: CanvasRenderingContext2D,
  point: { x: number; y: number },
  settings: CanvasGridSettings,
  zoom: number,
  theme: string
) {
  const { x, y } = point;
  const gridSize = settings.gridSize || 40;
  const guideSpan = gridSize * 4;

  ctx.save();

  // 1. Crosshair alignment ray guides
  ctx.strokeStyle = theme === 'light' ? 'rgba(6, 182, 212, 0.5)' : 'rgba(34, 211, 238, 0.6)';
  ctx.lineWidth = Math.max(1, 1.25 / zoom);
  ctx.setLineDash([4 / zoom, 3 / zoom]);

  ctx.beginPath();
  ctx.moveTo(x - guideSpan, y);
  ctx.lineTo(x + guideSpan, y);
  ctx.moveTo(x, y - guideSpan);
  ctx.lineTo(x, y + guideSpan);
  ctx.stroke();

  // 2. Concentric Target Rings
  ctx.setLineDash([]);
  ctx.strokeStyle = '#06B6D4';
  ctx.lineWidth = Math.max(1.5, 2 / zoom);
  ctx.shadowColor = '#0891B2';
  ctx.shadowBlur = 10;

  // Outer Ring
  ctx.beginPath();
  ctx.arc(x, y, Math.max(6, 9 / zoom), 0, Math.PI * 2);
  ctx.stroke();

  // Inner Core Dot
  ctx.fillStyle = '#22D3EE';
  ctx.beginPath();
  ctx.arc(x, y, Math.max(2, 3 / zoom), 0, Math.PI * 2);
  ctx.fill();

  // 3. Coordinate Pill
  const text = `${Math.round(x)}, ${Math.round(y)}`;
  const fontSize = Math.max(10, 11 / zoom);
  ctx.font = `600 ${fontSize}px JetBrains Mono, monospace`;
  const textMetrics = ctx.measureText(text);
  const padX = 5 / zoom;
  const padY = 3 / zoom;
  const badgeW = textMetrics.width + padX * 2;
  const badgeH = fontSize + padY * 2;
  const badgeX = x + 10 / zoom;
  const badgeY = y + 10 / zoom;

  // Badge background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4 / zoom);
  ctx.fill();
  ctx.stroke();

  // Badge text
  ctx.fillStyle = '#38BDF8';
  ctx.textBaseline = 'top';
  ctx.fillText(text, badgeX + padX, badgeY + padY);

  ctx.restore();
}

/**
 * Screen Rulers Overlay (Top & Left edge rulers)
 */
export function renderCanvasRulers(params: {
  ctx: CanvasRenderingContext2D;
  viewportWidth: number;
  viewportHeight: number;
  pan: { x: number; y: number };
  zoom: number;
  gridSize: number;
  theme: string;
}) {
  const { ctx, viewportWidth, viewportHeight, pan, zoom, gridSize, theme } = params;
  const rulerSize = 24; // px width/height of ruler strip

  ctx.save();
  // Rulers are drawn in screen space (not world space), so no pan/zoom transformation
  const isDark = theme !== 'light';
  const bgColor = isDark ? '#0A0A0E' : '#F1F5F9';
  const borderColor = isDark ? '#1E1E28' : '#CBD5E1';
  const textColor = isDark ? '#64748B' : '#94A3B8';
  const tickColor = isDark ? '#334155' : '#94A3B8';

  // 1. Top Ruler Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(rulerSize, 0, viewportWidth - rulerSize, rulerSize);
  // Left Ruler Background
  ctx.fillRect(0, rulerSize, rulerSize, viewportHeight - rulerSize);
  // Corner junction Box
  ctx.fillStyle = isDark ? '#121218' : '#E2E8F0';
  ctx.fillRect(0, 0, rulerSize, rulerSize);

  // Borders
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rulerSize, rulerSize);
  ctx.lineTo(viewportWidth, rulerSize);
  ctx.moveTo(rulerSize, rulerSize);
  ctx.lineTo(rulerSize, viewportHeight);
  ctx.stroke();

  ctx.font = '9px JetBrains Mono, monospace';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Top Ruler Ticks & Numbers
  const worldStartScreenX = rulerSize;
  const startWorldX = Math.floor((-pan.x + worldStartScreenX) / zoom / gridSize) * gridSize;
  const endWorldX = startWorldX + (viewportWidth / zoom) + gridSize;

  for (let wx = startWorldX; wx <= endWorldX; wx += gridSize) {
    const screenX = wx * zoom + pan.x;
    if (screenX < rulerSize || screenX > viewportWidth) continue;

    const isMajor = wx % (gridSize * 5) === 0 || wx === 0;
    const tickH = isMajor ? 12 : 6;

    ctx.strokeStyle = isMajor ? (isDark ? '#94A3B8' : '#475569') : tickColor;
    ctx.beginPath();
    ctx.moveTo(screenX, rulerSize - tickH);
    ctx.lineTo(screenX, rulerSize);
    ctx.stroke();

    if (isMajor) {
      ctx.fillText(`${Math.round(wx)}`, screenX + 3, rulerSize / 2);
    }
  }

  // Left Ruler Ticks & Numbers
  const startWorldY = Math.floor((-pan.y + rulerSize) / zoom / gridSize) * gridSize;
  const endWorldY = startWorldY + (viewportHeight / zoom) + gridSize;

  for (let wy = startWorldY; wy <= endWorldY; wy += gridSize) {
    const screenY = wy * zoom + pan.y;
    if (screenY < rulerSize || screenY > viewportHeight) continue;

    const isMajor = wy % (gridSize * 5) === 0 || wy === 0;
    const tickW = isMajor ? 12 : 6;

    ctx.strokeStyle = isMajor ? (isDark ? '#94A3B8' : '#475569') : tickColor;
    ctx.beginPath();
    ctx.moveTo(rulerSize - tickW, screenY);
    ctx.lineTo(rulerSize, screenY);
    ctx.stroke();

    if (isMajor) {
      ctx.save();
      ctx.translate(rulerSize / 2, screenY - 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${Math.round(wy)}`, 0, 0);
      ctx.restore();
    }
  }

  // Origin icon in corner
  ctx.fillStyle = '#06B6D4';
  ctx.font = 'bold 9px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PX', rulerSize / 2, rulerSize / 2);

  ctx.restore();
}
