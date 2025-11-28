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
  
  const btnClass = "p-3 rounded-full hover:bg-white/10 active:scale-95 text-slate-400 hover:text-white transition-all";
  const iconSize = 20;

  return (
    // Responsive Container: 
    // Landscape: Vertical Column (h-full w-auto)
    // Portrait: Horizontal Bar (w-full h-auto)
    <div className="
        flex items-center justify-center p-2
        landscape:flex-col landscape:h-full landscape:w-32 landscape:border-x landscape:border-y-0
        flex-row w-full h-auto border-y landscape:py-4
        bg-[#0f172a]/95 backdrop-blur-md border-white/5
    ">
        
        {/* TOP: Info & Time */}
        <div className="flex landscape:flex-col items-center gap-2 landscape:mb-auto flex-1 landscape:flex-none justify-start px-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${isTieBreak ? 'border-amber-500/30 text-amber-500' : 'border-white/10 text-slate-500'}`}>
                {isTieBreak ? 'Tie' : `S${currentSet}`}
            </span>
            <div className="flex items-center gap-1 text-slate-300 bg-white/5 px-2 py-1 rounded">
                <Clock size={12} />
                <span className="font-mono text-xs font-bold">{formatTime(time)}</span>
            </div>
        </div>

        {/* MIDDLE: Scores & Timeouts */}
        <div className="flex landscape:flex-col items-center justify-center gap-4 landscape:gap-6 flex-1">
             {/* Timeout A */}
             <button onClick={onTimeoutA} disabled={timeoutsA >= 2} className="group flex flex-col landscape:flex-row items-center gap-1">
                <div className={`p-2 rounded-full border flex items-center justify-center transition-all ${timeoutsA >= 2 ? 'border-slate-800 text-slate-700' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 group-active:scale-95'}`}>
                    <Hand size={16} />
                </div>
                <div className="flex landscape:flex-col gap-1">
                    {[1, 2].map(t => <div key={t} className={`w-1.5 h-1.5 rounded-full ${t <= timeoutsA ? 'bg-slate-800' : 'bg-indigo-500'}`} />)}
                </div>
             </button>

             <div className="flex landscape:flex-col items-center gap-2">
                <span className="text-4xl font-black text-indigo-400 leading-none">{setsA}</span>
                <div className="h-6 w-px landscape:w-6 landscape:h-px bg-white/10"></div>
                <span className="text-4xl font-black text-rose-400 leading-none">{setsB}</span>
             </div>

             {/* Timeout B */}
             <button onClick={onTimeoutB} disabled={timeoutsB >= 2} className="group flex flex-col landscape:flex-row-reverse items-center gap-1">
                <div className={`p-2 rounded-full border flex items-center justify-center transition-all ${timeoutsB >= 2 ? 'border-slate-800 text-slate-700' : 'bg-rose-500/10 border-rose-500/30 text-rose-400 group-active:scale-95'}`}>
                    <Hand size={16} />
                </div>
                <div className="flex landscape:flex-col gap-1">
                    {[1, 2].map(t => <div key={t} className={`w-1.5 h-1.5 rounded-full ${t <= timeoutsB ? 'bg-slate-800' : 'bg-rose-500'}`} />)}
                </div>
             </button>
        </div>

        {/* BOTTOM: Controls */}
        <div className="flex landscape:flex-col items-center gap-1 landscape:mt-auto flex-1 landscape:flex-none justify-end px-2">
            <button onClick={onUndo} disabled={!canUndo} className={`${btnClass} ${!canUndo && 'opacity-30'}`}><Undo2 size={iconSize} /></button>
            <button onClick={onSwap} className={btnClass}><ArrowLeftRight size={iconSize} /></button>
            <div className="w-px h-4 landscape:w-4 landscape:h-px bg-white/10 mx-1"></div>
            <button onClick={onRoster} className={btnClass}><Users size={iconSize} /></button>
            <button onClick={onSettings} className={btnClass}><Settings size={iconSize} /></button>
            <div className="w-px h-4 landscape:w-4 landscape:h-px bg-white/10 mx-1"></div>
            <button onClick={onReset} className={`${btnClass} text-rose-500/80 hover:bg-rose-500/10`}><RotateCcw size={iconSize} /></button>
        </div>

    </div>
  );
};