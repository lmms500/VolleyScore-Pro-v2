import React from 'react';
import { Clock, Volleyball, Timer, Zap } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

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
  isServingLeft: boolean;
  isServingRight: boolean;
  timeoutsA: number;
  timeoutsB: number;
  onTimeoutA: () => void;
  onTimeoutB: () => void;
  // New Props for Status Integration
  isMatchPointA: boolean;
  isSetPointA: boolean;
  isMatchPointB: boolean;
  isSetPointB: boolean;
  isDeuce: boolean;
  inSuddenDeath: boolean;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const truncateName = (name: string) => {
  if (name.length > 10) return name.substring(0, 9) + '..';
  return name;
};

const TeamSection: React.FC<{ 
    name: string; 
    color: 'indigo' | 'rose'; 
    isServing: boolean; 
    align: 'left' | 'right';
    timeouts: number;
    onTimeout: () => void;
    isMatchPoint: boolean;
    isSetPoint: boolean;
}> = ({ name, color, isServing, align, timeouts, onTimeout, isMatchPoint, isSetPoint }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { t } = useTranslation();
    const colorClass = color === 'indigo' ? 'text-indigo-400' : 'text-rose-400';
    const dotColorClass = color === 'indigo' ? 'bg-indigo-500' : 'bg-rose-500';
    const dotShadowClass = color === 'indigo' ? 'shadow-indigo-500/50' : 'shadow-rose-500/50';
    const bgBadge = color === 'indigo' ? 'bg-indigo-500' : 'bg-rose-500';
    
    // Timeouts >= 2 means both used (assuming max 2 per set)
    const isExhausted = timeouts >= 2;

    return (
        <div className={`flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
            
            {/* Timeout Group */}
            <div className={`flex items-center gap-1.5 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
                <button 
                    onClick={(e) => { e.stopPropagation(); if(!isExhausted) onTimeout(); }}
                    disabled={isExhausted}
                    className={`
                        flex items-center justify-center w-8 h-8 rounded-full border 
                        transition-all active:scale-90 duration-200
                        ${isExhausted 
                            ? 'bg-white/5 border-white/5 opacity-30 cursor-not-allowed text-slate-500' 
                            : 'bg-white/10 hover:bg-white/20 border-white/10 hover:border-white/30 text-white shadow-lg backdrop-blur-md'}
                    `}
                    aria-label="Timeout"
                >
                    <Timer size={14} />
                </button>

                <div className="flex flex-col gap-1 py-1">
                     {[1, 2].map(i => {
                         const isAvailable = i > timeouts;
                         return (
                             <div 
                                key={i} 
                                className={`
                                    w-1.5 h-1.5 rounded-full transition-all duration-300 border border-black/20
                                    ${isAvailable 
                                        ? `${dotColorClass} ${dotShadowClass} shadow-[0_0_8px_currentColor] opacity-100 scale-100` 
                                        : 'bg-slate-700 opacity-30 scale-75 shadow-none'}
                                `} 
                             />
                         );
                     })}
                </div>
            </div>

            {/* Name, Badge & Serve */}
            <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'} justify-center h-full`}>
                <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className={`text-sm md:text-base font-bold uppercase tracking-widest whitespace-nowrap leading-none ${colorClass}`}>
                        {truncateName(name)}
                    </span>
                    <Volleyball 
                        size={12} 
                        className={`
                            text-white transition-all duration-300
                            ${isServing ? 'opacity-100 scale-100 animate-pulse' : 'opacity-0 scale-0 w-0'}
                        `} 
                    />
                </div>
                
                {/* Status Badges - Compact */}
                <div className={`h-4 flex items-center mt-0.5 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
                    {isMatchPoint ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider leading-none shadow-lg shadow-amber-500/20 animate-pulse">
                            MATCH POINT
                        </span>
                    ) : isSetPoint ? (
                        <span className={`px-1.5 py-0.5 rounded ${bgBadge} text-white text-[9px] font-black uppercase tracking-wider leading-none shadow-lg opacity-90`}>
                            SET POINT
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export const FloatingTopBar: React.FC<FloatingTopBarProps> = ({
  time, currentSet, isTieBreak, onToggleTimer, isTimerRunning,
  teamNameA, teamNameB, colorA, colorB, 
  isServingLeft, isServingRight,
  timeoutsA, timeoutsB, onTimeoutA, onTimeoutB,
  isMatchPointA, isSetPointA, isMatchPointB, isSetPointB, isDeuce, inSuddenDeath
}) => {
  return (
    <div 
      className={`
        fixed top-2 left-1/2 -translate-x-1/2 z-[55] 
        transition-all duration-500 ease-out origin-top
        pt-[env(safe-area-inset-top)] w-auto max-w-[95vw]
      `}
    >
      <div className="flex items-center gap-2 md:gap-6 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
        
        <TeamSection 
            name={teamNameA} color={colorA} isServing={isServingLeft} align="left"
            timeouts={timeoutsA} onTimeout={onTimeoutA}
            isMatchPoint={isMatchPointA} isSetPoint={isSetPointA}
        />

        {/* Divider */}
        <div className="w-px h-6 bg-white/10"></div>

        {/* Center Info - Dynamic Status */}
        <div className="flex flex-col items-center min-w-[70px]">
             
            {inSuddenDeath ? (
                 <div className="flex flex-col items-center animate-pulse">
                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest leading-none mb-0.5 flex items-center gap-1">
                         <Zap size={8} fill="currentColor" /> DEATH
                    </span>
                    <span className="text-xs font-bold text-white tabular-nums leading-none">SUDDEN</span>
                 </div>
            ) : isDeuce ? (
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                        ADVANTAGE
                    </span>
                    <span className="text-xs font-bold text-white tabular-nums leading-none">DEUCE</span>
                 </div>
            ) : (
                <>
                    <button 
                        onClick={onToggleTimer}
                        className={`flex items-center gap-1.5 active:scale-95 transition-transform ${isTimerRunning ? 'text-white' : 'text-slate-500'}`}
                    >
                        <Clock size={10} />
                        <span className="font-mono text-xs font-bold tabular-nums leading-none">{formatTime(time)}</span>
                    </button>
                    <div className="mt-0.5">
                        <span className={`text-[9px] font-bold uppercase tracking-widest leading-none ${isTieBreak ? 'text-amber-400' : 'text-slate-400'}`}>
                            {isTieBreak ? 'TIE BREAK' : `SET ${currentSet}`}
                        </span>
                    </div>
                </>
            )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10"></div>

        <TeamSection 
            name={teamNameB} color={colorB} isServing={isServingRight} align="right"
            timeouts={timeoutsB} onTimeout={onTimeoutB}
            isMatchPoint={isMatchPointB} isSetPoint={isSetPointB}
        />

      </div>
    </div>
  );
};