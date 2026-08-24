import React, { useState, useEffect, useRef } from 'react';
import { 
  History, 
  RotateCcw, 
  GitFork, 
  Columns, 
  Star, 
  Trash2, 
  Plus, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Layers, 
  Sparkles, 
  Download, 
  Tag, 
  CheckCircle2,
  Calendar,
  Eye,
  Sliders,
  SplitSquareVertical
} from 'lucide-react';
import type { ProjectData, ProjectVersion } from '../../types';
import { 
  loadProjectVersions, 
  createVersionSnapshot, 
  toggleVersionStarred, 
  deleteVersionSnapshot 
} from '../../lib/versionControl';
import { VersionCompareView } from './VersionCompareView';

interface TimeMachineModalProps {
  currentProject: ProjectData;
  onRestoreVersion: (version: ProjectVersion) => void;
  onForkVersion: (version: ProjectVersion) => void;
  onClose: () => void;
}

export const TimeMachineModal: React.FC<TimeMachineModalProps> = ({
  currentProject,
  onRestoreVersion,
  onForkVersion,
  onClose
}) => {
  const [versions, setVersions] = useState<ProjectVersion[]>(() => loadProjectVersions(currentProject));
  const [selectedIndex, setSelectedIndex] = useState<number>(() => {
    const list = loadProjectVersions(currentProject);
    return Math.max(0, list.length - 1);
  });
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTag, setNewTag] = useState<ProjectVersion['tag']>('milestone');
  const [compareVersion, setCompareVersion] = useState<ProjectVersion | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedIndex >= versions.length) {
      setSelectedIndex(Math.max(0, versions.length - 1));
    }
  }, [versions.length, selectedIndex]);

  const selectedVersion: ProjectVersion | undefined = versions[selectedIndex];

  // Save new snapshot
  const handleSaveSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const newVer = createVersionSnapshot(
      currentProject,
      newLabel,
      newDesc,
      newTag,
      'You'
    );
    const updated = loadProjectVersions(currentProject);
    setVersions(updated);
    setSelectedIndex(updated.length - 1);
    setIsCreatingSnapshot(false);
    setNewLabel('');
    setNewDesc('');
    
    setStatusMessage(`Saved checkpoint "${newVer.label}"!`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Star toggle
  const handleToggleStar = (vId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleVersionStarred(currentProject.id, vId);
    setVersions(updated);
  };

  // Delete version
  const handleDeleteVersion = (vId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (versions.length <= 1) {
      alert("Cannot delete the only version checkpoint.");
      return;
    }
    if (confirm("Are you sure you want to delete this version snapshot?")) {
      const updated = deleteVersionSnapshot(currentProject.id, vId);
      setVersions(updated);
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }
  };

  // Export JSON
  const handleExportVersion = (version: ProjectVersion) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(version, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `${currentProject.title.toLowerCase().replace(/\s+/g, '-')}-v${version.versionNumber}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Keyboard navigation through timeline
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCreatingSnapshot || compareVersion) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        setSelectedIndex(prev => Math.min(versions.length - 1, prev + 1));
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [versions.length, isCreatingSnapshot, compareVersion, onClose]);

  // Mini canvas renderer for card preview
  const renderCardCanvas = (snapshot: ProjectData, canvasEl: HTMLCanvasElement | null) => {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const w = canvasEl.width;
    const h = canvasEl.height;
    ctx.clearRect(0, 0, w, h);

    // Background fill
    ctx.fillStyle = snapshot.canvasSettings?.backgroundColor || '#121216';
    ctx.fillRect(0, 0, w, h);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Render strokes scaled
    ctx.save();
    ctx.scale(0.32, 0.32);
    ctx.translate(40, 40);

    snapshot.strokes.forEach(stroke => {
      if (stroke.points.length === 0) return;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.globalAlpha = stroke.opacity;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });

    // Render shapes outline
    snapshot.shapes.forEach(shape => {
      ctx.save();
      ctx.strokeStyle = shape.strokeColor;
      ctx.lineWidth = shape.strokeWidth;
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      ctx.restore();
    });

    ctx.restore();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050508]/98 backdrop-blur-2xl flex flex-col select-none overflow-hidden animate-in fade-in">
      {/* Time Machine Cosmic Space Background with Star Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-rose-950/15 rounded-full blur-[180px]" />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-10 h-16 border-b border-zinc-800/80 bg-[#0A0A0E]/90 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-950/40">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white tracking-wide font-['Outfit']">
                Apple Time Machine Timeline
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-950/70 border border-purple-800/80 text-purple-300">
                {versions.length} Checkpoints
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Flip through historical snapshots in 3D perspective or compare diffs side-by-side
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {statusMessage && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          <button
            onClick={() => setIsCreatingSnapshot(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950/40 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Savepoint</span>
          </button>

          {selectedVersion && (
            <button
              onClick={() => setCompareVersion(selectedVersion)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181F] hover:bg-[#22222B] text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors"
              title="Compare selected version side-by-side with current project"
            >
              <Columns className="w-3.5 h-3.5 text-cyan-400" />
              <span>Compare Diff</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181F] transition-colors"
            title="Exit Time Machine (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main 3D Time Machine Stage */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left / Center 3D Space View */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {/* 3D Container with Perspective */}
          <div 
            className="relative w-full max-w-4xl h-[440px] flex items-center justify-center"
            style={{ perspective: '1400px' }}
          >
            {versions.map((ver, idx) => {
              const offset = idx - selectedIndex; // 0 = active, negative = past, positive = future
              const isSelected = offset === 0;
              
              // Only render visible window range for smooth performance
              if (Math.abs(offset) > 4) return null;

              // 3D Apple Time Machine calculation
              const zIndex = 30 - Math.abs(offset);
              const translateZ = -Math.abs(offset) * 140;
              const translateY = offset * 25;
              const rotateX = offset * 4;
              const opacity = offset === 0 ? 1 : Math.max(0.15, 0.9 - Math.abs(offset) * 0.25);
              const scale = 1 - Math.abs(offset) * 0.08;

              return (
                <div
                  key={ver.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`absolute w-[560px] h-[340px] rounded-3xl transition-all duration-500 ease-out cursor-pointer overflow-hidden border ${
                    isSelected
                      ? 'border-purple-500/80 shadow-[0_20px_60px_-15px_rgba(168,85,247,0.4)] ring-2 ring-purple-500/30'
                      : 'border-zinc-800/80 shadow-2xl hover:border-zinc-700'
                  }`}
                  style={{
                    transform: `translate3d(0, ${translateY}px, ${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`,
                    zIndex,
                    opacity,
                    backgroundColor: '#121216',
                  }}
                >
                  {/* Window Header */}
                  <div className="p-3 bg-[#0A0A0D]/90 border-b border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="font-bold text-xs text-white truncate ml-2">
                        v{ver.versionNumber}: {ver.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        ver.tag === 'milestone' ? 'bg-purple-950/70 text-purple-300 border border-purple-800' :
                        ver.tag === 'sketch' ? 'bg-blue-950/70 text-blue-300 border border-blue-800' :
                        ver.tag === 'color' ? 'bg-pink-950/70 text-pink-300 border border-pink-800' :
                        'bg-zinc-800 text-zinc-300'
                      }`}>
                        {ver.tag}
                      </span>
                      <button
                        onClick={(e) => handleToggleStar(ver.id, e)}
                        className={`p-1 rounded hover:bg-zinc-800 transition-colors ${ver.isStarred ? 'text-amber-400' : 'text-zinc-500'}`}
                      >
                        <Star className={`w-3.5 h-3.5 ${ver.isStarred ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Canvas Preview Area */}
                  <div className="relative w-full h-[240px] bg-[#0E0E12] overflow-hidden flex items-center justify-center">
                    <canvas
                      ref={(el) => renderCardCanvas(ver.snapshot, el)}
                      width={560}
                      height={240}
                      className="w-full h-full object-cover"
                    />

                    {/* Stats pill overlay */}
                    <div className="absolute bottom-2 left-3 flex items-center gap-2 bg-[#0A0A0D]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-zinc-800/80 text-[10px] text-zinc-300 font-mono">
                      <span>{ver.stats.strokeCount} strokes</span>
                      <span>•</span>
                      <span>{ver.stats.layerCount} layers</span>
                      <span>•</span>
                      <span>{ver.stats.stickyCount} notes</span>
                    </div>

                    <div className="absolute bottom-2 right-3 text-[10px] text-zinc-400 bg-[#0A0A0D]/90 backdrop-blur-md px-2 py-1 rounded-xl border border-zinc-800/80 font-mono">
                      {new Date(ver.createdAt).toLocaleDateString()} {new Date(ver.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Footer Description */}
                  <div className="px-3 py-2 bg-[#0A0A0D] border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                    <span className="truncate max-w-[360px] text-[11px]">{ver.description}</span>
                    <span className="text-[10px] text-zinc-500">By {ver.author}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Flip Navigation Arrows */}
          <div className="flex items-center gap-4 mt-4 z-20">
            <button
              onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
              disabled={selectedIndex === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#18181F] hover:bg-[#22222B] disabled:opacity-30 text-xs font-semibold text-zinc-200 border border-zinc-800 transition-colors shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Version</span>
            </button>

            <span className="text-xs font-mono text-zinc-400">
              {selectedIndex + 1} of {versions.length}
            </span>

            <button
              onClick={() => setSelectedIndex(prev => Math.min(versions.length - 1, prev + 1))}
              disabled={selectedIndex === versions.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#18181F] hover:bg-[#22222B] disabled:opacity-30 text-xs font-semibold text-zinc-200 border border-zinc-800 transition-colors shadow-md"
            >
              <span>Next Version</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right-Hand Time Machine Vertical Scrubber Bar */}
        <div className="w-72 border-l border-zinc-800/80 bg-[#0A0A0E]/95 p-4 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-xs text-white">Timeline Scrubber</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                {selectedVersion ? `v${selectedVersion.versionNumber}` : ''}
              </span>
            </div>

            {/* List of Version Ticks */}
            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              {versions.map((ver, idx) => {
                const isSelected = idx === selectedIndex;
                const isCurrentLive = idx === versions.length - 1;

                return (
                  <div
                    key={ver.id}
                    onClick={() => setSelectedIndex(idx)}
                    className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500/80 text-white shadow-lg shadow-purple-950/20'
                        : 'bg-[#121216]/90 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-purple-400 animate-pulse' : 'bg-zinc-600'}`} />
                        <span className="font-bold text-xs truncate">v{ver.versionNumber}: {ver.label}</span>
                      </div>
                      {ver.isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{new Date(ver.createdAt).toLocaleDateString()}</span>
                      <span className="font-mono">{ver.stats.strokeCount} strks</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Version Action Deck */}
          {selectedVersion && (
            <div className="pt-4 border-t border-zinc-800/80 space-y-2">
              <button
                onClick={() => onRestoreVersion(selectedVersion)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950/40 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revert to this Version</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onForkVersion(selectedVersion)}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#18181F] hover:bg-[#22222B] text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors"
                  title="Create a new independent project branch from this version"
                >
                  <GitFork className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Branch Project</span>
                </button>

                <button
                  onClick={() => handleExportVersion(selectedVersion)}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#18181F] hover:bg-[#22222B] text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors"
                  title="Export this version as JSON file"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={(e) => handleDeleteVersion(selectedVersion.id, e)}
                  className="text-[11px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete this snapshot</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Savepoint Modal Form */}
      {isCreatingSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSaveSnapshot} className="bg-[#121216] border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">Create New Version Savepoint</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingSnapshot(false)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Version Label / Milestone</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Color Flats & Neon Highlights Pass"
                required
                autoFocus
                className="w-full bg-[#0A0A0D] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Commit Description</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Summary of changes, adjustments, or art direction notes..."
                rows={3}
                className="w-full bg-[#0A0A0D] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Tag Category</label>
              <select
                value={newTag}
                onChange={(e) => setNewTag(e.target.value as any)}
                className="w-full bg-[#0A0A0D] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
              >
                <option value="milestone">Milestone Checkpoint</option>
                <option value="sketch">Rough Gesture / Thumbnail</option>
                <option value="lineart">Lineart & Perspective</option>
                <option value="color">Color & Underpainting</option>
                <option value="lighting">Volumetric Lighting & FX</option>
                <option value="detail">Detailing & Polish</option>
                <option value="release">Client Final Release</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingSnapshot(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950/40"
              >
                Save Version Snapshot
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Side-by-Side Comparison Overlay Modal */}
      {compareVersion && (
        <VersionCompareView
          versionA={compareVersion}
          versionB={{
            id: 'current',
            projectId: currentProject.id,
            versionNumber: versions.length,
            label: 'Current Working Canvas',
            description: 'Latest uncommitted live drawing state',
            createdAt: currentProject.updatedAt,
            author: 'You',
            tag: 'milestone',
            stats: {
              strokeCount: currentProject.strokes.length,
              layerCount: currentProject.layers.length,
              imageCount: currentProject.images.length,
              stickyCount: currentProject.stickies.length,
              shapeCount: currentProject.shapes.length,
              annotationCount: currentProject.annotations.length
            },
            snapshot: currentProject
          }}
          onClose={() => setCompareVersion(null)}
          onRestoreVersion={() => {
            onRestoreVersion(compareVersion);
            setCompareVersion(null);
          }}
        />
      )}
    </div>
  );
};
