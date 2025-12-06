
import { useCallback } from 'react';

type ImpactStyle = 'light' | 'medium' | 'heavy';
type NotificationType = 'success' | 'warning' | 'error';

export const useHaptics = (enabled: boolean = true) => {
  
  const trigger = useCallback((pattern: number | number[]) => {
    if (!enabled) return;
    
    // Robust execution: try/catch prevents crashes on unsupported devices/browsers
    // while allowing it to fire on Android/Chrome where `vibrate` exists.
    try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    } catch (e) {
        // Ignore errors (e.g. if blocked by user settings)
    }
  }, [enabled]);

  // Mimic iOS UIImpactFeedbackGenerator styles using Vibrate API patterns
  const impact = useCallback((style: ImpactStyle) => {
    switch (style) {
      case 'light':
        trigger(10); // Crisp, extremely short tick
        break;
      case 'medium':
        trigger(20); // Standard tap
        break;
      case 'heavy':
        trigger(40); // Solid thud
        break;
    }
  }, [trigger]);

  // Mimic iOS UINotificationFeedbackGenerator styles
  const notification = useCallback((type: NotificationType) => {
    switch (type) {
      case 'success':
        trigger([10, 50, 20]); // Da-da-dump (Short-Pause-Short)
        break;
      case 'warning':
        trigger([30, 50, 30]); // Quick double pulse
        break;
      case 'error':
        trigger([50, 100, 50, 100, 50]); // Long buzz series
        break;
    }
  }, [trigger]);

  return { impact, notification, trigger };
};
