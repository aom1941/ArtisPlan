import React from 'react';
import type { SmartGuideLine } from '../../lib/smartGuidesEngine';

interface SmartGuidesVisualOverlayProps {
  guides: SmartGuideLine[];
  zoom: number;
  pan: { x: number; y: number };
}

export const SmartGuidesVisualOverlay: React.FC<SmartGuidesVisualOverlayProps> = ({
  guides,
  zoom
}) => {
  if (guides.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-visible select-none">
      <svg 
        className="w-full h-full overflow-visible"
        style={{
          filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.45))'
        }}
      >
        <defs>
          {/* Laser Glow Filter */}
          <filter id="guide-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={3 / zoom} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Marker endpoints for dimension gaps */}
          <marker
            id="smart-guide-arrow-start"
            viewBox="0 0 6 6"
            refX="3"
            refY="3"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M 5 1 L 1 3 L 5 5 Z" fill="#10B981" />
          </marker>
          <marker
            id="smart-guide-arrow-end"
            viewBox="0 0 6 6"
            refX="3"
            refY="3"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M 1 1 L 5 3 L 1 5 Z" fill="#10B981" />
          </marker>
        </defs>

        {/* 1. Snapped Object Magnetic Bounding Aura */}
        {guides.map((guide, idx) => {
          if (idx > 0 || !guide.movingBounds) return null; // Draw once per snap session
          const mb = guide.movingBounds;
          const isCenter = guide.snapType.includes('center') || guide.snapType === 'origin-axis';
          const strokeColor = isCenter ? '#F43F5E' : '#06B6D4';

          return (
            <g key="moving-magnetic-aura" className="transition-all duration-75">
              {/* Outer magnetic glow halo */}
              <rect
                x={mb.x - 2 / zoom}
                y={mb.y - 2 / zoom}
                width={mb.width + 4 / zoom}
                height={mb.height + 4 / zoom}
                rx={6 / zoom}
                fill="none"
                stroke={strokeColor}
                strokeWidth={3 / zoom}
                strokeOpacity={0.25}
                strokeDasharray={`${6 / zoom},${4 / zoom}`}
              />
              {/* Crisp magnetic lock border */}
              <rect
                x={mb.x}
                y={mb.y}
                width={mb.width}
                height={mb.height}
                rx={4 / zoom}
                fill={strokeColor}
                fillOpacity={0.03}
                stroke={strokeColor}
                strokeWidth={1.5 / zoom}
                strokeDasharray={`${8 / zoom},${4 / zoom}`}
              />
            </g>
          );
        })}

        {/* 2. Target Object Magnetic Reticle Frame (if targetBounds is available) */}
        {guides.map((guide) => {
          if (!guide.targetBounds) return null;
          const tb = guide.targetBounds;
          const isCenter = guide.snapType.includes('center') || guide.snapType === 'origin-axis';
          const strokeColor = isCenter ? '#F43F5E' : '#06B6D4';

          return (
            <g key={`target-frame-${guide.id}`} className="transition-opacity duration-150">
              <rect
                x={tb.x}
                y={tb.y}
                width={tb.width}
                height={tb.height}
                rx={4 / zoom}
                fill="none"
                stroke={strokeColor}
                strokeWidth={1 / zoom}
                strokeOpacity={0.4}
                strokeDasharray={`${4 / zoom},${3 / zoom}`}
              />
            </g>
          );
        })}

        {/* 3. Main Smart Guide Laser Lines */}
        {guides.map((guide) => {
          const isCenter = guide.snapType.includes('center') || guide.snapType === 'origin-axis';
          const isGap = guide.snapType === 'equal-gap';
          const isDimension = guide.snapType === 'dimension-match';
          const isManual = guide.snapType === 'manual-guide';

          const strokeColor = guide.color 
            ? guide.color 
            : isGap || isDimension
            ? '#10B981' // Emerald Green
            : isCenter
            ? '#F43F5E' // Bright Rose / Neon Magenta
            : isManual
            ? '#8B5CF6' // Purple / Violet
            : '#06B6D4'; // Electric Cyan

          const strokeWidth = 1.5 / zoom;
          const dashArray = isCenter 
            ? `${6 / zoom},${3 / zoom}` 
            : isGap 
            ? `${4 / zoom},${2 / zoom}` 
            : isManual
            ? `${8 / zoom},${4 / zoom}`
            : undefined;

          // Equal Gap Multi-Interval Renderer
          if (isGap && guide.gapIntervals && guide.gapIntervals.length > 0) {
            return (
              <g key={guide.id}>
                {guide.gapIntervals.map((interval, i) => {
                  if (guide.orientation === 'horizontal') {
                    return (
                      <g key={`${guide.id}-interval-${i}`}>
                        {/* Gap Dimension Bracket Line */}
                        <line
                          x1={interval.start}
                          y1={interval.coord}
                          x2={interval.end}
                          y2={interval.coord}
                          stroke="#10B981"
                          strokeWidth={1.5 / zoom}
                          markerStart="url(#smart-guide-arrow-start)"
                          markerEnd="url(#smart-guide-arrow-end)"
                        />
                        {/* Ticks */}
                        <line
                          x1={interval.start}
                          y1={interval.coord - 5 / zoom}
                          x2={interval.start}
                          y2={interval.coord + 5 / zoom}
                          stroke="#10B981"
                          strokeWidth={1.75 / zoom}
                        />
                        <line
                          x1={interval.end}
                          y1={interval.coord - 5 / zoom}
                          x2={interval.end}
                          y2={interval.coord + 5 / zoom}
                          stroke="#10B981"
                          strokeWidth={1.75 / zoom}
                        />
                      </g>
                    );
                  } else {
                    return (
                      <g key={`${guide.id}-interval-${i}`}>
                        <line
                          x1={interval.coord}
                          y1={interval.start}
                          x2={interval.coord}
                          y2={interval.end}
                          stroke="#10B981"
                          strokeWidth={1.5 / zoom}
                          markerStart="url(#smart-guide-arrow-start)"
                          markerEnd="url(#smart-guide-arrow-end)"
                        />
                        {/* Ticks */}
                        <line
                          x1={interval.coord - 5 / zoom}
                          y1={interval.start}
                          x2={interval.coord + 5 / zoom}
                          y2={interval.start}
                          stroke="#10B981"
                          strokeWidth={1.75 / zoom}
                        />
                        <line
                          x1={interval.coord - 5 / zoom}
                          y1={interval.end}
                          x2={interval.coord + 5 / zoom}
                          y2={interval.end}
                          stroke="#10B981"
                          strokeWidth={1.75 / zoom}
                        />
                      </g>
                    );
                  }
                })}
              </g>
            );
          }

          // Standard Vertical Guide Line
          if (guide.orientation === 'vertical') {
            const x = guide.coord;
            const y1 = guide.start;
            const y2 = guide.end;
            const tickSize = 6 / zoom;

            return (
              <g key={guide.id}>
                {/* Glowing Background Laser Halo */}
                <line
                  x1={x}
                  y1={y1}
                  x2={x}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth={5 / zoom}
                  strokeOpacity={0.3}
                  strokeLinecap="round"
                  filter="url(#guide-glow)"
                />
                {/* Core Alignment Guide Line */}
                <line
                  x1={x}
                  y1={y1}
                  x2={x}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                  strokeLinecap="round"
                />
                {/* Endpoint Crosshair Brackets */}
                <line
                  x1={x - tickSize}
                  y1={y1}
                  x2={x + tickSize}
                  y2={y1}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth * 1.5}
                />
                <line
                  x1={x - tickSize}
                  y1={y2}
                  x2={x + tickSize}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth * 1.5}
                />

                {/* 4. Anchor Points Tactile Reticles & Shockwave Ripples */}
                {guide.anchorPoints?.map((pt, pIdx) => {
                  const isMoving = pt.type.startsWith('moving');
                  const rSize = (isMoving ? 4.5 : 3.5) / zoom;

                  return (
                    <g key={`anchor-v-${guide.id}-${pIdx}`}>
                      {/* Tactile Magnetic Shockwave Pulse Ring */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={12 / zoom}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={1.5 / zoom}
                        strokeOpacity={0.4}
                        strokeDasharray={`${3 / zoom},${2 / zoom}`}
                      />
                      {/* Magnetic Diamond Reticle */}
                      <polygon
                        points={`
                          ${pt.x},${pt.y - rSize}
                          ${pt.x + rSize},${pt.y}
                          ${pt.x},${pt.y + rSize}
                          ${pt.x - rSize},${pt.y}
                        `}
                        fill={isMoving ? strokeColor : '#0B0F17'}
                        stroke={strokeColor}
                        strokeWidth={1.5 / zoom}
                      />
                      {/* Center Pin Dot */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={1.2 / zoom}
                        fill={isMoving ? '#000' : strokeColor}
                      />
                    </g>
                  );
                })}
              </g>
            );
          } else {
            // Standard Horizontal Guide Line
            const y = guide.coord;
            const x1 = guide.start;
            const x2 = guide.end;
            const tickSize = 6 / zoom;

            return (
              <g key={guide.id}>
                {/* Glowing Background Laser Halo */}
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke={strokeColor}
                  strokeWidth={5 / zoom}
                  strokeOpacity={0.3}
                  strokeLinecap="round"
                  filter="url(#guide-glow)"
                />
                {/* Core Alignment Guide Line */}
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                  strokeLinecap="round"
                />
                {/* Endpoint Crosshair Brackets */}
                <line
                  x1={x1}
                  y1={y - tickSize}
                  x2={x1}
                  y2={y + tickSize}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth * 1.5}
                />
                <line
                  x1={x2}
                  y1={y - tickSize}
                  x2={x2}
                  y2={y + tickSize}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth * 1.5}
                />

                {/* Anchor Points Tactile Reticles & Shockwave Ripples */}
                {guide.anchorPoints?.map((pt, pIdx) => {
                  const isMoving = pt.type.startsWith('moving');
                  const rSize = (isMoving ? 4.5 : 3.5) / zoom;

                  return (
                    <g key={`anchor-h-${guide.id}-${pIdx}`}>
                      {/* Tactile Magnetic Shockwave Pulse Ring */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={12 / zoom}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={1.5 / zoom}
                        strokeOpacity={0.4}
                        strokeDasharray={`${3 / zoom},${2 / zoom}`}
                      />
                      {/* Magnetic Diamond Reticle */}
                      <polygon
                        points={`
                          ${pt.x},${pt.y - rSize}
                          ${pt.x + rSize},${pt.y}
                          ${pt.x},${pt.y + rSize}
                          ${pt.x - rSize},${pt.y}
                        `}
                        fill={isMoving ? strokeColor : '#0B0F17'}
                        stroke={strokeColor}
                        strokeWidth={1.5 / zoom}
                      />
                      {/* Center Pin Dot */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={1.2 / zoom}
                        fill={isMoving ? '#000' : strokeColor}
                      />
                    </g>
                  );
                })}
              </g>
            );
          }
        })}
      </svg>

      {/* Floating Precision Haptic Snapping Information Badges */}
      {guides.map((guide) => {
        if (!guide.label) return null;

        const isCenter = guide.snapType.includes('center') || guide.snapType === 'origin-axis';
        const isGap = guide.snapType === 'equal-gap';

        let badgeX = 0;
        let badgeY = 0;

        if (guide.orientation === 'vertical') {
          badgeX = guide.coord;
          badgeY = (guide.start + guide.end) / 2;
        } else {
          badgeX = (guide.start + guide.end) / 2;
          badgeY = guide.coord;
        }

        const badgeBg = guide.color
          ? 'bg-zinc-950/95 border-zinc-700/80 text-zinc-100 shadow-2xl'
          : isGap
          ? 'bg-emerald-950/95 border-emerald-500/90 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
          : isCenter
          ? 'bg-rose-950/95 border-rose-500/90 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
          : 'bg-cyan-950/95 border-cyan-500/90 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]';

        const dotColor = guide.color || (isGap ? '#10B981' : isCenter ? '#F43F5E' : '#06B6D4');

        const scale = 1 / zoom;

        return (
          <div
            key={`badge-${guide.id}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75"
            style={{
              left: `${badgeX}px`,
              top: `${badgeY}px`,
              transform: `translate(-50%, -50%) scale(${Math.max(0.75, Math.min(1.2, scale))})`
            }}
          >
            <div 
              className={`px-2.5 py-1 rounded-full border shadow-2xl backdrop-blur-xl font-mono text-[10.5px] font-bold flex items-center gap-1.5 whitespace-nowrap select-none ${badgeBg}`}
              style={guide.color ? { borderColor: `${guide.color}80` } : undefined}
            >
              {/* Dynamic Haptic Magnet Pulse Indicator */}
              <div className="relative flex items-center justify-center">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: dotColor }}
                />
                <div 
                  className="absolute -inset-1 rounded-full animate-ping opacity-75" 
                  style={{ backgroundColor: dotColor }}
                />
              </div>
              <span className="tracking-tight">{guide.label}</span>
              {guide.subLabel && (
                <span className="opacity-80 font-medium text-[9.5px]">[{guide.subLabel}]</span>
              )}
              {guide.isLocked && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-white/90 uppercase tracking-widest font-semibold ml-0.5">
                  Locked
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
