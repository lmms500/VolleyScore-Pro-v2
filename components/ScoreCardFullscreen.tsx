import React from 'react';
import { TeamId } from '../types';
import { Zap } from 'lucide-react';
import { useScoreGestures } from '../hooks/useScoreGestures';
import { useTranslation } from '../contexts/LanguageContext';

interface ScoreCardFullscreenProps {
  teamId: TeamId;
  score: number;
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
  isServing?: boolean;
}

export const ScoreCardFullscreen: React.FC<ScoreCardFullscreenProps> = ({
  teamId, score, onAdd, onSubtract,
  isMatchPoint, isSetPoint, isDeuce, inSuddenDeath, colorTheme,
  isLocked = false, onInteractionStart, onInteractionEnd, reverseLayout,
  scoreRefCallback, isServing
}) => {
  const { t } = useTranslation();
  
  const gestureHandlers = useScoreGestures({
    onAdd, onSubtract, isLocked, onInteractionStart, onInteractionEnd
  });

  const theme = {
    indigo: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500',
      // Enhanced gradient from src version
      glowRadial: 'bg-[radial-gradient(circle,rgba(99,102,241,0.6)_0%,rgba(99,102,241,0)_70%)]',
      glowShadow: 'drop-shadow-[0_0_30px_rgba(99,102,241,0.7)]'
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500',
      // Enhanced gradient from src version
      glowRadial: 'bg-[radial-gradient(circle,rgba(244,63,94,0.6)_0%,rgba(244,63,94,0)_70%)]',
      glowShadow: 'drop-shadow-[0_0_30px_rgba(244,63,94,0.7)]'
    }
  }[colorTheme];

  // Logic to determine visual side (Left or Right)
  const isVisualLeft = reverseLayout ? teamId === 'B' : teamId === 'A';
  
  // Push content towards safe edges to make room for center HUD
  const alignClass = isVisualLeft 
    ? 'items-center md:items-start pl-[env(safe-area-inset-left)] md:pl-[5vw]' 
    : 'items-center md:items-end pr-[env(safe-area-inset-right)] md:pr-[5vw]';

  const orderClass = reverseLayout 
    ? (teamId === 'A' ? 'order-last' : 'order-first') 
    : (teamId === 'A' ? 'order-first' : 'order-last');

  const glowClass = (isMatchPoint || isSetPoint) ? theme.glowShadow : '';

  return (
    <div 
        className={`
            flex-1 relative h-full flex flex-col justify-center select-none overflow-visible
            ${orderClass} ${alignClass}
            ${isLocked ? 'opacity-50 grayscale' : ''}
            transition-all duration-300
        `}
        style={{ touchAction: 'none' }}
        {...gestureHandlers}
    >
      
      {/* Content Container (Number + Badge + Glow) */}
      <div className="relative z-10 p-4 md:p-10 flex flex-col items-center overflow-visible">
        
            {/* Background Glow (Centered strictly on this container, huge size to avoid clipping) */}
            <div 
                className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-[250%] h-[250%] rounded-full transition-opacity duration-1000 ease-in-out 
                    ${theme.glowRadial} pointer-events-none mix-blend-screen 
                    ${isServing ? 'opacity-100' : 'opacity-0'}
                `} 
            />

            {/* Badge - Always above the number */}
            {(isMatchPoint || isSetPoint || inSuddenDeath || isDeuce) && (
                <div className="absolute top-[-2rem] md:top-[-3rem] z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div 
                        className={`
                            px-4 py-1.5 rounded-lg backdrop-blur-xl border border-white/20 shadow-2xl
                            font-black uppercase tracking-[0.2em] text-center whitespace-nowrap
                            text-xs md:text-sm shadow-[0_0_40px_rgba(0,0,0,0.8)] flex items-center gap-2
                            ${inSuddenDeath 
                                ? 'bg-red-600 text-white shadow-red-500/60 ring-2 ring-red-500/30' 
                                : isMatchPoint 
                                    ? 'bg-amber-500 text-black shadow-amber-500/60 ring-2 ring-amber-500/30' 
                                    : isSetPoint 
                                        ? `${theme.bg} text-white ring-2 ring-white/20` 
                                        : 'bg-indigo-900/80 text-white ring-1 ring-white/30'} 
                        `}
                    >
                        {inSuddenDeath && <Zap className="w-3 h-3" fill="currentColor" />}
                        {inSuddenDeath ? t('game.suddenDeath') : isMatchPoint ? t('game.matchPoint') : isSetPoint ? t('game.setPoint') : t('game.deuce')}
                    </div>
                </div>
            )}

            {/* The Number - Wrapped for strict ref measurement and glow alignment */}
            <div className="relative">
                <span 
                    ref={scoreRefCallback}
                    className={`block font-black leading-none text-white tracking-tighter transition-all duration-300 ${glowClass}`}
                    style={{ 
                        // Massive responsive font
                        fontSize: 'clamp(10rem, 35vw, 26rem)',
                        textShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        lineHeight: 0.8
                    }}
                >
                    {score}
                </span>
            </div>
      </div>
    </div>
  );
};