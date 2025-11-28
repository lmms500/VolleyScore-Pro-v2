import React, { useRef } from 'react';

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
  const SWIPE_THRESHOLD = 25; // Pixels to count as swipe
  const TAP_THRESHOLD = 10;   // Deadzone for tap

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLocked) return; 
    
    // Crucial: Prevent default actions (scroll/select) AND capture pointer
    e.preventDefault();
    try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (error) {
        console.debug("Pointer capture failed", error);
    }

    if (onInteractionStart) onInteractionStart();
    startY.current = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    
    // Release capture
    try {
        if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }
    } catch (error) {}

    const distance = startY.current - e.clientY; // Positive = Up
    const absDist = Math.abs(distance);

    if (absDist > SWIPE_THRESHOLD) {
      // SWIPE
      if (distance > 0) onAdd(); // Up
      else onSubtract(); // Down
    } else if (absDist < TAP_THRESHOLD) {
      // TAP
      onAdd();
    }
    // Else: Dead zone (small drag but not enough to swipe, too much to tap)

    if (onInteractionEnd) onInteractionEnd();
    startY.current = null;
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (onInteractionEnd) onInteractionEnd();
    startY.current = null;
    try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (error) {}
  };

  return {
    handlePointerDown,
    handlePointerUp,
    handlePointerCancel
  };
};