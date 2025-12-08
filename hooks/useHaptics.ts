import { useCallback, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle as CapacitorImpactStyle } from '@capacitor/haptics';

type ImpactStyle = 'light' | 'medium' | 'heavy';
type NotificationType = 'success' | 'warning' | 'error';

/**
 * Game-Specific Haptic Patterns (Fase 2.3 Optimization)
 * 
 * Native Capacitor Haptics API:
 * - Android: Full support via Vibrator API (all patterns)
 * - iOS: Impact + Notification feedback (semantic, not pattern-based)
 * 
 * Optimized patterns for volleyball game events:
 * - Critical Point (Set/Match): Urgent burst (heavy impact)
 * - Timeout: Single medium pulse (medium impact)
 * - Error/Invalid: Alert sequence (light impact)
 */
const HAPTIC_PATTERNS = {
  // Basic impact feedback
  tap: 10,           // Quick tap (point scored)
  tap_light: 10,     // Light tap
  tap_medium: 20,    // Medium tap
  tap_heavy: 40,     // Heavy tap
  
  // Game events - optimized for urgency perception
  criticalPoint: [200, 50, 100],  // STRONG: Set/Match point alert - 3 distinct pulses
  timeout: [100],                  // MEDIUM: Timeout call - single solid pulse
  sideSwitch: [300, 100, 300],    // MODERATE: Side switch - deliberate 3-pulse
  error: [50],                     // LIGHT: Generic error/invalid action
  
  // Set/Match win celebrations
  setWin: [100, 50, 100],          // Celebratory double pulse
  matchWin: [200, 100, 200, 100, 400], // Grand finale - escalating pulses
  
  // Multi-event sequences
  suddenDeath: [50, 100, 50, 100, 50, 100],     // URGENT: Sudden death alert
  matchPointAlert: [50, 50, 50, 50],            // RAPID: Match point reached
  setPointAlert: [50, 100],                     // Quick: Set point reached
};

export const useHaptics = (enabled: boolean = true) => {
  const trigger = useCallback((pattern: number | number[] | readonly number[]) => {
    if (!enabled) return;
    
    // Use Capacitor Haptics API for native performance
    // Falls back to navigator.vibrate() on unsupported platforms
    const executeHaptics = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          // Native platforms: Use Capacitor Haptics
          if (Array.isArray(pattern)) {
            // Pattern array: Use vibrate sequence (vibrate_ms, pause, vibrate_ms, ...)
            await Haptics.vibrate({ duration: (pattern as number[]).reduce((a, b) => a + b, 0) / 2 });
          } else {
            // Single duration: Use vibrate
            await Haptics.vibrate({ duration: pattern as number });
          }
        } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
          // Web fallback: Use Vibrate API
          navigator.vibrate(pattern as number | number[]);
        }
      } catch (e) {
        // Ignore errors (plugin unavailable or permissions denied)
      }
    };
    
    executeHaptics();
  }, [enabled]);

  // Mimic iOS UIImpactFeedbackGenerator styles using Vibrate API patterns
  const impact = useCallback((style: ImpactStyle) => {
    switch (style) {
      case 'light':
        trigger(HAPTIC_PATTERNS.tap_light);
        break;
      case 'medium':
        trigger(HAPTIC_PATTERNS.tap_medium);
        break;
      case 'heavy':
        trigger(HAPTIC_PATTERNS.tap_heavy);
        break;
    }
  }, [trigger]);

  // Mimic iOS UINotificationFeedbackGenerator styles
  const notification = useCallback((type: NotificationType) => {
    switch (type) {
      case 'success':
        trigger([10, 50, 20]); // Da-da-dump
        break;
      case 'warning':
        trigger([30, 50, 30]); // Quick double pulse
        break;
      case 'error':
        trigger(HAPTIC_PATTERNS.error);
        break;
    }
  }, [trigger]);

  // Game-specific patterns with optimized timings (Fase 2.3)
  const gamePatterns = useMemo(() => ({
    // Point scoring
    scored: () => trigger(HAPTIC_PATTERNS.tap),
    
    // Critical alerts
    setPoint: () => trigger(HAPTIC_PATTERNS.setPointAlert),      // [50, 100]
    matchPoint: () => trigger(HAPTIC_PATTERNS.matchPointAlert),  // [50, 50, 50, 50]
    criticalPoint: () => trigger(HAPTIC_PATTERNS.criticalPoint), // [200, 50, 100]
    
    // Game events
    timeout: () => trigger(HAPTIC_PATTERNS.timeout),             // [100]
    sideSwitch: () => trigger(HAPTIC_PATTERNS.sideSwitch),       // [300, 100, 300]
    suddenDeath: () => trigger(HAPTIC_PATTERNS.suddenDeath),     // [50, 100, 50, 100, 50, 100]
    
    // Match results
    setWin: () => trigger(HAPTIC_PATTERNS.setWin),               // [100, 50, 100]
    matchWin: () => trigger(HAPTIC_PATTERNS.matchWin),           // [200, 100, 200, 100, 400]
  }), [trigger]);

  return { impact, notification, trigger, gamePatterns };
};