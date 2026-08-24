import type { BrushPreset, BrushShapeType, BrushTextureType, BrushStampConfig, StrokePoint } from '../types';
import { BUILTIN_STAMP_MOTIFS } from './stampLibrary';
import { getOrLoadStampImage, getTintedStampCanvas } from './stampProcessor';

const BRUSHES_STORAGE_KEY = 'artisplan_custom_brushes';
const ACTIVE_BRUSH_ID_KEY = 'artisplan_active_brush_id';

/**
 * Built-in default professional brushes & Stamp Motifs
 */
export const DEFAULT_BRUSH_PRESETS: BrushPreset[] = [
  {
    id: 'brush-master-inker',
    name: 'Master Inker G-Pen',
    category: 'Inking & Lines',
    description: 'Precision Japanese-style manga G-pen with crisp tapered terminals, dynamic pressure taper, and smooth streamline stabilizer.',
    iconName: 'Pen',
    shape: {
      type: 'round',
      hardness: 95,
      roundness: 90,
      angle: 0,
      spacing: 5,
      sizeJitter: 0,
      angleJitter: 0,
      bristleCount: 1
    },
    dynamics: {
      pressureSize: true,
      pressureOpacity: false,
      pressureFlow: true,
      tiltSensitivity: false,
      velocitySensitivity: 15,
      pressureCurve: 'firm',
      minSizeRatio: 0.1
    },
    texture: {
      type: 'smooth',
      scale: 100,
      depth: 0,
      contrast: 0,
      blendMode: 'normal'
    },
    wetness: {
      flow: 95,
      wetEdge: 0,
      smudgeStrength: 0,
      bleedRadius: 0
    },
    stabilizer: {
      streamline: 65,
      taperStart: 20,
      taperEnd: 30,
      snapToLineAssist: false
    }
  },
  {
    id: 'stamp-star-sparkle',
    name: 'Star Galaxy Sparkle Stamp',
    category: 'Stamps & Patterns',
    description: 'Scatter luminous celestial stars and sparkles with pressure-sensitive burst scaling and random angle jitter.',
    iconName: 'Sparkles',
    shape: {
      type: 'stamp',
      hardness: 100,
      roundness: 100,
      angle: 0,
      spacing: 120,
      sizeJitter: 50,
      angleJitter: 80,
      bristleCount: 1
    },
    stamp: {
      enabled: true,
      imageUrl: BUILTIN_STAMP_MOTIFS[0].svgDataUrl,
      name: 'Sparkle Star',
      tintWithColor: true,
      followStrokeDirection: false,
      scatterJitter: 35,
      rotationJitter: 80,
      scaleJitter: 50,
      spacing: 120,
      countPerStep: 1
    },
    dynamics: {
      pressureSize: true,
      pressureOpacity: true,
      pressureFlow: true,
      tiltSensitivity: false,
      velocitySensitivity: 0,
      pressureCurve: 'linear',
      minSizeRatio: 0.2
    },
    texture: {
      type: 'smooth',
      scale: 100,
      depth: 0,
      contrast: 0,
      blendMode: 'normal'
    },
    wetness: {
      flow: 100,
      wetEdge: 0,
      smudgeStrength: 0,
      bleedRadius: 0
    },
    stabilizer: {
      streamline: 15,
      taperStart: 0,
      taperEnd: 0,
      snapToLineAssist: false
    }
  },
  {
    id: 'stamp-sakura-petal',
    name: 'Sakura Petal Flow Stamp',
    category: 'Stamps & Patterns',
    description: 'Organic floral cherry blossom petals tumbling along stroke paths with directional alignment and scattered wind dispersal.',
    iconName: 'Feather',
    shape: {
      type: 'stamp',
      hardness: 100,
      roundness: 100,
      angle: 0,
      spacing: 95,
      sizeJitter: 40,
      angleJitter: 60,
      bristleCount: 1
    },
    stamp: {
      enabled: true,
      imageUrl: BUILTIN_STAMP_MOTIFS[1].svgDataUrl,
      name: 'Sakura Blossom Petal',
      tintWithColor: true,
      followStrokeDirection: true,
      scatterJitter: 45,
      rotationJitter: 60,
      scaleJitter: 40,
      spacing: 95,
      countPerStep: 1
    },
    dynamics: {
      pressureSize: true,
      pressureOpacity: true,
      pressureFlow: true,
      tiltSensitivity: false,
      velocitySensitivity: 10,
      pressureCurve: 'soft',
      minSizeRatio: 0.3
    },
    texture: {
      type: 'smooth',
      scale: 100,
      depth: 0,
      contrast: 0,
      blendMode: 'normal'
    },
    wetness: {
      flow: 90,
      wetEdge: 0,
      smudgeStrength: 0,
      bleedRadius: 0
    },
    stabilizer: {
      streamline: 25,
      taperStart: 5,
      taperEnd: 5,
      snapToLineAssist: false
    }
  },
  {
    id: 'stamp-chain-link',
    name: 'Chain Link Stitched Ribbon',
    category: 'Stamps & Patterns',
    description: 'Precision continuous ribbon chain that automatically rotates to follow pen stroke curves and corners.',
    iconName: 'Sliders',
    shape: {
      type: 'stamp',
      hardness: 100,
      roundness: 100,
      angle: 0,
      spacing: 55,
      sizeJitter: 0,
      angleJitter: 0,
      bristleCount: 1
    },
    stamp: {
      enabled: true,
      imageUrl: BUILTIN_STAMP_MOTIFS[3].svgDataUrl,
      name: 'Chain Link Ribbon',
      tintWithColor: true,
      followStrokeDirection: true,
      scatterJitter: 0,
      rotationJitter: 0,
      scaleJitter: 0,
      spacing: 55,
      countPerStep: 1
    },
    dynamics: {
      pressureSize: true,
      pressureOpacity: false,
      pressureFlow: false,
      tiltSensitivity: false,
      velocitySensitivity: 0,
      pressureCurve: 'linear',
      minSizeRatio: 0.4
    },
    texture: {
      type: 'smooth',
      scale: 100,
      depth: 0,
      contrast: 0,
      blendMode: 'normal'
    },
    wetness: {
      flow: 100,
      wetEdge: 0,
      smudgeStrength: 0,
      bleedRadius: 0
    },
    stabilizer: {
      streamline: 60,
      taperStart: 0,
      taperEnd: 0,
      snapToLineAssist: false
    }
  },
  {
    id: 'stamp-ink-splatter',
    name: 'Ink Splash & Splatter Stamp',
    category: 'Stamps & Patterns',
    description: 'High-contrast organic ink splotches and chaotic micro-droplets for raw expressive artwork and manga effects.',
    iconName: 'Droplets',
    shape: {
      type: 'stamp',
      hardness: 100,
      roundness: 100,
      angle: 0,
      spacing: 160,
      sizeJitter: 60,
      angleJitter: 100,
      bristleCount: 1
    },
    stamp: {
      enabled: true,
      imageUrl: BUILTIN_STAMP_MOTIFS[4].svgDataUrl,
      name: 'Ink Splash & Splatter',
      tintWithColor: true,
      followStrokeDirection: false,
      scatterJitter: 40,
      rotationJitter: 100,
      scaleJitter: 60,
      spacing: 160,
      countPerStep: 1
    },
    dynamics: {
      pressureSize: true,
      pressureOpacity: true,
      pressureFlow: true,
      tiltSensitivity: false,
      velocitySensitivity: 25,
      pressureCurve: 'firm',
      minSizeRatio: 0.15
    },
    texture: {
      type: 'smooth',
      scale: 100,
      depth: 0,
      contrast: 0,
      blendMode: 'normal'
    },
    wetness: {
      flow: 100,
      wetEdge: 0,
      smudgeStrength: 0,
      bleedRadius: 0
    },
    stabilizer: {
      streamline: 10,
      taperStart: 0,
      taperEnd: 0,
      snapToLineAssist: false
    }
  },
  {
    id: 'brush-rough-charcoal',
    name: 'Rough 2B Charcoal Stick',
    category: 'Pencils & Charcoal',
    description: 'Rich granular graphite with authentic tooth texture, tilt shading, and pressure-sensitive tooth catching.',
    iconName: 'Pencil',
    shape: {
      type: 'charcoal',
      hardness: 55,
      roundness: 75,
      angle: 35,
      spacing: 12,
      sizeJitter: 15,
      angleJitter: 10,
      bristleCount: 1
    },
    dynamics: {
      pressureSize: true,
      pressureOpacity: true,
      pressureFlow: true,
      tiltSensitivity: true,
      velocitySensitivity: -10,
      pressureCurve: 'linear',
      minSizeRatio: 0.25
    },
    texture: {
      type: 'rough_charcoal',
      scale: 120,
      depth: 70,
      contrast: 60,
      blendMode: 'multiply'
    },
    wetness: {
      flow: 75,
      wetEdge: 0,
      smudgeStrength: 15,
      bleedRadius: 0
    },
    stabilizer: {
      streamline: 15,
      taperStart: 10,
      taperEnd: 15,
      snapToLineAssist: false
    }
  },
  {
    id: 'brush-impasto-oils',
    name: 'Impasto Heavy Oils',
    category: 'Oils & Acrylics',
    description: 'Thick painterly strokes with rich bristle rake streaks, wet blending with existing paint, and tactile body.',
    iconName: 'Paintbrush',
    shape: {
      type: 'dry_bristle',
      hardness: 80,
      roundness: 60,
      angle: 25,
      spacing: 6,
      sizeJitter: 5,
      angleJitter: 5,
      bristleCount: 12
    },
    dynamics: {
      pressureSize: true,
      pressureOpacity: true,
      pressureFlow: true,
      tiltSensitivity: true,
      velocitySensitivity: 0,
      pressureCurve: 'soft',
      minSizeRatio: 0.35
    },
    texture: {
      type: 'linen_canvas',
      scale: 140,
      depth: 55,
      contrast: 40,
      blendMode: 'normal'
    },
    wetness: {
      flow: 90,
      wetEdge: 10,
      smudgeStrength: 45,
      bleedRadius: 2
    },
    stabilizer: {
      streamline: 35,
      taperStart: 5,
      taperEnd: 10,
      snapToLineAssist: false
    }
  },
  {
    id: 'brush-watercolor-glaze',
    name: 'Glaze Watercolor Mop',
    category: 'Watercolor & Wash',
    description: 'Translucent luminous watercolor wash featuring rich pigment pooling at wet edges and authentic paper grain absorption.',
    iconName: 'Sparkles',
    shape: {
      type: 'round',
      hardness: 35,
      roundness: 95,
      angle: 0,
      spacing: 8,
      sizeJitter: 8,
      angleJitter: 0,
      bristleCount: 1
    },
    dynamics: {
      pressureSize: true,
      pressureOpacity: true,
      pressureFlow: true,
      tiltSensitivity: true,
      velocitySensitivity: -20,
      pressureCurve: 's_curve',
      minSizeRatio: 0.4
    },
    texture: {
      type: 'watercolor_paper',
      scale: 150,
      depth: 80,
      contrast: 50,
      blendMode: 'multiply'
    },
    wetness: {
      flow: 50,
      wetEdge: 75,
      smudgeStrength: 60,
      bleedRadius: 8
    },
    stabilizer: {
      streamline: 40,
      taperStart: 15,
      taperEnd: 25,
      snapToLineAssist: false
    }
  },
  {
    id: 'brush-chisel-calligraphy',
    name: 'Chisel Calligraphy Nib',
    category: 'Inking & Lines',
    description: 'Crisp flat edged chisel nib locked at 45 degrees for dramatic thick-and-thin rhythm and architectural lettering.',
    iconName: 'Pen',
    shape: {
      type: 'calligraphy',
      hardness: 100,
      roundness: 20,
      angle: 45,
      spacing: 4,
      sizeJitter: 0,
      angleJitter: 0,
      bristleCount: 1
    },
    dynamics: {
      pressureSize: true,
      pressureOpacity: false,
      pressureFlow: true,
      tiltSensitivity: false,
      velocitySensitivity: 10,
      pressureCurve: 'firm',
      minSizeRatio: 0.2
    },
    texture: {
      type: 'smooth',
      scale: 100,
      depth: 0,
      contrast: 0,
      blendMode: 'normal'
    },
    wetness: {
      flow: 100,
      wetEdge: 0,
      smudgeStrength: 0,
      bleedRadius: 0
    },
    stabilizer: {
      streamline: 55,
      taperStart: 10,
      taperEnd: 15,
      snapToLineAssist: false
    }
  },
  {
    id: 'brush-soft-airbrush',
    name: 'Atmospheric Cloud Airbrush',
    category: 'Special & FX',
    description: 'Ultra-diffused soft radial spray with micro-particle spray jitter for atmospheric lighting, rim glow, and smooth volume gradations.',
    iconName: 'Sparkles',
    shape: {
      type: 'airbrush',
      hardness: 10,
      roundness: 100,
      angle: 0,
      spacing: 15,
      sizeJitter: 12,
      angleJitter: 0,
      bristleCount: 1
    },
    dynamics: {
      pressureSize: true,
      pressureOpacity: true,
      pressureFlow: true,
      tiltSensitivity: false,
      velocitySensitivity: 0,
      pressureCurve: 'soft',
      minSizeRatio: 0.5
    },
    texture: {
      type: 'noise',
      scale: 80,
      depth: 30,
      contrast: 20,
      blendMode: 'normal'
    },
    wetness: {
      flow: 35,
      wetEdge: 0,
      smudgeStrength: 0,
      bleedRadius: 0
    },
    stabilizer: {
      streamline: 25,
      taperStart: 10,
      taperEnd: 10,
      snapToLineAssist: false
    }
  },
  {
    id: 'brush-fan-bristle',
    name: 'Dry Fan Palette Rake',
    category: 'Oils & Acrylics',
    description: 'Splatter and multi-hair fan brush ideal for foliage, hair strands, texture scumbling, and fur shading.',
    iconName: 'Paintbrush',
    shape: {
      type: 'fan',
      hardness: 85,
      roundness: 35,
      angle: 90,
      spacing: 18,
      sizeJitter: 25,
      angleJitter: 15,
      bristleCount: 16
    },
    dynamics: {
      pressureSize: true,
      pressureOpacity: true,
      pressureFlow: true,
      tiltSensitivity: true,
      velocitySensitivity: 20,
      pressureCurve: 'linear',
      minSizeRatio: 0.3
    },
    texture: {
      type: 'linen_canvas',
      scale: 130,
      depth: 60,
      contrast: 50,
      blendMode: 'normal'
    },
    wetness: {
      flow: 80,
      wetEdge: 0,
      smudgeStrength: 20,
      bleedRadius: 0
    },
    stabilizer: {
      streamline: 20,
      taperStart: 10,
      taperEnd: 15,
      snapToLineAssist: false
    }
  },
  {
    id: 'brush-halftone-stipple',
    name: 'Manga Screentone Stipple',
    category: 'Special & FX',
    description: 'Retro comic halftone dot dispersion responding organically to stylus pressure and velocity for retro sci-fi shading.',
    iconName: 'Sparkles',
    shape: {
      type: 'halftone',
      hardness: 100,
      roundness: 100,
      angle: 45,
      spacing: 35,
      sizeJitter: 40,
      angleJitter: 20,
      bristleCount: 8
    },
    dynamics: {
      pressureSize: true,
      pressureOpacity: true,
      pressureFlow: false,
      tiltSensitivity: false,
      velocitySensitivity: 30,
      pressureCurve: 'firm',
      minSizeRatio: 0.15
    },
    texture: {
      type: 'halftone_dots',
      scale: 100,
      depth: 90,
      contrast: 80,
      blendMode: 'normal'
    },
    wetness: {
      flow: 100,
      wetEdge: 0,
      smudgeStrength: 0,
      bleedRadius: 0
    },
    stabilizer: {
      streamline: 10,
      taperStart: 5,
      taperEnd: 5,
      snapToLineAssist: false
    }
  }
];

