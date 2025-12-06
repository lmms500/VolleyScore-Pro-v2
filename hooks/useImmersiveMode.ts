import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Hook para ativar e manter o Modo Imersivo Total e Permanente em plataformas nativas.
 * Ele é projetado para ser chamado apenas uma vez, no componente raiz do aplicativo.
 */
export const useImmersiveMode = () => {
  useEffect(() => {
    // Esta função só deve rodar em ambiente nativo.
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const setupImmersiveMode = async () => {
      try {
        // 1. Diga à WebView para desenhar sob as barras de sistema (edge-to-edge).
        await StatusBar.setOverlaysWebView({ overlay: true });

        // 2. Define o estilo da barra de status para se adequar ao modo escuro.
        await StatusBar.setStyle({ style: Style.Dark });

      } catch (error) {
        console.error('Falha ao configurar o modo imersivo', error);
      }
    };

    setupImmersiveMode();

  }, []); // O array vazio garante que isso rode apenas uma vez, quando o app é montado.
};
