import { useState, useLayoutEffect, RefObject } from 'react';

interface AdaptiveLayoutParams {
  leftScoreRef: RefObject<HTMLElement>;
  rightScoreRef: RefObject<HTMLElement>;
  leftNameRef: RefObject<HTMLElement>;
  rightNameRef: RefObject<HTMLElement>;
  scoreA: number;
  scoreB: number;
  isFullscreen: boolean;
}

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

export const useAdaptiveLayout = ({
  leftScoreRef,
  rightScoreRef,
  leftNameRef,
  rightNameRef,
  scoreA,
  scoreB,
  isFullscreen,
}: AdaptiveLayoutParams) => {
  const [styles, setStyles] = useState({});

  useLayoutEffect(() => {
    if (!isFullscreen) {
      setStyles({});
      return;
    }

    const calculateLayout = () => {
      const leftScoreEl = leftScoreRef.current;
      const rightScoreEl = rightScoreRef.current;
      const leftNameEl = leftNameRef.current;
      const rightNameEl = rightNameRef.current;
      
      if (!leftScoreEl || !rightScoreEl || !leftNameEl || !rightNameEl) return;

      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const isPortrait = vh > vw;

      const leftScoreRect = leftScoreEl.getBoundingClientRect();
      const rightScoreRect = rightScoreEl.getBoundingClientRect();
      const leftNameRect = leftNameEl.getBoundingClientRect();

      // --- Calculations based on user rules ---

      // 1. HUD Dimensions
      const availableWidth = rightScoreRect.left - leftScoreRect.right;
      const availableHeight = leftScoreRect.top - leftNameRect.bottom;
      const hudMaxWidth = availableWidth * 0.62;
      const hudMaxHeight = availableHeight * 0.28;
      const aspectRatio = isPortrait ? 2.7 : 2.1;

      let finalHudWidth = hudMaxWidth;
      let finalHudHeight = finalHudWidth / aspectRatio;

      if (finalHudHeight > hudMaxHeight) {
        finalHudHeight = hudMaxHeight;
        finalHudWidth = finalHudHeight * aspectRatio;
      }
      
      // 2. Score Font Size
      const minScoreFont = vh * 0.06;
      const maxScoreFont = vh * 0.11;
      let scoreFontSize = clamp(availableHeight * 0.8, 72, 300); // Fallback for landscape
      
      if (isPortrait) {
        scoreFontSize = clamp(scoreFontSize, minScoreFont, maxScoreFont);
      }
      
      // 3. HUD Vertical Position (for landscape)
      let hudTop = vh / 2; // Default to vertical center
      if (!isPortrait) {
        hudTop = leftScoreRect.top + leftScoreRect.height / 2;
      }

      // 4. Badge Scaling
      const badgeTargetWidth = availableWidth * (isPortrait ? 0.07 : 0.05);
      const badgeBaseWidth = 150; // An estimated base width for a typical badge in pixels
      const badgeScale = clamp(badgeTargetWidth / badgeBaseWidth, 0.5, 1.2);

      // 5. Set CSS Variables
      setStyles({
        '--hud-w': `${clamp(finalHudWidth, 200, 720)}px`,
        '--hud-h': `${clamp(finalHudHeight, 80, 250)}px`,
        '--hud-top': `${hudTop}px`,
        '--score-font': `${scoreFontSize}px`,
        '--badge-scale': `${badgeScale}`,
      });
    };

    calculateLayout();

    // Use ResizeObserver for better performance than 'resize' event listener
    const observer = new ResizeObserver(calculateLayout);
    observer.observe(document.documentElement);

    return () => {
      observer.disconnect();
    };

  }, [isFullscreen, leftScoreRef, rightScoreRef, leftNameRef, rightNameRef, scoreA, scoreB]);

  // The hook no longer needs to return compactMode
  return { styles };
};