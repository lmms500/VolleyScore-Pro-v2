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
  version?: number; // Added version prop to force re-calc
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

    // 2. Missing Elements or Disabled
    if (!enabled || !leftScoreEl || !rightScoreEl) {
        setPlacement(prev => prev.visible ? { ...prev, visible: false } : prev);
        return;
    }

    const rectA = leftScoreEl.getBoundingClientRect();
    const rectB = rightScoreEl.getBoundingClientRect();
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;

    // Safety check for invalid rects (e.g. hidden elements during transition)
    if (rectA.width === 0 || rectB.width === 0) return;

    const isPortrait = windowH > windowW;

    if (isPortrait) {
        // Portrait: Position between bottom of Top Score and top of Bottom Score
        const gapTop = rectA.bottom;
        const gapBottom = rectB.top;
        const availableHeight = gapBottom - gapTop;

        if (availableHeight < 50) {
             setPlacement({ visible: false, left: 0, top: 0, width: 0, scale: 1 });
             return;
        }

        const centerY = gapTop + (availableHeight / 2);
        const centerX = windowW / 2;
        
        const scale = Math.min(1, availableHeight / 150);

        setPlacement({
            visible: true,
            left: centerX,
            top: centerY,
            width: windowW * 0.8,
            scale
        });

    } else {
        // Landscape: Position between right of Left Score and left of Right Score
        
        const gapLeft = rectA.right;
        const gapRight = rectB.left;
        const availableWidth = gapRight - gapLeft;

        // If gap is negative (overlap), hide HUD
        if (availableWidth < 20) {
            setPlacement(prev => prev.visible ? { ...prev, visible: false } : prev);
            return;
        }

        let centerX = gapLeft + (availableWidth / 2);
        const centerY = windowH / 2;

        // Safe Area Clamping (Simulated)
        // In a real device, safe-area-inset-left/right might push content.
        // We ensure centerX is at least X px from edges.
        const safeMargin = 40; // Approx notch width
        const minX = safeMargin;
        const maxX = windowW - safeMargin;
        centerX = Math.max(minX, Math.min(centerX, maxX));

        // Calculate Scale based on Gap Width
        const scale = Math.min(1, availableWidth / 220);

        setPlacement({
            visible: true,
            left: centerX,
            top: centerY,
            width: availableWidth,
            scale
        });
    }

  }, [enabled, leftScoreEl, rightScoreEl, maxSets]);

  useLayoutEffect(() => {
    if (!enabled) return;

    const triggerCalc = () => requestAnimationFrame(calculateLayout);
    
    triggerCalc();
    
    // Resize Observer to track Score Element changes
    const observer = new ResizeObserver(triggerCalc);
    if(leftScoreEl) observer.observe(leftScoreEl);
    if(rightScoreEl) observer.observe(rightScoreEl);
    
    window.addEventListener('resize', triggerCalc);
    window.addEventListener('orientationchange', triggerCalc);
    
    return () => {
      window.removeEventListener('resize', triggerCalc);
      window.removeEventListener('orientationchange', triggerCalc);
      observer.disconnect();
    };
  }, [calculateLayout, enabled, leftScoreEl, rightScoreEl, version]); // Version dependency added

  return placement;
}