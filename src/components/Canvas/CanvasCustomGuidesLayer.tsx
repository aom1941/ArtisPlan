import React, { useState } from 'react';
import { Lock, Unlock, Trash2, Edit3, Move, ArrowRightLeft, ArrowUpDown } from 'lucide-react';
import type { CanvasCustomGuide } from '../../types';

interface CanvasCustomGuidesLayerProps {
  guides: CanvasCustomGuide[];
  zoom: number;
  pan: { x: number; y: number };
  onStartDragGuide: (guide: CanvasCustomGuide, e: React.PointerEvent) => void;
  onUpdateGuide: (id: string, updates: Partial<CanvasCustomGuide>) => void;
  onDeleteGuide: (id: string) => void;
  onOpenGuideManager?: () => void;
}

export const CanvasCustomGuidesLayer: React.FC<CanvasCustomGuidesLayerProps> = ({
  guides = [],
  zoom,
  pan,
  onStartDragGuide,
  onUpdateGuide,
  onDeleteGuide,
  onOpenGuideManager
}) => {
  const [hoveredGuideId, setHoveredGuideId] = useState<string | null>(null);

  if (guides.length === 0) return null;

  // We compute a huge span for infinite lines in canvas space
  const EXTENT = 100000;

  return (
    <div className="absolute inset-0 pointer-events-none z-35 overflow-visible select-none">
      {guides.map((guide) => {
        if (guide.visible === false) return null;

        const isHovered = hoveredGuideId === guide.id;
        const isHorizontal = guide.orientation === 'horizontal';
        const color = guide.color || '#06B6D4';
        const isLocked = !!guide.locked;

        return (
          <div
            key={guide.id}
            className="group pointer-events-auto"
            onPointerEnter={() => setHoveredGuideId(guide.id)}
            onPointerLeave={() => setHoveredGuideId(null)}
          >
            {/* 1. Guideline Line Renderer */}
            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
              {/* Laser Halo Glow when hovered */}
              {isHovered && (
                <line
                  x1={isHorizontal ? -EXTENT : guide.position}
                  y1={isHorizontal ? guide.position : -EXTENT}
                  x2={isHorizontal ? EXTENT : guide.position}
                  y2={isHorizontal ? guide.position : EXTENT}
                  stroke={color}
                  strokeWidth={6 / zoom}
                  strokeOpacity={0.4}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 ${8 / zoom}px ${color})` }}
                />
              )}

              {/* Core Guide Line */}
              <line
                x1={isHorizontal ? -EXTENT : guide.position}
                y1={isHorizontal ? guide.position : -EXTENT}
                x2={isHorizontal ? EXTENT : guide.position}
                y2={isHorizontal ? guide.position : EXTENT}
                stroke={color}
                strokeWidth={(isHovered ? 2 : 1.25) / zoom}
                strokeDasharray={isLocked ? undefined : `${8 / zoom},${4 / zoom}`}
                strokeOpacity={isHovered ? 1 : 0.75}
              />
            </svg>

            {/* 2. Interactive Hitbox for real-time canvas dragging */}
            <div
              className={`absolute pointer-events-auto transition-opacity ${
                isLocked 
                  ? 'cursor-default' 
                  : isHorizontal 
                  ? 'cursor-ns-resize' 
                  : 'cursor-ew-resize'
              }`}
              style={{
                left: isHorizontal ? `${-EXTENT}px` : `${guide.position - 12 / zoom}px`,
                top: isHorizontal ? `${guide.position - 12 / zoom}px` : `${-EXTENT}px`,
                width: isHorizontal ? `${EXTENT * 2}px` : `${24 / zoom}px`,
                height: isHorizontal ? `${24 / zoom}px` : `${EXTENT * 2}px`,
                zIndex: isHovered ? 40 : 30
              }}
              onPointerDown={(e) => {
                if (!isLocked) {
                  onStartDragGuide(guide, e);
                }
              }}
              title={`${guide.name} (${isHorizontal ? `Y: ${guide.position}px` : `X: ${guide.position}px`})${isLocked ? ' [Locked]' : ' - Drag to move'}`}
            />

            {/* 3. Floating Guideline Name & Position Badge */}
            <div
              className="absolute pointer-events-auto transition-all duration-100 ease-out z-40"
              style={{
                left: isHorizontal ? `${-pan.x / zoom + 40 / zoom}px` : `${guide.position}px`,
                top: isHorizontal ? `${guide.position}px` : `${-pan.y / zoom + 40 / zoom}px`,
                transform: `translate(${isHorizontal ? '0, -50%' : '-50%, 0'}) scale(${Math.max(0.75, Math.min(1.25, 1 / zoom))})`
              }}
              onPointerDown={(e) => {
                if (!isLocked) {
                  onStartDragGuide(guide, e);
                }
              }}
            >
              <div 
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-2xl backdrop-blur-xl border transition-all ${
                  isHovered
                    ? 'ring-2 ring-white/40 scale-105 shadow-cyan-500/20'
                    : 'opacity-90 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: '#0B0F17ee',
                  borderColor: color,
                  color: '#FFFFFF'
                }}
              >
                {/* Drag / Orientation Indicator */}
                <div 
                  className="flex items-center justify-center w-3.5 h-3.5 rounded-full text-slate-950 font-bold"
                  style={{ backgroundColor: color }}
                >
                  {isHorizontal ? (
                    <ArrowUpDown className="w-2.5 h-2.5 text-slate-950" />
                  ) : (
                    <ArrowRightLeft className="w-2.5 h-2.5 text-slate-950" />
                  )}
                </div>

                {/* Name */}
                <span className="text-[11px] font-semibold tracking-tight truncate max-w-[120px]">
                  {guide.name}
                </span>

                {/* Coordinate */}
                <span 
                  className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded"
                  style={{ backgroundColor: `${color}25`, color }}
                >
                  {isHorizontal ? `Y: ${Math.round(guide.position)}` : `X: ${Math.round(guide.position)}`}
                </span>

                {/* Lock Status */}
                {isLocked && (
                  <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                )}

                {/* Hover Quick Actions */}
                {isHovered && (
                  <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-zinc-700/80">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenGuideManager) onOpenGuideManager();
                      }}
                      className="p-1 rounded-md text-zinc-300 hover:text-cyan-300 hover:bg-zinc-800 transition-colors"
                      title="Open in Guide Manager"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateGuide(guide.id, { locked: !guide.locked });
                      }}
                      className={`p-1 rounded-md transition-colors ${
                        guide.locked ? 'text-amber-400 hover:bg-amber-500/20' : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                      }`}
                      title={guide.locked ? 'Unlock Guideline' : 'Lock Guideline'}
                    >
                      {guide.locked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGuide(guide.id);
                      }}
                      className="p-1 rounded-md text-zinc-300 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Delete Guideline"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
