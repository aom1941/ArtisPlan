import React, { useMemo } from 'react';
import { 
  Flame, 
  Eye, 
  EyeOff, 
  Layers, 
  Clock, 
  Sparkles, 
  Compass, 
  Sliders, 
  Activity, 
  Target,
  Zap,
  Check,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import type { ProjectData } from '../../types';
import type { 
  HeatmapSettings, 
  HeatmapColorScale, 
  HeatmapMetric, 
  HotspotCluster 
} from '../../types/heatmap';
import { detectActivityHotspots } from '../../utils/heatmapEngine';

interface HeatmapInspectorPanelProps {
  project: ProjectData;
  settings: HeatmapSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<HeatmapSettings>>;
  activeLayerId: string;
  onNavigateToHotspot: (hotspot: HotspotCluster) => void;
  onClose: () => void;
  highlightedHotspotId?: string | null;
}

const COLOR_SCALES: Array<{
  id: HeatmapColorScale;
  label: string;
  gradientClass: string;
  desc: string;
}> = [
  {
    id: 'thermal',
    label: 'Thermal Rainbow',
    gradientClass: 'from-blue-600 via-cyan-400 via-yellow-400 to-rose-500',
    desc: 'Classic scientific heat distribution'
  },
  {
    id: 'inferno',
    label: 'Inferno Neon',
    gradientClass: 'from-purple-900 via-rose-500 via-amber-500 to-yellow-200',
    desc: 'High contrast vibrant fire spectrum'
  },
  {
    id: 'cyber_cyan',
    label: 'Cyberpunk Glow',
    gradientClass: 'from-indigo-950 via-purple-600 via-cyan-400 to-white',
    desc: 'Futuristic electric neon aesthetics'
  },
  {
    id: 'emerald_matrix',
    label: 'Emerald Matrix',
    gradientClass: 'from-emerald-950 via-emerald-500 via-lime-400 to-teal-100',
    desc: 'Calm biometric density map'
  },
  {
    id: 'monochrome_glow',
    label: 'Minimalist Frost',
    gradientClass: 'from-zinc-900 via-zinc-500 via-slate-300 to-white',
    desc: 'Clean subtle monochromatic contrast'
  }
];

const METRICS: Array<{ id: HeatmapMetric; label: string; icon: React.FC<{ className?: string }>; desc: string }> = [
  { id: 'strokes', label: 'Stroke Weight', icon: Activity, desc: 'Density weighted by brush stroke count' },
  { id: 'points', label: 'Point Precision', icon: Sparkles, desc: 'Exact stylus point & detail frequency' },
  { id: 'all_objects', label: 'All Artifacts', icon: Layers, desc: 'Combined density of strokes, notes & shapes' },
  { id: 'recent_edits', label: 'Recent Velocity', icon: Clock, desc: 'Time-filtered active modification zones' }
];

export const HeatmapInspectorPanel: React.FC<HeatmapInspectorPanelProps> = ({
  project,
  settings,
  onUpdateSettings,
  activeLayerId,
  onNavigateToHotspot,
  onClose,
  highlightedHotspotId
}) => {
  // Compute focal hotspots dynamically
  const hotspots = useMemo(() => {
    return detectActivityHotspots(project, activeLayerId, settings.onlyActiveLayer);
  }, [project, activeLayerId, settings.onlyActiveLayer]);

  const totalPoints = useMemo(() => {
    return project.strokes.reduce((acc, s) => acc + s.points.length, 0);
  }, [project.strokes]);

  return (
    <div className="absolute top-16 right-4 z-30 w-96 max-h-[calc(100vh-5rem)] flex flex-col bg-[#111116]/95 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden text-zinc-200 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800/80 bg-[#17171E]/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              Activity Heatmap Mode
              {settings.enabled && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </h2>
            <p className="text-[11px] text-zinc-400">
              Visualizing stroke density & focal effort
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Main Toggle Switch */}
          <button
            onClick={() => onUpdateSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              settings.enabled
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            {settings.enabled ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Active</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Off</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
        {/* Quick Stats Banner */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/60 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Strokes</div>
            <div className="text-sm font-mono font-bold text-rose-400">{project.strokes.length}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Point Samples</div>
            <div className="text-sm font-mono font-bold text-amber-400">{totalPoints.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Hotspots</div>
            <div className="text-sm font-mono font-bold text-cyan-400">{hotspots.length}</div>
          </div>
        </div>

        {/* Metric Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 mb-2">
            Density Metric Source
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {METRICS.map(m => {
              const Icon = m.icon;
              const isSelected = settings.metric === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onUpdateSettings(prev => ({ ...prev, metric: m.id }))}
                  className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-rose-500/15 border-rose-500/60 text-rose-300 shadow-sm'
                      : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium text-xs text-white">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-rose-400' : 'text-zinc-400'}`} />
                    <span>{m.label}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 leading-tight mt-0.5 line-clamp-1">
                    {m.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Scale Palette */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 mb-2">
            Heat Palette Spectrum
          </label>
          <div className="space-y-1.5">
            {COLOR_SCALES.map(scale => {
              const isSelected = settings.colorScale === scale.id;
              return (
                <button
                  key={scale.id}
                  onClick={() => onUpdateSettings(prev => ({ ...prev, colorScale: scale.id }))}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-zinc-800/90 border-rose-500/50 text-white'
                      : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-12 h-3.5 rounded-md bg-gradient-to-r ${scale.gradientClass} shadow-sm`} />
                    <span className="font-medium text-xs">{scale.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders: Opacity, Radius, Intensity */}
        <div className="space-y-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
          <div>
            <div className="flex justify-between text-[11px] text-zinc-400 font-medium mb-1">
              <span>Heatmap Opacity</span>
              <span className="font-mono text-zinc-300">{Math.round(settings.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={settings.opacity}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-zinc-400 font-medium mb-1">
              <span>Diffusion Radius</span>
              <span className="font-mono text-zinc-300">{settings.radius}px</span>
            </div>
            <input
              type="range"
              min="20"
              max="180"
              step="5"
              value={settings.radius}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-zinc-400 font-medium mb-1">
              <span>Intensity Gain</span>
              <span className="font-mono text-zinc-300">{settings.intensity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="3.0"
              step="0.1"
              value={settings.intensity}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, intensity: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>
        </div>

        {/* Filter Toggles */}
        <div className="space-y-2">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 cursor-pointer hover:bg-zinc-800/60 transition-colors">
            <span className="flex items-center gap-2 font-medium">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>Show Focal Hotspot Badges</span>
            </span>
            <input
              type="checkbox"
              checked={settings.showHotspotBadges}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, showHotspotBadges: e.target.checked }))}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-rose-500 focus:ring-rose-500/20"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 cursor-pointer hover:bg-zinc-800/60 transition-colors">
            <span className="flex items-center gap-2 font-medium">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Scope to Active Layer Only</span>
            </span>
            <input
              type="checkbox"
              checked={settings.onlyActiveLayer}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, onlyActiveLayer: e.target.checked }))}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-rose-500 focus:ring-rose-500/20"
            />
          </label>
        </div>

        {/* Hotspots Quick Navigator */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-rose-400" />
              <span>Identified Focus Hotspots ({hotspots.length})</span>
            </label>
            <span className="text-[10px] text-zinc-500">Click to warp viewport</span>
          </div>

          {hotspots.length === 0 ? (
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-center text-zinc-500 text-xs">
              No concentrated stroke clusters detected yet. Start sketching on the infinite canvas to form activity zones.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {hotspots.map((hotspot, idx) => {
                const isFocused = highlightedHotspotId === hotspot.id;
                return (
                  <button
                    key={hotspot.id}
                    onClick={() => onNavigateToHotspot(hotspot)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isFocused
                        ? 'bg-rose-500/20 border-rose-400 ring-2 ring-rose-400/40 shadow-lg shadow-rose-500/20'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${
                        idx === 0
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                          : idx === 1
                          ? 'bg-amber-500 text-black'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                          <span>{hotspot.description}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>{hotspot.strokeCount} strokes</span>
                          <span>•</span>
                          <span>{hotspot.pointCount} points</span>
                          <span>•</span>
                          <span className="font-mono text-zinc-500">
                            ({hotspot.x}, {hotspot.y})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-rose-400">
                          {hotspot.density}%
                        </div>
                        <div className="text-[9px] uppercase tracking-wider text-zinc-500">
                          density
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
