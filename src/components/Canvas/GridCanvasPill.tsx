import React, { useState } from 'react';
import { 
  Grid as GridIcon, 
  Magnet, 
  Sliders, 
  Eye, 
  EyeOff,
  ChevronDown
} from 'lucide-react';
import type { CanvasGridSettings } from '../../types';
import { GridSettingsPopover } from './GridSettingsPopover';

interface GridCanvasPillProps {
  settings: CanvasGridSettings;
  onChange: (newSettings: CanvasGridSettings) => void;
  theme: 'dark' | 'light' | 'oled' | 'sepia' | 'companion';
}

export const GridCanvasPill: React.FC<GridCanvasPillProps> = ({
  settings,
  onChange,
  theme
}) => {
  const [showPopover, setShowPopover] = useState(false);

  const isGridActive = settings.gridPattern !== 'none';
  const isSnapActive = settings.snapToGrid ?? true;
  const size = settings.gridSize || 40;
  const opacity = Math.round((settings.gridOpacity ?? 0.25) * 100);

  const toggleSnap = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({
      ...settings,
      snapToGrid: !isSnapActive
    });
  };

  const toggleGrid = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({
      ...settings,
      gridPattern: isGridActive ? 'none' : 'grid'
    });
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1 bg-[#121216]/95 backdrop-blur-xl border border-zinc-800/90 rounded-2xl p-1 shadow-xl shadow-black/60 text-xs select-none">
        {/* Quick Grid View Toggle */}
        <button
          onClick={toggleGrid}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-xl transition-all ${
            isGridActive
              ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 font-medium'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
          title={isGridActive ? `Grid Active (${size}px, ${opacity}%) - Click to toggle off` : 'Grid Hidden - Click to show'}
        >
          <GridIcon className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px]">
            {isGridActive ? `${size}px` : 'Grid Off'}
          </span>
        </button>

        {/* Snap-to-Grid Quick Toggle Button */}
        <button
          onClick={toggleSnap}
          className={`flex items-center gap-1 px-2 py-1 rounded-xl transition-all ${
            isSnapActive
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
          title={isSnapActive ? 'Snap to Grid: ON (Shift+S)' : 'Snap to Grid: OFF (Shift+S)'}
        >
          <Magnet className={`w-3.5 h-3.5 ${isSnapActive ? 'animate-pulse' : ''}`} />
          <span className="text-[10px] tracking-wide uppercase">
            {isSnapActive ? 'Snap' : 'Free'}
          </span>
        </button>

        {/* Settings Popover Trigger */}
        <button
          onClick={() => setShowPopover(!showPopover)}
          className={`p-1 rounded-xl transition-colors ${
            showPopover 
              ? 'bg-zinc-700 text-white' 
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
          title="Grid & Composition Settings"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popover */}
      {showPopover && (
        <div className="absolute top-11 right-0 z-50">
          <GridSettingsPopover
            settings={settings}
            onChange={onChange}
            onClose={() => setShowPopover(false)}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
};
