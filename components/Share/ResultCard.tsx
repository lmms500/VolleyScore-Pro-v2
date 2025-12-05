import React, { memo } from 'react';
import { TeamId } from '../../types';
import { Trophy, Crown, Calendar, Zap, Activity } from 'lucide-react';

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
      className="relative w-[1080px] h-[1080px] bg-[#020617] text-white overflow-hidden font-inter flex flex-col"
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
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        
        {/* Dynamic Gradients based on Winner */}
        <div className={`absolute -top-[20%] -left-[20%] w-[900px] h-[900px] rounded-full blur-[150px] mix-blend-screen opacity-40 ${isWinnerA ? 'bg-indigo-600' : 'bg-rose-600'}`}></div>
        <div className={`absolute -bottom-[20%] -right-[20%] w-[900px] h-[900px] rounded-full blur-[150px] mix-blend-screen opacity-40 ${!isWinnerA ? 'bg-indigo-600' : 'bg-rose-600'}`}></div>
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 flex flex-col h-full p-16 justify-between">
        
        {/* HEADER */}
        <div className="flex justify-between items-start">
           <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 w-fit">
                 <Calendar size={24} className="text-slate-300" />
                 <span className="text-2xl font-bold uppercase tracking-widest text-slate-200">{date}</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/5 w-fit">
                 <Zap size={24} className="text-amber-400" />
                 <span className="text-2xl font-bold uppercase tracking-widest text-slate-300">{durationStr} Match</span>
              </div>
           </div>
           
           <div className="flex flex-col items-end">
              <h1 className="text-3xl font-black uppercase tracking-[0.3em] text-white/40">Match Result</h1>
              <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-rose-500 mt-2"></div>
           </div>
        </div>

        {/* SCOREBOARD CENTER */}
        <div className="flex flex-col items-center gap-10 my-auto">
            
            {/* Main Score Row */}
            <div className="flex items-center justify-between w-full gap-8">
                {/* Team A */}
                <div className={`flex-1 flex flex-col items-center text-center gap-4 ${isWinnerA ? 'scale-110' : 'opacity-80'}`}>
                    {isWinnerA && <Crown size={64} className="text-indigo-400 drop-shadow-[0_0_20px_rgba(129,140,248,0.6)] mb-2" fill="currentColor" />}
                    <h2 className={`text-6xl font-black uppercase leading-tight tracking-tight ${isWinnerA ? 'text-indigo-400 drop-shadow-[0_0_30px_rgba(129,140,248,0.4)]' : 'text-slate-300'}`}>
                        {teamAName}
                    </h2>
                    <div className="h-2 w-32 rounded-full bg-indigo-500/50"></div>
                </div>

                {/* VS / Score */}
                <div className="flex items-center gap-8 bg-black/30 backdrop-blur-2xl px-12 py-6 rounded-[3rem] border border-white/10 shadow-2xl">
                     <span className={`text-[12rem] font-black leading-none tabular-nums tracking-tighter ${winner === 'A' ? 'text-indigo-500 drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]' : 'text-slate-500'}`}>
                        {setsA}
                     </span>
                     <div className="h-32 w-[2px] bg-white/10"></div>
                     <span className={`text-[12rem] font-black leading-none tabular-nums tracking-tighter ${winner === 'B' ? 'text-rose-500 drop-shadow-[0_0_30px_rgba(244,63,94,0.5)]' : 'text-slate-500'}`}>
                        {setsB}
                     </span>
                </div>

                {/* Team B */}
                <div className={`flex-1 flex flex-col items-center text-center gap-4 ${!isWinnerA ? 'scale-110' : 'opacity-80'}`}>
                    {!isWinnerA && <Crown size={64} className="text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)] mb-2" fill="currentColor" />}
                    <h2 className={`text-6xl font-black uppercase leading-tight tracking-tight ${!isWinnerA ? 'text-rose-400 drop-shadow-[0_0_30px_rgba(244,63,94,0.4)]' : 'text-slate-300'}`}>
                        {teamBName}
                    </h2>
                    <div className="h-2 w-32 rounded-full bg-rose-500/50"></div>
                </div>
            </div>

            {/* Set History Strip */}
            <div className="flex gap-4 mt-8">
                {setsHistory.map((set, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <span className="text-xl font-bold text-slate-500 uppercase">Set {set.setNumber}</span>
                        <div className={`
                            px-6 py-3 rounded-2xl text-3xl font-bold border-2
                            ${set.winner === 'A' 
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}
                        `}>
                            {set.scoreA}-{set.scoreB}
                        </div>
                    </div>
                ))}
            </div>

            {/* MVP Card (Conditional) */}
            {mvp && (
                <div className="mt-8 relative group">
                    <div className="absolute inset-0 bg-amber-500/40 blur-2xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-amber-500/20 to-black/60 backdrop-blur-xl border border-amber-500/50 rounded-3xl p-6 flex items-center gap-6 pr-10 shadow-2xl">
                        <div className="bg-amber-500 text-amber-950 p-4 rounded-2xl shadow-lg shadow-amber-500/20">
                            <Trophy size={48} strokeWidth={1.5} />
                        </div>
                        <div>
                            <span className="block text-xl font-bold text-amber-500 uppercase tracking-widest mb-1">Match MVP</span>
                            <span className="block text-4xl font-black text-amber-100 uppercase tracking-tight">{mvp.name}</span>
                            <div className="flex items-center gap-2 mt-2 text-amber-400/80 font-bold uppercase text-lg">
                                <Activity size={20} />
                                <span>{mvp.totalPoints} Total Points</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-end border-t border-white/10 pt-8">
            <div className="flex flex-col">
                 <span className="text-2xl font-bold text-slate-400 uppercase tracking-wider">Generated by</span>
                 <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400 uppercase tracking-tighter">
                    VolleyScore Pro
                 </span>
            </div>
            
            <div className="flex items-center gap-2 opacity-50">
                 <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-indigo-500"></div>
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
});