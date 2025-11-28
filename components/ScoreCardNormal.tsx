import React from 'react';
import { Team, TeamId } from '../types';
import { Volleyball, Zap } from 'lucide-react';
import { useScoreGestures } from '../hooks/useScoreGestures';

interface ScoreCardNormalProps {
  teamId: TeamId;
  team: Team;
  score: number;
  setsWon: number;
  isServing: boolean;
  onAdd: () => void;
  onSubtract: () => void;
  onToggleServe: () => void;
  timeouts: number;
  onTimeout: () => void;
  isMatchPoint: boolean;
  isSetPoint: boolean;
  isDeuce?: boolean;
  inSuddenDeath?: boolean;
  reverseLayout?: boolean; 
  setsNeededToWin: number;
  colorTheme: 'indigo' | 'rose';
  isLocked?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

export const ScoreCardNormal: React.FC<ScoreCardNormalProps> = ({
  teamId, team, score, setsWon, isServing, onAdd, onSubtract, onToggleServe, timeouts, onTimeout, 
  isMatchPoint, isSetPoint, isDeuce, inSuddenDeath, reverseLayout, setsNeededToWin, colorTheme, 
  isLocked = false, onInteractionStart, onInteractionEnd
}) => {
  
  const gestureHandlers = useScoreGestures({
    onAdd, onSubtract, isLocked, onInteractionStart, onInteractionEnd
  });

  const theme = {
    indigo: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500',
      shadow: 'shadow-indigo-500/50',
      glowRadial: 'bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.25)_0%,rgba(99,102,241,0)_60%)]'
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500',
      shadow: 'shadow-rose-500/50',
      glowRadial: 'bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.25)_0%,rgba(244,63,94,0)_60%)]'
    }
  }[colorTheme];

  const orderClass = reverseLayout ? (teamId === 'A' ? 'order-last' : 'order-first') : (teamId === 'A' ? 'order-first' : 'order-last');
  const timeoutsExhausted = timeouts >= 2;

  return (
    <div 
        className={`
            flex flex-col flex-1 relative h-full transition-all duration-500 select-none overflow-visible
            ${orderClass} 
            ${isLocked ? 'opacity-90 grayscale-[0.2]' : ''}
            ${isServing ? 'z-20' : 'z-0'} 
        `}
    >
      
      {/* Glow Background */}
      <div 
        className={`
            absolute -inset-5 transition-opacity duration-1000 ease-in-out 
            ${theme.glowRadial} 
            pointer-events-none mix-blend-screen z-0
            ${isServing ? 'opacity-100' : 'opacity-0'}
        `} 
      />

      {/* Normal Mode Layout: Flex column with justify-between to prevent overlap */}
      <div className="flex flex-col h-full w-full relative z-10 py-2 md:py-4 px-2 justify-between items-center">
        
        {/* 1. HEADER (Order 1) */}
        <div className="flex flex-col items-center justify-center w-full flex-none order-1">
            {/* Serving Indicator */}
            <div className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-lg transition-all duration-300 mb-0.5 scale-90
                ${isServing ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
            `}>
                <Volleyball size={14} className={`${theme.text} animate-bounce`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text}`}>Serving</span>
            </div>

            {/* Team Name */}
            <h2 
                className="font-black uppercase tracking-tighter text-center cursor-pointer hover:text-white transition-all z-10 leading-none text-lg md:text-2xl text-slate-200 tracking-widest px-2 truncate w-full max-w-[90%]"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onToggleServe(); }}
            >
                {team?.name || ''}
            </h2>

            {/* Set Dots */}
            <div className="flex gap-1.5 mt-1.5">
                {[...Array(setsNeededToWin)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i < setsWon ? theme.bg : 'bg-white/10'}`} />
                ))}
            </div>
        </div>


        {/* 2. BADGES (Order 2) - Rendered inline to push content */}
        {(isMatchPoint || isSetPoint || isDeuce || inSuddenDeath) ? (
            <div className="flex-none py-2 order-2 w-full flex justify-center z-10 min-h-[2rem]">
                 <div className={`
                    px-3 py-1 rounded-full backdrop-blur-xl border border-white/20 shadow-2xl
                    animate-pulse font-black uppercase tracking-[0.1em] text-center whitespace-nowrap
                    text-[9px] shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-1 transform transition-all
                    ${inSuddenDeath
                        ? 'bg-red-600 text-white shadow-red-500/50 scale-105 border-red-400'
                        : isMatchPoint 
                            ? 'bg-amber-500 text-black shadow-amber-500/50 scale-105' 
                            : isSetPoint 
                                ? `${theme.bg} text-white ${theme.shadow} scale-105`
                                : 'bg-slate-200 text-slate-900'} 
                `}>
                    {inSuddenDeath && <Zap className="w-2.5 h-2.5" fill="currentColor" />}
                    {inSuddenDeath ? 'Sudden Death' : isMatchPoint ? 'Match Point' : isSetPoint ? 'Set Point' : 'Deuce'}
                </div>
            </div>
        ) : <div className="order-2 min-h-[1.5rem] flex-none"></div>}

        {/* 3. SCORE NUMBER (Order 3) */}
        <div 
            className={`
                order-3 flex items-center justify-center w-full flex-1 min-h-0
                font-black leading-none tracking-[-0.08em] text-white
                drop-shadow-2xl transition-transform duration-100 active:scale-95
                outline-none select-none
                text-[13vh] sm:text-[15vh] landscape:text-[22vh]
                ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{ touchAction: 'none' }}
            {...gestureHandlers}
        >
            {score}
        </div>


        {/* 4. TIMEOUTS (Order 4) - Significantly smaller */}
        <div className="order-4 w-full flex items-center justify-center flex-none transition-all z-20 mt-1 mb-1">
           <button 
             onPointerDown={(e) => e.stopPropagation()}
             onClick={(e) => { 
                e.stopPropagation(); 
                if(!timeoutsExhausted) onTimeout(); 
             }}
             disabled={timeoutsExhausted}
             className={`
                flex items-center justify-center gap-3 transition-all rounded-full border border-white/5 py-2 px-4 bg-black/20 opacity-90 w-auto
                ${timeoutsExhausted ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer hover:bg-black/50 active:scale-95 hover:border-white/20 shadow-lg'}
             `}
             title="Use Timeout"
           >
              <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">TIMEOUT</span>
              <div className="flex gap-1.5">
                {[1, 2].map(t => (
                    <div 
                    key={t}
                    className={`
                        transition-all duration-300 rounded-full w-2.5 h-2.5
                        ${t <= timeouts 
                        ? 'bg-slate-800 border border-slate-700' 
                        : `${theme.bg} shadow-[0_0_8px_currentColor] border border-white/10`}
                    `}
                    />
                ))}
              </div>
           </button>
        </div>

      </div>
    </div>
  );
};