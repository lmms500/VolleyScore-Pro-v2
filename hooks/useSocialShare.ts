import { useState, useCallback } from 'react';
import { toPng } from 'html-to-image';

export const useSocialShare = () => {
  const [isSharing, setIsSharing] = useState(false);

  const shareResult = useCallback(async (elementId: string, fileName = 'volleyscore-result.png') => {
    setIsSharing(true);
    try {
      const node = document.getElementById(elementId);
      if (!node) {
        throw new Error(`Element with id ${elementId} not found`);
      }

      // 1. Force font loading check or wait a tick to ensure rendering
      await document.fonts.ready;
      
      // 2. Generate PNG with High Quality settings
      const dataUrl = await toPng(node, { 
        cacheBust: true, 
        pixelRatio: 2, // 2x is usually enough for retina and sharing, 3x might be too heavy for mobile memory
        backgroundColor: '#020617', // Ensure bg is solid deep slate
        skipAutoScale: true
      });

      // 3. Convert to Blob
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], fileName, { type: 'image/png' });

      // 4. Share or Download
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'VolleyScore Pro Result',
                text: 'Check out the match result!'
            });
        } catch (shareError) {
             // Abort or user cancelled
             console.warn('Share cancelled or failed', shareError);
        }
      } else {
        // Fallback: Download
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      }

    } catch (error) {
      console.error('Social Share Failed:', error);
    } finally {
      setIsSharing(false);
    }
  }, []);

  return { isSharing, shareResult };
};