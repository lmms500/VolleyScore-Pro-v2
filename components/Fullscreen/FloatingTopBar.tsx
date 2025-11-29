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
  if (name.length > 12) return name.substring(0, 11) + '..';
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
    
    // Increased saturation for Rose (Team B)
    const colorClass = color === 'indigo' ? 'text-indigo-400' : 'text-rose-500 saturate-150 brightness-110';
    const dotColorClass = color === 'indigo' ? 'bg-indigo-500' : 'bg-rose-500 saturate-150';
    const dotShadowClass = color === 'indigo' ? 'shadow-indigo-500/50' : 'shadow-rose-500/50';
    const bgBadge = color === 'indigo' ? 'bg-indigo-500' : 'bg-rose-600 saturate-150';
    
    const isExhausted = timeouts >= 2;

    return (
        <div className={`flex items-center gap-4 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
            
            {/* Timeout Group */}
            <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
                <button 
                    onClick={(e) => { e.stopPropagation(); if(!isExhausted) onTimeout(); }}
                    disabled={isExhausted}
                    className={`
                        flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full border 
                        transition-all active:scale-90 duration-200
                        ${isExhausted 
                            ? 'bg-white/5 border-white/5 opacity-30 cursor-not-allowed text-slate-500' 
                            : 'bg-white/10 hover:bg-white/20 border-white/10 hover:border-white/30 text-white shadow-lg backdrop-blur-md'}
                    `}
                    aria-label="Timeout"
                >
                    <Timer size={18} className="md:w-6 md:h-6" />
                </button>

                <div className="flex flex-col gap-1.5 py-1">
                     {[1, 2].map(i => {
                         const isAvailable = i > timeouts;
                         return (
                             <div 
                                key={i} 
                                className={`
                                    w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 border border-black/20
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
                <div className={`flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className={`text-base md:text-xl font-black uppercase tracking-widest whitespace-nowrap leading-none ${colorClass} drop-shadow-sm`}>
                        {truncateName(name)}
                    </span>
                    <Volleyball 
                        size={16} 
                        className={`
                            text-white transition-all duration-300 md:w-5 md:h-5
                            ${isServing ? 'opacity-100 scale-100 animate-pulse' : 'opacity-0 scale-0 w-0'}
                        `} 
                    />
                </div>
                
                {/* Status Badges - Scaled Up */}
                <div className={`h-6 flex items-center mt-1.5 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
                    {isMatchPoint ? (
                        <span className="px-2.5 py-0.5 rounded bg-amber-500 text-black text-xs md:text-sm font-black uppercase tracking-wider leading-none shadow-lg shadow-amber-500/20 animate-pulse">
                            MATCH POINT
                        </span>
                    ) : isSetPoint ? (
                        <span className={`px-2.5 py-0.5 rounded ${bgBadge} text-white text-xs md:text-sm font-black uppercase tracking-wider leading-none shadow-lg opacity-90`}>
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
        fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[55] 
        transition-all duration-500 ease-out origin-top
        pt-[env(safe-area-inset-top)] w-auto max-w-[98vw]
      `}
    >
      <div className="flex items-center gap-6 md:gap-12 px-8 py-4 md:px-10 md:py-5 rounded-3xl bg-slate-900/90 backdrop-blur-3xl border border-white/10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
        
        <TeamSection 
            name={teamNameA} color={colorA} isServing={isServingLeft} align="left"
            timeouts={timeoutsA} onTimeout={onTimeoutA}
            isMatchPoint={isMatchPointA} isSetPoint={isSetPointA}
        />

        {/* Divider */}
        <div className="w-px h-12 md:h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

        {/* Center Info - Massive Timer & Set */}
        <div className="flex flex-col items-center justify-center min-w-[120px] md:min-w-[160px]">
             
            {inSuddenDeath ? (
                 <div className="flex flex-col items-center animate-pulse">
                    <span className="text-xs md:text-sm font-black text-rose-500 uppercase tracking-[0.2em] leading-none mb-2 flex items-center gap-1.5">
                         <Zap size={14} fill="currentColor" /> DEATH
                    </span>
                    <span className="text-3xl md:text-5xl font-black text-white tabular-nums leading-none tracking-tighter drop-shadow-2xl">SUDDEN</span>
                 </div>
            ) : isDeuce ? (
                <div className="flex flex-col items-center">
                    <span className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">
                        ADVANTAGE
                    </span>
                    <span className="text-3xl md:text-5xl font-black text-white tabular-nums leading-none tracking-tighter drop-shadow-2xl">DEUCE</span>
                 </div>
            ) : (
                <button 
                    onClick={onToggleTimer}
                    className="flex flex-col items-center justify-center group outline-none"
                    aria-label={isTimerRunning ? "Pause Timer" : "Start Timer"}
                >
                    <div className={`flex items-center gap-2 transition-all duration-300 ${isTimerRunning ? 'opacity-100' : 'opacity-60 grayscale'}`}>
                        <span className={`font-mono text-4xl md:text-6xl font-black tabular-nums leading-none tracking-tighter drop-shadow-2xl ${isTimerRunning ? 'text-white' : 'text-slate-400'}`}>
                            {formatTime(time)}
                        </span>
                    </div>
                    
                    <div className="mt-2 md:mt-3">
                        <span className={`text-xs md:text-sm font-bold uppercase tracking-[0.25em] leading-none whitespace-nowrap ${isTieBreak ? 'text-amber-400' : 'text-indigo-200/80 group-hover:text-indigo-300 transition-colors'}`}>
                            {isTieBreak ? 'TIE BREAK' : `SET ${currentSet}`}
                        </span>
                    </div>
                </button>
            )}
        </div>

        {/* Divider */}
        <div className="w-px h-12 md:h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

        <TeamSection 
            name={teamNameB} color={colorB} isServing={isServingRight} align="right"
            timeouts={timeoutsB} onTimeout={onTimeoutB}
            isMatchPoint={isMatchPointB} isSetPoint={isSetPointB}
        />

      </div>
    </div>
  );
};