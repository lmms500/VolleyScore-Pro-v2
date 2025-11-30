import React, { memo } from 'react';
import { Team, TeamId } from '../types';
import { Volleyball, Zap, Timer, Skull, TrendingUp, Trophy } from 'lucide-react';
import { useScoreGestures } from '../hooks/useScoreGestures';
import { useTranslation } from '../contexts/LanguageContext';
import { ScoreTicker } from './ui/ScoreTicker';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { layoutTransition, stampVariants } from '../utils/animations';

interface ScoreCardNormalProps {
  teamId: TeamId;
  team: Team;
  score: number;
  setsWon: number;
  isServing: boolean;
  onAdd: () => void;
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
  colorTheme: 'indigo' | 'rose';
  isLocked?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

export const ScoreCardNormal: React.FC<ScoreCardNormalProps> = memo(({
  teamId, team, score, setsWon, isServing, onAdd, onSubtract, onSetServer, timeouts, onTimeout, 
  isMatchPoint, isSetPoint, isDeuce, inSuddenDeath, reverseLayout, setsNeededToWin, colorTheme, 
  isLocked = false, onInteractionStart, onInteractionEnd
}) => {
  const { t } = useTranslation();
  const gestureHandlers = useScoreGestures({
    onAdd, onSubtract, isLocked, onInteractionStart, onInteractionEnd
  });

  const theme = {
    indigo: {
      text: 'text-indigo-600 dark:text-indigo-300',
      glow: 'shadow-[0_0_15px_rgba(99,102,241,0.5)]',
      haloColor: 'bg-indigo-500',
      badgeBg: 'bg-indigo-500/20',
      badgeBorder: 'border-indigo-500/30',
      badgeText: 'text-indigo-600 dark:text-indigo-300',
    },
    rose: {
      text: 'text-rose-600 dark:text-rose-300',
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.5)]',
      haloColor: 'bg-rose-500',
      badgeBg: 'bg-rose-500/20',
      badgeBorder: 'border-rose-500/30',
      badgeText: 'text-rose-600 dark:text-rose-300',
    }
  }[colorTheme];

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
          className: `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`,
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

  // Determine Halo State
  const haloColorClass = isMatchPoint 
    ? 'bg-amber-500 saturate-150' // Gold for Match Point
    : theme.haloColor;

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
      
      <div className="flex flex-col h-full w-full relative z-10 py-2 md:py-4 px-2 justify-between items-center">
        
        {/* Header: Name, Sets, Serve */}
        <div className="flex flex-col items-center justify-center w-full flex-none order-1 mt-4 space-y-3">
            
            <motion.div 
                layout
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity active:scale-95 duration-200 group"
                onClick={(e) => { e.stopPropagation(); onSetServer(); }}
                role="button"
                aria-label={`Set serve to ${team?.name}`}
            >
                <motion.h2 
                    layout
                    className="font-black uppercase text-center z-10 leading-none text-xl md:text-2xl text-slate-800 dark:text-slate-200 tracking-widest truncate max-w-[200px] group-hover:scale-105 transition-transform"
                >
                    {team?.name || ''}
                </motion.h2>
                <AnimatePresence mode="popLayout">
                  {isServing && (
                    <motion.div
                      key="serving-indicator"
                      layout // Enables layout animation during exit
                      initial={{ scale: 0, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0, rotate: 180 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <Volleyball 
                          size={18} 
                          className={`animate-bounce ${theme.text}`} 
                          fill="currentColor"
                          fillOpacity={0.2}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
            </motion.div>

            {/* Sets Indicator - Glowing Dots */}
            <div className="flex gap-2">
                {[...Array(setsNeededToWin)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`
                            w-2.5 h-2.5 rounded-full transition-all duration-500 border border-black/5 dark:border-white/5
                            ${i < setsWon 
                                ? `${theme.haloColor} ${theme.glow} scale-110` 
                                : 'bg-black/10 dark:bg-white/10'}
                        `} 
                    />
                ))}
            </div>
        </div>

        {/* Badges - STAMP EFFECT (Neo-Glass Style) */}
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
                ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{ touchAction: 'none' }}
            {...gestureHandlers}
        >
            {/* Grid-based centering for robust alignment */}
            <div className="relative grid place-items-center text-[12vh] landscape:text-[20vh] leading-none">
                
                {/* 
                    THE DYNAMIC GLOWING HALO
                    Placed on the same grid cell as the ScoreTicker.
                */}
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
                
                {/* Motion Ticker - Also on the same grid cell, stacked on top via z-index */}
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

        {/* Timeouts - Compact Icon Only Style */}
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
              {/* Icon Only */}
              <div className="text-slate-800 dark:text-white">
                  <Timer size={18} />
              </div>
              
              {/* Vertical Dots Column - Compact */}
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
                            : `${theme.haloColor} shadow-[0_0_8px_currentColor] scale-110`}
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