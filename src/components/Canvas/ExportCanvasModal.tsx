import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  FileCode2, 
  Maximize2, 
  Layers, 
  Grid, 
  MessageSquare, 
  StickyNote, 
  Type, 
  Sparkles, 
  Flame, 
  Eye, 
  RefreshCw, 
  Sun, 
  Moon, 
  Sliders, 
  HardDrive,
  CloudUpload
} from 'lucide-react';
import type { ProjectData } from '../../types';
import type { HeatmapSettings } from '../../types/heatmap';
import { 
  ExportFormat, 
  ExportAreaMode, 
  ExportBackgroundMode, 
  ExportOptions, 
  renderCanvasToRasterBlob, 
  renderCanvasToSVG, 
  triggerFileDownload, 
  copyBlobToClipboard, 
  copySvgToClipboard, 
  calculateArtworkBounds 
} from '../../lib/exportEngine';

interface ExportCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  viewportWidth: number;
  viewportHeight: number;
  pan: { x: number; y: number };
  zoom: number;
  theme: string;
  heatmapSettings?: HeatmapSettings;
  nextcloudConfigured?: boolean;
  onBackupToDrive?: () => void;
}

export const ExportCanvasModal: React.FC<ExportCanvasModalProps> = ({
  isOpen,
  onClose,
  project,
  viewportWidth,
  viewportHeight,
  pan,
  zoom,
  theme,
  heatmapSettings,
  nextcloudConfigured,
  onBackupToDrive
}) => {
  // Export Settings State
  const [format, setFormat] = useState<ExportFormat>('png');
  const [scale, setScale] = useState<1 | 2 | 3 | 4>(2);
  const [areaMode, setAreaMode] = useState<ExportAreaMode>('viewport');
  const [backgroundMode, setBackgroundMode] = useState<ExportBackgroundMode>('theme');
  const [customBgColor, setCustomBgColor] = useState('#121216');
  
  // Feature Toggles
  const [includeGrid, setIncludeGrid] = useState(false);
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [includeStickies, setIncludeStickies] = useState(true);
  const [includeTexts, setIncludeTexts] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [includeHeatmap, setIncludeHeatmap] = useState(heatmapSettings?.enabled ?? false);
  
  // Layer Selection State
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(() => 
    project.layers.filter(l => l.visible).map(l => l.id)
  );

  // Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [svgPreviewString, setSvgPreviewString] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [previewStats, setPreviewStats] = useState<{
    width: number;
    height: number;
    sizeKb: number;
    filename: string;
  } | null>(null);

  // Copy Feedback
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Synchronize layers when project changes
  useEffect(() => {
    setSelectedLayerIds(project.layers.filter(l => l.visible).map(l => l.id));
  }, [project.layers]);

  // Compute artwork dimensions for info
  const artworkBounds = calculateArtworkBounds(project, 40);

  // Generate Preview when settings change
  const updatePreview = useCallback(async () => {
    if (!isOpen) return;
    setIsRendering(true);

    const options: ExportOptions = {
      format,
      scale: format === 'svg' ? 1 : scale,
      areaMode,
      backgroundMode,
      customBackgroundColor: customBgColor,
      includeGrid,
      includeAnnotations,
      includeStickies,
      includeTexts,
      includeImages,
      includeHeatmap,
      selectedLayerIds,
      padding: 40
    };

    try {
      if (format === 'svg') {
        const svgRes = renderCanvasToSVG({
          project,
          viewportWidth,
          viewportHeight,
          pan,
          zoom,
          theme,
          options
        });
        setSvgPreviewString(svgRes.svgString);
        setPreviewUrl(null);
        setPreviewStats({
          width: svgRes.width,
          height: svgRes.height,
          sizeKb: Math.round(svgRes.blob.size / 1024),
          filename: svgRes.filename
        });
      } else {
        const rasterRes = await renderCanvasToRasterBlob({
          project,
          viewportWidth,
          viewportHeight,
          pan,
          zoom,
          theme,
          heatmapSettings,
          options
        });
        setPreviewUrl(rasterRes.dataUrl);
        setSvgPreviewString(null);
        setPreviewStats({
          width: rasterRes.width,
          height: rasterRes.height,
          sizeKb: Math.round(rasterRes.fileSizeBytes / 1024),
          filename: rasterRes.filename
        });
      }
    } catch (err) {
      console.error('Failed to generate export preview:', err);
    } finally {
      setIsRendering(false);
    }
  }, [
    isOpen,
    format,
    scale,
    areaMode,
    backgroundMode,
    customBgColor,
    includeGrid,
    includeAnnotations,
    includeStickies,
    includeTexts,
    includeImages,
    includeHeatmap,
    selectedLayerIds,
    project,
    viewportWidth,
    viewportHeight,
    pan,
    zoom,
    theme,
    heatmapSettings
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updatePreview();
    }, 150);
    return () => clearTimeout(timer);
  }, [updatePreview]);

  // Handle Download File Action
  const handleDownload = async () => {
    setIsExporting(true);
    const options: ExportOptions = {
      format,
      scale: format === 'svg' ? 1 : scale,
      areaMode,
      backgroundMode,
      customBackgroundColor: customBgColor,
      includeGrid,
      includeAnnotations,
      includeStickies,
      includeTexts,
      includeImages,
      includeHeatmap,
      selectedLayerIds,
      padding: 40
    };

    try {
      if (format === 'svg') {
        const svgRes = renderCanvasToSVG({
          project,
          viewportWidth,
          viewportHeight,
          pan,
          zoom,
          theme,
          options
        });
        triggerFileDownload(svgRes.blob, svgRes.filename);
      } else {
        const rasterRes = await renderCanvasToRasterBlob({
          project,
          viewportWidth,
          viewportHeight,
          pan,
          zoom,
          theme,
          heatmapSettings,
          options
        });
        triggerFileDownload(rasterRes.blob, rasterRes.filename);
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Copy to Clipboard Action
  const handleCopyClipboard = async () => {
    setIsExporting(true);
    const options: ExportOptions = {
      format,
      scale: format === 'svg' ? 1 : scale,
      areaMode,
      backgroundMode,
      customBackgroundColor: customBgColor,
      includeGrid,
      includeAnnotations,
      includeStickies,
      includeTexts,
      includeImages,
      includeHeatmap,
      selectedLayerIds,
      padding: 40
    };

    try {
      if (format === 'svg') {
        const svgRes = renderCanvasToSVG({
          project,
          viewportWidth,
          viewportHeight,
          pan,
          zoom,
          theme,
          options
        });
        const success = await copySvgToClipboard(svgRes.svgString);
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }
      } else {
        const rasterRes = await renderCanvasToRasterBlob({
          project,
          viewportWidth,
          viewportHeight,
          pan,
          zoom,
          theme,
          heatmapSettings,
          options: { ...options, format: 'png' } // clipboard is best as PNG
        });
        const success = await copyBlobToClipboard(rasterRes.blob);
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }
      }
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleLayerSelection = (layerId: string) => {
    setSelectedLayerIds(prev => 
      prev.includes(layerId) ? prev.filter(id => id !== layerId) : [...prev, layerId]
    );
  };

  const selectAllLayers = () => {
    setSelectedLayerIds(project.layers.map(l => l.id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl h-[92vh] max-h-[860px] bg-[#111116] border border-zinc-800/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="h-14 px-5 border-b border-zinc-800/80 bg-[#16161D] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-950/40">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm tracking-wide text-zinc-100 font-['Outfit']">
                  Export Canvas
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/70 text-cyan-300 font-medium">
                  High-Resolution & Vector
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Generate crisp PNG, SVG vector paths or JPEG snapshots
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex text-[10px] items-center gap-0.5 bg-zinc-800/80 border border-zinc-700/60 px-2 py-1 rounded text-zinc-400">
              ESC to close
            </kbd>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Settings & Right Live Preview */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Settings Configuration */}
          <div className="w-full lg:w-[420px] shrink-0 border-r border-zinc-800/80 bg-[#121217] p-5 overflow-y-auto space-y-5 custom-scrollbar">
            
            {/* 1. Format Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Export Format</span>
                <span className="text-[10px] text-zinc-500 font-normal">Vector or High-Res Bitmap</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#181820] rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setFormat('png')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                    format === 'png'
                      ? 'bg-cyan-500 text-white shadow-md font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 mb-1" />
                  <span>PNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('svg')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                    format === 'svg'
                      ? 'bg-purple-600 text-white shadow-md font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <FileCode2 className="w-4 h-4 mb-1" />
                  <span>SVG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('jpeg')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                    format === 'jpeg'
                      ? 'bg-amber-600 text-white shadow-md font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="text-xs font-bold mb-1">JPG</span>
                  <span>JPEG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('webp')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                    format === 'webp'
                      ? 'bg-emerald-600 text-white shadow-md font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="text-xs font-bold mb-1">WebP</span>
                  <span>Modern</span>
                </button>
              </div>
            </div>

            {/* 2. Resolution Scale (for PNG/JPEG/WebP) */}
            {format !== 'svg' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Resolution Multiplier</span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    {scale === 1 && '1x (Standard 1080p)'}
                    {scale === 2 && '2x (Retina 4K • Sharp)'}
                    {scale === 3 && '3x (Super Res • 6K)'}
                    {scale === 4 && '4x (Ultra HD • Print 300DPI)'}
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {([1, 2, 3, 4] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScale(s)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                        scale === s
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-950/40'
                          : 'bg-[#181820] border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Export Framing Bounds */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Framing & Canvas Area</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAreaMode('viewport')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    areaMode === 'viewport'
                      ? 'bg-blue-950/70 border-blue-500/80 text-blue-100 shadow-sm'
                      : 'bg-[#181820] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                    <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Current Viewport</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    Exports exactly what is visible on your screen right now
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAreaMode('artwork')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    areaMode === 'artwork'
                      ? 'bg-blue-950/70 border-blue-500/80 text-blue-100 shadow-sm'
                      : 'bg-[#181820] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>All Artwork Content</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    Auto-crops bounding box enclosing all strokes and objects
                  </p>
                </button>
              </div>
            </div>

            {/* 4. Canvas Element & Feature Toggles */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Elements & Layers to Include</label>
              <div className="bg-[#181820] rounded-xl border border-zinc-800/80 divide-y divide-zinc-800/60 text-xs">
                
                {/* Toggle Grid & Guides */}
                <label className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <Grid className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="font-medium">Grid & Alignment Guides</span>
                      <p className="text-[10px] text-zinc-400">Include active grid pattern/dots</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeGrid}
                    onChange={(e) => setIncludeGrid(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-400"
                  />
                </label>

                {/* Toggle Annotations */}
                <label className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <MessageSquare className="w-4 h-4 text-rose-400" />
                    <div>
                      <span className="font-medium">Annotation Pins & Comments</span>
                      <p className="text-[10px] text-zinc-400">Collaborative feedback markers</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeAnnotations}
                    onChange={(e) => setIncludeAnnotations(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-rose-400"
                  />
                </label>

                {/* Toggle Sticky Notes */}
                <label className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <StickyNote className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="font-medium">Sticky Notes</span>
                      <p className="text-[10px] text-zinc-400">Cards and artist thoughts</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeStickies}
                    onChange={(e) => setIncludeStickies(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-400"
                  />
                </label>

                {/* Toggle Text Labels */}
                <label className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <Type className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="font-medium">Text Labels</span>
                      <p className="text-[10px] text-zinc-400">Typography callouts</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeTexts}
                    onChange={(e) => setIncludeTexts(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-400"
                  />
                </label>

                {/* Toggle Reference Images */}
                <label className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-medium">Pinned Reference Images</span>
                      <p className="text-[10px] text-zinc-400">Artwork photos and mood clips</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-400"
                  />
                </label>

                {/* Toggle Heatmap Overlay */}
                {heatmapSettings && (
                  <label className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-zinc-800/30 transition-colors">
                    <div className="flex items-center gap-2 text-zinc-200">
                      <Flame className="w-4 h-4 text-rose-500" />
                      <div>
                        <span className="font-medium">Activity Heatmap Overlay</span>
                        <p className="text-[10px] text-zinc-400">Density analysis layer</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeHeatmap}
                      onChange={(e) => setIncludeHeatmap(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-rose-400"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 5. Background Style */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Background Appearance</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setBackgroundMode('theme')}
                  className={`py-2 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    backgroundMode === 'theme'
                      ? 'bg-zinc-800 border-zinc-500 text-white font-semibold'
                      : 'bg-[#181820] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Theme</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBackgroundMode('transparent')}
                  className={`py-2 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    backgroundMode === 'transparent'
                      ? 'bg-zinc-800 border-cyan-500 text-cyan-300 font-semibold'
                      : 'bg-[#181820] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full border border-dashed border-zinc-400 inline-block" />
                  <span>Transparent</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBackgroundMode('white')}
                  className={`py-2 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    backgroundMode === 'white'
                      ? 'bg-zinc-800 border-zinc-300 text-white font-semibold'
                      : 'bg-[#181820] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>White</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBackgroundMode('oled')}
                  className={`py-2 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    backgroundMode === 'oled'
                      ? 'bg-black border-zinc-500 text-white font-semibold'
                      : 'bg-[#181820] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-black border border-zinc-600 inline-block" />
                  <span>OLED Black</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBackgroundMode('sepia')}
                  className={`py-2 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    backgroundMode === 'sepia'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-semibold'
                      : 'bg-[#181820] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-[#F5EBE1] inline-block" />
                  <span>Sepia Paper</span>
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setBackgroundMode('custom')}
                    className={`w-full py-2 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      backgroundMode === 'custom'
                        ? 'bg-zinc-800 border-cyan-500 text-cyan-300 font-semibold'
                        : 'bg-[#181820] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <input 
                      type="color"
                      value={customBgColor}
                      onChange={(e) => {
                        setCustomBgColor(e.target.value);
                        setBackgroundMode('custom');
                      }}
                      className="w-3.5 h-3.5 rounded cursor-pointer border-none bg-transparent"
                    />
                    <span>Custom</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 6. Layer Filtering */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Filter Included Layers</span>
                </label>
                <button
                  type="button"
                  onClick={selectAllLayers}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  Select All
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {project.layers.map(layer => {
                  const isSelected = selectedLayerIds.includes(layer.id);
                  return (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => toggleLayerSelection(layer.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-cyan-950/80 border-cyan-600 text-cyan-200 shadow-sm'
                          : 'bg-[#181820] border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {layer.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Preview */}
          <div className="flex-1 bg-[#0A0A0D] p-5 flex flex-col justify-between overflow-hidden relative">
            
            {/* Preview Frame Header */}
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  Live Render Preview
                </span>
                {isRendering && (
                  <span className="flex items-center gap-1 text-[11px] text-cyan-400 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Rendering...
                  </span>
                )}
              </div>

              {previewStats && (
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-zinc-800">
                  <span>{previewStats.width} × {previewStats.height} px</span>
                  <span className="text-zinc-600">•</span>
                  <span>{previewStats.sizeKb} KB</span>
                  <span className="text-zinc-600">•</span>
                  <span className="uppercase text-cyan-400 font-bold">{format}</span>
                </div>
              )}
            </div>

            {/* Canvas / SVG Output Display Stage */}
            <div className="flex-1 rounded-xl border border-zinc-800/90 bg-[#14141A] overflow-hidden flex items-center justify-center p-4 relative shadow-inner">
              {/* Checkerboard Pattern for Transparency */}
              <div 
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `radial-gradient(circle, #3F3F46 1px, transparent 1px)`,
                  backgroundSize: '16px 16px'
                }}
              />

              {format === 'svg' && svgPreviewString ? (
                <div 
                  className="w-full h-full flex items-center justify-center overflow-auto max-h-full"
                  dangerouslySetInnerHTML={{ __html: svgPreviewString }}
                />
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Canvas Export Preview"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-500 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mb-2 text-cyan-400" />
                  <span>Synthesizing canvas high-resolution render...</span>
                </div>
              )}
            </div>

            {/* Bottom Details Footer */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">File:</span>
                <span className="font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 max-w-[240px] truncate">
                  {previewStats?.filename || 'ArtisPlan-Export'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Copy to Clipboard */}
                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  disabled={isExporting}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    copied
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-800/90 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                  }`}
                  title="Copy image or SVG markup directly to clipboard (Cmd+C)"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy {format === 'svg' ? 'SVG' : 'Image'}</span>
                    </>
                  )}
                </button>

                {/* Nextcloud Upload if configured */}
                {nextcloudConfigured && onBackupToDrive && (
                  <button
                    type="button"
                    onClick={onBackupToDrive}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 transition-colors"
                    title="Upload to configured Nextcloud"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">To Nextcloud</span>
                  </button>
                )}

                {/* Main Download Button */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {format.toUpperCase()}</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
