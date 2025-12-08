import { useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';

export const useSocialShare = () => {
  const [isSharing, setIsSharing] = useState(false);

  const shareMatch = useCallback(async () => {
    try {
      setIsSharing(true);

      const element = document.getElementById('social-share-card');
      if (!element) {
        throw new Error('Card element not found');
      }

      if (Capacitor.isNativePlatform()) {
        const permissions = await Camera.checkPermissions();
        if (permissions.photos !== 'granted') {
          const permissionResult = await Camera.requestPermissions();
          if (permissionResult.photos !== 'granted') {
            alert('A permissão para acessar a galeria é necessária para salvar o resultado.');
            return;
          }
        }
      }

      const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2 });

      if (Capacitor.isNativePlatform()) {
        // --- MOBILE (ANDROID/IOS) ---
        const fileName = `volleyscore-result-${Date.now()}.png`;
        const base64Data = dataUrl.split(',')[1];

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents, // Save to gallery
          recursive: true
        });

        await Share.share({
          title: 'Resultado da Partida',
          text: 'Confira o resultado no VolleyScore Pro!',
          files: [savedFile.uri],
        });

      } else {
        // --- WEB (PWA/DESKTOP) ---
        if (navigator.share) {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], 'placar.png', { type: 'image/png' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'VolleyScore Pro',
              text: 'Resultado da Partida'
            });
            return;
          }
        }

        // Fallback: Download
        const link = document.createElement('a');
        link.download = `volleyscore-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }

    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      if (!(error as Error).message.includes('Share-cancel')) {
        alert('Ocorreu um erro ao tentar compartilhar a imagem.');
      }
    } finally {
      setIsSharing(false);
    }
  }, []);

  return { shareMatch, isSharing };
};
