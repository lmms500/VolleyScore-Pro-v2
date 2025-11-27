import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { GameState } from '../../types';
import { Trophy, RefreshCw, ArrowRight, UserPlus, ShieldAlert, Users } from 'lucide-react';

interface MatchOverModalProps {
  isOpen: boolean;
  state: GameState;
  onRotate: () => void;
  onClose: () => void;
}

export const MatchOverModal: React.FC<MatchOverModalProps> = ({ isOpen, state, onRotate, onClose }) => {
  const winnerName = state.matchWinner === 'A' ? state.teamAName : state.teamBName;
  const isA = state.matchWinner === 'A';
  const report = state.rotationReport;

  // Separate the full incoming team into Core (Original) and Stolen (Reinforcements)
  const stolenIds = new Set(report?.stolenPlayers.map(p => p.id) || []);
  const coreSquad = report?.incomingTeam.players.filter(p => !stolenIds.has(p.id)) || [];
  const reinforcements = report?.stolenPlayers || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Match Result">
      <div className="flex flex-col items-center text-center space-y-6">
        
        {/* Winner Announcement */}
        <div className="relative group mt-2">
            <div className={`absolute inset-0 blur-[50px] rounded-full opacity-40 ${isA ? 'bg-indigo-600' : 'bg-rose-600'}`}></div>
            <div className="relative flex flex-col items-center">
                <Trophy size={64} className={`${isA ? 'text-indigo-400' : 'text-rose-400'} drop-shadow-[0_0_25px_rgba(255,255,255,0.3)] animate-bounce`} />
                <h2 className="text-2xl font-black text-white mt-2 uppercase tracking-tighter">{winnerName}</h2>
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Wins the Match</span>
            </div>
        </div>

        {/* Final Score Pill */}
        <div className="flex items-center gap-6 text-3xl font-black font-inter bg-black/40 px-6 py-3 rounded-2xl border border-white/10 shadow-inner">
            <span className={isA ? 'text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'text-slate-600'}>{state.setsA}</span>
            <span className="w-1 h-6 bg-white/10 rounded-full"></span>
            <span className={!isA ? 'text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'text-slate-600'}>{state.setsB}</span>
        </div>

        {/* Rotation Report HUD */}
        {report && (
            <div className="w-full bg-white/[0.03] rounded-2xl p-4 text-left border border-white/5 space-y-3 backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                     <h3 className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Rotation Report</h3>
                     <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{report.incomingTeam.name} Entering</span>
                </div>
                
                <div className="flex items-center justify-between text-xs mb-4 bg-black/20 p-2 rounded-lg">
                    <div className="text-slate-500">
                        <span className="text-[9px] font-bold block uppercase opacity-50">Leaving</span>
                        <span className="font-bold text-white/50 line-through decoration-rose-500/50">{report.outgoingTeam.name}</span>
                    </div>
                    <ArrowRight size={14} className="text-slate-600" />
                    <div className="text-right text-emerald-400">
                        <span className="text-[9px] font-bold block uppercase opacity-70">New Roster Size</span>
                        <span className="font-bold">{report.incomingTeam.players.length} Players</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {/* CORE SQUAD */}
                    <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                         <p className="font-bold text-[9px] text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                            <Users size={10} /> Core Squad (Queue)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {coreSquad.map(p => (
                                <span key={p.id} className="text-[10px] text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                    {p.name}
                                </span>
                            ))}
                            {coreSquad.length === 0 && <span className="text-[10px] text-slate-600 italic">None</span>}
                        </div>
                    </div>

                    {/* REINFORCEMENTS */}
                    {reinforcements.length > 0 && (
                        <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-bold text-[9px] text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                    <ShieldAlert size={10} /> Reinforcements
                                </p>
                                <span className="text-[9px] text-amber-500/60 uppercase font-bold">Stolen / Recycled</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {reinforcements.map(p => (
                                    <span key={p.id} className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-200 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded">
                                        <UserPlus size={10} /> {p.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        <Button onClick={onRotate} size="lg" className="w-full shadow-emerald-500/10 bg-emerald-600 hover:bg-emerald-500 border-t border-white/20">
            <RefreshCw size={18} />
            Start Next Game
        </Button>
      </div>
    </Modal>
  );
};