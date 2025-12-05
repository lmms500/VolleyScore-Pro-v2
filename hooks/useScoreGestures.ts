
import React, { useRef } from 'react';

interface UseScoreGesturesProps {
  onAdd: () => void;
  onSubtract: () => void;
  isLocked: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

// Constants for gesture detection
// UPDATED: Much more relaxed thresholds to ensuring taps work reliably on all screen sizes
const SWIPE_THRESHOLD = 50; 
const TAP_MAX_DURATION_MS = 800; // Increased to 800ms to allow for slower taps
const TAP_MAX_MOVE = 40; // Increased to 40px to tolerate finger movement during tap

export const useScoreGestures = ({ 
  onAdd, 
  onSubtract,
  isLocked, 
  onInteractionStart, 
  onInteractionEnd,
}: UseScoreGesturesProps) => {
  
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLocked) return; 
    
    try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (error) {
        console.warn("Failed to capture pointer:", error);
    }

    if (onInteractionStart) onInteractionStart();
    
    startX.current = e.clientX;
    startY.current = e.clientY;
    startTime.current = Date.now();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (onInteractionEnd) onInteractionEnd();
    if (startX.current === null || startY.current === null || startTime.current === null) return;
    
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (error) {
        // Ignore
    }

    const endX = e.clientX;
    const endY = e.clientY;
    const deltaTime = Date.now() - startTime.current;
    
    const deltaX = endX - startX.current;
    const deltaY = endY - startY.current; // Positive = Down, Negative = Up
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Rule 1: TAP (Relaxed logic to catch "sloppy" taps)
    // If movement is small enough, treat as tap regardless of slight drag
    if (deltaTime < TAP_MAX_DURATION_MS && absDeltaX < TAP_MAX_MOVE && absDeltaY < TAP_MAX_MOVE) {
      onAdd();
    } 
    // Rule 2: Swipes (Significant Vertical Movement)
    else if (absDeltaY > SWIPE_THRESHOLD && absDeltaY > absDeltaX) {
        // Vertical Swipe Dominant
        if (deltaY < 0) {
           // Swipe Up -> Dragging score UP -> ADD
           onAdd(); 
        } else {
           // Swipe Down -> Dragging score DOWN -> SUBTRACT
           onSubtract(); 
        }
    }
    // Rule 3: Fallback for ambiguity - if user moved barely above TAP_MAX but not enough for SWIPE
    // We do nothing to prevent accidental triggers.
    
    startX.current = null;
    startY.current = null;
    startTime.current = null;
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (onInteractionEnd) onInteractionEnd();
    startX.current = null;
    startY.current = null;
    startTime.current = null;
  };

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel
  };
};
