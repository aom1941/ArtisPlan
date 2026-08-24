import React, { useEffect, useRef } from 'react';
import { 
  Group, 
  Ungroup, 
  Copy, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Lock, 
  Unlock, 
  CheckSquare, 
  X,
  Palette,
  Layers,
  SlidersHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Crosshair,
  Tag
} from 'lucide-react';
import type { CanvasAlignmentAction } from '../../lib/alignmentEngine';

export interface CanvasContextMenuProps {
  x: number;
  y: number;
  selectedCount: number;
  isGrouped: boolean;
  canGroup: boolean;
  canUngroup: boolean;
  isLocked?: boolean;
  onGroup?: () => void;
  onUngroup?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onToggleLock?: () => void;
  onOpenQuickTags?: () => void;
  onSelectAll?: () => void;
  onDeselect?: () => void;
  onAlign?: (action: CanvasAlignmentAction, target: 'selection' | 'canvas') => void;
  onClose: () => void;
  theme: 'dark' | 'light' | 'oled' | 'sepia' | 'companion';
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  x,
  y,
  selectedCount,
  isGrouped,
  canGroup,
  canUngroup,
  isLocked,
  onGroup,
  onUngroup,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  onToggleLock,
  onOpenQuickTags,
  onSelectAll,
  onDeselect,
  onAlign,
  onClose,
  theme
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust menu position so it doesn't overflow screen boundaries
  const adjustedX = Math.min(Math.max(10, x), window.innerWidth - 240);
  const adjustedY = Math.min(Math.max(10, y), window.innerHeight - 340);

  return (
    <div
      ref={menuRef}
      id="artisplan-canvas-context-menu"
      className="fixed z-50 min-w-[210px] rounded-2xl bg-[#131318]/95 backdrop-blur-xl border border-zinc-700/80 p-1.5 shadow-2xl shadow-black/80 text-xs select-none animate-in fade-in zoom-in-95"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        color: '#E4E4E7'
      }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header Info */}
      <div className="px-2.5 py-1.5 mb-1 flex items-center justify-between text-[11px] font-semibold text-zinc-400 border-b border-zinc-800/80">
        <span className="flex items-center gap-1.5">
          {isGrouped ? (
            <>
              <Group className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-300">Group Entity ({selectedCount})</span>
            </>
          ) : selectedCount > 1 ? (
            <>
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-violet-300">{selectedCount} Objects Selected</span>
            </>
          ) : selectedCount === 1 ? (
            <span>1 Object Selected</span>
          ) : (
            <span>Canvas Context</span>
          )}
        </span>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-0.5">
        {/* Group Action */}
        {canGroup && (
          <button
            type="button"
            onClick={() => {
              if (onGroup) onGroup();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-100 transition-colors font-medium"
          >
            <div className="flex items-center gap-2">
              <Group className="w-4 h-4 text-cyan-400" />
              <span>Group Objects</span>
            </div>
            <kbd className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/70 border border-cyan-800/50 px-1 py-0.5 rounded">Ctrl+G</kbd>
          </button>
        )}

        {/* Ungroup Action */}
        {canUngroup && (
          <button
            type="button"
            onClick={() => {
              if (onUngroup) onUngroup();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-amber-500/20 text-amber-300 hover:text-amber-100 transition-colors font-medium"
          >
            <div className="flex items-center gap-2">
              <Ungroup className="w-4 h-4 text-amber-400" />
              <span>Ungroup Elements</span>
            </div>
            <kbd className="text-[10px] font-mono text-amber-400/80 bg-amber-950/70 border border-amber-800/50 px-1 py-0.5 rounded">Ctrl+Shift+G</kbd>
          </button>
        )}

        {(canGroup || canUngroup) && <div className="h-px bg-zinc-800/80 my-1" />}

        {/* Duplicate */}
        {selectedCount > 0 && onDuplicate && (
          <button
            type="button"
            onClick={() => {
              onDuplicate();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Duplicate</span>
            </div>
            <kbd className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1 py-0.5 rounded">Ctrl+D</kbd>
          </button>
        )}

        {/* Bring Forward / Send Backward */}
        {selectedCount > 0 && onBringForward && (
          <button
            type="button"
            onClick={() => {
              onBringForward();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <ArrowUp className="w-3.5 h-3.5 text-zinc-400" />
              <span>Bring Forward</span>
            </div>
            <kbd className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1 py-0.5 rounded">Ctrl+]</kbd>
          </button>
        )}

        {selectedCount > 0 && onSendBackward && (
          <button
            type="button"
            onClick={() => {
              onSendBackward();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <ArrowDown className="w-3.5 h-3.5 text-zinc-400" />
              <span>Send Backward</span>
            </div>
            <kbd className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1 py-0.5 rounded">Ctrl+[</kbd>
          </button>
        )}

        {/* Lock/Unlock */}
        {selectedCount > 0 && onToggleLock && (
          <button
            type="button"
            onClick={() => {
              onToggleLock();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              {isLocked ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{isLocked ? 'Unlock Position' : 'Lock Position'}</span>
            </div>
            <kbd className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1 py-0.5 rounded">Ctrl+L</kbd>
          </button>
        )}

        {/* Quick Tagging */}
        {selectedCount > 0 && onOpenQuickTags && (
          <button
            type="button"
            onClick={() => {
              onOpenQuickTags();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quick Tag Element...</span>
            </div>
            <kbd className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/70 border border-cyan-800/50 px-1 py-0.5 rounded">T</kbd>
          </button>
        )}

        {/* Alignment Actions */}
        {selectedCount > 0 && onAlign && (
          <>
            <div className="h-px bg-zinc-800/80 my-1" />
            <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
              <span>Align & Snap</span>
            </div>

            <button
              type="button"
              onClick={() => {
                onAlign('center-canvas-both', 'canvas');
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span>Snap to Canvas Center</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400/80">(0,0)</span>
            </button>

            {selectedCount >= 2 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onAlign('align-center-h', 'selection');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlignCenter className="w-3.5 h-3.5 text-blue-400" />
                    <span>Align Center (H)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onAlign('align-center-v', 'selection');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlignCenter className="w-3.5 h-3.5 text-violet-400 rotate-90" />
                    <span>Align Middle (V)</span>
                  </div>
                </button>
              </>
            )}
          </>
        )}

        {selectedCount > 0 && <div className="h-px bg-zinc-800/80 my-1" />}

        {/* Select All */}
        {onSelectAll && (
          <button
            type="button"
            onClick={() => {
              onSelectAll();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select All</span>
            </div>
            <kbd className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1 py-0.5 rounded">Ctrl+A</kbd>
          </button>
        )}

        {/* Deselect */}
        {selectedCount > 0 && onDeselect && (
          <button
            type="button"
            onClick={() => {
              onDeselect();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <X className="w-3.5 h-3.5 text-zinc-500" />
              <span>Deselect</span>
            </div>
            <kbd className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1 py-0.5 rounded">Esc</kbd>
          </button>
        )}

        {/* Delete */}
        {selectedCount > 0 && onDelete && (
          <>
            <div className="h-px bg-zinc-800/80 my-1" />
            <button
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-rose-950/70 text-rose-300 hover:text-rose-100 transition-colors font-medium"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete {selectedCount > 1 ? `(${selectedCount})` : ''}</span>
              </div>
              <kbd className="text-[10px] font-mono text-rose-400/80 bg-rose-950 px-1 py-0.5 rounded">Del</kbd>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
