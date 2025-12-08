
import { useCallback, useEffect, useMemo } from 'react';
import { GameConfig } from '../types';
import { getAudioService, AudioAssetId } from '../services/AudioService';

/**
 * Game Audio Hook - Refactored to use AudioService
 * 
 * IMPROVEMENTS (Fase 2.1):
 * - Delegated to native-capable AudioService (future: Capacitor plugin)
 * - Fallback: Web Audio API for browser/iOS Safari
 * - Low-latency synthesis for real-time feedback
 * - Respects config.enableSound setting
 */
export const useGameAudio = (config: GameConfig) => {
  const audioService = useMemo(() => getAudioService(), []);

  // Unlock audio context on first user gesture (iOS requirement)
  useEffect(() => {
    const unlockAudio = async () => {
      await audioService.resumePlayback();
      // Remove listeners after first interaction
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };

    document.addEventListener('touchstart', unlockAudio, { passive: true });
    document.addEventListener('click', unlockAudio, { passive: true });

    return () => {
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };
  }, [audioService]);

  // --- SOUND PLAYBACK METHODS ---

  const playTap = useCallback(async () => {
    if (!config.enableSound) return;
    try {
      await audioService.playSound(AudioAssetId.TAP, 0.6);
    } catch (err) {
      console.debug('[GameAudio] playTap error:', err);
    }
  }, [config.enableSound, audioService]);

  const playScore = useCallback(async () => {
    if (!config.enableSound) return;
    try {
      await audioService.playSound(AudioAssetId.POINT, 1.0);
    } catch (err) {
      console.debug('[GameAudio] playScore error:', err);
    }
  }, [config.enableSound, audioService]);

  const playUndo = useCallback(async () => {
    if (!config.enableSound) return;
    try {
      await audioService.playSound(AudioAssetId.TAP, 0.4);
    } catch (err) {
      console.debug('[GameAudio] playUndo error:', err);
    }
  }, [config.enableSound, audioService]);

  const playWhistle = useCallback(async () => {
    if (!config.enableSound) return;
    try {
      await audioService.playSound(AudioAssetId.WHISTLE, 0.8);
    } catch (err) {
      console.debug('[GameAudio] playWhistle error:', err);
    }
  }, [config.enableSound, audioService]);

  const playSetPointAlert = useCallback(async () => {
    if (!config.enableSound) return;
    try {
      await audioService.playSound(AudioAssetId.SERVE, 1.0);
    } catch (err) {
      console.debug('[GameAudio] playSetPointAlert error:', err);
    }
  }, [config.enableSound, audioService]);

  const playMatchPointAlert = useCallback(async () => {
    if (!config.enableSound) return;
    try {
      await audioService.playSound(AudioAssetId.MATCH_WIN, 0.9);
    } catch (err) {
      console.debug('[GameAudio] playMatchPointAlert error:', err);
    }
  }, [config.enableSound, audioService]);

  const playSetWin = useCallback(async () => {
    if (!config.enableSound) return;
    try {
      await audioService.playSound(AudioAssetId.SET_WIN, 1.0);
    } catch (err) {
      console.debug('[GameAudio] playSetWin error:', err);
    }
  }, [config.enableSound, audioService]);

  const playMatchWin = useCallback(async () => {
    if (!config.enableSound) return;
    try {
      await audioService.playSound(AudioAssetId.MATCH_WIN, 1.2);
    } catch (err) {
      console.debug('[GameAudio] playMatchWin error:', err);
    }
  }, [config.enableSound, audioService]);

  const playSuddenDeath = useCallback(async () => {
    if (!config.enableSound) return;
    try {
      await audioService.playSound(AudioAssetId.ERROR, 1.0);
    } catch (err) {
      console.debug('[GameAudio] playSuddenDeath error:', err);
    }
  }, [config.enableSound, audioService]);

  return {
    playTap,
    playScore,
    playUndo,
    playWhistle,
    playSetPointAlert,
    playMatchPointAlert,
    playSetWin,
    playMatchWin,
    playSuddenDeath,
    // Utility: Expose service for advanced audio control if needed
    audioService,
  };
};
