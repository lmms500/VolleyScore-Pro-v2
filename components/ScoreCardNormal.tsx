import React, { memo } from 'react';
import { Team, TeamId } from '../types';
import { Volleyball, Zap } from 'lucide-react';
import { useScoreGestures } from '../hooks/useScoreGestures';
import { useTranslation } from '../contexts/LanguageContext';
import { ScoreTicker } from './ui/ScoreTicker';
import { motion, AnimatePresence } from 'framer-motion';
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
      text: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500',
      haloColor: 'bg-indigo-500',
      shadow: 'shadow-indigo-500/50',
    },
    rose: {
      text: 'text-rose-600 dark:text-rose-500 saturate-[1.25] dark:saturate-[1.75] dark:brightness-125',
      bg: 'bg-rose-500 saturate-150',
      haloColor: 'bg-rose-500',
      shadow: 'shadow-rose-500/50',
    }
  }[colorTheme];

  const orderClass = reverseLayout ? (teamId === 'A' ? 'order-last' : 'order-first') : (teamId === 'A' ? 'order-first' : 'order-last');
  const timeoutsExhausted = timeouts >= 2;
  const isCritical = isMatchPoint || isSetPoint || inSuddenDeath;

  return (
    <motion.div 
        layout
        transition={layoutTransition}
        className={`
            flex flex-col flex-1 relative h-full transition-colors duration-500 select-none overflow-visible
            ${orderClass} 
            ${isLocked ? 'opacity-90 grayscale-[0.2]' : ''}
            ${isServing ? 'z-20' : 'z-0'} 
        `}
    >
      
      <div className="flex flex-col h-full w-full relative z-10 py-2 md:py-4 px-2 justify-between items-center">
        
        {/* Header: Name, Sets, Serve */}
        <div className="flex flex-col items-center justify-center w-full flex-none order-1 mt-4">
            
            <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity active:scale-95 duration-200"
                onClick={(e) => { e.stopPropagation(); onSetServer(); }}
                role="button"
                aria-label={`Set serve to ${team?.name}`}
            >
                <h2 
                    className="font-black uppercase text-center z-10 leading-none text-xl md:text-3xl text-slate-800 dark:text-slate-200 tracking-widest truncate max-w-[200px]"
                >
                    {team?.name || ''}
                </h2>
                <AnimatePresence>
                  {isServing && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <Volleyball 
                          size={20} 
                          className={`animate-bounce ${theme.text}`} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>

            <div className="flex gap-2 mt-2">
                {[...Array(setsNeededToWin)].map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < setsWon ? theme.bg : 'bg-black/10 dark:bg-white/10'}`} />
                ))}
            </div>
        </div>

        {/* Badges - STAMP EFFECT */}
        <AnimatePresence mode="popLayout">
            {(isMatchPoint || isSetPoint || isDeuce || inSuddenDeath) && (
                <motion.div 
                    className="flex-none py-2 order-2 w-full flex justify-center z-10 min-h-[2rem]"
                    variants={stampVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    key="badge-container"
                >
                    <div className={`
                        px-3 py-1 rounded-full backdrop-blur-xl border border-black/10 dark:border-white/20 shadow-2xl
                        font-black uppercase tracking-[0.1em] text-center whitespace-nowrap
                        text-[10px] shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-1 transform transition-all
                        ${inSuddenDeath
                            ? 'bg-red-600 text-white shadow-red-500/50 border-red-400'
                            : isMatchPoint 
                                ? 'bg-amber-500 text-black shadow-amber-500/50' 
                                : isSetPoint 
                                    ? `${theme.bg} text-white ${theme.shadow}`
                                    : 'bg-slate-200 text-slate-900'} 
                    `}>
                        {inSuddenDeath && <Zap className="w-3 h-3" fill="currentColor" />}
                        {inSuddenDeath ? t('game.suddenDeath') : isMatchPoint ? t('game.matchPoint') : isSetPoint ? t('game.setPoint') : t('game.deuce')}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        
        {(!isCritical && !isDeuce) && <div className="order-2 min-h-[1.5rem] flex-none"></div>}

        {/* The Number + Halo Container */}
        <div 
            className={`
                relative order-3 flex items-center justify-center w-full flex-1 min-h-0 overflow-visible
                ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{ touchAction: 'none' }}
            {...gestureHandlers}
        >
            {/* 
                We move the font-size to this wrapper so the Halo (using em) scales perfectly with the text.
                The ScoreTicker inherits the font size.
            */}
            <div className="relative inline-flex items-center justify-center text-[12vh] landscape:text-[20vh] leading-none">
                
                {/* 
                    THE PERFECT HALO 
                    - Absolute centered behind text
                    - Aspect square & rounded-full for perfect circle
                    - Size defined in em (relative to font size) for precision
                */}
                <div 
                    className={`
                        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[1.3em] h-[1.3em] rounded-full -z-10
                        blur-2xl opacity-0 transition-opacity duration-700 ease-out
                        pointer-events-none mix-blend-screen
                        ${theme.haloColor}
                        ${isServing ? 'opacity-30' : 'opacity-0'}
                    `} 
                />
                
                {/* Motion Ticker */}
                <ScoreTicker 
                    value={score}
                    className={`
                        relative z-10 drop-shadow-2xl font-black tracking-[-0.08em] 
                        text-slate-900 dark:text-white outline-none select-none
                        transition-transform duration-100 active:scale-95
                        ${theme.text}
                    `}
                />
            </div>
        </div>

        {/* Timeouts */}
        <div className="order-4 w-full flex items-center justify-center flex-none transition-all z-20 mt-1 mb-4">
           <motion.button 
             whileTap={{ scale: 0.95 }}
             onPointerDown={(e) => e.stopPropagation()}
             onClick={(e) => { 
                e.stopPropagation(); 
                if(!timeoutsExhausted) onTimeout(); 
             }}
             disabled={timeoutsExhausted}
             className={`
                flex items-center justify-center gap-3 transition-all rounded-full border border-black/5 dark:border-white/5 py-2 px-4 bg-white/20 dark:bg-black/20 opacity-90 w-auto
                ${timeoutsExhausted ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer hover:bg-white/40 dark:hover:bg-black/50 hover:border-black/10 dark:hover:border-white/20 shadow-lg'}
             `}
           >
              <span className="font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest text-[10px]">{t('game.timeout')}</span>
              <div className="flex gap-1.5">
                {[1, 2].map(t => (
                    <div 
                    key={t}
                    className={`
                        transition-all duration-300 rounded-full w-2.5 h-2.5
                        ${t <= timeouts 
                        ? 'bg-slate-400 dark:bg-slate-800 border border-slate-500 dark:border-slate-700' 
                        : `${theme.bg} shadow-[0_0_8px_currentColor] border-white/10`}
                    `}
                    />
                ))}
              </div>
           </motion.button>
        </div>

      </div>
    </motion.div>
  );
});