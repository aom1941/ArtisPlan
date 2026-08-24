import React from 'react';
import { 
  Grid as GridIcon, 
  Magnet, 
  Eye, 
  EyeOff, 
  Sliders, 
  Compass, 
  Maximize2, 
  X, 
  Sparkles, 
  RotateCcw,
  Check,
  Ruler,
  Hash,
  Move,
  Volume2,
  Zap
} from 'lucide-react';
import type { CanvasGridSettings, GridPatternType } from '../../types';
import { GRID_COLOR_PRESETS, GRID_SIZE_PRESETS, DEFAULT_GRID_SETTINGS } from '../../lib/gridEngine';

interface GridSettingsPopoverProps {
  settings: CanvasGridSettings;
  onChange: (newSettings: CanvasGridSettings) => void;
  onClose: () => void;
  theme?: 'dark' | 'light' | 'oled' | 'sepia' | 'companion';
}

const PATTERNS: Array<{
  id: GridPatternType;
  label: string;
  desc: string;
  icon: string;
}> = [
  { id: 'grid', label: 'Orthogonal Grid', desc: 'Precision graph paper with major subdivision accents', icon: '⊞' },
  { id: 'dots', label: 'Dot Matrix', desc: 'Subtle bullet journal dot lattice', icon: '::' },
  { id: 'isometric', label: 'Isometric 3D', desc: '30°/60° angled perspective lines for game art & architecture', icon: '◇' },
  { id: 'cross', label: 'Blueprint Cross', desc: 'Industrial blueprint intersection crosshairs', icon: '┼' },
  { id: 'paper', label: 'Artist Paper', desc: 'Ruled horizontal sketchbook lines with margin rule', icon: '≡' },
  { id: 'triangular', label: 'Hex Triangular', desc: 'Equilateral triangular tile lattice', icon: '△' },
  { id: 'rule-of-thirds', label: 'Rule of Thirds', desc: 'Cinematic composition quadrants & focal target points', icon: '⌗' },
  { id: 'none', label: 'Off (Hidden)', desc: 'Clean unguided canvas surface', icon: '∅' }
];

