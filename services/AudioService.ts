/**
 * VolleyScore Pro - Native Audio Service
 * 
 * Provides unified audio playback interface for VolleyScore Pro.
 * 
 * ARCHITECTURE:
 * - Primary: Native audio playback via Capacitor (if available)
 * - Fallback: Web Audio API for browser/web environments
 * - Low-latency: Optimized for real-time game feedback
 * 
 * NATIVE PLATFORMS SUPPORTED:
 * - Android 5.0+ (API 21+)
 * - iOS 12.0+
 */

import { Capacitor } from '@capacitor/core';

// Audio IDs for native caching (Android/iOS resource IDs)
export enum AudioAssetId {
  TAP = 'tap_sound',
  POINT = 'point_sound',
  SET_WIN = 'set_win_sound',
  MATCH_WIN = 'match_win_sound',
  TIMEOUT = 'timeout_sound',
  ERROR = 'error_sound',
  WHISTLE = 'whistle_sound',
  SERVE = 'serve_sound',
}

/**
 * Native Audio Service Interface
 * Abstracts platform-specific audio playback
 */
export interface IAudioService {
  isAvailable: boolean;
  isNative: boolean;
  playSound(soundId: string, volumeMultiplier?: number): Promise<void>;
  resumePlayback(): Promise<void>;
  setMasterVolume(volume: number): void;
  cleanup(): void;
}

/**
 * Web Audio API Implementation (Fallback)
 */
class WebAudioService implements IAudioService {
  isAvailable = false;
  isNative = false;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private synthesizers: Map<string, () => void> = new Map();

  constructor() {
    this.initializeContext();
    this.registerSynthesizers();
  }

  private initializeContext() {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;

      this.audioContext = new Ctx();
      
      // Master compressor/limiter
      const compressor = this.audioContext.createDynamicsCompressor();
      compressor.threshold.value = -10;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;
      compressor.connect(this.audioContext.destination);

      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(compressor);
      
      this.isAvailable = true;
    } catch (err) {
      console.warn('[WebAudio] Initialization failed:', err);
    }
  }

  private registerSynthesizers() {
    // Tap sound (glassy click)
    this.synthesizers.set(AudioAssetId.TAP, () => {
      if (!this.audioContext || !this.masterGain) return;
      const t = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);

      filter.type = 'highpass';
      filter.frequency.value = 500;

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.05);
    });

    // Point sound (satisfying bell)
    this.synthesizers.set(AudioAssetId.POINT, () => {
      if (!this.audioContext || !this.masterGain) return;
      const t = this.audioContext.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

      notes.forEach((freq, idx) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t + idx * 0.05);
        osc.stop(t + 0.3);
      });
    });

    // Set win (triumphant arpeggio)
    this.synthesizers.set(AudioAssetId.SET_WIN, () => {
      if (!this.audioContext || !this.masterGain) return;
      const t = this.audioContext.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      notes.forEach((freq, i) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        const start = t + (i * 0.08);

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(start);
        osc.stop(start + 0.7);
      });
    });

    // Match win (grand fanfare)
    this.synthesizers.set(AudioAssetId.MATCH_WIN, () => {
      if (!this.audioContext || !this.masterGain) return;
      const t = this.audioContext.currentTime;

      // Power Chord Fanfare - G Major followed by C Major
      const chord1 = [392.00, 523.25, 783.99]; // G Major
      const chord2 = [523.25, 659.25, 783.99, 1046.50]; // C Major with high C

      // Play Chord 1
      chord1.forEach((freq) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.3);
      });

      // Play Chord 2 slightly later with strum effect
      chord2.forEach((freq, i) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        const start = t + 0.35 + (i * 0.02);

        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 3.0);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(start);
        osc.stop(start + 3.0);
      });
    });

    // Timeout whistle (FM synthesis for realism)
    this.synthesizers.set(AudioAssetId.TIMEOUT, () => {
      if (!this.audioContext || !this.masterGain) return;
      const t = this.audioContext.currentTime;

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const mod = this.audioContext.createOscillator();
      const modGain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2500, t);
      osc.frequency.linearRampToValueAtTime(1500, t + 0.3);

      mod.frequency.value = 50; // Trill speed
      modGain.gain.value = 600; // Trill depth

      mod.connect(modGain);
      modGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      mod.start(t);
      osc.start(t);
      mod.stop(t + 0.5);
      osc.stop(t + 0.5);
    });

    // Error/warning sound (stacked low tones)
    this.synthesizers.set(AudioAssetId.ERROR, () => {
      if (!this.audioContext || !this.masterGain) return;
      const t = this.audioContext.currentTime;

      // Sub-bass impact + dissonance tension
      const subOsc = this.audioContext.createOscillator();
      const subGain = this.audioContext.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(150, t);
      subOsc.frequency.exponentialRampToValueAtTime(40, t + 1);

      subGain.gain.setValueAtTime(0.8, t);
      subGain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

      // Tension dissonance
      const osc1 = this.audioContext.createOscillator();
      const osc2 = this.audioContext.createOscillator();
      const tensionGain = this.audioContext.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(100, t);
      osc2.frequency.setValueAtTime(105, t); // Dissonant interval

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.linearRampToValueAtTime(100, t + 2);

      tensionGain.gain.setValueAtTime(0, t);
      tensionGain.gain.linearRampToValueAtTime(0.15, t + 0.1);
      tensionGain.gain.linearRampToValueAtTime(0, t + 3);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain!);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(tensionGain);
      tensionGain.connect(this.masterGain!);

      subOsc.start(t);
      osc1.start(t);
      osc2.start(t);

      subOsc.stop(t + 2);
      osc1.stop(t + 3);
      osc2.stop(t + 3);
    });

    // Whistle (high-pitched alert)
    this.synthesizers.set(AudioAssetId.WHISTLE, () => {
      if (!this.audioContext || !this.masterGain) return;
      const t = this.audioContext.currentTime;

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const mod = this.audioContext.createOscillator();
      const modGain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(3000, t); // Higher pitch for alertness
      mod.frequency.value = 60; // Slight vibrato
      modGain.gain.value = 200;

      mod.connect(modGain);
      modGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      mod.start(t);
      osc.start(t);
      mod.stop(t + 0.4);
      osc.stop(t + 0.4);
    });

    // Serve/bell alert (warning bell tone)
    this.synthesizers.set(AudioAssetId.SERVE, () => {
      if (!this.audioContext || !this.masterGain) return;
      const t = this.audioContext.currentTime;

      const carrier = this.audioContext.createOscillator();
      const modulator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const modGain = this.audioContext.createGain();

      carrier.frequency.setValueAtTime(660, t); // E5
      modulator.frequency.setValueAtTime(440, t); // Harmonic ratio
      modGain.gain.setValueAtTime(300, t);
      modGain.gain.exponentialRampToValueAtTime(10, t + 0.5);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(gain);
      gain.connect(this.masterGain!);

      carrier.start(t);
      modulator.start(t);
      carrier.stop(t + 1.0);
      modulator.stop(t + 1.0);
    });
  }

  async playSound(soundId: string, volumeMultiplier = 1.0): Promise<void> {
    if (!this.isAvailable) return;

    // Resume suspended context (iOS requirement)
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume().catch(() => {});
    }

    const synthesizer = this.synthesizers.get(soundId);
    if (synthesizer) {
      // Adjust master gain temporarily
      const originalGain = this.masterGain?.gain.value ?? 0.8;
      if (this.masterGain) {
        this.masterGain.gain.value = originalGain * volumeMultiplier;
      }

      synthesizer();

      // Restore gain
      if (this.masterGain) {
        this.masterGain.gain.value = originalGain;
      }
    }
  }

  async resumePlayback(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume().catch(err => {
        console.debug('[WebAudio] Resume failed (expected if no user gesture):', err);
      });
    }
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  cleanup(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
  }
}

