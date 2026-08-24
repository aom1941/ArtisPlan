import React from 'react';
import { 
  Trash2, 
  Copy, 
  Lock, 
  Unlock, 
  ArrowUp, 
  ArrowDown, 
  Palette, 
  X,
  Type,
  Square,
  StickyNote,
  Image as ImageIcon,
  MessageSquare,
  Group,
  Ungroup,
  Layers,
  SlidersHorizontal,
  Tag
} from 'lucide-react';
import type { CanvasAlignmentAction } from '../../lib/alignmentEngine';
import { AlignmentPopover } from './AlignmentPopover';
import { QuickTagPopover } from './QuickTagPopover';

export interface SelectionActionBarProps {
  elementType?: 'image' | 'sticky' | 'text' | 'shape' | 'annotation' | 'multiple' | 'group';
  elementId?: string;
  selectedCount?: number;
  isGrouped?: boolean;
  canGroup?: boolean;
  canUngroup?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
  pan: { x: number; y: number };
  isLocked?: boolean;
  onGroup?: () => void;
  onUngroup?: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleLock?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onChangeColor?: (color: string) => void;
  currentColor?: string;
  tags?: string[];
  allAvailableTags?: string[];
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  onClearTags?: () => void;
  onAlign?: (action: CanvasAlignmentAction, target: 'selection' | 'canvas') => void;
  onClose: () => void;
  theme: 'dark' | 'light' | 'oled' | 'sepia' | 'companion';
}

const QUICK_COLORS = [
  '#06B6D4', // Cyan
  '#F43F5E', // Rose
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#FEF08A', // Yellow Note
  '#FFFFFF', // White
  '#18181B'  // Dark
];

