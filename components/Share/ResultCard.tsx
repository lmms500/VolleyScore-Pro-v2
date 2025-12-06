
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
    <div className="flex items-center justify-center gap-4 mt-12 flex-wrap px-8">
        {sets.map((set, i) => {
            const winnerColor = set.winner === 'A' ? hexA : hexB;
            return (
                <div 
                    key={i} 
                    className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 shadow-xl backdrop-blur-md bg-white/10"
                    style={{ borderColor: `${winnerColor}80` }}
                >
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Set {set.setNumber}</span>
                    <div className="text-2xl font-black">
                        <span style={{ color: set.winner === 'A' ? hexA : '#9ca3af' }}>{set.scoreA}</span>
                        <span className="mx-1 text-white/20">-</span>
                        <span style={{ color: set.winner === 'B' ? hexB : '#9ca3af' }}>{set.scoreB}</span>
                    </div>
                </div>
            );
        })}
    </div>
);

export const ResultCard: React.FC<ResultCardProps> = memo(({
  teamAName, teamBName, setsA, setsB, winner, setsHistory, mvp, durationSeconds, date,
  colorA, colorB
}) => {
  
  const h = Math.floor(durationSeconds / 3600);
  const m = Math.floor((durationSeconds % 3600) / 60);
  const durationStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

  const isWinnerA = winner === 'A';
  const hexA = getHexFromColor(colorA || 'indigo');
  const hexB = getHexFromColor(colorB || 'rose');

  // Logic: Abbreviate if too long to maintain layout integrity
  const formatName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length > 8) {
      return trimmed.substring(0, 3).toUpperCase();
    }
    return trimmed.toUpperCase();
  };

  const displayNameA = formatName(teamAName);
  const displayNameB = formatName(teamBName);

  // Dynamic sizing based on length of displayed name
  const getNameSize = (name: string) => {
      if (name.length <= 3) return 'text-9xl'; // Huge for 3 letters
      if (name.length <= 5) return 'text-8xl';
      return 'text-6xl';
  };

  const sizeA = getNameSize(displayNameA);
  const sizeB = getNameSize(displayNameB);

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
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        <div 
            className="absolute -top-[20%] -left-[20%] w-[1000px] h-[1000px] rounded-full blur-[180px] opacity-40 mix-blend-screen transition-colors duration-500" 
            style={{ backgroundColor: isWinnerA ? hexA : hexB }}
        />
        <div 
            className="absolute -bottom-[20%] -right-[20%] w-[1000px] h-[1000px] rounded-full blur-[180px] opacity-30 mix-blend-screen transition-colors duration-500" 
            style={{ backgroundColor: !isWinnerA ? hexA : hexB }}
        />
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 flex flex-col h-full py-16 px-12 justify-between">
        
        {/* HEADER */}
        <header className="flex justify-between items-center w-full px-4">
           <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center border border-white/10 shadow-xl backdrop-blur-md">
                 <BarChart2 size={40} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 uppercase tracking-tighter drop-shadow-sm">
                    VolleyScore
                </span>
                <span className="text-xl font-bold text-white/40 uppercase tracking-widest">Match Result</span>
              </div>
           </div>
           
           <div className="flex flex-col items-end gap-1">
             <div className="flex items-center gap-3 px-6 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                <Calendar size={20} className="text-slate-400" />
                <span className="text-xl font-bold text-slate-200">{date}</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-1">
                <Zap size={16} className="text-amber-400" />
                <span className="text-lg font-bold text-slate-400">{durationStr}</span>
             </div>
           </div>
        </header>

        {/* MAIN SCORE SECTION */}
        <main className="flex-1 flex flex-col justify-center items-center w-full">
            
            {/* Grid Layout: Team A - Score - Team B */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-12 w-full">
                
                {/* Team A */}
                <div className={`flex flex-col items-end text-right gap-6 ${isWinnerA ? 'opacity-100 scale-105' : 'opacity-60 grayscale-[0.3] scale-95'}`}>
                    <h2 
                        className={`${sizeA} font-black uppercase leading-none tracking-tighter break-words max-w-[450px] drop-shadow-xl`}
                        style={{ color: isWinnerA ? '#fff' : '#cbd5e1' }}
                    >
                        {displayNameA}
                    </h2>
                    {isWinnerA && (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-400/20 rounded-full border border-amber-400/30 text-amber-300 font-bold uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                            <Crown size={14} fill="currentColor" /> Winner
                        </div>
                    )}
                </div>
                
                {/* Center Score */}
                <div className="flex items-center justify-center gap-2 bg-white/5 p-8 rounded-[3rem] border border-white/5 backdrop-blur-sm shadow-2xl">
                    <span 
                        className="text-[14rem] font-black leading-none tabular-nums tracking-tighter" 
                        style={{ color: hexA, textShadow: `0 0 80px ${hexA}50` }}
                    >
                        {setsA}
                    </span>
                    
                    <div className="flex flex-col gap-3 opacity-30 mx-2">
                        <div className="w-4 h-4 rounded-full bg-white"></div>
                        <div className="w-4 h-4 rounded-full bg-white"></div>
                    </div>
                    
                    <span 
                        className="text-[14rem] font-black leading-none tabular-nums tracking-tighter" 
                        style={{ color: hexB, textShadow: `0 0 80px ${hexB}50` }}
                    >
                        {setsB}
                    </span>
                </div>

                {/* Team B */}
                <div className={`flex flex-col items-start text-left gap-6 ${!isWinnerA ? 'opacity-100 scale-105' : 'opacity-60 grayscale-[0.3] scale-95'}`}>
                    <h2 
                        className={`${sizeB} font-black uppercase leading-none tracking-tighter break-words max-w-[450px] drop-shadow-xl`}
                        style={{ color: !isWinnerA ? '#fff' : '#cbd5e1' }}
                    >
                        {displayNameB}
                    </h2>
                    {!isWinnerA && (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-400/20 rounded-full border border-amber-400/30 text-amber-300 font-bold uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                            <Crown size={14} fill="currentColor" /> Winner
                        </div>
                    )}
                </div>
            </div>
            
            {/* Sets Summary Strip */}
            <SetsSummaryStrip sets={setsHistory} hexA={hexA} hexB={hexB} />

        </main>
        
        {/* MVP Card */}
        {mvp ? (
            <footer className="w-full flex justify-center mt-12">
                <div 
                    className="relative w-full max-w-4xl bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 pr-10 flex items-center gap-8 shadow-2xl"
                >
                    <div className="bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 p-6 rounded-[2rem] shadow-lg shadow-amber-500/20">
                        <Trophy size={48} strokeWidth={2} />
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-bold text-amber-400 uppercase tracking-[0.2em]">Match MVP</span>
                            <div className="h-px flex-1 bg-white/10"></div>
                        </div>
                        <span className="block text-5xl font-black text-white uppercase tracking-tight truncate">{mvp.name}</span>
                    </div>

                    <div className="flex flex-col items-end pl-8 border-l border-white/10">
                        <span className="text-7xl font-black tabular-nums leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                            {mvp.totalPoints}
                        </span>
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Points Scored</span>
                    </div>
                </div>
            </footer>
        ) : (
             <div className="h-32" />
        )}
      </div>
    </div>
  );
});