/**
 * Stub for future native audio implementation
 * (Capacitor doesn't have native audio plugin in core, but community plugins exist)
 */
class NativeAudioService implements IAudioService {
  isAvailable = false;
  isNative = true;

  async playSound(soundId: string, volumeMultiplier?: number): Promise<void> {
    // TODO: Implement native audio playback via Capacitor plugin
    console.debug(`[NativeAudio] Would play: ${soundId}`);
  }

  async resumePlayback(): Promise<void> {
    // Native audio doesn't require resumption
  }

  setMasterVolume(volume: number): void {
    // TODO: Implement native volume control
  }

  cleanup(): void {
    // Cleanup handled by native layer
  }
}

/**
 * AudioService Singleton
 * Factory that returns appropriate implementation based on platform
 */
class AudioServiceFactory {
  private static instance: IAudioService | null = null;

  static getInstance(): IAudioService {
    if (!this.instance) {
      // Prefer native if available, fallback to Web Audio
      if (Capacitor.isNativePlatform()) {
        const nativeService = new NativeAudioService();
        // Only use native if future plugin is implemented
        if (nativeService.isAvailable) {
          this.instance = nativeService;
        } else {
          this.instance = new WebAudioService();
        }
      } else {
        this.instance = new WebAudioService();
      }
    }
    return this.instance;
  }

  static reset(): void {
    if (this.instance) {
      this.instance.cleanup();
      this.instance = null;
    }
  }
}

export const getAudioService = (): IAudioService => {
  return AudioServiceFactory.getInstance();
};

export const resetAudioService = (): void => {
  AudioServiceFactory.reset();
};

export default {
  getAudioService,
  resetAudioService,
  AudioAssetId,
};
