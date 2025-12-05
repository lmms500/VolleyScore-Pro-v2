

import React, { useState, memo, useMemo, useRef, useCallback } from 'react';
import { TeamId, Team, SkillType, GameConfig } from '../types';
import { useScoreGestures } from '../hooks/useScoreGestures';
import { ScoreTicker } from './ui/ScoreTicker';
import { motion, AnimatePresence } from 'framer-motion';
import { pulseHeartbeat, layoutTransition } from '../utils/animations';
import { useGameAudio } from '../hooks/useGameAudio';
import { ScoutModal } from './modals/ScoutModal';
import { TEAM_COLORS } from '../utils/colors';

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
  colorTheme?: any; // Deprecated
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
    isServing,
    isMatchPoint
}: any) => {

    const haloColorClass = isMatchPoint ? 'bg-amber-500 saturate-150' : theme.halo;

    return (
        <div 
            className="relative grid place-items-center" 
            style={{ 
                lineHeight: 1,
                gridTemplateAreas: '"stack"' 
            }}
        >
            <motion.div
                className={`
                    rounded-full aspect-square pointer-events-none
                    mix-blend-screen blur-[60px] md:blur-[100px] z-0
                    ${haloColorClass}
                    justify-self-center self-center
                `}
                style={{ 
                    gridArea: 'stack',
                    width: '1.5em', 
                    height: '1.5em' 
                }}
                animate={
                    isPressed 
                    ? { scale: 1.1, opacity: 0.8 } 
                    : isCritical 
                        ? { 
                            scale: [1, 1.35, 1],
                            opacity: isMatchPoint ? [0.6, 1, 0.6] : [0.4, 0.8, 0.4],
                        }
                        : { 
                            scale: 1, 
                            opacity: isServing ? 0.4 : 0 
                        }
                }
                transition={
                    isCritical 
                    ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.3, ease: "easeOut" }
                }
            />

            <motion.div 
                ref={numberRef} 
                className="relative z-10 flex items-center justify-center will-change-transform"
                style={{ gridArea: 'stack' }}
                variants={pulseHeartbeat}
                animate={isCritical ? "pulse" : "idle"}
            >
                <div ref={scoreRefCallback}>
                    <ScoreTicker 
                        value={score}
                        className={`
                            font-black leading-none tracking-tighter transition-all duration-300
                            ${theme.text}
                            ${theme.textDark}
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
  teamId, team, score, onAdd, onSubtract,
  isMatchPoint, isSetPoint, isDeuce, inSuddenDeath, 
  isLocked = false, onInteractionStart, onInteractionEnd, reverseLayout,
  scoreRefCallback, isServing, alignment = 'left', config
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showScout, setShowScout] = useState(false);
  const numberRef = useRef<HTMLDivElement>(null);
  
  const audio = useGameAudio(config);

  const handleStart = useCallback(() => {
    setIsPressed(true);
    onInteractionStart?.();
  }, [onInteractionStart]);

  const handleEnd = useCallback(() => {
    setIsPressed(false);
    onInteractionEnd?.();
  }, [onInteractionEnd]);

  // Audio & Scout Logic Wrappers
  const handleAddWrapper = useCallback(() => {
      if (config.enablePlayerStats) {
          audio.playTap();
          setShowScout(true);
      } else {
          onAdd(teamId);
          // Audio handled in App.tsx
      }
  }, [config.enablePlayerStats, onAdd, teamId, audio]);

  const handleScoutConfirm = useCallback((pid: string, skill: SkillType) => {
      onAdd(teamId, pid, skill);
      audio.playScore();
  }, [onAdd, teamId, audio]);

  const handleSubtractWrapper = useCallback(() => {
      onSubtract();
      // Audio handled in App.tsx
  }, [onSubtract]);
  
  const gestureHandlers = useScoreGestures({
    onAdd: handleAddWrapper, 
    onSubtract: handleSubtractWrapper, 
    isLocked, 
    onInteractionStart: handleStart, 
    onInteractionEnd: handleEnd
  });

  // Resolve Theme
  const theme = TEAM_COLORS[team.color || 'slate'];

  const isCritical = isMatchPoint || isSetPoint;
  
  const textEffectClass = useMemo(() => {
    if (isMatchPoint) return 'drop-shadow-[0_0_60px_rgba(251,191,36,0.9)] brightness-110'; 
    if (isCritical) return theme.glow; 
    return ''; 
  }, [isMatchPoint, isCritical, theme.glow]);

  const isFirstPosition = reverseLayout ? teamId === 'B' : teamId === 'A';

  const positionClasses = isFirstPosition
    ? 'landscape:left-0 landscape:top-0 landscape:w-[50vw] landscape:h-[100dvh] top-0 left-0 w-[100vw] h-[50dvh]' 
    : 'landscape:left-[50vw] landscape:top-0 landscape:w-[50vw] landscape:h-[100dvh] top-[50dvh] left-0 w-[100vw] h-[50dvh]';

  const offsetClass = alignment === 'left' 
      ? 'landscape:-translate-x-[6vw]' 
      : 'landscape:translate-x-[6vw]';

  return (
    <>
        {/* Render ScoutModal outside the gesture container to isolate events */}
        <ScoutModal 
            isOpen={showScout}
            onClose={() => setShowScout(false)}
            team={team}
            onConfirm={handleScoutConfirm}
            colorTheme={team.color === 'rose' || team.color === 'amber' ? 'rose' : 'indigo'} // Fallback for modal
        />

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
                        isServing={!!isServing}
                        isMatchPoint={isMatchPoint}
                    />
                </div>
            </div>
        </motion.div>
    </>
  );
});