
import React, { memo, useState, useCallback } from 'react';
import { Team, TeamId, SkillType, GameConfig, TeamColor } from '../types';
import { Volleyball, Zap, Timer, Skull, TrendingUp, Trophy } from 'lucide-react';
import { useScoreGestures } from '../hooks/useScoreGestures';
import { useTranslation } from '../contexts/LanguageContext';
import { useGameAudio } from '../hooks/useGameAudio';
import { ScoreTicker } from './ui/ScoreTicker';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { layoutTransition, stampVariants } from '../utils/animations';
import { ScoutModal } from './modals/ScoutModal';
import { resolveTheme } from '../utils/colors';

interface ScoreCardNormalProps {
  teamId: TeamId;
  team: Team;
  score: number;
  setsWon: number;
  isServing: boolean;
  onAdd: (teamId: TeamId, playerId?: string, skill?: SkillType) => void;
  onSubtract: () => void;
  onSetServer: () => void;
  timeouts: number;
  onTimeout: () => void;
  isMatchPoint: boolean;
  isSetPoint: boolean;
  isDeuce?: boolean;
  inSuddenDeath?: boolean;
  reverseLayout?: boolean; 
  setsNeededToWin: number;
  colorTheme?: TeamColor; 
  isLocked?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  config: GameConfig;
}

