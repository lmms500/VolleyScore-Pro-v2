import React from 'react';
import { Clock, Undo2, ArrowLeftRight, RotateCcw, Settings, Users, Hand } from 'lucide-react';
import { HudPlacement } from '../hooks/useHudMeasure';
import { useTranslation } from '../contexts/LanguageContext';

interface MeasuredFullscreenHUDProps {
  placement: HudPlacement;
  setsA: number;
  setsB: number;
  time: number;
  currentSet: number;
  isTieBreak: boolean;
  isDeuce: boolean;
  onUndo: () => void;
  canUndo: boolean;
  onSwap: () => void;
  onReset: () => void;
  onSettings: () => void;
  onRoster: () => void;
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

export const MeasuredFullscreenHUD: React.FC<MeasuredFullscreenHUDProps> = ({
  placement, setsA, setsB, time, currentSet, isTieBreak, isDeuce,
  onUndo, canUndo, onSwap, onReset, onSettings, onRoster,
  timeoutsA, timeoutsB, onTimeoutA, onTimeoutB
}) => {
  const { t } = useTranslation();

  if (placement.mode === 'fallback') {
    return null;
  }
  
  const isCompact = placement.compact;

  const buttonClass = `p-1.5 sm:p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:active:scale-100 flex items-center justify-center shrink-0`;
  const iconSizeClass = `w-[18px] h-[18px] sm:size-5`;
  
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    left: placement.left,
    top: placement.top,
    width: placement.width,
    height: placement.height,
    transform: 'translate(0, 0)',
  };

  return (
    <div 
      style={containerStyle}
      className="z-40 pointer-events-none flex items-center justify-center transition-all duration-300 ease-out"
    >
      <div 
        data-compact={isCompact}
        className="w-full h-full flex flex-col items-center justify-between text-white p-1 sm:p-2"
      >
        {/* Top Group: Timer & Set Info */}
        <div className="flex flex-col items-center gap-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-auto">
            <div className="flex items-center gap-2 sm:gap-3 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 border border-white/10">
                <Clock className="size-4 sm:size-5" />
                <span className="font-mono text-xl sm:text-2xl font-bold tabular-nums">{formatTime(time)}</span>
            </div>
            <div className="flex items-center gap-2">
               <span className={`text-xs sm:text-sm font-black uppercase tracking-widest px-3 py-1 rounded-full ${isTieBreak ? 'bg-amber-500/90 text-black' : 'bg-black/30'}`}>
                   {isTieBreak ? t('game.tieBreak') : t('history.setLabel', { setNumber: currentSet })}
               </span>
               {isDeuce && <span className="text-xs sm:text-sm font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-200 text-slate-900">{t('game.deuce')}</span>}
            </div>
        </div>

        {/* Middle Group: Sets and Timeouts */}
        <div className="w-full flex justify-between items-center px-2 sm:px-4">
          {/* Team A Info */}
          <div className="flex items-center gap-2 sm:gap-4 text-center pointer-events-auto">
            <button onClick={onTimeoutA} disabled={timeoutsA >= 2} className="flex flex-col items-center gap-2 p-1 rounded-xl transition-colors hover:bg-white/10 disabled:opacity-30">
              <Hand className="size-6 sm:size-7 text-indigo-400" />
              <div className="flex gap-1.5">
                {[1, 2].map(t => <div key={t} className={`size-2 sm:size-2.5 rounded-full transition-all ${t <= timeoutsA ? 'bg-slate-700' : 'bg-indigo-500 shadow-[0_0_8px_currentColor]'}`} />)}
              </div>
            </button>
            <span className="font-black text-indigo-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.6)] text-6xl sm:text-7xl leading-none">{setsA}</span>
          </div>

          {/* Team B Info */}
          <div className="flex items-center gap-2 sm:gap-4 text-center pointer-events-auto">
            <span className="font-black text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)] text-6xl sm:text-7xl leading-none">{setsB}</span>
            <button onClick={onTimeoutB} disabled={timeoutsB >= 2} className="flex flex-col items-center gap-2 p-1 rounded-xl transition-colors hover:bg-white/10 disabled:opacity-30">
              <Hand className="size-6 sm:size-7 text-rose-400" />
              <div className="flex gap-1.5">
                {[1, 2].map(t => <div key={t} className={`size-2 sm:size-2.5 rounded-full transition-all ${t <= timeoutsB ? 'bg-slate-700' : 'bg-rose-500 shadow-[0_0_8px_currentColor]'}`} />)}
              </div>
            </button>
          </div>
        </div>
        
        {/* Bottom Group: Controls */}
        <div className="flex items-center justify-center gap-x-1 sm:gap-x-2 bg-black/40 rounded-full px-2 py-1 border border-white/10 backdrop-blur-sm pointer-events-auto">
              <button onClick={onUndo} disabled={!canUndo} className={buttonClass} title={t('controls.undo')}><Undo2 className={iconSizeClass} /></button>
              <button onClick={onSwap} className={buttonClass} title={t('controls.swap')}><ArrowLeftRight className={iconSizeClass} /></button>
              <div className="w-px h-6 bg-white/10 mx-1"></div>
              <button onClick={onRoster} className={`${buttonClass} text-cyan-400 hover:text-white`} title={t('controls.teams')}><Users className={iconSizeClass} /></button>
              <button onClick={onSettings} className={buttonClass} title={t('controls.settings')}><Settings className={iconSizeClass} /></button>
              <div className="w-px h-6 bg-white/10 mx-1"></div>
              <button onClick={onReset} className={`${buttonClass} text-rose-500/80 hover:text-rose-400`} title={t('controls.reset')}><RotateCcw className={iconSizeClass} /></button>
        </div>

      </div>
    </div>
  );
};
