import React from 'react';
import { Team, TeamId } from '../types';
import { Volleyball, Zap } from 'lucide-react';
import { useScoreGestures } from '../hooks/useScoreGestures';

interface ScoreCardFullscreenProps {
  teamId: TeamId;
  team: Team;
  score: number;
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
  colorTheme: 'indigo' | 'rose';
  isLocked?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  reverseLayout?: boolean;
}

export const ScoreCardFullscreen: React.FC<ScoreCardFullscreenProps> = ({
  teamId, team, score, isServing, onAdd, onSubtract, onToggleServe, timeouts, onTimeout, 
  isMatchPoint, isSetPoint, isDeuce, inSuddenDeath, colorTheme, 
  isLocked = false, onInteractionStart, onInteractionEnd, reverseLayout
}) => {
  
  const { handlePointerDown, handlePointerUp, handlePointerCancel } = useScoreGestures({
    onAdd, onSubtract, isLocked, onInteractionStart, onInteractionEnd
  });

  const theme = {
    indigo: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500',
      glowRadial: 'bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.35)_0%,rgba(99,102,241,0)_70%)]'
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500',
      glowRadial: 'bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.35)_0%,rgba(244,63,94,0)_70%)]'
    }
  }[colorTheme];

  const orderClass = reverseLayout 
    ? (teamId === 'A' ? 'order-last' : 'order-first') 
    : (teamId === 'A' ? 'order-first' : 'order-last');

  return (
    <div 
        className={`
            flex flex-col flex-1 relative h-full transition-all duration-500 select-none overflow-hidden 
            ${orderClass}
            ${isLocked ? 'opacity-90 grayscale-[0.2]' : ''}
        `}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
    >
      
      {/* Intense Glow for Fullscreen */}
      <div 
        className={`
            absolute inset-0 transition-opacity duration-1000 ease-in-out 
            ${theme.glowRadial} 
            pointer-events-none mix-blend-screen
            ${isServing ? 'opacity-100' : 'opacity-0'}
        `} 
      />

      <div className="flex flex-col h-full w-full relative z-10 p-2 md:p-8 landscape:px-20 pb-4 justify-center">
        
        {/* 1. HEADER */}
        <div className="flex flex-col items-center justify-center w-full flex-none">
            {/* Serving Indicator */}
            <div className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-lg transition-all duration-300 mb-2 scale-110
                ${isServing ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
            `}>
                <Volleyball size={16} className={`${theme.text} animate-bounce`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text}`}>Serving</span>
            </div>

            {/* Team Name - Huge & Shadowed */}
            <h2 
                className="font-black uppercase tracking-tighter text-center cursor-pointer hover:text-white transition-all z-10 leading-none text-3xl md:text-5xl landscape:text-4xl text-white drop-shadow-[0_5px_5px_rgba(0,0,0,1)] px-2 w-full truncate"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onToggleServe(); }}
            >
                {team.name}
            </h2>
        </div>

        {/* 2. BADGES SPACER & DISPLAY */}
        {(isMatchPoint || isSetPoint || isDeuce || inSuddenDeath) ? (
            <div className="flex items-center justify-center transition-all duration-300 flex-none min-h-[5rem] py-2">
                <div className={`
                    px-8 py-2 rounded-full backdrop-blur-xl border border-white/20 shadow-2xl
                    animate-pulse font-black uppercase tracking-[0.2em] text-center whitespace-nowrap
                    text-xl md:text-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] transform flex items-center gap-3
                    ${inSuddenDeath
                        ? 'bg-red-500 text-white shadow-red-500/50 scale-125 ring-4 ring-red-500/20'
                        : isMatchPoint 
                            ? 'bg-amber-500 text-black shadow-amber-500/50 scale-125 ring-4 ring-amber-500/20' 
                            : isSetPoint 
                                ? `${theme.bg} text-white scale-125`
                                : 'bg-slate-200 text-slate-900 scale-110'} 
                `}>
                    {inSuddenDeath && <Zap size={28} fill="currentColor" />}
                    {inSuddenDeath ? 'Sudden Death' : isMatchPoint ? 'Match Point' : isSetPoint ? 'Set Point' : 'Deuce'}
                </div>
            </div>
        ) : (
            <div className="min-h-[5rem]"></div>
        )}

        {/* 3. HERO SCORE */}
        <div className={`
            flex items-center justify-center w-full flex-1 min-h-0
            font-black leading-none tracking-[-0.08em] text-white
            drop-shadow-2xl transition-transform duration-100 active:scale-95
            outline-none select-none
            text-[35dvh] landscape:text-[55dvh] md:text-[45dvh]
            ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}>
            {score}
        </div>
        
        {/* Timeouts Removed - Handled by HUD */}

      </div>
    </div>
  );
};