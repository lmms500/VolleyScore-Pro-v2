import React, { useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useLayoutManager } from '../../contexts/LayoutContext';
import { useElementSize } from '../../hooks/useElementSize';

interface FloatingTopBarProps {
  time: number;
  currentSet: number;
  isTieBreak: boolean;
  isDeuce: boolean;
  onToggleTimer: () => void;
  isTimerRunning: boolean;
  inSuddenDeath: boolean;
  centeredLeft?: number;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const FloatingTopBar: React.FC<FloatingTopBarProps> = ({
  time, currentSet, isTieBreak, isDeuce, onToggleTimer, isTimerRunning, inSuddenDeath, centeredLeft
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

  // Adjust padding/size based on mode
  const paddingClass = mode === 'ultra' ? 'px-4 py-2' : 'px-6 py-3';
  const textSize = mode === 'ultra' ? 'text-lg' : 'text-xl';
  const iconSize = mode === 'ultra' ? 14 : 18;

  return (
    <div 
      ref={ref}
      style={style}
      className={`
        fixed top-4 z-[55] 
        transition-all duration-500 ease-out origin-top
      `}
    >
      <div className={`flex items-center gap-4 ${paddingClass} rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] whitespace-nowrap ring-1 ring-white/5`}>
        
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

        <div className="w-px h-6 bg-white/10"></div>

        {/* Game Status */}
        <div className="flex items-center gap-3">
            <span className={`text-sm font-bold uppercase tracking-widest ${isTieBreak ? 'text-amber-400' : 'text-slate-200'}`}>
                {isTieBreak ? t('game.tieBreak') : t('history.setLabel', { setNumber: currentSet })}
            </span>
            
            {(isDeuce || inSuddenDeath) && (
                 <div className={`
                    flex items-center gap-1.5 px-2 py-0.5 rounded-md
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
    </div>
  );
};