const SUBDIVISION_OPTIONS = [
  { value: 1, label: '1x (None)' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
  { value: 5, label: '5x (Standard)' },
  { value: 8, label: '8x' },
  { value: 10, label: '10x (Decade)' }
];

export const GridSettingsPopover: React.FC<GridSettingsPopoverProps> = ({
  settings,
  onChange,
  onClose,
  theme = 'dark'
}) => {
  const currentSize = settings.gridSize || 40;
  const currentOpacity = settings.gridOpacity ?? 0.25;
  const snapActive = settings.snapToGrid ?? true;
  const currentSubdivisions = settings.subdivisions ?? 5;
  const currentColor = settings.gridColor || 'auto';

  const updateSetting = <K extends keyof CanvasGridSettings>(key: K, value: CanvasGridSettings[K]) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  const handleReset = () => {
    onChange({
      ...DEFAULT_GRID_SETTINGS,
      backgroundColor: settings.backgroundColor || '#121216'
    });
  };

  return (
    <div 
      className="w-[360px] sm:w-[400px] bg-[#121216]/98 backdrop-blur-2xl border border-zinc-800/90 rounded-3xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col text-zinc-200 animate-in fade-in zoom-in-95 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/80 bg-[#0A0A0D]/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-950/80 to-blue-950/80 text-cyan-400 border border-cyan-800/60 shadow-inner">
            <GridIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white font-['Outfit']">Grid & Composition Overlay</h3>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                settings.gridPattern !== 'none' 
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/50' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {settings.gridPattern !== 'none' ? `${currentSize}px` : 'OFF'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Precision layout grids, snapping & guide rulers</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
            title="Reset grid settings to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 max-h-[72vh] overflow-y-auto space-y-4 text-xs custom-scrollbar">
        {/* Master Snap-to-Grid Toggle Bar */}
        <div 
          onClick={() => updateSetting('snapToGrid', !snapActive)}
          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            snapActive
              ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-950/30'
              : 'bg-[#18181F]/70 border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              snapActive 
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm' 
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              <Magnet className={`w-4 h-4 ${snapActive ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white">Snap to Grid</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Shift + S
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {snapActive ? 'Shapes, stickies & text magnetically align' : 'Freeform continuous positioning'}
              </p>
            </div>
          </div>

          <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
            snapActive ? 'bg-cyan-500' : 'bg-zinc-700'
          }`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
              snapActive ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </div>
        </div>

        {/* Pattern Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
              Overlay Pattern
            </label>
            <span className="text-[11px] text-zinc-500 font-mono">
              {PATTERNS.find(p => p.id === settings.gridPattern)?.label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {PATTERNS.map((p) => {
              const isSelected = settings.gridPattern === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => updateSetting('gridPattern', p.id)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-cyan-950/50 border-cyan-500/80 text-white shadow-sm'
                      : 'bg-[#16161C]/60 border-zinc-800/70 text-zinc-400 hover:text-zinc-200 hover:bg-[#1C1C24]'
                  }`}
                  title={p.desc}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-base font-mono leading-none">{p.icon}</span>
                    {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                  </div>
                  <span className="text-[11px] font-medium truncate">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {settings.gridPattern !== 'none' && (
          <>
            {/* Grid Size Control */}
            <div className="p-3 bg-[#18181F]/70 rounded-2xl border border-zinc-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                  <label className="font-semibold text-white">Grid Cell Size</label>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="5"
                    max="300"
                    step="5"
                    value={currentSize}
                    onChange={(e) => updateSetting('gridSize', Math.max(5, Math.min(300, Number(e.target.value))))}
                    className="w-14 bg-zinc-900 border border-zinc-700 rounded-lg px-1.5 py-0.5 text-right font-mono text-cyan-300 text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[11px] font-mono text-zinc-400">px</span>
                </div>
              </div>

              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={currentSize}
                onChange={(e) => updateSetting('gridSize', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
              />

              {/* Quick Size Presets */}
              <div className="flex flex-wrap gap-1 pt-1">
                {GRID_SIZE_PRESETS.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => updateSetting('gridSize', sz)}
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] font-medium transition-colors ${
                      currentSize === sz
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/80 border border-zinc-700/60'
                    }`}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Control */}
            <div className="p-3 bg-[#18181F]/70 rounded-2xl border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <label className="font-semibold text-white">Grid Opacity</label>
                </div>
                <span className="font-mono text-cyan-300 font-medium">
                  {Math.round(currentOpacity * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={currentOpacity}
                onChange={(e) => updateSetting('gridOpacity', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
              />

              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>5% (Subtle)</span>
                <span>25% (Standard)</span>
                <span>60% (Vibrant)</span>
                <span>100%</span>
              </div>
            </div>

            {/* Subdivisions & Major Accent Lines */}
            <div className="p-3 bg-[#18181F]/70 rounded-2xl border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-cyan-400" />
                  <label className="font-semibold text-white">Major Line Accents</label>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono">
                  Every {currentSubdivisions > 1 ? `${currentSubdivisions} cells` : 'cell (no major)'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {SUBDIVISION_OPTIONS.map((sub) => (
                  <button
                    key={sub.value}
                    onClick={() => updateSetting('subdivisions', sub.value)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-medium border text-center transition-all ${
                      currentSubdivisions === sub.value
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Color / Tint Picker */}
            <div className="p-3 bg-[#18181F]/70 rounded-2xl border border-zinc-800/80 space-y-2">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <span>Color Tint</span>
              </label>

              <div className="flex items-center gap-1.5 flex-wrap">
                {GRID_COLOR_PRESETS.map((cp) => {
                  const isSelected = currentColor === cp.color;
                  return (
                    <button
                      key={cp.id}
                      onClick={() => updateSetting('gridColor', cp.color)}
                      className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-white scale-110 shadow-lg' 
                          : 'border-zinc-700 hover:border-zinc-500 opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: cp.color === 'auto' ? '#334155' : cp.color
                      }}
                      title={cp.name}
                    >
                      {cp.color === 'auto' ? (
                        <span className="text-[9px] font-bold text-white uppercase">A</span>
                      ) : isSelected ? (
                        <Check className="w-3 h-3 text-slate-950" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Composition & Measurement Toggles */}
            <div className="p-3 bg-[#18181F]/70 rounded-2xl border border-zinc-800/80 space-y-2.5">
              <label className="font-semibold text-white">Guides & Navigation</label>

              <div className="space-y-1.5">
                {/* Smart Dynamic Guides */}
                <div className="space-y-1.5 p-1.5 rounded-xl hover:bg-zinc-800/30">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <div>
                        <span className="text-zinc-200 font-medium">Smart Dynamic Guides</span>
                        <p className="text-[10px] text-zinc-400">Magnetic alignment & center snap lines</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableSmartGuides ?? true}
                      onChange={(e) => updateSetting('enableSmartGuides', e.target.checked)}
                      className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                    />
                  </label>

                  {/* Sub-options when Smart Guides are enabled */}
                  {(settings.enableSmartGuides ?? true) && (
                    <div className="ml-5 pt-1.5 border-l-2 border-cyan-500/30 pl-3 space-y-2">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-1.5">
                          <Magnet className="w-3 h-3 text-cyan-400" />
                          <span className="text-[11px] text-zinc-300">Snap-to-Guide (Magnetic Sticky)</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.snapToGuides ?? true}
                          onChange={(e) => updateSetting('snapToGuides', e.target.checked)}
                          className="w-3.5 h-3.5 accent-cyan-400 rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-1.5">
                          <Volume2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-[11px] text-zinc-300">Tactile Haptic & Audio Click</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.enableHapticFeedback ?? true}
                          onChange={(e) => updateSetting('enableHapticFeedback', e.target.checked)}
                          className="w-3.5 h-3.5 accent-cyan-400 rounded cursor-pointer"
                        />
                      </label>

                      {/* Snap threshold slider */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[10.5px]">
                          <span className="text-zinc-400">Snap Range:</span>
                          <span className="font-mono text-cyan-300">{settings.snapThreshold ?? 10}px</span>
                        </div>
                        <input
                          type="range"
                          min="4"
                          max="20"
                          step="2"
                          value={settings.snapThreshold ?? 10}
                          onChange={(e) => updateSetting('snapThreshold', Number(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer h-1 bg-zinc-800 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Origin Axis */}
                <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-zinc-800/50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-rose-400" />
                    <div>
                      <span className="text-zinc-200 font-medium">Origin Axes (0,0)</span>
                      <p className="text-[10px] text-zinc-400">Colored X & Y coordinate centerlines</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showOriginAxis ?? true}
                    onChange={(e) => updateSetting('showOriginAxis', e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                </label>

                {/* Coordinate Markers */}
                <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-zinc-800/50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-blue-400" />
                    <div>
                      <span className="text-zinc-200 font-medium">Coordinate Markers</span>
                      <p className="text-[10px] text-zinc-400">Numeric position badges on major junctions</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showCoordinates ?? false}
                    onChange={(e) => updateSetting('showCoordinates', e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                </label>

                {/* Viewport Rulers */}
                <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-zinc-800/50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                      <span className="text-zinc-200 font-medium">Screen Pixel Rulers</span>
                      <p className="text-[10px] text-zinc-400">Top & left calibrated measurement rulers</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showRulers ?? false}
                    onChange={(e) => updateSetting('showRulers', e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Hotkey Guide */}
      <div className="p-3 bg-[#0A0A0D] border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <span>Toggle Grid: <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">G</kbd></span>
          <span>Snap: <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">Shift+S</kbd></span>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
