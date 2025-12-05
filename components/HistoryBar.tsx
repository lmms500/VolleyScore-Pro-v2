import React, { memo } from 'react';
import { SetHistory } from '../types';
import { Clock } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { listItemVariants } from '../utils/animations';

interface HistoryBarProps {
  history: SetHistory[];
  duration: number;
  setsA: number;
  setsB: number;
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
    <span className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300 tabular-nums tracking-wide">
      {formattedTime}
    </span>
  );
}, (prev, next) => prev.duration === next.duration);

// Fully memoized list that ignores parent re-renders unless history actually changes
const SetHistoryList = memo(({ history }: { history: SetHistory[] }) => {
    const { t } = useTranslation();
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
                        <span className="text-[9px] text-slate-600 dark:text-slate-500 font-bold uppercase tracking-widest mb-0.5">{t('history.setLabel', {setNumber: set.setNumber})}</span>
                        <div className={`text-sm font-bold px-2 py-0.5 rounded-md border ${
                            isA 
                            ? 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30' 
                            : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30'
                        }`}>
                            <span className={isA ? 'text-black dark:text-white' : 'text-slate-400'}>{set.scoreA}</span>
                            <span className='opacity-30 mx-0.5'>-</span>
                            <span className={!isA ? 'text-black dark:text-white' : 'text-slate-400'}>{set.scoreB}</span>
                        </div>
                    </motion.div>
                );
              })}
            </AnimatePresence>
        </div>
    );
}, (prev, next) => {
    if (prev.history.length !== next.history.length) return false;
    return prev.history === next.history;
});

export const HistoryBar: React.FC<HistoryBarProps> = memo(({ history, duration, setsA, setsB }) => {
  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="max-w-4xl mx-auto h-16 bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-full flex items-center justify-between px-6 shadow-lg"
    >
      
      {/* Set Scores - Memoized & Isolated */}
      <SetHistoryList history={history} />

      {/* Timer & Global Score */}
      <div className="flex items-center gap-4 pl-4 border-l border-black/10 dark:border-white/10">
        <div className="hidden md:flex items-center gap-1.5 text-xl font-black tracking-tight">
           <ScoreTickerSimple value={setsA} color="text-slate-800 dark:text-slate-200" />
           <span className="text-slate-400 dark:text-slate-600 text-sm">:</span>
           <ScoreTickerSimple value={setsB} color="text-slate-800 dark:text-slate-200" />
        </div>
        
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-slate-500 dark:text-slate-400" />
          {/* Timer isolado */}
          <GameTimer duration={duration} />
        </div>
      </div>
    </motion.div>
  );
});

// Simple ticker for the set count in history bar
const ScoreTickerSimple = memo(({ value, color }: { value: number, color: string }) => (
  <AnimatePresence mode="popLayout" initial={false}>
    <motion.span 
      key={value}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -10, opacity: 0 }}
      className={color}
    >
      {value}
    </motion.span>
  </AnimatePresence>
));