/**
 * Load all custom and preset brushes.
 */
export const loadAllBrushPresets = (): BrushPreset[] => {
  try {
    const raw = localStorage.getItem(BRUSHES_STORAGE_KEY);
    if (raw) {
      const custom: BrushPreset[] = JSON.parse(raw);
      if (Array.isArray(custom)) {
        return [...DEFAULT_BRUSH_PRESETS, ...custom];
      }
    }
  } catch (err) {
    console.warn("Could not load custom brushes:", err);
  }
  return DEFAULT_BRUSH_PRESETS;
};

/**
 * Save custom brushes list to localStorage.
 */
export const saveCustomBrush = (brush: BrushPreset): BrushPreset[] => {
  const all = loadAllBrushPresets();
  const customOnly = all.filter(b => b.isCustom && b.id !== brush.id);
  customOnly.push({ ...brush, isCustom: true, updatedAt: new Date().toISOString() } as any);
  
  localStorage.setItem(BRUSHES_STORAGE_KEY, JSON.stringify(customOnly));
  return [...DEFAULT_BRUSH_PRESETS, ...customOnly];
};

/**
 * Delete a custom brush.
 */
export const deleteCustomBrush = (brushId: string): BrushPreset[] => {
  const all = loadAllBrushPresets();
  const customOnly = all.filter(b => b.isCustom && b.id !== brushId);
  localStorage.setItem(BRUSHES_STORAGE_KEY, JSON.stringify(customOnly));
  return [...DEFAULT_BRUSH_PRESETS, ...customOnly];
};

