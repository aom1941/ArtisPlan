import React, { useState, useRef } from 'react';
import { 
  MousePointer, 
  Pen, 
  Paintbrush, 
  Pencil, 
  Highlighter, 
  Eraser, 
  Square, 
  Circle, 
  ArrowUpRight, 
  Minus, 
  Layout, 
  StickyNote, 
  Type, 
  MessageSquarePlus, 
  Pipette, 
  Hand, 
  Layers, 
  Upload, 
  Sparkles,
  ChevronUp,
  Sliders,
  ChevronDown,
  Search,
  Flame,
  Activity,
  Grid as GridIcon,
  Magnet,
  Trash2,
  Spline,
  Blend,
  SlidersHorizontal
} from 'lucide-react';
import type { CanvasTool, ShapeType, CanvasGridSettings, EraserMode } from '../../types';
import { GridSettingsPopover } from './GridSettingsPopover';
import { AlignmentPopover } from './AlignmentPopover';
import type { CanvasAlignmentAction } from '../../lib/alignmentEngine';

interface CanvasToolbarProps {
  activeTool: CanvasTool;
  setActiveTool: (tool: CanvasTool) => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
  strokeSize: number;
  setStrokeSize: (size: number) => void;
  activeOpacity: number;
  setActiveOpacity: (opacity: number) => void;
  selectedShapeType: ShapeType;
  setSelectedShapeType: (shape: ShapeType) => void;
  colorSwatches: string[];
  onAddColorSwatch: (hex: string) => void;
  onUploadImage: (file: File) => void;
  onToggleLayers: () => void;
  layersCount: number;
  onOpenMoodboardPalette: () => void;
  theme: 'dark' | 'light' | 'oled' | 'sepia';
  activeBrushPreset?: any;
  onOpenBrushStudio?: () => void;
  onOpenTimeMachine?: () => void;
  onOpenCanvasSearch?: () => void;
  onOpenHeatmap?: () => void;
  isHeatmapActive?: boolean;
  stabilization?: number;
  setStabilization?: (value: number) => void;
  onOpenGestureSettings?: () => void;
  onOpenGesturePalette?: () => void;
  gridSettings?: CanvasGridSettings;
  onUpdateGridSettings?: (newSettings: CanvasGridSettings) => void;
  eraserMode?: EraserMode;
  setEraserMode?: (mode: EraserMode) => void;
  onClearActiveLayer?: () => void;
  selectedCount?: number;
  onAlign?: (action: CanvasAlignmentAction, target: 'selection' | 'canvas') => void;
  onSelectAll?: () => void;
  onOpenGuideManager?: () => void;
  isGuideManagerActive?: boolean;
  guidesCount?: number;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  activeTool,
  setActiveTool,
  activeColor,
  setActiveColor,
  strokeSize,
  setStrokeSize,
  activeOpacity,
  setActiveOpacity,
  selectedShapeType,
  setSelectedShapeType,
  colorSwatches,
  onAddColorSwatch,
  onUploadImage,
  onToggleLayers,
  layersCount,
  onOpenMoodboardPalette,
  theme,
  activeBrushPreset,
  onOpenBrushStudio,
  onOpenTimeMachine,
  onOpenCanvasSearch,
  onOpenHeatmap,
  isHeatmapActive,
  stabilization = 40,
  setStabilization,
  onOpenGestureSettings,
  onOpenGesturePalette,
  gridSettings,
  onUpdateGridSettings,
  eraserMode = 'stroke',
  setEraserMode,
  onClearActiveLayer,
  selectedCount = 0,
  onAlign,
  onSelectAll,
  onOpenGuideManager,
  isGuideManagerActive = false,
  guidesCount = 0
}) => {
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showBrushControls, setShowBrushControls] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showGridPopover, setShowGridPopover] = useState(false);
  const [showAlignmentPopover, setShowAlignmentPopover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
    }
  };

  const isDrawingTool = ['pen', 'brush', 'pencil', 'highlighter', 'eraser'].includes(activeTool);

  const getStabilizationLabel = (val: number) => {
    if (val === 0) return 'Off (Raw)';
    if (val <= 25) return 'Light';
    if (val <= 55) return 'Studio';
    if (val <= 80) return 'Smooth';
    return 'Silk Rope';
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
      {/* Expandable Brush & Property Inspector */}
      {showBrushControls && isDrawingTool && (
        <div className="bg-[#121216]/95 backdrop-blur-2xl border border-zinc-800/90 rounded-2xl p-3 shadow-2xl shadow-black/80 flex flex-wrap sm:flex-nowrap items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
          {/* If Eraser is active, show specialized Eraser Controls */}
          {activeTool === 'eraser' ? (
            <>
              {/* Eraser Mode: Stroke vs Area */}
              {setEraserMode && (
                <div className="flex items-center gap-1 bg-[#0C0C10]/80 p-1 rounded-xl border border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setEraserMode('stroke')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      eraserMode === 'stroke'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                    title="Stroke Eraser: Touching any line or shape erases it completely"
                  >
                    <Spline className="w-3.5 h-3.5" />
                    <span>Stroke Eraser</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEraserMode('pixel')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      eraserMode === 'pixel'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                    title="Area Eraser: Erases pixels under the brush tip"
                  >
                    <Blend className="w-3.5 h-3.5" />
                    <span>Area Eraser</span>
                  </button>
                </div>
              )}

              <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

              {/* Eraser Size slider */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-[11px] font-medium">Tip Size</span>
                <input
                  type="range"
                  min="4"
                  max="100"
                  value={strokeSize}
                  onChange={(e) => setStrokeSize(Number(e.target.value))}
                  className="w-20 sm:w-28 accent-rose-500 cursor-pointer"
                />
                <span className="font-mono text-zinc-300 w-8 text-right">{strokeSize}px</span>
              </div>

              {/* Clear Active Layer Action */}
              {onClearActiveLayer && (
                <>
                  <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
                  <button
                    type="button"
                    onClick={onClearActiveLayer}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-200 text-[11px] font-medium transition-colors"
                    title="Clear all strokes and objects on the active layer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear Layer</span>
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {/* Size slider */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-[11px] font-medium">Size</span>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={strokeSize}
                  onChange={(e) => setStrokeSize(Number(e.target.value))}
                  className="w-20 sm:w-24 accent-rose-500 cursor-pointer"
                />
                <span className="font-mono text-zinc-300 w-6 text-right">{strokeSize}px</span>
              </div>

              <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

              {/* Opacity slider */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-[11px] font-medium">Opacity</span>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={activeOpacity}
                  onChange={(e) => setActiveOpacity(Number(e.target.value))}
                  className="w-16 sm:w-20 accent-rose-500 cursor-pointer"
                />
                <span className="font-mono text-zinc-300 w-8 text-right">{Math.round(activeOpacity * 100)}%</span>
              </div>

              {/* Real-time Stroke Stabilization Slider */}
              {setStabilization && (
                <>
                  <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
                  <div 
                    className="flex items-center gap-2 bg-[#0C0C10]/60 px-2.5 py-1 rounded-xl border border-zinc-800/60"
                    title="Real-time Stroke Stabilization: Dampens shaky hand tremors and draws smooth, organic lineart"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Activity className={`w-3.5 h-3.5 ${stabilization > 0 ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
                      <span className="text-zinc-300 text-[11px] font-medium">Stabilize</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={stabilization}
                      onChange={(e) => setStabilization(Number(e.target.value))}
                      className="w-20 sm:w-24 accent-emerald-500 cursor-pointer"
                    />
                    <button
                      onClick={() => {
                        if (stabilization === 0) setStabilization(35);
                        else if (stabilization < 50) setStabilization(65);
                        else if (stabilization < 85) setStabilization(90);
                        else setStabilization(0);
                      }}
                      className={`font-mono text-[11px] px-1.5 py-0.5 rounded border text-center transition-all ${
                        stabilization > 0
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 font-semibold'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                      title="Click to cycle stabilization strength (0% -> 35% -> 65% -> 90%)"
                    >
                      {stabilization === 0 ? 'Off' : `${stabilization}%`}
                    </button>
                    <span className="text-[10px] text-zinc-500 hidden md:inline">
                      {getStabilizationLabel(stabilization)}
                    </span>
                  </div>
                </>
              )}

              <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

              {/* Preview Dot & Brush Studio Trigger */}
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#0A0A0D] border border-zinc-800">
                  <div 
                    className="rounded-full transition-all"
                    style={{
                      width: `${Math.min(24, Math.max(3, strokeSize / 2))}px`,
                      height: `${Math.min(24, Math.max(3, strokeSize / 2))}px`,
                      backgroundColor: activeColor,
                      opacity: activeOpacity
                    }}
                  />
                </div>

                {onOpenBrushStudio && (
                  <button
                    onClick={onOpenBrushStudio}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-800/80 text-purple-300 text-[11px] font-medium transition-colors"
                    title="Open Brush Studio to customize dynamics, grain textures & flow"
                  >
                    <Paintbrush className="w-3.5 h-3.5" />
                    <span>{activeBrushPreset ? activeBrushPreset.name : 'Brush Studio'}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Main Dock Container */}
      <div className="bg-[#121216]/95 backdrop-blur-2xl border border-zinc-800/90 rounded-2xl p-1.5 shadow-2xl shadow-black/80 flex items-center gap-1">
        {/* Pointer / Select */}
        <button
          onClick={() => setActiveTool('select')}
          className={`p-2 rounded-xl text-xs font-medium transition-all ${
            activeTool === 'select'
              ? 'bg-[#22222A] text-white shadow-sm border border-zinc-700/80'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26]'
          }`}
          title="Select & Move (V)"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* Hand / Pan */}
        <button
          onClick={() => setActiveTool('hand')}
          className={`p-2 rounded-xl text-xs font-medium transition-all ${
            activeTool === 'hand'
              ? 'bg-[#22222A] text-white shadow-sm border border-zinc-700/80'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26]'
          }`}
          title="Pan Infinite Canvas (H / Spacebar)"
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-zinc-800 mx-0.5" />

        {/* Pen */}
        <button
          onClick={() => {
            setActiveTool('pen');
            setShowBrushControls(true);
          }}
          className={`p-2 rounded-xl text-xs font-medium transition-all ${
            activeTool === 'pen'
              ? 'bg-rose-600/90 text-white shadow-lg shadow-rose-950/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26]'
          }`}
          title="Fine Inking Pen (B)"
        >
          <Pen className="w-4 h-4" />
        </button>

        {/* Acrylic Brush */}
        <button
          onClick={() => {
            setActiveTool('brush');
            setShowBrushControls(true);
          }}
          className={`p-2 rounded-xl text-xs font-medium transition-all ${
            activeTool === 'brush'
              ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-950/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26]'
          }`}
          title="Acrylic & Texture Brush (N)"
        >
          <Paintbrush className="w-4 h-4" />
        </button>

        {/* Graphite Pencil */}
        <button
          onClick={() => {
            setActiveTool('pencil');
            setShowBrushControls(true);
          }}
          className={`p-2 rounded-xl text-xs font-medium transition-all ${
            activeTool === 'pencil'
              ? 'bg-cyan-600/90 text-white shadow-lg shadow-cyan-950/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26]'
          }`}
          title="Graphite Sketch Pencil (P)"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Highlighter / Glaze */}
        <button
          onClick={() => {
            setActiveTool('highlighter');
            setShowBrushControls(true);
          }}
          className={`p-2 rounded-xl text-xs font-medium transition-all ${
            activeTool === 'highlighter'
              ? 'bg-amber-600/90 text-white shadow-lg shadow-amber-950/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26]'
          }`}
          title="Translucent Highlighter & Glaze (Shift+H)"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        {/* Eraser */}
        <button
          onClick={() => {
            setActiveTool('eraser');
            setShowBrushControls(true);
          }}
          className={`p-2 rounded-xl text-xs font-medium transition-all ${
            activeTool === 'eraser'
              ? 'bg-[#2B2B36] text-white shadow-sm border border-zinc-600/80'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26]'
          }`}
          title="Eraser (E)"
        >
          <Eraser className="w-4 h-4" />
        </button>

        {/* Quick Brush & Stabilization Properties Toggle */}
        {isDrawingTool && (
          <button
            onClick={() => setShowBrushControls(!showBrushControls)}
            className={`p-1.5 px-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1 border ${
              showBrushControls
                ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                : 'bg-zinc-900/70 hover:bg-zinc-800 text-zinc-400 border-zinc-800/80'
            }`}
            title="Toggle Brush Size, Opacity & Real-Time Stroke Stabilization"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-mono font-medium text-emerald-300 hidden md:inline">
              {stabilization > 0 ? `${stabilization}%` : 'Raw'}
            </span>
          </button>
        )}

        <div className="h-5 w-px bg-zinc-800 mx-0.5" />

        {/* Shapes Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setActiveTool('shape');
              setShowShapeMenu(!showShapeMenu);
            }}
            className={`p-2 rounded-xl text-xs font-medium transition-all flex items-center gap-0.5 ${
              activeTool === 'shape'
                ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26]'
            }`}
            title="Geometry & Shapes (U)"
          >
            {selectedShapeType === 'rectangle' && <Square className="w-4 h-4" />}
            {selectedShapeType === 'circle' && <Circle className="w-4 h-4" />}
            {selectedShapeType === 'arrow' && <ArrowUpRight className="w-4 h-4" />}
            {selectedShapeType === 'line' && <Minus className="w-4 h-4" />}
            {selectedShapeType === 'frame' && <Layout className="w-4 h-4" />}
            <ChevronUp className="w-2.5 h-2.5 opacity-60" />
          </button>

          {showShapeMenu && (
            <div className="absolute bottom-12 left-0 bg-[#16161B] border border-zinc-800 rounded-2xl p-1.5 shadow-2xl shadow-black/80 flex flex-col gap-1 z-40">
              <button
                onClick={() => { setSelectedShapeType('rectangle'); setShowShapeMenu(false); }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-zinc-300 hover:bg-[#24242E] hover:text-white"
              >
                <Square className="w-3.5 h-3.5" /> Rectangle
              </button>
              <button
                onClick={() => { setSelectedShapeType('circle'); setShowShapeMenu(false); }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-zinc-300 hover:bg-[#24242E] hover:text-white"
              >
                <Circle className="w-3.5 h-3.5" /> Circle
              </button>
              <button
                onClick={() => { setSelectedShapeType('arrow'); setShowShapeMenu(false); }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-zinc-300 hover:bg-[#24242E] hover:text-white"
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Arrow
              </button>
              <button
                onClick={() => { setSelectedShapeType('line'); setShowShapeMenu(false); }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-zinc-300 hover:bg-[#24242E] hover:text-white"
              >
                <Minus className="w-3.5 h-3.5" /> Line
              </button>
              <button
                onClick={() => { setSelectedShapeType('frame'); setShowShapeMenu(false); }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-zinc-300 hover:bg-[#24242E] hover:text-white"
              >
                <Layout className="w-3.5 h-3.5" /> Frame Artboard
              </button>
            </div>
          )}
        </div>

        {/* Sticky Note */}
        <button
          onClick={() => setActiveTool('sticky')}
          className={`p-2 rounded-xl text-xs font-medium transition-all ${
            activeTool === 'sticky'
              ? 'bg-amber-400 text-neutral-900 shadow-md font-bold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26]'
          }`}
          title="Sticky Note (S)"
        >
          <StickyNote className="w-4 h-4" />
        </button>

        {/* Text */}
        <button
          onClick={() => setActiveTool('text')}
          className={`p-2 rounded-xl text-xs font-medium transition-all ${
            activeTool === 'text'
              ? 'bg-[#22222A] text-white shadow-sm border border-zinc-700/80'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26]'
          }`}
          title="Text Label (T)"
        >
          <Type className="w-4 h-4" />
        </button>

        {/* Threaded Annotation Pin */}
        <button
          onClick={() => setActiveTool('annotation')}
          className={`p-2 rounded-xl text-xs font-medium transition-all ${
            activeTool === 'annotation'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26]'
          }`}
          title="Collaborative Annotation Pin (C)"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </button>

        {/* Eyedropper */}
        <button
          onClick={() => setActiveTool('eyedropper')}
          className={`p-2 rounded-xl text-xs font-medium transition-all ${
            activeTool === 'eyedropper'
              ? 'bg-[#2B2B36] text-white border border-zinc-600/80'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26]'
          }`}
          title="Color Eyedropper (I)"
        >
          <Pipette className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-zinc-800 mx-0.5" />

        {/* Color Palette & Custom Picker */}
        <div className="relative flex items-center gap-1.5 pl-1">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-7 h-7 rounded-xl border-2 border-zinc-700 shadow-md transition-transform hover:scale-105"
            style={{ backgroundColor: activeColor }}
            title={`Active Color: ${activeColor}`}
          />

          {/* Quick Swatches bar */}
          <div className="hidden sm:flex items-center gap-1">
            {colorSwatches.slice(0, 5).map((color, idx) => (
              <button
                key={idx}
                onClick={() => setActiveColor(color)}
                className={`w-4 h-4 rounded-full border transition-transform hover:scale-110 ${
                  activeColor === color ? 'border-white scale-110' : 'border-zinc-700'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* AI Palette sync shortcut */}
          <button
            onClick={onOpenMoodboardPalette}
            className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-950/60 hover:text-purple-300 transition-colors"
            title="Import Colors from Moodboard"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {showColorPicker && (
            <div className="absolute bottom-12 right-0 bg-[#141419] border border-zinc-800 rounded-2xl p-3.5 shadow-2xl shadow-black/90 w-64 z-40">
              <div className="text-xs font-semibold text-zinc-300 mb-2">Color Palette</div>
              <div className="grid grid-cols-6 gap-1.5 mb-3">
                {colorSwatches.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActiveColor(color); setShowColorPicker(false); }}
                    className="w-6 h-6 rounded-lg border border-zinc-700/80 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => setActiveColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={activeColor}
                  onChange={(e) => setActiveColor(e.target.value)}
                  className="flex-1 px-2 py-1 rounded-lg bg-[#0A0A0D] border border-zinc-800 text-xs font-mono text-zinc-200"
                />
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-zinc-800 mx-0.5" />

        {/* Upload Reference Image onto Canvas */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26] transition-colors"
          title="Place Reference Image on Canvas"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Layers Panel Toggle */}
        <button
          onClick={onToggleLayers}
          className="relative p-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26] transition-colors"
          title="Layers Manager"
        >
          <Layers className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400" />
        </button>

        {/* Activity Heatmap Toggle */}
        {onOpenHeatmap && (
          <button
            onClick={onOpenHeatmap}
            className={`p-2 rounded-xl text-xs font-medium transition-colors ${
              isHeatmapActive
                ? 'text-rose-400 bg-rose-950/50 shadow-inner'
                : 'text-zinc-400 hover:text-amber-300 hover:bg-[#1E1E26]'
            }`}
            title="Activity Heatmap & Focal Density (Cmd+H)"
          >
            <Flame className={`w-4 h-4 ${isHeatmapActive ? 'animate-bounce' : ''}`} />
          </button>
        )}

        {/* Canvas Object Search */}
        {onOpenCanvasSearch && (
          <button
            onClick={onOpenCanvasSearch}
            className="p-2 rounded-xl text-xs font-medium text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/40 transition-colors"
            title="Search Canvas Objects (Cmd+F)"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Alignment & Snapping Tool */}
        {onAlign && (
          <div className="relative">
            <button
              onClick={() => setShowAlignmentPopover(prev => !prev)}
              className={`relative p-2 rounded-xl text-xs font-medium transition-all ${
                showAlignmentPopover
                  ? 'bg-cyan-600/90 text-white shadow-lg shadow-cyan-950/50'
                  : selectedCount > 0
                  ? 'text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/40 bg-[#1A1A22]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26]'
              }`}
              title={selectedCount > 0 
                ? `Alignment & Snapping (${selectedCount} objects selected)`
                : "Alignment Tool: Snap objects to each other or to canvas center"
              }
            >
              <SlidersHorizontal className="w-4 h-4" />
              {selectedCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-[15px] rounded-full bg-cyan-400 text-black text-[9px] font-black flex items-center justify-center shadow-md">
                  {selectedCount}
                </span>
              )}
            </button>

            {showAlignmentPopover && (
              <AlignmentPopover
                selectedCount={selectedCount}
                onAlign={(action, target) => {
                  onAlign(action, target);
                }}
                onSelectAll={onSelectAll}
                onClose={() => setShowAlignmentPopover(false)}
                theme={theme}
                anchorAlign="bottom"
              />
            )}
          </div>
        )}

        {/* Grid & Snap Overlay Toggle */}
        {gridSettings && onUpdateGridSettings && (
          <div className="relative">
            <button
              onClick={() => setShowGridPopover(prev => !prev)}
              className={`relative p-2 rounded-xl text-xs font-medium transition-colors ${
                gridSettings.gridPattern !== 'none' || gridSettings.snapToGrid
                  ? 'text-cyan-400 bg-cyan-950/40'
                  : 'text-zinc-400 hover:text-cyan-300 hover:bg-[#1E1E26]'
              }`}
              title="Canvas Grid, Snapping & Rulers"
            >
              <GridIcon className="w-4 h-4" />
              {gridSettings.snapToGrid && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
            </button>

            {showGridPopover && (
              <GridSettingsPopover
                settings={gridSettings}
                onChange={onUpdateGridSettings}
                onClose={() => setShowGridPopover(false)}
                theme={theme}
                anchorAlign="bottom"
              />
            )}
          </div>
        )}

        {/* Magnetic Smart Guide Manager */}
        {onOpenGuideManager && (
          <button
            onClick={onOpenGuideManager}
            className={`relative p-2 rounded-xl text-xs font-medium transition-all ${
              isGuideManagerActive
                ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-950/50'
                : guidesCount > 0
                ? 'text-purple-400 hover:text-purple-200 hover:bg-purple-950/40 bg-[#191528]'
                : 'text-zinc-400 hover:text-purple-300 hover:bg-[#1E1E26]'
            }`}
            title={`Magnetic Guide Manager (${guidesCount} custom guides)`}
          >
            <Magnet className="w-4 h-4" />
            {guidesCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-[15px] rounded-full bg-purple-400 text-black text-[9px] font-black flex items-center justify-center shadow-md">
                {guidesCount}
              </span>
            )}
          </button>
        )}

        {/* Touch Gestures & Command Palette */}
        {onOpenGestureSettings && (
          <button
            onClick={onOpenGestureSettings}
            className="p-2 rounded-xl text-xs font-medium text-violet-400 hover:text-violet-200 hover:bg-violet-950/40 transition-colors"
            title="Touch Gestures & Command Palette (Multi-Finger Taps)"
          >
            <Hand className="w-4 h-4" />
          </button>
        )}

        {/* Brush Sliders Toggle */}
        {isDrawingTool && (
          <button
            onClick={() => setShowBrushControls(!showBrushControls)}
            className={`p-1.5 rounded-lg transition-colors ${
              showBrushControls ? 'text-rose-400 bg-[#22222A]' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle Brush Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
