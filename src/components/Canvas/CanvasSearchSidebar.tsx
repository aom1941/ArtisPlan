import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  StickyNote, 
  Type, 
  Square, 
  Circle, 
  ArrowUpRight, 
  Minus, 
  Layout, 
  Image as ImageIcon, 
  MessageSquare, 
  Tag, 
  Layers, 
  Crosshair, 
  Maximize2, 
  Lock, 
  Unlock, 
  Trash2, 
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin
} from 'lucide-react';
import type { 
  ProjectData, 
  CanvasSticky, 
  CanvasText, 
  CanvasShape, 
  CanvasImage, 
  CanvasAnnotation,
  ShapeType
} from '../../types';

export type SearchCategory = 'all' | 'notes' | 'text' | 'shapes' | 'images' | 'annotations';

export interface SearchResultItem {
  id: string;
  type: 'sticky' | 'text' | 'shape' | 'image' | 'annotation';
  title: string;
  subtitle: string;
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  layerId: string;
  layerName: string;
  color?: string;
  tags?: string[];
  shapeType?: ShapeType;
  imageSrc?: string;
  locked?: boolean;
  status?: 'open' | 'in-progress' | 'resolved';
  author?: string;
  commentCount?: number;
  raw: CanvasSticky | CanvasText | CanvasShape | CanvasImage | CanvasAnnotation;
}

interface CanvasSearchSidebarProps {
  project: ProjectData;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToObject: (item: {
    id: string;
    type: 'sticky' | 'text' | 'shape' | 'image' | 'annotation';
    x: number;
    y: number;
    width?: number;
    height?: number;
  }) => void;
  onFitAllContent: () => void;
  onDeleteElement?: (type: 'sticky' | 'text' | 'shape' | 'image' | 'annotation', id: string) => void;
  onToggleImageLock?: (id: string) => void;
  onOpenAnnotation?: (annotation: CanvasAnnotation) => void;
  highlightedId?: string | null;
}

