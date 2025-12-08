import { useCallback, useEffect } from 'react';
import { GameConfig, TeamId } from '../types';

interface VoiceControlProps {
  config: GameConfig;
  onAddPoint: (team: TeamId) => void;
  onUndo: () => void;
}

// Voice control has been fully disabled in the app. This hook now acts as a safe no-op
// to keep the API surface stable and avoid bundling native speech dependencies.
export const useVoiceControl = ({ config, onAddPoint, onUndo }: VoiceControlProps) => {
  useEffect(() => {
    // Keep references in the dependency array to avoid unused warnings without re-enabling logic.
    console.info('[VoiceControl] Disabled hook invoked');
  }, [config, onAddPoint, onUndo]);

  const toggleListening = useCallback(() => {
    console.info('[VoiceControl] toggleListening called but feature is disabled');
  }, []);

  return { isListening: false, toggleListening, hasPermission: false };
};