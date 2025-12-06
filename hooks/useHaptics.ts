
import { useCallback } from 'react';

type ImpactStyle = 'light' | 'medium' | 'heavy';
type NotificationType = 'success' | 'warning' | 'error';

export const useHaptics = (enabled: boolean = true) => {
  const trigger = useCallback((pattern: number | number[]) => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Fail silently on unsupported devices
    }
  }, [enabled]);

  // Mimic iOS UIImpactFeedbackGenerator
  const impact = useCallback((style: ImpactStyle) => {
    switch (style) {
      case 'light':
        trigger(10); // Crisp, subtle tick
        break;
      case 'medium':
        trigger(20); // Standard tap
        break;
      case 'heavy':
        trigger(40); // Solid thud
        break;
    }
  }, [trigger]);

  // Mimic iOS UINotificationFeedbackGenerator
  const notification = useCallback((type: NotificationType) => {
    switch (type) {
      case 'success':
        trigger([10, 50, 20]); // Da-da-dump
        break;
      case 'warning':
        trigger([30, 50, 10]); // Quick double pulse
        break;
      case 'error':
        trigger([50, 50, 50, 50, 50]); // Long buzz
        break;
    }
  }, [trigger]);

  return { impact, notification };
};