export const CanvasSearchSidebar: React.FC<CanvasSearchSidebarProps> = ({
  project,
  isOpen,
  onClose,
  onNavigateToObject,
  onFitAllContent,
  onDeleteElement,
  onToggleImageLock,
  onOpenAnnotation,
  highlightedId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const [selectedLayerId, setSelectedLayerId] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedShapeFilter, setSelectedShapeFilter] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  // Create Layer lookup map
  const layerMap = useMemo(() => {
    const map = new Map<string, string>();
    project.layers.forEach(l => map.set(l.id, l.name));
    return map;
  }, [project.layers]);

  // Extract all unique tags from images, notes, texts, shapes, annotations
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    project.images.forEach(img => {
      img.tags?.forEach(t => tagSet.add(t.toLowerCase().replace(/^#/, '')));
    });
    // Extract tags & hashtags from stickies
    project.stickies.forEach(s => {
      s.tags?.forEach(t => tagSet.add(t.toLowerCase().replace(/^#/, '')));
      const matches = s.text?.match(/#[a-zA-Z0-9_\-]+/g);
      if (matches) {
        matches.forEach(m => tagSet.add(m.substring(1).toLowerCase()));
      }
    });
    // Extract tags from texts
    project.texts.forEach(txt => {
      txt.tags?.forEach(t => tagSet.add(t.toLowerCase().replace(/^#/, '')));
    });
    // Extract tags from shapes
    project.shapes.forEach(sh => {
      sh.tags?.forEach(t => tagSet.add(t.toLowerCase().replace(/^#/, '')));
    });
    // Extract tags from annotations
    project.annotations.forEach(an => {
      an.tags?.forEach(t => tagSet.add(t.toLowerCase().replace(/^#/, '')));
    });
    return Array.from(tagSet);
  }, [project.images, project.stickies, project.texts, project.shapes, project.annotations]);

  // Transform all project canvas objects into uniform SearchResultItems
  const allItems = useMemo<SearchResultItem[]>(() => {
    const items: SearchResultItem[] = [];

    // 1. Sticky Notes
    project.stickies.forEach(sticky => {
      const hashtags = sticky.text?.match(/#[a-zA-Z0-9_\-]+/g) || [];
      const cleanHashtags = hashtags.map(h => h.substring(1).toLowerCase());
      const explicitTags = (sticky.tags || []).map(t => t.toLowerCase().replace(/^#/, ''));
      const combinedTags = Array.from(new Set([...cleanHashtags, ...explicitTags]));
      items.push({
        id: sticky.id,
        type: 'sticky',
        title: sticky.text ? sticky.text.split('\n')[0].substring(0, 45) : 'Untitled Sticky Note',
        subtitle: sticky.author ? `By ${sticky.author}` : 'Artist Note',
        content: `${sticky.text || ''} ${combinedTags.join(' ')}`,
        x: sticky.x,
        y: sticky.y,
        width: sticky.width || 180,
        height: sticky.height || 180,
        layerId: sticky.layerId,
        layerName: layerMap.get(sticky.layerId) || 'Default Layer',
        color: sticky.color,
        tags: combinedTags,
        author: sticky.author,
        raw: sticky
      });
    });

    // 2. Text Labels
    project.texts.forEach(txt => {
      const tags = (txt.tags || []).map(t => t.toLowerCase().replace(/^#/, ''));
      items.push({
        id: txt.id,
        type: 'text',
        title: txt.text ? txt.text.substring(0, 45) : 'Text Label',
        subtitle: `${txt.fontFamily || 'Outfit'} · ${txt.fontSize || 16}px`,
        content: `${txt.text || ''} ${tags.join(' ')}`,
        x: txt.x,
        y: txt.y,
        width: 140,
        height: 40,
        layerId: txt.layerId,
        layerName: layerMap.get(txt.layerId) || 'Default Layer',
        color: txt.color,
        tags,
        raw: txt
      });
    });

    // 3. Canvas Shapes
    project.shapes.forEach(shape => {
      const shapeLabel = shape.shapeType.charAt(0).toUpperCase() + shape.shapeType.slice(1);
      const tags = (shape.tags || []).map(t => t.toLowerCase().replace(/^#/, ''));
      items.push({
        id: shape.id,
        type: 'shape',
        title: `${shapeLabel} Shape`,
        subtitle: `${Math.round(shape.width)} × ${Math.round(shape.height)}px`,
        content: `${shape.shapeType} shape ${shape.strokeColor} ${shape.fillColor} ${tags.join(' ')}`,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        layerId: shape.layerId,
        layerName: layerMap.get(shape.layerId) || 'Default Layer',
        color: shape.strokeColor,
        shapeType: shape.shapeType,
        tags,
        raw: shape
      });
    });

    // 4. Pinned Reference Images
    project.images.forEach(img => {
      const tags = (img.tags || []).map(t => t.toLowerCase().replace(/^#/, ''));
      items.push({
        id: img.id,
        type: 'image',
        title: img.title || 'Reference Image',
        subtitle: `${Math.round(img.width)} × ${Math.round(img.height)}px${img.locked ? ' · Locked' : ''}`,
        content: `${img.title} ${tags.join(' ')}`,
        x: img.x,
        y: img.y,
        width: img.width,
        height: img.height,
        layerId: img.layerId,
        layerName: layerMap.get(img.layerId) || 'Default Layer',
        tags,
        imageSrc: img.src,
        locked: img.locked,
        raw: img
      });
    });

    // 5. Collaborative Annotation Pins
    project.annotations.forEach(anno => {
      const commentTexts = anno.comments.map(c => `${c.author}: ${c.text}`).join(' ');
      const tags = (anno.tags || []).map(t => t.toLowerCase().replace(/^#/, ''));
      items.push({
        id: anno.id,
        type: 'annotation',
        title: anno.title || 'Feedback Pin',
        subtitle: `${anno.comments.length} comment${anno.comments.length === 1 ? '' : 's'} · Status: ${anno.status}`,
        content: `${anno.title} ${anno.author} ${anno.status} ${commentTexts} ${tags.join(' ')}`,
        x: anno.x,
        y: anno.y,
        width: 48,
        height: 48,
        layerId: anno.layerId,
        layerName: layerMap.get(anno.layerId) || 'Default Layer',
        color: anno.color,
        status: anno.status,
        author: anno.author,
        commentCount: anno.comments.length,
        tags,
        raw: anno
      });
    });

    return items;
  }, [project.stickies, project.texts, project.shapes, project.images, project.annotations, layerMap]);

  // Category counts
  const counts = useMemo(() => {
    return {
      all: allItems.length,
      notes: allItems.filter(i => i.type === 'sticky').length,
      text: allItems.filter(i => i.type === 'text').length,
      shapes: allItems.filter(i => i.type === 'shape').length,
      images: allItems.filter(i => i.type === 'image').length,
      annotations: allItems.filter(i => i.type === 'annotation').length,
    };
  }, [allItems]);

  // Filter items based on user inputs
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return allItems.filter(item => {
      // 1. Category Filter
      if (selectedCategory === 'notes' && item.type !== 'sticky') return false;
      if (selectedCategory === 'text' && item.type !== 'text') return false;
      if (selectedCategory === 'shapes' && item.type !== 'shape') return false;
      if (selectedCategory === 'images' && item.type !== 'image') return false;
      if (selectedCategory === 'annotations' && item.type !== 'annotation') return false;

      // 2. Layer Filter
      if (selectedLayerId !== 'all' && item.layerId !== selectedLayerId) return false;

      // 3. Tag Filter
      if (selectedTag !== 'all') {
        const itemTags = item.tags || [];
        if (!itemTags.includes(selectedTag.toLowerCase())) return false;
      }

      // 4. Shape Type Filter
      if (selectedShapeFilter !== 'all' && item.shapeType !== selectedShapeFilter) return false;

      // 5. Search Query Filter
      if (!q) return true;

      const titleMatch = item.title.toLowerCase().includes(q);
      const subtitleMatch = item.subtitle.toLowerCase().includes(q);
      const contentMatch = item.content.toLowerCase().includes(q);
      const layerMatch = item.layerName.toLowerCase().includes(q);
      const tagMatch = item.tags?.some(t => t.toLowerCase().includes(q));
      const typeMatch = item.type.toLowerCase().includes(q);
      const shapeTypeMatch = item.shapeType?.toLowerCase().includes(q);
      const authorMatch = item.author?.toLowerCase().includes(q);

      return titleMatch || subtitleMatch || contentMatch || layerMatch || tagMatch || typeMatch || shapeTypeMatch || authorMatch;
    });
  }, [allItems, searchQuery, selectedCategory, selectedLayerId, selectedTag, selectedShapeFilter]);

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
        handleSelectItem(filteredItems[selectedIndex]);
      } else if (filteredItems.length > 0) {
        handleSelectItem(filteredItems[0]);
      }
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    onNavigateToObject({
      id: item.id,
      type: item.type,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height
    });
  };

  // Helper to render icon by item type
  const renderItemIcon = (item: SearchResultItem) => {
    switch (item.type) {
      case 'sticky':
        return (
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-black/10"
            style={{ backgroundColor: item.color || '#FEF08A' }}
          >
            <StickyNote className="w-4 h-4 text-slate-800" />
          </div>
        );
      case 'text':
        return (
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center shrink-0">
            <Type className="w-4 h-4 text-cyan-400" />
          </div>
        );
      case 'shape':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-800/80 flex items-center justify-center shrink-0">
            {item.shapeType === 'circle' && <Circle className="w-4 h-4 text-purple-400" />}
            {item.shapeType === 'arrow' && <ArrowUpRight className="w-4 h-4 text-purple-400" />}
            {item.shapeType === 'line' && <Minus className="w-4 h-4 text-purple-400" />}
            {item.shapeType === 'frame' && <Layout className="w-4 h-4 text-purple-400" />}
            {(!item.shapeType || item.shapeType === 'rectangle') && <Square className="w-4 h-4 text-purple-400" />}
          </div>
        );
      case 'image':
        if (item.imageSrc) {
          return (
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-zinc-700/80 bg-black/40">
              <img 
                src={item.imageSrc} 
                alt={item.title} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
          );
        }
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center shrink-0">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
          </div>
        );
      case 'annotation':
        return (
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md"
            style={{ backgroundColor: item.color || '#10B981' }}
          >
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
        );
    }
  };

  // Text highlight helper
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-amber-400/30 text-amber-200 px-0.5 rounded font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <aside 
      id="artisplan-canvas-search-sidebar"
      className="absolute top-14 left-0 bottom-0 w-80 sm:w-96 bg-[#101015]/95 backdrop-blur-2xl border-r border-zinc-800/90 shadow-2xl z-30 flex flex-col select-none animate-in fade-in slide-in-from-left-4 duration-200"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Search className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 font-['Outfit'] tracking-wide">
                Canvas Search & Navigator
              </h2>
              <p className="text-[11px] text-zinc-400">
                {allItems.length} object{allItems.length === 1 ? '' : 's'} on infinite board
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Fit All Content Button */}
            <button
              onClick={onFitAllContent}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/80 transition-colors"
              title="Fit and Center All Content in View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
              title="Close Search (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            placeholder="Search notes, shapes, tags, labels, pins..."
            className="w-full bg-[#181820] text-zinc-100 text-xs pl-9 pr-8 py-2.5 rounded-xl border border-zinc-700/70 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 placeholder:text-zinc-500 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setSelectedCategory('notes')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              selectedCategory === 'notes'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <StickyNote className="w-3 h-3" />
            Notes ({counts.notes})
          </button>
          <button
            onClick={() => setSelectedCategory('images')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              selectedCategory === 'images'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            Images ({counts.images})
          </button>
          <button
            onClick={() => setSelectedCategory('shapes')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              selectedCategory === 'shapes'
                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <Square className="w-3 h-3" />
            Shapes ({counts.shapes})
          </button>
          <button
            onClick={() => setSelectedCategory('text')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              selectedCategory === 'text'
                ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <Type className="w-3 h-3" />
            Text ({counts.text})
          </button>
          <button
            onClick={() => setSelectedCategory('annotations')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              selectedCategory === 'annotations'
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            Pins ({counts.annotations})
          </button>
        </div>
      </div>

      {/* Secondary Filters Bar (Layers & Tags) */}
      <div className="px-4 py-2 border-b border-zinc-800/60 bg-[#0C0C10] flex items-center gap-2 overflow-x-auto text-[11px] shrink-0">
        <Filter className="w-3 h-3 text-zinc-500 shrink-0" />
        
        {/* Layer Filter */}
        <select
          value={selectedLayerId}
          onChange={(e) => setSelectedLayerId(e.target.value)}
          className="bg-[#181820] text-zinc-300 px-2 py-1 rounded-lg border border-zinc-800 outline-none text-[11px] cursor-pointer"
        >
          <option value="all">All Layers</option>
          {project.layers.map(layer => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>

        {/* Tag Filter (if tags exist) */}
        {availableTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="bg-[#181820] text-zinc-300 px-2 py-1 rounded-lg border border-zinc-800 outline-none text-[11px] cursor-pointer"
          >
            <option value="all">All Tags</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        )}

        {/* Shape Type Filter (if shapes selected) */}
        {(selectedCategory === 'all' || selectedCategory === 'shapes') && counts.shapes > 0 && (
          <select
            value={selectedShapeFilter}
            onChange={(e) => setSelectedShapeFilter(e.target.value)}
            className="bg-[#181820] text-zinc-300 px-2 py-1 rounded-lg border border-zinc-800 outline-none text-[11px] cursor-pointer"
          >
            <option value="all">All Shapes</option>
            <option value="rectangle">Rectangle</option>
            <option value="circle">Circle</option>
            <option value="arrow">Arrow</option>
            <option value="line">Line</option>
            <option value="frame">Frame</option>
          </select>
        )}

        {(selectedLayerId !== 'all' || selectedTag !== 'all' || selectedShapeFilter !== 'all') && (
          <button
            onClick={() => {
              setSelectedLayerId('all');
              setSelectedTag('all');
              setSelectedShapeFilter('all');
            }}
            className="text-cyan-400 hover:text-cyan-300 text-[10px] underline ml-auto shrink-0"
          >
            Reset
          </button>
        )}
      </div>

      {/* Results List */}
      <div 
        ref={listContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
      >
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-zinc-600" />
            </div>
            <p className="text-xs font-semibold text-zinc-300 mb-1">
              No matching objects found
            </p>
            <p className="text-[11px] text-zinc-500 max-w-[200px] mx-auto leading-relaxed">
              Try searching by text keyword, shape type (e.g. "circle"), hashtag (#character), or change active filters.
            </p>
            {(searchQuery || selectedCategory !== 'all' || selectedLayerId !== 'all' || selectedTag !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedLayerId('all');
                  setSelectedTag('all');
                  setSelectedShapeFilter('all');
                }}
                className="mt-4 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isSelected = selectedIndex === idx;
            const isHighlighted = highlightedId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className={`group relative p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  isHighlighted
                    ? 'bg-cyan-950/40 border-cyan-500/80 shadow-lg shadow-cyan-950/30'
                    : isSelected
                    ? 'bg-[#1C1C24] border-zinc-600 shadow-md'
                    : 'bg-[#141419]/90 hover:bg-[#1A1A22] border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon / Thumbnail */}
                  {renderItemIcon(item)}

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-cyan-300 transition-colors">
                        {highlightMatch(item.title, searchQuery)}
                      </h3>

                      {/* Coordinates Chip */}
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                        {Math.round(item.x)}, {Math.round(item.y)}
                      </span>
                    </div>

                    {/* Subtitle / Snippet */}
                    {item.content && item.content !== item.title && (
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-sans leading-tight">
                        {highlightMatch(item.content, searchQuery)}
                      </p>
                    )}

                    {/* Metadata chips: Layer, Tags, Status */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
                      {/* Layer badge */}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium">
                        <Layers className="w-2.5 h-2.5 text-zinc-500" />
                        {item.layerName}
                      </span>

                      {/* Status for Annotations */}
                      {item.status && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium ${
                          item.status === 'resolved' 
                            ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                            : item.status === 'in-progress'
                            ? 'bg-amber-950/80 border border-amber-800 text-amber-300'
                            : 'bg-rose-950/80 border border-rose-800 text-rose-300'
                        }`}>
                          {item.status}
                        </span>
                      )}

                      {/* Tags */}
                      {item.tags && item.tags.slice(0, 3).map(tag => (
                        <span 
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTag(tag);
                          }}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/60 transition-colors"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          #{tag}
                        </span>
                      ))}

                      {/* Image Locked indicator */}
                      {item.locked && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-800/60 text-amber-400">
                          <Lock className="w-2.5 h-2.5" />
                          Locked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Navigation Jump Button */}
                  <div className="flex flex-col items-center justify-center self-center shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectItem(item);
                      }}
                      className="p-1.5 rounded-xl bg-[#20202A] hover:bg-cyan-500 hover:text-black text-zinc-400 transition-all opacity-70 group-hover:opacity-100 group-hover:scale-105"
                      title="Jump to position on canvas"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick Item Actions Bar (Hover) */}
                <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-zinc-400">
                  <span className="flex items-center gap-1 text-zinc-500">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    Click to zoom & pan
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Toggle image lock */}
                    {item.type === 'image' && onToggleImageLock && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleImageLock(item.id);
                        }}
                        className="hover:text-zinc-200 p-0.5"
                        title={item.locked ? "Unlock position" : "Lock position"}
                      >
                        {item.locked ? <Unlock className="w-3 h-3 text-amber-400" /> : <Lock className="w-3 h-3" />}
                      </button>
                    )}

                    {/* Open Annotation Thread */}
                    {item.type === 'annotation' && onOpenAnnotation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAnnotation(item.raw as CanvasAnnotation);
                        }}
                        className="hover:text-emerald-400 px-1 py-0.5 rounded bg-zinc-800"
                      >
                        Open thread
                      </button>
                    )}

                    {/* Delete Item */}
                    {onDeleteElement && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteElement(item.type, item.id);
                        }}
                        className="hover:text-rose-400 p-0.5"
                        title="Delete from canvas"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Shortcuts Help */}
      <div className="p-3 border-t border-zinc-800/80 bg-[#0C0C10] flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
        <div className="flex items-center gap-2">
          <span><kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">↓</kbd> navigate</span>
          <span><kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">Enter</kbd> jump</span>
        </div>
        <span><kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">Esc</kbd> close</span>
      </div>
    </aside>
  );
};
