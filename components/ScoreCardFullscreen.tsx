import React, { useState, memo, useMemo } from 'react';
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
      glowShadow: 'drop-shadow-[0_0_50px_rgba(99,102,241,0.6)]'
    },
    rose: {
      text: 'text-white', 
      haloColor: 'bg-rose-600',
      glowShadow: 'drop-shadow-[0_0_60px_rgba(244,63,94,0.8)]'
    }
  }[colorTheme];

  // --- THE GOLDEN POINT LOGIC ---
  const isCritical = isMatchPoint || isSetPoint;
  
  // Determine Halo Appearance
  const haloColorClass = useMemo(() => {
    if (isMatchPoint) return 'bg-amber-500 saturate-150'; // Golden Point
    return theme.haloColor; // Team Color
  }, [isMatchPoint, theme.haloColor]);

  // Determine Text Glow/Shadow
  const textEffectClass = useMemo(() => {
    if (isMatchPoint) return 'drop-shadow-[0_0_60px_rgba(251,191,36,0.9)] brightness-110'; // Gold Glow
    if (isCritical) return theme.glowShadow; // Intense Team Glow
    return ''; // Standard
  }, [isMatchPoint, isCritical, theme.glowShadow]);

  // Layout Logic
  const isFirstPosition = reverseLayout 
    ? teamId === 'B' 
    : teamId === 'A';

  const positionClasses = isFirstPosition
    ? 'landscape:left-0 landscape:top-0 landscape:w-[50vw] landscape:h-[100dvh] top-0 left-0 w-[100vw] h-[50dvh]' 
    : 'landscape:left-[50vw] landscape:top-0 landscape:w-[50vw] landscape:h-[100dvh] top-[50dvh] left-0 w-[100vw] h-[50dvh]';

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
            
        {/* Inner Content Wrapper - Scales on Press */}
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
               THE TIGHT WRAPPER 
               This is crucial for centering. It shrink-wraps the text content.
               The Halo is absolute relative to THIS, ensuring true optical centering.
            */}
            <div className="relative inline-flex items-center justify-center pointer-events-none">
                
                {/* 
                  THE HALO (Motion Implementation)
                  Responsive to game state: Idle, Serving, Critical, Golden Point 
                */}
                <motion.div 
                    className={`
                        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[1.5em] h-[1.5em] rounded-full aspect-square
                        mix-blend-screen blur-[60px] md:blur-[80px]
                        will-change-[opacity,transform] z-[-1]
                        ${haloColorClass}
                    `}
                    animate={
                        isPressed 
                        ? { scale: 1.1, opacity: 0.7 } 
                        : isCritical 
                            ? { 
                                // Heartbeat / Tension Pulse
                                scale: [1, 1.35, 1],
                                opacity: isMatchPoint ? [0.4, 0.8, 0.4] : [0.3, 0.6, 0.3],
                              }
                            : { 
                                // Standard State (Serving or Idle)
                                scale: 1, 
                                opacity: isServing ? 0.35 : 0 
                              }
                    }
                    transition={
                        isCritical 
                        ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } // Slow deep breath
                        : { duration: 0.5, ease: "easeOut" } // Standard transition
                    }
                />

                {/* Score Ticker Wrapper */}
                <div ref={scoreRefCallback} className="relative z-10 flex items-center justify-center">
                  <ScoreTicker 
                      value={score}
                      className={`
                          font-black leading-none tracking-tighter transition-all duration-300
                          ${theme.text}
                          ${textEffectClass}
                          ${isPressed ? 'brightness-125' : ''}
                      `}
                      style={{ 
                          // Base shadow for depth, separate from the glow
                          textShadow: '0 20px 60px rgba(0,0,0,0.5)',
                      }}
                  />
                </div>
            </div>
        </div>
    </motion.div>
  );
});