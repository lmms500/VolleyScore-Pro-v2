import React, { memo } from 'react';
import { motion, Variants } from 'framer-motion';

interface BackgroundGlowProps {
  isSwapped: boolean;
  isFullscreen: boolean;
}

export const BackgroundGlow: React.FC<BackgroundGlowProps> = memo(({ isSwapped, isFullscreen }) => {
  
  // Variants for Normal (Intense) vs Fullscreen (Subtle) modes
  const topBlobVariants: Variants = {
    normal: {
      opacity: [0.4, 0.6, 0.4],
      scale: [1, 1.15, 1],
      x: [0, 20, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    fullscreen: {
      opacity: 0.15,
      scale: 1,
      x: 0,
      transition: { duration: 1.5 }
    }
  };

  const bottomBlobVariants: Variants = {
    normal: {
      opacity: [0.4, 0.65, 0.4],
      scale: [1, 1.2, 1],
      x: [0, -20, 0],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1
      }
    },
    fullscreen: {
      opacity: 0.15,
      scale: 1,
      x: 0,
      transition: { duration: 1.5 }
    }
  };

  // Colors based on side (A=Indigo, B=Rose)
  // isSwapped=false: A (Indigo) Left, B (Rose) Right
  const colorTop = isSwapped ? 'bg-rose-600' : 'bg-indigo-600';
  const colorBottom = isSwapped ? 'bg-indigo-600' : 'bg-rose-600';

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
       {/* Top Left Blob - Main Glow */}
       <motion.div
         initial={false}
         animate={isFullscreen ? "fullscreen" : "normal"}
         variants={topBlobVariants}
         className={`
             absolute -top-[30%] -left-[20%] w-[90vw] h-[90vw] md:w-[60vw] md:h-[60vw]
             rounded-full mix-blend-screen blur-[120px] sm:blur-[160px] saturate-150
             will-change-[transform,opacity]
             ${colorTop}
         `}
       />

       {/* Bottom Right Blob - Secondary Glow */}
       <motion.div
         initial={false}
         animate={isFullscreen ? "fullscreen" : "normal"}
         variants={bottomBlobVariants}
         className={`
             absolute -bottom-[30%] -right-[20%] w-[90vw] h-[90vw] md:w-[60vw] md:h-[60vw]
             rounded-full mix-blend-screen blur-[120px] sm:blur-[160px] saturate-150
             will-change-[transform,opacity]
             ${colorBottom}
         `}
       />
    </div>
  );
});