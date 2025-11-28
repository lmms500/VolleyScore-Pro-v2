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
const MIN_HUD_WIDTH = 220;
const PREFERRED_HUD_WIDTH = 420;
const MAX_HUD_WIDTH = 650;
const MIN_HUD_HEIGHT = 160; 
const MAX_HUD_HEIGHT = 480; 
const COMPACT_THRESHOLD_LANDSCAPE = 300;
const GAP_PADDING = 10;

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
             const width = Math.min(window.innerWidth - GAP_PADDING * 2, MAX_HUD_WIDTH);
             const height = Math.max(MIN_HUD_HEIGHT, Math.min(availableHeight - GAP_PADDING, MAX_HUD_HEIGHT));
             
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
        
        // 1. Calculate HUD Center (Based on Scores)
        const leftScoreEdge = rectScoreA.right;
        const rightScoreEdge = rectScoreB.left;
        
        // Precise geometric center between the two numbers
        const hudCenterX = (leftScoreEdge + rightScoreEdge) / 2;
        const availableWidth = rightScoreEdge - leftScoreEdge;

        // 2. Calculate TopBar Center (Based on Names)
        let topBarCenterX = window.innerWidth / 2; // Default
        if (leftNameEl && rightNameEl) {
            const rectNameA = leftNameEl.getBoundingClientRect();
            const rectNameB = rightNameEl.getBoundingClientRect();
            // Use midpoint of inner edges for names too, to ensure centering in the gap
            // If names overlap, this might be weird, but assumption is they don't in landscape
            const leftNameEdge = rectNameA.right;
            const rightNameEdge = rectNameB.left;
            topBarCenterX = (leftNameEdge + rightNameEdge) / 2;
        }

        if (availableWidth < MIN_HUD_WIDTH / 3) {
            // Gap too small?
            newPlacement = { ...INITIAL_PLACEMENT, mode: 'fallback' };
        } else {
            const width = Math.max(MIN_HUD_WIDTH, Math.min(availableWidth - GAP_PADDING, MAX_HUD_WIDTH));
            const height = Math.min(window.innerHeight * 0.8, MAX_HUD_HEIGHT);
            
            // Calculate Top based on screen center
            const top = (window.innerHeight - height) / 2;
            const left = hudCenterX - (width / 2);

            const internalScale = Math.min(1, width / PREFERRED_HUD_WIDTH);

            newPlacement = { 
                mode: 'landscape', 
                left, 
                top, 
                width, 
                height, 
                compact: availableWidth < COMPACT_THRESHOLD_LANDSCAPE, 
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
  }, [calculateLayout, enabled, debounceMs]);

  return placement;
}