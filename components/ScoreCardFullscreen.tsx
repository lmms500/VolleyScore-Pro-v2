import React, { forwardRef, RefObject } from 'react';
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
  nameRef: RefObject<HTMLHeadingElement>;
}

export const ScoreCardFullscreen = forwardRef<HTMLDivElement, ScoreCardFullscreenProps>(({
  teamId, team, score, isServing, onAdd, onSubtract, onToggleServe, timeouts, onTimeout, 
  isMatchPoint, isSetPoint, isDeuce, inSuddenDeath, colorTheme, 
  isLocked = false, onInteractionStart, onInteractionEnd, reverseLayout, nameRef
}, ref) => {
  
  const gestureHandlers = useScoreGestures({
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
        style={{ touchAction: 'none' }}
        {...gestureHandlers}
    >
      
      <div 
        className={`
            absolute inset-0 transition-opacity duration-1000 ease-in-out 
            ${theme.glowRadial} 
            pointer-events-none mix-blend-screen
            ${isServing ? 'opacity-100' : 'opacity-0'}
        `} 
      />

      <div className="flex flex-col h-full w-full relative z-10 p-2 md:p-8 landscape:px-20 pb-4 justify-center">
        
        <div className="flex flex-col items-center justify-center w-full flex-none">
            <div className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-lg transition-all duration-300 mb-2 scale-110
                ${isServing ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
            `}>
                <Volleyball size={16} className={`${theme.text} animate-bounce`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text}`}>Serving</span>
            </div>

            <h2 
                ref={nameRef}
                className="font-black uppercase tracking-tighter text-center cursor-pointer hover:text-white transition-all z-10 leading-none text-3xl md:text-5xl landscape:text-4xl text-white drop-shadow-[0_5px_5px_rgba(0,0,0,1)] px-2 w-full truncate"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onToggleServe(); }}
            >
                {team?.name || ''}
            </h2>
        </div>

        {(isMatchPoint || isSetPoint || isDeuce || inSuddenDeath) ? (
            <div className="flex items-center justify-center transition-all duration-300 flex-none min-h-[6rem] sm:min-h-[8rem] py-4">
                <div 
                    className={`
                        px-8 py-3 sm:px-12 sm:py-4 rounded-full backdrop-blur-xl border border-white/20 shadow-2xl
                        animate-pulse font-black uppercase tracking-[0.2em] text-center whitespace-nowrap
                        text-2xl sm:text-4xl md:text-6xl shadow-[0_0_80px_rgba(0,0,0,0.9)] transform flex items-center gap-3 sm:gap-6
                        ${inSuddenDeath
                            ? 'bg-red-600 text-white shadow-red-500/60 ring-8 ring-red-500/20'
                            : isMatchPoint 
                                ? 'bg-amber-500 text-black shadow-amber-500/60 ring-8 ring-amber-500/20' 
                                : isSetPoint 
                                    ? `${theme.bg} text-white ring-8 ring-white/10`
                                    : 'bg-slate-200 text-slate-900'} 
                    `}
                    style={{ transform: 'scale(var(--badge-scale, 1))' }}
                >
                    {inSuddenDeath && <Zap className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16" fill="currentColor" />}
                    {inSuddenDeath ? 'Sudden Death' : isMatchPoint ? 'Match Point' : isSetPoint ? 'Set Point' : 'Deuce'}
                </div>
            </div>
        ) : (
            <div className="min-h-[6rem] sm:min-h-[8rem]"></div>
        )}

        <div 
            ref={ref}
            className={`
                flex items-center justify-center w-full flex-1 min-h-0
                font-black leading-none tracking-[-0.08em] text-white
                drop-shadow-2xl transition-transform duration-100 active:scale-95
                outline-none select-none
                ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{ fontSize: 'var(--score-font, 35dvh)' }}
        >
            {score}
        </div>
      </div>
    </div>
  );
});