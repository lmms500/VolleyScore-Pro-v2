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
}

export const ScoreCardFullscreen: React.FC<ScoreCardFullscreenProps> = memo(({
  teamId, score, onAdd, onSubtract,
  isMatchPoint, isSetPoint, isDeuce, inSuddenDeath, colorTheme,
  isLocked = false, onInteractionStart, onInteractionEnd, reverseLayout,
  scoreRefCallback, isServing
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
            
        {/* 
            Wrapper with Font Size Definition
            Moved font-size style here so both the Ticker and the Halo use the same em reference.
        */}
        <div 
            className={`
                relative inline-flex items-center justify-center overflow-visible transition-transform duration-150 w-full
                ${isPressed ? 'scale-95' : 'scale-100'}
                will-change-transform
            `}
            style={{ 
                fontSize: 'clamp(4rem, 18vmax, 13rem)',
                lineHeight: 0.8
            }}
        >
            
            {/* 
                THE PERFECT HALO 
                - Tight circle using em units
                - Reduced blur for a cleaner "neon light" feel
                - Stays behind the text
            */}
            <div 
                className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-[1.3em] h-[1.3em] rounded-full transition-all duration-700 ease-out 
                    ${theme.haloColor} pointer-events-none mix-blend-screen blur-[50px]
                    ${isServing ? 'opacity-40' : 'opacity-0'}
                    ${isPressed ? 'scale-110 opacity-60' : ''}
                    will-change-[opacity,transform] -z-10
                `} 
            />

            <div ref={scoreRefCallback} className="w-full flex justify-center relative z-10">
              <ScoreTicker 
                  value={score}
                  className={`
                      font-black leading-none tracking-tighter transition-all duration-150 relative z-10 
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
    </motion.div>
  );
});