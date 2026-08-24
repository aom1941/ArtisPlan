import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Tag, 
  Plus, 
  X, 
  Sparkles, 
  Check, 
  Layers, 
  Search, 
  Trash2,
  Hash
} from 'lucide-react';

export interface QuickTagPopoverProps {
  elementType?: 'image' | 'sticky' | 'text' | 'shape' | 'annotation' | 'multiple' | 'group';
  selectedCount?: number;
  tags: string[];
  allAvailableTags?: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onClearTags?: () => void;
  onClose: () => void;
  theme?: 'dark' | 'light' | 'oled' | 'sepia' | 'companion';
  anchorAlign?: 'top' | 'bottom';
}

const PRESET_TAG_SUGGESTIONS = [
  'reference',
  'character',
  'background',
  'color-palette',
  'concept',
  'anatomy',
  'lighting',
  'wip',
  'rough-draft',
  'final',
  'props',
  'moodboard',
  'urgent',
  'feedback'
];

export const QuickTagPopover: React.FC<QuickTagPopoverProps> = ({
  elementType = 'image',
  selectedCount = 1,
  tags = [],
  allAvailableTags = [],
  onAddTag,
  onRemoveTag,
  onClearTags,
  onClose,
  theme = 'dark',
  anchorAlign = 'bottom'
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Auto-focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
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

  // Clean tags list
  const currentTags = useMemo(() => {
    return Array.from(new Set(tags.map(t => t.trim().toLowerCase().replace(/^#/, '')))).filter(Boolean);
  }, [tags]);

  // Combined suggestions: All unique available tags from project + default presets
  const suggestedTags = useMemo(() => {
    const combined = new Set<string>();
    allAvailableTags.forEach(t => {
      const clean = t.trim().toLowerCase().replace(/^#/, '');
      if (clean && !currentTags.includes(clean)) combined.add(clean);
    });
    PRESET_TAG_SUGGESTIONS.forEach(t => {
      if (!currentTags.includes(t)) combined.add(t);
    });
    return Array.from(combined);
  }, [allAvailableTags, currentTags]);

  // Filter suggestions based on current typing query
  const filteredSuggestions = useMemo(() => {
    const q = inputValue.trim().toLowerCase().replace(/^#/, '');
    if (!q) return suggestedTags.slice(0, 10);
    return suggestedTags.filter(t => t.includes(q)).slice(0, 8);
  }, [suggestedTags, inputValue]);

  const handleCommitTag = (rawTag: string) => {
    const clean = rawTag.trim().toLowerCase().replace(/^#/, '');
    if (!clean) return;

    // Handle comma or space separated batch input
    const parts = clean.split(/[, ]+/).filter(Boolean);
    parts.forEach(p => {
      if (p && !currentTags.includes(p)) {
        onAddTag(p);
      }
    });

    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        handleCommitTag(inputValue);
      }
    } else if (e.key === ',' || e.key === 'Tab') {
      if (inputValue.trim()) {
        e.preventDefault();
        handleCommitTag(inputValue);
      }
    }
  };

  const isLight = theme === 'light' || theme === 'sepia';

  return (
    <div
      ref={popoverRef}
      id="artisplan-quick-tag-popover"
      className={`absolute z-50 w-72 rounded-2xl p-3 shadow-2xl backdrop-blur-xl border select-none animate-in fade-in zoom-in-95 pointer-events-auto text-xs ${
        anchorAlign === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
      } ${
        isLight
          ? 'bg-white/95 border-zinc-200 text-zinc-900 shadow-zinc-400/30'
          : 'bg-[#121216]/95 border-zinc-700/90 text-zinc-100 shadow-black/80'
      }`}
      style={{
        left: '50%',
        transform: 'translateX(-50%)'
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-1.5 font-semibold text-[11px]">
          <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Tag className="w-3.5 h-3.5" />
          </div>
          <span className={isLight ? 'text-zinc-900' : 'text-zinc-200'}>
            Quick Tagging
          </span>
          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono border ${
            selectedCount > 1
              ? 'bg-violet-950/70 text-violet-300 border-violet-800/60'
              : 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60'
          }`}>
            {selectedCount > 1 ? `${selectedCount} items` : elementType}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
          title="Close (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tag Input Field */}
      <div className="relative mb-2.5">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-cyan-400">
          <Hash className="w-3.5 h-3.5" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a tag & press Enter..."
          className={`w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border outline-none transition-all ${
            isLight
              ? 'bg-zinc-100 border-zinc-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 text-zinc-900 placeholder:text-zinc-400'
              : 'bg-zinc-900/90 border-zinc-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-zinc-100 placeholder:text-zinc-500'
          }`}
        />
        {inputValue.trim() && (
          <button
            type="button"
            onClick={() => handleCommitTag(inputValue)}
            className="absolute inset-y-1 right-1 px-1.5 flex items-center justify-center rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 transition-colors"
            title="Add Tag (Enter)"
          >
            <Plus className="w-3 h-3 stroke-[3]" />
          </button>
        )}
      </div>

      {/* Active Tags on Element */}
      <div className="mb-2.5">
        <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5 px-0.5">
          <span>Active Metadata Tags ({currentTags.length})</span>
          {currentTags.length > 0 && onClearTags && (
            <button
              type="button"
              onClick={onClearTags}
              className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-0.5"
            >
              <Trash2 className="w-2.5 h-2.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {currentTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {currentTags.map(tag => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg text-[11px] font-medium border group transition-all ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:border-cyan-300'
                    : 'bg-cyan-950/60 text-cyan-200 border-cyan-700/60 hover:border-cyan-500/80'
                }`}
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="p-0.5 rounded hover:bg-rose-500 hover:text-white text-zinc-400 transition-colors"
                  title={`Remove #${tag}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="py-2 text-center text-[10px] text-zinc-500 italic rounded-lg bg-zinc-900/40 border border-zinc-800/40">
            No tags attached yet. Add tags for quick searchability.
          </div>
        )}
      </div>

      {/* Quick Suggested / Preset Tags */}
      <div>
        <div className="flex items-center gap-1 text-[10px] text-zinc-400 mb-1.5 px-0.5 font-medium">
          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
          <span>Suggested Tags</span>
        </div>

        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
          {filteredSuggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => handleCommitTag(s)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] border transition-all hover:scale-105 ${
                isLight
                  ? 'bg-zinc-100 hover:bg-cyan-100 text-zinc-700 hover:text-cyan-900 border-zinc-200'
                  : 'bg-zinc-900 hover:bg-cyan-950/80 text-zinc-300 hover:text-cyan-200 border-zinc-800 hover:border-cyan-700'
              }`}
              title={`Click to add #${s}`}
            >
              <Plus className="w-2.5 h-2.5 text-cyan-400 opacity-70" />
              <span>#{s}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-2.5 pt-2 border-t border-zinc-800/70 text-[9px] text-zinc-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Search className="w-2.5 h-2.5 text-cyan-400" />
          <span>Filter in Search Sidebar</span>
        </span>
        <span className="font-mono text-zinc-400">⌘F</span>
      </div>
    </div>
  );
};