/**
 * Duplicate a brush preset to create a new custom brush.
 */
export const duplicateBrushPreset = (preset: BrushPreset): BrushPreset => {
  const newId = `custom-brush-${Date.now()}`;
  return {
    ...JSON.parse(JSON.stringify(preset)),
    id: newId,
    name: `${preset.name} (Copy)`,
    category: 'Custom',
    isCustom: true,
    author: 'You',
    createdAt: new Date().toISOString()
  };
};

/**
 * Get active brush from localStorage or default.
 */
export const getActiveBrushPreset = (): BrushPreset => {
  const all = loadAllBrushPresets();
  const activeId = localStorage.getItem(ACTIVE_BRUSH_ID_KEY);
  if (activeId) {
    const found = all.find(b => b.id === activeId);
    if (found) return found;
  }
  return DEFAULT_BRUSH_PRESETS[0];
};

/**
 * Set active brush preset.
 */
export const setActiveBrushPreset = (brushId: string) => {
  localStorage.setItem(ACTIVE_BRUSH_ID_KEY, brushId);
};

/**
 * Export a brush preset to a downloadable .artbrush.json file.
 */
export const exportBrushPreset = (brush: BrushPreset) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(brush, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  const cleanName = brush.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  downloadAnchor.setAttribute("download", `${cleanName}.artbrush.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

/**
 * Import a brush preset from JSON text or file.
 */
export const importBrushPreset = (jsonStr: string): BrushPreset => {
  const parsed = JSON.parse(jsonStr);
  if (!parsed.name || !parsed.shape || !parsed.dynamics) {
    throw new Error("Invalid ArtBrush configuration file format.");
  }
  const importedBrush: BrushPreset = {
    ...parsed,
    id: `imported-brush-${Date.now()}`,
    category: 'Custom',
    isCustom: true,
    createdAt: new Date().toISOString()
  };
  saveCustomBrush(importedBrush);
  return importedBrush;
};

/**
 * Streamline / Bézier smoothing filter for stroke points
 */
export const applyStreamlineSmoothing = (points: StrokePoint[], smoothingFactor: number): StrokePoint[] => {
  if (points.length <= 2 || smoothingFactor <= 0) return points;
  
  const factor = Math.min(0.9, smoothingFactor / 100);
  const smoothed: StrokePoint[] = [{ ...points[0] }];

  for (let i = 1; i < points.length; i++) {
    const prev = smoothed[i - 1];
    const curr = points[i];
    
    smoothed.push({
      x: prev.x + (curr.x - prev.x) * (1 - factor),
      y: prev.y + (curr.y - prev.y) * (1 - factor),
      pressure: curr.pressure
    });
  }

  return smoothed;
};

/**
 * Render dynamic procedural brush stamp on a 2D canvas context
 */
export const renderAdvancedBrushStroke = (
  ctx: CanvasRenderingContext2D,
  points: StrokePoint[],
  color: string,
  baseSize: number,
  baseOpacity: number,
  brush: BrushPreset,
  pressureSensitivity: number = 1.0
) => {
  if (points.length === 0) return;

  ctx.save();

  // Apply blend mode
  if (brush.texture.blendMode === 'multiply') {
    ctx.globalCompositeOperation = 'multiply';
  } else if (brush.texture.blendMode === 'screen') {
    ctx.globalCompositeOperation = 'screen';
  } else if (brush.texture.blendMode === 'color_dodge') {
    ctx.globalCompositeOperation = 'color-dodge';
  } else {
    ctx.globalCompositeOperation = 'source-over';
  }

  // Smooth points using streamline if configured
  const smoothedPoints = brush.stabilizer.streamline > 0 
    ? applyStreamlineSmoothing(points, brush.stabilizer.streamline)
    : points;

  // -------------------------------------------------------------
  // Stamp Brush Rendering (Image / Motif Based Repeated Patterns)
  // -------------------------------------------------------------
  if (brush.shape.type === 'stamp' || (brush.stamp && brush.stamp.enabled && brush.stamp.imageUrl)) {
    const stampConfig = brush.stamp || {
      enabled: true,
      imageUrl: '',
      tintWithColor: true,
      followStrokeDirection: false,
      scatterJitter: 0,
      rotationJitter: 0,
      scaleJitter: 0,
      spacing: brush.shape.spacing || 100,
      countPerStep: 1
    };

    // Obtain stamp image (tinted canvas or raw image element)
    let stampSource: HTMLCanvasElement | HTMLImageElement | null = null;
    if (stampConfig.imageUrl) {
      if (stampConfig.tintWithColor) {
        stampSource = getTintedStampCanvas(stampConfig.imageUrl, color, stampConfig.invertMask);
      } else {
        stampSource = getOrLoadStampImage(stampConfig.imageUrl);
      }
    }

    // Fallback if image is still loading: draw a pleasant stylized motif
    const drawStampAt = (
      px: number,
      py: number,
      size: number,
      angleRad: number,
      opacity: number
    ) => {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angleRad);
      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

      if (stampSource) {
        ctx.drawImage(stampSource, -size / 2, -size / 2, size, size);
      } else {
        // Fallback procedural diamond/star while image preloads
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const baseAngleRad = (brush.shape.angle * Math.PI) / 180;
    const countPerStep = stampConfig.countPerStep || 1;

    // Single Tap / Click Point
    if (smoothedPoints.length === 1) {
      const pt = smoothedPoints[0];
      const pres = pt.pressure || 0.6;
      const stampSize = Math.max(
        4,
        baseSize * (brush.dynamics.pressureSize ? 0.3 + pres * pressureSensitivity * 0.7 : 1)
      );
      const stampOpacity =
        baseOpacity *
        (brush.dynamics.pressureOpacity ? pres : 1) *
        (brush.wetness.flow / 100);

      drawStampAt(pt.x, pt.y, stampSize, baseAngleRad, stampOpacity);
      ctx.restore();
      return;
    }

    // Multi-Point Continuous Path: Step Interpolation along segments
    const stepDistance = Math.max(
      4,
      baseSize * ((stampConfig.spacing || brush.shape.spacing || 100) / 100)
    );

    let accumulatedDist = 0;
    let nextStampDist = 0;

    for (let i = 0; i < smoothedPoints.length - 1; i++) {
      const p1 = smoothedPoints[i];
      const p2 = smoothedPoints[i + 1];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segLength = Math.hypot(dx, dy);

      if (segLength === 0) continue;

      const dirAngle = Math.atan2(dy, dx);
      const nx = -dy / segLength;
      const ny = dx / segLength;

      let segPos = 0;

      while (accumulatedDist + segLength >= nextStampDist) {
        segPos = nextStampDist - accumulatedDist;
        const t = Math.max(0, Math.min(1, segPos / segLength));

        const curX = p1.x + dx * t;
        const curY = p1.y + dy * t;
        const pres1 = p1.pressure || 0.5;
        const pres2 = p2.pressure || 0.5;
        const pres = pres1 + (pres2 - pres1) * t;

        // Angle Calculation (Tangential to stroke direction + angle jitter)
        const seed = Math.sin(nextStampDist * 12.9898);
        const rotJitterRad = ((stampConfig.rotationJitter || brush.shape.angleJitter || 0) / 100) * Math.PI * seed;
        const strokeAngle = stampConfig.followStrokeDirection ? dirAngle : 0;
        const totalAngle = baseAngleRad + strokeAngle + rotJitterRad;

        // Scale & Pressure Modulation
        const scaleSeed = Math.cos(nextStampDist * 43.123);
        const scaleJitter = 1 + scaleSeed * ((stampConfig.scaleJitter || brush.shape.sizeJitter || 0) / 100) * 0.5;
        const pressureScale = brush.dynamics.pressureSize
          ? 0.3 + pres * pressureSensitivity * 0.7
          : 1;
        const stampSize = Math.max(3, baseSize * pressureScale * Math.max(0.1, scaleJitter));

        const stampOpacity =
          baseOpacity *
          (brush.dynamics.pressureOpacity ? pres : 1) *
          (brush.wetness.flow / 100);

        // Perpendicular Scatter Displacement
        const scatterSeed = Math.sin(nextStampDist * 78.233);
        const scatterDist =
          scatterSeed * ((stampConfig.scatterJitter || 0) / 100) * (baseSize * 0.85);

        const finalX = curX + nx * scatterDist;
        const finalY = curY + ny * scatterDist;

        // Draw primary stamp
        drawStampAt(finalX, finalY, stampSize, totalAngle, stampOpacity);

        // If multi-count clustering is enabled (e.g. 2-5 instances per step)
        if (countPerStep > 1) {
          for (let c = 1; c < countPerStep; c++) {
            const subSeed = Math.cos(nextStampDist * (c + 1) * 31.415);
            const subScatter = subSeed * (baseSize * 0.4);
            const subAngle = totalAngle + subSeed * 0.5;
            const subSize = stampSize * (0.6 + Math.abs(subSeed) * 0.4);
            drawStampAt(
              finalX + nx * subScatter + (Math.random() - 0.5) * (baseSize * 0.2),
              finalY + ny * subScatter + (Math.random() - 0.5) * (baseSize * 0.2),
              subSize,
              subAngle,
              stampOpacity * 0.85
            );
          }
        }

        nextStampDist += stepDistance;
      }

      accumulatedDist += segLength;
    }

    ctx.restore();
    return;
  }

  // Single Point (Click / Tap) for non-stamp brushes
  if (smoothedPoints.length === 1) {
    const pt = smoothedPoints[0];
    const pres = pt.pressure || 0.5;
    const radius = Math.max(1, (baseSize / 2) * (brush.dynamics.pressureSize ? pres * pressureSensitivity : 1));
    const opacity = baseOpacity * (brush.dynamics.pressureOpacity ? pres : 1) * (brush.wetness.flow / 100);

    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;

    if (brush.shape.type === 'calligraphy' || brush.shape.type === 'chisel') {
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate((brush.shape.angle * Math.PI) / 180);
      ctx.fillRect(-radius, -radius * (brush.shape.roundness / 100), radius * 2, radius * 2 * (brush.shape.roundness / 100));
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    return;
  }

  // Multi-point stroke rendering with stamp spacing and bristle fibers
  const bristleCount = brush.shape.bristleCount || 1;
  const isMultiBristle = bristleCount > 1 && (brush.shape.type === 'dry_bristle' || brush.shape.type === 'fan');

  if (isMultiBristle) {
    // Multi-fiber bristle simulation
    const fiberOffsets = Array.from({ length: bristleCount }, (_, i) => {
      const offsetRatio = (i / (bristleCount - 1) - 0.5) * 2;
      return offsetRatio;
    });

    fiberOffsets.forEach((ratio) => {
      ctx.save();
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;

      const fiberWidth = Math.max(1, (baseSize / bristleCount) * 1.5);
      ctx.lineWidth = fiberWidth;
      ctx.globalAlpha = baseOpacity * (brush.wetness.flow / 100) * 0.7;

      for (let i = 0; i < smoothedPoints.length - 1; i++) {
        const p1 = smoothedPoints[i];
        const p2 = smoothedPoints[i + 1];
        
        // Calculate normal vector perpendicular to direction
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;

        const offsetDist = ratio * (baseSize * 0.45);
        const fx1 = p1.x + nx * offsetDist;
        const fy1 = p1.y + ny * offsetDist;
        const fx2 = p2.x + nx * offsetDist;
        const fy2 = p2.y + ny * offsetDist;

        if (i === 0) ctx.moveTo(fx1, fy1);
        ctx.lineTo(fx2, fy2);
      }
      ctx.stroke();
      ctx.restore();
    });
  } else if (brush.shape.type === 'charcoal' || brush.texture.type === 'rough_charcoal') {
    // Charcoal Grain Texture rendering
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.globalAlpha = baseOpacity * 0.85 * (brush.wetness.flow / 100);

    for (let i = 0; i < smoothedPoints.length - 1; i++) {
      const p1 = smoothedPoints[i];
      const p2 = smoothedPoints[i + 1];
      const pres = p1.pressure || 0.5;
      const pressureWidth = brush.dynamics.pressureSize 
        ? Math.max(1, baseSize * (0.4 + pres * pressureSensitivity * 0.8))
        : baseSize;

      ctx.lineWidth = pressureWidth;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Granular tooth particles
      const stepDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const particleCount = Math.floor(stepDist / 4);
      for (let k = 0; k < particleCount; k++) {
        const t = k / particleCount;
        const px = p1.x + (p2.x - p1.x) * t + (Math.random() - 0.5) * pressureWidth * 0.8;
        const py = p1.y + (p2.y - p1.y) * t + (Math.random() - 0.5) * pressureWidth * 0.8;
        ctx.fillStyle = color;
        ctx.globalAlpha = baseOpacity * (0.2 + Math.random() * 0.5);
        ctx.fillRect(px, py, 1.5, 1.5);
      }
    }
  } else if (brush.wetness.wetEdge > 20) {
    // Watercolor with Darker Bleeding Wet Edge
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Core Wash
    ctx.strokeStyle = color;
    ctx.globalAlpha = baseOpacity * (brush.wetness.flow / 100) * 0.45;
    ctx.lineWidth = baseSize;
    ctx.beginPath();
    ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
    for (let i = 1; i < smoothedPoints.length; i++) {
      ctx.lineTo(smoothedPoints[i].x, smoothedPoints[i].y);
    }
    ctx.stroke();

    // Dark Outer Wet Edge Ring
    ctx.globalAlpha = baseOpacity * (brush.wetness.wetEdge / 100) * 0.65;
    ctx.lineWidth = Math.max(1, baseSize * 0.92);
    ctx.stroke();
  } else {
    // Standard Continuous Spline / G-Pen / Acrylic with pressure width interpolation
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.globalAlpha = baseOpacity * (brush.wetness.flow / 100);

    for (let i = 0; i < smoothedPoints.length - 1; i++) {
      const p1 = smoothedPoints[i];
      const p2 = smoothedPoints[i + 1];
      const pres = p1.pressure || 0.5;
      
      const width = brush.dynamics.pressureSize 
        ? Math.max(1, baseSize * (0.3 + pres * pressureSensitivity * 0.9))
        : baseSize;

      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  ctx.restore();
};

/**
 * Factory helper to construct a new Stamp Brush Preset from an image data URL
 */
export const createStampBrushPresetFromImage = (
  imageUrl: string,
  name: string = 'Custom Stamp Pattern',
  category: BrushPreset['category'] = 'Stamps & Patterns',
  customConfig?: Partial<BrushStampConfig>
): BrushPreset => {
  return {
    id: `stamp-custom-${Date.now()}`,
    name,
    category,
    description: 'Custom user-imported stamp brush with dynamic scattering, pressure scaling, and color tinting.',
    iconName: 'Sparkles',
    isCustom: true,
    createdAt: new Date().toISOString(),
    shape: {
      type: 'stamp',
      hardness: 100,
      roundness: 100,
      angle: 0,
      spacing: customConfig?.spacing ?? 110,
      sizeJitter: customConfig?.scaleJitter ?? 30,
      angleJitter: customConfig?.rotationJitter ?? 45,
      bristleCount: 1
    },
    stamp: {
      enabled: true,
      imageUrl,
      name,
      tintWithColor: customConfig?.tintWithColor ?? true,
      followStrokeDirection: customConfig?.followStrokeDirection ?? false,
      scatterJitter: customConfig?.scatterJitter ?? 25,
      rotationJitter: customConfig?.rotationJitter ?? 45,
      scaleJitter: customConfig?.scaleJitter ?? 30,
      spacing: customConfig?.spacing ?? 110,
      invertMask: customConfig?.invertMask ?? false,
      threshold: customConfig?.threshold ?? 240,
      countPerStep: customConfig?.countPerStep ?? 1
    },
    dynamics: {
      pressureSize: true,
      pressureOpacity: true,
      pressureFlow: true,
      tiltSensitivity: false,
      velocitySensitivity: 10,
      pressureCurve: 'linear',
      minSizeRatio: 0.2
    },
    texture: {
      type: 'smooth',
      scale: 100,
      depth: 0,
      contrast: 0,
      blendMode: 'normal'
    },
    wetness: {
      flow: 100,
      wetEdge: 0,
      smudgeStrength: 0,
      bleedRadius: 0
    },
    stabilizer: {
      streamline: 20,
      taperStart: 0,
      taperEnd: 0,
      snapToLineAssist: false
    }
  };
};

