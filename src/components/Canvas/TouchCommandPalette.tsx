import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Trash2,
  Flame,
  Save,
  Undo2,
  Redo2,
  Maximize2,
  Paintbrush,
  Search,
  Layers,
  Pipette,
  History,
  Settings2,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';
import type { CanvasActionId } from '../../types/gestures';
import { GESTURE_ACTIONS_CATALOG } from '../../lib/gestureEngine';

interface TouchCommandPaletteProps {
  focalPoint: { x: number; y: number };
  activeLayerName: string;
  onExecuteAction: (actionId: CanvasActionId) => void;
  onOpenGestureSettings: () => void;
  onClose: () => void;
  theme?: 'dark' | 'light' | 'oled';
}

export const TouchCommandPalette: React.FC<TouchCommandPaletteProps> = ({
  focalPoint,
  activeLayerName,
  onExecuteAction,
  onOpenGestureSettings,
  onClose,
  theme = 'dark'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClearLayer, setConfirmClearLayer] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-clamp palette within screen bounds
  const paletteWidth = 340;
  const paletteHeight = 390;
  const clampedX = Math.max(16, Math.min(window.innerWidth - paletteWidth - 16, focalPoint.x - paletteWidth / 2));
  const clampedY = Math.max(16, Math.min(window.innerHeight - paletteHeight - 16, focalPoint.y - paletteHeight / 2));

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Primary quick actions
  const primaryActions: CanvasActionId[] = [
    'clear_layer',
    'toggle_heatmap',
    'save_version',
    'undo',
    'redo',
    'fit_screen',
    'toggle_brush_studio',
    'toggle_search',
    'toggle_layers',
    'eyedropper'
  ];

  const getActionIcon = (actionId: CanvasActionId) => {
    switch (actionId) {
      case 'clear_layer': return <Trash2 className="w-5 h-5 text-rose-400" />;
      case 'toggle_heatmap': return <Flame className="w-5 h-5 text-amber-400 animate-pulse" />;
      case 'save_version': return <Save className="w-5 h-5 text-emerald-400" />;
      case 'undo': return <Undo2 className="w-5 h-5 text-blue-400" />;
      case 'redo': return <Redo2 className="w-5 h-5 text-cyan-400" />;
      case 'fit_screen': return <Maximize2 className="w-5 h-5 text-amber-300" />;
      case 'toggle_brush_studio': return <Paintbrush className="w-5 h-5 text-pink-400" />;
      case 'toggle_search': return <Search className="w-5 h-5 text-indigo-400" />;
      case 'toggle_layers': return <Layers className="w-5 h-5 text-orange-400" />;
      case 'toggle_time_machine': return <History className="w-5 h-5 text-teal-400" />;
      case 'eyedropper': return <Pipette className="w-5 h-5 text-purple-400" />;
      default: return <Sparkles className="w-5 h-5 text-violet-400" />;
    }
  };

  const handleActionClick = (actionId: CanvasActionId) => {
    if (actionId === 'clear_layer') {
      setConfirmClearLayer(true);
      return;
    }
    onExecuteAction(actionId);
    onClose();
  };

  const handleConfirmClear = () => {
    onExecuteAction('clear_layer');
    setConfirmClearLayer(false);
    onClose();
  };

  const filteredActions = Object.values(GESTURE_ACTIONS_CATALOG).filter(act => 
    act.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          left: `${clampedX}px`,
          top: `${clampedY}px`,
          width: `${paletteWidth}px`
        }}
        onClick={(e) => e.stopPropagation()}
        className={`rounded-3xl border shadow-2xl p-4 transition-all duration-200 animate-in zoom-in-95 ${
          theme === 'light'
            ? 'bg-white/95 border-zinc-200 text-zinc-900 shadow-zinc-900/20'
            : theme === 'oled'
            ? 'bg-black/95 border-zinc-800 text-white shadow-black'
            : 'bg-[#13131A]/95 border-zinc-800/90 text-white shadow-2xl shadow-black/80 backdrop-blur-2xl'
        }`}
      >
        {/* Header with Title & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 to-rose-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-tight">Touch Gesture HUD</h3>
              <p className="text-[10px] text-zinc-400">Target: <span className="text-zinc-200 font-medium">{activeLayerName}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onClose();
                onOpenGestureSettings();
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
              title="Configure Touch Gestures"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clear Layer Confirmation Warning */}
        {confirmClearLayer ? (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex flex-col gap-3 my-2 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-bold">Clear Layer: {activeLayerName}?</p>
                <p className="text-[11px] text-rose-300/80 mt-0.5">This will erase all strokes and objects on this layer. You can still undo.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleConfirmClear}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-rose-900/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Layer Now
              </button>
              <button
                onClick={() => setConfirmClearLayer(false)}
                className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Quick Action Circular/Card Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {primaryActions.map(actionId => {
                const def = GESTURE_ACTIONS_CATALOG[actionId];
                if (!def) return null;
                const isClear = actionId === 'clear_layer';
                const isHeatmap = actionId === 'toggle_heatmap';
                const isSave = actionId === 'save_version';

                return (
                  <button
                    key={actionId}
                    onClick={() => handleActionClick(actionId)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all active:scale-95 ${
                      isClear
                        ? 'bg-rose-950/20 hover:bg-rose-950/40 border-rose-900/40 text-rose-200'
                        : isHeatmap
                        ? 'bg-amber-950/20 hover:bg-amber-950/40 border-amber-900/40 text-amber-200'
                        : isSave
                        ? 'bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-900/40 text-emerald-200'
                        : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-zinc-800/70 text-zinc-200'
                    }`}
                  >
                    <div className="p-1.5 rounded-xl bg-black/40 flex-shrink-0">
                      {getActionIcon(actionId)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{def.label}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{def.category}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Search & All Actions Drawer */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commands (e.g. Save, Heatmap)..."
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
              {searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl p-1 shadow-2xl z-20">
                  {filteredActions.map(act => (
                    <button
                      key={act.id}
                      onClick={() => handleActionClick(act.id)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800 text-left transition-colors"
                    >
                      {getActionIcon(act.id)}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white truncate">{act.label}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{act.shortDescription}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer Gesture Hint */}
        <div className="mt-3 pt-2 border-t border-zinc-800/50 flex items-center justify-between text-[10px] text-zinc-500">
          <span>Tap anywhere outside to dismiss</span>
          <button 
            onClick={() => {
              onClose();
              onOpenGestureSettings();
            }}
            className="text-violet-400 hover:underline flex items-center gap-1"
          >
            Custom Gestures &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
