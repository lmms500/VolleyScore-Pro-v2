import { useState, useLayoutEffect, useCallback } from 'react';

/**
 * =================================================================================
 * useHudMeasure Hook (Geometric Alignment V2.2)
 * =================================================================================
 * Calculates precise layout positions based on the visual gap between elements.
 * 
 * Logic:
 * 1. Smart Centering: Aligns center with Team Names, constrained by Score gaps.
 * 2. Dynamic Scaling: Scales down based on available horizontal OR vertical space.
 * 3. Compact Mode: Triggers tighter UI styling when space/scale is low.
 * 4. Fallback: robust defaults when measurements fail.
 * =================================================================================
 */

export interface HudPlacement {
  mode: "landscape" | "portrait" | "fallback";
  left: number;
  top: number;
  width: number;
  height: number;
  compact: boolean;
  internalScale: number;
  topBarLeft?: number; 
}

interface UseHudMeasureProps {
  leftScoreEl: HTMLElement | null;
  rightScoreEl: HTMLElement | null;
  leftNameEl: HTMLElement | null;
  rightNameEl: HTMLElement | null;
  enabled?: boolean;
  debounceMs?: number;
}

// --- Design Constants ---
const HUD_SAFETY_MARGIN_PX = 20;
const PREFERRED_HUD_WIDTH = 420;
const PREFERRED_HUD_HEIGHT = 200; 
const MAX_HUD_WIDTH = 600;
const MIN_HUD_HEIGHT = 120; 
const MAX_HUD_HEIGHT = 480; 
const COMPACT_WIDTH_THRESHOLD = 360;
const COMPACT_SCALE_THRESHOLD = 0.8;

const INITIAL_PLACEMENT: HudPlacement = {
  mode: 'fallback', 
  left: 0, 
  top: 0, 
  width: 0, 
  height: 0, 
  compact: false, 
  internalScale: 1
};

