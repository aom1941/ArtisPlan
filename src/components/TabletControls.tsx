import React from 'react';
import { 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize, 
  Tablet, 
  Hand,
  Sparkles
} from 'lucide-react';
import type { StylusSettings } from '../types';

interface TabletControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  stylusSettings: StylusSettings;
  setStylusSettings: React.Dispatch<React.SetStateAction<StylusSettings>>;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenGesturePalette?: () => void;
  onOpenGestureSettings?: () => void;
}

export const TabletControls: React.FC<TabletControlsProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  stylusSettings,
  setStylusSettings,
  isFullscreen,
  onToggleFullscreen,
  onOpenGesturePalette,
  onOpenGestureSettings
}) => {
  return (
    <div className="absolute top-16 left-4 z-30 flex flex-col gap-1.5 bg-[#121216]/95 backdrop-blur-xl p-1.5 rounded-2xl border border-zinc-800/90 shadow-2xl shadow-black/60">
      {/* Touch Gesture Command Palette Trigger */}
      {onOpenGesturePalette && (
        <button
          onClick={onOpenGesturePalette}
          className="p-2 rounded-xl text-xs bg-gradient-to-tr from-violet-950/80 to-rose-950/80 hover:from-violet-900 hover:to-rose-900 text-violet-300 border border-violet-800/60 transition-all shadow-md active:scale-95"
          title="Touch Gesture Command Palette (3-Finger Tap on Canvas)"
        >
          <Sparkles className="w-4 h-4 text-violet-300 animate-pulse" />
        </button>
      )}

      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-2 rounded-xl text-xs transition-colors ${
          canUndo ? 'text-zinc-200 hover:bg-[#1C1C24]' : 'text-zinc-600'
        }`}
        title="Undo (Ctrl+Z or 2-Finger Tap)"
      >
        <Undo2 className="w-4 h-4" />
      </button>

      {/* Redo */}
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-2 rounded-xl text-xs transition-colors ${
          canRedo ? 'text-zinc-200 hover:bg-[#1C1C24]' : 'text-zinc-600'
        }`}
        title="Redo (Ctrl+Y or 2-Finger Double Tap)"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      <div className="h-px w-full bg-zinc-800/80 my-0.5" />

      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-[#1C1C24] transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-[#1C1C24] transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <div className="h-px w-full bg-zinc-800/80 my-0.5" />

      {/* Fullscreen Mode */}
      <button
        onClick={onToggleFullscreen}
        className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-[#1C1C24] transition-colors"
        title={isFullscreen ? "Exit Fullscreen" : "Canvas Fullscreen"}
      >
        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
      </button>

      {/* Palm rejection quick toggle */}
      <button
        onClick={() => setStylusSettings(prev => ({ ...prev, palmRejection: !prev.palmRejection }))}
        className={`p-2 rounded-xl transition-colors ${
          stylusSettings.palmRejection 
            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' 
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1C1C24]'
        }`}
        title={stylusSettings.palmRejection ? "Palm Rejection Active" : "Touch + Stylus Drawing"}
      >
        <Tablet className="w-4 h-4" />
      </button>

      {/* Touch Gesture Settings */}
      {onOpenGestureSettings && (
        <button
          onClick={onOpenGestureSettings}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1C1C24] transition-colors"
          title="Configure Touch Gestures (Multi-Finger Taps)"
        >
          <Hand className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

