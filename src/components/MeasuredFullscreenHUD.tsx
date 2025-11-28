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

  const buttonClass = `p-4 sm:p-5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:active:scale-100 flex items-center justify-center shrink-0`;
  const iconSizeClass = isCompact ? 'size-6' : 'size-7 sm:size-8';
  
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
          bg-[#020617]/90 backdrop-blur-2xl border border-white/10 
          rounded-3xl shadow-[0_0_80px_-10px_rgba(0,0,0,0.9)] 
          pointer-events-auto transition-all duration-300 overflow-hidden flex flex-col
        `}
      >
        <div className="flex-none flex items-center justify-center w-full pt-6 px-3 gap-6 sm:gap-8 flex-wrap min-h-[72px]">
             <div className="flex items-center justify-center gap-3 bg-black/40 px-5 py-2.5 rounded-full border border-white/5">
                  <Clock className="size-5 text-slate-300" />
                  <span className="font-mono text-lg sm:text-xl font-bold text-slate-200 tabular-nums data-[compact=true]:text-base">{formatTime(time)}</span>
              </div>
              <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
              <div className="flex items-center justify-center flex-wrap gap-2">
                  <span className={`text-sm sm:text-base data-[compact=true]:text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${isTieBreak ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                      {isTieBreak ? t('game.tieBreak') : t('history.setLabel', { setNumber: currentSet })}
                  </span>
                  {isDeuce && <span className="text-sm sm:text-base data-[compact=true]:text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-slate-200 text-slate-900 animate-pulse">{t('game.deuce')}</span>}
              </div>
        </div>

        <div className="flex-1 flex items-center justify-around w-full px-2 min-h-0">
              <div className="flex items-center gap-8 data-[compact=true]:gap-4 text-center">
                <button onClick={onTimeoutA} disabled={timeoutsA >= 2} className="flex flex-col items-center gap-3 p-3 rounded-xl transition-colors hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent">
                  <Hand className="size-8 sm:size-10 text-indigo-400" />
                  <div className="flex gap-2.5">
                    {[1, 2].map(t => <div key={t} className={`w-3.5 h-3.5 rounded-full ${t <= timeoutsA ? 'bg-slate-700' : 'bg-indigo-500 shadow-[0_0_8px_currentColor]'}`} />)}
                  </div>
                </button>
                <span className="font-black text-indigo-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.6)] text-8xl sm:text-9xl data-[compact=true]:text-7xl leading-none" style={{ transform: `scale(${placement.internalScale})`}}>{setsA}</span>
              </div>

              <div className="w-px h-24 bg-white/10 rounded-full"></div>

              <div className="flex items-center gap-8 data-[compact=true]:gap-4 text-center">
                <span className="font-black text-rose-400 drop-shadow-[0_0_30px_rgba(244,63,94,0.6)] text-8xl sm:text-9xl data-[compact=true]:text-7xl leading-none" style={{ transform: `scale(${placement.internalScale})`}}>{setsB}</span>
                <button onClick={onTimeoutB} disabled={timeoutsB >= 2} className="flex flex-col items-center gap-3 p-3 rounded-xl transition-colors hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent">
                  <Hand className="size-8 sm:size-10 text-rose-400" />
                  <div className="flex gap-2.5">
                    {[1, 2].map(t => <div key={t} className={`w-3.5 h-3.5 rounded-full ${t <= timeoutsB ? 'bg-slate-700' : 'bg-rose-500 shadow-[0_0_8px_currentColor]'}`} />)}
                  </div>
                </button>
              </div>
        </div>

        <div className="flex-none flex items-center justify-center w-full gap-x-4 sm:gap-x-6 border-t border-white/10 py-6">
              <button onClick={onUndo} disabled={!canUndo} className={buttonClass} title={t('controls.undo')}><Undo2 className={iconSizeClass} /></button>
              <button onClick={onSwap} className={buttonClass} title={t('controls.swap')}><ArrowLeftRight className={iconSizeClass} /></button>
              <div className="w-px h-10 bg-white/10 mx-3"></div>
              <button onClick={onRoster} className={`${buttonClass} text-cyan-400 hover:text-white`} title={t('controls.teams')}><Users className={iconSizeClass} /></button>
              <button onClick={onSettings} className={buttonClass} title={t('controls.settings')}><Settings className={iconSizeClass} /></button>
              <div className="w-px h-10 bg-white/10 mx-3"></div>
              <button onClick={onReset} className={`${buttonClass} text-rose-500/80 hover:text-rose-400`} title={t('controls.reset')}><RotateCcw className={iconSizeClass} /></button>
        </div>

      </div>
    </div>
  );
};