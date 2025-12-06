
import { useCallback, useRef } from 'react';

/**
 * Advanced VolleyScore Pro Sound Engine
 * Generates procedural, immersive audio effects using Web Audio API.
 * 
 * Features:
 * - FM Synthesis for Whistles
 * - Subtractive Synthesis for Impacts
 * - Polyphonic Chords for Victory
 * - Noise generators for ambient tension
 */
export const useGameAudio = ({ enableSound }: { enableSound: boolean }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const getContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
          audioCtxRef.current = new Ctx();
          // Master Compressor/Limiter
          const compressor = audioCtxRef.current.createDynamicsCompressor();
          compressor.threshold.value = -10;
          compressor.knee.value = 40;
          compressor.ratio.value = 12;
          compressor.attack.value = 0;
          compressor.release.value = 0.25;
          compressor.connect(audioCtxRef.current.destination);

          masterGainRef.current = audioCtxRef.current.createGain();
          masterGainRef.current.gain.value = 0.8; // Global Volume
          masterGainRef.current.connect(compressor);
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // --- SOUND GENERATORS ---

  // 1. UI Click (Clean, Glassy)
  const playTap = useCallback(() => {
    if (!enableSound) return;
    const ctx = getContext();
    if (!ctx || !masterGainRef.current) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);

    filter.type = 'highpass';
    filter.frequency.value = 500;

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainRef.current);

    osc.start(t);
    osc.stop(t + 0.06);
  }, [enableSound, getContext]);

  // 2. Point Score (Impact + Success Tone)
  const playScore = useCallback(() => {
    if (!enableSound) return;
    const ctx = getContext();
    if (!ctx || !masterGainRef.current) return;

    const t = ctx.currentTime;

    // A. The "Thud" (Ball Impact)
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.frequency.setValueAtTime(150, t);
    thudOsc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    thudGain.gain.setValueAtTime(0.4, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    
    // B. The "Ping" (Success)
    const pingOsc = ctx.createOscillator();
    const pingGain = ctx.createGain();
    pingOsc.type = 'triangle';
    pingOsc.frequency.setValueAtTime(880, t); // A5
    pingGain.gain.setValueAtTime(0.1, t);
    pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    thudOsc.connect(thudGain);
    pingOsc.connect(pingGain);
    thudGain.connect(masterGainRef.current);
    pingGain.connect(masterGainRef.current);

    thudOsc.start(t);
    pingOsc.start(t);
    thudOsc.stop(t + 0.2);
    pingOsc.stop(t + 0.3);
  }, [enableSound, getContext]);

  // 3. Undo / Subtract (Updated: Clearer, higher pitch for mobile)
  const playUndo = useCallback(() => {
    if (!enableSound) return;
    const ctx = getContext();
    if (!ctx || !masterGainRef.current) return;

    const t = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.15);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(masterGainRef.current);

    osc.start(t);
    osc.stop(t + 0.2);
  }, [enableSound, getContext]);

  // 4. Whistle (FM Synthesis for realism)
  const playWhistle = useCallback(() => {
    if (!enableSound) return;
    const ctx = getContext();
    if (!ctx || !masterGainRef.current) return;

    const t = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();

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
    gain.connect(masterGainRef.current);

    mod.start(t);
    osc.start(t);
    mod.stop(t + 0.5);
    osc.stop(t + 0.5);
  }, [enableSound, getContext]);

  // 5. Set Point Alert (Warning Bell)
  const playSetPointAlert = useCallback(() => {
    if (!enableSound) return;
    const ctx = getContext();
    if (!ctx || !masterGainRef.current) return;

    const t = ctx.currentTime;
    
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const gain = ctx.createGain();
    const modGain = ctx.createGain();

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
    gain.connect(masterGainRef.current);

    carrier.start(t);
    modulator.start(t);
    carrier.stop(t + 1.0);
    modulator.stop(t + 1.0);
  }, [enableSound, getContext]);

  // 6. Match Point Alert (Intense Pulse)
  const playMatchPointAlert = useCallback(() => {
    if (!enableSound) return;
    const ctx = getContext();
    if (!ctx || !masterGainRef.current) return;

    const t = ctx.currentTime;
    
    const times = [t, t + 0.2];
    
    times.forEach(start => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, start); // A4
        osc.frequency.linearRampToValueAtTime(450, start + 0.15); 

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGainRef.current!);
        
        osc.start(start);
        osc.stop(start + 0.2);
    });
  }, [enableSound, getContext]);

  // 7. Set Win (Ascending Chord)
  const playSetWin = useCallback(() => {
    if (!enableSound) return;
    const ctx = getContext();
    if (!ctx || !masterGainRef.current) return;

    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = t + (i * 0.08);

        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

        osc.connect(gain);
        gain.connect(masterGainRef.current!);
        osc.start(start);
        osc.stop(start + 0.7);
    });
  }, [enableSound, getContext]);

  // 8. Match Win (Grand Fanfare)
  const playMatchWin = useCallback(() => {
    if (!enableSound) return;
    const ctx = getContext();
    if (!ctx || !masterGainRef.current) return;

    const t = ctx.currentTime;
    
    const chord1 = [392.00, 523.25, 783.99]; // G Major
    const chord2 = [523.25, 659.25, 783.99, 1046.50]; // C Major with high C

    chord1.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(masterGainRef.current!);
        osc.start(t);
        osc.stop(t + 0.3);
    });

    chord2.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = t + 0.35 + (i * 0.02);
        
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 3.0);

        osc.connect(gain);
        gain.connect(masterGainRef.current!);
        osc.start(start);
        osc.stop(start + 3.0);
    });
  }, [enableSound, getContext]);

  return {
    playTap,
    playScore,
    playUndo,
    playWhistle,
    playSetPointAlert,
    playMatchPointAlert,
    playSetWin,
    playMatchWin
  };
};
