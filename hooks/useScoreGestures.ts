import React, { useRef, useCallback, useEffect } from 'react';

interface UseScoreGesturesProps {
  onAdd: () => void;
  onSubtract: () => void;
  isLocked: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

export const useScoreGestures = ({ 
  onAdd, 
  onSubtract, 
  isLocked, 
  onInteractionStart, 
  onInteractionEnd 
}: UseScoreGesturesProps) => {
  
  const startY = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 30; // Increased threshold for clearer distinction
  const TAP_THRESHOLD = 15;   // Increased threshold for tap/deadzone

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLocked) return; 
    
    // Prevent default touch actions like text selection or scrolling
    e.preventDefault();
    
    // Capture the pointer to this element, ensuring subsequent events are directed here
    try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (error) {
        console.warn("Failed to capture pointer:", error);
    }

    if (onInteractionStart) onInteractionStart();
    
    startY.current = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (onInteractionEnd) onInteractionEnd();
    if (startY.current === null) return;
    
    try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (error) {
        console.warn("Failed to release pointer:", error);
    }


    const endY = e.clientY;
    const distance = startY.current - endY; // Positive = Swipe Up
    const absDist = Math.abs(distance);

    if (absDist > SWIPE_THRESHOLD) {
      if (distance > 0) {
        onAdd(); // Swipe Up
      } else {
        onSubtract(); // Swipe Down
      }
    } else if (absDist < TAP_THRESHOLD) {
      // It's a tap, not a failed swipe
      onAdd();
    }
    // Any movement between TAP_THRESHOLD and SWIPE_THRESHOLD is ignored (dead zone)
    
    startY.current = null;
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (onInteractionEnd) onInteractionEnd();
    if (startY.current === null) return;
    
    try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (error) {
        console.warn("Failed to release pointer on cancel:", error);
    }

    startY.current = null;
  };

  return {
    handlePointerDown,
    handlePointerUp,
    handlePointerCancel
  };
};