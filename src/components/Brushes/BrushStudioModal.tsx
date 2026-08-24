import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Paintbrush, 
  Pen, 
  Pencil, 
  Sparkles, 
  Plus, 
  Copy, 
  Trash2, 
  Download, 
  Upload, 
  X, 
  RotateCcw, 
  Sliders, 
  Eye, 
  CheckCircle2, 
  Search,
  Activity,
  Layers,
  Circle,
  Square,
  Droplets,
  Feather,
  Wand2,
  Image as ImageIcon,
  Compass,
  Palette,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import type { BrushPreset, BrushShapeType, BrushTextureType, BrushStampConfig, PressureCurveType, StrokePoint } from '../../types';
import { 
  loadAllBrushPresets, 
  saveCustomBrush, 
  deleteCustomBrush, 
  duplicateBrushPreset, 
  exportBrushPreset, 
  importBrushPreset, 
  renderAdvancedBrushStroke,
  setActiveBrushPreset,
  createStampBrushPresetFromImage,
  DEFAULT_BRUSH_PRESETS
} from '../../lib/brushEngine';
import { BUILTIN_STAMP_MOTIFS, type BuiltinStampMotif } from '../../lib/stampLibrary';
import { processImageToStampDataUrl } from '../../lib/stampProcessor';

interface BrushStudioModalProps {
  activeBrush: BrushPreset;
  onSelectBrush: (brush: BrushPreset) => void;
  onClose: () => void;
}

