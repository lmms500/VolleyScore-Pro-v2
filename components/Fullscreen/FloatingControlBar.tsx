import React, { useEffect, useState } from 'react';
import { Undo2, ArrowLeftRight, RotateCcw, Menu, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useLayoutManager } from '../../contexts/LayoutContext';
import { useElementSize } from '../../hooks/useElementSize';
import { motion, AnimatePresence } from 'framer-motion';
import { springSnappy } from '../../utils/animations';

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
  const [isMinimized, setIsMinimized] = useState(false);
  const { scale, registerElement } = useLayoutManager();
  const { ref, width, height } = useElementSize<HTMLDivElement>();

  useEffect(() => {
    registerElement('controls', width, height);
  }, [width, height, registerElement]);

  // System Look Styles
  const glassContainer = "bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40";
  const buttonBase = "rounded-full transition-all duration-300 active:scale-90 flex items-center justify-center text-slate-200 hover:text-white bg-white/5 hover:bg-white/20 border border-white/5 hover:border-white/20 backdrop-blur-md";
  const pClass = 'p-3';
  const iconSize = 20;

  return (
    <div 
      ref={ref}
      style={{ transform: `translateX(-50%) scale(${scale})` }}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] left-1/2 z-50 origin-bottom flex flex-col items-center"
    >
      <AnimatePresence mode="wait" initial={false}>
        {!isMinimized ? (
          <motion.div
            key="expanded"
            initial={{ y: 40, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.9 }}
            transition={springSnappy}
            className={`flex items-center gap-3 p-2 rounded-full ${glassContainer}`}
          >
            {/* Action Buttons */}
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

            {/* Minimize Handle */}
            <div className="w-px h-6 bg-white/10 mx-0.5"></div>

            <button 
              onClick={() => setIsMinimized(true)}
              className={`${buttonBase} p-2 w-10 h-10 text-slate-400 hover:text-white`}
              title="Minimize Controls"
            >
              <ChevronDown size={18} />
            </button>

          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            onClick={() => setIsMinimized(false)}
            initial={{ y: 40, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.5 }}
            transition={springSnappy}
            className={`
               h-10 px-6 rounded-full flex items-center justify-center gap-2
               ${glassContainer} hover:bg-slate-800/60 transition-colors
               text-slate-400 hover:text-white group
            `}
          >
            <div className="w-8 h-1 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors"></div>
            <ChevronUp size={16} className="absolute -top-6 opacity-0 group-hover:opacity-100 group-hover:-top-3 transition-all duration-300" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};