import React, { useEffect, useState } from 'react';
import { Undo2, ArrowLeftRight, RotateCcw, Menu } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

interface FloatingControlBarProps {
  onUndo: () => void;
  canUndo: boolean;
  onSwap: () => void;
  onReset: () => void;
  onMenu: () => void;
}

export const FloatingControlBar: React.FC<FloatingControlBarProps> = ({ 
  onUndo, canUndo, onSwap, onReset, onMenu 
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);

  // Auto-fade logic
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      setIsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsVisible(false), 4000);
    };

    // Initial timer
    resetTimer();

    // Listeners to wake up the bar
    window.addEventListener('pointerdown', resetTimer);
    window.addEventListener('keydown', resetTimer);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('pointerdown', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, []);

  const buttonBase = "p-5 rounded-full transition-all duration-300 active:scale-90 flex items-center justify-center text-slate-200 hover:text-white bg-white/5 hover:bg-white/20 border border-white/5 hover:border-white/20 backdrop-blur-md";

  return (
    <div 
      className={`
        fixed bottom-8 left-1/2 -translate-x-1/2 z-50 
        transition-opacity duration-700 ease-in-out
        ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-30 hover:opacity-100 pointer-events-auto'}
      `}
    >
      <div className="flex items-center gap-4 p-2.5 rounded-full bg-black/20 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        
        <button 
          onClick={onUndo} 
          disabled={!canUndo}
          className={`${buttonBase} disabled:opacity-30 disabled:cursor-not-allowed`}
          title={t('controls.undo')}
        >
          <Undo2 size={28} />
        </button>

        <button onClick={onSwap} className={buttonBase} title={t('controls.swap')}>
          <ArrowLeftRight size={28} />
        </button>

        <div className="w-px h-10 bg-white/10 mx-1"></div>

        <button onClick={onReset} className={`${buttonBase} text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 hover:border-rose-500/30`} title={t('controls.reset')}>
          <RotateCcw size={28} />
        </button>

        <button onClick={onMenu} className={`${buttonBase} text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/20 hover:border-indigo-500/30`} title={t('game.menu')}>
            <Menu size={28} />
        </button>

      </div>
    </div>
  );
};