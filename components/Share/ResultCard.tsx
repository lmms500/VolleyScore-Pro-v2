import React, { memo } from 'react';
import { TeamId } from '../../types';
import { Trophy, Calendar, Zap, Activity, Crown } from 'lucide-react';

interface ResultCardProps {
  teamAName: string;
  teamBName: string;
  setsA: number;
  setsB: number;
  winner: TeamId | null;
  setsHistory: { setNumber: number; scoreA: number; scoreB: number; winner: TeamId }[];
  mvp?: { name: string; totalPoints: number; team: TeamId } | null;
  durationSeconds: number;
  date: string;
}

export const ResultCard: React.FC<ResultCardProps> = memo(({
  teamAName, teamBName, setsA, setsB, winner, setsHistory, mvp, durationSeconds, date
}) => {
  
  // Format duration
  const h = Math.floor(durationSeconds / 3600);
  const m = Math.floor((durationSeconds % 3600) / 60);
  const durationStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

  const isWinnerA = winner === 'A';

  return (
    <div 
      id="social-share-card"
      className="relative w-[1080px] h-[1350px] bg-[#020617] text-white overflow-hidden font-inter flex flex-col"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: '-9999px', // Hidden from view but renderable
        zIndex: -1 
      }}
    >
      {/* --- BACKGROUND FX --- */}
      <div className="absolute inset-0 z-0">
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        
        {/* Dynamic Gradients based on Winner */}
        <div className={`absolute -top-[10%] -left-[10%] w-[1000px] h-[1000px] rounded-full blur-[180px] opacity-40 mix-blend-screen ${isWinnerA ? 'bg-indigo-600' : 'bg-rose-600'}`}></div>
        <div className={`absolute bottom-[10%] -right-[10%] w-[1000px] h-[1000px] rounded-full blur-[180px] opacity-40 mix-blend-screen ${!isWinnerA ? 'bg-indigo-600' : 'bg-rose-600'}`}></div>
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 flex flex-col h-full p-20 justify-between">
        
        {/* HEADER */}
        <div className="flex justify-between items-start">
           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 w-fit shadow-lg">
                 <Calendar size={28} className="text-slate-300" />
                 <span className="text-3xl font-bold uppercase tracking-widest text-slate-200">{date}</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 w-fit shadow-lg">
                 <Zap size={28} className="text-amber-400" />
                 <span className="text-3xl font-bold uppercase tracking-widest text-slate-300">{durationStr} Match</span>
              </div>
           </div>
           
           <div className="flex flex-col items-end">
              <h1 className="text-4xl font-black uppercase tracking-[0.25em] text-white/30">Match Result</h1>
              <div className="h-1.5 w-32 bg-gradient-to-r from-indigo-500 to-rose-500 mt-4 rounded-full"></div>
           </div>
        </div>

        {/* SCOREBOARD CENTER */}
        <div className="flex flex-col items-center gap-16 my-auto w-full">
            
            {/* Main Score Row */}
            <div className="flex items-center justify-between w-full">
                {/* Team A */}
                <div className={`flex-1 flex flex-col items-center text-center gap-6 ${isWinnerA ? 'scale-110' : 'opacity-70 grayscale-[0.3]'}`}>
                    {isWinnerA && (
                        <div className="bg-indigo-500/20 p-6 rounded-full border border-indigo-500/30 mb-2 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                            <Crown size={64} className="text-indigo-400" fill="currentColor" />
                        </div>
                    )}
                    <h2 className={`text-6xl font-black uppercase leading-tight tracking-tight break-words max-w-[400px] ${isWinnerA ? 'text-white drop-shadow-[0_0_30px_rgba(129,140,248,0.4)]' : 'text-slate-400'}`}>
                        {teamAName}
                    </h2>
                </div>

                {/* VS / Score */}
                <div className="flex items-center gap-10 bg-white/5 backdrop-blur-3xl px-16 py-8 rounded-[4rem] border border-white/10 shadow-2xl relative">
                     <div className="absolute inset-0 rounded-[4rem] border border-white/5 pointer-events-none"></div>
                     <span className={`text-[14rem] font-black leading-none tabular-nums tracking-tighter ${winner === 'A' ? 'text-indigo-500 drop-shadow-[0_0_50px_rgba(99,102,241,0.6)]' : 'text-slate-600'}`}>
                        {setsA}
                     </span>
                     <div className="h-48 w-[2px] bg-white/10 rounded-full"></div>
                     <span className={`text-[14rem] font-black leading-none tabular-nums tracking-tighter ${winner === 'B' ? 'text-rose-500 drop-shadow-[0_0_50px_rgba(244,63,94,0.6)]' : 'text-slate-600'}`}>
                        {setsB}
                     </span>
                </div>

                {/* Team B */}
                <div className={`flex-1 flex flex-col items-center text-center gap-6 ${!isWinnerA ? 'scale-110' : 'opacity-70 grayscale-[0.3]'}`}>
                    {!isWinnerA && (
                        <div className="bg-rose-500/20 p-6 rounded-full border border-rose-500/30 mb-2 shadow-[0_0_40px_rgba(244,63,94,0.3)]">
                            <Crown size={64} className="text-rose-400" fill="currentColor" />
                        </div>
                    )}
                    <h2 className={`text-6xl font-black uppercase leading-tight tracking-tight break-words max-w-[400px] ${!isWinnerA ? 'text-white drop-shadow-[0_0_30px_rgba(244,63,94,0.4)]' : 'text-slate-400'}`}>
                        {teamBName}
                    </h2>
                </div>
            </div>

            {/* Set History Strip */}
            <div className="flex gap-4 p-4 bg-white/5 rounded-3xl backdrop-blur-md border border-white/5">
                {setsHistory.map((set, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 px-4">
                        <span className="text-lg font-bold text-slate-500 uppercase tracking-widest">Set {set.setNumber}</span>
                        <div className={`
                            px-8 py-3 rounded-2xl text-4xl font-bold border-2 shadow-lg
                            ${set.winner === 'A' 
                                ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30' 
                                : 'bg-rose-500/20 text-rose-200 border-rose-500/30'}
                        `}>
                            {set.scoreA}-{set.scoreB}
                        </div>
                    </div>
                ))}
            </div>

            {/* MVP Card (Conditional) */}
            {mvp && (
                <div className="relative group w-full max-w-2xl">
                    <div className="absolute inset-0 bg-amber-500/30 blur-3xl rounded-full opacity-60"></div>
                    <div className="relative bg-gradient-to-r from-amber-500/10 to-amber-900/40 backdrop-blur-2xl border border-amber-500/30 rounded-[2.5rem] p-8 flex items-center gap-8 shadow-2xl">
                        <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 p-6 rounded-[1.5rem] shadow-lg shadow-amber-500/20">
                            <Trophy size={64} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                            <span className="block text-2xl font-bold text-amber-500 uppercase tracking-[0.2em] mb-1">Match MVP</span>
                            <span className="block text-6xl font-black text-amber-100 uppercase tracking-tight leading-none">{mvp.name}</span>
                        </div>
                        <div className="flex flex-col items-end border-l border-amber-500/30 pl-8">
                            <div className="text-amber-400 font-bold text-6xl tabular-nums leading-none">{mvp.totalPoints}</div>
                            <span className="text-amber-500/60 font-bold uppercase tracking-wider text-sm mt-1">Total Points</span>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-end border-t border-white/10 pt-10 mt-4">
            <div className="flex flex-col gap-2">
                 <span className="text-3xl font-bold text-slate-500 uppercase tracking-widest">Scoreboard by</span>
                 <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400 uppercase tracking-tighter drop-shadow-lg">
                    VolleyScore Pro
                 </span>
            </div>
            
            <div className="flex items-center gap-2 opacity-60">
                 <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                    <Activity size={32} className="text-white" />
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
});