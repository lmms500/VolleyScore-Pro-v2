
import React, { useRef } from 'react';

interface UseScoreGesturesProps {
  onAdd: () => void;
  onSubtract: () => void;
  isLocked: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

// Constants for gesture detection
const SWIPE_THRESHOLD = 40; // Increased responsiveness for intended swipes
const TAP_MAX_DURATION_MS = 800;
const TAP_MAX_MOVE = 10; // Tight tolerance for taps to distinguish from scrolls

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
    // Only track primary pointer to avoid multi-touch chaos
    if (!e.isPrimary) return;
    
    if (onInteractionStart) onInteractionStart();
    
    startX.current = e.clientX;
    startY.current = e.clientY;
    startTime.current = Date.now();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (onInteractionEnd) onInteractionEnd();
    if (!e.isPrimary) return;
    if (startX.current === null || startY.current === null || startTime.current === null) return;
    
    const endX = e.clientX;
    const endY = e.clientY;
    const deltaTime = Date.now() - startTime.current;
    
    const deltaX = endX - startX.current;
    const deltaY = endY - startY.current; // Positive = Down, Negative = Up
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Rule 1: TAP (Very strict movement check)
    // Must be short duration and very little movement
    if (deltaTime < TAP_MAX_DURATION_MS && absDeltaX < TAP_MAX_MOVE && absDeltaY < TAP_MAX_MOVE) {
      if (e.cancelable) e.preventDefault(); // Prevent ghost clicks
      onAdd();
    } 
    // Rule 2: Vertical Swipes (Must be dominant axis AND significantly more vertical than horizontal)
    // We increase sensitivity but enforce stricter angle check
    else if (absDeltaY > SWIPE_THRESHOLD && absDeltaY > (absDeltaX * 1.5)) {
        // If it's a clear vertical swipe, prevent default (scrolling)
        if (e.cancelable) e.preventDefault();
        
        if (deltaY < 0) {
           // Swipe Up -> ADD
           onAdd(); 
        } else {
           // Swipe Down -> SUBTRACT
           onSubtract(); 
        }
    }
    
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

  const handleClick = (e: React.MouseEvent) => {
      // Prevent double firing if pointer events handled it, but don't block
      // legitimate button clicks that might bubble up if not handled by pointer
      e.stopPropagation();
  };

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onClick: handleClick
  };
};