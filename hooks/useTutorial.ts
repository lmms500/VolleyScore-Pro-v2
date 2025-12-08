import { useState, useEffect, useCallback } from 'react';
import { getPreferencesService } from '../services/PreferencesService';

const TUTORIAL_KEY = 'vs_pro_tutorial_seen_v2';
const REMINDER_INTERVAL = 5 * 60 * 1000; // 5 Minutes

export const useTutorial = (isStandalone: boolean) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    // Check if tutorial has been seen
    const initializeTutorial = async () => {
      const prefs = getPreferencesService();
      const seen = await prefs.get<boolean>(TUTORIAL_KEY);
      if (!seen) {
        // Small delay to ensure app is loaded visually
        setTimeout(() => setShowTutorial(true), 1000);
      }
    };
    
    initializeTutorial();
  }, []);

  useEffect(() => {
    // Periodic Reminder Logic
    if (isStandalone) return; // Don't remind if already installed

    const interval = setInterval(async () => {
      const prefs = getPreferencesService();
      const seen = await prefs.get<boolean>(TUTORIAL_KEY);
      // Only show if tutorial has been seen
      if (!seen) return;
      
      setShowReminder(prev => {
        if (!prev) return true; // Show if not showing
        return prev;
      });
    }, REMINDER_INTERVAL);

    return () => clearInterval(interval);
  }, [isStandalone]);

  const completeTutorial = useCallback(async () => {
    const prefs = getPreferencesService();
    await prefs.set(TUTORIAL_KEY, true);
    setShowTutorial(false);
  }, []);

  const dismissReminder = useCallback(() => {
    setShowReminder(false);
  }, []);

  return {
    showTutorial,
    completeTutorial,
    showReminder,
    dismissReminder
  };
};