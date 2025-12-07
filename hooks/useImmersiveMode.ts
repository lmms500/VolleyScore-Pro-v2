import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useImmersiveStore } from '../stores/immersiveStore';

/**
 * Hook para gerenciar os efeitos colaterais do modo imersivo.
 * Controla a visibilidade da status bar em resposta ao estado global.
 */
export const useImmersiveMode = () => {
  const { isImmersive } = useImmersiveStore();

  // Efeito que reage à mudança do estado isImmersive para controlar a status bar.
  useEffect(() => {
    // Esta funcionalidade é apenas para plataformas nativas.
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const manageImmersiveState = async () => {
      try {
        if (isImmersive) {
          // Ativa o modo "edge-to-edge".
          await StatusBar.setOverlaysWebView({ overlay: true });
        } else {
          // Desativa o modo "edge-to-edge".
          await StatusBar.setOverlaysWebView({ overlay: false });
        }
      } catch (error) {
        // O erro é esperado no navegador, onde estas APIs não estão disponíveis.
        console.info('API de status bar não disponível na web, ignorando erro.', error);
      }
    };

    manageImmersiveState();
  }, [isImmersive]); // A dependência no estado do store garante que o efeito rode quando o modo imersivo mudar.

  // Efeito para o setup inicial do estilo da status bar, que roda apenas uma vez.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupStyle = async () => {
      try {
        // Define o estilo da barra de status para se adequar ao tema do app (escuro).
        await StatusBar.setStyle({ style: Style.Dark });
      } catch (error) {
        console.error('Falha ao definir o estilo da StatusBar', error);
      }
    };

    setupStyle();
  }, []); // O array vazio garante que isso rode apenas uma vez.
};
