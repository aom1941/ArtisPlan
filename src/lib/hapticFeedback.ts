/**
 * Haptic & Audio Feedback Engine for Infinite Canvas Snapping
 * Provides physical vibration (navigator.vibrate) and synthesized zero-dependency
 * psychoacoustic micro-ticks for tactile magnetic snap-to-guide feedback.
 */

class HapticFeedbackManager {
  private audioCtx: AudioContext | null = null;
  private lastTriggerTime = 0;
  private lastGuideKey = '';

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        try {
          this.audioCtx = new AudioCtxClass();
        } catch {
          this.audioCtx = null;
        }
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Triggers tactile & audio feedback when an object locks onto a smart guide line.
   */
  public triggerSnapHaptic(
    guideKey: string,
    options: {
      intensity?: 'light' | 'medium' | 'strong';
      enableAudio?: boolean;
      enableVibration?: boolean;
    } = {}
  ) {
    const now = performance.now();
    const enableAudio = options.enableAudio ?? true;
    const enableVibration = options.enableVibration ?? true;
    const intensity = options.intensity ?? 'medium';

    // Throttle duplicate snaps to prevent audio buzz
    if (guideKey === this.lastGuideKey && now - this.lastTriggerTime < 80) {
      return;
    }
    this.lastTriggerTime = now;
    this.lastGuideKey = guideKey;

    // 1. Hardware Device Vibration (Touch/Mobile/Stylus/Trackpad)
    if (enableVibration && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        const vibrationPattern = 
          intensity === 'strong' ? [12, 8, 12] :
          intensity === 'medium' ? [10] : [6];
        navigator.vibrate(vibrationPattern);
      } catch {
        // Safe ignore if vibration permission is restricted
      }
    }

    // 2. Synthesized Psychoacoustic Micro-Tick
    if (enableAudio) {
      this.playAcousticTick(intensity);
    }
  }

  private playAcousticTick(intensity: 'light' | 'medium' | 'strong') {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      const baseFreq = intensity === 'strong' ? 1050 : intensity === 'medium' ? 880 : 720;
      const gainLevel = intensity === 'strong' ? 0.045 : intensity === 'medium' ? 0.03 : 0.018;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, ctx.currentTime + 0.02);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      filter.Q.setValueAtTime(3.0, ctx.currentTime);

      gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.022);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.025);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Resets active snap tracking state on drag end
   */
  public reset() {
    this.lastGuideKey = '';
    this.lastTriggerTime = 0;
  }
}

export const hapticEngine = new HapticFeedbackManager();
