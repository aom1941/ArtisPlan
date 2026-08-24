import React, { useEffect, useState, useRef } from 'react';
import type { 
  GestureLiveState, 
  ActiveTouchPoint, 
  TouchGestureSettings, 
  CanvasActionId 
} from '../../types/gestures';
import { GESTURE_ACTIONS_CATALOG } from '../../lib/gestureEngine';
import { 
  Undo2, 
  Redo2, 
  Trash2, 
  Flame, 
  Save, 
  Maximize2, 
  Paintbrush, 
  Search, 
  Layers, 
  Pipette, 
  Sparkles, 
  History, 
  Expand, 
  HelpCircle,
  CheckCircle2,
  Hand,
  Clock,
  ArrowDown
} from 'lucide-react';

interface TouchGestureVisualOverlayProps {
  liveState: GestureLiveState | null;
  settings: TouchGestureSettings;
  theme?: 'dark' | 'light' | 'oled' | 'sepia' | 'companion';
  onSimulateGesture?: (gestureId: any) => void;
}

export const TouchGestureVisualOverlay: React.FC<TouchGestureVisualOverlayProps> = ({
  liveState,
  settings,
  theme = 'dark',
  onSimulateGesture
}) => {
  const [persistentBurst, setPersistentBurst] = useState<{
    x: number;
    y: number;
    actionId: CanvasActionId;
    label: string;
    icon: string;
    gestureName?: string;
    timestamp: number;
  } | null>(null);

  const burstTimerRef = useRef<number | null>(null);

  // When a gesture is recognized, trigger a persistent visual burst
  useEffect(() => {
    if (liveState?.recognizedGesture) {
      if (burstTimerRef.current) {
        window.clearTimeout(burstTimerRef.current);
      }
      const rec = liveState.recognizedGesture;
      setPersistentBurst({
        x: rec.focalPoint.x,
        y: rec.focalPoint.y,
        actionId: rec.actionId,
        label: rec.label,
        icon: rec.icon,
        gestureName: rec.label,
        timestamp: Date.now()
      });

      burstTimerRef.current = window.setTimeout(() => {
        setPersistentBurst(null);
      }, 1400);
    }
  }, [liveState?.recognizedGesture]);

  if (!settings.showVisualFeedback && !persistentBurst) {
    return null;
  }

  const touches = liveState?.activeTouches || [];
  const fingerCount = touches.length;
  const isTracking = fingerCount > 0 && liveState?.phase !== 'idle';
  const centroid = liveState?.centroid || { x: 0, y: 0 };
  const phase = liveState?.phase || 'idle';
  const holdProgress = liveState?.holdProgress || 0;
  const potentialGesture = liveState?.potentialGesture;
  const isWithinTolerance = liveState?.isWithinTolerance ?? true;

  // Helper for action icons
  const getActionIcon = (actionId: CanvasActionId) => {
    switch (actionId) {
      case 'undo': return <Undo2 className="w-4 h-4 text-blue-400" />;
      case 'redo': return <Redo2 className="w-4 h-4 text-cyan-400" />;
      case 'clear_layer': return <Trash2 className="w-4 h-4 text-rose-400" />;
      case 'toggle_heatmap': return <Flame className="w-4 h-4 text-amber-400" />;
      case 'save_version': return <Save className="w-4 h-4 text-emerald-400" />;
      case 'fit_screen': return <Maximize2 className="w-4 h-4 text-yellow-300" />;
      case 'toggle_brush_studio': return <Paintbrush className="w-4 h-4 text-pink-400" />;
      case 'toggle_search': return <Search className="w-4 h-4 text-indigo-400" />;
      case 'toggle_layers': return <Layers className="w-4 h-4 text-orange-400" />;
      case 'toggle_time_machine': return <History className="w-4 h-4 text-teal-400" />;
      case 'eyedropper': return <Pipette className="w-4 h-4 text-purple-400" />;
      case 'toggle_fullscreen': return <Expand className="w-4 h-4 text-violet-400" />;
      default: return <Sparkles className="w-4 h-4 text-violet-400" />;
    }
  };

  // Construct SVG polygon points string for connecting fingers
  const getPolygonPoints = (pts: ActiveTouchPoint[]) => {
    return pts.map(p => `${p.x},${p.y}`).join(' ');
  };

  // Smooth SVG path from historical touch trail points
  const buildTrailPath = (history: Array<{ x: number; y: number }>) => {
    if (!history || history.length < 2) return '';
    let d = `M ${history[0].x} ${history[0].y}`;
    for (let i = 1; i < history.length; i++) {
      const p0 = history[i - 1];
      const p1 = history[i];
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      d += ` Q ${p0.x} ${p0.y}, ${mx} ${my}`;
    }
    const last = history[history.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden select-none">
      {/* Full-screen SVG for Drawing Multi-Finger Registered Paths & Geometric Hull */}
      <svg className="w-full h-full absolute inset-0">
        <defs>
          {/* Neon Glow Filters */}
          <filter id="touchGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="trailGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gradients */}
          <linearGradient id="vectorLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.8" />
          </linearGradient>
          <radialGradient id="triadFillGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
            <stop offset="70%" stopColor="#6366F1" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
          </radialGradient>
          <radialGradient id="quadFillGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.05" />
          </radialGradient>
        </defs>

        {/* 1. Geometric Connecting Hull / Lines Between Fingers */}
        {isTracking && fingerCount >= 2 && (
          <g className="transition-all duration-75">
            {/* 2-Finger Vector Distance Line */}
            {fingerCount === 2 && (
              <>
                <line
                  x1={touches[0].x}
                  y1={touches[0].y}
                  x2={touches[1].x}
                  y2={touches[1].y}
                  stroke="url(#vectorLineGrad)"
                  strokeWidth="2.5"
                  strokeDasharray="6,4"
                  filter="url(#touchGlow)"
                  className="animate-pulse"
                />
                {/* Distance Measurement Badge */}
                {liveState.distance && (
                  <text
                    x={centroid.x}
                    y={centroid.y - 14}
                    textAnchor="middle"
                    fill="#38BDF8"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="600"
                    className="drop-shadow-md"
                  >
                    {Math.round(liveState.distance)}px
                  </text>
                )}
              </>
            )}

            {/* 3-Finger Triad Triangle */}
            {fingerCount === 3 && (
              <>
                <polygon
                  points={getPolygonPoints(touches)}
                  fill="url(#triadFillGrad)"
                  stroke="#8B5CF6"
                  strokeWidth="2"
                  strokeDasharray="5,4"
                  filter="url(#touchGlow)"
                />
                {/* Connecting Spoke Lines to Focal Centroid */}
                {touches.map((t, idx) => (
                  <line
                    key={`spoke-${t.id || idx}`}
                    x1={t.x}
                    y1={t.y}
                    x2={centroid.x}
                    y2={centroid.y}
                    stroke="rgba(139, 92, 246, 0.4)"
                    strokeWidth="1.2"
                    strokeDasharray="3,3"
                  />
                ))}
              </>
            )}

            {/* 4-Finger Quad Hull */}
            {fingerCount >= 4 && (
              <polygon
                points={getPolygonPoints(touches)}
                fill="url(#quadFillGrad)"
                stroke="#EC4899"
                strokeWidth="2"
                strokeDasharray="6,4"
                filter="url(#touchGlow)"
              />
            )}
          </g>
        )}

        {/* 2. Registered Motion Paths for Each Finger */}
        {touches.map((touch, index) => {
          const pathD = buildTrailPath(touch.history);
          const color = index === 0 ? '#38BDF8' : index === 1 ? '#818CF8' : index === 2 ? '#C084FC' : '#F472B6';

          return (
            <g key={`trail-group-${touch.id || index}`}>
              {/* Tolerance boundary ring around origin */}
              <circle
                cx={touch.startX}
                cy={touch.startY}
                r={settings.maxMovementTolerance}
                fill="none"
                stroke={isWithinTolerance ? 'rgba(255, 255, 255, 0.15)' : 'rgba(244, 63, 94, 0.4)'}
                strokeWidth="1"
                strokeDasharray="2,2"
              />

              {/* Vector Motion Path */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#trailGlow)"
                  opacity="0.85"
                />
              )}
            </g>
          );
        })}

        {/* 3. Centroid Focal Point Crosshair & Hold Timer Progress */}
        {isTracking && fingerCount >= 2 && (
          <g transform={`translate(${centroid.x}, ${centroid.y})`}>
            {/* Focal Point Indicator */}
            <circle r="4" fill="#FFFFFF" filter="url(#touchGlow)" />
            <circle r="12" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.2" strokeDasharray="3,3" />

            {/* Hold Radial Progress Ring (for 3-finger long press) */}
            {phase === 'holding' && (
              <g>
                <circle
                  r="28"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="4"
                />
                <circle
                  r="28"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - holdProgress)}`}
                  transform="rotate(-90)"
                  filter="url(#touchGlow)"
                />
              </g>
            )}
          </g>
        )}
      </svg>

      {/* 4. Touch Finger Nodes (HTML / Badges positioned over coordinates) */}
      {touches.map((touch, index) => {
        const fingerColors = [
          'bg-cyan-500 text-cyan-950 border-cyan-300 shadow-cyan-500/50',
          'bg-indigo-500 text-indigo-950 border-indigo-300 shadow-indigo-500/50',
          'bg-purple-500 text-purple-950 border-purple-300 shadow-purple-500/50',
          'bg-pink-500 text-pink-950 border-pink-300 shadow-pink-500/50'
        ];
        const colorClass = fingerColors[index % fingerColors.length];

        return (
          <div
            key={`node-${touch.id || index}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
            style={{
              left: `${touch.x}px`,
              top: `${touch.y}px`
            }}
          >
            {/* Outer expanding contact pulse ring */}
            <div className="absolute inset-0 -m-3 w-12 h-12 rounded-full bg-white/20 animate-ping" />

            {/* Tactile Contact Disc */}
            <div className="relative w-7 h-7 rounded-full border-2 border-white bg-black/60 backdrop-blur-md shadow-xl flex items-center justify-center">
              <div className={`w-3.5 h-3.5 rounded-full ${colorClass.split(' ')[0]} shadow-md`} />
            </div>

            {/* Finger Number Tag */}
            <div className={`absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-lg ${colorClass}`}>
              #{index + 1}
            </div>
          </div>
        );
      })}

      {/* 5. Live Centroid Status HUD (Floating near Centroid) */}
      {isTracking && fingerCount >= 2 && (
        <div
          className="absolute -translate-x-1/2 z-50 pointer-events-none transition-all duration-100"
          style={{
            left: `${centroid.x}px`,
            top: `${centroid.y + (phase === 'holding' ? 44 : 32)}px`
          }}
        >
          <div className="bg-[#121218]/95 backdrop-blur-xl border border-zinc-700/80 rounded-2xl px-3.5 py-2 shadow-2xl shadow-black/80 flex flex-col items-center gap-1 text-white">
            {/* Top Status & Finger Count */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-400/30 text-[10px] font-semibold text-purple-300">
                {fingerCount} Fingers
              </span>

              {phase === 'holding' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <Clock className="w-3 h-3 animate-spin" />
                  Holding {Math.round(holdProgress * 100)}%
                </span>
              ) : phase === 'waiting_double_tap' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                  Tap 1/2 • Tap again
                </span>
              ) : phase === 'swiping' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-400">
                  <ArrowDown className="w-3 h-3 animate-bounce" />
                  Swipe Down
                </span>
              ) : (
                <span className="text-[11px] font-medium text-zinc-300">
                  {potentialGesture?.gestureName || 'Detecting Gesture'}
                </span>
              )}
            </div>

            {/* Target Action Match Preview */}
            {potentialGesture && (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                <span className="text-zinc-500 font-mono">➔</span>
                <div className="flex items-center gap-1 font-semibold text-zinc-100">
                  {getActionIcon(potentialGesture.actionId)}
                  <span>{GESTURE_ACTIONS_CATALOG[potentialGesture.actionId]?.label}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Success Recognition Burst HUD */}
      {persistentBurst && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-in zoom-in-90 fade-in duration-200"
          style={{
            left: `${persistentBurst.x}px`,
            top: `${persistentBurst.y}px`
          }}
        >
          {/* Outer Shockwave Ripple */}
          <div className="absolute -inset-10 rounded-full border-2 border-emerald-400/60 animate-ping" />
          <div className="absolute -inset-6 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />

          {/* Action Success Card */}
          <div className="relative bg-[#0F172A]/95 backdrop-blur-2xl border-2 border-emerald-500/80 rounded-2xl px-5 py-3 shadow-2xl shadow-emerald-950/80 flex items-center gap-3 text-white">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
              {getActionIcon(persistentBurst.actionId)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Gesture Executed</span>
              </div>
              <span className="text-sm font-bold text-zinc-100">{persistentBurst.label}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
