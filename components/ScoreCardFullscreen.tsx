import React, { forwardRef, Ref } from 'react';
import { Team, TeamId } from '../types';
import { Dribbble, Zap } from 'lucide-react';
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
  bottomAnchorRef?: Ref<HTMLHeadingElement>;
}

export const ScoreCardFullscreen = forwardRef<HTMLDivElement, ScoreCardFullscreenProps>(({
  teamId, team, score, isServing, onAdd, onSubtract, onToggleServe, timeouts, onTimeout, 
  isMatchPoint, isSetPoint, isDeuce, inSuddenDeath, colorTheme, 
  isLocked = false, onInteractionStart, onInteractionEnd, reverseLayout,
  scoreRef, bottomAnchorRef
}, ref) => {
  const { t } = useTranslation();
  const gestureHandlers = useScoreGestures({
    onAdd, onSubtract, isLocked, onInteractionStart, onInteractionEnd
  });

  const theme = {
    indigo: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500',
      glowRadial: 'bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.35)_0%,rgba(99,102,241,0)_70%)]'
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500',
      glowRadial: 'bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.35)_0%,rgba(244,63,94,0)_70%)]'
    }
  }[colorTheme];

  const orderClass = reverseLayout 
    ? (teamId === 'A' ? 'order-last' : 'order-first') 
    : (teamId === 'A' ? 'order-first' : 'order-last');

  const alignmentClass = teamId === 'A'
    ? (reverseLayout ? 'justify-end' : 'justify-start')
    : (reverseLayout ? 'justify-start' : 'justify-end');

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  return (
    <div 
        ref={ref}
        className={`
            flex flex-col flex-1 relative h-full transition-all duration-500 select-none overflow-hidden 
            ${orderClass}
            ${isLocked ? 'opacity-90 grayscale-[0.2]' : ''}
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

      <div className={`flex flex-col h-full w-full relative z-10 p-2 md:p-8 justify-center items-center`}>
        
        <div className="flex flex-col items-center justify-center w-full flex-none">
            <div className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-lg transition-all duration-300 mb-2 scale-110
                ${isServing ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
            `}>
                <Dribbble size={16} className={`${theme.text} animate-bounce`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text}`}>{t('game.serving')}</span>
            </div>

            <h2 
                ref={bottomAnchorRef}
                className="font-black uppercase tracking-tighter text-center cursor-pointer hover:text-white transition-all z-10 leading-none text-3xl md:text-5xl landscape:text-4xl text-white drop-shadow-[0_5px_5px_rgba(0,0,0,1)] px-2 w-full truncate"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onToggleServe(); }}
            >
                {team?.name || ''}
            </h2>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center gap-4 py-2">
            {(isMatchPoint || isSetPoint || inSuddenDeath) && (
                <div className="flex items-center justify-center transition-all duration-300 flex-none">
                    <div 
                        className={`
                            backdrop-blur-xl border border-white/20 shadow-2xl
                            animate-pulse font-semibold uppercase tracking-widest text-center whitespace-nowrap
                            shadow-[0_0_80px_rgba(0,0,0,0.9)] transform flex items-center
                            text-xs sm:text-sm px-2 py-0.5 rounded-md gap-1 sm:gap-1.5
                            ${inSuddenDeath
                                ? 'bg-red-600 text-white shadow-red-500/60 ring-4 ring-red-500/20'
                                : isMatchPoint 
                                    ? 'bg-amber-500 text-black shadow-amber-500/60 ring-4 ring-amber-500/20' 
                                    : isSetPoint 
                                        ? `${theme.bg} text-white ring-4 ring-white/10`
                                        : 'bg-slate-200 text-slate-900'} 
                        `}
                    >
                        {inSuddenDeath && <Zap className="size-3 sm:size-4" fill="currentColor" />}
                        {inSuddenDeath ? t('game.suddenDeath') : isMatchPoint ? t('game.matchPoint') : isSetPoint ? t('game.setPoint') : t('game.deuce')}
                    </div>
                </div>
            )}

            <div 
                className={`
                    flex items-center w-full flex-1 min-h-0
                    font-black leading-none tracking-tight text-white
                    drop-shadow-2xl transition-transform duration-100 active:scale-95
                    outline-none select-none
                    text-[45vh] landscape:text-[60vh]
                    ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
                    ${alignmentClass} px-10 lg:px-14
                `}
            >
                <span ref={scoreRef}>{score}</span>
            </div>
        </div>
      </div>
    </div>
  );
});