export const SelectionActionBar: React.FC<SelectionActionBarProps> = ({
  elementType = 'multiple',
  elementId,
  selectedCount = 1,
  isGrouped = false,
  canGroup = false,
  canUngroup = false,
  x,
  y,
  width,
  height,
  zoom,
  pan,
  isLocked,
  onGroup,
  onUngroup,
  onDelete,
  onDuplicate,
  onToggleLock,
  onBringForward,
  onSendBackward,
  onChangeColor,
  currentColor,
  tags = [],
  allAvailableTags = [],
  onAddTag,
  onRemoveTag,
  onClearTags,
  onAlign,
  onClose,
  theme
}) => {
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showAlignPopover, setShowAlignPopover] = React.useState(false);
  const [showTagPopover, setShowTagPopover] = React.useState(false);

  // Compute screen position anchored above the element
  const screenX = x * zoom + pan.x;
  const screenY = y * zoom + pan.y;
  const scaledWidth = width * zoom;

  const getTypeIcon = () => {
    if (isGrouped || elementType === 'group') {
      return <Group className="w-3.5 h-3.5 text-cyan-400" />;
    }
    if (selectedCount > 1 || elementType === 'multiple') {
      return <Layers className="w-3.5 h-3.5 text-violet-400" />;
    }
    switch (elementType) {
      case 'shape': return <Square className="w-3.5 h-3.5 text-blue-400" />;
      case 'sticky': return <StickyNote className="w-3.5 h-3.5 text-amber-400" />;
      case 'text': return <Type className="w-3.5 h-3.5 text-purple-400" />;
      case 'image': return <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />;
      case 'annotation': return <MessageSquare className="w-3.5 h-3.5 text-rose-400" />;
      default: return <Layers className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getTypeName = () => {
    if (isGrouped || elementType === 'group') {
      return `Group (${selectedCount})`;
    }
    if (selectedCount > 1 || elementType === 'multiple') {
      return `${selectedCount} Selected`;
    }
    switch (elementType) {
      case 'shape': return 'Shape';
      case 'sticky': return 'Sticky Note';
      case 'text': return 'Text';
      case 'image': return 'Image';
      case 'annotation': return 'Pin';
      default: return 'Object';
    }
  };

  return (
    <div
      id="artisplan-selection-action-bar"
      className="absolute pointer-events-auto z-40 flex flex-col items-center select-none"
      style={{
        left: `${screenX + scaledWidth / 2}px`,
        top: `${Math.max(16, screenY - 48)}px`,
        transform: 'translateX(-50%)'
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 bg-[#121216]/95 backdrop-blur-xl border border-zinc-700/90 rounded-xl p-1 shadow-2xl shadow-black/80 text-xs animate-in fade-in zoom-in-95">
        {/* Type / Count Badge */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium text-[11px] border ${
          isGrouped 
            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80 shadow-sm' 
            : selectedCount > 1 
            ? 'bg-violet-950/80 text-violet-300 border-violet-800/80' 
            : 'bg-zinc-900/80 text-zinc-300 border-zinc-800'
        }`}>
          {getTypeIcon()}
          <span>{getTypeName()}</span>
        </div>

        {/* Group Action Button */}
        {canGroup && onGroup && (
          <button
            type="button"
            onClick={onGroup}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800/70 text-cyan-300 hover:text-cyan-100 transition-colors font-medium text-[11px]"
            title="Group Selected Elements (Ctrl+G)"
          >
            <Group className="w-3.5 h-3.5 text-cyan-400" />
            <span>Group</span>
            <span className="text-[9px] opacity-70 font-mono">⌘G</span>
          </button>
        )}

        {/* Ungroup Action Button */}
        {canUngroup && onUngroup && (
          <button
            type="button"
            onClick={onUngroup}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-800/70 text-amber-300 hover:text-amber-100 transition-colors font-medium text-[11px]"
            title="Ungroup Elements (Ctrl+Shift+G)"
          >
            <Ungroup className="w-3.5 h-3.5 text-amber-400" />
            <span>Ungroup</span>
            <span className="text-[9px] opacity-70 font-mono">⇧⌘G</span>
          </button>
        )}

        <div className="h-4 w-px bg-zinc-800 mx-0.5" />

        {/* Quick Tagging Popover Button */}
        {onAddTag && onRemoveTag && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowTagPopover(!showTagPopover);
                setShowColorPicker(false);
                setShowAlignPopover(false);
              }}
              className={`p-1.5 px-2 rounded-lg transition-all flex items-center gap-1.5 font-medium text-[11px] ${
                showTagPopover
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : tags.length > 0
                  ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 hover:bg-cyan-900'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
              }`}
              title="Quick Tagging Metadata (Searchable Tags)"
            >
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tags</span>
              {tags.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-400 text-black text-[9px] font-bold">
                  {tags.length}
                </span>
              ) : (
                <span className="text-[10px] text-zinc-500 font-mono">+</span>
              )}
            </button>

            {showTagPopover && (
              <QuickTagPopover
                elementType={elementType}
                selectedCount={selectedCount}
                tags={tags}
                allAvailableTags={allAvailableTags}
                onAddTag={onAddTag}
                onRemoveTag={onRemoveTag}
                onClearTags={onClearTags}
                onClose={() => setShowTagPopover(false)}
                theme={theme}
                anchorAlign="bottom"
              />
            )}
          </div>
        )}

        {/* Duplicate Button */}
        <button
          type="button"
          onClick={onDuplicate}
          className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors"
          title="Duplicate Element (Ctrl+D)"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Bring Forward / Send Backward */}
        {onBringForward && (
          <button
            type="button"
            onClick={onBringForward}
            className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors"
            title="Bring Forward (Ctrl+])"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        )}

        {onSendBackward && (
          <button
            type="button"
            onClick={onSendBackward}
            className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors"
            title="Send Backward (Ctrl+[)"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Color Palette Toggle (for shapes, text, stickies) */}
        {onChangeColor && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowTagPopover(false);
                setShowAlignPopover(false);
              }}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors flex items-center gap-1"
              title="Change Color"
            >
              {currentColor ? (
                <div 
                  className="w-3.5 h-3.5 rounded-full border border-white/40" 
                  style={{ backgroundColor: currentColor }} 
                />
              ) : (
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
              )}
            </button>

            {showColorPicker && (
              <div className="absolute top-9 left-1/2 -translate-x-1/2 bg-[#16161B] border border-zinc-800 rounded-xl p-2 shadow-2xl flex items-center gap-1.5 z-50">
                {QUICK_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      onChangeColor(c);
                      setShowColorPicker(false);
                    }}
                    className="w-5 h-5 rounded-full border border-zinc-700 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alignment & Snapping Menu */}
        {onAlign && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowAlignPopover(!showAlignPopover);
                setShowColorPicker(false);
                setShowTagPopover(false);
              }}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                showAlignPopover 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' 
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
              }`}
              title="Align & Snap Objects"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {showAlignPopover && (
              <AlignmentPopover
                selectedCount={selectedCount}
                onAlign={(action, target) => {
                  onAlign(action, target);
                  setShowAlignPopover(false);
                }}
                onClose={() => setShowAlignPopover(false)}
                theme={theme}
                anchorAlign="bottom"
              />
            )}
          </div>
        )}

        {/* Lock/Unlock Toggle */}
        {onToggleLock && (
          <button
            type="button"
            onClick={onToggleLock}
            className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors"
            title={isLocked ? "Unlock Position" : "Lock Position"}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        )}

        <div className="h-4 w-px bg-zinc-800 mx-0.5" />

        {/* Delete Button */}
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 px-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-rose-100 transition-colors flex items-center gap-1 font-medium text-[11px]"
          title="Delete (Del / Backspace)"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
          <span className="text-[9px] opacity-60 font-mono">Del</span>
        </button>

        {/* Deselect Close */}
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors ml-0.5"
          title="Deselect (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

