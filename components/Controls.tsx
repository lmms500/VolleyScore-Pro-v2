import React, { memo } from 'react';
import { RotateCcw, ArrowLeftRight, Settings, Users, Undo2, Maximize2, History } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface ControlsProps {
  onUndo: () => void;
  canUndo: boolean;
  onSwap: () => void;
  onSettings: () => void;
  onRoster: () => void;
  onHistory: () => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
}

export const Controls: React.FC<ControlsProps> = memo(({ onUndo, canUndo, onSwap, onSettings, onRoster, onHistory, onReset, onToggleFullscreen }) => {
  const { t } = useTranslation();

  // Premium button styles with squircle shape
  const iconBase = "p-3 md:p-3.5 rounded-2xl transition-all duration-300 active:scale-90 hover:scale-105 flex items-center justify-center relative group";
  const iconText = "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white";
  const disabledState = "disabled:opacity-30 disabled:active:scale-100 disabled:hover:bg-transparent cursor-not-allowed";
  
  // Vertical Divider Component
  const Divider = () => (
    <div className="w-px h-8 bg-gradient-to-b from-transparent via-slate-300 dark:via-white/10 to-transparent mx-1 md:mx-2"></div>
  );

  return (
    <div className="w-auto max-w-[95vw] animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center gap-1 md:gap-1.5 px-2 py-2 md:px-4 md:py-2.5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-2xl shadow-black/10 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/5">
        
        {/* ZONE 1: GAME ACTIONS (Immediate) */}
        <div className="flex items-center gap-1">
            <button 
                onClick={onUndo} 
                disabled={!canUndo}
                className={`${iconBase} ${iconText} ${disabledState}`}
                title={t('controls.undo')}
            >
                <Undo2 size={20} className="md:w-[22px] md:h-[22px]" strokeWidth={2} />
            </button>

            <button onClick={onSwap} className={`${iconBase} ${iconText}`} title={t('controls.swap')}>
                <ArrowLeftRight size={20} className="md:w-[22px] md:h-[22px]" strokeWidth={2} />
            </button>
        </div>

        <Divider />

        {/* ZONE 2: MANAGEMENT (Data/People) */}
        <div className="flex items-center gap-1">
            <button 
                onClick={onRoster} 
                className={`${iconBase} bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-white border border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-[0_0_15px_-5px_rgba(6,182,212,0.5)]`} 
                title={t('controls.teams')}
            >
                <Users size={20} className="md:w-[22px] md:h-[22px]" strokeWidth={2} />
            </button>

            <button onClick={onHistory} className={`${iconBase} ${iconText}`} title={t('controls.history')}>
                <History size={20} className="md:w-[22px] md:h-[22px]" strokeWidth={2} />
            </button>
        </div>

        <Divider />

        {/* ZONE 3: SYSTEM (Config/State) */}
        <div className="flex items-center gap-1">
            <button onClick={onSettings} className={`${iconBase} ${iconText}`} title={t('controls.settings')}>
                <Settings size={20} className="md:w-[22px] md:h-[22px]" strokeWidth={2} />
            </button>
            
            <button onClick={onToggleFullscreen} className={`${iconBase} text-indigo-500/80 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10`} title={t('controls.fullscreen')}>
                <Maximize2 size={20} className="md:w-[22px] md:h-[22px]" strokeWidth={2} />
            </button>

            <button onClick={onReset} className={`${iconBase} text-rose-500/80 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10`} title={t('controls.reset')}>
                <RotateCcw size={20} className="md:w-[22px] md:h-[22px]" strokeWidth={2} />
            </button>
        </div>

      </div>
    </div>
  );
});