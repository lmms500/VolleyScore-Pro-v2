
import React, { memo } from 'react';
import { SetHistory, TeamColor } from '../types';
import { Clock } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
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

// Subcomponente isolado para o tempo, evitando re-render da lista pesada
const GameTimer = memo(({ duration }: { duration: number }) => {
  const h = Math.floor(duration / 3600);
  const m = Math.floor((duration % 3600) / 60);
  const s = duration % 60;
  
  const formattedTime = h > 0 
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <span className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300 tabular-nums tracking-wide transition-colors duration-700">
      {formattedTime}
    </span>
  );
}, (prev, next) => prev.duration === next.duration);

// Fully memoized list that ignores parent re-renders unless history or colors actually change
const SetHistoryList = memo(({ history, colorA, colorB }: { history: SetHistory[], colorA: TeamColor, colorB: TeamColor }) => {
    const { t } = useTranslation();
    
    // Resolve themes once or per render (lightweight operation)
    const themeA = resolveTheme(colorA);
    const themeB = resolveTheme(colorB);

    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
            {history.length === 0 && (
              <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-slate-500 dark:text-slate-500 text-xs font-medium uppercase tracking-wider pl-2"
              >
                {t('history.gameStart')}
              </motion.span>
            )}
            
            <AnimatePresence mode="popLayout">
              {history.map((set, idx) => {
                 const isA = set.winner === 'A';
                 const activeTheme = isA ? themeA : themeB;
                 
                 return (
                    <motion.div 
                    key={`${set.setNumber}-${idx}`} // Unique key for motion
                    variants={listItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className="flex flex-col items-center justify-center min-w-[2.5rem]"
                    >
                        <span className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 transition-colors duration-500 ${isA ? themeA.text : themeB.text}`}>
                            {t('history.setLabel', {setNumber: set.setNumber})}
                        </span>
                        
                        <div className={`text-sm font-bold px-2 py-0.5 rounded-md border transition-all duration-500 ${
                            isA 
                            ? `${themeA.bg} ${themeA.text} ${themeA.border}` 
                            : `${themeB.bg} ${themeB.text} ${themeB.border}`
                        }`}>
                            <span className={isA ? themeA.textDark : 'text-slate-400 opacity-70'}>{set.scoreA}</span>
                            <span className='opacity-30 mx-0.5 text-slate-500'>-</span>
                            <span className={!isA ? themeB.textDark : 'text-slate-400 opacity-70'}>{set.scoreB}</span>
                        </div>
                    </motion.div>
                );
              })}
            </AnimatePresence>
        </div>
    );
}, (prev, next) => {
    return (
        prev.history === next.history && 
        prev.colorA === next.colorA && 
        prev.colorB === next.colorB
    );
});

// Simple ticker for the set count in history bar
const ScoreTickerSimple = memo(({ value, color }: { value: number, color: TeamColor }) => {
  const theme = resolveTheme(color);
  return (
    <AnimatePresence mode="popLayout" initial={false}>
        <motion.span 
        key={value}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -10, opacity: 0 }}
        className={`${theme.text} ${theme.textDark} transition-colors duration-500`}
        >
        {value}
        </motion.span>
    </AnimatePresence>
  );
});

export const HistoryBar: React.FC<HistoryBarProps> = memo(({ history, duration, setsA, setsB, colorA, colorB }) => {
  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="max-w-4xl mx-auto h-16 bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-full flex items-center justify-between px-6 shadow-lg transition-colors duration-700"
    >
      
      {/* Set Scores - Memoized & Isolated with Dynamic Colors */}
      <SetHistoryList history={history} colorA={colorA} colorB={colorB} />

      {/* Timer & Global Score */}
      <div className="flex items-center gap-4 pl-4 border-l border-black/10 dark:border-white/10 transition-colors duration-700">
        <div className="hidden md:flex items-center gap-1.5 text-xl font-black tracking-tight">
           <ScoreTickerSimple value={setsA} color={colorA} />
           <span className="text-slate-400 dark:text-slate-600 text-sm transition-colors duration-700">:</span>
           <ScoreTickerSimple value={setsB} color={colorB} />
        </div>
        
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-slate-500 dark:text-slate-400 transition-colors duration-700" />
          {/* Timer isolado */}
          <GameTimer duration={duration} />
        </div>
      </div>
    </motion.div>
  );
});
