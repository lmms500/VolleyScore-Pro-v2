

import React, { memo } from 'react';
import { Volleyball, Timer, Skull, TrendingUp, Scale, Hash } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup, Variants } from 'framer-motion';
import { useTranslation } from '../../contexts/LanguageContext';
import { resolveTheme } from '../../utils/colors';
import { TeamColor } from '../../types';

interface FloatingTopBarProps {
  time: number;
  currentSet: number;
  isTieBreak: boolean;
  onToggleTimer: () => void;
  isTimerRunning: boolean;
  teamNameA: string;
  teamNameB: string;
  colorA: TeamColor;
  colorB: TeamColor;
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

// --- ANIMATION CONFIG ---

const barTransition = {
  layout: { duration: 0.4, ease: [0.3, 1.2, 0.2, 1] as [number, number, number, number] } // Bouncy layout adjustment
};

const textSwapVariants: Variants = {
  initial: { y: 10, opacity: 0, filter: 'blur(2px)' },
  animate: { 
    y: 0, 
    opacity: 1, 
    filter: 'blur(0px)',
    transition: { type: "spring", stiffness: 500, damping: 30 } 
  },
  exit: { 
    y: -10, 
    opacity: 0, 
    filter: 'blur(2px)',
    transition: { duration: 0.15 } 
  }
};

const serveIconVariants: Variants = {
  initial: { scale: 0, opacity: 0, rotate: -180 },
  animate: { 
    scale: 1, 
    opacity: 1, 
    rotate: 0,
    transition: { type: "spring", stiffness: 400, damping: 20 }
  },
  exit: { 
    scale: 0, 
    opacity: 0, 
    rotate: 180, 
    transition: { duration: 0.2 } 
  }
};

const badgeVariants: Variants = {
  initial: { opacity: 0, scale: 0.8, y: -2 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 500, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    y: -2,
    transition: { duration: 0.15 } 
  }
};

// --- SUB-COMPONENTS ---

const TimeoutDots = memo<{ count: number; colorTheme: any }>(({ count, colorTheme }) => (
  <div className="flex gap-1 justify-center">
    {[1, 2].map(i => {
      const isUsed = i <= count;
      return (
        <motion.div
          key={i}
          layout
          className={`
            w-1 h-1 rounded-full
            ${isUsed ? 'bg-white/20' : `${colorTheme.halo} ${colorTheme.glow}`}
          `}
        />
      );
    })}
  </div>
));

const TimeoutButton = memo<{
  timeouts: number;
  onTimeout: () => void;
  color: TeamColor;
}>(({ timeouts, onTimeout, color }) => {
    const theme = resolveTheme(color);
    return (
      <motion.button
        layout
        whileTap={{ scale: 0.92 }}
        onClick={(e) => { e.stopPropagation(); onTimeout(); }}
        className={`
           flex flex-col items-center justify-center p-1 rounded-lg
           hover:bg-white/10 border border-transparent hover:border-white/5
           ${timeouts >= 2 ? 'opacity-40 cursor-not-allowed grayscale' : 'opacity-100 cursor-pointer'}
           w-8 h-10 flex-shrink-0 transition-colors gap-1
        `}
      >
        <div className={`p-1 rounded-md ${theme.bg} ${theme.text}`}>
          <Timer size={14} />
        </div>
        <TimeoutDots count={timeouts} colorTheme={theme} />
      </motion.button>
    );
});

const TeamInfoStealth = memo<{
  name: string;
  color: TeamColor;
  isServing: boolean;
  onSetServer: () => void;
  align: 'left' | 'right';
  isMatchPoint: boolean;
  isSetPoint: boolean;
}>(({ name, color, isServing, onSetServer, align, isMatchPoint, isSetPoint }) => {
  const { t } = useTranslation();
  const theme = resolveTheme(color);
  const hasBadge = isMatchPoint || isSetPoint;

  return (
    <div className={`flex flex-col items-center justify-center relative min-w-0 flex-1 h-full py-0.5`}>
      {/* Name Row */}
      <div 
        className={`flex items-center gap-1.5 cursor-pointer group mb-0.5 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}
        onClick={(e) => { e.stopPropagation(); onSetServer(); }}
      >
        <div className="relative overflow-hidden text-center">
             <AnimatePresence mode="popLayout" initial={false}>
                <motion.span 
                    key={name}
                    variants={textSwapVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={`text-xs md:text-sm font-black uppercase tracking-wider text-slate-200 group-hover:text-white transition-colors truncate block max-w-[100px] md:max-w-[140px] leading-tight`}
                >
                  {name}
                </motion.span>
             </AnimatePresence>
        </div>
        
        {/* Serve Icon */}
        <AnimatePresence>
            {isServing && (
                <motion.div
                    key="serve-icon"
                    variants={serveIconVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={`${theme.text}`}
                >
                    <Volleyball size={12} fill="currentColor" fillOpacity={0.3} />
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Micro-Badge for Set/Match Point */}
      <div className={`h-4 flex items-center`}>
        <AnimatePresence>
          {hasBadge && (
            <motion.div
              key="badge"
              variants={badgeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
                <div className={`
                    px-2 py-[2px] rounded-full flex items-center gap-1 shadow-md backdrop-blur-md border border-white/10
                    ${isMatchPoint 
                        ? 'bg-amber-500 text-slate-900 border-amber-300 shadow-amber-500/20' 
                        : `${theme.halo} text-white border-white/20`}
                `}>
                    <motion.div
                        animate={isMatchPoint ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1 }}
                    >
                         {isMatchPoint ? <Skull size={8} strokeWidth={2.5} /> : <TrendingUp size={8} strokeWidth={2.5} />}
                    </motion.div>
                    <span className="text-[8px] font-black uppercase tracking-widest leading-none whitespace-nowrap">
                        {isMatchPoint ? t('status.match_point') : t('status.set_point')}
                    </span>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

const CenterDisplayStealth = memo<{
  time: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  currentSet: number;
  isTieBreak: boolean;
  inSuddenDeath: boolean;
  isDeuce: boolean;
}>(({ time, isTimerRunning, onToggleTimer, currentSet, isTieBreak, inSuddenDeath, isDeuce }) => {
  const { t } = useTranslation();

  let key = 'timer';
  let content = null;

  const StatusPill = ({ icon: Icon, text, colorClass, borderClass, bgClass, animateIcon }: any) => (
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border backdrop-blur-md ${borderClass} ${bgClass} shadow-lg w-full justify-center h-full`}>
           <motion.div 
             animate={animateIcon}
             transition={{ duration: 1.5, repeat: Infinity }}
             className="flex-shrink-0"
           >
              <Icon size={12} className={colorClass} strokeWidth={3} />
           </motion.div>
           <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-tight leading-none ${colorClass} text-center`}>
             {text}
           </span>
      </div>
  );

  if (inSuddenDeath) {
    key = 'sudden-death';
    content = <StatusPill icon={Skull} text={t('status.sudden_death')} colorClass="text-red-200" borderClass="border-red-500/30" bgClass="bg-red-900/60" animateIcon={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }} />;
  } else if (isDeuce) {
    key = 'deuce';
    content = <StatusPill 
        icon={TrendingUp} 
        text={t('status.deuce_advantage')} 
        colorClass="text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" 
        borderClass="border-cyan-500/30" 
        bgClass="bg-cyan-900/40" 
        animateIcon={{ y: [-2, 2, -2] }} 
    />;
  } else {
    content = (
      <button 
        onClick={onToggleTimer} 
        className="flex flex-col items-center justify-center group w-full h-full"
      >
        <motion.span 
            layout
            className={`font-mono text-xl font-bold tabular-nums leading-none tracking-tight transition-all duration-300 ${isTimerRunning ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-slate-500'}`}
        >
            {formatTime(time)}
        </motion.span>
        <motion.span 
            layout
            className={`text-[8px] font-bold uppercase tracking-[0.2em] mt-0.5 flex items-center gap-1 ${isTieBreak ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`}
        >
            {isTieBreak ? <Scale size={8} /> : <Hash size={8} />}
            {isTieBreak ? 'TIE BREAK' : `SET ${currentSet}`}
        </motion.span>
      </button>
    );
  }

  return (
    <div className="flex items-center justify-center h-full w-full relative">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: "circOut" }}
          className="w-full flex justify-center h-full"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

// --- MAIN COMPONENT ---

export const FloatingTopBar: React.FC<FloatingTopBarProps> = memo((props) => {
  const glassContainer = "bg-slate-950/80 backdrop-blur-2xl border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ring-1 ring-white/5";

  return (
    <div className="fixed top-2 md:top-3 left-0 w-full z-[55] flex justify-center pointer-events-none px-2 md:px-6">
        <LayoutGroup>
            <motion.div 
                layout
                transition={barTransition.layout}
                className={`
                    pointer-events-auto
                    w-full max-w-4xl
                    ${glassContainer}
                    rounded-2xl
                    px-3 py-1
                    flex items-center justify-between gap-1 md:gap-2
                    min-h-[56px] 
                    relative
                    overflow-hidden
                `}
            >
                {/* Background Ambient Glow (Optional subtle effect) */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-20 pointer-events-none" />

                {/* Left Side */}
                <TeamInfoStealth 
                    name={props.teamNameA} 
                    color={props.colorA} 
                    isServing={props.isServingLeft} 
                    onSetServer={props.onSetServerA} 
                    align="left"
                    isMatchPoint={props.isMatchPointA}
                    isSetPoint={props.isSetPointA}
                />
                
                {/* Divider & Timeout A */}
                <div className="flex items-center gap-1 shrink-0">
                    <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
                    <div className="hidden sm:block">
                        <TimeoutButton 
                            timeouts={props.timeoutsA} 
                            onTimeout={props.onTimeoutA} 
                            color={props.colorA}
                        />
                    </div>
                </div>

                {/* Center Dynamic Display */}
                <div className="shrink-0 z-10 mx-0.5">
                    <div className="bg-black/40 rounded-xl px-1 py-1 border border-white/5 w-[110px] h-[40px] flex justify-center items-center shadow-inner">
                        <CenterDisplayStealth 
                            time={props.time}
                            isTimerRunning={props.isTimerRunning}
                            onToggleTimer={props.onToggleTimer}
                            currentSet={props.currentSet}
                            isTieBreak={props.isTieBreak}
                            isDeuce={props.isDeuce}
                            inSuddenDeath={props.inSuddenDeath}
                        />
                    </div>
                </div>

                {/* Timeout B & Divider */}
                <div className="flex items-center gap-1 shrink-0">
                     <div className="hidden sm:block">
                        <TimeoutButton 
                            timeouts={props.timeoutsB} 
                            onTimeout={props.onTimeoutB} 
                            color={props.colorB}
                        />
                    </div>
                    <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
                </div>

                {/* Right Side */}
                <TeamInfoStealth 
                    name={props.teamNameB} 
                    color={props.colorB} 
                    isServing={props.isServingRight} 
                    onSetServer={props.onSetServerB} 
                    align="right"
                    isMatchPoint={props.isMatchPointB}
                    isSetPoint={props.isSetPointB}
                />

            </motion.div>
        </LayoutGroup>
    </div>
  );
});