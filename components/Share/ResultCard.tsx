import React, { memo } from 'react';
import { TeamId, TeamColor } from '../../types';
import { Trophy, Calendar, Zap, Crown, BarChart2 } from 'lucide-react';
import { resolveTheme, getHexFromColor } from '../../utils/colors';

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
  colorA: TeamColor;
  colorB: TeamColor;
}

const SetsSummaryStrip: React.FC<{ sets: ResultCardProps['setsHistory'], hexA: string, hexB: string }> = ({ sets, hexA, hexB }) => (
    <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
        {sets.map((set, i) => {
            const winnerColor = set.winner === 'A' ? hexA : hexB;
            return (
                <div 
                    key={i} 
                    className="px-4 py-2 text-center rounded-xl text-3xl font-bold border-2 shadow-lg backdrop-blur-sm bg-white/5"
                    style={{ borderColor: `${winnerColor}80` }}
                >
                    <span style={{ color: set.winner === 'A' ? hexA : '#9ca3af' }}>{set.scoreA}</span>
                    <span className="mx-2 text-slate-600">-</span>
                    <span style={{ color: set.winner === 'B' ? hexB : '#9ca3af' }}>{set.scoreB}</span>
                </div>
            );
        })}
    </div>
);


export const ResultCard: React.FC<ResultCardProps> = memo(({
  teamAName, teamBName, setsA, setsB, winner, setsHistory, mvp, durationSeconds, date,
  colorA, colorB
}) => {
  
  // Format duration
  const h = Math.floor(durationSeconds / 3600);
  const m = Math.floor((durationSeconds % 3600) / 60);
  const durationStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

  const isWinnerA = winner === 'A';
  const themeA = resolveTheme(colorA || 'indigo');
  const themeB = resolveTheme(colorB || 'rose');
  const hexA = getHexFromColor(colorA || 'indigo');
  const hexB = getHexFromColor(colorB || 'rose');

  const getTeamNameSize = (name: string): string => {
    if (name.length <= 5) return 'text-8xl';
    if (name.length <= 8) return 'text-6xl';
    return 'text-5xl';
  };

  const teamANameSize = getTeamNameSize(teamAName);
  const teamBNameSize = getTeamNameSize(teamBName);

  return (
    <div 
      id="social-share-card"
      className="relative w-[1080px] h-[1350px] bg-[#020617] text-white overflow-hidden font-inter flex flex-col"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        zIndex: -50,
        visibility: 'visible',
        pointerEvents: 'none'
      }}
    >
      {/* --- BACKGROUND FX --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        <div 
            className="absolute -top-[20%] -left-[30%] w-[1200px] h-[1200px] rounded-full blur-[200px] opacity-50 mix-blend-screen transition-colors duration-500" 
            style={{ backgroundColor: isWinnerA ? hexA : hexB }}
        />
        <div 
            className="absolute -bottom-[20%] -right-[30%] w-[1200px] h-[1200px] rounded-full blur-[200px] opacity-40 mix-blend-screen transition-colors duration-500" 
            style={{ backgroundColor: !isWinnerA ? hexA : hexB }}
        />
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 flex flex-col h-full p-20 justify-around">
        
        {/* HEADER */}
        <header className="flex justify-between items-center">
           <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-md">
                 <BarChart2 size={32} className="text-white" />
              </div>
              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 uppercase tracking-tighter drop-shadow-lg">
                VolleyScore Pro
              </span>
           </div>
           
           <div className="flex items-center gap-4 px-6 py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
             <div className="flex items-center gap-2">
                <Calendar size={24} className="text-slate-400" />
                <span className="text-2xl font-bold text-slate-300">{date}</span>
             </div>
             <div className="h-8 w-px bg-white/10"></div>
             <div className="flex items-center gap-2">
                <Zap size={24} className="text-amber-400" />
                <span className="text-2xl font-bold text-slate-300">{durationStr} Match</span>
             </div>
           </div>
        </header>

        {/* MAIN SCORE & SETS */}
        <main className="flex flex-col items-center justify-center gap-4 w-full">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-8 w-full">
                {/* Team A */}
                <div className={`justify-self-end flex flex-col items-end text-right justify-center gap-4 transition-all duration-500 ${isWinnerA ? 'opacity-100' : 'opacity-60 grayscale-[0.2]'}`}>
                    <h2 className={`${teamANameSize} font-black uppercase leading-none tracking-tighter truncate max-w-[400px]`}>
                        {teamAName}
                    </h2>
                </div>
                
                {/* Center Score */}
                <div className="flex items-center justify-center gap-4">
                    <span className="text-[18rem] font-black leading-none tabular-nums tracking-tighter" style={{ color: hexA, textShadow: isWinnerA ? `0 0 60px ${hexA}60` : 'none' }}>
                        {setsA}
                    </span>
                    
                    <div className="text-8xl font-thin text-slate-700">:</div>
                    
                    <span className="text-[18rem] font-black leading-none tabular-nums tracking-tighter" style={{ color: hexB, textShadow: !isWinnerA ? `0 0 60px ${hexB}60` : 'none' }}>
                        {setsB}
                    </span>
                </div>

                {/* Team B */}
                <div className={`justify-self-start flex flex-col items-start text-left justify-center gap-4 transition-all duration-500 ${!isWinnerA ? 'opacity-100' : 'opacity-60 grayscale-[0.2]'}`}>
                    <h2 className={`${teamBNameSize} font-black uppercase leading-none tracking-tighter truncate max-w-[400px]`}>
                        {teamBName}
                    </h2>
                </div>
            </div>
            
            <SetsSummaryStrip sets={setsHistory} hexA={hexA} hexB={hexB} />
        </main>
        
        {/* MVP Card (Conditional) */}
        {mvp ? (
            <footer className="w-full flex justify-center">
                <div 
                    className="relative group w-full max-w-3xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 flex items-center gap-8 shadow-2xl"
                    style={{
                        background: `radial-gradient(circle at ${mvp.team === 'A' ? '20%' : '80%'} 50%, ${mvp.team === 'A' ? hexA : hexB}15, transparent 70%)`,
                        borderColor: `${mvp.team === 'A' ? hexA : hexB}40`
                    }}
                >
                    <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 p-6 rounded-[1.5rem] shadow-lg shadow-amber-500/20">
                        <Trophy size={64} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                        <span className="block text-2xl font-bold text-amber-400 uppercase tracking-[0.2em] mb-1">Match MVP</span>
                        <span className="block text-6xl font-black text-white uppercase tracking-tight leading-none">{mvp.name}</span>
                    </div>
                    <div className="flex flex-col items-end border-l border-amber-500/20 pl-8">
                        <div className="text-amber-300 font-black text-8xl tabular-nums leading-none">{mvp.totalPoints}</div>
                        <span className="text-amber-500/60 font-bold uppercase tracking-wider text-sm mt-1">Total Points</span>
                    </div>
                </div>
            </footer>
        ) : (
             <div className="h-48" /> // Placeholder to balance layout when no MVP
        )}
      </div>
    </div>
  );
});