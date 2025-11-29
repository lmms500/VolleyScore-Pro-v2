import { useState, useLayoutEffect, useCallback } from 'react';

export interface HudPlacement {
  visible: boolean;
  left: number;
  top: number;
  width: number;
  scale: number;
}

interface UseHudMeasureProps {
  leftScoreEl: HTMLElement | null;
  rightScoreEl: HTMLElement | null;
  enabled?: boolean;
  maxSets: number;
  version?: number;
}

const INITIAL_PLACEMENT: HudPlacement = {
  visible: false,
  left: 0, 
  top: 0, 
  width: 0, 
  scale: 1
};

export function useHudMeasure({
  leftScoreEl,
  rightScoreEl,
  enabled = true,
  maxSets,
  version = 0
}: UseHudMeasureProps): HudPlacement {
  
  const [placement, setPlacement] = useState<HudPlacement>(INITIAL_PLACEMENT);

  const calculateLayout = useCallback(() => {
    // 1. Single Set Mode: Disable HUD
    if (maxSets === 1) {
        setPlacement(prev => prev.visible ? { ...prev, visible: false } : prev);
        return;
    }

    if (!enabled) {
        setPlacement(prev => prev.visible ? { ...prev, visible: false } : prev);
        return;
    }

    const windowW = window.innerWidth;
    const windowH = window.innerHeight;

    // Fixed Centralized Positioning
    // The user requested the HUD to be strictly fixed in the center of the screen,
    // both vertically and horizontally.
    
    const centerX = windowW / 2;
    const centerY = windowH / 2;
    
    // Scale Logic: Ensure it fits on smaller screens
    // Base width of HUD is approx 200px.
    const isPortrait = windowH > windowW;
    const minDimension = Math.min(windowW, windowH);
    
    let scale = 1;
    
    if (isPortrait) {
        // In portrait, width is the constraint
        scale = Math.min(1, windowW / 300); 
    } else {
        // In landscape, height might be constraint if text is huge, but width is usually fine.
        scale = Math.min(1, windowH / 250); 
    }

    setPlacement({
        visible: true,
        left: centerX,
        top: centerY,
        width: 200, // Nominal width
        scale: Math.max(0.6, scale) // Prevent it from becoming microscopic
    });

  }, [enabled, maxSets]);

  useLayoutEffect(() => {
    if (!enabled) return;

    const triggerCalc = () => requestAnimationFrame(calculateLayout);
    
    triggerCalc();
    
    window.addEventListener('resize', triggerCalc);
    window.addEventListener('orientationchange', triggerCalc);
    
    return () => {
      window.removeEventListener('resize', triggerCalc);
      window.removeEventListener('orientationchange', triggerCalc);
    };
  }, [calculateLayout, enabled, version]);

  return placement;
}