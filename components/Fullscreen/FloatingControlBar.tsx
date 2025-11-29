import React, { useEffect, useState } from 'react';
import { Undo2, ArrowLeftRight, RotateCcw, Menu } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useLayoutManager } from '../../contexts/LayoutContext';
import { useElementSize } from '../../hooks/useElementSize';

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
  const { scale, registerElement } = useLayoutManager();
  const { ref, width, height } = useElementSize<HTMLDivElement>();

  useEffect(() => {
    registerElement('controls', width, height);
  }, [width, height, registerElement]);

  // Auto-fade logic
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      setIsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsVisible(false), 4000);
    };
    resetTimer();
    window.addEventListener('pointerdown', resetTimer);
    window.addEventListener('keydown', resetTimer);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('pointerdown', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, []);

  const buttonBase = "rounded-full transition-all duration-300 active:scale-90 flex items-center justify-center text-slate-200 hover:text-white bg-white/5 hover:bg-white/20 border border-white/5 hover:border-white/20 backdrop-blur-md";
  
  // Minimal compact styling
  const pClass = 'p-3';
  const iconSize = 20;

  return (
    <div 
      ref={ref}
      style={{ transform: `translateX(-50%) scale(${scale})` }}
      className={`
        fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] left-1/2 z-50 
        transition-all duration-700 ease-in-out origin-bottom
        ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-30 hover:opacity-100 pointer-events-auto'}
      `}
    >
      <div className={`flex items-center gap-3 p-2 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-white/5`}>
        
        <button 
          onClick={onUndo} 
          disabled={!canUndo}
          className={`${buttonBase} ${pClass} disabled:opacity-30 disabled:cursor-not-allowed`}
          title={t('controls.undo')}
        >
          <Undo2 size={iconSize} />
        </button>

        <button onClick={onSwap} className={`${buttonBase} ${pClass}`} title={t('controls.swap')}>
          <ArrowLeftRight size={iconSize} />
        </button>

        <div className="w-px h-6 bg-white/10 mx-0.5"></div>

        <button onClick={onReset} className={`${buttonBase} ${pClass} text-rose-500 saturate-150 hover:text-rose-200 hover:bg-rose-500/20 hover:border-rose-500/30`} title={t('controls.reset')}>
          <RotateCcw size={iconSize} />
        </button>

        <button onClick={onMenu} className={`${buttonBase} ${pClass} text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/20 hover:border-indigo-500/30`} title={t('game.menu')}>
            <Menu size={iconSize} />
        </button>

      </div>
    </div>
  );
};