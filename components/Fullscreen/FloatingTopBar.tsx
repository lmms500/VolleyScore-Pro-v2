
import React, { memo } from 'react';
import { Volleyball, Timer, Skull, TrendingUp, Scale, Hash } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup, Variants } from 'framer-motion';
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

// --- FLUID MOTION CONFIG (AAA HUD FEEL) ---

const fluidTransition = {
  layout: {
    duration: 0.35,
    ease: [0.32, 0.72, 0, 1] as const, // Custom Bezier for "Liquid Glass" feel
  },
  default: {
    type: "spring",
    stiffness: 500,
    damping: 30,
    mass: 1
  }
};

const itemAppearVariant: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.15, ease: "easeIn" }
  }
};

// --- SUB-COMPONENTS ---

const TimeoutDots = memo<{ count: number; color: 'indigo' | 'rose' }>(({ count, color }) => {
  const activeClass = color === 'indigo' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]';
  
  return (
    <div className="flex gap-1.5 mt-1.5">
        {[1, 2].map(i => {
          const isUsed = i <= count;
          return (
            <motion.div
              key={i}
              layout // Smooth position adjust
              initial={false}
              animate={{ 
                backgroundColor: isUsed ? 'rgba(255,255,255,0.2)' : (color === 'indigo' ? '#6366f1' : '#f43f5e'),
                scale: isUsed ? 1 : 1.1
              }}
              className={`w-1.5 h-1.5 rounded-full`}
            />
          );
        })}
    </div>
  );
});

const TimeoutButton = memo<{
  timeouts: number;
  onTimeout: () => void;
  color: 'indigo' | 'rose';
}>(({ timeouts, onTimeout, color }) => {
  return (
    <motion.button
      layout
      onClick={(e) => { e.stopPropagation(); onTimeout(); }}
      className={`
         flex flex-col items-center justify-center p-2 rounded-xl transition-all active:scale-95
         hover:bg-white/10 border border-transparent hover:border-white/5
         ${timeouts >= 2 ? 'opacity-40 cursor-not-allowed grayscale' : 'opacity-100 cursor-pointer'}
      `}
    >
        <div className={`p-1.5 rounded-lg ${color === 'indigo' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-rose-500/20 text-rose-300'}`}>
            <Timer size={18} />
        </div>
        <TimeoutDots count={timeouts} color={color} />
    </motion.button>
  );
});

