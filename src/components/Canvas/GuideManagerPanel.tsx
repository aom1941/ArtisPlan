import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Sliders, 
  X, 
  Check, 
  Minus,
  Palette,
  Edit3, 
  Copy, 
  Maximize2, 
  Crosshair, 
  ChevronRight, 
  Search, 
  Sparkles,
  Move,
  LayoutGrid,
  Layers,
  ArrowRightLeft,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';
import type { CanvasCustomGuide } from '../../types';

interface GuideManagerPanelProps {
  guides: CanvasCustomGuide[];
  onUpdateGuides: (guides: CanvasCustomGuide[]) => void;
  onFocusGuide?: (guide: CanvasCustomGuide) => void;
  onClose: () => void;
  theme?: 'dark' | 'light' | 'oled' | 'sepia';
}

const PRESET_COLORS = [
  { hex: '#06B6D4', label: 'Electric Cyan' },
  { hex: '#F43F5E', label: 'Neon Rose' },
  { hex: '#10B981', label: 'Emerald' },
  { hex: '#8B5CF6', label: 'Violet' },
  { hex: '#F59E0B', label: 'Amber' },
  { hex: '#EC4899', label: 'Hot Pink' },
  { hex: '#3B82F6', label: 'Sky Blue' },
  { hex: '#F97316', label: 'Orange' },
  { hex: '#E2E8F0', label: 'Slate White' }
];

