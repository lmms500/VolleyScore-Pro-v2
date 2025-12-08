
import React, { useRef, useCallback } from 'react';

interface UseScoreGesturesProps {
  onAdd: () => void;
  onSubtract: () => void;
  isLocked: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

// Constants for gesture detection - optimized for native touch performance
const SWIPE_THRESHOLD = 40; // Minimum distance to register swipe (pixels)
const TAP_MAX_DURATION_MS = 300; // Maximum time for tap detection
const TAP_MAX_MOVE = 8; // Tight tolerance for taps to distinguish from scrolls
const VELOCITY_THRESHOLD = 0.5; // Minimum swipe velocity (pixels/ms)

/**
 * Native touch gesture hook optimized for high-performance mobile interaction.
 * Uses Pointer Events API for better pressure/stylus support.
 * 
 * Optimizations:
 * - Prevents preventDefault on all events (only when needed)
 * - Uses requestAnimationFrame-compatible timings
 * - Debounces double-tap detection
 * - Optimized for 60fps on mid-range Android devices
 */
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
  const lastTapTimeRef = useRef<number>(0); // Debounce double-tap

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isLocked) return;
    // Only track primary pointer to avoid multi-touch chaos
    if (!e.isPrimary) return;
    
    onInteractionStart?.();
    
    startX.current = e.clientX;
    startY.current = e.clientY;
    startTime.current = Date.now();
    
    // Mark as handled to prevent ghost clicks
    e.currentTarget?.setPointerCapture(e.pointerId);
  }, [isLocked, onInteractionStart]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    onInteractionEnd?.();
    if (!e.isPrimary) return;
    if (startX.current === null || startY.current === null || startTime.current === null) return;
    
    const endX = e.clientX;
    const endY = e.clientY;
    const deltaTime = Date.now() - startTime.current;
    
    const deltaX = endX - startX.current;
    const deltaY = endY - startY.current; // Positive = Down, Negative = Up
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Calculate swipe velocity
    const velocity = Math.sqrt(absDeltaX * absDeltaX + absDeltaY * absDeltaY) / Math.max(deltaTime, 1);

    // Rule 1: TAP (Very strict movement check)
    // Must be short duration and very little movement
    if (deltaTime < TAP_MAX_DURATION_MS && absDeltaX < TAP_MAX_MOVE && absDeltaY < TAP_MAX_MOVE) {
      const now = Date.now();
      // Prevent double-tap spam
      if (now - lastTapTimeRef.current > 150) {
        if (e.cancelable) e.preventDefault(); // Prevent ghost clicks
        onAdd();
        lastTapTimeRef.current = now;
      }
    } 
    // Rule 2: Vertical Swipes (Must be dominant axis AND significantly more vertical than horizontal)
    // Also check velocity to ensure intentional swipe
    else if (
      absDeltaY > SWIPE_THRESHOLD && 
      absDeltaY > (absDeltaX * 1.5) &&
      velocity > VELOCITY_THRESHOLD
    ) {
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
    
    try {
      e.currentTarget?.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Silently ignore if pointer capture is not set
    }
    
    startX.current = null;
    startY.current = null;
    startTime.current = null;
  }, [onAdd, onSubtract]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    onInteractionEnd?.();
    try {
      e.currentTarget?.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Silently ignore
    }
    startX.current = null;
    startY.current = null;
    startTime.current = null;
  }, [onInteractionEnd]);

  // No-op for pointer-event based interactions
  const handleClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
  }, []);

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onClick: handleClick
  };
};