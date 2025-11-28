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
  
  // Design ultra-compacto
  const btnClass = "p-2 rounded-full hover:bg-white/10 active:scale-95 text-slate-400 hover:text-white transition-all";
  const iconSize = 18; 

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex justify-center w-full px-4">
      
      {/* Container "Pílula" Flutuante Centralizada - Muito menor */}
      <div className="
        pointer-events-auto
        flex flex-col items-center
        bg-[#0f172a]/95 backdrop-blur-md
        border border-white/10 rounded-2xl
        shadow-2xl shadow-black/80
        p-3 gap-2
        w-full max-w-[280px]
      ">
        
        {/* Info Line: Set & Timer */}
        <div className="flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
            <span className={isTieBreak ? 'text-amber-500' : ''}>
                {isTieBreak ? 'Tie Break' : `Set ${currentSet}`}
            </span>
            <div className="flex items-center gap-1.5 text-slate-300 bg-white/5 px-2 py-0.5 rounded-md">
                <Clock size={10} />
                <span className="font-mono">{formatTime(time)}</span>
            </div>
        </div>

        {/* Score Sets Main - Reduzido */}
        <div className="flex items-center justify-center gap-4 w-full py-1">
             {/* Timeout A */}
             <button onClick={onTimeoutA} disabled={timeoutsA >= 2} className="group flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-active:scale-95 transition-all">
                    <Hand size={14} />
                </div>
                <div className="flex gap-0.5">
                    {[1, 2].map(t => <div key={t} className={`w-1 h-1 rounded-full ${t <= timeoutsA ? 'bg-slate-700' : 'bg-indigo-500'}`} />)}
                </div>
             </button>

             <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-indigo-400 leading-none drop-shadow-lg">{setsA}</span>
                <div className="h-6 w-px bg-white/10"></div>
                <span className="text-4xl font-black text-rose-400 leading-none drop-shadow-lg">{setsB}</span>
             </div>

             {/* Timeout B */}
             <button onClick={onTimeoutB} disabled={timeoutsB >= 2} className="group flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-active:scale-95 transition-all">
                    <Hand size={14} />
                </div>
                <div className="flex gap-0.5">
                    {[1, 2].map(t => <div key={t} className={`w-1 h-1 rounded-full ${t <= timeoutsB ? 'bg-slate-700' : 'bg-rose-500'}`} />)}
                </div>
             </button>
        </div>

        {/* Controls Row - Compact */}
        <div className="w-full h-px bg-white/5"></div>
        <div className="flex items-center justify-between w-full px-1">
            <div className="flex gap-0.5">
                <button onClick={onUndo} disabled={!canUndo} className={`${btnClass} ${!canUndo && 'opacity-30'}`}><Undo2 size={iconSize} /></button>
                <button onClick={onSwap} className={btnClass}><ArrowLeftRight size={iconSize} /></button>
            </div>
            <div className="w-px h-5 bg-white/5 mx-1"></div>
            <div className="flex gap-0.5">
                <button onClick={onRoster} className={`${btnClass} text-cyan-500/80`}><Users size={iconSize} /></button>
                <button onClick={onSettings} className={btnClass}><Settings size={iconSize} /></button>
            </div>
            <div className="w-px h-5 bg-white/5 mx-1"></div>
            <button onClick={onReset} className={`${btnClass} text-rose-500/80`}><RotateCcw size={iconSize} /></button>
        </div>

      </div>
    </div>
  );
};