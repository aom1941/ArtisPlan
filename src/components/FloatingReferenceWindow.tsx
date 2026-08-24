import React, { useState } from 'react';
import { 
  X, 
  Minus, 
  FlipHorizontal, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Pin, 
  Maximize2,
  Minimize2,
  Sun
} from 'lucide-react';
import type { ReferenceImageItem } from '../types';

interface FloatingReferenceWindowProps {
  reference: ReferenceImageItem;
  onClose: () => void;
}

export const FloatingReferenceWindow: React.FC<FloatingReferenceWindowProps> = ({
  reference,
  onClose
}) => {
  const [pos, setPos] = useState({ x: 24, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [opacity, setOpacity] = useState(0.95);
  const [isMinimized, setIsMinimized] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      setPos({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed z-40 bg-[#121216]/98 border border-zinc-800/90 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl flex flex-col transition-shadow hover:shadow-cyan-500/10"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: isMinimized ? '220px' : '300px',
        opacity: opacity
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Draggable Header */}
      <div
        onPointerDown={handlePointerDown}
        className="p-2.5 bg-[#0A0A0D]/95 border-b border-zinc-800/90 flex items-center justify-between cursor-move select-none"
      >
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold text-zinc-200 truncate">{reference.title}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-[#1C1C24] transition-colors"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-[#1C1C24] transition-colors"
            title="Close Reference"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Image View */}
      {!isMinimized && (
        <div className="flex flex-col">
          <div className="relative h-56 w-full overflow-hidden bg-[#0A0A0D] flex items-center justify-center">
            <img
              src={reference.url}
              alt={reference.title}
              className="max-h-full max-w-full object-contain transition-transform"
              style={{
                transform: `scale(${zoom}) scaleX(${isFlipped ? -1 : 1})`
              }}
              draggable={false}
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Quick Toolbar (Flip, Zoom, Opacity) */}
          <div className="p-2 bg-[#0A0A0D]/95 border-t border-zinc-800/90 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                  isFlipped ? 'bg-amber-950/60 border-amber-800 text-amber-300' : 'bg-[#18181F] border-zinc-800 text-zinc-300 hover:bg-[#22222B]'
                }`}
                title="Mirror / Flip Horizontally (Check anatomy balance)"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
                className="p-1.5 rounded-lg bg-[#18181F] border border-zinc-800 text-zinc-300 hover:text-white hover:bg-[#22222B]"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono text-[10px] text-zinc-400 w-8 text-center">
                {Math.round(zoom * 100)}%
              </span>

              <button
                onClick={() => setZoom(prev => Math.min(3.0, prev + 0.2))}
                className="p-1.5 rounded-lg bg-[#18181F] border border-zinc-800 text-zinc-300 hover:text-white hover:bg-[#22222B]"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Opacity slider */}
            <div className="flex items-center gap-1.5">
              <Sun className="w-3 h-3 text-zinc-500" />
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-14 accent-amber-500 cursor-pointer"
                title="Reference Opacity"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
