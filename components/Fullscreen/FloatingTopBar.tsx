import React from 'react';
import { Clock, Volleyball, Timer } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { TeamId } from '../../types';

interface FloatingTopBarProps {
  time: number;
  currentSet: number;
  isTieBreak: boolean;
  onToggleTimer: () => void;
  isTimerRunning: boolean;
  teamNameA: string;
  teamNameB: string;
  colorA: 'indigo' | 'rose';
  colorB: 'indigo' | 'rose';
  server: TeamId | null;
  timeoutsA: number;
  timeoutsB: number;
  onTimeoutA: () => void;
  onTimeoutB: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const truncateName = (name: string) => {
  if (name.length > 8) return name.substring(0, 7) + '..';
  return name;
};

const TeamSection: React.FC<{ 
    name: string; 
    color: 'indigo' | 'rose'; 
    isServing: boolean; 
    align: 'left' | 'right';
    timeouts: number;
    onTimeout: () => void;
}> = ({ name, color, isServing, align, timeouts, onTimeout }) => {
    const colorClass = color === 'indigo' ? 'text-indigo-400' : 'text-rose-400';
    const dotColorClass = color === 'indigo' ? 'bg-indigo-500' : 'bg-rose-500';
    const dotShadowClass = color === 'indigo' ? 'shadow-indigo-500/50' : 'shadow-rose-500/50';
    
    // Timeouts >= 2 means both used (assuming max 2 per set)
    const isExhausted = timeouts >= 2;

    return (
        <div className={`flex items-center gap-4 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
            
            {/* Timeout Group: Button + Indicators */}
            <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Timeout Button (Larger Icon & Touch Target) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); if(!isExhausted) onTimeout(); }}
                    disabled={isExhausted}
                    className={`
                        flex items-center justify-center w-12 h-12 rounded-full border 
                        transition-all active:scale-90 duration-200
                        ${isExhausted 
                            ? 'bg-white/5 border-white/5 opacity-30 cursor-not-allowed text-slate-500' 
                            : 'bg-white/10 hover:bg-white/20 border-white/10 hover:border-white/30 text-white shadow-lg backdrop-blur-md'}
                    `}
                    aria-label="Timeout"
                >
                    <Timer size={22} />
                </button>

                {/* Vertical Dots Indicator (Outside button, colored by team) */}
                <div className="flex flex-col gap-1.5 py-1">
                     {[1, 2].map(i => {
                         // Logic: If i is greater than timeouts used, it is available.
                         const isAvailable = i > timeouts;
                         return (
                             <div 
                                key={i} 
                                className={`
                                    w-2 h-2 rounded-full transition-all duration-300 border border-black/20
                                    ${isAvailable 
                                        ? `${dotColorClass} ${dotShadowClass} shadow-[0_0_8px_currentColor] opacity-100 scale-100` 
                                        : 'bg-slate-700 opacity-30 scale-75 shadow-none'}
                                `} 
                             />
                         );
                     })}
                </div>
            </div>

            {/* Name & Serve */}
            <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className={`text-base md:text-xl font-bold uppercase tracking-widest whitespace-nowrap ${colorClass}`}>
                    {truncateName(name)}
                </span>
                <Volleyball 
                    size={16} 
                    className={`
                        text-white transition-all duration-300
                        ${isServing ? 'opacity-100 scale-100 animate-pulse' : 'opacity-0 scale-0 w-0'}
                    `} 
                />
            </div>
        </div>
    );
};

export const FloatingTopBar: React.FC<FloatingTopBarProps> = ({
  time, currentSet, isTieBreak, onToggleTimer, isTimerRunning,
  teamNameA, teamNameB, colorA, colorB, server, timeoutsA, timeoutsB, onTimeoutA, onTimeoutB
}) => {
  return (
    <div 
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-[55] 
        transition-all duration-500 ease-out origin-top
        pt-[env(safe-area-inset-top)]
      `}
    >
      <div className="flex items-center gap-3 md:gap-8 px-4 md:px-6 py-2 rounded-full bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
        
        <TeamSection 
            name={teamNameA} color={colorA} isServing={server === 'A'} align="left"
            timeouts={timeoutsA} onTimeout={onTimeoutA}
        />

        {/* Divider */}
        <div className="w-px h-8 bg-white/10"></div>

        {/* Center Info */}
        <div className="flex flex-col items-center min-w-[60px]">
             <button 
                onClick={onToggleTimer}
                className={`flex items-center gap-1.5 active:scale-95 transition-transform ${isTimerRunning ? 'text-white' : 'text-slate-500'}`}
            >
                <Clock size={14} />
                <span className="font-mono text-base font-bold tabular-nums leading-none">{formatTime(time)}</span>
            </button>
            <div className="mt-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest leading-none ${isTieBreak ? 'text-amber-400' : 'text-slate-400'}`}>
                    {isTieBreak ? 'TIE BREAK' : `SET ${currentSet}`}
                </span>
            </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/10"></div>

        <TeamSection 
            name={teamNameB} color={colorB} isServing={server === 'B'} align="right"
            timeouts={timeoutsB} onTimeout={onTimeoutB}
        />

      </div>
    </div>
  );
};