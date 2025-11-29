import React, { useState, memo } from 'react';
import { TeamId } from '../types';
import { useScoreGestures } from '../hooks/useScoreGestures';
import { ScoreTicker } from './ui/ScoreTicker';
import { motion } from 'framer-motion';
import { layoutTransition } from '../utils/animations';

interface ScoreCardFullscreenProps {
  teamId: TeamId;
  score: number;
  onAdd: () => void;
  onSubtract: () => void;
  isMatchPoint: boolean;
  isSetPoint: boolean;
  isDeuce?: boolean;
  inSuddenDeath?: boolean;
  colorTheme: 'indigo' | 'rose';
  isLocked?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  reverseLayout?: boolean;
  scoreRefCallback?: (node: HTMLElement | null) => void;
  isServing?: boolean;
  alignment?: 'left' | 'right';
}

export const ScoreCardFullscreen: React.FC<ScoreCardFullscreenProps> = memo(({
  teamId, score, onAdd, onSubtract,
  isMatchPoint, isSetPoint, isDeuce, inSuddenDeath, colorTheme,
  isLocked = false, onInteractionStart, onInteractionEnd, reverseLayout,
  scoreRefCallback, isServing, alignment = 'left'
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleStart = () => {
    setIsPressed(true);
    onInteractionStart?.();
  };

  const handleEnd = () => {
    setIsPressed(false);
    onInteractionEnd?.();
  };
  
  const gestureHandlers = useScoreGestures({
    onAdd, onSubtract, isLocked, 
    onInteractionStart: handleStart, 
    onInteractionEnd: handleEnd
  });

  const theme = {
    indigo: {
      text: 'text-white',
      haloColor: 'bg-indigo-500',
      glowShadow: 'drop-shadow-[0_0_30px_rgba(99,102,241,0.7)]'
    },
    rose: {
      text: 'text-white', 
      haloColor: 'bg-rose-600',
      glowShadow: 'drop-shadow-[0_0_40px_rgba(244,63,94,0.9)]'
    }
  }[colorTheme];

  const isFirstPosition = reverseLayout 
    ? teamId === 'B' 
    : teamId === 'A';

  const positionClasses = isFirstPosition
    ? 'landscape:left-0 landscape:top-0 landscape:w-[50vw] landscape:h-[100dvh] top-0 left-0 w-[100vw] h-[50dvh]' 
    : 'landscape:left-[50vw] landscape:top-0 landscape:w-[50vw] landscape:h-[100dvh] top-[50dvh] left-0 w-[100vw] h-[50dvh]';

  const glowClass = (isMatchPoint || isSetPoint) ? theme.glowShadow : '';

  // Alignment Logic: Push content AWAY from the center of the screen
  const paddingClass = alignment === 'left' 
      ? 'landscape:pr-[12vw] landscape:pl-0' 
      : 'landscape:pl-[12vw] landscape:pr-0';

  return (
    <motion.div 
        layout
        transition={layoutTransition}
        className={`
            fixed z-10 flex flex-col justify-center items-center select-none overflow-visible
            ${positionClasses}
            ${isLocked ? 'opacity-50 grayscale' : ''}
        `}
        style={{ touchAction: 'none' }}
        {...gestureHandlers}
    >
            
        {/* Outer Position Wrapper */}
        <div 
            className={`
                relative flex items-center justify-center overflow-visible transition-transform duration-150 w-full h-full
                ${paddingClass}
                ${isPressed ? 'scale-95' : 'scale-100'}
                will-change-transform
            `}
            style={{ 
                fontSize: 'clamp(8rem, 28vmax, 22rem)',
                lineHeight: 0.8
            }}
        >
            {/* 
               TIGHT WRAPPER 
               This is the key fix. We wrap the ticker and the glow in a tight inline-block.
               This ensures the glow is calculated relative to the text bounding box,
               regardless of the parent's padding or positioning.
            */}
            <div className="relative inline-flex items-center justify-center pointer-events-none">
                
                {/* THE PERFECT HALO - Positioned absolutely inside the tight wrapper */}
                <div 
                    className={`
                        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[1.2em] h-[1.2em] rounded-full transition-all duration-700 ease-out 
                        ${theme.haloColor} mix-blend-screen blur-[60px]
                        ${isServing ? 'opacity-40' : 'opacity-0'}
                        ${isPressed ? 'scale-110 opacity-60' : ''}
                        will-change-[opacity,transform] -z-10
                    `} 
                />

                {/* Score Ticker - Relative z-10 to sit above glow */}
                <div ref={scoreRefCallback} className="relative z-10">
                  <ScoreTicker 
                      value={score}
                      className={`
                          font-black leading-none tracking-tighter transition-all duration-150
                          ${theme.text}
                          ${glowClass}
                          ${isPressed ? 'brightness-125' : ''}
                      `}
                      style={{ 
                          textShadow: '0 20px 60px rgba(0,0,0,0.5)',
                      }}
                  />
                </div>
            </div>
        </div>
    </motion.div>
  );
});