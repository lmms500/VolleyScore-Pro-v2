import React, { useRef, useEffect } from 'react';
import { Team, TeamId } from '../types';
import { Volleyball, Zap } from 'lucide-react';
import { useScoreGestures } from '../hooks/useScoreGestures';
import { useTranslation } from '../contexts/LanguageContext';
import { useLayoutManager } from '../contexts/LayoutContext';
import { useElementSize } from '../hooks/useElementSize';

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
  scoreRef?: React.Ref<HTMLSpanElement>; // Kept for HUD compatibility if needed
  nameRef?: React.Ref<HTMLHeadingElement>;
}

export const ScoreCardFullscreen: React.FC<ScoreCardFullscreenProps> = ({
  teamId, team, score, isServing, onAdd, onSubtract, onToggleServe,
  isMatchPoint, isSetPoint, inSuddenDeath, colorTheme,
  isLocked = false, onInteractionStart, onInteractionEnd, reverseLayout,
  scoreRef, nameRef
}) => {
  const { t } = useTranslation();
  const { mode, scale, registerElement } = useLayoutManager();
  
  // Measurement hooks
  const { ref: internalScoreRef, width: scoreW, height: scoreH } = useElementSize<HTMLSpanElement>();
  const { ref: internalNameRef, width: nameW, height: nameH } = useElementSize<HTMLDivElement>();

  // Report sizes to Layout Manager
  useEffect(() => {
    registerElement(`score${teamId}`, scoreW, scoreH);
    registerElement(`name${teamId}`, nameW, nameH);
  }, [scoreW, scoreH, nameW, nameH, teamId, registerElement]);

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
  // We use Flex to center the Score Container. 
  // The Name is absolute positioned relative to the Score Container to avoid pushing it down.

  const isVisualLeft = reverseLayout ? teamId === 'B' : teamId === 'A';
  const pushOutClass = isVisualLeft ? '-translate-x-4 md:-translate-x-8' : 'translate-x-4 md:translate-x-8';
  const orderClass = reverseLayout 
    ? (teamId === 'A' ? 'order-last' : 'order-first') 
    : (teamId === 'A' ? 'order-first' : 'order-last');

  const glowClass = (isMatchPoint || isSetPoint) ? theme.glowShadow : '';

  // Dynamic Styles based on Mode
  const nameBottom = mode === 'ultra' ? '100%' : (mode === 'compact' ? '110%' : '120%');
  const nameScale = mode === 'ultra' ? 0.7 : (mode === 'compact' ? 0.85 : 1);
  const badgeScale = mode === 'ultra' ? 0.8 : 1;
  const badgeOffset = mode === 'ultra' ? 'top-[-2rem]' : 'top-[-3rem]';

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
        <div className="relative z-10">
             {/* Badge floating above score */}
            {(isMatchPoint || isSetPoint || inSuddenDeath) && (
                <div className={`absolute left-0 right-0 flex justify-center ${badgeOffset} transition-all duration-300`}>
                    <div 
                        className={`
                            px-2 py-0.5 rounded-sm backdrop-blur-xl border border-white/20 shadow-2xl
                            font-semibold uppercase tracking-[0.2em] text-center whitespace-nowrap
                            text-xs shadow-[0_0_80px_rgba(0,0,0,0.9)] flex items-center gap-1.5
                            ${inSuddenDeath ? 'bg-red-600 text-white shadow-red-500/60 ring-2 ring-red-500/20' : isMatchPoint ? 'bg-amber-500 text-black shadow-amber-500/60 ring-2 ring-amber-500/20' : isSetPoint ? `${theme.bg} text-white ring-2 ring-white/10` : 'bg-slate-200 text-slate-900'} 
                        `}
                        style={{ transform: `scale(${badgeScale})` }}
                    >
                        {inSuddenDeath && <Zap className="w-3 h-3" fill="currentColor" />}
                        {inSuddenDeath ? t('game.suddenDeath') : isMatchPoint ? t('game.matchPoint') : isSetPoint ? t('game.setPoint') : t('game.deuce')}
                    </div>
                </div>
            )}

            {/* The Number */}
            <span 
                ref={(node) => {
                    internalScoreRef.current = node;
                    if (typeof scoreRef === 'function') scoreRef(node);
                    else if (scoreRef) (scoreRef as any).current = node;
                }}
                className={`block font-black leading-none text-white tracking-tighter transition-all duration-300 ${glowClass}`}
                style={{ 
                    fontSize: 'clamp(8rem, 25vh, 16rem)',
                    textShadow: '0 10px 30px rgba(0,0,0,0.5)'
                 }}
            >
                {score}
            </span>
        </div>

        {/* NAME (Absolute positioned relative to Score to not affect center) */}
        <div 
            ref={internalNameRef}
            className="absolute w-[300%] text-center flex flex-col items-center justify-end pointer-events-none"
            style={{ 
                bottom: nameBottom, 
                left: '50%', 
                transform: `translateX(-50%) scale(${nameScale})`,
                transformOrigin: 'bottom center'
            }}
        >
            <h2 
                ref={nameRef}
                className="pointer-events-auto font-black uppercase tracking-tighter text-white drop-shadow-[0_5px_5px_rgba(0,0,0,1)] text-3xl md:text-5xl lg:text-6xl px-4 py-2 cursor-pointer hover:scale-105 transition-transform truncate max-w-full flex items-center justify-center gap-2"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onToggleServe(); }}
            >
                {isServing && <Volleyball size={24} className={`${theme.text} animate-bounce`} />}
                {team?.name || ''}
            </h2>

             {/* Manual Serve Toggle (Small Pill) */}
             <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onToggleServe(); }}
                className={`
                    pointer-events-auto mt-1 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-1.5 backdrop-blur-md
                    ${isServing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}
                `}
            >
                <div className={`w-1.5 h-1.5 rounded-full ${isServing ? theme.bg : 'bg-slate-500'}`}></div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">{t('game.serving')}</span>
            </button>
        </div>

      </div>
    </div>
  );
};
