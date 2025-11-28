import { useState, useLayoutEffect, RefObject } from 'react';

interface AdaptiveLayoutParams {
  leftScoreRef: RefObject<HTMLElement>;
  rightScoreRef: RefObject<HTMLElement>;
  scoreA: number;
  scoreB: number;
  isFullscreen: boolean;
}

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

export const useAdaptiveLayout = ({
  leftScoreRef,
  rightScoreRef,
  scoreA,
  scoreB,
  isFullscreen,
}: AdaptiveLayoutParams) => {
  const [styles, setStyles] = useState({});
  const [compactMode, setCompactMode] = useState(false);

  useLayoutEffect(() => {
    if (!isFullscreen) {
      // Reset when not in fullscreen to avoid lingering styles
      setStyles({});
      setCompactMode(false);
      return;
    }

    const calculateLayout = () => {
      const leftEl = leftScoreRef.current;
      const rightEl = rightScoreRef.current;
      
      if (!leftEl || !rightEl) return;

      const leftRect = leftEl.getBoundingClientRect();
      const rightRect = rightEl.getBoundingClientRect();
      
      // 1. HUD Width Calculation
      const minGap = 24; // px
      const availableSpace = rightRect.left - leftRect.right;
      const hudMaxWidth = availableSpace - (2 * minGap);

      const minHudWidth = 260;
      const maxHudWidth = 720;
      const hudWidth = clamp(hudMaxWidth, minHudWidth, maxHudWidth);

      // 2. Compact Mode Calculation
      const isCompact = hudWidth <= (minHudWidth + 60) || window.innerWidth < 420;
      setCompactMode(isCompact);

      // 3. Score Font Size Calculation
      const reservedTop = 80; // Estimated space for header/badges
      const reservedBottom = 40; // Estimated space at the bottom
      const availableHeightForScore = window.innerHeight - reservedTop - reservedBottom;
      
      const factor = isCompact ? 0.4 : 0.55;
      const minFontSize = 72;
      const maxFontSize = 240;
      const scoreFontSize = clamp(availableHeightForScore * factor, minFontSize, maxFontSize);
      
      // 4. Set CSS Variables
      setStyles({
        '--hud-w': `${hudWidth}px`,
        '--score-font': `${scoreFontSize}px`,
      });
    };

    calculateLayout();

    const observer = new ResizeObserver(calculateLayout);
    observer.observe(document.documentElement);

    return () => {
      observer.disconnect();
    };

  }, [isFullscreen, leftScoreRef, rightScoreRef, scoreA, scoreB]);

  return { styles, compactMode };
};
