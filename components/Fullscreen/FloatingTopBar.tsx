import React, { memo } from 'react';
import { Volleyball, Timer, Skull, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { popRotateVariants, pulseHeartbeat, springHeavy, springSnappy } from '../../utils/animations';
import { useTranslation } from '../../contexts/LanguageContext';

interface FloatingTopBarProps {
  time: number;
  currentSet: number;
  isTieBreak: boolean;
  onToggleTimer: () => void;
  isTimerRunning: boolean;
  teamNameA: string;
  teamNameB: string;
  colorA: 'indigo' | 'rose';
  colorB: 'indigo' | 'rose';
  isServingLeft: boolean;
  isServingRight: boolean;
  onSetServerA: () => void;
  onSetServerB: () => void;
  timeoutsA: number;
  timeoutsB: number;
  onTimeoutA: () => void;
  onTimeoutB: () => void;
  isMatchPointA: boolean;
  isSetPointA: boolean;
  isMatchPointB: boolean;
  isSetPointB: boolean;
  isDeuce: boolean;
  inSuddenDeath: boolean;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const truncateName = (name: string) => {
  if (name.length > 12) return name.substring(0, 11) + '..';
  return name;
};

// --- SUB-COMPONENTS ---

const TimeoutIndicator = memo<{ 
  count: number; 
  total: number; 
  color: 'indigo' | 'rose'; 
  onTimeout: () => void;
  align: 'left' | 'right';
}>(({ count, total, color, onTimeout, align }) => {
  const isExhausted = count >= 2;
  const activeColor = color === 'indigo' ? 'bg-indigo-500 shadow-indigo-500/50' : 'bg-rose-500 shadow-rose-500/50';

  return (
    <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={(e) => { e.stopPropagation(); if (!isExhausted) onTimeout(); }}
        disabled={isExhausted}
        className={`
          flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border transition-colors duration-300
          ${isExhausted 
            ? 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed' 
            : 'bg-white/10 hover:bg-white/20 border-white/10 text-white shadow-lg backdrop-blur-md'}
        `}
      >
        <Timer size={16} />
      </motion.button>

      <div className="flex flex-col gap-1">
        {[1, 2].map(i => {
          const isAvailable = i > count;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{
                scale: isAvailable ? 1 : 0.8,
                opacity: isAvailable ? 1 : 0.3,
                backgroundColor: isAvailable ? 'var(--dot-color)' : '#334155'
              }}
              style={{ '--dot-color': isAvailable ? (color === 'indigo' ? '#6366f1' : '#f43f5e') : '' } as any}
              className={`
                w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]
                ${isAvailable ? activeColor : ''}
              `}
            />
          );
        })}
      </div>
    </div>
  );
});