export const BrushStudioModal: React.FC<BrushStudioModalProps> = ({
  activeBrush,
  onSelectBrush,
  onClose
}) => {
  const [brushes, setBrushes] = useState<BrushPreset[]>(() => loadAllBrushPresets());
  const [selectedBrush, setSelectedBrush] = useState<BrushPreset>(() => activeBrush);
  const [activeTab, setActiveTab] = useState<'shape' | 'stamp' | 'dynamics' | 'texture' | 'wetness' | 'stabilizer'>('shape');
  const [searchQuery, setSearchQuery] = useState('');
  const [scratchpadColor, setScratchpadColor] = useState('#06B6D4');
  const [scratchpadSize, setScratchpadSize] = useState(14);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scratchpad interactive state
  const scratchpadRef = useRef<HTMLCanvasElement>(null);
  const [scratchpadPoints, setScratchpadPoints] = useState<StrokePoint[]>([]);
  const [isScratchpadDrawing, setIsScratchpadDrawing] = useState(false);

  // Filtered brushes by category / search
  const filteredBrushes = brushes.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(brushes.map(b => b.category)));

  // Save changes to current brush
  const handleUpdateCurrentBrush = (updater: (prev: BrushPreset) => BrushPreset) => {
    setSelectedBrush(prev => {
      const updated = updater(prev);
      const newAll = saveCustomBrush(updated);
      setBrushes(newAll);
      return updated;
    });
  };

  // Duplicate brush
  const handleDuplicate = () => {
    const duplicated = duplicateBrushPreset(selectedBrush);
    const newAll = saveCustomBrush(duplicated);
    setBrushes(newAll);
    setSelectedBrush(duplicated);
    setStatusMessage(`Duplicated as "${duplicated.name}"!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Delete brush
  const handleDelete = () => {
    if (!selectedBrush.isCustom) {
      alert("Built-in system brushes cannot be deleted.");
      return;
    }
    if (confirm(`Delete custom brush "${selectedBrush.name}"?`)) {
      const newAll = deleteCustomBrush(selectedBrush.id);
      setBrushes(newAll);
      setSelectedBrush(newAll[0] || DEFAULT_BRUSH_PRESETS[0]);
    }
  };

  // Create brand new custom brush
  const handleCreateNew = () => {
    const newBrush: BrushPreset = {
      id: `custom-brush-${Date.now()}`,
      name: 'Untitled Custom Brush',
      category: 'Custom',
      description: 'Custom sculpted brush preset with personalized dynamics.',
      iconName: 'Paintbrush',
      isCustom: true,
      author: 'You',
      createdAt: new Date().toISOString(),
      shape: {
        type: 'round',
        hardness: 85,
        roundness: 80,
        angle: 0,
        spacing: 5,
        sizeJitter: 0,
        angleJitter: 0,
        bristleCount: 1
      },
      dynamics: {
        pressureSize: true,
        pressureOpacity: true,
        pressureFlow: true,
        tiltSensitivity: false,
        velocitySensitivity: 0,
        pressureCurve: 'linear',
        minSizeRatio: 0.2
      },
      texture: {
        type: 'smooth',
        scale: 100,
        depth: 0,
        contrast: 0,
        blendMode: 'normal'
      },
      wetness: {
        flow: 90,
        wetEdge: 0,
        smudgeStrength: 0,
        bleedRadius: 0
      },
      stabilizer: {
        streamline: 30,
        taperStart: 10,
        taperEnd: 15,
        snapToLineAssist: false
      }
    };

    const newAll = saveCustomBrush(newBrush);
    setBrushes(newAll);
    setSelectedBrush(newBrush);
    setStatusMessage("Created new custom brush preset!");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Create brand new Stamp brush
  const handleCreateNewStampBrush = () => {
    const defaultMotif = BUILTIN_STAMP_MOTIFS[0];
    const newStamp = createStampBrushPresetFromImage(
      defaultMotif.svgDataUrl,
      'New Custom Stamp',
      'Stamps & Patterns',
      {
        name: defaultMotif.name,
        spacing: defaultMotif.defaultSpacing,
        followStrokeDirection: defaultMotif.followDirection,
        scatterJitter: defaultMotif.defaultScatter,
        rotationJitter: defaultMotif.defaultRotationJitter,
        scaleJitter: defaultMotif.defaultScaleJitter,
        tintWithColor: defaultMotif.defaultTint
      }
    );
    const newAll = saveCustomBrush(newStamp);
    setBrushes(newAll);
    setSelectedBrush(newStamp);
    setActiveTab('stamp');
    setStatusMessage("Created new Stamp Brush ready for image upload!");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Process and apply an uploaded image as stamp
  const handleProcessUploadedStamp = async (file: File) => {
    setIsProcessingImage(true);
    setStatusMessage("Processing stamp image alpha mask...");
    try {
      const dataUrl = await processImageToStampDataUrl(file, {
        maxDimension: 512,
        removeBackground: true,
        threshold: selectedBrush.stamp?.threshold ?? 240,
        invertMask: selectedBrush.stamp?.invertMask ?? false
      });

      const cleanName = file.name.replace(/\.[^/.]+$/, "");

      handleUpdateCurrentBrush(prev => ({
        ...prev,
        shape: {
          ...prev.shape,
          type: 'stamp',
          spacing: prev.shape.spacing || 110
        },
        stamp: {
          enabled: true,
          imageUrl: dataUrl,
          name: cleanName,
          tintWithColor: prev.stamp?.tintWithColor ?? true,
          followStrokeDirection: prev.stamp?.followStrokeDirection ?? false,
          scatterJitter: prev.stamp?.scatterJitter ?? 20,
          rotationJitter: prev.stamp?.rotationJitter ?? 45,
          scaleJitter: prev.stamp?.scaleJitter ?? 30,
          spacing: prev.stamp?.spacing ?? 110,
          invertMask: prev.stamp?.invertMask ?? false,
          threshold: prev.stamp?.threshold ?? 240,
          countPerStep: prev.stamp?.countPerStep ?? 1
        }
      }));

      setStatusMessage(`Imported "${cleanName}" as custom stamp!`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error(err);
      alert("Failed to process image. Please choose a valid PNG, JPG, WebP, or SVG file.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Select a curated built-in motif
  const handleSelectBuiltinMotif = (motif: BuiltinStampMotif) => {
    handleUpdateCurrentBrush(prev => ({
      ...prev,
      shape: {
        ...prev.shape,
        type: 'stamp',
        spacing: motif.defaultSpacing
      },
      stamp: {
        enabled: true,
        imageUrl: motif.svgDataUrl,
        name: motif.name,
        tintWithColor: motif.defaultTint,
        followStrokeDirection: motif.followDirection,
        scatterJitter: motif.defaultScatter,
        rotationJitter: motif.defaultRotationJitter,
        scaleJitter: motif.defaultScaleJitter,
        spacing: motif.defaultSpacing,
        invertMask: false,
        threshold: 240,
        countPerStep: 1
      }
    }));
    setStatusMessage(`Loaded "${motif.name}" stamp motif!`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // File Import handler for whole presets
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = importBrushPreset(text);
        const newAll = loadAllBrushPresets();
        setBrushes(newAll);
        setSelectedBrush(imported);
        setStatusMessage(`Successfully imported brush "${imported.name}"!`);
        setTimeout(() => setStatusMessage(null), 3500);
      } catch (err) {
        alert("Failed to parse brush file. Please ensure it is a valid .artbrush JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // Apply to canvas
  const handleApply = () => {
    setActiveBrushPreset(selectedBrush.id);
    onSelectBrush(selectedBrush);
    onClose();
  };

  // Redraw test scratchpad strokes
  const redrawScratchpad = useCallback(() => {
    const canvas = scratchpadRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw textured scratchpad background
    ctx.fillStyle = '#0A0A0E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle test grid dots
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let x = 15; x < canvas.width; x += 25) {
      for (let y = 15; y < canvas.height; y += 25) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    // Default sample flourishes if scratchpad is clean
    if (scratchpadPoints.length === 0) {
      const sampleCurve1: StrokePoint[] = [
        { x: 40, y: 120, pressure: 0.2 },
        { x: 90, y: 70, pressure: 0.5 },
        { x: 150, y: 60, pressure: 0.8 },
        { x: 220, y: 100, pressure: 1.0 },
        { x: 270, y: 160, pressure: 0.6 },
        { x: 310, y: 190, pressure: 0.3 }
      ];

      const sampleCurve2: StrokePoint[] = [
        { x: 50, y: 220, pressure: 0.3 },
        { x: 120, y: 240, pressure: 0.9 },
        { x: 200, y: 230, pressure: 0.7 },
        { x: 290, y: 250, pressure: 0.2 }
      ];

      renderAdvancedBrushStroke(ctx, sampleCurve1, scratchpadColor, scratchpadSize, 0.9, selectedBrush, 1.0);
      renderAdvancedBrushStroke(ctx, sampleCurve2, '#EC4899', scratchpadSize * 0.85, 0.85, selectedBrush, 1.0);
    } else {
      renderAdvancedBrushStroke(ctx, scratchpadPoints, scratchpadColor, scratchpadSize, 1.0, selectedBrush, 1.0);
    }
  }, [scratchpadPoints, scratchpadColor, scratchpadSize, selectedBrush]);

  useEffect(() => {
    redrawScratchpad();
  }, [redrawScratchpad]);

  // Scratchpad Pointer Handlers
  const handleScratchPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = scratchpadRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.6;

    setIsScratchpadDrawing(true);
    setScratchpadPoints([{ x, y, pressure }]);
  };

  const handleScratchPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isScratchpadDrawing) return;
    const canvas = scratchpadRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.6;

    setScratchpadPoints(prev => [...prev, { x, y, pressure }]);
  };

  const handleScratchPointerUp = () => {
    setIsScratchpadDrawing(false);
  };

  const clearScratchpad = () => {
    setScratchpadPoints([]);
  };

  const isCurrentBrushStamp = selectedBrush.shape.type === 'stamp' || selectedBrush.stamp?.enabled;

  return (
    <div className="fixed inset-0 z-50 bg-[#050508]/98 backdrop-blur-2xl flex flex-col select-none overflow-hidden animate-in fade-in">
      {/* Top Navigation Bar */}
      <div className="h-16 border-b border-zinc-800/80 bg-[#0A0A0E]/90 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-950/40">
            <Paintbrush className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white font-['Outfit'] tracking-wide">
                ArtisPlan Brush Studio
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-950/70 border border-purple-800 text-purple-300">
                {selectedBrush.name}
              </span>
              {isCurrentBrushStamp && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-950/80 border border-rose-800 text-rose-300 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Stamp Motif
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Sculpt tip dynamics, image-based stamp patterns, watercolor bleed, and streamline stabilizers
            </p>
          </div>
        </div>

        {/* Global Action Header */}
        <div className="flex items-center gap-2">
          {statusMessage && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          <button
            onClick={() => exportBrushPreset(selectedBrush)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181F] hover:bg-[#22222B] text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors"
            title="Export brush preset as .artbrush.json"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Preset</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181F] hover:bg-[#22222B] text-zinc-200 border border-zinc-800 text-xs font-medium cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>Import Preset</span>
            <input type="file" accept=".json,.artbrush" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Select & Draw</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3-Column Studio Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Preset Library Browser */}
        <div className="w-72 border-r border-zinc-800/80 bg-[#0A0A0D]/95 p-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            {/* Header & New Brush Buttons */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="font-bold text-xs text-zinc-200 uppercase tracking-wider">Preset Library</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCreateNewStampBrush}
                  className="p-1 rounded-lg bg-rose-950/80 text-rose-300 hover:bg-rose-900 border border-rose-800 text-[11px] flex items-center gap-1 px-2"
                  title="Create new image stamp brush"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>+ Stamp</span>
                </button>
                <button
                  onClick={handleCreateNew}
                  className="p-1 rounded-lg bg-purple-950/80 text-purple-300 hover:bg-purple-900 border border-purple-800 text-[11px] flex items-center gap-1 px-2"
                  title="Create new classic brush"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search brushes & stamps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121216] border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-rose-500"
              />
            </div>

            {/* Presets grouped by category */}
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              {categories.map((cat) => {
                const group = filteredBrushes.filter(b => b.category === cat);
                if (group.length === 0) return null;

                return (
                  <div key={cat} className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-1 flex items-center justify-between">
                      <span>{cat}</span>
                      <span className="font-mono text-[9px] text-zinc-600">{group.length}</span>
                    </span>
                    <div className="space-y-1">
                      {group.map((b) => {
                        const isSelected = b.id === selectedBrush.id;
                        const isStamp = b.shape.type === 'stamp' || b.stamp?.enabled;

                        return (
                          <div
                            key={b.id}
                            onClick={() => {
                              setSelectedBrush(b);
                              if (isStamp && activeTab === 'shape') {
                                setActiveTab('stamp');
                              }
                            }}
                            className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-gradient-to-r from-rose-950/40 to-purple-950/40 border-rose-500/80 text-white shadow-md'
                                : 'bg-[#121216]/90 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-rose-500/20 text-rose-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                {isStamp ? <Sparkles className="w-3.5 h-3.5 text-rose-400" /> : <Paintbrush className="w-3.5 h-3.5" />}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-xs truncate block">{b.name}</span>
                                <span className="text-[10px] text-zinc-500 truncate block">
                                  {isStamp ? `Stamp • ${b.stamp?.name || 'Motif'}` : `${b.shape.type} • ${b.shape.spacing}%`}
                                </span>
                              </div>
                            </div>

                            {b.isCustom && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 font-mono border border-purple-800">
                                Custom
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Duplicate & Delete for Selected */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
            <button
              onClick={handleDuplicate}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-[#18181F] hover:bg-[#22222B] text-zinc-300 border border-zinc-800 text-xs font-medium transition-colors"
            >
              <Copy className="w-3 h-3 text-cyan-400" />
              <span>Duplicate</span>
            </button>

            {selectedBrush.isCustom && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-xl bg-[#18181F] hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-colors"
                title="Delete this custom preset"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Center Column: Parameter Editor Tabs */}
        <div className="flex-1 flex flex-col bg-[#07070A] overflow-hidden">
          {/* Tab Header Bar */}
          <div className="flex border-b border-zinc-800/80 bg-[#0A0A0E] px-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('shape')}
              className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'shape'
                  ? 'border-rose-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Circle className="w-3.5 h-3.5" />
              <span>Shape & Geometry</span>
            </button>

            <button
              onClick={() => setActiveTab('stamp')}
              className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'stamp'
                  ? 'border-rose-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Stamp & Motif</span>
              {isCurrentBrushStamp && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('dynamics')}
              className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'dynamics'
                  ? 'border-rose-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Pressure & Dynamics</span>
            </button>

            <button
              onClick={() => setActiveTab('texture')}
              className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'texture'
                  ? 'border-rose-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Texture & Grain</span>
            </button>

            <button
              onClick={() => setActiveTab('wetness')}
              className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'wetness'
                  ? 'border-rose-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Wetness & Blending</span>
            </button>

            <button
              onClick={() => setActiveTab('stabilizer')}
              className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'stabilizer'
                  ? 'border-rose-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Feather className="w-3.5 h-3.5" />
              <span>Stabilizer & Taper</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar max-w-2xl">
            {/* 1. Shape & Tip Dynamics Tab */}
            {activeTab === 'shape' && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Tip Shape Preset</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {[
                      { type: 'round', label: 'Round', desc: 'Uniform continuous circle' },
                      { type: 'stamp', label: 'Stamp Image', desc: 'Imported motif & pattern', isHighlight: true },
                      { type: 'calligraphy', label: 'Calligraphy', desc: 'Angled chisel contour' },
                      { type: 'charcoal', label: 'Charcoal', desc: 'Granular tooth edge' },
                      { type: 'dry_bristle', label: 'Dry Bristle', desc: 'Multi-hair oil rake' },
                      { type: 'airbrush', label: 'Airbrush', desc: 'Ultra-soft radial spray' },
                      { type: 'fan', label: 'Fan Rake', desc: 'Foliage & fur splays' },
                      { type: 'halftone', label: 'Halftone', desc: 'Retro screentone dots' },
                      { type: 'chisel', label: 'Chisel Flat', desc: 'Architecture flat nib' }
                    ].map((item) => (
                      <button
                        key={item.type}
                        onClick={() => {
                          handleUpdateCurrentBrush(b => ({
                            ...b,
                            shape: { ...b.shape, type: item.type as BrushShapeType }
                          }));
                          if (item.type === 'stamp') {
                            setActiveTab('stamp');
                          }
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all relative ${
                          selectedBrush.shape.type === item.type
                            ? 'bg-rose-950/40 border-rose-500 text-white shadow-md'
                            : 'bg-[#121216] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {item.isHighlight && (
                          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                        )}
                        <span className="font-bold text-xs block text-zinc-200">{item.label}</span>
                        <span className="text-[10px] text-zinc-500 block">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders: Hardness, Roundness, Angle, Spacing, Jitter */}
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Tip Hardness</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.shape.hardness}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={selectedBrush.shape.hardness}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        shape: { ...b.shape, hardness: Number(e.target.value) }
                      }))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Roundness / Aspect Ratio</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.shape.roundness}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={selectedBrush.shape.roundness}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        shape: { ...b.shape, roundness: Number(e.target.value) }
                      }))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Tip Angle</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.shape.angle}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={selectedBrush.shape.angle}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        shape: { ...b.shape, angle: Number(e.target.value) }
                      }))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Stamp Spacing (Step Rate)</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.shape.spacing}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="200"
                      value={selectedBrush.shape.spacing}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        shape: { ...b.shape, spacing: Number(e.target.value) }
                      }))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Angle Jitter (Random Spin)</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.shape.angleJitter}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedBrush.shape.angleJitter}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        shape: { ...b.shape, angleJitter: Number(e.target.value) }
                      }))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. STAMP & MOTIF TAB */}
            {activeTab === 'stamp' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Stamp Master Mode Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-[#121216] border border-rose-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Stamp Motif Engine</h4>
                      <p className="text-[11px] text-zinc-400">
                        Create custom brushes from imported images or choose from curated motifs to stamp repeating designs.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const willEnable = selectedBrush.shape.type !== 'stamp';
                      handleUpdateCurrentBrush(b => ({
                        ...b,
                        shape: { ...b.shape, type: willEnable ? 'stamp' : 'round' },
                        stamp: {
                          enabled: willEnable,
                          imageUrl: b.stamp?.imageUrl || BUILTIN_STAMP_MOTIFS[0].svgDataUrl,
                          name: b.stamp?.name || 'Sparkle Star',
                          tintWithColor: b.stamp?.tintWithColor ?? true,
                          followStrokeDirection: b.stamp?.followStrokeDirection ?? false,
                          scatterJitter: b.stamp?.scatterJitter ?? 25,
                          rotationJitter: b.stamp?.rotationJitter ?? 45,
                          scaleJitter: b.stamp?.scaleJitter ?? 30,
                          spacing: b.stamp?.spacing ?? 110,
                          countPerStep: b.stamp?.countPerStep ?? 1
                        }
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isCurrentBrushStamp
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/50'
                        : 'bg-[#18181F] text-zinc-400 border-zinc-700 hover:text-white'
                    }`}
                  >
                    {isCurrentBrushStamp ? 'Active Stamp' : 'Enable Stamp Mode'}
                  </button>
                </div>

                {/* Drag and Drop / Custom Image Upload Area */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Import Custom Stamp Image</h3>
                    <span className="text-[10px] text-zinc-500">Supports PNG, SVG, JPG, WebP</span>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingOver(true);
                    }}
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleProcessUploadedStamp(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                      isDraggingOver
                        ? 'border-rose-400 bg-rose-950/30 text-white scale-[1.01]'
                        : 'border-zinc-800 hover:border-zinc-600 bg-[#101015]/80 text-zinc-400'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.svg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProcessUploadedStamp(file);
                      }}
                      className="hidden"
                    />

                    {isProcessingImage ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <RefreshCw className="w-6 h-6 text-rose-400 animate-spin" />
                        <span className="text-xs text-zinc-300 font-medium">Extracting alpha stamp mask...</span>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 rounded-2xl bg-[#181822] text-rose-400 border border-zinc-700/60 shadow-inner">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-zinc-200">
                            Drag & drop an image here, or <span className="text-rose-400 underline">browse device</span>
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            Transparent PNGs, vector SVGs, and high-contrast sketches are automatically converted to stamps
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Curated Stamp Motifs Library */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Curated Stamp Motifs</h3>
                    <span className="text-[10px] text-zinc-500">{BUILTIN_STAMP_MOTIFS.length} built-in vectors</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {BUILTIN_STAMP_MOTIFS.map((motif) => {
                      const isMotifSelected = selectedBrush.stamp?.imageUrl === motif.svgDataUrl;
                      return (
                        <div
                          key={motif.id}
                          onClick={() => handleSelectBuiltinMotif(motif)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col items-center text-center gap-2 group ${
                            isMotifSelected
                              ? 'bg-rose-950/50 border-rose-500 shadow-lg shadow-rose-950/40 text-white'
                              : 'bg-[#121216] border-zinc-800/90 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-[#181822] border border-zinc-800 flex items-center justify-center p-2 group-hover:scale-105 transition-transform overflow-hidden relative">
                            {/* Checkerboard preview background */}
                            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:6px_6px]" />
                            <img
                              src={motif.svgDataUrl}
                              alt={motif.name}
                              className="w-full h-full object-contain filter drop-shadow"
                            />
                          </div>
                          <div className="w-full">
                            <span className="text-[11px] font-semibold block truncate text-zinc-200">{motif.name}</span>
                            <span className="text-[9px] text-zinc-500 block truncate">{motif.category}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stamp Color & Masking Controls */}
                <div className="space-y-4 pt-2 border-t border-zinc-800/80">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Stamp Color & Mask Settings</h3>

                  {/* Tint Mode Selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateCurrentBrush(b => ({
                        ...b,
                        stamp: { ...b.stamp!, tintWithColor: true }
                      }))}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                        selectedBrush.stamp?.tintWithColor !== false
                          ? 'bg-rose-950/40 border-rose-500 text-white shadow-md'
                          : 'bg-[#121216] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <Palette className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-bold block text-zinc-200">Dynamic Palette Tint</span>
                        <span className="text-[10px] text-zinc-500 block">Stamps dynamically with active brush color</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleUpdateCurrentBrush(b => ({
                        ...b,
                        stamp: { ...b.stamp!, tintWithColor: false }
                      }))}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                        selectedBrush.stamp?.tintWithColor === false
                          ? 'bg-purple-950/40 border-purple-500 text-white shadow-md'
                          : 'bg-[#121216] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-bold block text-zinc-200">Original RGB Colors</span>
                        <span className="text-[10px] text-zinc-500 block">Preserves image natural colors</span>
                      </div>
                    </button>
                  </div>

                  {/* Mask Inversion Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#121216] border border-zinc-800">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">Invert Stamp Luminance</span>
                      <span className="text-[10px] text-zinc-500 block">Invert dark/bright pixels for custom sketches & scans</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedBrush.stamp?.invertMask ?? false}
                      onChange={(e) => {
                        const isInverted = e.target.checked;
                        handleUpdateCurrentBrush(b => ({
                          ...b,
                          stamp: { ...b.stamp!, invertMask: isInverted }
                        }));
                      }}
                      className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Stamp Dynamics: Direction, Spacing, Jitter, Scatter */}
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider pt-2">Stamp Stroke Dynamics</h3>

                  {/* Follow Stroke Direction Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#121216] border border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-cyan-400" />
                      <div>
                        <span className="text-xs font-semibold text-zinc-200 block">Follow Stroke Direction</span>
                        <span className="text-[10px] text-zinc-500 block">Auto-rotates stamp tangent to pen travel (ideal for chains, stitching, footsteps)</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedBrush.stamp?.followStrokeDirection ?? false}
                      onChange={(e) => {
                        const follow = e.target.checked;
                        handleUpdateCurrentBrush(b => ({
                          ...b,
                          stamp: { ...b.stamp!, followStrokeDirection: follow }
                        }));
                      }}
                      className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Spacing Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Stamp Spacing</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.stamp?.spacing ?? selectedBrush.shape.spacing ?? 110}%</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="300"
                      value={selectedBrush.stamp?.spacing ?? selectedBrush.shape.spacing ?? 110}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleUpdateCurrentBrush(b => ({
                          ...b,
                          shape: { ...b.shape, spacing: val },
                          stamp: { ...b.stamp!, spacing: val }
                        }));
                      }}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>Continuous Ribbon (15%)</span>
                      <span>Separate Stamps (300%)</span>
                    </div>
                  </div>

                  {/* Rotation Angle Jitter */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Rotation Angle Jitter</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.stamp?.rotationJitter ?? 45}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedBrush.stamp?.rotationJitter ?? 45}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleUpdateCurrentBrush(b => ({
                          ...b,
                          stamp: { ...b.stamp!, rotationJitter: val }
                        }));
                      }}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>

                  {/* Perpendicular Scatter Jitter */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Perpendicular Scatter Jitter</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.stamp?.scatterJitter ?? 20}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedBrush.stamp?.scatterJitter ?? 20}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleUpdateCurrentBrush(b => ({
                          ...b,
                          stamp: { ...b.stamp!, scatterJitter: val }
                        }));
                      }}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>

                  {/* Scale / Size Variation Jitter */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Scale / Size Jitter</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.stamp?.scaleJitter ?? 30}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedBrush.stamp?.scaleJitter ?? 30}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleUpdateCurrentBrush(b => ({
                          ...b,
                          stamp: { ...b.stamp!, scaleJitter: val }
                        }));
                      }}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>

                  {/* Multi-Stamp Count Per Step */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Particles per Step (Clustering)</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.stamp?.countPerStep ?? 1}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={selectedBrush.stamp?.countPerStep ?? 1}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleUpdateCurrentBrush(b => ({
                          ...b,
                          stamp: { ...b.stamp!, countPerStep: val }
                        }));
                      }}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Dynamics Tab */}
            {activeTab === 'dynamics' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#121216] border border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-200">Pressure Size Modulation</span>
                    <input
                      type="checkbox"
                      checked={selectedBrush.dynamics.pressureSize}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        dynamics: { ...b.dynamics, pressureSize: e.target.checked }
                      }))}
                      className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#121216] border border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-200">Pressure Opacity Modulation</span>
                    <input
                      type="checkbox"
                      checked={selectedBrush.dynamics.pressureOpacity}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        dynamics: { ...b.dynamics, pressureOpacity: e.target.checked }
                      }))}
                      className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Velocity Sensitivity</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.dynamics.velocitySensitivity}%</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={selectedBrush.dynamics.velocitySensitivity}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        dynamics: { ...b.dynamics, velocitySensitivity: Number(e.target.value) }
                      }))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Stylus Pressure Curve</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.dynamics.pressureCurve}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {(['linear', 'soft', 'firm', 's_curve'] as PressureCurveType[]).map((curve) => (
                        <button
                          key={curve}
                          onClick={() => handleUpdateCurrentBrush(b => ({
                            ...b,
                            dynamics: { ...b.dynamics, pressureCurve: curve }
                          }))}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                            selectedBrush.dynamics.pressureCurve === curve
                              ? 'bg-rose-950/50 border-rose-500 text-white'
                              : 'bg-[#121216] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          {curve.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Texture & Grain Tab */}
            {activeTab === 'texture' && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Paper & Canvas Grain</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'smooth', label: 'Smooth Plate' },
                      { type: 'watercolor_paper', label: 'Cold Press Paper' },
                      { type: 'linen_canvas', label: 'Linen Canvas' },
                      { type: 'rough_charcoal', label: 'Rough Charcoal' },
                      { type: 'halftone_dots', label: 'Halftone Matrix' },
                      { type: 'noise', label: 'Perlin Noise' }
                    ].map((item) => (
                      <button
                        key={item.type}
                        onClick={() => handleUpdateCurrentBrush(b => ({
                          ...b,
                          texture: { ...b.texture, type: item.type as BrushTextureType }
                        }))}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selectedBrush.texture.type === item.type
                            ? 'bg-purple-950/40 border-purple-500 text-white shadow-md'
                            : 'bg-[#121216] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="font-bold text-xs block text-zinc-200">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Texture Grain Depth</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.texture.depth}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedBrush.texture.depth}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        texture: { ...b.texture, depth: Number(e.target.value) }
                      }))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Texture Scale</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.texture.scale}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="300"
                      value={selectedBrush.texture.scale}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        texture: { ...b.texture, scale: Number(e.target.value) }
                      }))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. Wetness & Blending Tab */}
            {activeTab === 'wetness' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Ink Flow Rate</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.wetness.flow}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={selectedBrush.wetness.flow}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        wetness: { ...b.wetness, flow: Number(e.target.value) }
                      }))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Watercolor Wet Edge (Bleed Fringe)</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.wetness.wetEdge}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedBrush.wetness.wetEdge}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        wetness: { ...b.wetness, wetEdge: Number(e.target.value) }
                      }))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Smudge & Color Blending Strength</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.wetness.smudgeStrength}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedBrush.wetness.smudgeStrength}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        wetness: { ...b.wetness, smudgeStrength: Number(e.target.value) }
                      }))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. Stabilizer & Taper Tab */}
            {activeTab === 'stabilizer' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Streamline Bezier Smoothing</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.stabilizer.streamline}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedBrush.stabilizer.streamline}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        stabilizer: { ...b.stabilizer, streamline: Number(e.target.value) }
                      }))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-zinc-500 block">Eliminates hand jitter for pristine ink inking lines</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Taper Terminal Start</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.stabilizer.taperStart}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedBrush.stabilizer.taperStart}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        stabilizer: { ...b.stabilizer, taperStart: Number(e.target.value) }
                      }))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Taper Terminal End</span>
                      <span className="font-mono text-zinc-400">{selectedBrush.stabilizer.taperEnd}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedBrush.stabilizer.taperEnd}
                      onChange={(e) => handleUpdateCurrentBrush(b => ({
                        ...b,
                        stabilizer: { ...b.stabilizer, taperEnd: Number(e.target.value) }
                      }))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Live Scratchpad & Stamp Inspector */}
        <div className="w-80 border-l border-zinc-800/80 bg-[#0A0A0E] p-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-xs text-white uppercase tracking-wider">Live Scratchpad</span>
              </div>
              <button
                onClick={clearScratchpad}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>

            {/* Interactive Drawing Pad */}
            <div className="relative rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-[#0A0A0E]">
              <canvas
                ref={scratchpadRef}
                width={280}
                height={260}
                onPointerDown={handleScratchPointerDown}
                onPointerMove={handleScratchPointerMove}
                onPointerUp={handleScratchPointerUp}
                onPointerLeave={handleScratchPointerUp}
                className="w-full h-[260px] cursor-crosshair touch-none"
              />
              <div className="absolute bottom-2 left-2 text-[10px] text-zinc-500 font-mono pointer-events-none">
                Draw test strokes with stylus/mouse
              </div>
            </div>

            {/* Stamp Tip Inspector Widget */}
            {isCurrentBrushStamp && selectedBrush.stamp?.imageUrl && (
              <div className="p-3 rounded-2xl bg-[#121218] border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>Stamp Tip Preview</span>
                  </span>
                  <span className="font-mono text-zinc-500 text-[10px]">
                    {selectedBrush.stamp.name || 'Custom Image'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#1A1A24] border border-zinc-700/60 flex items-center justify-center p-1.5 relative overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:4px_4px]" />
                    <img
                      src={selectedBrush.stamp.imageUrl}
                      alt="Stamp Preview"
                      className="w-full h-full object-contain filter drop-shadow relative z-10"
                      style={
                        selectedBrush.stamp.tintWithColor !== false
                          ? { filter: `drop-shadow(0 0 1px ${scratchpadColor})` }
                          : undefined
                      }
                    />
                  </div>
                  <div className="text-[10px] text-zinc-400 space-y-0.5">
                    <p className="text-zinc-300 font-semibold truncate max-w-[170px]">
                      {selectedBrush.stamp.name || 'Custom Stamp'}
                    </p>
                    <p>
                      Spacing: <span className="text-rose-400 font-mono">{selectedBrush.stamp.spacing || selectedBrush.shape.spacing}%</span> • Scatter: <span className="text-cyan-400 font-mono">{selectedBrush.stamp.scatterJitter || 0}%</span>
                    </p>
                    <p className="text-zinc-500">
                      {selectedBrush.stamp.followStrokeDirection ? 'Tangent angle aligned' : 'Fixed orientation'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Scratchpad controls (color swatch & test size) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 text-[11px]">Scratchpad Color</span>
                <div className="flex items-center gap-1">
                  {['#06B6D4', '#EC4899', '#38BDF8', '#F59E0B', '#10B981', '#FFFFFF'].map((hex) => (
                    <button
                      key={hex}
                      onClick={() => setScratchpadColor(hex)}
                      className={`w-4 h-4 rounded-full border transition-transform ${
                        scratchpadColor === hex ? 'scale-125 border-white' : 'border-zinc-700'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-zinc-400 text-[11px]">Test Stroke Size</span>
                <input
                  type="range"
                  min="2"
                  max="64"
                  value={scratchpadSize}
                  onChange={(e) => setScratchpadSize(Number(e.target.value))}
                  className="w-28 accent-rose-500 cursor-pointer"
                />
                <span className="font-mono text-zinc-300 text-[11px]">{scratchpadSize}px</span>
              </div>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="pt-4 border-t border-zinc-800 space-y-2">
            <button
              onClick={handleApply}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply "{selectedBrush.name}"</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
