import React, { useState, useEffect, useRef } from 'react';
import {
  Hand,
  Sliders,
  Sparkles,
  RotateCcw,
  Check,
  X,
  Flame,
  Trash2,
  Save,
  Undo2,
  Redo2,
  Maximize2,
  Paintbrush,
  Search,
  Layers,
  Vibrate,
  Info,
  Play,
  Eye
} from 'lucide-react';
import type { 
  TouchGestureSettings, 
  TouchGestureBinding, 
  TouchGestureId, 
  CanvasActionId,
  GestureLiveState 
} from '../../types/gestures';
import { 
  GESTURE_ACTIONS_CATALOG, 
  DEFAULT_TOUCH_SETTINGS, 
  loadTouchSettings, 
  saveTouchSettings,
  TouchGestureRecognizer
} from '../../lib/gestureEngine';
import { TouchGestureVisualOverlay } from './TouchGestureVisualOverlay';

interface TouchGestureModalProps {
  onClose: () => void;
  onSettingsChange?: (settings: TouchGestureSettings) => void;
  theme?: 'dark' | 'light' | 'oled';
}

export const TouchGestureModal: React.FC<TouchGestureModalProps> = ({
  onClose,
  onSettingsChange,
  theme = 'dark'
}) => {
  const [settings, setSettings] = useState<TouchGestureSettings>(() => loadTouchSettings());
  const [activeTab, setActiveTab] = useState<'bindings' | 'timing' | 'sandbox'>('bindings');
  const [testLog, setTestLog] = useState<{ id: string; text: string; actionId?: CanvasActionId; time: string }[]>([]);
  const [touchCount, setTouchCount] = useState<number>(0);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [sandboxLiveState, setSandboxLiveState] = useState<GestureLiveState | null>(null);

  // Test pad recognizer
  const sandboxRef = useRef<HTMLDivElement>(null);
  const testRecognizerRef = useRef<TouchGestureRecognizer | null>(null);

  useEffect(() => {
    testRecognizerRef.current = new TouchGestureRecognizer(
      settings, 
      (gestureId, focal) => {
        const binding = settings.bindings.find(b => b.gestureId === gestureId && b.enabled);
        const action = binding ? GESTURE_ACTIONS_CATALOG[binding.actionId] : null;
        
        const entry = {
          id: `log-${Date.now()}-${Math.random()}`,
          text: action ? `Recognized: ${binding?.gestureName} ➔ [${action.label}]` : `Recognized: ${gestureId} (Disabled)`,
          actionId: binding?.actionId,
          time: new Date().toLocaleTimeString()
        };
        setTestLog(prev => [entry, ...prev.slice(0, 7)]);
      },
      (liveState: GestureLiveState) => {
        setSandboxLiveState(liveState);
        setTouchCount(liveState.fingerCount);
      }
    );
  }, [settings]);

  const handleUpdateBindingAction = (gestureId: TouchGestureId, newActionId: CanvasActionId) => {
    setSettings(prev => {
      const updated: TouchGestureSettings = {
        ...prev,
        bindings: prev.bindings.map(b => b.gestureId === gestureId ? { ...b, actionId: newActionId } : b)
      };
      saveTouchSettings(updated);
      onSettingsChange?.(updated);
      return updated;
    });
    triggerSaveBanner();
  };

  const handleToggleBinding = (gestureId: TouchGestureId) => {
    setSettings(prev => {
      const updated: TouchGestureSettings = {
        ...prev,
        bindings: prev.bindings.map(b => b.gestureId === gestureId ? { ...b, enabled: !b.enabled } : b)
      };
      saveTouchSettings(updated);
      onSettingsChange?.(updated);
      return updated;
    });
    triggerSaveBanner();
  };

  const handleApplyPreset = (presetType: 'default' | 'power' | 'minimal') => {
    let newBindings: TouchGestureBinding[] = [...DEFAULT_TOUCH_SETTINGS.bindings];

    if (presetType === 'power') {
      newBindings = newBindings.map(b => {
        if (b.gestureId === 'two_finger_tap') return { ...b, actionId: 'undo' as CanvasActionId, enabled: true };
        if (b.gestureId === 'two_finger_double_tap') return { ...b, actionId: 'redo' as CanvasActionId, enabled: true };
        if (b.gestureId === 'three_finger_tap') return { ...b, actionId: 'open_command_palette' as CanvasActionId, enabled: true };
        if (b.gestureId === 'three_finger_double_tap') return { ...b, actionId: 'toggle_heatmap' as CanvasActionId, enabled: true };
        if (b.gestureId === 'four_finger_tap') return { ...b, actionId: 'clear_layer' as CanvasActionId, enabled: true };
        if (b.gestureId === 'three_finger_hold') return { ...b, actionId: 'save_version' as CanvasActionId, enabled: true };
        return b;
      });
    } else if (presetType === 'minimal') {
      newBindings = newBindings.map(b => {
        if (b.gestureId === 'two_finger_tap') return { ...b, actionId: 'undo' as CanvasActionId, enabled: true };
        if (b.gestureId === 'two_finger_double_tap') return { ...b, actionId: 'redo' as CanvasActionId, enabled: true };
        return { ...b, enabled: false };
      });
    }

    const updated: TouchGestureSettings = {
      ...settings,
      bindings: newBindings
    };
    setSettings(updated);
    saveTouchSettings(updated);
    onSettingsChange?.(updated);
    triggerSaveBanner();
  };

  const triggerSaveBanner = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Sandbox touch handlers
  const handleSandboxTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchCount(e.touches.length);
    testRecognizerRef.current?.handleTouchStart(e.nativeEvent);
  };

  const handleSandboxTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    testRecognizerRef.current?.handleTouchMove(e.nativeEvent);
  };

  const handleSandboxTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchCount(e.touches.length);
    testRecognizerRef.current?.handleTouchEnd(e.nativeEvent);
  };

  const handleSandboxTouchCancel = () => {
    setTouchCount(0);
    testRecognizerRef.current?.handleTouchCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      <div 
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          theme === 'light'
            ? 'bg-white border-zinc-200 text-zinc-900'
            : 'bg-[#121218] border-zinc-800 text-white'
        }`}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-rose-500 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <Hand className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Touch Gestures & Command Palette</h2>
                {savedSuccess && (
                  <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">Configure multi-finger canvas taps for Clear Layer, Heatmap, Snapshot & more</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 pt-3 border-b border-zinc-800 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('bindings')}
            className={`pb-2.5 border-b-2 transition-all ${
              activeTab === 'bindings'
                ? 'border-violet-500 text-violet-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Gesture Pattern Bindings
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sandbox'
                ? 'border-violet-500 text-violet-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-rose-400" />
            Live Touchpad Tester
          </button>
          <button
            onClick={() => setActiveTab('timing')}
            className={`pb-2.5 border-b-2 transition-all ${
              activeTab === 'timing'
                ? 'border-violet-500 text-violet-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Hardware & Sensitivity
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'bindings' && (
            <div className="space-y-4">
              {/* Presets Bar */}
              <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="font-semibold">Quick Style Presets:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyPreset('default')}
                    className="px-2.5 py-1 text-xs rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    Default Procreate
                  </button>
                  <button
                    onClick={() => handleApplyPreset('power')}
                    className="px-2.5 py-1 text-xs rounded-xl bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 border border-violet-800/50 transition-colors"
                  >
                    Full Power HUD
                  </button>
                  <button
                    onClick={() => handleApplyPreset('minimal')}
                    className="px-2.5 py-1 text-xs rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    Minimal (Undo/Redo)
                  </button>
                </div>
              </div>

              {/* Bindings List */}
              <div className="space-y-2.5">
                {settings.bindings.map((binding) => {
                  const currentAction = GESTURE_ACTIONS_CATALOG[binding.actionId];
                  return (
                    <div 
                      key={binding.gestureId}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        binding.enabled
                          ? 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                          : 'bg-zinc-950/40 border-zinc-900/60 opacity-60'
                      }`}
                    >
                      {/* Left: Gesture Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border ${
                          binding.fingerCount === 2
                            ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                            : binding.fingerCount === 3
                            ? 'bg-violet-950/60 text-violet-300 border-violet-800/60'
                            : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                        }`}>
                          {binding.fingerCount}F
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-zinc-200">{binding.gestureName}</h4>
                          <p className="text-[11px] text-zinc-400 truncate">{binding.description}</p>
                        </div>
                      </div>

                      {/* Right: Action Selector & Toggle */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <select
                          value={binding.actionId}
                          disabled={!binding.enabled}
                          onChange={(e) => handleUpdateBindingAction(binding.gestureId, e.target.value as CanvasActionId)}
                          className="bg-zinc-800/90 border border-zinc-700/80 text-zinc-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-violet-500 cursor-pointer disabled:opacity-50"
                        >
                          {Object.values(GESTURE_ACTIONS_CATALOG).map(act => (
                            <option key={act.id} value={act.id}>
                              {act.label} ({act.category})
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleToggleBinding(binding.gestureId)}
                          className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                            binding.enabled ? 'bg-violet-600' : 'bg-zinc-800'
                          }`}
                          title={binding.enabled ? 'Disable Gesture' : 'Enable Gesture'}
                        >
                          <div 
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              binding.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`} 
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'sandbox' && (
            <div className="space-y-4">
              <div className="p-3 bg-violet-950/30 border border-violet-800/40 rounded-2xl flex items-center gap-2.5 text-xs text-violet-200">
                <Info className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <span>
                  Tap, double-tap, or hold with <strong>2, 3, or 4 fingers</strong> on the test pad below to see gesture detection in real time!
                </span>
              </div>

              {/* Interactive Multi-Touch Sandbox Pad */}
              <div
                ref={sandboxRef}
                onTouchStart={handleSandboxTouchStart}
                onTouchMove={handleSandboxTouchMove}
                onTouchEnd={handleSandboxTouchEnd}
                onTouchCancel={handleSandboxTouchCancel}
                className="w-full h-56 rounded-3xl border-2 border-dashed border-zinc-700/80 bg-zinc-900/40 flex flex-col items-center justify-center text-center p-4 relative select-none touch-none active:bg-zinc-900/70 transition-colors overflow-hidden"
              >
                <TouchGestureVisualOverlay
                  liveState={sandboxLiveState}
                  settings={settings}
                  theme={theme === 'light' ? 'light' : 'dark'}
                />

                <Hand className="w-8 h-8 text-zinc-500 mb-2 animate-bounce" />
                <p className="text-sm font-bold text-zinc-200">Interactive Multi-Finger Test Surface</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Active fingers detected: <span className="text-violet-400 font-mono font-bold text-sm">{touchCount}</span>
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Touch with 2, 3, or 4 fingers to see real-time vector path tracing &amp; hold gauges!
                </p>
              </div>

              {/* Desktop / Quick Test Simulators */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                  <span className="font-semibold">Simulate Gestures (Desktop / Mouse Preview)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const rect = sandboxRef.current?.getBoundingClientRect();
                      const origin = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined;
                      testRecognizerRef.current?.simulateGesture('two_finger_tap', origin);
                    }}
                    className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left transition-all text-xs flex flex-col gap-1"
                  >
                    <span className="font-bold text-blue-400">2-Finger Tap</span>
                    <span className="text-[10px] text-zinc-400">Triggers Undo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const rect = sandboxRef.current?.getBoundingClientRect();
                      const origin = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined;
                      testRecognizerRef.current?.simulateGesture('two_finger_double_tap', origin);
                    }}
                    className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left transition-all text-xs flex flex-col gap-1"
                  >
                    <span className="font-bold text-cyan-400">2-Finger Double</span>
                    <span className="text-[10px] text-zinc-400">Triggers Redo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const rect = sandboxRef.current?.getBoundingClientRect();
                      const origin = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined;
                      testRecognizerRef.current?.simulateGesture('three_finger_tap', origin);
                    }}
                    className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left transition-all text-xs flex flex-col gap-1"
                  >
                    <span className="font-bold text-violet-400">3-Finger Tap</span>
                    <span className="text-[10px] text-zinc-400">Command HUD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const rect = sandboxRef.current?.getBoundingClientRect();
                      const origin = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined;
                      testRecognizerRef.current?.simulateGesture('three_finger_hold', origin);
                    }}
                    className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left transition-all text-xs flex flex-col gap-1"
                  >
                    <span className="font-bold text-emerald-400">3-Finger Hold</span>
                    <span className="text-[10px] text-zinc-400">Save Snapshot</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const rect = sandboxRef.current?.getBoundingClientRect();
                      const origin = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined;
                      testRecognizerRef.current?.simulateGesture('four_finger_tap', origin);
                    }}
                    className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left transition-all text-xs flex flex-col gap-1"
                  >
                    <span className="font-bold text-rose-400">4-Finger Tap</span>
                    <span className="text-[10px] text-zinc-400">Clear Layer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const rect = sandboxRef.current?.getBoundingClientRect();
                      const origin = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined;
                      testRecognizerRef.current?.simulateGesture('four_finger_swipe_down', origin);
                    }}
                    className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left transition-all text-xs flex flex-col gap-1"
                  >
                    <span className="font-bold text-pink-400">4-Finger Swipe</span>
                    <span className="text-[10px] text-zinc-400">Focus Mode</span>
                  </button>
                </div>
              </div>

              {/* Real-time Recognition Log */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                  <span className="font-semibold">Live Recognition Feed</span>
                  <button onClick={() => setTestLog([])} className="text-[11px] text-zinc-500 hover:text-zinc-300">Clear</button>
                </div>
                <div className="bg-zinc-950/60 rounded-2xl border border-zinc-800/80 p-3 min-h-[90px] max-h-[120px] overflow-y-auto space-y-1 font-mono text-xs">
                  {testLog.length === 0 ? (
                    <p className="text-zinc-600 italic text-[11px]">Awaiting multi-finger tap pattern...</p>
                  ) : (
                    testLog.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between text-[11px] text-zinc-300 border-b border-zinc-900 pb-1">
                        <span className="text-emerald-400 font-semibold">{entry.text}</span>
                        <span className="text-zinc-500 text-[10px]">{entry.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timing' && (
            <div className="space-y-4">
              {/* Real-time Visual Path Overlay Toggle */}
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-violet-400" />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Real-Time Touch Path &amp; Gesture Overlay</h4>
                    <p className="text-[11px] text-zinc-400">Draw visual geometric connecting hulls, active touch paths, hold progress rings &amp; HUD</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...settings, showVisualFeedback: !settings.showVisualFeedback };
                    setSettings(updated);
                    saveTouchSettings(updated);
                    onSettingsChange?.(updated);
                  }}
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                    settings.showVisualFeedback ? 'bg-violet-600' : 'bg-zinc-800'
                  }`}
                >
                  <div 
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.showVisualFeedback ? 'translate-x-4' : 'translate-x-0'
                    }`} 
                  />
                </button>
              </div>
              {/* Tap Timeout */}
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Double-Tap Resolution Window</h4>
                    <p className="text-[11px] text-zinc-400">Time window allowed between 1st and 2nd tap</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-violet-400">{settings.tapTimeout}ms</span>
                </div>
                <input
                  type="range"
                  min="160"
                  max="450"
                  step="10"
                  value={settings.tapTimeout}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const updated = { ...settings, tapTimeout: val };
                    setSettings(updated);
                    saveTouchSettings(updated);
                  }}
                  className="w-full accent-violet-500 cursor-pointer"
                />
              </div>

              {/* Hold Duration */}
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Long Press / Hold Threshold</h4>
                    <p className="text-[11px] text-zinc-400">Duration required to trigger 3-Finger Hold (e.g. Save Version)</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-violet-400">{settings.holdDuration}ms</span>
                </div>
                <input
                  type="range"
                  min="350"
                  max="900"
                  step="25"
                  value={settings.holdDuration}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const updated = { ...settings, holdDuration: val };
                    setSettings(updated);
                    saveTouchSettings(updated);
                  }}
                  className="w-full accent-violet-500 cursor-pointer"
                />
              </div>

              {/* Haptic Feedback */}
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Vibrate className="w-5 h-5 text-violet-400" />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Haptic Vibration on Trigger</h4>
                    <p className="text-[11px] text-zinc-400">Short tactile vibration burst on gesture activation</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const updated = { ...settings, hapticFeedback: !settings.hapticFeedback };
                    setSettings(updated);
                    saveTouchSettings(updated);
                  }}
                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                    settings.hapticFeedback ? 'bg-violet-600' : 'bg-zinc-800'
                  }`}
                >
                  <div 
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.hapticFeedback ? 'translate-x-4' : 'translate-x-0'
                    }`} 
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/40">
          <button
            onClick={() => {
              const def = DEFAULT_TOUCH_SETTINGS;
              setSettings(def);
              saveTouchSettings(def);
              onSettingsChange?.(def);
              triggerSaveBanner();
            }}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors shadow-lg shadow-violet-900/40"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
