
import React, { useState, useMemo } from 'react';
import { Match } from '../../stores/historyStore';
import { downloadJSON } from '../../services/io';
import { useTranslation } from '../../contexts/LanguageContext';
import { 
  ArrowLeft, Download, Trophy, Clock, Calendar, 
  Hash, Shield, Play, ChevronLeft, ChevronRight, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface MatchDetailProps {
  match: Match;
  onBack: () => void;
}

export const MatchDetail: React.FC<MatchDetailProps> = ({ match, onBack }) => {
  const { t } = useTranslation();
  const [replayIndex, setReplayIndex] = useState<number>(-1); // -1 = Start, 0 = Set 1, etc.

  // --- Derived Stats ---
  const totalPointsA = useMemo(() => match.sets.reduce((acc, s) => acc + s.scoreA, 0), [match.sets]);
  const totalPointsB = useMemo(() => match.sets.reduce((acc, s) => acc + s.scoreB, 0), [match.sets]);
  
  const winnerColor = match.winner === 'A' ? 'text-indigo-500 dark:text-indigo-400' : 'text-rose-500 dark:text-rose-400';
  const winnerBg = match.winner === 'A' ? 'bg-indigo-500' : 'bg-rose-500';

  const dateStr = new Date(match.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const durationStr = `${Math.floor(match.durationSeconds / 3600)}h ${Math.floor((match.durationSeconds % 3600) / 60)}m`;

  // --- Replay Logic ---
  const currentReplaySet = replayIndex >= 0 ? match.sets[replayIndex] : null;
  
  // Calculate aggregate sets won up to current replay index
  const replayStats = useMemo(() => {
    let setsA = 0;
    let setsB = 0;
    if (replayIndex === -1) return { setsA: 0, setsB: 0 };

    for (let i = 0; i <= replayIndex; i++) {
        if (match.sets[i].winner === 'A') setsA++;
        else setsB++;
    }
    return { setsA, setsB };
  }, [replayIndex, match.sets]);

  const handleExport = () => {
    downloadJSON(`match_${match.id.slice(0, 8)}`, match);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="flex flex-col h-full bg-slate-100 dark:bg-[#0a0a0a] text-slate-900 dark:text-white overflow-hidden rounded-2xl"
    >
      {/* Navbar */}
      <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-md">
        <button 
           onClick={onBack}
           className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
        >
            <ArrowLeft size={18} /> {t('common.done')}
        </button>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {match.id.slice(0, 8)}</span>
        <button 
           onClick={handleExport}
           className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-indigo-500 transition-colors"
           title={t('historyList.export')}
        >
            <Download size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-8">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Calendar size={12} /> {dateStr}
                <span className="mx-1">•</span>
                <Clock size={12} /> {timeStr}
            </div>

            <div className="w-full flex items-center justify-center gap-4 md:gap-12">
                {/* Team A */}
                <div className="flex flex-col items-center text-center flex-1">
                    <h2 className={`text-xl md:text-3xl font-black uppercase tracking-tighter ${match.winner === 'A' ? 'text-indigo-600 dark:text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'text-slate-500 opacity-60'}`}>
                        {match.teamAName}
                    </h2>
                    {match.winner === 'A' && <span className="mt-2 px-3 py-1 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-indigo-500/30 flex items-center gap-1"><Trophy size={10} /> Winner</span>}
                </div>

                {/* Score Board */}
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-4 text-5xl md:text-7xl font-black font-inter tracking-tighter tabular-nums leading-none">
                        <span className={match.winner === 'A' ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-700'}>{match.setsA}</span>
                        <span className="text-slate-300 dark:text-slate-700 text-3xl">:</span>
                        <span className={match.winner === 'B' ? 'text-rose-500' : 'text-slate-300 dark:text-slate-700'}>{match.setsB}</span>
                    </div>
                    <span className="text-xs font-mono font-medium text-slate-400 mt-2 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock size={10} /> {durationStr}
                    </span>
                </div>

                {/* Team B */}
                <div className="flex flex-col items-center text-center flex-1">
                    <h2 className={`text-xl md:text-3xl font-black uppercase tracking-tighter ${match.winner === 'B' ? 'text-rose-600 dark:text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'text-slate-500 opacity-60'}`}>
                        {match.teamBName}
                    </h2>
                     {match.winner === 'B' && <span className="mt-2 px-3 py-1 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-rose-500/30 flex items-center gap-1"><Trophy size={10} /> Winner</span>}
                </div>
            </div>

             {/* Total Points Stats */}
             <div className="flex gap-1 w-full max-w-md mx-auto h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-white/10">
                 <div 
                    className="bg-indigo-500 h-full" 
                    style={{ width: `${(totalPointsA / (totalPointsA + totalPointsB)) * 100}%` }}
                 />
                 <div 
                    className="bg-rose-500 h-full" 
                    style={{ width: `${(totalPointsB / (totalPointsA + totalPointsB)) * 100}%` }}
                 />
             </div>
             <div className="flex justify-between w-full max-w-md text-xs font-bold uppercase tracking-wide text-slate-500">
                <span>{totalPointsA} pts</span>
                <span>Total Points</span>
                <span>{totalPointsB} pts</span>
             </div>
        </div>

        {/* Replay / Timeline Section */}
        <div className="bg-white/50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
            <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Play size={14} /> Match Replay
                </h3>
                <div className="flex items-center gap-2">
                    <button 
                        disabled={replayIndex === -1}
                        onClick={() => setReplayIndex(prev => Math.max(-1, prev - 1))}
                        className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 disabled:opacity-30 transition-all"
                    >
                        <ChevronLeft size={16} />
                    </button>
                     <span className="text-xs font-mono tabular-nums w-16 text-center">
                        {replayIndex === -1 ? "START" : `SET ${replayIndex + 1}`}
                    </span>
                    <button 
                        disabled={replayIndex >= match.sets.length - 1}
                        onClick={() => setReplayIndex(prev => Math.min(match.sets.length - 1, prev + 1))}
                        className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 disabled:opacity-30 transition-all"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <button 
                        onClick={() => setReplayIndex(-1)}
                        className="ml-2 p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:text-rose-500 transition-all"
                        title="Reset Replay"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>

            <div className="p-8 flex flex-col items-center justify-center min-h-[160px] relative">
                 <AnimatePresence mode="wait">
                    <motion.div
                        key={replayIndex}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="text-center"
                    >
                        {replayIndex === -1 ? (
                            <div className="text-slate-400 flex flex-col items-center">
                                <Shield size={40} strokeWidth={1} className="mb-2 opacity-50" />
                                <p className="text-sm font-medium">Match Start</p>
                                <p className="text-xs opacity-70">0 - 0</p>
                            </div>
                        ) : currentReplaySet ? (
                            <div className="flex flex-col items-center w-full">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                    Result of Set {currentReplaySet.setNumber}
                                </div>
                                <div className="flex items-center gap-8 mb-4">
                                    <div className="text-center">
                                        <div className={`text-4xl font-black ${currentReplaySet.winner === 'A' ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-700'}`}>
                                            {currentReplaySet.scoreA}
                                        </div>
                                    </div>
                                    <div className="h-8 w-px bg-slate-300 dark:bg-white/10"></div>
                                    <div className="text-center">
                                        <div className={`text-4xl font-black ${currentReplaySet.winner === 'B' ? 'text-rose-500' : 'text-slate-300 dark:text-slate-700'}`}>
                                            {currentReplaySet.scoreB}
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-1.5 bg-black/5 dark:bg-white/5 rounded-full text-xs font-mono font-medium text-slate-500">
                                    Match Score: <strong className="text-indigo-500">{replayStats.setsA}</strong> - <strong className="text-rose-500">{replayStats.setsB}</strong>
                                </div>
                            </div>
                        ) : null}
                    </motion.div>
                 </AnimatePresence>
            </div>
            
            {/* Timeline Dots */}
            <div className="px-4 pb-4 flex justify-center gap-1">
                <div 
                    onClick={() => setReplayIndex(-1)}
                    className={`w-2 h-2 rounded-full cursor-pointer transition-all ${replayIndex === -1 ? 'bg-slate-500 scale-125' : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'}`} 
                />
                {match.sets.map((_, i) => (
                     <div 
                        key={i} 
                        onClick={() => setReplayIndex(i)}
                        className={`w-2 h-2 rounded-full cursor-pointer transition-all ${replayIndex === i ? 'bg-slate-500 scale-125' : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'}`} 
                    />
                ))}
            </div>
        </div>

        {/* Config Grid */}
        <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Max Sets</span>
                 <span className="text-lg font-bold text-slate-700 dark:text-slate-200">Best of {match.config.maxSets}</span>
             </div>
             <div className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Points / Set</span>
                 <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{match.config.pointsPerSet} pts</span>
             </div>
             <div className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Tie Break</span>
                 <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{match.config.hasTieBreak ? `Yes (${match.config.tieBreakPoints} pts)` : 'No'}</span>
             </div>
             <div className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Deuce Rule</span>
                 <span className="text-lg font-bold text-slate-700 dark:text-slate-200">
                     {match.config.deuceType === 'standard' ? 'Standard (+2)' : 'Sudden Death'}
                 </span>
             </div>
        </div>

      </div>
    </motion.div>
  );
};
