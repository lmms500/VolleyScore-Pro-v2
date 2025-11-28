
import React from 'react';
import { TeamId } from '../types';
import { Zap } from 'lucide-react';
import { useScoreGestures } from '../hooks/useScoreGestures';
import { useTranslation } from '../contexts/LanguageContext';
import { useLayoutManager } from '../contexts/LayoutContext';
import { useElementSize } from '../hooks/useElementSize';

interface ScoreCardFullscreenProps {
  teamId: TeamId;
  score: number;
  isServing: boolean;
  onAdd: () => void;
  onSubtract: () => void;
  isMatchPoint: boolean;
  isSetPoint: boolean;
  isDeuce?: boolean;
  inSuddenDeath?: boolean;
  colorTheme: 'indigo' | 'rose';
  isLocked?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  reverseLayout?: boolean;
  scoreRefCallback?: (node: HTMLElement | null) => void;
}

export const ScoreCardFullscreen: React.FC<ScoreCardFullscreenProps> = ({
  teamId, score, isServing, onAdd, onSubtract,
  isMatchPoint, isSetPoint, inSuddenDeath, colorTheme,
  isLocked = false, onInteractionStart, onInteractionEnd, reverseLayout,
  scoreRefCallback
}) => {
  const { t } = useTranslation();
  const { mode, scale, registerElement } = useLayoutManager();
  
  // Measurement hooks for layout context (dimensions only)
  const { ref: internalScoreRef, width: scoreW, height: scoreH } = useElementSize<HTMLSpanElement>();

  // Combine refs
  const setScoreRef = (node: HTMLElement | null) => {
    (internalScoreRef as any).current = node;
    if (scoreRefCallback) scoreRefCallback(node);
  };

  // Report sizes to Layout Manager
  React.useEffect(() => {
    registerElement(`score${teamId}`, scoreW, scoreH);
  }, [scoreW, scoreH, teamId, registerElement]);

  const onSwipeLeft = teamId === 'A' ? onSubtract : undefined;
  const onSwipeRight = teamId === 'B' ? onSubtract : undefined;

  const gestureHandlers = useScoreGestures({
    onAdd, onSubtract, onSwipeLeft, onSwipeRight,
    isLocked, onInteractionStart, onInteractionEnd
  });

  const theme = {
    indigo: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500',
      glowRadial: 'bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.35)_0%,rgba(99,102,241,0)_70%)]',
      glowShadow: 'drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]'
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500',
      glowRadial: 'bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.35)_0%,rgba(244,63,94,0)_70%)]',
      glowShadow: 'drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]'
    }
  }[colorTheme];

  // Logic: "HUD Central based ONLY on size of score"
  const isVisualLeft = reverseLayout ? teamId === 'B' : teamId === 'A';
  // Reduced push out to keep scores closer to center but separate
  const pushOutClass = isVisualLeft ? '-translate-x-2 md:-translate-x-6' : 'translate-x-2 md:translate-x-6';
  const orderClass = reverseLayout 
    ? (teamId === 'A' ? 'order-last' : 'order-first') 
    : (teamId === 'A' ? 'order-first' : 'order-last');

  const glowClass = (isMatchPoint || isSetPoint) ? theme.glowShadow : '';

  // Dynamic Styles
  const badgeScale = mode === 'ultra' ? 0.9 : 1.1;
  const badgeOffset = mode === 'ultra' ? 'top-[-3rem]' : 'top-[-4rem]';

  return (
    <div 
        className={`
            flex-1 relative h-full flex items-center justify-center select-none 
            ${orderClass} ${isLocked ? 'opacity-50 grayscale' : ''}
            transition-all duration-300
        `}
        style={{ touchAction: 'none' }}
        {...gestureHandlers}
    >
      
      {/* Background Glow */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${theme.glowRadial} pointer-events-none mix-blend-screen ${isServing ? 'opacity-100' : 'opacity-0'}`} 
      />

      {/* Main Content Anchor - Centered strictly */}
      <div 
        className={`relative flex items-center justify-center transition-transform duration-500 ${pushOutClass}`}
        style={{ transform: `${pushOutClass} scale(${scale})` }}
      >
        
        {/* SCORE (The Centerpiece) */}
        <div className="relative z-10 flex flex-col items-center">
             {/* Badge floating above score */}
            {(isMatchPoint || isSetPoint || inSuddenDeath) && (
                <div className={`absolute left-0 right-0 flex justify-center ${badgeOffset} transition-all duration-300 z-20`}>
                    <div 
                        className={`
                            px-4 py-1.5 rounded-lg backdrop-blur-xl border border-white/20 shadow-2xl
                            font-black uppercase tracking-[0.2em] text-center whitespace-nowrap
                            text-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center gap-2
                            ${inSuddenDeath ? 'bg-red-600 text-white shadow-red-500/60 ring-2 ring-red-500/30' : isMatchPoint ? 'bg-amber-500 text-black shadow-amber-500/60 ring-2 ring-amber-500/30' : isSetPoint ? `${theme.bg} text-white ring-2 ring-white/20` : 'bg-slate-200 text-slate-900'} 
                        `}
                        style={{ transform: `scale(${badgeScale})` }}
                    >
                        {inSuddenDeath && <Zap className="w-4 h-4" fill="currentColor" />}
                        {inSuddenDeath ? t('game.suddenDeath') : isMatchPoint ? t('game.matchPoint') : isSetPoint ? t('game.setPoint') : t('game.deuce')}
                    </div>
                </div>
            )}

            {/* The Number */}
            <span 
                ref={setScoreRef}
                className={`block font-black leading-none text-white tracking-tighter transition-all duration-300 ${glowClass}`}
                style={{ 
                    // Maximized Font Size
                    fontSize: 'clamp(12rem, 42vh, 30rem)',
                    textShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    lineHeight: 0.85
                 }}
            >
                {score}
            </span>
        </div>

      </div>
    </div>
  );
};
