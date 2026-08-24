import React, { useState } from 'react';
import { Keyboard, X, Sparkles, Command, Hand, Sliders } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
  onOpenGestureSettings?: () => void;
}

const DEFAULT_SHORTCUTS = [
  { action: 'Fine Inking Pen', key: 'B', category: 'Drawing Tools' },
  { action: 'Acrylic Texture Brush', key: 'N', category: 'Drawing Tools' },
  { action: 'Graphite Pencil', key: 'P', category: 'Drawing Tools' },
  { action: 'Highlighter / Glaze', key: 'Shift + H', category: 'Drawing Tools' },
  { action: 'Eraser', key: 'E', category: 'Drawing Tools' },
  { action: 'Select & Move Tool', key: 'V', category: 'Canvas Controls' },
  { action: 'Group Selected Objects', key: 'Ctrl / Cmd + G', category: 'Canvas Controls' },
  { action: 'Ungroup Elements', key: 'Ctrl / Cmd + Shift + G', category: 'Canvas Controls' },
  { action: 'Duplicate Selection / Group', key: 'Ctrl / Cmd + D', category: 'Canvas Controls' },
  { action: 'Select All Canvas Objects', key: 'Ctrl / Cmd + A', category: 'Canvas Controls' },
  { action: 'Align Objects (Left / Right / Top / Bottom)', key: 'Alt + Shift + Arrows', category: 'Canvas Controls' },
  { action: 'Align Center Horizontal / Vertical', key: 'Alt + Shift + H / V', category: 'Canvas Controls' },
  { action: 'Snap Objects to Canvas Center (0,0)', key: 'Alt + Shift + C', category: 'Canvas Controls' },
  { action: 'Search Canvas Objects', key: 'Ctrl / Cmd + F', category: 'Canvas Controls' },
  { action: 'Activity Heatmap & Density Analysis', key: 'Ctrl / Cmd + H', category: 'Canvas Controls' },
  { action: 'Pan Canvas', key: 'H or Space + Drag', category: 'Canvas Controls' },
  { action: 'Eyedropper Color Picker', key: 'I', category: 'Drawing Tools' },
  { action: 'Sticky Note', key: 'S', category: 'Annotation & Ideation' },
  { action: 'Text Label', key: 'T', category: 'Annotation & Ideation' },
  { action: 'Geometry / Shapes', key: 'U', category: 'Drawing Tools' },
  { action: 'Collaborative Pin', key: 'C', category: 'Annotation & Ideation' },
  { action: 'Undo Last Stroke', key: 'Ctrl / Cmd + Z', category: 'History & Versioning' },
  { action: 'Redo Stroke', key: 'Ctrl / Cmd + Y', category: 'History & Versioning' },
  { action: 'Open Time Machine (3D History)', key: 'Ctrl / Cmd + Shift + V', category: 'History & Versioning' },
  { action: 'Open Brush Studio Customizer', key: 'Ctrl / Cmd + Shift + B', category: 'Drawing Tools' },
  { action: 'Zoom In', key: '+ / Mousewheel Up', category: 'Navigation' },
  { action: 'Zoom Out', key: '- / Mousewheel Down', category: 'Navigation' },
  { action: 'Reset Zoom (100%)', key: '0', category: 'Navigation' },
  { action: 'Switch to Mood Board', key: 'M', category: 'Views' },
  { action: 'Switch to Timeline', key: 'L', category: 'Views' },
  { action: 'Switch to Gallery', key: 'G', category: 'Views' },
  { action: 'Toggle Stylus Palm Lock', key: 'Alt + S', category: 'Tablet & Stylus' }
];

const TOUCH_GESTURES = [
  { action: 'Undo Last Action', pattern: '2-Finger Single Tap', badge: '2 Fingers' },
  { action: 'Redo Action', pattern: '2-Finger Double Tap', badge: '2 Fingers' },
  { action: 'Open Touch Command Palette HUD', pattern: '3-Finger Single Tap', badge: '3 Fingers' },
  { action: 'Toggle Activity Heatmap', pattern: '3-Finger Double Tap', badge: '3 Fingers' },
  { action: 'Clear Active Layer (with safety)', pattern: '4-Finger Single Tap', badge: '4 Fingers' },
  { action: 'Save Time Machine Version Snapshot', pattern: '3-Finger Hold / Long Press', badge: '3 Fingers' },
  { action: 'Pinch to Zoom & Pan Canvas', pattern: '2-Finger Spread / Pinch', badge: '2 Fingers' }
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose, onOpenGestureSettings }) => {
  const [activeTab, setActiveTab] = useState<'keyboard' | 'touch'>('keyboard');
  const categories = Array.from(new Set(DEFAULT_SHORTCUTS.map(s => s.category)));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121216]/98 border border-zinc-800/90 rounded-3xl w-full max-w-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-[#0A0A0D]/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#18181F] text-cyan-400 border border-zinc-800 shadow-inner">
              {activeTab === 'keyboard' ? <Keyboard className="w-5 h-5" /> : <Hand className="w-5 h-5 text-violet-400" />}
            </div>
            <div>
              <h2 className="font-bold text-base text-white font-['Outfit']">Keyboard & Touch Gestures</h2>
              <p className="text-xs text-zinc-400">Master rapid shortcuts and multi-finger touch patterns</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1C1C24] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-zinc-800/80 bg-[#0A0A0D]">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('keyboard')}
              className={`pb-2.5 border-b-2 transition-all ${
                activeTab === 'keyboard' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Keyboard Shortcuts
            </button>
            <button
              onClick={() => setActiveTab('touch')}
              className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'touch' ? 'border-violet-500 text-violet-400 font-bold' : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              Multi-Finger Touch Gestures
            </button>
          </div>

          {onOpenGestureSettings && (
            <button
              onClick={() => {
                onClose();
                onOpenGestureSettings();
              }}
              className="text-xs text-violet-400 hover:underline flex items-center gap-1 pb-2.5"
            >
              <Sliders className="w-3 h-3" />
              Configure Gestures
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#0A0A0D] custom-scrollbar">
          {activeTab === 'keyboard' ? (
            categories.map((cat) => (
              <div key={cat} className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{cat}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEFAULT_SHORTCUTS.filter(s => s.category === cat).map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#121216]/90 border border-zinc-800/90 text-xs shadow-sm hover:border-zinc-700 transition-colors"
                    >
                      <span className="text-zinc-300 font-medium">{s.action}</span>
                      <kbd className="px-2 py-1 rounded-md bg-[#18181F] text-zinc-200 font-mono text-[11px] border border-zinc-700/80 shadow-sm font-semibold">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-violet-950/30 border border-violet-800/40 text-xs text-violet-200">
                <p className="font-semibold mb-1">Interactive Multi-Finger Touch Support</p>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Perform rapid actions on iPad, tablet, or touch display by tapping or holding directly on the canvas surface. Every pattern is fully customizable.
                </p>
              </div>

              <div className="space-y-2">
                {TOUCH_GESTURES.map((g, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#121216]/90 border border-zinc-800/90 text-xs hover:border-violet-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-lg bg-violet-950 text-violet-300 border border-violet-800 text-[10px] font-bold">
                        {g.badge}
                      </span>
                      <span className="text-zinc-200 font-medium">{g.action}</span>
                    </div>
                    <span className="font-mono text-zinc-400 text-[11px] bg-[#18181F] px-2.5 py-1 rounded-xl border border-zinc-800">
                      {g.pattern}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
