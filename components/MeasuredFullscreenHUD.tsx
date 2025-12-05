
import React, { memo } from 'react';
import { HudPlacement } from '../hooks/useHudMeasure';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { TeamColor } from '../types';
import { resolveTheme } from '../utils/colors';

interface MeasuredFullscreenHUDProps {
  placement: HudPlacement;
  setsLeft: number;
  setsRight: number;
  colorLeft: TeamColor;
  colorRight: TeamColor;
}

const flipTransition = {
  duration: 0.35,
  ease: [0.22, 0.61, 0.36, 1] as const // Custom Bezier for premium feel
};

const flipVariants: Variants = {
  initial: { rotateY: -90, opacity: 0, scale: 0.95 },
  animate: { rotateY: 0, opacity: 1, scale: 1, transition: flipTransition },
  exit: { rotateY: 90, opacity: 0, scale: 0.95, transition: flipTransition }
};

const SetNumber = memo(({ value, color }: { value: number, color: TeamColor }) => {
    const theme = resolveTheme(color);
    const textColor = color === 'rose' || color === 'amber' || color === 'fuchsia'
        ? `${theme.text} drop-shadow-[0_0_20px_currentColor] brightness-125 saturate-150`
        : `${theme.text} drop-shadow-[0_0_20px_currentColor]`;

    return (
        <div className="w-[60px] flex flex-col justify-center items-center relative">
            <motion.span
                key={value} // Triggers animation on change
                initial={{ scale: 0.5, opacity: 0, filter: 'blur(10px)' }}
                animate={{ 
                    scale: [1.5, 1], 
                    opacity: 1, 
                    filter: 'blur(0px)',
                    textShadow: [
                        `0 0 50px currentColor`, 
                        `0 4px 12px rgba(0,0,0,0.5)`
                    ]
                }} 
                transition={{ 
                    duration: 0.6, 
                    ease: [0.16, 1, 0.3, 1] // Ultra snappy spring-like bezier
                }}
                className={`font-black text-5xl leading-none tabular-nums ${textColor}`}
                style={{ 
                    display: 'inline-block'
                }}
            >
                {value}
            </motion.span>
        </div>
    );
});

export const MeasuredFullscreenHUD: React.FC<MeasuredFullscreenHUDProps> = memo(({
  placement,
  setsLeft, setsRight, 
  colorLeft, colorRight
}) => {
  
  if (!placement.visible) return null;

  // Key to trigger 3D Flip Animation when sides swap
  const layoutKey = `${colorLeft}-${colorRight}`;

  return (
    <div 
        style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${placement.scale})`,
            zIndex: 40,
            pointerEvents: 'none',
            perspective: '1000px', // Mandatory for 3D Flip
            width: 'max-content',
            height: 'max-content'
        }} 
        className="flex items-center justify-center origin-center"
    >
        <AnimatePresence mode="wait">
            <motion.div
                key={layoutKey}
                variants={flipVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ transformStyle: 'preserve-3d' }}
                className="relative"
            >
                {/* Neo-Glass Container */}
                <div className={`
                    relative flex items-center justify-center gap-0 
                    px-6 py-3 rounded-[1.5rem]
                    bg-white/20 dark:bg-black/20 
                    backdrop-blur-2xl border border-white/20 dark:border-white/10 
                    shadow-[0_0_40px_rgba(0,0,0,0.2)] dark:shadow-[0_0_40px_rgba(0,0,0,0.6)]
                    overflow-hidden
                    min-w-[200px] min-h-[80px]
                    flex-shrink-0
                `}>
                    {/* Fixed Internal Glow */}
                    <div 
                        className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay opacity-50"
                        style={{
                            background: 'radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 70%)'
                        }}
                    />

                    {/* Content Layer */}
                    <div className="relative z-10 flex items-center justify-center gap-1">
                        <SetNumber value={setsLeft} color={colorLeft} />

                        {/* Divider */}
                        <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-black/20 dark:via-white/20 to-transparent mx-1" />

                        <SetNumber value={setsRight} color={colorRight} />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    </div>
  );
});
