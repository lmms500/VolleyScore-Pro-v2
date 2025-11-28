import React, { useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useLayoutManager } from '../../contexts/LayoutContext';
import { useElementSize } from '../../hooks/useElementSize';
import { TeamId } from '../../types';

interface FloatingTopBarProps {
  time: number;
  currentSet: number;
  isTieBreak: boolean;
  isDeuce: boolean;
  onToggleTimer: () => void;
  isTimerRunning: boolean;
  inSuddenDeath: boolean;
  centeredLeft?: number;
  teamNameA: string;
  teamNameB: string;
  server: TeamId | null;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const truncateName = (name: string, maxLength: number = 7) => {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 1) + '...';
};

const TeamNamePill: React.FC<{ name: string; color: 'indigo' | 'rose'; isServing: boolean }> = ({ name, color, isServing }) => {
    const colorClass = color === 'indigo' ? 'text-indigo-400' : 'text-rose-400';
    const ringClass = color === 'indigo' ? 'ring-indigo-400/50 bg-indigo-500/10' : 'ring-rose-400/50 bg-rose-500/10';

    return (
        <span className={`
            text-sm font-bold uppercase tracking-widest ${colorClass}
            transition-all duration-300 whitespace-nowrap
            ${isServing ? `ring-2 ${ringClass} px-2 py-0.5 rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.3)]` : ''}
        `}>
            {truncateName(name)}
        </span>
    );
};

export const FloatingTopBar: React.FC<FloatingTopBarProps> = ({
  time, currentSet, isTieBreak, isDeuce, onToggleTimer, isTimerRunning, inSuddenDeath, centeredLeft,
  teamNameA, teamNameB, server
}) => {
  const { t } = useTranslation();
  const { mode, scale, registerElement } = useLayoutManager();
  const { ref, width, height } = useElementSize<HTMLDivElement>();

  useEffect(() => {
    registerElement('topbar', width, height);
  }, [width, height, registerElement]);

  const style: React.CSSProperties = centeredLeft 
    ? { left: `${centeredLeft}px`, transform: `translateX(-50%) scale(${scale})` } 
    : { left: '50%', transform: `translateX(-50%) scale(${scale})` };

  // Compact layout
  const paddingClass = 'px-4 py-2';
  const textSize = 'text-lg';
  const iconSize = 16;

  return (
    <div 
      ref={ref}
      style={style}
      className={`
        fixed top-2 z-[55] 
        transition-all duration-500 ease-out origin-top
      `}
    >
      <div className={`flex items-center gap-4 ${paddingClass} rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.5)] whitespace-nowrap ring-1 ring-white/5`}>
        
        {/* Team A Name */}
        <TeamNamePill name={teamNameA} color="indigo" isServing={server === 'A'} />

        {/* Divider */}
        <div className="w-px h-5 bg-white/10"></div>

        {/* Central Content (Timer + Status) */}
        <div className="flex items-center gap-3">
             {/* Timer */}
            <button 
                onClick={onToggleTimer}
                className={`
                    flex items-center justify-center gap-2 rounded-lg transition-all active:scale-95
                    ${isTimerRunning ? 'text-indigo-300' : 'text-slate-400 opacity-80'}
                `}
            >
                <Clock size={iconSize} className={isTimerRunning ? 'text-indigo-400' : 'text-slate-500'} />
                <span className={`font-mono ${textSize} font-bold tabular-nums tracking-wide`}>{formatTime(time)}</span>
            </button>

            <div className="w-px h-5 bg-white/10"></div>

            {/* Game Status */}
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-widest ${isTieBreak ? 'text-amber-400' : 'text-slate-200'}`}>
                    {isTieBreak ? t('game.tieBreak') : t('history.setLabel', { setNumber: currentSet })}
                </span>
                
                {(isDeuce || inSuddenDeath) && (
                     <div className={`
                        flex items-center gap-1.5 px-1.5 py-0.5 rounded-md
                        ${inSuddenDeath ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'}
                     `}>
                         {inSuddenDeath && <Zap size={10} fill="currentColor" />}
                         <span className="text-[9px] font-black uppercase tracking-widest">
                            {inSuddenDeath ? t('game.suddenDeath') : t('game.deuce')}
                         </span>
                     </div>
                )}
            </div>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/10"></div>

        {/* Team B Name */}
        <TeamNamePill name={teamNameB} color="rose" isServing={server === 'B'} />

      </div>
    </div>
  );
};