import type { StrokePoint } from '../types';

export interface StabilizerTether {
  cursor: { x: number; y: number };
  anchor: { x: number; y: number };
  radius: number;
  intensity: number;
}

/**
 * Advanced Multi-Tier Real-Time Stroke Stabilization Engine
 * 
 * Features:
 * 1. Pulling-String / Streamline deadzone rope damping
 * 2. Exponential Moving Average (EMA) coordinate filtering
 * 3. Pressure curve smoothing to eliminate hardware sampling jitter
 * 4. Multi-sample weighted centroid window
 * 5. Smooth terminal deceleration & catchup on stroke completion
 */
export class StrokeStabilizer {
  private rawPoints: StrokePoint[] = [];
  private stabilizedPoints: StrokePoint[] = [];
  private anchorX: number = 0;
  private anchorY: number = 0;
  private anchorPressure: number = 0.5;
  private stabilizationLevel: number = 40; // 0 to 100
  private lastTether: StabilizerTether | null = null;
  private windowSize: number = 5;

  /**
   * Start a new stroke with the initial pointer position
   */
  public beginStroke(startPoint: StrokePoint, stabilization: number = 40): StrokePoint {
    this.stabilizationLevel = Math.max(0, Math.min(100, stabilization));
    this.rawPoints = [{ ...startPoint }];
    this.anchorX = startPoint.x;
    this.anchorY = startPoint.y;
    this.anchorPressure = startPoint.pressure;
    this.stabilizedPoints = [{ ...startPoint }];
    this.lastTether = null;

    // Window size scales with stabilization level (3 to 9 samples)
    this.windowSize = Math.max(3, Math.min(9, Math.round(3 + (this.stabilizationLevel / 100) * 6)));

    return { ...startPoint };
  }

  /**
   * Process a new raw pointer event in real time and return the stabilized point
   */
  public addPoint(rawPoint: StrokePoint): { point: StrokePoint | null; tether: StabilizerTether | null } {
    this.rawPoints.push({ ...rawPoint });

    // Level 0: Direct raw input without stabilization lag
    if (this.stabilizationLevel <= 0) {
      this.anchorX = rawPoint.x;
      this.anchorY = rawPoint.y;
      this.anchorPressure = rawPoint.pressure;
      const point: StrokePoint = { ...rawPoint };
      this.stabilizedPoints.push(point);
      return { point, tether: null };
    }

    const stabNorm = this.stabilizationLevel / 100; // 0.0 to 1.0

    // 1. Calculate Pulling-String Deadzone & Tether
    // Deadzone rope length in canvas units (0 to 32px)
    const deadzoneRadius = stabNorm * 22;
    const dx = rawPoint.x - this.anchorX;
    const dy = rawPoint.y - this.anchorY;
    const dist = Math.hypot(dx, dy);

    // Follower interpolation weight:
    // Higher stabilization = slower, silkier follow rate (0.12 to 0.75)
    const followRate = Math.max(0.12, 1.0 - stabNorm * 0.82);

    let targetX = this.anchorX;
    let targetY = this.anchorY;

    if (dist > deadzoneRadius) {
      const pullDist = dist - deadzoneRadius;
      const nx = dx / dist;
      const ny = dy / dist;

      targetX = this.anchorX + nx * pullDist * followRate;
      targetY = this.anchorY + ny * pullDist * followRate;
    } else {
      // Micro-jitter inside deadzone - apply gentle dampening
      targetX = this.anchorX + dx * (followRate * 0.35);
      targetY = this.anchorY + dy * (followRate * 0.35);
    }

    // 2. Sliding Window Weighted Centroid Filter
    // Filter high frequency trembling across the recent buffer
    const recent = this.rawPoints.slice(-this.windowSize);
    let weightedSumX = 0;
    let weightedSumY = 0;
    let weightedSumP = 0;
    let totalWeight = 0;

    for (let i = 0; i < recent.length; i++) {
      const weight = (i + 1) * (i + 1); // Quadratic recent weight
      weightedSumX += recent[i].x * weight;
      weightedSumY += recent[i].y * weight;
      weightedSumP += recent[i].pressure * weight;
      totalWeight += weight;
    }

    const centroidX = weightedSumX / totalWeight;
    const centroidY = weightedSumY / totalWeight;
    const centroidP = weightedSumP / totalWeight;

    // 3. Blend Pulling-String with Centroid Filter
    const blendFactor = 0.55 + stabNorm * 0.35;
    const smoothX = targetX * (1 - blendFactor) + centroidX * blendFactor;
    const smoothY = targetY * (1 - blendFactor) + centroidY * blendFactor;
    const smoothP = this.anchorPressure * (1 - followRate) + centroidP * followRate;

    // Minimum movement threshold to avoid duplicate identical points
    const stepDist = Math.hypot(smoothX - this.anchorX, smoothY - this.anchorY);
    const minStep = Math.max(0.5, 2.0 * (1.0 - stabNorm));

    this.anchorX = smoothX;
    this.anchorY = smoothY;
    this.anchorPressure = smoothP;

    const tether: StabilizerTether = {
      cursor: { x: rawPoint.x, y: rawPoint.y },
      anchor: { x: smoothX, y: smoothY },
      radius: deadzoneRadius,
      intensity: stabNorm
    };
    this.lastTether = tether;

    if (stepDist >= minStep) {
      const stabilized: StrokePoint = {
        x: Number(smoothX.toFixed(2)),
        y: Number(smoothY.toFixed(2)),
        pressure: Number(smoothP.toFixed(3))
      };
      this.stabilizedPoints.push(stabilized);
      return { point: stabilized, tether };
    }

    return { point: null, tether };
  }

  /**
   * Finalize the stroke when pointer is lifted, catching up to the end point smoothly
   */
  public finishStroke(): StrokePoint[] {
    if (this.rawPoints.length === 0) {
      return [];
    }

    if (this.stabilizedPoints.length <= 1) {
      return [...this.rawPoints];
    }

    const lastRaw = this.rawPoints[this.rawPoints.length - 1];
    const lastStab = this.stabilizedPoints[this.stabilizedPoints.length - 1];
    const remainingDist = Math.hypot(lastRaw.x - lastStab.x, lastRaw.y - lastStab.y);

    // If there is an unfinished gap due to inertia, interpolate intermediate terminal steps
    if (remainingDist > 2 && this.stabilizationLevel > 0) {
      const steps = Math.min(5, Math.ceil(remainingDist / 6));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        // Ease out quadratic for natural deceleration
        const ease = 1 - (1 - t) * (1 - t);
        this.stabilizedPoints.push({
          x: Number((lastStab.x + (lastRaw.x - lastStab.x) * ease).toFixed(2)),
          y: Number((lastStab.y + (lastRaw.y - lastStab.y) * ease).toFixed(2)),
          pressure: Number((lastStab.pressure + (lastRaw.pressure - lastStab.pressure) * ease).toFixed(3))
        });
      }
    }

    const result = [...this.stabilizedPoints];
    this.rawPoints = [];
    this.stabilizedPoints = [];
    this.lastTether = null;
    return result;
  }

  /**
   * Get current tether details for visual canvas rendering
   */
  public getTether(): StabilizerTether | null {
    return this.lastTether;
  }
}

/**
 * Global singleton helper for stroke smoothing
 */
export const strokeStabilizerInstance = new StrokeStabilizer();
