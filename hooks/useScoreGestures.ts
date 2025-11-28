import React, { useRef } from 'react';

interface UseScoreGesturesProps {
  onAdd: () => void;
  onSubtract: () => void;
  isLocked: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

// Constants for gesture detection
const SWIPE_THRESHOLD_Y = 30; // Min vertical distance to be a swipe
const TAP_MAX_DURATION_MS = 250; // Max time for a tap
const TAP_MAX_DISTANCE_Y = 15; // Max vertical distance for a tap

export const useScoreGestures = ({ 
  onAdd, 
  onSubtract, 
  isLocked, 
  onInteractionStart, 
  onInteractionEnd 
}: UseScoreGesturesProps) => {
  
  const startY = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLocked) return; 
    
    // Capture the pointer to this element, ensuring subsequent events are directed here
    try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (error) {
        console.warn("Failed to capture pointer:", error);
    }

    if (onInteractionStart) onInteractionStart();
    
    startY.current = e.clientY;
    startTime.current = Date.now();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (onInteractionEnd) onInteractionEnd();
    if (startY.current === null || startTime.current === null) return;
    
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (error) {
        console.warn("Failed to release pointer:", error);
    }

    const endY = e.clientY;
    const deltaTime = Date.now() - startTime.current;
    
    const deltaY = startY.current - endY; // Positive = Swipe Up
    const absDeltaY = Math.abs(deltaY);

    // Rule 1: It's a TAP if it's fast and short
    if (deltaTime < TAP_MAX_DURATION_MS && absDeltaY < TAP_MAX_DISTANCE_Y) {
      onAdd();
    } 
    // Rule 2: It's a SWIPE if it's long enough
    else if (absDeltaY > SWIPE_THRESHOLD_Y) {
      if (deltaY > 0) {
        onAdd(); // Swipe Up
      } else {
        onSubtract(); // Swipe Down
      }
    }
    // Movements in the "dead zone" (short and slow) are ignored.
    
    startY.current = null;
    startTime.current = null;
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (onInteractionEnd) onInteractionEnd();
    if (startY.current === null) return;
    
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (error) {
        console.warn("Failed to release pointer on cancel:", error);
    }

    startY.current = null;
    startTime.current = null;
  };

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel
  };
};