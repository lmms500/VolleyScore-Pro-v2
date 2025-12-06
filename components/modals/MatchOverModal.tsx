
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom'; // Import createPortal
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { GameState, TeamId } from '../../types';
import { Trophy, RefreshCw, ArrowRight, UserPlus, ShieldAlert, Users, RotateCcw, Terminal, ChevronDown, ChevronUp, Undo2, Share2, Loader2 } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultCard } from '../Share/ResultCard';
import { useSocialShare } from '../../hooks/useSocialShare';
import { resolveTheme } from '../../utils/colors';
import { Confetti } from '../ui/Confetti';

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
  const [renderShareCard, setRenderShareCard] = useState(false);
  const { isSharing, shareResult } = useSocialShare();

  const winnerName = state.matchWinner === 'A' ? state.teamAName : state.teamBName;
  const isA = state.matchWinner === 'A';
  const report = state.rotationReport;

  // Resolve Colors Dynamically
  const colorA = state.teamARoster.color || 'indigo';
  const colorB = state.teamBRoster.color || 'rose';
  
  const winnerColorKey = isA ? colorA : colorB;
  const winnerTheme = resolveTheme(winnerColorKey);
  
  // Mapping for background blur
  const getBgColor = (c: string) => {
      if (c.startsWith('#')) return `bg-[${c}]`;
      const mapping: any = {
        indigo: 'bg-indigo-600', rose: 'bg-rose-600', emerald: 'bg-emerald-600', amber: 'bg-amber-600', 
        sky: 'bg-sky-600', violet: 'bg-violet-600', slate: 'bg-slate-600', fuchsia: 'bg-fuchsia-600'
      };
      return mapping[c] || 'bg-indigo-600';
  };
  const winnerBgColor = getBgColor(winnerColorKey);

  const stolenIds = new Set(report?.stolenPlayers.map(p => p.id) || []);
  const coreSquad = report?.incomingTeam.players.filter(p => !stolenIds.has(p.id)) || [];
  const reinforcements = report?.stolenPlayers || [];
  const logs = report?.logs || [];

  // --- CALCULATE MVP (Highest Points) ---
  const mvpData = useMemo(() => {
     if (!state.matchLog || state.matchLog.length === 0) return null;
     
     const pointsMap = new Map<string, { total: number, name: string, team: TeamId }>();
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
     const sorted = Array.from(pointsMap.values()).sort((a, b) => b.total - a.total);
     const top = sorted[0];
     return top.total > 0 ? { name: top.name, totalPoints: top.total, team: top.team } : null;

  }, [state.matchLog, state.teamARoster, state.teamBRoster]);

  const handleShare = () => {
      // 1. Trigger render of the heavy ResultCard
      setRenderShareCard(true);
      
      // 2. Wait briefly for React to mount it and layout to stabilize, then capture
      setTimeout(() => {
          const dateStr = new Date().toISOString().split('T')[0];
          shareResult('social-share-card', `volleyscore_result_${dateStr}.png`);
      }, 500);
  };

  // Reset share card state when modal closes to save resources
  if (!isOpen && renderShareCard) {
      setRenderShareCard(false);
  }

  return (
    <>
      {/* HIDDEN RENDER TARGET FOR SHARING - PORTALED TO BODY TO AVOID CSS TRANSFORMS */}
      {/* Performance Fix: Strictly ensuring this is not in DOM until requested */}
      {renderShareCard && createPortal(
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
             colorA={colorA}
             colorB={colorB}
          />,
          document.body
      )}

      <Modal 
        isOpen={isOpen} 
        onClose={() => {}} 
        title={t('matchOver.title')}
        showCloseButton={false}
        persistent={true}
      >
        {/* Confetti Overlay - Use will-change to hint compositor */}
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none z-0 opacity-50" style={{ willChange: 'transform, opacity' }}>
            <Confetti color={winnerColorKey} />
        </div>

        <div className="flex flex-col items-center text-center space-y-6 relative z-10">
          
          <div className="relative group mt-2">
              <div className={`absolute inset-0 blur-[60px] rounded-full opacity-60 ${winnerBgColor}`} style={{ willChange: 'opacity' }}></div>
              <div className="relative flex flex-col items-center">
                  <Trophy size={72} className={`${winnerTheme.text} ${winnerTheme.textDark} drop-shadow-[0_0_30px_currentColor] animate-bounce`} />
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-4 uppercase tracking-tighter drop-shadow-sm">{winnerName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                      <span className="h-px w-8 bg-slate-400/50"></span>
                      <span className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">{t('matchOver.wins')}</span>
                      <span className="h-px w-8 bg-slate-400/50"></span>
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-6 text-4xl font-black font-inter bg-white/40 dark:bg-black/40 px-8 py-4 rounded-3xl border border-white/20 dark:border-white/10 shadow-xl backdrop-blur-xl">
              <span className={isA ? `${winnerTheme.text} ${winnerTheme.textDark} drop-shadow-[0_0_15px_currentColor]` : 'text-slate-400 dark:text-slate-600'}>{state.setsA}</span>
              <div className="h-8 w-[2px] bg-slate-300 dark:bg-slate-700 rounded-full opacity-30"></div>
              <span className={!isA ? `${winnerTheme.text} ${winnerTheme.textDark} drop-shadow-[0_0_15px_currentColor]` : 'text-slate-400 dark:text-slate-600'}>{state.setsB}</span>
          </div>

          {report && (
              <div className="w-full bg-white/50 dark:bg-white/[0.03] rounded-2xl p-4 text-left border border-black/5 dark:border-white/5 space-y-3 backdrop-blur-md shadow-sm">
                  <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                       <h3 className="font-bold text-slate-500 dark:text-slate-500 uppercase text-[10px] tracking-widest">{t('matchOver.rotationReport.title')}</h3>
                       <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">{t('matchOver.rotationReport.entering', { teamName: report.incomingTeam.name })}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs mb-4 bg-black/5 dark:bg-black/20 p-2 rounded-lg">
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
                                  <span key={p.id} className="text-[10px] text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-white/5 px-2 py-0.5 rounded border border-black/5 dark:border-white/5 shadow-sm">
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
                                      <span key={p.id} className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded shadow-sm">
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
                              className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 transition-colors"
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

          <div className="flex flex-col w-full gap-3 mt-4">
              <div className="flex gap-3">
                   <Button 
                      onClick={handleShare} 
                      disabled={isSharing}
                      variant="secondary"
                      className="flex-shrink-0 bg-white/50 dark:bg-indigo-500/10 hover:bg-white dark:hover:bg-indigo-500/20 text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 border-indigo-500/20 shadow-sm"
                      title={t('matchOver.share')}
                  >
                      {isSharing || renderShareCard ? <Loader2 size={20} className="animate-spin" /> : <Share2 size={20} />}
                  </Button>
                  
                  <Button onClick={onRotate} size="lg" className="w-full shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 border-t border-white/20 text-white font-black tracking-wide">
                      <RefreshCw size={18} />
                      {t('matchOver.nextGameButton')}
                  </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                  <Button onClick={onUndo} size="md" variant="secondary" className="w-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10">
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
    </>
  );
};
