import React, { useEffect, useState } from 'react';
import { Clock, Zap } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

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
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      setIsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsVisible(false), 5000);
    };

    resetTimer();
    window.addEventListener('pointerdown', resetTimer);
    window.addEventListener('keydown', resetTimer);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('pointerdown', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, []);

  const style: React.CSSProperties = centeredLeft 
    ? { left: `${centeredLeft}px`, transform: 'translateX(-50%)' } 
    : { left: '50%', transform: 'translateX(-50%)' };

  return (
    <div 
      style={style}
      className={`
        fixed top-4 md:top-6 z-[55] 
        transition-opacity duration-700 ease-in-out
        ${isVisible ? 'opacity-100' : 'opacity-40 hover:opacity-100'}
      `}
    >
      <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-black/30 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] whitespace-nowrap">
        
        {/* Timer */}
        <button 
            onClick={onToggleTimer}
            className={`
                flex items-center justify-center gap-2 px-2 py-0.5 rounded-lg transition-all active:scale-95
                ${isTimerRunning ? 'text-indigo-300' : 'text-slate-400 opacity-80'}
            `}
        >
            <Clock size={18} className={isTimerRunning ? 'text-indigo-400' : 'text-slate-500'} />
            <span className="font-mono text-xl font-bold tabular-nums tracking-wide">{formatTime(time)}</span>
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
                     {inSuddenDeath && <Zap size={12} fill="currentColor" />}
                     <span className="text-[10px] font-black uppercase tracking-widest">
                        {inSuddenDeath ? t('game.suddenDeath') : t('game.deuce')}
                     </span>
                 </div>
            )}
        </div>

      </div>
    </div>
  );
};