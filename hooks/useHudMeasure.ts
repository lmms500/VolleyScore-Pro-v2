import { useState, useLayoutEffect, useCallback } from 'react';

/**
 * =================================================================================
 * useHudMeasure Hook (Geometric Alignment V2)
 * =================================================================================
 * Calculates precise layout positions based on the visual gap between elements.
 * 
 * Logic:
 * 1. HUD Center X = Midpoint between Left Score Right-Edge and Right Score Left-Edge.
 * 2. TopBar Center X = Midpoint between Left Name Right-Edge and Right Name Left-Edge.
 * 3. Mode is determined by available aspect ratio (Landscape vs Portrait).
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
const HUD_SAFETY_MARGIN_PX = 16;
const PREFERRED_HUD_WIDTH = 420;
const MIN_HUD_WIDTH = 180;
const MAX_HUD_WIDTH = 650;
const MIN_HUD_HEIGHT = 160; 
const MAX_HUD_HEIGHT = 480; 
const COMPACT_THRESHOLD_LANDSCAPE = 320;

const INITIAL_PLACEMENT: HudPlacement = {
  mode: 'portrait', left: -9999, top: -9999, width: 0, height: 0, compact: false, internalScale: 1
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
    if (!enabled || !leftScoreEl || !rightScoreEl) {
        if (placement.left > -1) setPlacement(INITIAL_PLACEMENT);
        return;
    }

    const rectScoreA = leftScoreEl.getBoundingClientRect();
    const rectScoreB = rightScoreEl.getBoundingClientRect();

    const isPortrait = window.innerHeight > window.innerWidth;
    let newPlacement: HudPlacement;

    if (isPortrait) {
        // --- Portrait Logic (Stacked) ---
        // In portrait, we usually just center horizontally on screen
        const availableHeight = rectScoreB.top - rectScoreA.bottom;
        
        if (availableHeight < MIN_HUD_HEIGHT / 2) {
             newPlacement = { ...INITIAL_PLACEMENT, mode: 'fallback' };
        } else {
             const width = Math.min(window.innerWidth - HUD_SAFETY_MARGIN_PX * 2, MAX_HUD_WIDTH);
             const height = Math.max(MIN_HUD_HEIGHT, Math.min(availableHeight - HUD_SAFETY_MARGIN_PX, MAX_HUD_HEIGHT));
             
             newPlacement = {
                 mode: 'portrait',
                 left: (window.innerWidth - width) / 2,
                 top: rectScoreA.bottom + (availableHeight - height) / 2,
                 width,
                 height,
                 compact: availableHeight < 150,
                 internalScale: Math.min(1, height / MAX_HUD_HEIGHT),
                 topBarLeft: window.innerWidth / 2 
             };
        }

    } else { 
        // --- Landscape Logic (Side-by-Side) ---
        
        // 1. Determine Edges
        const leftScoreRightEdge = rectScoreA.right;
        const rightScoreLeftEdge = rectScoreB.left;
        
        // 2. Calculate Precise Geometric Gap
        // placement.left = (scoreA.left + scoreA.width) + HUD_SAFETY_MARGIN_PX
        const calculatedLeft = leftScoreRightEdge + HUD_SAFETY_MARGIN_PX;
        
        // placement.width = scoreB.left - (scoreA.left + scoreA.width) - (2 * HUD_SAFETY_MARGIN_PX)
        const calculatedWidth = rightScoreLeftEdge - leftScoreRightEdge - (2 * HUD_SAFETY_MARGIN_PX);

        // 3. Calculate TopBar Center (Based on Names)
        let topBarCenterX = window.innerWidth / 2; // Default
        if (leftNameEl && rightNameEl) {
            const rectNameA = leftNameEl.getBoundingClientRect();
            const rectNameB = rightNameEl.getBoundingClientRect();
            topBarCenterX = (rectNameA.right + rectNameB.left) / 2;
        }

        if (calculatedWidth < MIN_HUD_WIDTH / 2) {
            // Gap too small? Fallback to fixed positioning to avoid broken layout
            newPlacement = { ...INITIAL_PLACEMENT, mode: 'fallback' };
        } else {
            const height = Math.min(window.innerHeight * 0.8, MAX_HUD_HEIGHT);
            
            // Calculate Top based on screen center
            const top = (window.innerHeight - height) / 2;
            
            // Determine internal scale if the gap is smaller than preferred
            const internalScale = Math.min(1, calculatedWidth / PREFERRED_HUD_WIDTH);

            newPlacement = { 
                mode: 'landscape', 
                left: calculatedLeft, 
                top, 
                width: calculatedWidth, 
                height, 
                compact: calculatedWidth < COMPACT_THRESHOLD_LANDSCAPE, 
                internalScale,
                topBarLeft: topBarCenterX
            };
        }
    }

    setPlacement(newPlacement);

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
    setTimeout(calculateLayout, 350); 
    setTimeout(calculateLayout, 600); 

    const resizeObserver = new ResizeObserver(triggerCalc);
    if(leftScoreEl) resizeObserver.observe(leftScoreEl);
    if(rightScoreEl) resizeObserver.observe(rightScoreEl);
    if(leftNameEl) resizeObserver.observe(leftNameEl);
    if(rightNameEl) resizeObserver.observe(rightNameEl);
    
    window.addEventListener('resize', triggerCalc);
    window.addEventListener('orientationchange', triggerCalc);
    
    const mutationObserver = new MutationObserver(triggerCalc);
    const obsConfig = { childList: true, subtree: true, characterData: true };
    if (leftScoreEl) mutationObserver.observe(leftScoreEl, obsConfig);
    if (rightScoreEl) mutationObserver.observe(rightScoreEl, obsConfig);
    if (leftNameEl) mutationObserver.observe(leftNameEl, obsConfig);
    if (rightNameEl) mutationObserver.observe(rightNameEl, obsConfig);

    return () => {
      window.removeEventListener('resize', triggerCalc);
      window.removeEventListener('orientationchange', triggerCalc);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [calculateLayout, enabled, debounceMs, leftScoreEl, rightScoreEl, leftNameEl, rightNameEl]);

  return placement;
}