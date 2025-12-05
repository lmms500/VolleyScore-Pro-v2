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

  const iconBase = "p-3 md:p-4 rounded-full transition-all duration-200 active:scale-90 hover:scale-105 flex items-center justify-center";
  const iconText = "text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white";
  const disabledState = "disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent";
  
  return (
    <div className="w-auto max-w-[90vw]">
      <div className="flex items-center gap-1 md:gap-2 px-3 py-2 md:px-6 md:py-3 bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
        
        <button 
          onClick={onUndo} 
          disabled={!canUndo}
          className={`${iconBase} ${iconText} ${disabledState}`}
          title={t('controls.undo')}
        >
          <Undo2 size={20} className="md:w-[22px] md:h-[22px]" />
        </button>

        <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1"></div>

        <button onClick={onSwap} className={`${iconBase} ${iconText}`} title={t('controls.swap')}>
          <ArrowLeftRight size={20} className="md:w-[22px] md:h-[22px]" />
        </button>

        <button onClick={onRoster} className={`${iconBase} bg-cyan-400/20 dark:bg-white/5 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-white shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)]`} title={t('controls.teams')}>
          <Users size={20} className="md:w-[22px] md:h-[22px]" />
        </button>

        <button onClick={onHistory} className={`${iconBase} ${iconText}`} title={t('controls.history')}>
          <History size={20} className="md:w-[22px] md:h-[22px]" />
        </button>

        <button onClick={onSettings} className={`${iconBase} ${iconText}`} title={t('controls.settings')}>
          <Settings size={20} className="md:w-[22px] md:h-[22px]" />
        </button>

        <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1"></div>
        
        <button onClick={onToggleFullscreen} className={`${iconBase} text-indigo-600 dark:text-indigo-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-indigo-800 dark:hover:text-white`} title={t('controls.fullscreen')}>
          <Maximize2 size={20} className="md:w-[22px] md:h-[22px]" />
        </button>

        <button onClick={onReset} className={`${iconBase} text-rose-500 hover:bg-rose-500 hover:text-white`} title={t('controls.reset')}>
          <RotateCcw size={20} className="md:w-[22px] md:h-[22px]" />
        </button>

      </div>
    </div>
  );
});