const TeamInfoStealth = memo<{
  name: string;
  color: 'indigo' | 'rose';
  isServing: boolean;
  onSetServer: () => void;
  align: 'left' | 'right';
  isMatchPoint: boolean;
  isSetPoint: boolean;
}>(({ name, color, isServing, onSetServer, align, isMatchPoint, isSetPoint }) => {
  const { t } = useTranslation();
  const hasBadge = isMatchPoint || isSetPoint;

  // The wrapper ensures the serve icon pushes the text smoothly instead of jumping
  return (
    <motion.div 
      layout
      className={`flex flex-col ${align === 'right' ? 'items-end text-right' : 'items-start text-left'} justify-center relative min-w-0 flex-shrink`}
    >
      {/* Name + Icon Row */}
      <motion.div 
        layout
        className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'} cursor-pointer group`}
        onClick={(e) => { e.stopPropagation(); onSetServer(); }}
      >
        <motion.span 
          layout
          className={`text-[11px] font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors truncate max-w-[80px] md:max-w-[120px]`}
        >
          {name}
        </motion.span>
        
        {/* FLUID SERVE ICON WRAPPER */}
        <AnimatePresence mode="popLayout">
            {isServing && (
                <motion.div
                    key="serve-icon"
                    layout
                    initial={{ width: 0, opacity: 0, scale: 0 }}
                    animate={{ width: "auto", opacity: 1, scale: 1 }}
                    exit={{ width: 0, opacity: 0, scale: 0 }}
                    transition={{ duration: 0.3, ease: "backOut" }}
                    className={`flex items-center justify-center overflow-hidden ${color === 'indigo' ? 'text-indigo-400' : 'text-rose-400'}`}
                >
                     <motion.div 
                        animate={{ scale: [1, 1.25, 1] }} 
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="mx-0.5"
                     >
                        <Volleyball size={14} fill="currentColor" fillOpacity={0.2} />
                     </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>

      {/* Badge Row - Fluid Expansion */}
      <div className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'} overflow-visible`}>
        <AnimatePresence mode="popLayout">
          {hasBadge && (
            <motion.div
              key="badge"
              layout
              initial={{ height: 0, opacity: 0, marginTop: 0 }} 
              animate={{ height: "auto", opacity: 1, marginTop: 4 }} 
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: "circOut" }}
              className={`origin-top overflow-hidden`}
            >
                <div className={`
                    px-2 py-[2px] rounded-md flex items-center gap-1 shadow-lg backdrop-blur-md border
                    ${isMatchPoint 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                        : (color === 'indigo' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30')}
                `}>
                    <span className="text-[9px] font-black uppercase tracking-widest leading-none whitespace-nowrap block">
                        {isMatchPoint ? t('status.match_point') : t('status.set_point')}
                    </span>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
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

  // Reusable Pill Component with Layout
  const StatusPill = ({ icon: Icon, text, colorClass, borderClass, bgClass, animateIcon }: any) => (
      <motion.div 
         layout
         className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md ${borderClass} ${bgClass} shadow-lg`}
      >
           <motion.div 
             animate={animateIcon}
             transition={{ duration: 1.5, repeat: Infinity }}
             layout
           >
              <Icon size={14} className={colorClass} strokeWidth={2.5} />
           </motion.div>
           <motion.span layout className={`text-[10px] font-black uppercase tracking-widest leading-none ${colorClass} whitespace-nowrap`}>
             {text}
           </motion.span>
      </motion.div>
  );

  if (inSuddenDeath) {
    key = 'sudden-death';
    content = <StatusPill icon={Skull} text={t('status.sudden_death')} colorClass="text-red-200" borderClass="border-red-500/30" bgClass="bg-red-900/40" animateIcon={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} />;
  } else if (isDeuce) {
    key = 'deuce';
    content = <StatusPill 
        icon={TrendingUp} 
        text={t('status.deuce_advantage')} 
        colorClass="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" 
        borderClass="border-white/20" 
        bgClass="bg-white/10" 
        animateIcon={{ y: [-1, 1, -1] }} 
    />;
  } else {
    content = (
      <motion.button 
        layout
        onClick={onToggleTimer} 
        className="flex flex-col items-center group py-1 select-none min-w-[80px]"
      >
        <motion.span layout className={`font-mono text-xl font-bold tabular-nums leading-none tracking-tight transition-colors ${isTimerRunning ? 'text-white drop-shadow-md' : 'text-slate-500'}`}>
            {formatTime(time)}
        </motion.span>
        <motion.span layout className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5 ${isTieBreak ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
            {isTieBreak ? <Scale size={10} /> : <Hash size={10} />}
            {isTieBreak ? 'TIE' : `SET ${currentSet}`}
        </motion.span>
      </motion.button>
    );
  }

  return (
    <motion.div layout className="flex items-center justify-center h-full relative z-10 min-w-[60px]">
      <AnimatePresence mode="popLayout" custom={key}>
        <motion.div
          key={key}
          layout
          variants={itemAppearVariant}
          initial="hidden"
          animate="visible"
          exit="exit"
          // This ensures the container resizes smoothly when content flips
          className="will-change-transform"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
});

// --- MAIN COMPONENT ---

export const FloatingTopBar: React.FC<FloatingTopBarProps> = memo((props) => {
  const glassContainer = "bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5";

  return (
    <LayoutGroup>
        <div className="fixed top-2 md:top-6 left-0 w-full z-[55] flex justify-center pointer-events-none px-4">
        
        <motion.div 
            layout
            // The magic transition that creates the fluid glass effect
            transition={fluidTransition.layout}
            className={`
                pointer-events-auto
                w-auto max-w-[98vw]
                ${glassContainer}
                rounded-2xl
                p-2
                flex items-center justify-between gap-2 md:gap-4
                overflow-hidden
            `}
            style={{ 
                transform: "translateZ(0)", // Hardware Acceleration
            }}
        >
            {/* Left Side */}
            <motion.div layout className="flex items-center gap-2 md:gap-4 pl-2">
                <TeamInfoStealth 
                    name={props.teamNameA} 
                    color={props.colorA} 
                    isServing={props.isServingLeft} 
                    onSetServer={props.onSetServerA} 
                    align="left"
                    isMatchPoint={props.isMatchPointA}
                    isSetPoint={props.isSetPointA}
                />
                
                <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block"></div>

                <TimeoutButton 
                    timeouts={props.timeoutsA} 
                    onTimeout={props.onTimeoutA} 
                    color={props.colorA}
                />
            </motion.div>

            {/* Center Dynamic Display */}
            <motion.div 
                layout 
                className="bg-black/20 rounded-xl px-2 py-1 border border-white/5 min-w-[90px] flex justify-center"
            >
                <CenterDisplayStealth 
                    time={props.time}
                    isTimerRunning={props.isTimerRunning}
                    onToggleTimer={props.onToggleTimer}
                    currentSet={props.currentSet}
                    isTieBreak={props.isTieBreak}
                    isDeuce={props.isDeuce}
                    inSuddenDeath={props.inSuddenDeath}
                />
            </motion.div>

            {/* Right Side */}
            <motion.div layout className="flex items-center gap-2 md:gap-4 pr-2 flex-row-reverse">
                <TeamInfoStealth 
                    name={props.teamNameB} 
                    color={props.colorB} 
                    isServing={props.isServingRight} 
                    onSetServer={props.onSetServerB} 
                    align="right"
                    isMatchPoint={props.isMatchPointB}
                    isSetPoint={props.isSetPointB}
                />

                <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block"></div>

                <TimeoutButton 
                    timeouts={props.timeoutsB} 
                    onTimeout={props.onTimeoutB} 
                    color={props.colorB}
                />
            </motion.div>

        </motion.div>
        </div>
    </LayoutGroup>
  );
});
