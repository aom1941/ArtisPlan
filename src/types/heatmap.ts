export type HeatmapMetric = 'strokes' | 'points' | 'recent_edits' | 'all_objects';
export type HeatmapColorScale = 'thermal' | 'cyber_cyan' | 'inferno' | 'emerald_matrix' | 'monochrome_glow';

export interface HeatmapSettings {
  enabled: boolean;
  opacity: number; // 0.1 to 1.0
  radius: number; // 20 to 180 blur radius
  intensity: number; // 0.2 to 3.0 scale multiplier
  metric: HeatmapMetric;
  colorScale: HeatmapColorScale;
  showHotspotBadges: boolean;
  onlyActiveLayer: boolean;
  timeWindowMinutes?: number; // 0 for all-time, or e.g. 10, 60, 1440 for recent changes
}

export interface HotspotCluster {
  id: string;
  x: number;
  y: number;
  density: number; // 0 - 100 relative score
  strokeCount: number;
  pointCount: number;
  objectCount: number;
  lastActiveAt?: number;
  description: string;
}
