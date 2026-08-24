import React from 'react';
import {
  Undo2,
  Redo2,
  Trash2,
  Flame,
  Save,
  Maximize2,
  Paintbrush,
  Search,
  Layers,
  Pipette,
  Sparkles,
  History
} from 'lucide-react';
import type { CanvasActionId } from '../../types/gestures';

interface GestureToastFeedbackProps {
  actionId: CanvasActionId | null;
  label: string;
  gestureName?: string;
  visible: boolean;
}

export const GestureToastFeedback: React.FC<GestureToastFeedbackProps> = ({
  actionId,
  label,
  gestureName,
  visible
}) => {
  if (!visible || !actionId) return null;

  const getActionIcon = () => {
    switch (actionId) {
      case 'undo': return <Undo2 className="w-4 h-4 text-blue-400" />;
      case 'redo': return <Redo2 className="w-4 h-4 text-cyan-400" />;
      case 'clear_layer': return <Trash2 className="w-4 h-4 text-rose-400" />;
      case 'toggle_heatmap': return <Flame className="w-4 h-4 text-amber-400 animate-pulse" />;
      case 'save_version': return <Save className="w-4 h-4 text-emerald-400" />;
      case 'fit_screen': return <Maximize2 className="w-4 h-4 text-amber-300" />;
      case 'toggle_brush_studio': return <Paintbrush className="w-4 h-4 text-pink-400" />;
      case 'toggle_search': return <Search className="w-4 h-4 text-indigo-400" />;
      case 'toggle_layers': return <Layers className="w-4 h-4 text-orange-400" />;
      case 'toggle_time_machine': return <History className="w-4 h-4 text-teal-400" />;
      case 'eyedropper': return <Pipette className="w-4 h-4 text-purple-400" />;
      default: return <Sparkles className="w-4 h-4 text-violet-400" />;
    }
  };

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="bg-[#121218]/95 backdrop-blur-xl border border-zinc-700/80 rounded-2xl px-4 py-2 shadow-2xl shadow-black/90 flex items-center gap-2.5 text-xs text-white">
        <div className="p-1 rounded-lg bg-black/50 border border-zinc-800">
          {getActionIcon()}
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-wide text-zinc-100">{label}</span>
          {gestureName && (
            <span className="text-[10px] text-zinc-400 font-medium">{gestureName}</span>
          )}
        </div>
      </div>
    </div>
  );
};
