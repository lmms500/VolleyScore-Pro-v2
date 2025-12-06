
import React, { memo } from 'react';
import { SetHistory, TeamColor } from '../types';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { listItemVariants } from '../utils/animations';
import { resolveTheme } from '../utils/colors';

interface HistoryBarProps {
  history: SetHistory[];
  duration: number;
  setsA: number;
  setsB: number;
  colorA: TeamColor;
  colorB: TeamColor;
}

const GameTimer = memo(({ duration }: { duration: number }) => {
  const h = Math.floor(duration / 3600);
  const m = Math.floor((duration % 3600) / 60);
  const s = duration % 60;
  
  const formattedTime = h > 0 
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 tabular-nums tracking-wider">
      {formattedTime}
    </span>
  );
});

const SetHistoryList = memo(({ history, colorA, colorB }: { history: SetHistory[], colorA: TeamColor, colorB: TeamColor }) => {
    const themeA = resolveTheme(colorA);
    const themeB = resolveTheme(colorB);

    return (
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mask-linear-fade pr-2">
            <AnimatePresence mode="popLayout">
              {history.map((set, idx) => {
                 const isA = set.winner === 'A';
                 
                 return (
                    <motion.div 
                        key={`${set.setNumber}-${idx}`}
                        variants={listItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className={`
                            flex items-center justify-center h-6 px-2 rounded-lg
                            bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/5
                        `}
                    >
                        <div className="flex items-center text-[10px] font-bold leading-none gap-1">
                            <span className={isA ? `${themeA.text} ${themeA.textDark}` : 'text-slate-400 opacity-60'}>{set.scoreA}</span>
                            <span className='opacity-20 text-slate-500'>:</span>
                            <span className={!isA ? `${themeB.text} ${themeB.textDark}` : 'text-slate-400 opacity-60'}>{set.scoreB}</span>
                        </div>
                    </motion.div>
                );
              })}
            </AnimatePresence>
        </div>
    );
}, (prev, next) => prev.history === next.history && prev.colorA === next.colorA && prev.colorB === next.colorB);

const ScoreTickerSimple = memo(({ value, color }: { value: number, color: TeamColor }) => {
  const theme = resolveTheme(color);
  return (
    <AnimatePresence mode="popLayout" initial={false}>
        <motion.span 
            key={value}
            initial={{ y: 5, opacity: 0, filter: 'blur(2px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: -5, opacity: 0, filter: 'blur(2px)' }}
            className={`${theme.text} ${theme.textDark} transition-colors duration-300`}
        >
            {value}
        </motion.span>
    </AnimatePresence>
  );
});

export const HistoryBar: React.FC<HistoryBarProps> = memo(({ history, duration, setsA, setsB, colorA, colorB }) => {
  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
      className="max-w-3xl mx-auto h-10 flex items-center justify-between px-3"
    >
      {/* Placar Sets - Super Minimal */}
      <div className="flex items-center gap-2 px-3 h-8 rounded-full bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/5 backdrop-blur-md shadow-sm shadow-black/5">
         <div className="flex items-center gap-1.5 text-sm font-black tracking-tight leading-none">
             <ScoreTickerSimple value={setsA} color={colorA} />
             <span className="text-slate-300 dark:text-slate-600 text-[10px] font-medium">-</span>
             <ScoreTickerSimple value={setsB} color={colorB} />
         </div>
      </div>

      {/* Lista de Sets */}
      <div className="flex-1 mx-3 overflow-hidden h-full flex items-center justify-center">
          <SetHistoryList history={history} colorA={colorA} colorB={colorB} />
      </div>

      {/* Timer Pill */}
      <div className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-slate-100/50 dark:bg-black/20 border border-black/5 dark:border-white/5 backdrop-blur-md">
        <Clock size={10} className="text-slate-400" strokeWidth={2.5} />
        <GameTimer duration={duration} />
      </div>
    </motion.div>
  );
});
