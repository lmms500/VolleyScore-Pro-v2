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

  const buttonClass = `p-1 sm:p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:active:scale-100 flex items-center justify-center shrink-0`;
  const iconSizeClass = 'size-4 sm:size-5';
  
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
        className={`
          w-full h-full
          pointer-events-auto transition-all duration-300 flex flex-col
          items-center justify-center gap-1
          [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]
        `}
      >
        <div className="flex-none flex items-center justify-center w-full px-2 gap-1.5 sm:gap-2 flex-wrap">
             <div className="flex items-center justify-center gap-1.5">
                  <Clock className="size-4 sm:size-5 text-slate-300" />
                  <span className="font-mono text-base sm:text-2xl font-bold text-slate-100 tabular-nums">{formatTime(time)}</span>
              </div>
              <div className="h-4 w-px bg-white/20 hidden sm:block"></div>
              <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2">
                  <span className={`text-xs sm:text-base font-bold uppercase tracking-widest ${isTieBreak ? 'text-amber-400 animate-pulse' : 'text-slate-300'}`}>
                      {isTieBreak ? t('game.tieBreak') : t('history.setLabel', { setNumber: currentSet })}
                  </span>
                  {isDeuce && <span className="text-xs sm:text-base font-bold uppercase tracking-widest text-slate-100 animate-pulse">{t('game.deuce')}</span>}
              </div>
        </div>

        <div className="flex-shrink flex items-center justify-around w-full px-2 min-h-0">
              <div className="flex items-center gap-1.5 sm:gap-2 text-center">
                <button onClick={onTimeoutA} disabled={timeoutsA >= 2} className="flex flex-col items-center gap-1 p-1 rounded-xl transition-colors hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent">
                  <Hand className="size-6 sm:size-8 text-indigo-400" />
                  <div className="flex gap-2">
                    {[1, 2].map(t => <div key={t} className={`w-2.5 h-2.5 sm:w-3 h-3 rounded-full ${t <= timeoutsA ? 'bg-slate-700' : 'bg-indigo-500 shadow-[0_0_8px_currentColor]'}`} />)}
                  </div>
                </button>
                <span className="font-black text-indigo-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.6)] text-6xl sm:text-8xl leading-none" style={{ transform: `scale(${placement.internalScale})`}}>{setsA}</span>
              </div>

              <div className="w-px h-16 sm:h-20 bg-white/20 rounded-full mx-1 sm:mx-2"></div>

              <div className="flex items-center gap-1.5 sm:gap-2 text-center">
                <span className="font-black text-rose-400 drop-shadow-[0_0_30px_rgba(244,63,94,0.6)] text-6xl sm:text-8xl leading-none" style={{ transform: `scale(${placement.internalScale})`}}>{setsB}</span>
                <button onClick={onTimeoutB} disabled={timeoutsB >= 2} className="flex flex-col items-center gap-1 p-1 rounded-xl transition-colors hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent">
                  <Hand className="size-6 sm:size-8 text-rose-400" />
                  <div className="flex gap-2">
                    {[1, 2].map(t => <div key={t} className={`w-2.5 h-2.5 sm:w-3 h-3 rounded-full ${t <= timeoutsB ? 'bg-slate-700' : 'bg-rose-500 shadow-[0_0_8px_currentColor]'}`} />)}
                  </div>
                </button>
              </div>
        </div>

        <div className="flex-none flex items-center justify-center w-full gap-x-1">
              <button onClick={onUndo} disabled={!canUndo} className={buttonClass} title={t('controls.undo')}><Undo2 className={iconSizeClass} /></button>
              <button onClick={onSwap} className={buttonClass} title={t('controls.swap')}><ArrowLeftRight className={iconSizeClass} /></button>
              <div className="w-px h-6 bg-white/20 mx-1 sm:mx-2"></div>
              <button onClick={onRoster} className={`${buttonClass} text-cyan-400 hover:text-white`} title={t('controls.teams')}><Users className={iconSizeClass} /></button>
              <button onClick={onSettings} className={buttonClass} title={t('controls.settings')}><Settings className={iconSizeClass} /></button>
              <div className="w-px h-6 bg-white/20 mx-1 sm:mx-2"></div>
              <button onClick={onReset} className={`${buttonClass} text-rose-500/80 hover:text-rose-400`} title={t('controls.reset')}><RotateCcw className={iconSizeClass} /></button>
        </div>

      </div>
    </div>
  );
};
