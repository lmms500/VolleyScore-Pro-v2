import { useEffect, useState, useCallback } from 'react';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { GameConfig, TeamId } from '../types';
import { Capacitor } from '@capacitor/core';

interface VoiceControlProps {
  config: GameConfig;
  onAddPoint: (team: TeamId) => void;
  onUndo: () => void;
}

export const useVoiceControl = ({ config, onAddPoint, onUndo }: VoiceControlProps) => {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // Palavras-chave (Trigger Words)
  const COMMANDS = {
    TEAM_A: ['ponto casa', 'ponto a', 'ponto esquerda', 'point home', 'home point', 'left', 'casa'],
    TEAM_B: ['ponto fora', 'ponto b', 'ponto direita', 'point guest', 'visitante', 'right', 'fora'],
    UNDO: ['desfazer', 'voltar', 'cancelar', 'undo', 'back']
  };

  const processText = useCallback((text: string) => {
    const cleanText = text.toLowerCase();
    console.log('🎤 Comando ouvido:', cleanText);

    if (COMMANDS.TEAM_A.some(cmd => cleanText.includes(cmd))) {
      onAddPoint('A');
    } else if (COMMANDS.TEAM_B.some(cmd => cleanText.includes(cmd))) {
      onAddPoint('B');
    } else if (COMMANDS.UNDO.some(cmd => cleanText.includes(cmd))) {
      onUndo();
    }
  }, [onAddPoint, onUndo]);

  const checkAndRequestPermissions = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return true;

    try {
        // Verifica status atual
        const status = await SpeechRecognition.checkPermissions();
        
        // CORREÇÃO: A propriedade correta é 'speechRecognition'
        if (status.speechRecognition === 'granted') {
            setHasPermission(true);
            return true;
        }

        // Se não tem, solicita
        const request = await SpeechRecognition.requestPermissions();
        if (request.speechRecognition === 'granted') {
             setHasPermission(true);
             return true;
        }
    } catch (e) {
        console.error("Erro ao verificar permissões de voz:", e);
    }
    return false;
  }, []);

  const toggleListening = useCallback(async () => {
    if (!config.enableVoiceControl) return;

    if (!Capacitor.isNativePlatform()) {
       alert("O controle por voz via Plugin funciona melhor no App Nativo (Android/iOS).");
       return;
    }

    try {
      if (isListening) {
        await SpeechRecognition.stop();
        setIsListening(false);
      } else {
        const permissionGranted = await checkAndRequestPermissions();
        if (!permissionGranted) return;

        // CORREÇÃO: available() retorna um objeto { available: boolean }
        const { available } = await SpeechRecognition.available();
        
        if (available) {
          setIsListening(true);
          await SpeechRecognition.start({
            language: "pt-PT",
            maxResults: 2,
            prompt: "Diga 'Ponto Casa' ou 'Ponto Fora'",
            partialResults: true,
            popup: false,
          });

          SpeechRecognition.addListener("partialResults", (data: any) => {
             if (data.matches && data.matches.length > 0) {
                 processText(data.matches[0]);
             }
          });
        } else {
          console.warn("Reconhecimento de fala não disponível neste dispositivo.");
        }
      }
    } catch (e) {
      console.error("Erro ao manipular reconhecimento:", e);
      setIsListening(false);
    }
  }, [config.enableVoiceControl, isListening, processText, checkAndRequestPermissions]);

  // Cleanup e verificação inicial
  useEffect(() => {
     checkAndRequestPermissions();
     
     return () => {
       if (Capacitor.isNativePlatform()) {
         SpeechRecognition.removeAllListeners();
       }
     };
  }, [checkAndRequestPermissions]);

  return { isListening, toggleListening, hasPermission };
};