export function useHudMeasure({
  leftScoreEl,
  rightScoreEl,
  leftNameEl,
  rightNameEl,
  enabled = true,
  debounceMs = 100
}: UseHudMeasureProps): HudPlacement {
  
  const [placement, setPlacement] = useState<HudPlacement>(INITIAL_PLACEMENT);

  const calculateLayout = useCallback(() => {
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    
    // 1. Fallback Logic: If elements missing, default to fallback centered mode
    if (!enabled || !leftScoreEl || !rightScoreEl) {
        const width = Math.min(300, windowW * 0.8);
        const height = 150;
        setPlacement({
            mode: 'fallback',
            left: (windowW - width) / 2,
            top: (windowH - height) / 2,
            width,
            height,
            compact: false, // Default normal in fallback unless very small screen
            internalScale: 1
        });
        return;
    }

    const rectScoreA = leftScoreEl.getBoundingClientRect();
    const rectScoreB = rightScoreEl.getBoundingClientRect();
    const isPortrait = windowH > windowW;

    if (isPortrait) {
        // --- Portrait Logic (Stacked) ---
        const availableHeight = rectScoreB.top - rectScoreA.bottom;
        
        if (availableHeight < MIN_HUD_HEIGHT) {
             setPlacement({ ...INITIAL_PLACEMENT, mode: 'fallback' });
        } else {
             const width = Math.min(windowW - HUD_SAFETY_MARGIN_PX * 2, MAX_HUD_WIDTH);
             const height = Math.max(MIN_HUD_HEIGHT, Math.min(availableHeight - HUD_SAFETY_MARGIN_PX, MAX_HUD_HEIGHT));
             
             const heightScale = Math.min(1, height / PREFERRED_HUD_HEIGHT);

             setPlacement({
                 mode: 'portrait',
                 left: (windowW - width) / 2,
                 top: rectScoreA.bottom + (availableHeight - height) / 2,
                 width,
                 height,
                 compact: availableHeight < 180 || heightScale < COMPACT_SCALE_THRESHOLD,
                 internalScale: heightScale,
                 topBarLeft: undefined // Fixed top bar
             });
        }

    } else { 
        // --- Landscape Logic (Side-by-Side) ---
        
        // 1. Define Boundaries (The Gap between Scores)
        const gapLeft = rectScoreA.right + HUD_SAFETY_MARGIN_PX;
        const gapRight = rectScoreB.left - HUD_SAFETY_MARGIN_PX;
        const availableGapWidth = Math.max(0, gapRight - gapLeft);

        // 2. Determine Scale Factors
        // Calculate scale based on Horizontal Gap AND Vertical Screen availability
        const availableScreenHeight = windowH - (HUD_SAFETY_MARGIN_PX * 4); // generous vertical padding
        
        const widthScale = availableGapWidth / PREFERRED_HUD_WIDTH;
        const heightScale = availableScreenHeight / PREFERRED_HUD_HEIGHT;
        
        // Use the limiting dimension for scale
        const internalScale = Math.min(1, widthScale, heightScale); 
        
        // Compact Flag
        const isCompact = internalScale < COMPACT_SCALE_THRESHOLD || availableGapWidth < COMPACT_WIDTH_THRESHOLD;

        // 3. Determine Center X
        // Priority: Center strictly between Names.
        // Constraint: Must not overlap Scores.
        let targetCenterX = (gapLeft + gapRight) / 2;

        if (leftNameEl && rightNameEl) {
            const rectNameA = leftNameEl.getBoundingClientRect();
            const rectNameB = rightNameEl.getBoundingClientRect();
            // Perfect visual center between names
            const namesCenterX = (rectNameA.right + rectNameB.left) / 2;
            targetCenterX = namesCenterX;
        }

        // 4. Position Clamping
        const finalWidth = PREFERRED_HUD_WIDTH;
        const finalHeight = PREFERRED_HUD_HEIGHT;
        
        // Calculate the visual half-width of the HUD after scaling
        const visualHalfWidth = (finalWidth * internalScale) / 2;
        
        // Determine safe center range within the gap
        const minSafeCenter = gapLeft + visualHalfWidth;
        const maxSafeCenter = gapRight - visualHalfWidth;
        
        // Clamp the target center to safe zone
        let finalCenterX = targetCenterX;
        
        if (minSafeCenter > maxSafeCenter) {
            // Gap is too small for the HUD even scaled? Center in gap.
            finalCenterX = (gapLeft + gapRight) / 2;
        } else {
            // Clamp strictly
            finalCenterX = Math.max(minSafeCenter, Math.min(maxSafeCenter, targetCenterX));
        }

        // 5. Final Positions
        // Left is calculated for the unscaled element (assuming transform-origin center)
        const left = finalCenterX - (finalWidth / 2);
        
        // Vertically center relative to the window, not the scores
        const top = (windowH - finalHeight) / 2;

        setPlacement({ 
            mode: 'landscape', 
            left, 
            top, 
            width: finalWidth, 
            height: finalHeight, 
            compact: isCompact, 
            internalScale,
            topBarLeft: undefined // Returning undefined fixes the bar to the center (CSS default)
        });
    }

  }, [enabled, leftScoreEl, rightScoreEl, leftNameEl, rightNameEl]);

  useLayoutEffect(() => {
    if (!enabled) return;

    const debouncedCalculation = () => {
        let timeoutId: ReturnType<typeof setTimeout>;
        return () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(calculateLayout, debounceMs);
        };
    };
    const triggerCalc = debouncedCalculation();
    
    triggerCalc();
    const t1 = setTimeout(calculateLayout, 50);
    const t2 = setTimeout(calculateLayout, 300); 

    const resizeObserver = new ResizeObserver(triggerCalc);
    if(leftScoreEl) resizeObserver.observe(leftScoreEl);
    if(rightScoreEl) resizeObserver.observe(rightScoreEl);
    
    window.addEventListener('resize', triggerCalc);
    window.addEventListener('orientationchange', triggerCalc);
    
    return () => {
      window.removeEventListener('resize', triggerCalc);
      window.removeEventListener('orientationchange', triggerCalc);
      resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [calculateLayout, enabled, debounceMs, leftScoreEl, rightScoreEl]);

  return placement;
}