
import React, { useState, memo, useMemo, useRef, useCallback } from 'react';
import { TeamId, Team, SkillType, GameConfig, TeamColor } from '../types';
import { useScoreGestures } from '../hooks/useScoreGestures';
import { ScoreTicker } from './ui/ScoreTicker';
import { motion, AnimatePresence } from 'framer-motion';
import { pulseHeartbeat, layoutTransition } from '../utils/animations';
import { useGameAudio } from '../hooks/useGameAudio';
import { ScoutModal } from './modals/ScoutModal';
import { resolveTheme } from '../utils/colors';
import { useLayoutManager } from '../contexts/LayoutContext';

interface ScoreCardFullscreenProps {
  teamId: TeamId;
  team: Team; 
  score: number;
  onAdd: (teamId: TeamId, playerId?: string, skill?: SkillType) => void;
  onSubtract: () => void;
  isMatchPoint: boolean;
  isSetPoint: boolean;
  isDeuce?: boolean;
  inSuddenDeath?: boolean;
  colorTheme?: TeamColor; 
  isLocked?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  reverseLayout?: boolean;
  scoreRefCallback?: (node: HTMLElement | null) => void;
  isServing?: boolean;
  alignment?: 'left' | 'right';
  config: GameConfig; 
}

const ScoreNumberDisplay = memo(({ 
    score, 
    theme, 
    textEffectClass, 
    isPressed, 
    scoreRefCallback, 
    numberRef, 
    isCritical,
    isMatchPoint,
    isServing,
    scale,
    mode
}: any) => {

    // FIX: Use a stronger amber color for Match Point visibility
    const haloColorClass = isMatchPoint ? 'bg-amber-500 saturate-150' : theme.halo;
    
    // Adjust Halo size/opacity based on Layout Mode to prevent visual clutter
    const haloSize = mode === 'ultra' ? '1.1em' : '1.5em';
    const haloOpacityBase = mode === 'ultra' ? 0.2 : 0.3;

    return (
        <div 
            className="relative grid place-items-center w-full transition-all duration-500 ease-out" 
            style={{ 
                lineHeight: 0.85,
            }}
        >
            {/* Optimized Halo with Screen Blend Mode */}
            <motion.div
                className={`
                    col-start-1 row-start-1
                    rounded-full aspect-square pointer-events-none z-0
                    ${haloColorClass}
                    justify-self-center self-center
                    mix-blend-multiply dark:mix-blend-screen
                    blur-[60px] md:blur-[120px] will-change-[transform,opacity]
                `}
                style={{ 
                    width: haloSize, 
                    height: haloSize,
                    transform: 'translate3d(0,0,0)' // Force GPU
                }}
                animate={
                    isPressed 
                    ? { scale: 1.1, opacity: 0.5 } 
                    : isCritical 
                        ? { 
                            scale: [1, 1.2, 1],
                            opacity: isMatchPoint ? [0.4, 0.7, 0.4] : [0.2, 0.5, 0.2],
                        }
                        : { 
                            scale: 1, 
                            opacity: isServing ? haloOpacityBase : 0
                        }
                }
                transition={
                    isCritical 
                    ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.4, ease: "easeOut" }
                }
            />

            <motion.div 
                ref={numberRef} 
                className="col-start-1 row-start-1 relative z-10 flex items-center justify-center will-change-transform"
                variants={pulseHeartbeat}
                animate={isCritical ? "pulse" : "idle"}
            >
                <div ref={scoreRefCallback}>
                    <ScoreTicker 
                        value={score}
                        className={`
                            font-black leading-none tracking-tighter transition-all duration-300
                            text-slate-900 dark:text-white
                            ${textEffectClass}
                            ${isPressed ? 'scale-95 opacity-90' : ''}
                        `}
                    />
                </div>
            </motion.div>
        </div>
    );
});

