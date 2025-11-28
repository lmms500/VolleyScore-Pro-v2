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
  const SWIPE_THRESHOLD = 20; 
  const TAP_THRESHOLD = 10;   

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLocked) return; 
    
    if (onInteractionStart) onInteractionStart();
    
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    startY.current = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (onInteractionEnd) onInteractionEnd();
    if (startY.current === null) return;
    
    e.currentTarget.releasePointerCapture(e.pointerId);

    const endY = e.clientY;
    const distance = startY.current - endY; 
    const absDist = Math.abs(distance);

    if (absDist > SWIPE_THRESHOLD) {
      if (distance > 0) onAdd();      
      else onSubtract();              
    } else if (absDist < TAP_THRESHOLD) {
      onAdd();
    }
    startY.current = null;
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (onInteractionEnd) onInteractionEnd();
    startY.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return {
    handlePointerDown,
    handlePointerUp,
    handlePointerCancel
  };
};