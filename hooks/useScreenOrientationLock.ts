import { useEffect } from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';

export const useScreenOrientationLock = (isLandscape: boolean) => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const updateOrientation = async () => {
      try {
        if (isLandscape) {
          // FORÇA a paisagem (permitindo virar para os dois lados)
          await ScreenOrientation.lock({ orientation: 'landscape' });
        } else {
          // FORÇA o retrato
          await ScreenOrientation.lock({ orientation: 'portrait' });
        }
      } catch (error) {
        console.error('Erro ao alternar orientação:', error);
      }
    };

    updateOrientation();
    
    // O cleanup não é estritamente necessário aqui, pois a orientação
    // será redefinida na próxima vez que o estado isFullscreen mudar.
    // Deixar em branco evita um "piscar" de orientação ao desmontar componentes.
    return () => {};
  }, [isLandscape]);
};
