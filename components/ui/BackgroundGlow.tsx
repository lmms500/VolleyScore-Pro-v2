

import React, { memo } from 'react';
import { motion, Variants } from 'framer-motion';
import { TeamColor } from '../../types';
import { resolveTheme } from '../../utils/colors';

interface BackgroundGlowProps {
  isSwapped: boolean;
  isFullscreen: boolean;
  colorA?: TeamColor;
  colorB?: TeamColor;
}

export const BackgroundGlow: React.FC<BackgroundGlowProps> = memo(({ isSwapped, isFullscreen, colorA = 'indigo', colorB = 'rose' }) => {
  
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

  // Resolve Tailwind classes dynamically
  const themeA = resolveTheme(colorA);
  const themeB = resolveTheme(colorB);
  
  // Extract Background Color - Needs slight hack if arbitrary value, but resolveTheme provides bg-classes.
  // We need the raw color class for the blob. For arbitrary values like `bg-[#f00]/10`, it's tricky to get just the color for the blob.
  // We will assume `theme.halo` is a solid background class (bg-indigo-500 or bg-[#hex]) which works for the blob.
  const colorAClass = themeA.halo;
  const colorBClass = themeB.halo;

  const topColor = isSwapped ? colorBClass : colorAClass;
  const bottomColor = isSwapped ? colorAClass : colorBClass;

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
             ${topColor}
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
             ${bottomColor}
         `}
       />
    </div>
  );
});