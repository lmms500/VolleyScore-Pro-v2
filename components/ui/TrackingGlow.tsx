import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface TrackingGlowProps {
  targetRef: React.RefObject<HTMLElement>;
  colorTheme: 'indigo' | 'rose';
  isServing: boolean;
  isCritical: boolean;
  isMatchPoint: boolean;
  isPressed: boolean;
}

export const TrackingGlow: React.FC<TrackingGlowProps> = ({
  targetRef,
  colorTheme,
  isServing,
  isCritical,
  isMatchPoint,
  isPressed
}) => {
  const glowRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);

  // High-performance loop to track the target element
  useLayoutEffect(() => {
    let rAFId: number;

    const updatePosition = () => {
      if (targetRef.current && glowRef.current) {
        const rect = targetRef.current.getBoundingClientRect();
        
        // Calculate absolute center
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Determine size based on the height of the number (proportional scaling)
        // We use height because width varies drastically between "1" and "10"
        const calculatedSize = rect.height * 1.5; 
        
        if (Math.abs(calculatedSize - size) > 5) {
            setSize(calculatedSize);
        }

        // Apply hardware-accelerated transform directly to DOM for 0 lag during layout shifts
        glowRef.current.style.transform = `translate3d(${centerX}px, ${centerY}px, 0) translate(-50%, -50%)`;
        glowRef.current.style.width = `${calculatedSize}px`;
        glowRef.current.style.height = `${calculatedSize}px`;
      }
      rAFId = requestAnimationFrame(updatePosition);
    };

    // Start loop
    updatePosition();

    return () => cancelAnimationFrame(rAFId);
  }, [targetRef, size]); 

  const theme = {
    indigo: { haloColor: 'bg-indigo-500' },
    rose: { haloColor: 'bg-rose-600' }
  }[colorTheme];

  const haloColorClass = isMatchPoint ? 'bg-amber-500 saturate-150' : theme.haloColor;

  return (
    <motion.div
      ref={glowRef}
      className={`
        fixed top-0 left-0 z-[5] rounded-full aspect-square pointer-events-none
        mix-blend-screen blur-[60px] md:blur-[100px] will-change-transform
        ${haloColorClass}
      `}
      animate={
        isPressed 
          ? { scale: 1.1, opacity: 0.8 } 
          : isCritical 
            ? { 
                scale: [1, 1.35, 1],
                // Increased opacity range for critical moments
                opacity: isMatchPoint ? [0.6, 1, 0.6] : [0.4, 0.8, 0.4],
              }
            : { 
                scale: 1, 
                opacity: isServing ? 0.4 : 0 
              }
      }
      transition={
        isCritical 
          ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.3, ease: "easeOut" }
      }
    />
  );
};