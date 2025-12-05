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

      // 1. Generate PNG (High Quality)
      // Force font loading check or simple delay to ensure rendering
      await document.fonts.ready;
      
      const dataUrl = await toPng(node, { 
        cacheBust: true, 
        pixelRatio: 3, // Very High Res for crisp text
        backgroundColor: '#020617' // Ensure bg is solid
      });

      // 2. Convert to Blob
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], fileName, { type: 'image/png' });

      // 3. Share or Download
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
      // Optional: Toast error here
    } finally {
      setIsSharing(false);
    }
  }, []);

  return { isSharing, shareResult };
};