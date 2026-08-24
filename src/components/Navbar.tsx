import React from 'react';
import { 
  Palette, 
  Calendar, 
  Image as ImageIcon, 
  Cloud, 
  Keyboard, 
  Tablet, 
  Sun, 
  Moon, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Sparkles,
  FolderOpen,
  Plus,
  Share2,
  HardDrive,
  History,
  Paintbrush,
  Search,
  Flame,
  Download
} from 'lucide-react';
import type { ProjectData, StylusSettings } from '../types';
import { CompanionVitalsPill } from './CompanionVitalsPill';

interface NavbarProps {
  activeView: 'canvas' | 'moodboard' | 'timeline' | 'gallery' | 'workspace';
  setActiveView: (view: 'canvas' | 'moodboard' | 'timeline' | 'gallery' | 'workspace') => void;
  project: ProjectData;
  onOpenProjectList: () => void;
  onNewProject: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  theme: 'dark' | 'light' | 'oled' | 'sepia' | 'companion';
  setTheme: (theme: 'dark' | 'light' | 'oled' | 'sepia' | 'companion') => void;
  stylusSettings: StylusSettings;
  setStylusSettings: React.Dispatch<React.SetStateAction<StylusSettings>>;
  onOpenShortcuts: () => void;
  onOpenWorkspace: () => void;
  isCloudSynced: boolean;
  nextcloudConfigured: boolean;
  onTriggerNextcloudBackup: () => void;
  isBackingUp: boolean;
  onOpenTimeMachine?: () => void;
  onOpenBrushStudio?: () => void;
  onOpenCanvasSearch?: () => void;
  onOpenHeatmap?: () => void;
  isHeatmapActive?: boolean;
  onOpenExport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  project,
  onOpenProjectList,
  onNewProject,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  theme,
  setTheme,
  stylusSettings,
  setStylusSettings,
  onOpenShortcuts,
  onOpenWorkspace,
  isCloudSynced,
  nextcloudConfigured,
  onTriggerNextcloudBackup,
  isBackingUp,
  onOpenTimeMachine,
  onOpenBrushStudio,
  onOpenCanvasSearch,
  onOpenHeatmap,
  isHeatmapActive,
  onOpenExport
}) => {
  const toggleTheme = () => {
    if (theme === 'dark') setTheme('oled');
    else if (theme === 'oled') setTheme('sepia');
    else if (theme === 'sepia') setTheme('light');
    else setTheme('dark');
  };

  // Companion theme swaps the near-black chrome for Project Companion OS's
  // glass-panel look (rgba(30,41,59,.45) + blur + rgba(255,255,255,.1) border,
  // see project-companion-os/frontend/style.css's .glass-panel) so the Navbar
  // reads as part of the OS window instead of a foreign app's title bar.
  const headerClass = theme === 'companion'
    ? 'h-14 border-b border-white/10 bg-slate-800/45 backdrop-blur-xl px-3 flex items-center justify-between select-none z-30 shrink-0'
    : 'h-14 border-b border-zinc-800/80 bg-[#0E0E12]/95 backdrop-blur-xl px-3 flex items-center justify-between select-none z-30 shrink-0';

  return (
    <header className={headerClass}>
      {/* Left: Branding & Project Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-zinc-800/80">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-950/40">
            <Palette className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent font-['Outfit'] hidden sm:inline">
            ArtisPlan
          </span>
        </div>

        {/* Project Switcher */}
        <button
          onClick={onOpenProjectList}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#18181D] hover:bg-[#22222A] text-xs font-medium text-zinc-200 border border-zinc-800/60 transition-colors max-w-[200px] truncate shadow-sm"
          title="Switch or manage projects"
        >
          <FolderOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">{project.title}</span>
        </button>

        <button
          onClick={onNewProject}
          className="p-1.5 rounded-xl bg-[#18181D]/80 hover:bg-[#22222A] text-zinc-400 hover:text-zinc-200 border border-zinc-800/60 transition-colors"
          title="New Project"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Main View Navigation */}
      <nav className="flex items-center gap-1 bg-[#0A0A0D] p-1 rounded-2xl border border-zinc-800/90 shadow-inner">
        <button
          onClick={() => setActiveView('canvas')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
            activeView === 'canvas'
              ? 'bg-[#22222A] text-white shadow-md border border-zinc-700/80'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Canvas</span>
        </button>

        <button
          onClick={() => setActiveView('moodboard')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
            activeView === 'moodboard'
              ? 'bg-purple-950/80 text-purple-200 border border-purple-800/80 shadow-md shadow-purple-950/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Mood Board</span>
        </button>

        <button
          onClick={() => setActiveView('timeline')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
            activeView === 'timeline'
              ? 'bg-blue-950/80 text-blue-200 border border-blue-800/80 shadow-md shadow-blue-950/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => setActiveView('gallery')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
            activeView === 'gallery'
              ? 'bg-amber-950/80 text-amber-200 border border-amber-800/80 shadow-md shadow-amber-950/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>Ref Gallery</span>
        </button>

        <button
          onClick={() => setActiveView('workspace')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
            activeView === 'workspace'
              ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800/80 shadow-md shadow-emerald-950/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>Workspace</span>
        </button>
      </nav>

      {/* Right: Heatmap, Search, Time Machine, Brush Studio, Quick Tools, Stylus Mode, Undo/Redo & Workspace Sync */}
      <div className="flex items-center gap-2">
        {/* Activity Heatmap Mode Toggle */}
        {onOpenHeatmap && activeView === 'canvas' && (
          <button
            onClick={onOpenHeatmap}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium transition-all shadow-sm ${
              isHeatmapActive
                ? 'bg-rose-500/25 border-rose-500/80 text-rose-300 ring-2 ring-rose-500/30'
                : 'bg-zinc-900/70 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
            }`}
            title="Toggle Activity Heatmap & Density Analysis (Cmd+H / Ctrl+H)"
          >
            <Flame className={`w-3.5 h-3.5 ${isHeatmapActive ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">Heatmap</span>
            {isHeatmapActive && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />}
          </button>
        )}

        {/* Search Objects on Canvas Button */}
        {onOpenCanvasSearch && (
          <button
            onClick={onOpenCanvasSearch}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/70 text-cyan-300 text-xs font-medium transition-colors shadow-sm"
            title="Search Canvas Objects (Cmd+F / Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Search Canvas</span>
            <kbd className="hidden lg:inline text-[9px] bg-cyan-900/80 px-1 py-0.2 rounded text-cyan-200 ml-0.5">⌘F</kbd>
          </button>
        )}

        {/* Brush Studio Button */}
        {onOpenBrushStudio && (
          <button
            onClick={onOpenBrushStudio}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-800/80 text-purple-300 text-xs font-medium transition-colors shadow-sm"
            title="Open Brush Studio: Sculpt custom shapes, textures & dynamics"
          >
            <Paintbrush className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">Brush Studio</span>
          </button>
        )}

        {/* Time Machine Version History Button */}
        {onOpenTimeMachine && (
          <button
            onClick={onOpenTimeMachine}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 text-xs font-medium transition-colors shadow-sm"
            title="Time Machine Version History (Cmd+Shift+V)"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Time Machine</span>
          </button>
        )}

        {/* High-Resolution Export Button */}
        {onOpenExport && activeView === 'canvas' && (
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900 hover:to-blue-900 border border-cyan-700/80 text-cyan-200 text-xs font-medium transition-all shadow-sm shadow-cyan-950/40"
            title="Export Canvas (PNG, SVG, JPEG, WebP) - Cmd+E"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-semibold">Export</span>
            <kbd className="hidden lg:inline text-[9px] bg-cyan-900/90 px-1 py-0.2 rounded text-cyan-200 ml-0.5">⌘E</kbd>
          </button>
        )}
        {/* Undo / Redo (Active on Canvas) */}
        {activeView === 'canvas' && (
          <div className="hidden md:flex items-center gap-0.5 bg-[#18181D]/80 p-0.5 rounded-xl border border-zinc-800/70">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                canUndo ? 'text-zinc-300 hover:bg-zinc-700/60' : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                canRedo ? 'text-zinc-300 hover:bg-zinc-700/60' : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Zoom Controls (Active on Canvas) */}
        {activeView === 'canvas' && (
          <div className="hidden lg:flex items-center gap-1 bg-[#18181D]/80 px-2 py-1 rounded-xl border border-zinc-800/70 text-xs text-zinc-300">
            <button onClick={onZoomOut} className="hover:text-white" title="Zoom Out (-)">
              <ZoomOut className="w-3 h-3" />
            </button>
            <button onClick={onResetZoom} className="px-1 font-mono hover:text-white" title="Reset Zoom (100%)">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={onZoomIn} className="hover:text-white" title="Zoom In (+)">
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Tablet / Stylus Mode Palm Rejection Toggle */}
        <button
          onClick={() => setStylusSettings(prev => ({ ...prev, palmRejection: !prev.palmRejection }))}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-medium border transition-colors ${
            stylusSettings.palmRejection 
              ? 'bg-cyan-950/80 border-cyan-700/80 text-cyan-300 shadow-sm shadow-cyan-950/40' 
              : 'bg-[#18181D]/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
          title={stylusSettings.palmRejection ? "Stylus-Only Mode (Palm Rejection Active)" : "Touch & Stylus Mode"}
        >
          <Tablet className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{stylusSettings.palmRejection ? "Stylus Lock" : "Touch+Pen"}</span>
        </button>

        {/* Nextcloud Workspace & Cloud Backup Button */}
        <button
          onClick={onOpenWorkspace}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
            nextcloudConfigured
              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60 shadow-sm shadow-emerald-950/30'
              : 'bg-[#18181D]/90 border-zinc-800 text-zinc-300 hover:bg-[#22222A]'
          }`}
          title="Nextcloud Backup, Brief & Timeline Export"
        >
          <Cloud className={`w-3.5 h-3.5 ${isCloudSynced ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
          <span className="hidden sm:inline">{nextcloudConfigured ? 'Nextcloud Synced' : 'Nextcloud Setup'}</span>
        </button>

        {/* Project Companion OS: shared Ollama load heads-up (no-ops if not embedded) */}
        <CompanionVitalsPill />

        {/* Keyboard Shortcuts Cheatsheet */}
        <button
          onClick={onOpenShortcuts}
          className="p-1.5 rounded-xl bg-[#18181D]/80 hover:bg-[#22222A] text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        {/* Theme Selector */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-xl bg-[#18181D]/80 hover:bg-[#22222A] text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
          title={`Current Theme: ${theme.toUpperCase()} (Click to toggle)`}
        >
          {theme === 'light' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-purple-400" />}
        </button>
      </div>
    </header>
  );
};
