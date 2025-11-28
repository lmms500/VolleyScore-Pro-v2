import React from 'react';
import { Player, TeamId } from '../types';
import { useScoreGestures } from '../hooks/useScoreGestures';
import { Minus, Plus, MoreVertical, Hand } from 'lucide-react';

interface ScoreCardNormalProps {
  teamId: TeamId;
  team: { name: string; players: Player[] };
  score: number;
  setsWon: number;
  isServing: boolean;
  onAdd: () => void;
  onSubtract: () => void;
  onToggleServe: () => void;
  timeouts: number;
  onTimeout: () => void;
  isMatchPoint: boolean;
  isSetPoint: boolean;
  isDeuce: boolean;
  inSuddenDeath?: boolean;
  reverseLayout?: boolean;
  setsNeededToWin: number;
  colorTheme: 'indigo' | 'rose';
  isLocked: boolean;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
}

export const ScoreCardNormal: React.FC<ScoreCardNormalProps> = ({
  teamId, team, score, setsWon, isServing, onAdd, onSubtract, onToggleServe,
  timeouts, onTimeout, isMatchPoint, isSetPoint, isDeuce, inSuddenDeath,
  reverseLayout, setsNeededToWin, colorTheme, isLocked, onInteractionStart, onInteractionEnd
}) => {
  
  // FIX: Update call to useScoreGestures to pass a single options object for consistency.
  const gestureHandlers = useScoreGestures({
    onAdd,
    onSubtract,
    isLocked,
    onInteractionStart,
    onInteractionEnd
  });

  const themeColors = {
    indigo: {
      bg: 'from-indigo-900/40 to-slate-900/80',
      border: 'border-indigo-500/30',
      text: 'text-indigo-100',
      highlight: 'text-indigo-400',
      button: 'bg-indigo-500 hover:bg-indigo-400',
      glow: 'shadow-indigo-500/20'
    },
    rose: {
      bg: 'from-rose-900/40 to-slate-900/80',
      border: 'border-rose-500/30',
      text: 'text-rose-100',
      highlight: 'text-rose-400',
      button: 'bg-rose-500 hover:bg-rose-400',
      glow: 'shadow-rose-500/20'
    }
  }[colorTheme];

  return (
    <div className={`flex flex-col flex-1 p-2 relative overflow-hidden transition-colors ${isServing ? `bg-${colorTheme}-500/5` : ''}`}>
      
      {/* Header: Name & Sets */}
      <div className={`flex items-center gap-3 mb-2 w-full ${reverseLayout ? 'flex-row-reverse' : 'flex-row'}`}>
         {/* Set Indicators */}
         <div className="flex gap-1">
            {Array.from({ length: setsNeededToWin }).map((_, i) => (
                <div 
                    key={i} 
                    className={`
                        w-2 h-2 rounded-full transition-all
                        ${i < setsWon ? `bg-${colorTheme}-500 shadow-[0_0_8px_currentColor]` : 'bg-slate-800'}
                    `}
                />
            ))}
         </div>
         <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300 truncate flex-1 leading-none">
            {team.name}
         </h2>
         {isServing && (
             <div className={`w-2 h-2 rounded-full animate-pulse bg-${colorTheme}-400 shadow-[0_0_10px_currentColor]`} />
         )}
      </div>

      {/* Main Score Area (GESTURE TARGET) */}
      {/* ADICIONADO style={{ touchAction: 'none' }} PARA BLOQUEAR SCROLL NATIVO */}
      <div 
        className={`
            flex-1 w-full relative rounded-2xl border border-white/5 
            bg-gradient-to-b ${themeColors.bg} backdrop-blur-sm
            flex items-center justify-center overflow-hidden
            cursor-ns-resize active:cursor-grabbing
            select-none
        `}
        style={{ touchAction: 'none' }} 
        {...gestureHandlers}
      >
          {/* Status Badges */}
          <div className="absolute top-4 left-0 w-full flex justify-center gap-2 pointer-events-none">
              {isMatchPoint && <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-black animate-pulse">Match Point</span>}
              {isSetPoint && !isMatchPoint && <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-white text-black">Set Point</span>}
              {isDeuce && <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-200 text-slate-900">Deuce</span>}
              {inSuddenDeath && <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white animate-pulse">Sudden Death</span>}
          </div>

          <span className={`text-[8rem] sm:text-[10rem] font-black leading-none tracking-tighter ${themeColors.highlight} drop-shadow-2xl select-none`}>
              {score}
          </span>
          
          {/* Gesture Hints */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-8 opacity-10 pointer-events-none">
              <MoreVertical size={24} />
          </div>
      </div>

      {/* Footer Controls */}
      <div className={`mt-3 flex items-center gap-2 w-full ${reverseLayout ? 'flex-row-reverse' : 'flex-row'}`}>
         
         <div className="flex bg-white/5 rounded-lg p-1 gap-1">
            <button 
                onClick={onSubtract}
                className="w-10 h-8 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors active:scale-95"
            >
                <Minus size={16} />
            </button>
            <div className="w-px h-full bg-white/10" />
            <button 
                onClick={onAdd}
                className={`w-10 h-8 flex items-center justify-center rounded hover:bg-white/10 ${themeColors.highlight} hover:text-white transition-colors active:scale-95`}
            >
                <Plus size={16} />
            </button>
         </div>

         <div className="flex-1" />

         {/* Timeouts */}
         <button 
            onClick={onTimeout}
            disabled={timeouts >= 2}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all active:scale-95
                ${timeouts >= 2 
                    ? 'border-transparent text-slate-700 bg-transparent' 
                    : `border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-${colorTheme}-400`}
            `}
         >
            <div className="flex gap-0.5">
                {[1,2].map(t => (
                    <div key={t} className={`w-1.5 h-1.5 rounded-full ${t <= timeouts ? 'bg-slate-700' : `bg-${colorTheme}-500`}`} />
                ))}
            </div>
            <Hand size={14} />
         </button>

         {/* Serve Toggle */}
         <button 
            onClick={onToggleServe}
            className={`
                w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95 shadow-lg
                ${isServing 
                    ? `bg-${colorTheme}-500 border-${colorTheme}-400 text-white shadow-${colorTheme}-500/20` 
                    : 'bg-slate-800 border-white/5 text-slate-500 hover:text-white hover:border-white/20'}
            `}
         >
             <div className="w-2 h-2 rounded-full bg-current" />
         </button>

      </div>
    </div>
  );
};
