import React from 'react';
import { Clock, Undo2, ArrowLeftRight, RotateCcw, Settings, Users, Hand } from 'lucide-react';

interface FullscreenHUDProps {
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

export const FullscreenHUD: React.FC<FullscreenHUDProps> = ({ 
  setsA, setsB, time, currentSet, isTieBreak, isDeuce,
  onUndo, canUndo, onSwap, onReset, onSettings, onRoster,
  timeoutsA, timeoutsB, onTimeoutA, onTimeoutB
}) => {
  
  const buttonClass = "p-3 md:p-4 rounded-full hover:bg-white/10 active:scale-95 transition-all text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:active:scale-100 flex items-center justify-center";
  const separatorClass = "w-px h-6 md:h-10 bg-white/10 mx-1 md:mx-2"; 

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none flex flex-col items-center justify-center w-full px-2">
      <div className="
        flex flex-col items-center justify-center
        bg-[#020617]/90 backdrop-blur-2xl 
        border border-white/10 rounded-3xl md:rounded-[3rem]
        shadow-[0_0_80px_-10px_rgba(0,0,0,0.9)]
        px-4 py-4 md:px-12 md:py-8 gap-2 md:gap-4
        w-11/12 max-w-lg
        transition-all duration-500
        pointer-events-auto
      ">
        
        <div className="flex items-center gap-2 md:gap-3 mb-1">
            <span className={`
                text-[10px] md:text-xs font-black uppercase tracking-[0.15em] px-3 py-1 md:px-4 md:py-1.5 rounded-full border shadow-lg
                ${isTieBreak 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' 
                    : 'bg-white/5 text-slate-400 border-white/10'}
            `}>
                {isTieBreak ? 'Tie Break' : `Set ${currentSet}`}
            </span>
            {isDeuce && (
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-slate-200 text-slate-900 animate-pulse shadow-lg shadow-white/20">
                    Deuce
                </span>
            )}
        </div>

        <div className="flex items-center gap-4 md:gap-8 my-1">
             <button onClick={onTimeoutA} disabled={timeoutsA >= 2}
                className={`flex flex-col items-center gap-1.5 group ${timeoutsA >= 2 ? 'opacity-30 grayscale' : 'hover:scale-110 active:scale-95'} transition-all`}>
                <div className="p-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                    <Hand size={20} className="md:w-6 md:h-6" />
                </div>
                <div className="flex gap-1">
                    {[1, 2].map(t => <div key={t} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${t <= timeoutsA ? 'bg-slate-700' : 'bg-indigo-500 shadow-[0_0_8px_currentColor]'}`} />)}
                </div>
            </button>

            <span className="text-4xl md:text-6xl font-black text-indigo-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]">
                {setsA}
            </span>
            <div className="h-10 w-1 bg-white/10 md:h-16 md:w-1.5 rounded-full"></div>
            <span className="text-4xl md:text-6xl font-black text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]">
                {setsB}
            </span>

             <button onClick={onTimeoutB} disabled={timeoutsB >= 2}
                className={`flex flex-col items-center gap-1.5 group ${timeoutsB >= 2 ? 'opacity-30 grayscale' : 'hover:scale-110 active:scale-95'} transition-all`}>
                <div className="p-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20 transition-colors">
                    <Hand size={20} className="md:w-6 md:h-6" />
                </div>
                <div className="flex gap-1">
                    {[1, 2].map(t => <div key={t} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${t <= timeoutsB ? 'bg-slate-700' : 'bg-rose-500 shadow-[0_0_8px_currentColor]'}`} />)}
                </div>
            </button>
        </div>

        <div className="flex items-center gap-2 opacity-80 mb-2 md:mb-4 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
            <Clock size={12} className="md:w-4 md:h-4 text-slate-300" />
            <span className="font-mono text-xs md:text-base font-bold text-slate-200 tabular-nums tracking-wider">
                {formatTime(time)}
            </span>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent my-1 md:my-2"></div>

        <div className="flex items-center justify-between gap-1 w-full px-1">
            <div className="flex items-center">
                <button onClick={onUndo} disabled={!canUndo} className={buttonClass} title="Undo"><Undo2 size={20} className="md:w-6 md:h-6" /></button>
                <button onClick={onSwap} className={buttonClass} title="Swap Sides"><ArrowLeftRight size={20} className="md:w-6 md:h-6" /></button>
            </div>
            <div className={separatorClass}></div>
            <div className="flex items-center">
                <button onClick={onRoster} className={`${buttonClass} text-cyan-400 hover:text-cyan-200`} title="Team Manager"><Users size={20} className="md:w-6 md:h-6" /></button>
                <button onClick={onSettings} className={buttonClass} title="Settings"><Settings size={20} className="md:w-6 md:h-6" /></button>
            </div>
            <div className={separatorClass}></div>
            <button onClick={onReset} className={`${buttonClass} text-rose-500/80 hover:text-rose-400 hover:bg-rose-500/10`} title="Reset Match"><RotateCcw size={20} className="md:w-6 md:h-6" /></button>
        </div>
      </div>
    </div>
  );
};
