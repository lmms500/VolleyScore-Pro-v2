import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { GameState, TeamId } from '../../types';
import { Trophy, RefreshCw, ArrowRight, UserPlus, ShieldAlert, Users, RotateCcw, Terminal, ChevronDown, ChevronUp, Undo2, Share2, Loader2 } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultCard } from '../Share/ResultCard';
import { useSocialShare } from '../../hooks/useSocialShare';

interface MatchOverModalProps {
  isOpen: boolean;
  state: GameState;
  onRotate: () => void;
  onReset: () => void;
  onUndo: () => void;
}

export const MatchOverModal: React.FC<MatchOverModalProps> = ({ isOpen, state, onRotate, onReset, onUndo }) => {
  const { t } = useTranslation();
  const [showLogs, setShowLogs] = useState(false);
  const { isSharing, shareResult } = useSocialShare();

  const winnerName = state.matchWinner === 'A' ? state.teamAName : state.teamBName;
  const isA = state.matchWinner === 'A';
  const report = state.rotationReport;

  const stolenIds = new Set(report?.stolenPlayers.map(p => p.id) || []);
  const coreSquad = report?.incomingTeam.players.filter(p => !stolenIds.has(p.id)) || [];
  const reinforcements = report?.stolenPlayers || [];
  const logs = report?.logs || [];

  // --- CALCULATE MVP (Highest Points) ---
  const mvpData = useMemo(() => {
     if (!state.matchLog || state.matchLog.length === 0) return null;
     
     const pointsMap = new Map<string, { total: number, name: string, team: TeamId }>();
     
     // Need to look up names since matchLog stores IDs (sometimes)
     // Or we assume the names in matchLog if we had them, but matchLog primarily has metadata
     // We will scan rosters to match IDs to names
     const playerMap = new Map<string, { name: string, team: TeamId }>();
     state.teamARoster.players.forEach(p => playerMap.set(p.id, { name: p.name, team: 'A' }));
     state.teamBRoster.players.forEach(p => playerMap.set(p.id, { name: p.name, team: 'B' }));

     state.matchLog.forEach(log => {
         if (log.type === 'POINT' && log.playerId && playerMap.has(log.playerId)) {
             const info = playerMap.get(log.playerId)!;
             const current = pointsMap.get(log.playerId) || { total: 0, name: info.name, team: info.team };
             current.total += 1;
             pointsMap.set(log.playerId, current);
         }
     });

     if (pointsMap.size === 0) return null;

     // Sort by points desc
     const sorted = Array.from(pointsMap.values()).sort((a, b) => b.total - a.total);
     const top = sorted[0];

     return top.total > 0 ? { name: top.name, totalPoints: top.total, team: top.team } : null;

  }, [state.matchLog, state.teamARoster, state.teamBRoster]);

  const handleShare = () => {
      shareResult('social-share-card', `volleyscore_result_${Date.now()}.png`);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} 
      title={t('matchOver.title')}
      showCloseButton={false}
      persistent={true}
    >
      {/* HIDDEN RENDER TARGET */}
      {isOpen && (
          <ResultCard 
             teamAName={state.teamAName}
             teamBName={state.teamBName}
             setsA={state.setsA}
             setsB={state.setsB}
             winner={state.matchWinner}
             setsHistory={state.history}
             durationSeconds={state.matchDurationSeconds}
             date={new Date().toLocaleDateString()}
             mvp={mvpData}
          />
      )}

      <div className="flex flex-col items-center text-center space-y-6">
        
        <div className="relative group mt-2">
            <div className={`absolute inset-0 blur-[50px] rounded-full opacity-40 ${isA ? 'bg-indigo-600' : 'bg-rose-600'}`}></div>
            <div className="relative flex flex-col items-center">
                <Trophy size={64} className={`${isA ? 'text-indigo-500 dark:text-indigo-400' : 'text-rose-500 dark:text-rose-400'} drop-shadow-[0_0_25px_rgba(255,255,255,0.3)] animate-bounce`} />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2 uppercase tracking-tighter">{winnerName}</h2>
                <span className="text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">{t('matchOver.wins')}</span>
            </div>
        </div>

        <div className="flex items-center gap-6 text-3xl font-black font-inter bg-black/20 dark:bg-black/40 px-6 py-3 rounded-2xl border border-black/10 dark:border-white/10 shadow-inner">
            <span className={isA ? 'text-indigo-500 dark:text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'text-slate-500 dark:text-slate-600'}>{state.setsA}</span>
            <span className="w-1 h-6 bg-black/10 dark:bg-white/10 rounded-full"></span>
            <span className={!isA ? 'text-rose-500 dark:text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'text-slate-500 dark:text-slate-600'}>{state.setsB}</span>
        </div>

        {report && (
            <div className="w-full bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl p-4 text-left border border-black/5 dark:border-white/5 space-y-3 backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                     <h3 className="font-bold text-slate-500 dark:text-slate-500 uppercase text-[10px] tracking-widest">{t('matchOver.rotationReport.title')}</h3>
                     <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">{t('matchOver.rotationReport.entering', { teamName: report.incomingTeam.name })}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs mb-4 bg-black/10 dark:bg-black/20 p-2 rounded-lg">
                    <div className="text-slate-500 dark:text-slate-500">
                        <span className="text-[9px] font-bold block uppercase opacity-50">{t('matchOver.rotationReport.leaving')}</span>
                        <span className="font-bold text-black/50 dark:text-white/50 line-through decoration-rose-500/50">{report.outgoingTeam.name}</span>
                    </div>
                    <ArrowRight size={14} className="text-slate-500 dark:text-slate-600" />
                    <div className="text-right text-emerald-600 dark:text-emerald-400">
                        <span className="text-[9px] font-bold block uppercase opacity-70">{t('matchOver.rotationReport.newSize')}</span>
                        <span className="font-bold">{t('matchOver.rotationReport.players', { count: report.incomingTeam.players.length })}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                         <p className="font-bold text-[9px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                            <Users size={10} /> {t('matchOver.rotationReport.coreSquad')}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {coreSquad.map(p => (
                                <span key={p.id} className="text-[10px] text-slate-700 dark:text-slate-300 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded border border-black/5 dark:border-white/5">
                                    {p.name}
                                </span>
                            ))}
                            {coreSquad.length === 0 && <span className="text-[10px] text-slate-500 dark:text-slate-600 italic">{t('matchOver.rotationReport.none')}</span>}
                        </div>
                    </div>

                    {reinforcements.length > 0 && (
                        <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-bold text-[9px] text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                    <ShieldAlert size={10} /> {t('matchOver.rotationReport.reinforcements')}
                                </p>
                                <span className="text-[9px] text-amber-700/60 dark:text-amber-500/60 uppercase font-bold">{t('matchOver.rotationReport.source')}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {reinforcements.map(p => (
                                    <span key={p.id} className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded">
                                        <UserPlus size={10} /> {p.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* VISUAL DEBUG LOGS */}
                {logs.length > 0 && (
                    <div className="mt-4">
                        <button 
                            onClick={() => setShowLogs(!showLogs)} 
                            className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5"
                        >
                            <span className="flex items-center gap-2"><Terminal size={12} /> {t('matchOver.debugLogs')}</span>
                            {showLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        <AnimatePresence>
                            {showLogs && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-2 bg-slate-950 text-slate-300 p-3 rounded-lg font-mono text-[9px] leading-relaxed max-h-40 overflow-y-auto custom-scrollbar text-left shadow-inner border border-white/10">
                                        {logs.map((log, idx) => (
                                            <div key={idx} className={`mb-1 ${log.includes('[WARN]') ? 'text-amber-400' : 'text-slate-400'}`}>
                                                {log}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        )}

        {/* --- BUTTONS --- */}
        <div className="flex flex-col w-full gap-3">
            <div className="flex gap-3">
                <Button 
                    onClick={handleShare} 
                    disabled={isSharing}
                    variant="secondary"
                    className="flex-1 bg-gradient-to-r from-indigo-500/10 to-rose-500/10 hover:from-indigo-500/20 hover:to-rose-500/20 border-white/10"
                >
                    {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                    <span className="whitespace-nowrap">{isSharing ? t('common.generating') : t('common.share')}</span>
                </Button>
                <Button onClick={onRotate} size="lg" className="flex-[2] shadow-emerald-500/10 bg-emerald-600 hover:bg-emerald-500 border-t border-white/20">
                    <RefreshCw size={18} />
                    {t('matchOver.nextGameButton')}
                </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <Button onClick={onUndo} size="md" variant="secondary" className="w-full">
                    <Undo2 size={16} />
                    {t('controls.undo')}
                </Button>
                <Button onClick={onReset} size="md" variant="secondary" className="w-full text-rose-500 hover:text-rose-600 border-rose-500/20 hover:bg-rose-500/10">
                    <RotateCcw size={16} />
                    {t('controls.reset')}
                </Button>
            </div>
        </div>
      </div>
    </Modal>
  );
};