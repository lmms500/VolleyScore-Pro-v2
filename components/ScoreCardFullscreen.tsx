import React, { useState } from 'react';
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
      bg: 'bg-indigo-500',
      glowRadial: 'bg-[radial-gradient(circle,rgba(99,102,241,0.5)_0%,rgba(99,102,241,0)_70%)]',
      glowShadow: 'drop-shadow-[0_0_30px_rgba(99,102,241,0.7)]'
    },
    rose: {
      text: 'text-white', 
      bg: 'bg-rose-600 saturate-150',
      glowRadial: 'bg-[radial-gradient(circle,rgba(244,63,94,0.6)_0%,rgba(244,63,94,0)_70%)]',
      glowShadow: 'drop-shadow-[0_0_40px_rgba(244,63,94,0.9)]'
    }
  }[colorTheme];

  // Logic to determine position on screen (Left/Top vs Right/Bottom)
  // Standard (No Swap): A is Left/Top, B is Right/Bottom
  // Swapped: A is Right/Bottom, B is Left/Top
  const isFirstPosition = reverseLayout 
    ? teamId === 'B' 
    : teamId === 'A';

  const positionClasses = isFirstPosition
    ? 'landscape:left-0 landscape:top-0 landscape:w-[50vw] landscape:h-[100dvh] top-0 left-0 w-[100vw] h-[50dvh]' // Left (Landscape) / Top (Portrait)
    : 'landscape:left-[50vw] landscape:top-0 landscape:w-[50vw] landscape:h-[100dvh] top-[50dvh] left-0 w-[100vw] h-[50dvh]'; // Right (Landscape) / Bottom (Portrait)

  const glowClass = (isMatchPoint || isSetPoint) ? theme.glowShadow : '';

  return (
    <div 
        className={`
            fixed z-10 flex flex-col justify-center items-center select-none overflow-visible
            ${positionClasses}
            ${isLocked ? 'opacity-50 grayscale' : ''}
            transition-all duration-300
        `}
        style={{ touchAction: 'none' }}
        {...gestureHandlers}
    >
            
        {/* The Number Wrapper */}
        <div className={`relative inline-flex items-center justify-center overflow-visible transition-transform duration-150 ${isPressed ? 'scale-95' : 'scale-100'}`}>
            
            {/* DYNAMIC GLOW */}
            <div 
                className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-[160%] h-[160%] rounded-full transition-opacity duration-700 ease-out 
                    ${theme.glowRadial} pointer-events-none mix-blend-screen blur-[80px]
                    ${isServing ? 'opacity-100' : 'opacity-0'}
                    ${isPressed ? 'opacity-80 scale-110' : ''}
                `} 
            />

            <span 
                ref={scoreRefCallback}
                className={`
                    block font-black leading-none tracking-tighter transition-all duration-150 relative z-10 
                    ${theme.text}
                    ${glowClass}
                    ${isPressed ? 'brightness-125' : ''}
                `}
                style={{ 
                    // Using vw/vh based on orientation to ensure consistency
                    fontSize: 'clamp(4rem, 18vmax, 13rem)',
                    textShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    lineHeight: 0.8
                }}
            >
                {score}
            </span>
        </div>
    </div>
  );
};