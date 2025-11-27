import React from 'react';
import { RotateCcw, ArrowLeftRight, Settings, Users, Undo2, Maximize2 } from 'lucide-react';

interface ControlsProps {
  onUndo: () => void;
  canUndo: boolean;
  onSwap: () => void;
  onSettings: () => void;
  onRoster: () => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ onUndo, canUndo, onSwap, onSettings, onRoster, onReset, onToggleFullscreen }) => {
  
  const iconBase = "p-3 md:p-4 rounded-full transition-all duration-200 active:scale-90 hover:scale-105 flex items-center justify-center";
  
  return (
    // Note: Positioning is handled by the parent container in App.tsx
    <div className="w-auto max-w-[90vw]">
      <div className="flex items-center gap-1 md:gap-2 px-3 py-2 md:px-6 md:py-3 bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
        
        <button 
          onClick={onUndo} 
          disabled={!canUndo}
          className={`${iconBase} text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent`}
          title="Undo"
        >
          <Undo2 size={20} className="md:w-[22px] md:h-[22px]" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1"></div>

        <button onClick={onSwap} className={`${iconBase} text-slate-300 hover:bg-white/10 hover:text-white`} title="Swap Sides">
          <ArrowLeftRight size={20} className="md:w-[22px] md:h-[22px]" />
        </button>

        <button onClick={onRoster} className={`${iconBase} bg-white/5 text-cyan-400 hover:bg-cyan-500 hover:text-white shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)]`} title="Teams">
          <Users size={20} className="md:w-[22px] md:h-[22px]" />
        </button>

        <button onClick={onSettings} className={`${iconBase} text-slate-300 hover:bg-white/10 hover:text-white`} title="Settings">
          <Settings size={20} className="md:w-[22px] md:h-[22px]" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1"></div>
        
        <button onClick={onToggleFullscreen} className={`${iconBase} text-indigo-300 hover:bg-white/10 hover:text-white`} title="Fullscreen">
          <Maximize2 size={20} className="md:w-[22px] md:h-[22px]" />
        </button>

        <button onClick={onReset} className={`${iconBase} text-rose-500 hover:bg-rose-500 hover:text-white`} title="Reset Match">
          <RotateCcw size={20} className="md:w-[22px] md:h-[22px]" />
        </button>

      </div>
    </div>
  );
};