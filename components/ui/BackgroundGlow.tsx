import React, { memo } from 'react';
import { motion, Variants } from 'framer-motion';
import { TeamColor } from '../../types';
import { TEAM_COLORS } from '../../utils/colors';

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
  const colorAClass = TEAM_COLORS[colorA].halo.replace('bg-', 'bg-') + '-600'; // Hacky but functional mapping if colors.ts aligns
  const colorBClass = TEAM_COLORS[colorB].halo.replace('bg-', 'bg-') + '-600';
  
  // Explicit Map for safety in case halo classes drift
  const colorMap: Record<TeamColor, string> = {
      indigo: 'bg-indigo-600',
      rose: 'bg-rose-600',
      emerald: 'bg-emerald-600',
      amber: 'bg-amber-600',
      sky: 'bg-sky-600',
      violet: 'bg-violet-600',
      slate: 'bg-slate-600',
      fuchsia: 'bg-fuchsia-600'
  };

  const topColor = isSwapped ? colorMap[colorB] : colorMap[colorA];
  const bottomColor = isSwapped ? colorMap[colorA] : colorMap[colorB];

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