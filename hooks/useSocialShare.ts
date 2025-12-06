import { useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const useSocialShare = () => {
  const [isSharing, setIsSharing] = useState(false);

  const shareMatch = useCallback(async () => {
    try {
      setIsSharing(true);

      // 1. Encontrar o elemento do card (que pode estar escondido ou visível)
      const element = document.getElementById('social-share-card');
      if (!element) {
        throw new Error('Card element not found');
      }

      // 2. Gerar a imagem (Base64)
      // O 'cacheBust' ajuda a carregar imagens externas se houver
      // Reduzi o pixelRatio para 2 para garantir melhor performance no Android (evitar estouro de memória)
      const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2 });

      // 3. Lógica Diferente para Mobile (Nativo) vs Web
      if (Capacitor.isNativePlatform()) {
        // --- MOBILE (ANDROID/IOS) ---
        
        // Salvar o arquivo no diretório de Cache do app
        const fileName = `volleyscore-result-${Date.now()}.png`;

        // CRÍTICO: Remover o prefixo 'data:image/png;base64,' para salvar corretamente o binário
        const base64Data = dataUrl.split(',')[1];

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: dataUrl,
          directory: Directory.Cache,
          recursive: true
        });

        // Compartilhar a URI do arquivo salvo usando o array 'files'
        await Share.share({
          title: 'Resultado da Partida',
          text: 'Confira o resultado no VolleyScore Pro!',
          files: [savedFile.uri], // Android requer array 'files' para anexos locais
        });

      } else {
        // --- WEB (PWA/DESKTOP) ---
        
        // Tenta usar a API nativa do navegador se suportar arquivos
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

        // Fallback: Download direto se não der para compartilhar
        const link = document.createElement('a');
        link.download = `volleyscore-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }

    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      // Aqui você poderia adicionar um Toast de erro se quisesse
    } finally {
      setIsSharing(false);
    }
  }, []);

  return { shareMatch, isSharing };
};
