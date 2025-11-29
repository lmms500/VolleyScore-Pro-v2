import React from 'react';
import { TeamId } from '../types';
import { useScoreGestures } from '../hooks/useScoreGestures';

interface ScoreCardFullscreenProps {
  teamId: TeamId;
  score: number;
  onAdd: () => void;
  onSubtract: () => void;
  // Status props retained for Glow Logic, but badges are removed
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

export const ScoreCardFullscreen: React.FC<ScoreCardFullscreenProps> = ({
  teamId, score, onAdd, onSubtract,
  isMatchPoint, isSetPoint, isDeuce, inSuddenDeath, colorTheme,
  isLocked = false, onInteractionStart, onInteractionEnd, reverseLayout,
  scoreRefCallback, isServing
}) => {
  
  const gestureHandlers = useScoreGestures({
    onAdd, onSubtract, isLocked, onInteractionStart, onInteractionEnd
  });

  const theme = {
    indigo: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500',
      glowRadial: 'bg-[radial-gradient(circle,rgba(99,102,241,0.5)_0%,rgba(99,102,241,0)_70%)]',
      glowShadow: 'drop-shadow-[0_0_30px_rgba(99,102,241,0.7)]'
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500',
      glowRadial: 'bg-[radial-gradient(circle,rgba(244,63,94,0.5)_0%,rgba(244,63,94,0)_70%)]',
      glowShadow: 'drop-shadow-[0_0_30px_rgba(244,63,94,0.7)]'
    }
  }[colorTheme];

  const orderClass = reverseLayout 
    ? (teamId === 'A' ? 'order-last' : 'order-first') 
    : (teamId === 'A' ? 'order-first' : 'order-last');

  const glowClass = (isMatchPoint || isSetPoint) ? theme.glowShadow : '';

  return (
    <div 
        className={`
            flex-1 relative h-full flex flex-col justify-center select-none overflow-visible
            ${orderClass}
            ${isLocked ? 'opacity-50 grayscale' : ''}
            transition-all duration-300
        `}
        style={{ touchAction: 'none' }}
        {...gestureHandlers}
    >
      
      {/* 
         Content Container:
         1. Uses w-full to fill the 50% split.
         2. Uses flex/items-center to mathematically center the content within this 50% block.
         3. Ignores safe-area-insets for horizontal positioning to ensure perfect symmetry relative to screen center.
      */}
      <div className="w-full h-full flex items-center justify-center relative z-10 overflow-visible">
            
            {/* The Number Wrapper - Constrained Max Width to ensure HUD Gap */}
            <div className="relative inline-flex items-center justify-center overflow-visible max-w-[40vw]">
                
                {/* DYNAMIC GLOW */}
                <div 
                    className={`
                        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[160%] h-[160%] rounded-full transition-opacity duration-700 ease-out 
                        ${theme.glowRadial} pointer-events-none mix-blend-screen blur-[80px]
                        ${isServing ? 'opacity-100' : 'opacity-0'}
                    `} 
                />

                <span 
                    ref={scoreRefCallback}
                    className={`block font-black leading-none text-white tracking-tighter transition-all duration-300 relative z-10 ${glowClass}`}
                    style={{ 
                        // Adjusted clamp for elegance and safety gap
                        fontSize: 'clamp(4rem, 18vw, 13rem)',
                        textShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        lineHeight: 0.8
                    }}
                >
                    {score}
                </span>
            </div>
      </div>
    </div>
  );
};