const TeamInfo = memo<{
  name: string;
  color: 'indigo' | 'rose';
  isServing: boolean;
  onSetServer: () => void;
  align: 'left' | 'right';
  isMatchPoint: boolean;
  isSetPoint: boolean;
}>(({ name, color, isServing, onSetServer, align, isMatchPoint, isSetPoint }) => {
  const textColor = color === 'indigo' ? 'text-indigo-400' : 'text-rose-500 saturate-150 brightness-110';
  const glowShadow = color === 'indigo' ? 'drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]';
  const hasBadge = isMatchPoint || isSetPoint;
  
  return (
    <div 
      className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'} justify-center relative min-w-[120px]`}
      onClick={(e) => { e.stopPropagation(); onSetServer(); }}
    >
      {/* Name & Serve Icon Row */}
      <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'} mb-1 cursor-pointer group`}>
        
        {/* Serving Icon */}
        <div className="w-5 h-5 flex items-center justify-center">
            <AnimatePresence>
                {isServing && (
                    <motion.div
                        variants={popRotateVariants}
                        initial="hidden"
                        animate="animate"
                        exit="hidden"
                        className={color === 'indigo' ? 'text-indigo-500' : 'text-rose-500'}
                    >
                         <Volleyball size={18} fill="currentColor" className="opacity-100" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <motion.span 
          animate={{ opacity: hasBadge ? 0.6 : 1, scale: hasBadge ? 0.95 : 1 }}
          className={`text-base md:text-xl font-black uppercase tracking-widest whitespace-nowrap leading-none transition-all group-hover:brightness-125 ${textColor} ${isServing ? glowShadow : ''}`}
        >
          {truncateName(name)}
        </motion.span>
      </div>

      {/* Badges Container - Absolute/Fixed height to prevent jumping */}
      <div className={`h-4 flex items-center ${align === 'right' ? 'justify-end' : 'justify-start'} overflow-visible`}>
        <AnimatePresence mode="wait">
          {isMatchPoint && (
            <motion.div
              initial={{ y: -10, opacity: 0, scale: 0.8 }} 
              animate={{ y: 0, opacity: 1, scale: 1 }} 
              exit={{ y: 10, opacity: 0, scale: 0.8 }}
              className="px-2 py-[1px] rounded bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
            >
               <motion.span 
                 variants={pulseHeartbeat}
                 animate="pulse"
                 className="text-[9px] font-black text-black uppercase tracking-wider leading-none block"
               >
                 MATCH POINT
               </motion.span>
            </motion.div>
          )}
          {!isMatchPoint && isSetPoint && (
            <motion.div
              initial={{ y: -10, opacity: 0, scale: 0.8 }} 
              animate={{ y: 0, opacity: 1, scale: 1 }} 
              exit={{ y: 10, opacity: 0, scale: 0.8 }}
              className={`px-2 py-[1px] rounded ${color === 'indigo' ? 'bg-indigo-600' : 'bg-rose-600'} shadow-lg`}
            >
               <motion.span 
                  variants={pulseHeartbeat}
                  animate="pulse"
                  className="text-[9px] font-black text-white uppercase tracking-wider leading-none block"
               >
                  SET POINT
               </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

const CenterDisplay = memo<{
  time: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  currentSet: number;
  isTieBreak: boolean;
  inSuddenDeath: boolean;
  isDeuce: boolean;
}>(({ time, isTimerRunning, onToggleTimer, currentSet, isTieBreak, inSuddenDeath, isDeuce }) => {
  
  const { t } = useTranslation();

  let content = null;
  let key = 'timer';

  if (inSuddenDeath) {
    key = 'sudden-death';
    content = (
      <div className="flex flex-col items-center">
        <motion.div 
           layout
           className="bg-gradient-to-br from-red-900/60 to-red-600/10 border border-red-500/30 rounded-xl px-4 py-1.5 shadow-[0_0_25px_rgba(244,63,94,0.4)] backdrop-blur-md flex items-center gap-2"
        >
           <Skull size={18} className="text-red-400" />
           <span className="text-xs font-black text-red-100 uppercase tracking-widest leading-none">
             {t('status.sudden_death')}
           </span>
        </motion.div>
      </div>
    );
  } else if (isDeuce) {
    key = 'deuce';
    content = (
      <div className="flex flex-col items-center">
        <motion.div 
           layout
           className="bg-gradient-to-br from-orange-900/60 to-orange-600/10 border border-orange-500/30 rounded-xl px-4 py-1.5 shadow-[0_0_25px_rgba(249,115,22,0.4)] backdrop-blur-md flex items-center gap-2"
        >
           <TrendingUp size={18} className="text-orange-400" />
           <span className="text-xs font-black text-orange-100 uppercase tracking-widest leading-none">
             {t('status.advantage')}
           </span>
        </motion.div>
      </div>
    );
  } else {
    content = (
      <button 
        onClick={onToggleTimer}
        className="flex flex-col items-center justify-center group outline-none"
      >
        <span className={`font-mono text-5xl md:text-6xl font-black tabular-nums leading-none tracking-tighter drop-shadow-2xl transition-colors ${isTimerRunning ? 'text-white' : 'text-slate-500'}`}>
            {formatTime(time)}
        </span>
        <span className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mt-1 ${isTieBreak ? 'text-amber-400' : 'text-slate-400 group-hover:text-indigo-300'}`}>
            {isTieBreak ? t('game.tieBreak') : `${t('history.setLabel', { setNumber: currentSet })}`}
        </span>
      </button>
    );
  }

  return (
    <div className="min-w-[140px] md:min-w-[180px] flex items-center justify-center h-full relative z-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={springSnappy}
          className="w-full flex justify-center"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

// --- MAIN COMPONENT ---

export const FloatingTopBar: React.FC<FloatingTopBarProps> = memo((props) => {
  return (
    <div className="fixed top-0 left-0 w-full z-[55] flex justify-center pt-[max(env(safe-area-inset-top),1rem)] pointer-events-none">
      
      {/* Dynamic Background Container */}
      <motion.div 
        layout
        transition={springHeavy}
        className="
          pointer-events-auto
          relative flex items-stretch overflow-hidden
          bg-[#0f172a]/80 backdrop-blur-2xl 
          border border-white/10 rounded-[2rem] shadow-2xl shadow-black/50
          mx-4
        "
      >
        {/* Gloss Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        {/* 
            GRID LAYOUT SYSTEM 
            1fr - Left Team (Align Start)
            auto - Center Timer (Align Center)
            1fr - Right Team (Align End)
        */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-3 md:px-8 md:py-4">
            
          {/* LEFT COLUMN: TEAM A */}
          <div className="justify-self-start flex items-center gap-4 md:gap-6">
            <TimeoutIndicator 
              count={props.timeoutsA} 
              total={2} 
              color={props.colorA} 
              onTimeout={props.onTimeoutA} 
              align="left" 
            />
            <TeamInfo 
              name={props.teamNameA} 
              color={props.colorA} 
              isServing={props.isServingLeft} 
              onSetServer={props.onSetServerA} 
              align="left"
              isMatchPoint={props.isMatchPointA}
              isSetPoint={props.isSetPointA}
            />
          </div>

          {/* CENTER COLUMN: TIMER / STATUS */}
          <div className="justify-self-center border-x border-white/5 px-4 md:px-8 relative">
            {/* Subtle glow behind timer */}
            <div className="absolute inset-0 bg-white/[0.02] blur-md -z-10" />
            <CenterDisplay 
              time={props.time}
              isTimerRunning={props.isTimerRunning}
              onToggleTimer={props.onToggleTimer}
              currentSet={props.currentSet}
              isTieBreak={props.isTieBreak}
              isDeuce={props.isDeuce}
              inSuddenDeath={props.inSuddenDeath}
            />
          </div>

          {/* RIGHT COLUMN: TEAM B */}
          <div className="justify-self-end flex items-center gap-4 md:gap-6">
            <TeamInfo 
              name={props.teamNameB} 
              color={props.colorB} 
              isServing={props.isServingRight} 
              onSetServer={props.onSetServerB} 
              align="right"
              isMatchPoint={props.isMatchPointB}
              isSetPoint={props.isSetPointB}
            />
             <TimeoutIndicator 
              count={props.timeoutsB} 
              total={2} 
              color={props.colorB} 
              onTimeout={props.onTimeoutB} 
              align="right" 
            />
          </div>

        </div>
      </motion.div>
    </div>
  );
});