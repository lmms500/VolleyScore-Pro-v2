

import React, { useState, useMemo } from 'react';
import { Match } from '../../stores/historyStore';
import { Player, SkillType } from '../../types';
import { downloadJSON } from '../../services/io';
import { useTranslation } from '../../contexts/LanguageContext';
import { 
  ArrowLeft, Download, Clock, Calendar, 
  Shield, Play, ChevronLeft, ChevronRight, RotateCcw,
  Crown, Target, Swords, Activity, AlertTriangle, Zap,
  BarChart3, Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MatchDetailProps {
  match: Match;
  onBack: () => void;
}

// --- SUB-COMPONENTS ---

const TeamHero = ({ name, winner, isRight = false }: { name: string, winner: boolean, isRight?: boolean }) => {
    return (
        <div className={`flex flex-col justify-center ${isRight ? 'items-start md:items-end' : 'items-end md:items-start'} relative z-10 max-w-full`}>
             <div className="flex items-center gap-2 md:gap-3">
                 {winner && !isRight && <Crown size={20} className="text-indigo-400 fill-indigo-400/20 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)] flex-shrink-0" />}
                 
                 <h2 className={`
                    text-lg sm:text-2xl md:text-4xl font-black uppercase tracking-tighter transition-all leading-none break-words max-w-[120px] sm:max-w-[200px] md:max-w-md
                    ${winner 
                        ? (isRight ? 'text-rose-500 dark:text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'text-indigo-500 dark:text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.4)]') 
                        : 'text-slate-400 dark:text-slate-600'}
                 `}>
                    {name}
                 </h2>
                 
                 {winner && isRight && <Crown size={20} className="text-rose-400 fill-rose-400/20 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)] flex-shrink-0" />}
             </div>
             {winner && (
                <div className={`h-1 rounded-full mt-2 w-8 md:w-12 ${isRight ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(129,140,248,0.6)]'}`} />
             )}
        </div>
    );
};

const StatBar = ({ 
    label, 
    valueA, 
    valueB, 
    icon: Icon 
}: { 
    label: string, 
    valueA: number, 
    valueB: number, 
    icon: any 
}) => {
    const total = valueA + valueB;
    const percentA = total === 0 ? 50 : (valueA / total) * 100;
    const percentB = total === 0 ? 50 : (valueB / total) * 100;

    if (total === 0) return null;

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <div className="flex justify-between items-end text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                <span className="text-indigo-400">{valueA}</span>
                <span className="flex items-center gap-1.5 opacity-70"><Icon size={12} /> {label}</span>
                <span className="text-rose-400">{valueB}</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex relative">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentA}%` }}
                    transition={{ duration: 1, ease: "circOut" }}
                    className="h-full bg-gradient-to-r from-indigo-900 to-indigo-500"
                />
                <div className="w-0.5 h-full bg-slate-950 z-10"></div>
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentB}%` }}
                    transition={{ duration: 1, ease: "circOut" }}
                    className="h-full bg-gradient-to-l from-rose-900 to-rose-500"
                />
            </div>
        </div>
    );
};

interface CalculatedStat {
    id: string;
    name: string;
    team: 'A' | 'B' | 'Unknown';
    skillLevel: number;
    total: number;
    attack: number;
    block: number;
    ace: number;
}

const PlayerStatCard = ({ 
    stats, 
    isMVP 
}: { 
    stats: CalculatedStat, 
    isMVP: boolean 
}) => {
    if (stats.total === 0) return null;

    const colorClass = stats.team === 'A' ? 'text-indigo-400' : (stats.team === 'B' ? 'text-rose-400' : 'text-slate-400');
    const bgClass = stats.team === 'A' ? 'bg-indigo-500' : (stats.team === 'B' ? 'bg-rose-500' : 'bg-slate-500');

    return (
        <div className={`
            relative p-3 rounded-xl border transition-all duration-300
            ${isMVP 
                ? 'bg-gradient-to-br from-amber-500/10 to-amber-900/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}
        `}>
            {isMVP && (
                <div className="absolute top-0 right-0 p-2">
                    <Crown size={12} className="text-amber-400 fill-amber-400" />
                </div>
            )}
            
            <div className="flex items-center gap-3 mb-3">
                <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-inner
                    ${isMVP ? 'bg-gradient-to-br from-amber-400 to-amber-600' : bgClass}
                `}>
                    {stats.name.charAt(0)}
                </div>
                <div className="min-w-0">
                    <h4 className={`text-sm font-bold truncate ${isMVP ? 'text-amber-100' : 'text-slate-200'}`}>
                        {stats.name}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {stats.team === 'Unknown' ? 'Guest / Unknown' : `Level ${stats.skillLevel}`}
                    </span>
                </div>
                <div className="ml-auto flex flex-col items-end">
                    <span className={`text-lg font-black leading-none ${isMVP ? 'text-amber-400' : 'text-white'}`}>
                        {stats.total}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">PTS</span>
                </div>
            </div>

            {/* Micro Stats Grid */}
            <div className="grid grid-cols-3 gap-1">
                <div className="bg-black/20 rounded-lg p-1.5 flex flex-col items-center justify-center border border-white/5" title="Attacks/Kills">
                    <Swords size={12} className="text-slate-400 mb-0.5" />
                    <span className="text-xs font-bold text-white tabular-nums">{stats.attack}</span>
                </div>
                <div className="bg-black/20 rounded-lg p-1.5 flex flex-col items-center justify-center border border-white/5" title="Blocks">
                    <Shield size={12} className="text-slate-400 mb-0.5" />
                    <span className="text-xs font-bold text-white tabular-nums">{stats.block}</span>
                </div>
                <div className="bg-black/20 rounded-lg p-1.5 flex flex-col items-center justify-center border border-white/5" title="Aces">
                    <Target size={12} className="text-slate-400 mb-0.5" />
                    <span className="text-xs font-bold text-white tabular-nums">{stats.ace}</span>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export const MatchDetail: React.FC<MatchDetailProps> = ({ match, onBack }) => {
  const { t } = useTranslation();
  const [replayIndex, setReplayIndex] = useState<number>(-1);

  // --- DERIVED STATS ---
  
  const totalPointsA = useMemo(() => match.sets.reduce((acc, s) => acc + s.scoreA, 0), [match.sets]);
  const totalPointsB = useMemo(() => match.sets.reduce((acc, s) => acc + s.scoreB, 0), [match.sets]);
  
  // Robust check for stats availability directly from the source of truth
  const hasDetailedStats = useMemo(() => {
      // Check if ANY point log contains a playerId
      return (match as any).actionLog?.some((log: any) => log.type === 'POINT' && log.playerId);
  }, [match]);

  // Aggregate Stats Logic - ROBUST VERSION
  const { playerStats, teamStats } = useMemo(() => {
      const pStats: Record<string, CalculatedStat> = {};
      const tStats = {
          A: { attack: 0, block: 0, ace: 0, error_gain: 0 },
          B: { attack: 0, block: 0, ace: 0, error_gain: 0 }
      };
      
      // 1. Initialize known players from roster (even if they didn't score)
      match.teamARoster?.players?.forEach(p => {
          pStats[p.id] = { id: p.id, name: p.name, team: 'A', skillLevel: p.skillLevel, total: 0, attack: 0, block: 0, ace: 0 };
      });
      match.teamBRoster?.players?.forEach(p => {
          pStats[p.id] = { id: p.id, name: p.name, team: 'B', skillLevel: p.skillLevel, total: 0, attack: 0, block: 0, ace: 0 };
      });

      // 2. Process Logs
      const logs = (match as any).actionLog || [];
      
      logs.forEach((log: any) => {
          if (log.type === 'POINT') {
             const team = log.team as 'A' | 'B';
             const skill = log.skill as SkillType | undefined;
             const playerId = log.playerId;
             
             // Team Aggregates
             if (skill === 'attack') tStats[team].attack++;
             else if (skill === 'block') tStats[team].block++;
             else if (skill === 'ace') tStats[team].ace++;
             else if (skill === 'opponent_error') tStats[team].error_gain++;
             
             // Player Specifics
             if (playerId) {
                 // Dynamic initialization for 'unknown' or ghost players not in initial roster
                 if (!pStats[playerId]) {
                     const isUnknown = playerId === 'unknown';
                     pStats[playerId] = {
                         id: playerId,
                         name: isUnknown ? 'Unknown Player' : 'Ghost Player',
                         team: isUnknown ? 'Unknown' : team, // Guess team based on log
                         skillLevel: 0,
                         total: 0, attack: 0, block: 0, ace: 0
                     };
                 }

                 pStats[playerId].total += 1;
                 if (skill === 'attack') pStats[playerId].attack += 1;
                 if (skill === 'block') pStats[playerId].block += 1;
                 if (skill === 'ace') pStats[playerId].ace += 1;
             }
          }
      });

      return { 
          playerStats: Object.values(pStats).sort((a, b) => {
              if (b.total !== a.total) return b.total - a.total; // Sort by Points
              return a.name.localeCompare(b.name); // Then Alphabetical
          }),
          teamStats: tStats 
      };
  }, [match]);

  const topScorer = playerStats.length > 0 && playerStats[0].total > 0 ? playerStats[0] : null;

  // Replay Logic
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

  const currentReplaySet = replayIndex >= 0 ? match.sets[replayIndex] : null;

  // Formatting
  const dateStr = new Date(match.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col h-full bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white overflow-hidden rounded-3xl"
    >
      {/* --- NAVBAR --- */}
      <div className="flex-none flex items-center justify-between p-4 bg-transparent z-20">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <ArrowLeft size={16} /> {t('common.done')}
        </button>
        <button onClick={() => downloadJSON(`match_${match.id.slice(0, 8)}`, match)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-indigo-500 transition-colors">
            <Download size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
            
            {/* 1. HERO SCOREBOARD */}
            <div className="flex flex-col items-center relative py-4 md:py-8">
                {/* Glows */}
                <div className={`absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-64 md:h-64 bg-indigo-500/20 blur-[80px] md:blur-[100px] rounded-full pointer-events-none ${match.winner === 'A' ? 'opacity-100' : 'opacity-20'}`} />
                <div className={`absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-64 md:h-64 bg-rose-500/20 blur-[80px] md:blur-[100px] rounded-full pointer-events-none ${match.winner === 'B' ? 'opacity-100' : 'opacity-20'}`} />

                {/* Date Badge */}
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 bg-white/40 dark:bg-white/5 px-4 py-1.5 rounded-full border border-white/20 dark:border-white/5 backdrop-blur-md">
                    <span className="flex items-center gap-1.5"><Calendar size={10} /> {dateStr}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    <span className="flex items-center gap-1.5"><Clock size={10} /> {timeStr}</span>
                </div>

                {/* Score Row */}
                <div className="w-full flex items-center justify-center gap-2 md:gap-8 z-10 px-2">
                    <div className="flex-1 text-right min-w-0"><TeamHero name={match.teamAName} winner={match.winner === 'A'} isRight={false} /></div>
                    
                    <div className="flex-shrink-0 flex flex-col items-center justify-center relative min-w-[120px]">
                        <div className="flex items-center gap-2 md:gap-6 font-black font-inter tracking-tighter tabular-nums leading-none drop-shadow-2xl">
                            <span className={`text-5xl sm:text-7xl md:text-8xl ${match.winner === 'A' ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-700'}`}>{match.setsA}</span>
                            <span className="text-slate-300 dark:text-slate-700 text-2xl md:text-3xl opacity-50 relative -top-1 md:-top-2">:</span>
                            <span className={`text-5xl sm:text-7xl md:text-8xl ${match.winner === 'B' ? 'text-rose-500' : 'text-slate-300 dark:text-slate-700'}`}>{match.setsB}</span>
                        </div>
                    </div>

                    <div className="flex-1 text-left min-w-0"><TeamHero name={match.teamBName} winner={match.winner === 'B'} isRight={true} /></div>
                </div>
            </div>

            {/* 2. MATCH INSIGHTS (General Stats) */}
            <div className="bg-slate-100/50 dark:bg-white/[0.03] rounded-3xl p-6 border border-white/20 dark:border-white/5 backdrop-blur-sm shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <BarChart3 size={16} /> Match Insights
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {/* Column 1: Core Stats */}
                    <div className="space-y-6">
                         <StatBar label="Total Points" valueA={totalPointsA} valueB={totalPointsB} icon={Zap} />
                         {hasDetailedStats && (
                             <>
                                <StatBar label="Kills (Attacks)" valueA={teamStats.A.attack} valueB={teamStats.B.attack} icon={Swords} />
                                <StatBar label="Walls (Blocks)" valueA={teamStats.A.block} valueB={teamStats.B.block} icon={Shield} />
                             </>
                         )}
                    </div>
                    {/* Column 2: Service & Errors */}
                    <div className="space-y-6">
                        {hasDetailedStats ? (
                             <>
                                <StatBar label="Aces (Service)" valueA={teamStats.A.ace} valueB={teamStats.B.ace} icon={Target} />
                                <StatBar label="Opponent Errors" valueA={teamStats.A.error_gain} valueB={teamStats.B.error_gain} icon={AlertTriangle} />
                                {topScorer && (
                                    <div className="p-3 bg-black/5 rounded-xl text-center">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">MVP of the Match</span>
                                        <span className="text-lg font-black text-amber-500 flex items-center justify-center gap-2">
                                            <Crown size={18} fill="currentColor" /> {topScorer.name}
                                        </span>
                                    </div>
                                )}
                             </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-xs italic border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl p-4">
                                Scout stats not available for this match.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. SQUAD PERFORMANCE (Detailed Roster Stats) */}
            {hasDetailedStats && (
                <div>
                     <div className="flex items-center gap-2 mb-4 px-2">
                        <Activity size={16} className="text-cyan-400" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Squad Performance</h3>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Team A Roster */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2 px-1">
                                {match.teamAName}
                            </h4>
                            {playerStats.filter(p => p.team === 'A').map(stat => (
                                <PlayerStatCard 
                                    key={stat.id} 
                                    stats={stat} 
                                    isMVP={topScorer?.id === stat.id} 
                                />
                            ))}
                            {playerStats.filter(p => p.team === 'A').length === 0 && (
                                <div className="text-xs text-slate-500 italic px-2">No stats recorded for {match.teamAName}</div>
                            )}
                        </div>

                        {/* Team B Roster */}
                        <div className="space-y-3">
                             <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-2 px-1 text-right">
                                {match.teamBName}
                            </h4>
                            {playerStats.filter(p => p.team === 'B').map(stat => (
                                <PlayerStatCard 
                                    key={stat.id} 
                                    stats={stat} 
                                    isMVP={topScorer?.id === stat.id} 
                                />
                            ))}
                             {playerStats.filter(p => p.team === 'B').length === 0 && (
                                <div className="text-xs text-slate-500 italic px-2 text-right">No stats recorded for {match.teamBName}</div>
                            )}
                        </div>
                     </div>
                     
                     {/* Unknown / Ghost Players Section */}
                     {playerStats.some(p => p.team === 'Unknown') && (
                         <div className="mt-8 pt-6 border-t border-white/5">
                             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Unassigned / Unknown</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {playerStats.filter(p => p.team === 'Unknown').map(stat => (
                                    <PlayerStatCard key={stat.id} stats={stat} isMVP={false} />
                                ))}
                             </div>
                         </div>
                     )}
                </div>
            )}

            {/* 4. TIMELINE */}
            <div className="bg-white/40 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/5 overflow-hidden backdrop-blur-sm shadow-sm">
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Play size={12} /> Timeline Replay
                    </h3>
                    <div className="flex items-center gap-1 bg-black/5 dark:bg-black/20 p-1 rounded-lg">
                        <button disabled={replayIndex === -1} onClick={() => setReplayIndex(prev => Math.max(-1, prev - 1))} className="p-1 rounded hover:bg-white/50 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"><ChevronLeft size={14} /></button>
                        <span className="text-[10px] font-mono tabular-nums w-16 text-center text-slate-500 dark:text-slate-300 font-bold">{replayIndex === -1 ? "START" : `SET ${replayIndex + 1}`}</span>
                        <button disabled={replayIndex >= match.sets.length - 1} onClick={() => setReplayIndex(prev => Math.min(match.sets.length - 1, prev + 1))} className="p-1 rounded hover:bg-white/50 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"><ChevronRight size={14} /></button>
                        <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                        <button onClick={() => setReplayIndex(-1)} className="p-1 hover:text-rose-500 transition-colors"><RotateCcw size={12} /></button>
                    </div>
                </div>
                
                <div className="p-8 flex flex-col items-center justify-center h-48 relative">
                        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                        <div className="w-full h-px bg-slate-500"></div>
                        <div className="h-full w-px bg-slate-500 absolute"></div>
                        </div>

                        <AnimatePresence mode="wait">
                        <motion.div
                            key={replayIndex}
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            className="w-full"
                        >
                            {replayIndex === -1 ? (
                                <div className="flex flex-col items-center text-slate-400 opacity-60">
                                    <Shield size={48} strokeWidth={1} className="mb-4 text-slate-300 dark:text-slate-700" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Match Start</p>
                                </div>
                            ) : currentReplaySet ? (
                                <div className="flex flex-col items-center w-full">
                                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 w-full max-w-md mb-4">
                                        <span className={`justify-self-end text-5xl md:text-6xl font-black ${currentReplaySet.winner === 'A' ? 'text-indigo-500 drop-shadow-lg' : 'text-slate-300 dark:text-slate-800'}`}>
                                            {currentReplaySet.scoreA}
                                        </span>
                                        <div className="justify-self-center flex items-center justify-center px-4 py-1.5 bg-white dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5 min-w-[80px]">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                                SET {currentReplaySet.setNumber}
                                            </span>
                                        </div>
                                        <span className={`justify-self-start text-5xl md:text-6xl font-black ${currentReplaySet.winner === 'B' ? 'text-rose-500 drop-shadow-lg' : 'text-slate-300 dark:text-slate-800'}`}>
                                            {currentReplaySet.scoreB}
                                        </span>
                                    </div>

                                    <div className="px-4 py-1.5 bg-slate-100 dark:bg-black/30 rounded-full text-xs font-mono text-slate-500 border border-slate-200 dark:border-white/5">
                                        Sets: <span className="text-indigo-500 font-bold">{replayStats.setsA}</span> - <span className="text-rose-500 font-bold">{replayStats.setsB}</span>
                                    </div>
                                </div>
                            ) : null}
                        </motion.div>
                        </AnimatePresence>
                </div>
            </div>

        </div>
      </div>
    </motion.div>
  );
};