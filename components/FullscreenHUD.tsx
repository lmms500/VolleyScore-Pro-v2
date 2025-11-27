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
  
  // Large hit areas for touch
  const buttonClass = "p-5 md:p-6 rounded-full hover:bg-white/10 active:scale-95 transition-all text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:active:scale-100 flex items-center justify-center";
  const separatorClass = "w-px h-12 bg-white/10 mx-2 md:mx-4"; 

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none flex flex-col items-center justify-center w-full px-4">
      
      {/* Glass Capsule - Enhanced Size */}
      <div className="
        flex flex-col items-center justify-center
        bg-[#020617]/90 backdrop-blur-2xl 
        border border-white/10 rounded-[4rem]
        shadow-[0_0_80px_-10px_rgba(0,0,0,0.9)]
        px-12 py-10 md:px-24 md:py-14 gap-6
        min-w-[380px] md:min-w-[650px]
        transition-all duration-500
        pointer-events-auto
      ">
        
        {/* Top Badge: Set Number or Tie Break */}
        <div className="flex items-center gap-4 mb-2">
            <span className={`
                text-sm md:text-lg font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full border shadow-lg
                ${isTieBreak 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' 
                    : 'bg-white/5 text-slate-400 border-white/10'}
            `}>
                {isTieBreak ? 'Tie Break' : `Set ${currentSet}`}
            </span>
            {isDeuce && (
                <span className="text-sm md:text-lg font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full bg-slate-200 text-slate-900 animate-pulse shadow-lg shadow-white/20">
                    Deuce
                </span>
            )}
        </div>

        {/* Global Set Score - Massive */}
        <div className="flex items-center gap-8 md:gap-16 my-2">
             {/* Team A Timeout Button (Left) */}
             <button 
                onClick={onTimeoutA} 
                disabled={timeoutsA >= 2}
                className={`flex flex-col items-center gap-3 group ${timeoutsA >= 2 ? 'opacity-30 grayscale' : 'hover:scale-110 active:scale-95'} transition-all`}
                title="Call Timeout A"
            >
                <div className="p-4 md:p-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                    <Hand size={32} />
                </div>
                <div className="flex gap-1.5">
                    {[1, 2].map(t => <div key={t} className={`w-2.5 h-2.5 rounded-full ${t <= timeoutsA ? 'bg-slate-700' : 'bg-indigo-500 shadow-[0_0_8px_currentColor]'}`} />)}
                </div>
            </button>

            <span className="text-7xl md:text-9xl font-black text-indigo-400 drop-shadow-[0_0_50px_rgba(99,102,241,0.6)]">
                {setsA}
            </span>
            <div className="h-20 w-2 bg-white/10 md:h-32 rounded-full"></div>
            <span className="text-7xl md:text-9xl font-black text-rose-400 drop-shadow-[0_0_50px_rgba(244,63,94,0.6)]">
                {setsB}
            </span>

             {/* Team B Timeout Button (Right) */}
             <button 
                onClick={onTimeoutB} 
                disabled={timeoutsB >= 2}
                className={`flex flex-col items-center gap-3 group ${timeoutsB >= 2 ? 'opacity-30 grayscale' : 'hover:scale-110 active:scale-95'} transition-all`}
                title="Call Timeout B"
            >
                <div className="p-4 md:p-5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20 transition-colors">
                    <Hand size={32} />
                </div>
                <div className="flex gap-1.5">
                    {[1, 2].map(t => <div key={t} className={`w-2.5 h-2.5 rounded-full ${t <= timeoutsB ? 'bg-slate-700' : 'bg-rose-500 shadow-[0_0_8px_currentColor]'}`} />)}
                </div>
            </button>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-4 opacity-80 mb-6 bg-black/40 px-6 py-3 rounded-full border border-white/5">
            <Clock size={20} className="text-slate-300" />
            <span className="font-mono text-lg md:text-xl font-bold text-slate-200 tabular-nums tracking-wider">
                {formatTime(time)}
            </span>
        </div>

        {/* Action Bar (Glass Divider) */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent my-4"></div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-2 w-full px-2 md:px-6">
            
            {/* Game Actions */}
            <div className="flex items-center gap-2">
                <button onClick={onUndo} disabled={!canUndo} className={buttonClass} title="Undo">
                    <Undo2 size={32} className="md:w-10 md:h-10" />
                </button>
                <button onClick={onSwap} className={buttonClass} title="Swap Sides">
                    <ArrowLeftRight size={32} className="md:w-10 md:h-10" />
                </button>
            </div>

            <div className={separatorClass}></div>

            {/* Management Actions */}
            <div className="flex items-center gap-2">
                <button onClick={onRoster} className={`${buttonClass} text-cyan-400 hover:text-cyan-200`} title="Team Manager">
                    <Users size={32} className="md:w-10 md:h-10" />
                </button>
                <button onClick={onSettings} className={buttonClass} title="Settings">
                    <Settings size={32} className="md:w-10 md:h-10" />
                </button>
            </div>

            <div className={separatorClass}></div>

            {/* Reset */}
            <button onClick={onReset} className={`${buttonClass} text-rose-500/80 hover:text-rose-400 hover:bg-rose-500/10`} title="Reset Match">
                <RotateCcw size={32} className="md:w-10 md:h-10" />
            </button>
        </div>

      </div>
    </div>
  );
};