export const ScoreCardFullscreen: React.FC<ScoreCardFullscreenProps> = memo(({
  teamId, team, score, onAdd, onSubtract,
  isMatchPoint, isSetPoint, isDeuce, inSuddenDeath, 
  isLocked = false, onInteractionStart, onInteractionEnd, reverseLayout,
  scoreRefCallback, isServing, alignment = 'left', config, colorTheme
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showScout, setShowScout] = useState(false);
  const [isInteractionLocked, setIsInteractionLocked] = useState(false);
  
  const numberRef = useRef<HTMLDivElement>(null);
  const audio = useGameAudio(config);
  
  // Consume Layout Context for Dynamic Scaling
  const { scale, mode, isLandscape } = useLayoutManager();

  const handleStart = useCallback(() => {
    setIsPressed(true);
    onInteractionStart?.();
  }, [onInteractionStart]);

  const handleEnd = useCallback(() => {
    setIsPressed(false);
    onInteractionEnd?.();
  }, [onInteractionEnd]);

  const handleScoutClose = useCallback(() => {
    setShowScout(false);
    setIsInteractionLocked(true);
    const t = setTimeout(() => setIsInteractionLocked(false), 300);
    return () => clearTimeout(t);
  }, []);

  const handleAddWrapper = useCallback(() => {
      if (isInteractionLocked) return;

      if (config.enablePlayerStats) {
          audio.playTap();
          setShowScout(true);
      } else {
          onAdd(teamId);
      }
  }, [config.enablePlayerStats, onAdd, teamId, audio, isInteractionLocked]);

  const handleScoutConfirm = useCallback((pid: string, skill: SkillType) => {
      onAdd(teamId, pid, skill);
      audio.playScore();
  }, [onAdd, teamId, audio]);

  const handleSubtractWrapper = useCallback(() => {
      onSubtract();
  }, [onSubtract]);
  
  const gestureHandlers = useScoreGestures({
    onAdd: handleAddWrapper, 
    onSubtract: handleSubtractWrapper, 
    isLocked: isLocked || isInteractionLocked, 
    onInteractionStart: handleStart, 
    onInteractionEnd: handleEnd
  });

  const resolvedColor = colorTheme || team.color || 'slate';
  const theme = resolveTheme(resolvedColor);

  const isCritical = isMatchPoint || isSetPoint;
  
  const textEffectClass = useMemo(() => {
    if (isMatchPoint) return 'drop-shadow-2xl'; 
    return ''; 
  }, [isMatchPoint]);

  const isFirstPosition = reverseLayout ? teamId === 'B' : teamId === 'A';

  const positionClasses = isFirstPosition
    ? 'landscape:left-0 landscape:top-0 landscape:w-[50vw] landscape:h-[100dvh] top-0 left-0 w-[100vw] h-[50dvh]' 
    : 'landscape:left-[50vw] landscape:top-0 landscape:w-[50vw] landscape:h-[100dvh] top-[50dvh] left-0 w-[100vw] h-[50dvh]';

  // Dynamic Font Size Calculation
  const fontSizeStyle = useMemo(() => {
      // Use vmin for responsive baseline (viewport min dimension)
      // Landscape: larger base. Portrait: slightly smaller base.
      const baseVmin = isLandscape ? 32 : 38;
      
      // Reduce base size for compact/ultra modes
      let modeModifier = 1;
      if (mode === 'compact') modeModifier = 0.85;
      if (mode === 'ultra') modeModifier = 0.7;

      const finalScale = scale * modeModifier;

      return {
          fontSize: `clamp(4rem, ${baseVmin * finalScale}vmin, 24rem)`,
      };
  }, [isLandscape, scale, mode]);

  // Dynamic Offset
  const offsetClass = alignment === 'left' 
      ? 'landscape:-translate-x-[6vw]' 
      : 'landscape:translate-x-[6vw]';

  return (
    <>
        <ScoutModal 
            isOpen={showScout}
            onClose={handleScoutClose}
            team={team}
            onConfirm={handleScoutConfirm}
            colorTheme={team.color || 'indigo'}
        />

        <motion.div 
            layout
            transition={layoutTransition}
            className={`
                fixed z-10 flex flex-col justify-center items-center select-none overflow-visible
                ${positionClasses}
            `}
            style={{ 
                touchAction: 'none', // Crucial for preventing browser gestures like zoom/scroll
                WebkitUserSelect: 'none',
                userSelect: 'none'
            }}
            {...gestureHandlers}
        >
            <div 
                className={`
                    flex items-center justify-center w-full h-full
                    transition-transform duration-150
                    ${isPressed ? 'scale-95' : 'scale-100'}
                    will-change-transform
                `}
                style={fontSizeStyle}
            >
                <div className={`transform transition-transform duration-500 w-full flex justify-center ${offsetClass}`}>
                    <ScoreNumberDisplay 
                        score={score} 
                        theme={theme} 
                        textEffectClass={textEffectClass} 
                        isPressed={isPressed} 
                        scoreRefCallback={scoreRefCallback} 
                        numberRef={numberRef}
                        isCritical={isCritical}
                        isMatchPoint={isMatchPoint}
                        isServing={isServing}
                        scale={scale}
                        mode={mode}
                    />
                </div>
            </div>
        </motion.div>
    </>
  );
});
