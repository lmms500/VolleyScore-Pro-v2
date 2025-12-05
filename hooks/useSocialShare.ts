
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
      
      // Helper to generate image with fallback mechanism
      const generateImage = async () => {
        try {
          // Attempt 1: High Fidelity (With Fonts)
          return await toPng(node, { 
            cacheBust: true, 
            pixelRatio: 2, 
            backgroundColor: '#020617', // Ensure solid background
            skipAutoScale: true,
            fetchRequestInit: { mode: 'cors' } // Explicitly request CORS for external assets
          });
        } catch (innerError) {
          console.warn('High-fidelity image generation failed (likely CORS/Fonts). Retrying without fonts.', innerError);
          
          // Attempt 2: Fallback (Skip Fonts)
          return await toPng(node, { 
            cacheBust: true, 
            pixelRatio: 2, 
            backgroundColor: '#020617', 
            skipAutoScale: true,
            skipFonts: true // Bypass font embedding to ensure success
          });
        }
      };

      // 2. Generate PNG
      const dataUrl = await generateImage();

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
