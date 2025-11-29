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

const ScoreNumberDisplay = memo(({ score, theme, textEffectClass, isPressed, scoreRefCallback, numberRef, isCritical }: any) => {
    return (
        <div className="relative inline-flex items-center justify-center pointer-events-none">
            {/* Score Ticker Wrapper - Targeted by TrackingGlow */}
            <motion.div 
                ref={numberRef} 
                className="relative z-10 flex items-center justify-center will-change-transform"
                variants={pulseHeartbeat}
                animate={isCritical ? "pulse" : "idle"}
            >
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
                            textShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        }}
                    />
                </div>
            </motion.div>
        </div>
    );
});

export const ScoreCardFullscreen: React.FC<ScoreCardFullscreenProps> = memo(({
  teamId, score, onAdd, onSubtract,
  isMatchPoint, isSetPoint, isDeuce, inSuddenDeath, colorTheme,
  isLocked = false, onInteractionStart, onInteractionEnd, reverseLayout,
  scoreRefCallback, isServing, alignment = 'left'
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const numberRef = useRef<HTMLDivElement>(null);

  // Memoized handlers to avoid re-creating gesture config on every render
  const handleStart = React.useCallback(() => {
    setIsPressed(true);
    onInteractionStart?.();
  }, [onInteractionStart]);

  const handleEnd = React.useCallback(() => {
    setIsPressed(false);
    onInteractionEnd?.();
  }, [onInteractionEnd]);
  
  const gestureHandlers = useScoreGestures({
    onAdd, onSubtract, isLocked, 
    onInteractionStart: handleStart, 
    onInteractionEnd: handleEnd
  });

  const theme = useMemo(() => ({
    indigo: {
      text: 'text-white',
      glowShadow: 'drop-shadow-[0_0_50px_rgba(99,102,241,0.6)]'
    },
    rose: {
      text: 'text-white', 
      glowShadow: 'drop-shadow-[0_0_60px_rgba(244,63,94,0.8)]'
    }
  })[colorTheme], [colorTheme]);

  const isCritical = isMatchPoint || isSetPoint;
  
  const textEffectClass = useMemo(() => {
    if (isMatchPoint) return 'drop-shadow-[0_0_60px_rgba(251,191,36,0.9)] brightness-110'; 
    if (isCritical) return theme.glowShadow; 
    return ''; 
  }, [isMatchPoint, isCritical, theme.glowShadow]);

  const isFirstPosition = reverseLayout ? teamId === 'B' : teamId === 'A';

  const positionClasses = isFirstPosition
    ? 'landscape:left-0 landscape:top-0 landscape:w-[50vw] landscape:h-[100dvh] top-0 left-0 w-[100vw] h-[50dvh]' 
    : 'landscape:left-[50vw] landscape:top-0 landscape:w-[50vw] landscape:h-[100dvh] top-[50dvh] left-0 w-[100vw] h-[50dvh]';

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
          `}
          style={{ touchAction: 'none' }}
          {...gestureHandlers}
      >
          {/* Inner Content Wrapper */}
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
              <div className={`transform transition-transform duration-500 ${offsetClass}`}>
                  <ScoreNumberDisplay 
                      score={score} 
                      theme={theme} 
                      textEffectClass={textEffectClass} 
                      isPressed={isPressed} 
                      scoreRefCallback={scoreRefCallback} 
                      numberRef={numberRef}
                      isCritical={isCritical}
                  />
              </div>
          </div>
      </motion.div>

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