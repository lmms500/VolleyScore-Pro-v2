import { useEffect } from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';

/**
 * Este hook gerencia o bloqueio de orientação da tela em plataformas nativas.
 * Ele pode ser desativado para permitir que outros componentes controlem a orientação.
 *
 * @param shouldLock Condição booleana para ativar o bloqueio para 'portrait'.
 *                   Se `false`, o hook não executa nenhuma ação de bloqueio.
 */
export const useScreenOrientationLock = (shouldLock: boolean) => {
  const lock = async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Força o bloqueio para a orientação padrão (retrato)
      await ScreenOrientation.lock({ orientation: 'portrait-primary' });
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
    // Só executa o bloqueio se a condição `shouldLock` for verdadeira
    if (shouldLock) {
      lock();
    }

    // A função de limpeza desbloqueia a orientação ao desmontar ou quando a condição muda.
    // Isso é crucial para não deixar a tela travada permanentemente.
    return () => {
      unlock();
    };
  }, [shouldLock]); // O efeito é reavaliado sempre que `shouldLock` mudar
};
