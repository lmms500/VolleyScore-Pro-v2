import React, { forwardRef, Ref, useState, useEffect } from 'react';
import { Team, TeamId } from '../types';
import { Volleyball, Zap } from 'lucide-react';
import { useScoreGestures } from '../hooks/useScoreGestures';
import { useTranslation } from '../contexts/LanguageContext';

interface ScoreCardFullscreenProps {
  teamId: TeamId;
  team: Team;
  score: number;
  isServing: boolean;
  onAdd: () => void;
  onSubtract: () => void;
  onToggleServe: () => void;
  timeouts: number;
  onTimeout: () => void;
  isMatchPoint: boolean;
  isSetPoint: boolean;
  isDeuce?: boolean;
  inSuddenDeath?: boolean;
  colorTheme: 'indigo' | 'rose';
  isLocked?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  reverseLayout?: boolean;
  scoreRef?: Ref<HTMLSpanElement>;
  nameRef?: Ref<HTMLHeadingElement>;
}

export const ScoreCardFullscreen = forwardRef<HTMLDivElement, ScoreCardFullscreenProps>(({
  teamId, team, score, isServing, onAdd, onSubtract, onToggleServe, timeouts, onTimeout, 
  isMatchPoint, isSetPoint, isDeuce, inSuddenDeath, colorTheme, 
  isLocked = false, onInteractionStart, onInteractionEnd, reverseLayout,
  scoreRef, nameRef
}, ref) => {
  const { t } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const onSwipeLeft = teamId === 'A' ? onSubtract : undefined;
  const onSwipeRight = teamId === 'B' ? onSubtract : undefined;

  const gestureHandlers = useScoreGestures({
    onAdd, 
    onSubtract, 
    onSwipeLeft,
    onSwipeRight,
    isLocked, 
    onInteractionStart, 
    onInteractionEnd
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

  // Visual Direction Logic
  // If teamId is A and NOT reverse, it's Left. If reverse, it's Right.
  // We want to push Left items to the Left (-X) and Right items to the Right (+X).
  const isVisualLeft = reverseLayout ? teamId === 'B' : teamId === 'A';
  
  // Requirement 3: Push scores slightly outwards to create breathing room
  // Translate -1.5rem for Left, +1.5rem for Right
  const pushOutClass = isVisualLeft ? '-translate-x-6' : 'translate-x-6';

  const orderClass = reverseLayout 
    ? (teamId === 'A' ? 'order-last' : 'order-first') 
    : (teamId === 'A' ? 'order-first' : 'order-last');

  const glowClass = (isMatchPoint || isSetPoint) ? theme.glowShadow : '';

  return (
    <div 
        ref={ref}
        className={`
            flex flex-col flex-1 relative h-full transition-all duration-500 select-none overflow-hidden 
            ${orderClass}
            ${isLocked ? 'opacity-90 grayscale-[0.2]' : ''}
            cursor-pointer active:cursor-grabbing
        `}
        style={{ touchAction: 'none' }}
        {...gestureHandlers}
    >
      
      <div 
        className={`
            absolute inset-0 transition-opacity duration-1000 ease-in-out 
            ${theme.glowRadial} 
            pointer-events-none mix-blend-screen
            ${isServing ? 'opacity-100' : 'opacity-0'}
        `} 
      />

      {/* Main container */}
      <div className="flex flex-col h-full w-full relative z-10 p-2 md:p-8 landscape:px-8 py-4">
        
        {/* Header - Interactive Name/Serve Toggle */}
        <div className="flex flex-col items-center justify-center w-full flex-none pointer-events-none">
             {/* Service Indicator integrated */}
            <h2 
                ref={nameRef}
                className="pointer-events-auto font-black uppercase tracking-tighter text-center cursor-pointer hover:text-white transition-all z-10 leading-none text-3xl md:text-5xl landscape:text-4xl text-white drop-shadow-[0_5px_5px_rgba(0,0,0,1)] px-2 w-full truncate flex items-center justify-center gap-3"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onToggleServe(); }}
            >
                {teamId === 'A' && isServing && <Volleyball size={24} className={`${theme.text} animate-bounce`} />}
                <span className="truncate max-w-[80%]">{team?.name || ''}</span>
                {teamId === 'B' && isServing && <Volleyball size={24} className={`${theme.text} animate-bounce`} />}
            </h2>
            
            {/* Manual Serve Toggle Button (small badge below name) */}
            <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onToggleServe(); }}
                className={`
                    pointer-events-auto mt-2 px-2 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-1.5
                    ${isServing ? 'opacity-100' : 'opacity-40 hover:opacity-100'}
                `}
            >
                <div className={`w-1.5 h-1.5 rounded-full ${isServing ? theme.bg : 'bg-slate-500'}`}></div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{t('game.serving')}</span>
            </button>
        </div>

        {/* Score and Badges Container */}
        <div className={`flex-1 w-full flex flex-col justify-center items-center gap-2 pointer-events-none transition-transform duration-500 ${pushOutClass}`}>

            {(isMatchPoint || isSetPoint || inSuddenDeath) && (
                <div className="flex items-center justify-center transition-all duration-300 flex-none">
                    <div 
                        className={`
                            px-2 py-0.5 rounded-sm backdrop-blur-xl border border-white/20 shadow-2xl
                            animate-pulse font-semibold uppercase tracking-[0.2em] text-center whitespace-nowrap
                            text-xs shadow-[0_0_80px_rgba(0,0,0,0.9)] transform flex items-center gap-1.5
                            ${inSuddenDeath
                                ? 'bg-red-600 text-white shadow-red-500/60 ring-4 ring-red-500/20'
                                : isMatchPoint 
                                    ? 'bg-amber-500 text-black shadow-amber-500/60 ring-4 ring-amber-500/20' 
                                    : isSetPoint 
                                        ? `${theme.bg} text-white ring-4 ring-white/10`
                                        : 'bg-slate-200 text-slate-900'} 
                        `}
                    >
                        {inSuddenDeath && <Zap className="w-3 h-3" fill="currentColor" />}
                        {inSuddenDeath ? t('game.suddenDeath') : isMatchPoint ? t('game.matchPoint') : isSetPoint ? t('game.setPoint') : t('game.deuce')}
                    </div>
                </div>
            )}

            <div 
                className={`
                    flex items-center justify-center w-full
                    font-bold leading-none text-white
                    transition-transform duration-150 ease-out
                    outline-none select-none
                    ${isAnimating ? 'scale-105' : 'scale-100'}
                `}
            >
                <span ref={scoreRef} className={`tracking-tight text-[10rem] sm:text-[12rem] transition-all duration-300 ${glowClass}`}>
                    {score}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
});