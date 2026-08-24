import React, { useState, useRef, useEffect } from 'react';
import { 
  Columns, 
  SplitSquareVertical, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  PlusCircle, 
  MinusCircle, 
  Layers, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import type { ProjectVersion, ProjectData } from '../../types';
import { calculateVersionDiff } from '../../lib/versionControl';

interface VersionCompareViewProps {
  versionA: ProjectVersion; // Historical version
  versionB: ProjectVersion; // Current or comparison version
  onClose: () => void;
  onRestoreVersion: () => void;
}

export const VersionCompareView: React.FC<VersionCompareViewProps> = ({
  versionA,
  versionB,
  onClose,
  onRestoreVersion
}) => {
  const [viewMode, setViewMode] = useState<'curtain' | 'sideBySide'>('curtain');
  const [curtainPos, setCurtainPos] = useState<number>(50); // percentage 0 to 100
  const [isDraggingCurtain, setIsDraggingCurtain] = useState(false);

  const canvasRefA = useRef<HTMLCanvasElement>(null);
  const canvasRefB = useRef<HTMLCanvasElement>(null);
  const curtainCanvasRefA = useRef<HTMLCanvasElement>(null);
  const curtainCanvasRefB = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const diff = calculateVersionDiff(versionA.snapshot, versionB.snapshot);

  // Render a project snapshot to a canvas
  const renderSnapshotToCanvas = (snapshot: ProjectData, canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Canvas Background
    ctx.fillStyle = snapshot.canvasSettings?.backgroundColor || '#121216';
    ctx.fillRect(0, 0, w, h);

    // Render Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.save();
    ctx.scale(0.55, 0.55);
    ctx.translate(60, 50);

    // Render Strokes
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

    // Render Shapes
    snapshot.shapes.forEach(shape => {
      ctx.save();
      ctx.strokeStyle = shape.strokeColor;
      ctx.lineWidth = shape.strokeWidth;
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      ctx.restore();
    });

    // Render Stickies preview
    snapshot.stickies.forEach(stk => {
      ctx.save();
      ctx.fillStyle = stk.color || '#FEF08A';
      ctx.globalAlpha = 0.85;
      ctx.fillRect(stk.x, stk.y, stk.width, stk.height);
      ctx.fillStyle = '#000000';
      ctx.font = '12px sans-serif';
      ctx.fillText(stk.text.slice(0, 20) + '...', stk.x + 8, stk.y + 24);
      ctx.restore();
    });

    ctx.restore();
  };

  useEffect(() => {
    if (viewMode === 'sideBySide') {
      renderSnapshotToCanvas(versionA.snapshot, canvasRefA.current);
      renderSnapshotToCanvas(versionB.snapshot, canvasRefB.current);
    } else {
      renderSnapshotToCanvas(versionA.snapshot, curtainCanvasRefA.current);
      renderSnapshotToCanvas(versionB.snapshot, curtainCanvasRefB.current);
    }
  }, [viewMode, versionA, versionB]);

  // Curtain slider drag handlers
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingCurtain || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setCurtainPos(pct);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0E]/98 backdrop-blur-2xl flex flex-col select-none overflow-hidden animate-in fade-in">
      {/* Header Bar */}
      <div className="h-16 border-b border-zinc-800/80 bg-[#0E0E12] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Columns className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white font-['Outfit']">
                Version Comparison Inspector
              </h3>
              <span className="text-xs text-zinc-400">
                v{versionA.versionNumber} ({versionA.label}) vs {versionB.label}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Interactive curtain split slider and visual delta analysis
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#0A0A0D] p-1 rounded-2xl border border-zinc-800">
            <button
              onClick={() => setViewMode('curtain')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                viewMode === 'curtain'
                  ? 'bg-[#22222A] text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Split Curtain</span>
            </button>

            <button
              onClick={() => setViewMode('sideBySide')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                viewMode === 'sideBySide'
                  ? 'bg-[#22222A] text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
          </div>

          <button
            onClick={onRestoreVersion}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950/40 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore v{versionA.versionNumber}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Diff Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center: Interactive Canvas Visual Comparison */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[#07070A] relative overflow-hidden">
          {viewMode === 'curtain' ? (
            /* Split Curtain Mode */
            <div
              ref={containerRef}
              onPointerDown={() => setIsDraggingCurtain(true)}
              onPointerUp={() => setIsDraggingCurtain(false)}
              onPointerMove={handlePointerMove}
              className="relative w-full max-w-4xl h-[520px] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-[#121216] select-none cursor-ew-resize"
            >
              {/* Layer B (Right / Background) */}
              <div className="absolute inset-0 w-full h-full">
                <canvas
                  ref={curtainCanvasRefB}
                  width={900}
                  height={520}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-[#0A0A0D]/90 backdrop-blur-md px-3 py-1 rounded-xl border border-zinc-800 text-xs font-bold text-cyan-400 font-mono shadow-md">
                  {versionB.label} (Current)
                </div>
              </div>

              {/* Layer A (Left / Clipped Overlay) */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-purple-500 shadow-2xl"
                style={{ width: `${curtainPos}%` }}
              >
                <div className="w-[900px] h-[520px]">
                  <canvas
                    ref={curtainCanvasRefA}
                    width={900}
                    height={520}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-4 left-4 bg-[#0A0A0D]/90 backdrop-blur-md px-3 py-1 rounded-xl border border-zinc-800 text-xs font-bold text-purple-400 font-mono shadow-md">
                  v{versionA.versionNumber}: {versionA.label}
                </div>
              </div>

              {/* Central Draggable Slider Handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-8 h-14 -ml-4 bg-purple-600 hover:bg-purple-500 rounded-xl shadow-2xl shadow-purple-950/80 flex items-center justify-center cursor-ew-resize border border-purple-400 transition-transform active:scale-95"
                style={{ left: `${curtainPos}%` }}
              >
                <SplitSquareVertical className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : (
            /* Side-by-Side Mode */
            <div className="grid grid-cols-2 gap-4 w-full max-w-5xl h-[520px]">
              {/* Version A */}
              <div className="flex flex-col rounded-3xl overflow-hidden border border-zinc-800 bg-[#121216] shadow-xl">
                <div className="p-3 bg-[#0A0A0D] border-b border-zinc-800 flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-300">
                    v{versionA.versionNumber}: {versionA.label}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(versionA.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex-1 bg-[#0E0E12] overflow-hidden">
                  <canvas
                    ref={canvasRefA}
                    width={500}
                    height={460}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Version B */}
              <div className="flex flex-col rounded-3xl overflow-hidden border border-zinc-800 bg-[#121216] shadow-xl">
                <div className="p-3 bg-[#0A0A0D] border-b border-zinc-800 flex items-center justify-between">
                  <span className="font-bold text-xs text-cyan-300">
                    {versionB.label} (Current)
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(versionB.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex-1 bg-[#0E0E12] overflow-hidden">
                  <canvas
                    ref={canvasRefB}
                    width={500}
                    height={460}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Semantic Changes Breakdown */}
        <div className="w-80 border-l border-zinc-800/80 bg-[#0A0A0E] p-5 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="pb-3 border-b border-zinc-800">
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">Change Breakdown</h4>
              <p className="text-[11px] text-zinc-400">Statistical delta between selected versions</p>
            </div>

            {/* Quick Delta Metric Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-[#121216] border border-zinc-800">
                <span className="text-zinc-500 text-[11px] block">Strokes Added</span>
                <span className="font-bold text-emerald-400 font-mono text-base">+{diff.strokesAdded}</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#121216] border border-zinc-800">
                <span className="text-zinc-500 text-[11px] block">Strokes Removed</span>
                <span className="font-bold text-rose-400 font-mono text-base">-{diff.strokesRemoved}</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#121216] border border-zinc-800">
                <span className="text-zinc-500 text-[11px] block">Layers Delta</span>
                <span className="font-bold text-purple-400 font-mono text-base">
                  {diff.layersDelta >= 0 ? `+${diff.layersDelta}` : diff.layersDelta}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#121216] border border-zinc-800">
                <span className="text-zinc-500 text-[11px] block">Canvas Elements</span>
                <span className="font-bold text-cyan-400 font-mono text-base">+{diff.elementsAdded}</span>
              </div>
            </div>

            {/* Detailed Description Points */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-zinc-300">Detailed Modifications:</span>
              <div className="space-y-1.5">
                {diff.description.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#121216]/80 border border-zinc-800/80 text-xs text-zinc-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <button
              onClick={onRestoreVersion}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950/40 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Confirm Rollback to v{versionA.versionNumber}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