export const GuideManagerPanel: React.FC<GuideManagerPanelProps> = ({
  guides = [],
  onUpdateGuides,
  onFocusGuide,
  onClose,
  theme = 'dark'
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'horizontal' | 'vertical'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [colorPickerGuideId, setColorPickerGuideId] = useState<string | null>(null);
  
  // Multi-Selection State
  const [selectedGuideIds, setSelectedGuideIds] = useState<string[]>([]);
  const [showBatchColorPicker, setShowBatchColorPicker] = useState(false);

  // New Guide Form State
  const [newOrientation, setNewOrientation] = useState<'horizontal' | 'vertical'>('vertical');
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState<number>(300);
  const [newColor, setNewColor] = useState<string>('#06B6D4');
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);

  // Filtered Guides
  const filteredGuides = useMemo(() => {
    return guides.filter(g => {
      if (activeTab === 'horizontal' && g.orientation !== 'horizontal') return false;
      if (activeTab === 'vertical' && g.orientation !== 'vertical') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = g.name.toLowerCase().includes(q);
        const matchesPos = g.position.toString().includes(q);
        return matchesName || matchesPos;
      }
      return true;
    });
  }, [guides, activeTab, searchQuery]);

  // Clean up selectedGuideIds if guides are deleted
  const validSelectedIds = useMemo(() => {
    const guideIdSet = new Set(guides.map(g => g.id));
    return selectedGuideIds.filter(id => guideIdSet.has(id));
  }, [selectedGuideIds, guides]);

  const isAllFilteredSelected = filteredGuides.length > 0 && filteredGuides.every(g => validSelectedIds.includes(g.id));
  const isSomeFilteredSelected = filteredGuides.some(g => validSelectedIds.includes(g.id)) && !isAllFilteredSelected;

  // Multi-select handlers
  const handleToggleSelectGuide = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedGuideIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredGuides.map(g => g.id));
      setSelectedGuideIds(prev => prev.filter(id => !filteredIds.has(id)));
    } else {
      const newIds = new Set([...selectedGuideIds, ...filteredGuides.map(g => g.id)]);
      setSelectedGuideIds(Array.from(newIds));
    }
  };

  const handleClearSelection = () => {
    setSelectedGuideIds([]);
    setShowBatchColorPicker(false);
  };

  const handleBatchDelete = () => {
    if (validSelectedIds.length === 0) return;
    const count = validSelectedIds.length;
    if (window.confirm(`Delete ${count} selected guideline${count > 1 ? 's' : ''}?`)) {
      const toDelete = new Set(validSelectedIds);
      onUpdateGuides(guides.filter(g => !toDelete.has(g.id)));
      setSelectedGuideIds([]);
      setShowBatchColorPicker(false);
    }
  };

  const handleBatchChangeColor = (colorHex: string) => {
    if (validSelectedIds.length === 0) return;
    const selectedSet = new Set(validSelectedIds);
    onUpdateGuides(guides.map(g => selectedSet.has(g.id) ? { ...g, color: colorHex } : g));
    setShowBatchColorPicker(false);
  };

  const handleBatchToggleLock = () => {
    if (validSelectedIds.length === 0) return;
    const selectedSet = new Set(validSelectedIds);
    const selectedGuides = guides.filter(g => selectedSet.has(g.id));
    const allLocked = selectedGuides.every(g => g.locked);
    onUpdateGuides(guides.map(g => selectedSet.has(g.id) ? { ...g, locked: !allLocked } : g));
  };

  const handleBatchToggleVisibility = () => {
    if (validSelectedIds.length === 0) return;
    const selectedSet = new Set(validSelectedIds);
    const selectedGuides = guides.filter(g => selectedSet.has(g.id));
    const allVisible = selectedGuides.every(g => g.visible !== false);
    onUpdateGuides(guides.map(g => selectedSet.has(g.id) ? { ...g, visible: !allVisible } : g));
  };

  // Global counts
  const horizontalCount = guides.filter(g => g.orientation === 'horizontal').length;
  const verticalCount = guides.filter(g => g.orientation === 'vertical').length;
  const lockedCount = guides.filter(g => g.locked).length;
  const visibleCount = guides.filter(g => g.visible !== false).length;

  // Handlers
  const handleAddGuide = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const guideName = newName.trim() || `${newOrientation === 'vertical' ? 'Vertical' : 'Horizontal'} Guide @ ${newPosition}px`;
    
    const newGuide: CanvasCustomGuide = {
      id: `guide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: guideName,
      orientation: newOrientation,
      position: Number(newPosition) || 0,
      color: newColor,
      locked: false,
      visible: true,
      createdAt: Date.now()
    };

    onUpdateGuides([...guides, newGuide]);
    setNewName('');
    // Auto increment next position slightly for convenient continuous additions
    setNewPosition(prev => prev + 100);
  };

  const handleUpdateSingleGuide = (id: string, updates: Partial<CanvasCustomGuide>) => {
    onUpdateGuides(guides.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const handleDeleteGuide = (id: string) => {
    onUpdateGuides(guides.filter(g => g.id !== id));
  };

  const handleDuplicateGuide = (guide: CanvasCustomGuide) => {
    const duplicated: CanvasCustomGuide = {
      ...guide,
      id: `guide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${guide.name} (Copy)`,
      position: guide.position + 50,
      createdAt: Date.now()
    };
    onUpdateGuides([...guides, duplicated]);
  };

  const handleStartRename = (guide: CanvasCustomGuide) => {
    setEditingId(guide.id);
    setEditingName(guide.name);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      handleUpdateSingleGuide(id, { name: editingName.trim() });
    }
    setEditingId(null);
  };

  const handleNudgePosition = (id: string, currentPos: number, delta: number) => {
    handleUpdateSingleGuide(id, { position: Math.round(currentPos + delta) });
  };

  const handleToggleAllVisibility = () => {
    const shouldShow = visibleCount < guides.length;
    onUpdateGuides(guides.map(g => ({ ...g, visible: shouldShow })));
  };

  const handleToggleAllLocks = () => {
    const shouldLock = lockedCount < guides.length;
    onUpdateGuides(guides.map(g => ({ ...g, locked: shouldLock })));
  };

  const handleClearAllGuides = () => {
    if (guides.length === 0) return;
    if (window.confirm(`Are you sure you want to remove all ${guides.length} guidelines?`)) {
      onUpdateGuides([]);
    }
  };

  // Preset Layout Generators
  const handleApplyPreset = (presetType: 'origin' | 'rule-of-thirds' | 'cinema' | 'margins') => {
    let presetGuides: CanvasCustomGuide[] = [];

    if (presetType === 'origin') {
      presetGuides = [
        {
          id: `guide-origin-x-${Date.now()}`,
          name: 'Center Origin X (0,0)',
          orientation: 'vertical',
          position: 0,
          color: '#F43F5E',
          locked: false,
          visible: true
        },
        {
          id: `guide-origin-y-${Date.now()}`,
          name: 'Center Origin Y (0,0)',
          orientation: 'horizontal',
          position: 0,
          color: '#06B6D4',
          locked: false,
          visible: true
        }
      ];
    } else if (presetType === 'rule-of-thirds') {
      // 1920x1080 composition third lines (approx 0..1200x800 bounding frame)
      presetGuides = [
        { id: `guide-rot-v1-${Date.now()}`, name: 'Thirds Left (X: 300)', orientation: 'vertical', position: 300, color: '#10B981', locked: false, visible: true },
        { id: `guide-rot-v2-${Date.now()}`, name: 'Thirds Right (X: 700)', orientation: 'vertical', position: 700, color: '#10B981', locked: false, visible: true },
        { id: `guide-rot-h1-${Date.now()}`, name: 'Thirds Top (Y: 200)', orientation: 'horizontal', position: 200, color: '#10B981', locked: false, visible: true },
        { id: `guide-rot-h2-${Date.now()}`, name: 'Thirds Bottom (Y: 500)', orientation: 'horizontal', position: 500, color: '#10B981', locked: false, visible: true }
      ];
    } else if (presetType === 'cinema') {
      presetGuides = [
        { id: `guide-cin-top-${Date.now()}`, name: 'Cinema 2.39:1 Top Mat', orientation: 'horizontal', position: 100, color: '#F59E0B', locked: true, visible: true },
        { id: `guide-cin-bot-${Date.now()}`, name: 'Cinema 2.39:1 Bottom Mat', orientation: 'horizontal', position: 600, color: '#F59E0B', locked: true, visible: true }
      ];
    } else if (presetType === 'margins') {
      presetGuides = [
        { id: `guide-mar-left-${Date.now()}`, name: 'Safe Margin Left', orientation: 'vertical', position: 100, color: '#8B5CF6', locked: false, visible: true },
        { id: `guide-mar-right-${Date.now()}`, name: 'Safe Margin Right', orientation: 'vertical', position: 900, color: '#8B5CF6', locked: false, visible: true },
        { id: `guide-mar-top-${Date.now()}`, name: 'Safe Margin Top', orientation: 'horizontal', position: 80, color: '#8B5CF6', locked: false, visible: true },
        { id: `guide-mar-bottom-${Date.now()}`, name: 'Safe Margin Bottom', orientation: 'horizontal', position: 650, color: '#8B5CF6', locked: false, visible: true }
      ];
    }

    onUpdateGuides([...guides, ...presetGuides]);
    setShowPresetsMenu(false);
  };

  const isLight = theme === 'light';

  return (
    <div 
      className={`fixed top-16 right-4 w-[380px] max-w-[calc(100vw-32px)] max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-right-4 select-none ${
        isLight 
          ? 'bg-white/95 border-zinc-200 text-zinc-800 shadow-zinc-400/30' 
          : 'bg-[#121216]/98 border-zinc-800/90 text-zinc-100 shadow-black/80'
      }`}
    >
      {/* 1. Header */}
      <div className={`p-4 border-b flex items-center justify-between ${isLight ? 'border-zinc-200' : 'border-zinc-800/80'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-rose-500 p-0.5 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Compass className="w-4 h-4 text-cyan-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight">Guide Manager</h2>
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-semibold">
                {guides.length}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Magnetic precision guidelines & alignment anchors</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Global Show/Hide All Declutter Button */}
          {guides.length > 0 && (
            <button
              type="button"
              onClick={handleToggleAllVisibility}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                visibleCount === 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : visibleCount === guides.length
                  ? 'bg-zinc-800/80 text-zinc-300 border-zinc-700/80 hover:text-white hover:bg-zinc-700'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
              }`}
              title={visibleCount === 0 ? 'Show all guidelines on canvas' : 'Hide all guidelines on canvas to declutter view'}
            >
              {visibleCount === 0 ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hidden ({guides.length})</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{visibleCount === guides.length ? 'Hide All' : `Visible (${visibleCount})`}</span>
                </>
              )}
            </button>
          )}

          {/* Quick Presets Menu */}
          <div className="relative">
            <button
              onClick={() => setShowPresetsMenu(!showPresetsMenu)}
              className={`p-1.5 rounded-xl border transition-colors ${
                showPresetsMenu
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
              title="Composition Guide Presets"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {showPresetsMenu && (
              <div className={`absolute right-0 top-9 w-52 p-1.5 rounded-xl border shadow-xl backdrop-blur-xl z-50 space-y-1 ${
                isLight ? 'bg-white border-zinc-200 shadow-zinc-400/40' : 'bg-zinc-900 border-zinc-800 shadow-black/80'
              }`}>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Composition Presets
                </div>
                <button
                  onClick={() => handleApplyPreset('origin')}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center gap-2 transition-colors"
                >
                  <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                  <span>Center Crosshair (0,0)</span>
                </button>
                <button
                  onClick={() => handleApplyPreset('rule-of-thirds')}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center gap-2 transition-colors"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rule of Thirds Grid</span>
                </button>
                <button
                  onClick={() => handleApplyPreset('margins')}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center gap-2 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-violet-400" />
                  <span>Safe Framing Margins</span>
                </button>
                <button
                  onClick={() => handleApplyPreset('cinema')}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center gap-2 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>2.39:1 Cinema Letterbox</span>
                </button>
              </div>
            )}
          </div>

          {/* Close Panel Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
            title="Close Guide Manager"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. New Guide Creator Bar */}
      <form onSubmit={handleAddGuide} className={`p-3 border-b space-y-2.5 ${isLight ? 'bg-zinc-50/80 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800/80'}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-cyan-400" /> Add Guideline
          </span>

          {/* Orientation Toggle Pills */}
          <div className="flex items-center p-0.5 rounded-lg bg-zinc-800/80 border border-zinc-700/50 text-[11px]">
            <button
              type="button"
              onClick={() => setNewOrientation('vertical')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all ${
                newOrientation === 'vertical'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Vertical (X)</span>
            </button>
            <button
              type="button"
              onClick={() => setNewOrientation('horizontal')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all ${
                newOrientation === 'horizontal'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>Horizontal (Y)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2">
          {/* Guide Name */}
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={newOrientation === 'vertical' ? 'e.g. Left Spine' : 'e.g. Baseline 01'}
            className={`col-span-6 px-2.5 py-1.5 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-cyan-400 ${
              isLight ? 'bg-white border-zinc-300 text-zinc-800' : 'bg-zinc-950/80 border-zinc-800 text-zinc-100'
            }`}
          />

          {/* Position Input */}
          <div className="col-span-4 relative flex items-center">
            <span className="absolute left-2 text-[11px] font-mono text-zinc-500">
              {newOrientation === 'vertical' ? 'X:' : 'Y:'}
            </span>
            <input
              type="number"
              value={newPosition}
              onChange={(e) => setNewPosition(Number(e.target.value))}
              className={`w-full pl-6 pr-2 py-1.5 rounded-xl border text-xs font-mono outline-none focus:ring-1 focus:ring-cyan-400 ${
                isLight ? 'bg-white border-zinc-300 text-zinc-800' : 'bg-zinc-950/80 border-zinc-800 text-zinc-100'
              }`}
            />
          </div>

          {/* Add Button */}
          <button
            type="submit"
            className="col-span-2 py-1.5 px-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
            title="Create Guideline"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Color Strip for New Guide */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-400">Color:</span>
            <div className="flex items-center gap-1">
              {PRESET_COLORS.slice(0, 6).map(color => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setNewColor(color.hex)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    newColor === color.hex ? 'scale-125 ring-2 ring-white shadow' : 'hover:scale-110 opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
            <span>Selected:</span>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: newColor }} />
            <span>{newColor}</span>
          </div>
        </div>
      </form>

      {/* 3. Search & Category Filter */}
      <div className={`p-2.5 border-b space-y-2 ${isLight ? 'border-zinc-200' : 'border-zinc-800/80'}`}>
        <div className="flex items-center justify-between gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-zinc-800/50 border border-zinc-700/40 text-[11px]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2 py-1 rounded-lg transition-all ${
                activeTab === 'all' ? 'bg-zinc-700 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({guides.length})
            </button>
            <button
              onClick={() => setActiveTab('horizontal')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'horizontal' ? 'bg-cyan-500/20 text-cyan-300 font-medium border border-cyan-500/30' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>H ({horizontalCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('vertical')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'vertical' ? 'bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>V ({verticalCount})</span>
            </button>
          </div>

          {/* Global Quick Toggles */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleAllVisibility}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
              title={visibleCount === guides.length ? 'Hide All Guides' : 'Show All Guides'}
            >
              {visibleCount === guides.length ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleToggleAllLocks}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
              title={lockedCount === guides.length ? 'Unlock All Guides' : 'Lock All Guides'}
            >
              {lockedCount === guides.length ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleClearAllGuides}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Clear All Guidelines"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Field & Select-All Quick Action */}
        <div className="flex items-center gap-2">
          {/* Quick Select All Checkbox Trigger */}
          {filteredGuides.length > 0 && (
            <button
              type="button"
              onClick={handleToggleSelectAllFiltered}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                isAllFilteredSelected
                  ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-sm shadow-cyan-500/30 font-bold'
                  : isSomeFilteredSelected
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : isLight
                  ? 'bg-zinc-100 border-zinc-300 text-transparent hover:border-zinc-400'
                  : 'bg-zinc-900 border-zinc-700 text-transparent hover:border-zinc-500'
              }`}
              title={isAllFilteredSelected ? 'Deselect all filtered guides' : 'Select all filtered guides'}
            >
              {isAllFilteredSelected ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : isSomeFilteredSelected ? (
                <Minus className="w-3.5 h-3.5 stroke-[3]" />
              ) : null}
            </button>
          )}

          <div className="relative flex-1 flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guidelines by name or px..."
              className={`w-full pl-8 pr-2.5 py-1 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-cyan-400 ${
                isLight ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-200'
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Batch Action Toolbar (Visible when 1 or more guides are selected) */}
      {validSelectedIds.length > 0 && (
        <div className={`px-3 py-2 border-b flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1 ${
          isLight ? 'bg-cyan-50/90 border-cyan-200 text-zinc-800' : 'bg-cyan-950/40 border-cyan-800/50 text-cyan-100'
        }`}>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold">
              {validSelectedIds.length} selected
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Batch Color Swatch Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBatchColorPicker(!showBatchColorPicker)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  showBatchColorPicker
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                    : 'bg-zinc-800/80 border-zinc-700 hover:bg-zinc-700 text-zinc-200'
                }`}
                title="Change color of selected guidelines"
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Color</span>
              </button>

              {/* Batch Color Palette Popover */}
              {showBatchColorPicker && (
                <div className={`absolute right-0 top-8 p-2.5 rounded-xl border shadow-2xl z-50 w-52 backdrop-blur-xl ${
                  isLight ? 'bg-white border-zinc-200 shadow-zinc-400/40' : 'bg-zinc-900 border-zinc-800 shadow-black/90'
                }`}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Batch Set Color ({validSelectedIds.length})
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => handleBatchChangeColor(c.hex)}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110 opacity-90 hover:opacity-100 shadow"
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      />
                    ))}
                  </div>

                  {/* Custom Hex Color for Batch */}
                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-400">Custom:</span>
                    <input
                      type="color"
                      defaultValue="#06B6D4"
                      onChange={(e) => handleBatchChangeColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                      title="Pick custom color for selected"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Batch Lock / Unlock */}
            <button
              type="button"
              onClick={handleBatchToggleLock}
              className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 transition-colors"
              title="Toggle Lock for selected guides"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>

            {/* Batch Visibility */}
            <button
              type="button"
              onClick={handleBatchToggleVisibility}
              className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 transition-colors"
              title="Toggle Visibility for selected guides"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Batch Delete */}
            <button
              type="button"
              onClick={handleBatchDelete}
              className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-sm active:scale-95"
              title={`Delete ${validSelectedIds.length} selected guidelines`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            {/* Deselect All */}
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors ml-0.5"
              title="Deselect all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Guidelines List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[140px] max-h-[360px]">
        {/* All Hidden Declutter Notice Banner */}
        {guides.length > 0 && visibleCount === 0 && (
          <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs mb-2 ${
            isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <EyeOff className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">All guidelines are currently hidden for a clean canvas view.</span>
            </div>
            <button
              type="button"
              onClick={handleToggleAllVisibility}
              className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 transition-colors shadow-sm"
            >
              Show All
            </button>
          </div>
        )}

        {filteredGuides.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Compass className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-zinc-400">No guidelines found</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              {searchQuery ? 'Try another search term or filter' : 'Add custom horizontal/vertical guide lines above or use a preset layout'}
            </p>
            {!searchQuery && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  onClick={() => handleApplyPreset('origin')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-medium border border-cyan-500/30 transition-colors"
                >
                  + Center (0,0)
                </button>
                <button
                  onClick={() => handleApplyPreset('rule-of-thirds')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-colors"
                >
                  + Rule of Thirds
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredGuides.map((guide) => {
            const isEditing = editingId === guide.id;
            const isColorPickerOpen = colorPickerGuideId === guide.id;
            const isHorizontal = guide.orientation === 'horizontal';
            const isSelected = validSelectedIds.includes(guide.id);

            return (
              <div
                key={guide.id}
                className={`p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? isLight
                      ? 'bg-cyan-50/80 border-cyan-400 ring-1 ring-cyan-400/50 shadow-sm'
                      : 'bg-cyan-950/30 border-cyan-500/60 ring-1 ring-cyan-500/40 shadow-md'
                    : isLight 
                    ? 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300' 
                    : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 shadow-md'
                } ${guide.visible === false ? 'opacity-50' : ''}`}
              >
                {/* Row 1: Checkbox, Orientation icon, Name, Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Multi-Select Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSelectGuide(guide.id, e)}
                      className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-all shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-sm'
                          : isLight
                          ? 'bg-white border-zinc-300 hover:border-zinc-400'
                          : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
                      }`}
                      title={isSelected ? 'Deselect guide' : 'Select guide for batch action'}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    {/* Orientation Icon with Guideline Color accent */}
                    <div 
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border"
                      style={{ 
                        backgroundColor: `${guide.color}15`, 
                        borderColor: `${guide.color}60`,
                        color: guide.color 
                      }}
                      title={`${isHorizontal ? 'Horizontal (Y)' : 'Vertical (X)'} Guide`}
                    >
                      {isHorizontal ? (
                        <ArrowUpDown className="w-3 h-3" />
                      ) : (
                        <ArrowRightLeft className="w-3 h-3" />
                      )}
                    </div>

                    {/* Name / Inline Rename Input */}
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(guide.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                          className={`w-full px-2 py-0.5 rounded-lg border text-xs outline-none focus:ring-1 focus:ring-cyan-400 ${
                            isLight ? 'bg-zinc-100 border-zinc-300' : 'bg-zinc-900 border-zinc-700 text-white'
                          }`}
                        />
                        <button
                          onClick={() => handleSaveRename(guide.id)}
                          className="p-1 rounded bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="flex-1 min-w-0 cursor-pointer group"
                        onClick={() => handleStartRename(guide)}
                        title="Click to rename"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold truncate hover:text-cyan-400 transition-colors">
                            {guide.name}
                          </span>
                          <Edit3 className="w-2.5 h-2.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right quick buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Focus/Center Canvas on Guide */}
                    {onFocusGuide && (
                      <button
                        onClick={() => onFocusGuide(guide)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                        title="Focus Canvas on Guide"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicateGuide(guide)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
                      title="Duplicate Guideline"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Lock Toggle */}
                    <button
                      onClick={() => handleUpdateSingleGuide(guide.id, { locked: !guide.locked })}
                      className={`p-1 rounded-lg transition-colors ${
                        guide.locked
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                      }`}
                      title={guide.locked ? 'Unlock Guide (allow dragging)' : 'Lock Guide (prevent accidental move)'}
                    >
                      {guide.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    {/* Visibility Toggle */}
                    <button
                      onClick={() => handleUpdateSingleGuide(guide.id, { visible: guide.visible === false })}
                      className={`p-1 rounded-lg transition-colors ${
                        guide.visible === false
                          ? 'text-zinc-600 hover:text-zinc-400'
                          : 'text-cyan-400 hover:text-cyan-300'
                      }`}
                      title={guide.visible === false ? 'Show Guideline' : 'Hide Guideline'}
                    >
                      {guide.visible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteGuide(guide.id)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Guideline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Row 2: Position Adjuster with Micro-Nudge & Stepper Buttons */}
                <div className="mt-2 pt-2 border-t border-zinc-800/50 flex items-center justify-between gap-2">
                  {/* Position Input & Steppers */}
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-[11px] font-mono text-zinc-400 font-bold shrink-0">
                      {isHorizontal ? 'Y:' : 'X:'}
                    </span>

                    <input
                      type="number"
                      value={guide.position}
                      onChange={(e) => handleUpdateSingleGuide(guide.id, { position: Number(e.target.value) || 0 })}
                      disabled={guide.locked}
                      className={`w-20 px-2 py-0.5 rounded-lg border text-xs font-mono outline-none focus:ring-1 focus:ring-cyan-400 ${
                        guide.locked 
                          ? 'bg-zinc-800/40 border-zinc-800 text-zinc-500 cursor-not-allowed'
                          : isLight 
                          ? 'bg-zinc-100 border-zinc-300 text-zinc-800' 
                          : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                      }`}
                    />
                    <span className="text-[10px] text-zinc-500 font-mono">px</span>

                    {/* Micro-Nudge Steppers */}
                    {!guide.locked && (
                      <div className="flex items-center gap-0.5 ml-1">
                        <button
                          onClick={() => handleNudgePosition(guide.id, guide.position, -10)}
                          className="px-1.5 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-[10px] font-mono text-zinc-300 hover:text-white"
                          title="Nudge -10px"
                        >
                          -10
                        </button>
                        <button
                          onClick={() => handleNudgePosition(guide.id, guide.position, -1)}
                          className="px-1.5 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-[10px] font-mono text-zinc-300 hover:text-white"
                          title="Nudge -1px"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleNudgePosition(guide.id, guide.position, 1)}
                          className="px-1.5 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-[10px] font-mono text-zinc-300 hover:text-white"
                          title="Nudge +1px"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleNudgePosition(guide.id, guide.position, 10)}
                          className="px-1.5 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-[10px] font-mono text-zinc-300 hover:text-white"
                          title="Nudge +10px"
                        >
                          +10
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Color Swatch Trigger */}
                  <div className="relative">
                    <button
                      onClick={() => setColorPickerGuideId(isColorPickerOpen ? null : guide.id)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-zinc-700/60 hover:border-zinc-500 transition-colors"
                      title="Change Guideline Color"
                    >
                      <div 
                        className="w-3.5 h-3.5 rounded-full shadow-sm" 
                        style={{ backgroundColor: guide.color }}
                      />
                      <span className="text-[10px] font-mono text-zinc-400">
                        {guide.color.toUpperCase()}
                      </span>
                    </button>

                    {/* Color Swatch Popover */}
                    {isColorPickerOpen && (
                      <div className={`absolute right-0 bottom-7 p-2 rounded-xl border shadow-xl z-30 w-44 backdrop-blur-xl ${
                        isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'
                      }`}>
                        <div className="text-[10px] font-semibold text-zinc-400 mb-1.5">Color Palette</div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {PRESET_COLORS.map(c => (
                            <button
                              key={c.hex}
                              onClick={() => {
                                handleUpdateSingleGuide(guide.id, { color: c.hex });
                                setColorPickerGuideId(null);
                              }}
                              className={`w-6 h-6 rounded-full transition-transform ${
                                guide.color.toLowerCase() === c.hex.toLowerCase() 
                                  ? 'scale-110 ring-2 ring-white shadow-md' 
                                  : 'hover:scale-110 opacity-80 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={c.label}
                            />
                          ))}
                        </div>

                        {/* Custom Hex Color input */}
                        <div className="mt-2 pt-1.5 border-t border-zinc-800 flex items-center gap-1">
                          <input
                            type="color"
                            value={guide.color}
                            onChange={(e) => handleUpdateSingleGuide(guide.id, { color: e.target.value })}
                            className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                          />
                          <input
                            type="text"
                            value={guide.color}
                            onChange={(e) => handleUpdateSingleGuide(guide.id, { color: e.target.value })}
                            className="w-full px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-950 text-[10px] font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Footer Quick Tip */}
      <div className={`p-3 border-t text-[11px] text-zinc-400 flex items-center justify-between ${
        isLight ? 'bg-zinc-50/80 border-zinc-200' : 'bg-zinc-900/50 border-zinc-800/80'
      }`}>
        <div className="flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-cyan-400" />
          <span>Drag lines on canvas to move in real-time</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">
          Magnetic Snapping Active
        </span>
      </div>
    </div>
  );
};
