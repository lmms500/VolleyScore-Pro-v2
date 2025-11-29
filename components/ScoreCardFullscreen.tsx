import React, { useState, memo, useMemo, useRef } from 'react';
import { TeamId } from '../types';
import { useScoreGestures } from '../hooks/useScoreGestures';
import { ScoreTicker } from './ui/ScoreTicker';
import { motion } from 'framer-motion';
import { layoutTransition, pulseHeartbeat } from '../utils/animations';
import { TrackingGlow } from './ui/TrackingGlow';

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
  const numberRef = useRef<HTMLDivElement>(null);

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
      glowShadow: 'drop-shadow-[0_0_50px_rgba(99,102,241,0.6)]'
    },
    rose: {
      text: 'text-white', 
      glowShadow: 'drop-shadow-[0_0_60px_rgba(244,63,94,0.8)]'
    }
  }[colorTheme];

  // --- THE GOLDEN POINT LOGIC ---
  const isCritical = isMatchPoint || isSetPoint;
  
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

  // Offset Logic: Use translate-x to separate numbers from the center spine in landscape
  const offsetClass = alignment === 'left' 
      ? 'landscape:-translate-x-[6vw]' 
      : 'landscape:translate-x-[6vw]';

  return (
    <>
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
                  flex items-center justify-center w-full h-full
                  transition-transform duration-150
                  ${isPressed ? 'scale-95' : 'scale-100'}
                  will-change-transform
              `}
              style={{ 
                  fontSize: 'clamp(8rem, 28vmax, 22rem)',
                  lineHeight: 0.8
              }}
          >
              {/* 
                 OFFSET WRAPPER 
                 Moves the scoring unit horizontally to create visual separation from center.
              */}
              <div className={`transform transition-transform duration-500 ${offsetClass}`}>
                  
                  {/* 
                     ANCHOR WRAPPER 
                     Relative + Inline-Flex: Hugs the score number tightly.
                  */}
                  <div className="relative inline-flex items-center justify-center pointer-events-none">
                      
                      {/* Score Ticker Wrapper - Targeted by TrackingGlow */}
                      <motion.div 
                        ref={numberRef} 
                        className="relative z-10 flex items-center justify-center"
                        variants={pulseHeartbeat}
                        animate={isCritical ? "pulse" : "idle"}
                      >
                         {/* 
                            Combine both refs: 
                            - scoreRefCallback for HUD measurements 
                            - numberRef for Glow tracking (We pass numberRef to component, 
                              but HUD needs the actual element. Since HUD logic is separate, 
                              we can just use an inner ref here or merge them. 
                              For simplicity, we attach scoreRefCallback to the inner ticker)
                         */}
                        <div ref={scoreRefCallback}>
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
                      </motion.div>
                  </div>
              </div>
          </div>
      </motion.div>

      {/* 
          Separate Glow Component 
          This sits outside the layout flow via Portal, tracking the numberRef 
          to ensure perfect centering regardless of container clipping or offsets.
      */}
      <TrackingGlow 
          targetRef={numberRef}
          colorTheme={colorTheme}
          isServing={!!isServing}
          isCritical={isCritical}
          isMatchPoint={isMatchPoint}
          isPressed={isPressed}
      />
    </>
  );
});