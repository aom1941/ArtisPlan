import React, { useState } from 'react';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Crosshair,
  Grid as GridIcon,
  Magnet,
  Maximize2,
  Minimize2,
  Check,
  Layers,
  Sparkles,
  X,
  SlidersHorizontal,
  ArrowLeftRight,
  ArrowUpDown
} from 'lucide-react';
import type { CanvasAlignmentAction } from '../../lib/alignmentEngine';

export interface AlignmentPopoverProps {
  selectedCount: number;
  onAlign: (action: CanvasAlignmentAction, target: 'selection' | 'canvas') => void;
  onSelectAll?: () => void;
  onClose: () => void;
  theme: 'dark' | 'light' | 'oled' | 'sepia';
  anchorAlign?: 'top' | 'bottom';
}

export const AlignmentPopover: React.FC<AlignmentPopoverProps> = ({
  selectedCount,
  onAlign,
  onSelectAll,
  onClose,
  theme,
  anchorAlign = 'top'
}) => {
  const [alignTarget, setAlignTarget] = useState<'selection' | 'canvas'>(
    selectedCount >= 2 ? 'selection' : 'canvas'
  );

  const isLight = theme === 'light';
  const isSepia = theme === 'sepia';

  const bgColor = isLight 
    ? 'bg-white/95 border-zinc-200 text-zinc-800 shadow-xl' 
    : isSepia
    ? 'bg-[#FBF0D9]/95 border-[#E2D1B3] text-[#3D312A] shadow-xl'
    : 'bg-[#141419]/95 border-zinc-800/90 text-zinc-200 shadow-2xl shadow-black/90';

  const cardBg = isLight 
    ? 'bg-zinc-100/80 border-zinc-200/80' 
    : isSepia 
    ? 'bg-[#F2E5CB]/70 border-[#DFCDB0]' 
    : 'bg-[#0E0E12]/80 border-zinc-800/80';

  const btnClass = (active = false, disabled = false) => `
    relative flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium transition-all
    ${disabled 
      ? 'opacity-35 cursor-not-allowed text-zinc-500' 
      : active
      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-sm'
      : isLight
      ? 'hover:bg-zinc-200/80 hover:text-zinc-950 text-zinc-700 active:scale-95'
      : 'hover:bg-zinc-800/90 hover:text-white text-zinc-400 active:scale-95'
    }
  `;

  return (
    <div
      id="artisplan-alignment-popover"
      className={`absolute ${anchorAlign === 'bottom' ? 'bottom-14' : 'top-14'} left-1/2 -translate-x-1/2 z-50 w-76 rounded-2xl border backdrop-blur-2xl p-3 select-none animate-in fade-in zoom-in-95 ${bgColor}`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header with Title and Target Switch */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-800/60">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-semibold text-xs leading-none">Alignment & Snapping</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              {selectedCount > 0 
                ? `${selectedCount} object${selectedCount > 1 ? 's' : ''} selected`
                : 'Snap & Align Objects'}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Target Mode Segmented Switch: Align to Selection vs Canvas Center */}
      <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl mb-3 border ${cardBg}`}>
        <button
          type="button"
          onClick={() => setAlignTarget('selection')}
          disabled={selectedCount < 2}
          className={`py-1 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 ${
            alignTarget === 'selection' && selectedCount >= 2
              ? 'bg-cyan-500 text-black font-semibold shadow-sm'
              : selectedCount < 2
              ? 'text-zinc-500 cursor-not-allowed opacity-50'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title={selectedCount < 2 ? 'Select 2+ objects to align to each other' : 'Align objects relative to selection bounding box'}
        >
          <Layers className="w-3 h-3" />
          <span>To Each Other</span>
        </button>

        <button
          type="button"
          onClick={() => setAlignTarget('canvas')}
          className={`py-1 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 ${
            alignTarget === 'canvas'
              ? 'bg-cyan-500 text-black font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Snap objects to the center of the canvas"
        >
          <Crosshair className="w-3 h-3" />
          <span>To Canvas Center</span>
        </button>
      </div>

      {/* Quick Center Snapping (Primary Action) */}
      <div className="space-y-3">
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Canvas Center Snap</span>
            <span className="text-[9px] font-mono text-cyan-400">Target (0,0)</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => onAlign('center-canvas-both', 'canvas')}
              disabled={selectedCount === 0}
              className={btnClass(false, selectedCount === 0)}
              title="Snap center of selection exactly to Canvas Origin (0,0)"
            >
              <Crosshair className="w-4 h-4 text-cyan-400 mb-1" />
              <span className="text-[10px]">Center Both</span>
            </button>

            <button
              type="button"
              onClick={() => onAlign('center-canvas-h', 'canvas')}
              disabled={selectedCount === 0}
              className={btnClass(false, selectedCount === 0)}
              title="Snap selection horizontally to Canvas Center X=0"
            >
              <ArrowLeftRight className="w-4 h-4 text-cyan-400 mb-1" />
              <span className="text-[10px]">Center X</span>
            </button>

            <button
              type="button"
              onClick={() => onAlign('center-canvas-v', 'canvas')}
              disabled={selectedCount === 0}
              className={btnClass(false, selectedCount === 0)}
              title="Snap selection vertically to Canvas Center Y=0"
            >
              <ArrowUpDown className="w-4 h-4 text-cyan-400 mb-1" />
              <span className="text-[10px]">Center Y</span>
            </button>
          </div>
        </div>

        {/* Horizontal Alignment */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Horizontal Alignment</span>
            <span className="text-[9px] text-zinc-400 font-mono">X-Axis</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => onAlign('align-left', alignTarget)}
              disabled={selectedCount === 0}
              className={btnClass(false, selectedCount === 0)}
              title="Align Left Edges"
            >
              <AlignLeft className="w-4 h-4 text-blue-400 mb-1" />
              <span className="text-[10px]">Left</span>
            </button>

            <button
              type="button"
              onClick={() => onAlign('align-center-h', alignTarget)}
              disabled={selectedCount === 0}
              className={btnClass(false, selectedCount === 0)}
              title="Align Horizontal Center"
            >
              <AlignCenter className="w-4 h-4 text-blue-400 mb-1" />
              <span className="text-[10px]">Center</span>
            </button>

            <button
              type="button"
              onClick={() => onAlign('align-right', alignTarget)}
              disabled={selectedCount === 0}
              className={btnClass(false, selectedCount === 0)}
              title="Align Right Edges"
            >
              <AlignRight className="w-4 h-4 text-blue-400 mb-1" />
              <span className="text-[10px]">Right</span>
            </button>

            <button
              type="button"
              onClick={() => onAlign('distribute-h', alignTarget)}
              disabled={selectedCount < 2}
              className={btnClass(false, selectedCount < 2)}
              title="Distribute Horizontal Spacing Evenly (2+ items)"
            >
              <AlignHorizontalDistributeCenter className="w-4 h-4 text-blue-400 mb-1" />
              <span className="text-[10px]">Distribute</span>
            </button>
          </div>
        </div>

        {/* Vertical Alignment */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Vertical Alignment</span>
            <span className="text-[9px] text-zinc-400 font-mono">Y-Axis</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => onAlign('align-top', alignTarget)}
              disabled={selectedCount === 0}
              className={btnClass(false, selectedCount === 0)}
              title="Align Top Edges"
            >
              <AlignJustify className="w-4 h-4 text-violet-400 mb-1 rotate-90" />
              <span className="text-[10px]">Top</span>
            </button>

            <button
              type="button"
              onClick={() => onAlign('align-center-v', alignTarget)}
              disabled={selectedCount === 0}
              className={btnClass(false, selectedCount === 0)}
              title="Align Vertical Middle"
            >
              <AlignVerticalJustifyCenter className="w-4 h-4 text-violet-400 mb-1" />
              <span className="text-[10px]">Middle</span>
            </button>

            <button
              type="button"
              onClick={() => onAlign('align-bottom', alignTarget)}
              disabled={selectedCount === 0}
              className={btnClass(false, selectedCount === 0)}
              title="Align Bottom Edges"
            >
              <AlignJustify className="w-4 h-4 text-violet-400 mb-1 -rotate-90" />
              <span className="text-[10px]">Bottom</span>
            </button>

            <button
              type="button"
              onClick={() => onAlign('distribute-v', alignTarget)}
              disabled={selectedCount < 2}
              className={btnClass(false, selectedCount < 2)}
              title="Distribute Vertical Spacing Evenly (2+ items)"
            >
              <AlignVerticalDistributeCenter className="w-4 h-4 text-violet-400 mb-1" />
              <span className="text-[10px]">Distribute</span>
            </button>
          </div>
        </div>

        {/* Smart Snapping & Size Matching Utilities */}
        <div className="pt-1 border-t border-zinc-800/60">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onAlign('snap-to-grid', 'canvas')}
              disabled={selectedCount === 0}
              className={`p-2 rounded-xl text-[11px] font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                selectedCount === 0
                  ? 'opacity-40 cursor-not-allowed border-zinc-800 text-zinc-500'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-emerald-300 border-zinc-800'
              }`}
              title="Snap selected objects to the nearest grid lines"
            >
              <GridIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Snap to Grid</span>
            </button>

            <button
              type="button"
              onClick={() => onAlign('snap-to-nearest-object', 'canvas')}
              disabled={selectedCount === 0}
              className={`p-2 rounded-xl text-[11px] font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                selectedCount === 0
                  ? 'opacity-40 cursor-not-allowed border-zinc-800 text-zinc-500'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-amber-300 border-zinc-800'
              }`}
              title="Smart Magnet: Snap to nearest adjacent canvas object"
            >
              <Magnet className="w-3.5 h-3.5 text-amber-400" />
              <span>Snap Nearest</span>
            </button>
          </div>
        </div>

        {/* Empty selection guidance */}
        {selectedCount === 0 && (
          <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-[10px] text-cyan-300 flex flex-col gap-1.5">
            <div className="flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>No items currently selected</span>
            </div>
            <p className="text-zinc-400 leading-tight">
              Select images, shapes, or stickies using the Select tool (V) or drag a marquee to snap and align them.
            </p>
            {onSelectAll && (
              <button
                type="button"
                onClick={onSelectAll}
                className="mt-0.5 py-1 px-2 rounded-lg bg-cyan-500 text-black font-semibold text-[10px] hover:bg-cyan-400 transition-colors w-full"
              >
                Select All Canvas Objects
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