export const ScoreCardNormal: React.FC<ScoreCardNormalProps> = memo(({
  teamId, team, score, setsWon, isServing, onAdd, onSubtract, onSetServer, timeouts, onTimeout, 
  isMatchPoint, isSetPoint, isDeuce, inSuddenDeath, reverseLayout, setsNeededToWin, 
  isLocked = false, onInteractionStart, onInteractionEnd, config, colorTheme
}) => {
  const { t } = useTranslation();
  const audio = useGameAudio(config);
  
  const [showScout, setShowScout] = useState(false);
  const [isInteractionLocked, setIsInteractionLocked] = useState(false);

  // When modal closes, enforce a short cooldown to prevent "ghost clicks" or rapid double-taps
  const handleScoutClose = useCallback(() => {
     setShowScout(false);
     setIsInteractionLocked(true);
     const t = setTimeout(() => setIsInteractionLocked(false), 300);
     return () => clearTimeout(t);
  }, []);

  // Audio Wrappers
  const handleAddWrapper = useCallback(() => {
    if (isInteractionLocked) return;

    // If scout is enabled, sound plays on scout confirm or in App.tsx
    if (config.enablePlayerStats) {
        audio.playTap();
        setShowScout(true);
    } else {
        // Direct point add
        onAdd(teamId);
    }
  }, [config.enablePlayerStats, onAdd, teamId, audio, isInteractionLocked]);

  const handleScoutConfirm = useCallback((pid: string, skill: SkillType) => {
    onAdd(teamId, pid, skill);
    audio.playScore(); // Explicit success sound on modal close
  }, [onAdd, teamId, audio]);

  const handleSubtractWrapper = useCallback(() => {
    onSubtract();
  }, [onSubtract]);

  const gestureHandlers = useScoreGestures({
    onAdd: handleAddWrapper, 
    onSubtract: handleSubtractWrapper, 
    isLocked: isLocked || isInteractionLocked, 
    onInteractionStart, 
    onInteractionEnd
  });

  // Resolve Dynamic Theme - Prioritize prop, fallback to team property, then slate
  const resolvedColor = colorTheme || team.color || 'slate';
  const theme = resolveTheme(resolvedColor);

  const orderClass = reverseLayout ? (teamId === 'A' ? 'order-last' : 'order-first') : (teamId === 'A' ? 'order-first' : 'order-last');
  const timeoutsExhausted = timeouts >= 2;
  const isCritical = isMatchPoint || isSetPoint;

  // Badge Configuration
  let badgeConfig = null;
  if (inSuddenDeath) {
      badgeConfig = { 
          icon: Skull, 
          text: t('status.sudden_death'), 
          className: 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/30 shadow-red-500/20',
          animateIcon: true 
      };
  } else if (isMatchPoint) {
      badgeConfig = { 
          icon: Trophy, 
          text: t('status.match_point'), 
          className: 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30 shadow-amber-500/20',
          animateIcon: false
      };
  } else if (isSetPoint) {
      badgeConfig = { 
          icon: Zap, 
          text: t('status.set_point'), 
          className: `${theme.bg} ${theme.text} ${theme.border}`,
          animateIcon: false
      };
  } else if (isDeuce) {
      badgeConfig = { 
          icon: TrendingUp, 
          text: t('status.deuce_advantage'), 
          className: 'bg-slate-500/20 text-white border-slate-500/30 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]',
          animateIcon: false
      };
  }

  // Halo Variants
  const haloColorClass = isMatchPoint ? 'bg-amber-500 saturate-150' : theme.halo;
  const haloVariants: Variants = {
    idle: { scale: 1, opacity: isServing ? 0.4 : 0 },
    critical: {
      scale: [1, 1.25, 1],
      opacity: isMatchPoint ? [0.5, 0.9, 0.5] : [0.4, 0.8, 0.4],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div 
        layout
        transition={layoutTransition}
        className={`
            flex flex-col flex-1 relative h-full transition-all duration-500 select-none
            ${orderClass} 
            ${isLocked ? 'opacity-90 grayscale-[0.2]' : ''}
            ${isServing ? 'z-20' : 'z-0'} 
        `}
    >
      <ScoutModal 
            isOpen={showScout} 
            onClose={handleScoutClose} 
            team={team} 
            onConfirm={handleScoutConfirm}
            colorTheme={team.color || 'indigo'} 
      />
      
      <div className="flex flex-col h-full w-full relative z-10 py-2 md:py-4 px-2 justify-between items-center">
        
        {/* Header: Name, Sets, Serve */}
        <div className="flex flex-col items-center justify-center w-full flex-none order-1 mt-4 space-y-3 relative z-30">
            
            <motion.div 
                layout
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity active:scale-95 duration-200 group px-2 relative overflow-visible"
                onClick={(e) => { e.stopPropagation(); onSetServer(); }}
                role="button"
                aria-label={`Set serve to ${team?.name}`}
            >
                {/* Name */}
                <motion.h2 
                    layout
                    className="font-black uppercase text-center z-10 leading-none text-xl md:text-2xl text-slate-800 dark:text-slate-200 tracking-widest truncate max-w-[200px] group-hover:scale-105 transition-transform"
                >
                    {team?.name || ''}
                </motion.h2>

                {/* Serving Icon - Sliding in nicely */}
                <AnimatePresence>
                  {isServing && (
                    <motion.div
                      key="serving-indicator"
                      initial={{ width: 0, opacity: 0, scale: 0.5, x: -10 }}
                      animate={{ width: 'auto', opacity: 1, scale: 1, x: 0 }}
                      exit={{ width: 0, opacity: 0, scale: 0.5, x: -10 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      className="flex items-center justify-center"
                    >
                      <div className="px-1 py-1">
                        <Volleyball 
                            size={18} 
                            className={`animate-bounce ${theme.text} drop-shadow-[0_0_8px_currentColor]`} 
                            fill="currentColor"
                            fillOpacity={0.2}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </motion.div>

            {/* Sets Indicator */}
            <div className="flex gap-2">
                {[...Array(setsNeededToWin)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`
                            w-2.5 h-2.5 rounded-full transition-all duration-500 border border-black/5 dark:border-white/5
                            ${i < setsWon 
                                ? `${theme.halo} ${theme.glow} scale-110` 
                                : 'bg-black/10 dark:bg-white/10'}
                        `} 
                    />
                ))}
            </div>
        </div>

        {/* Badges */}
        <AnimatePresence mode="popLayout">
            {badgeConfig && (
                <motion.div 
                    className="flex-none py-2 order-2 w-full flex justify-center z-10 min-h-[2.5rem]"
                    variants={stampVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    key="badge-container"
                >
                    <div className={`
                        px-3 py-1.5 rounded-md backdrop-blur-xl border shadow-lg
                        font-bold uppercase tracking-widest text-center whitespace-nowrap
                        text-[10px] flex items-center gap-2 transform transition-all
                        ${badgeConfig.className}
                    `}>
                        {badgeConfig.icon && (
                            <motion.div
                                animate={badgeConfig.animateIcon ? { scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] } : {}}
                                transition={{ repeat: Infinity, duration: 1 }}
                            >
                                <badgeConfig.icon size={12} strokeWidth={3} />
                            </motion.div>
                        )}
                        {badgeConfig.text}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        
        {!badgeConfig && <div className="order-2 min-h-[2.5rem] flex-none"></div>}

        {/* The Number + Halo Container */}
        <div 
            className={`
                relative order-3 flex items-center justify-center w-full flex-1 min-h-0 overflow-visible
                ${(isLocked || isInteractionLocked) ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{ touchAction: 'none' }}
            {...gestureHandlers}
        >
            <div className="relative grid place-items-center text-[12vh] landscape:text-[20vh] leading-none">
                <motion.div 
                    className={`
                        [grid-area:1/1]
                        w-[1.4em] h-[1.4em] rounded-full
                        blur-3xl pointer-events-none mix-blend-screen
                        ${haloColorClass}
                    `}
                    variants={haloVariants}
                    animate={isCritical ? "critical" : "idle"}
                    transition={{ duration: 0.5 }}
                />
                
                <ScoreTicker 
                    value={score}
                    className={`
                        [grid-area:1/1]
                        relative z-10 drop-shadow-2xl font-black tracking-tighter
                        text-slate-900 dark:text-white outline-none select-none
                        transition-transform duration-100 active:scale-95
                        ${isMatchPoint ? 'brightness-110 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]' : ''}
                    `}
                    style={{
                        textShadow: isServing ? '0 0 40px rgba(0,0,0,0.3)' : 'none'
                    }}
                />
            </div>
        </div>

        {/* Timeouts */}
        <div className="order-4 w-full flex items-center justify-center flex-none transition-all z-20 mt-2 mb-6">
           <motion.button 
             whileTap={{ scale: 0.95 }}
             onPointerDown={(e) => e.stopPropagation()}
             onClick={(e) => { 
                e.stopPropagation(); 
                if(!timeoutsExhausted) onTimeout(); 
             }}
             disabled={timeoutsExhausted}
             className={`
                flex items-center gap-2 transition-all rounded-xl border py-2 px-3
                backdrop-blur-md shadow-lg
                ${timeoutsExhausted 
                    ? 'bg-black/5 dark:bg-white/5 border-transparent opacity-40 cursor-not-allowed grayscale' 
                    : 'bg-white/20 dark:bg-white/5 border-white/20 hover:bg-white/30 dark:hover:bg-white/10 hover:border-white/30 cursor-pointer'}
             `}
             title={t('game.useTimeout')}
           >
              <div className="text-slate-800 dark:text-white">
                  <Timer size={18} />
              </div>
              <div className="flex flex-col gap-1 border-l border-black/10 dark:border-white/10 pl-2">
                {[1, 2].map(t => {
                     const isUsed = t <= timeouts;
                     return (
                        <div 
                        key={t}
                        className={`
                            transition-all duration-300 rounded-full w-1.5 h-1.5
                            ${isUsed 
                            ? 'bg-black/20 dark:bg-white/20' 
                            : `${theme.halo} shadow-[0_0_8px_currentColor] scale-110`}
                        `}
                        />
                     );
                })}
              </div>
           </motion.button>
        </div>

      </div>
    </motion.div>
  );
});
