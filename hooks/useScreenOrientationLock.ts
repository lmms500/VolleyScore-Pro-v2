import { useEffect } from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';

// Define os tipos de orientação para consistência
type OrientationLockType = 'portrait-primary' | 'landscape'; // Alterado para 'landscape'

/**
 * Este hook gerencia o bloqueio de orientação da tela em plataformas nativas.
 * Ele observa o estado de tela cheia e bloqueia a tela para paisagem ou retrato.
 * A orientação 'landscape' permite a rotação entre paisagem normal e invertida.
 * 
 * @param isFullscreen O estado booleano que determina se o modo de tela cheia está ativo.
 */
export const useScreenOrientationLock = (isFullscreen: boolean) => {

  const lock = async (orientation: OrientationLockType) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await ScreenOrientation.lock({ orientation });
    } catch (error) {
      console.error('Falha ao bloquear a orientação da tela', error);
    }
  };

  const unlock = async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await ScreenOrientation.unlock();
    } catch (error) {
      console.error('Falha ao desbloquear a orientação da tela', error);
    }
  };

  useEffect(() => {
    if (isFullscreen) {
      lock('landscape'); // Permite rotação completa em paisagem
    } else {
      lock('portrait-primary');
    }

    // A função de limpeza continua vital para devolver o controle ao sistema
    return () => {
      unlock();
    };
  }, [isFullscreen]);

};
