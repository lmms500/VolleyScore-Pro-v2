import { useRef, useCallback } from 'react';
import type React from 'react';

// FIX: Update options to be a single object for clarity and extensibility.
interface UseScoreGesturesOptions {
  onAdd: () => void;
  onSubtract: () => void;
  isLocked?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

// FIX: Update returned handlers to use modern Pointer Events.
interface GestureHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
}

// FIX: Refactor hook to use Pointer Events, simplifying logic and resolving inconsistencies.
export const useScoreGestures = ({
  onAdd,
  onSubtract,
  isLocked = false,
  onInteractionStart,
  onInteractionEnd
}: UseScoreGesturesOptions): GestureHandlers => {
  const startYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const targetRef = useRef<EventTarget | null>(null);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current || startYRef.current === null) return;

    const threshold = 40; // Drag sensitivity (pixels)
    const deltaY = e.clientY - startYRef.current;

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        onSubtract(); // Drag DOWN -> Subtract Point
      } else {
        onAdd(); // Drag UP -> Add Point
      }
      
      startYRef.current = e.clientY; // Reset origin to prevent multiple triggers
    }
  }, [onAdd, onSubtract]);

  const releasePointer = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    startYRef.current = null;
    
    // Check if element has pointer capture before releasing
    if (targetRef.current && (targetRef.current as HTMLElement).hasPointerCapture?.(e.pointerId)) {
      (targetRef.current as HTMLElement).releasePointerCapture(e.pointerId);
    }

    // Clean up global listeners
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', releasePointer);
    window.removeEventListener('pointercancel', releasePointer);
    
    targetRef.current = null;

    if (onInteractionEnd) onInteractionEnd();
  }, [onInteractionEnd, handlePointerMove]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only act on main button (e.g., left-click or touch) and when not locked or already dragging
    if (isLocked || e.button !== 0 || isDraggingRef.current) return; 

    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    targetRef.current = e.currentTarget;
    
    // Capture the pointer to receive events even if it moves off the element
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    
    // Add global listeners to handle dragging and release anywhere on the page
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', releasePointer);
    window.addEventListener('pointercancel', releasePointer);
    
    if (onInteractionStart) onInteractionStart();
  }, [isLocked, onInteractionStart, handlePointerMove, releasePointer]);
  
  return {
    onPointerDown: handlePointerDown,
    onPointerUp: (e) => releasePointer(e.nativeEvent),
    onPointerCancel: (e) => releasePointer(e.nativeEvent),
    onPointerLeave: (e) => releasePointer(e.nativeEvent),
  };
};
