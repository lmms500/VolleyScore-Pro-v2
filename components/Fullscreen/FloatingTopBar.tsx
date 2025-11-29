import React, { memo } from 'react';
import { Volleyball, Timer, Skull, TrendingUp, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { popRotateVariants, pulseHeartbeat, springSnappy } from '../../utils/animations';
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
  if (name.length > 10) return name.substring(0, 9) + '.';
  return name;
};

// --- SUB-COMPONENTS ---

const TimeoutDots = memo<{ 
  count: number; 
  total: number; 
  color: 'indigo' | 'rose'; 
}>(({ count, color }) => {
  const activeClass = color === 'indigo' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]';
  
  return (
    <div className="flex gap-1">
        {[1, 2].map(i => {
          const isAvailable = i > count;
          return (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isAvailable ? activeClass : 'bg-white/10'}`}
            />
          );
        })}
    </div>
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
  timeouts: number;
  onTimeout: () => void;
}>(({ name, color, isServing, onSetServer, align, isMatchPoint, isSetPoint, timeouts, onTimeout }) => {
  const { t } = useTranslation();
  const textColor = color === 'indigo' ? 'text-indigo-300' : 'text-rose-300';
  const hasBadge = isMatchPoint || isSetPoint;

  return (
    <div 
      className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'} justify-center relative min-w-[100px]`}
    >
      {/* Top Row: Name + Serve Icon */}
      <div 
        className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'} mb-0.5 cursor-pointer group`}
        onClick={(e) => { e.stopPropagation(); onSetServer(); }}
      >
        <span className={`text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors`}>
          {truncateName(name)}
        </span>
        
        {/* Serving Icon - Pulsing */}
        <AnimatePresence>
            {isServing && (
                <motion.div
                    variants={popRotateVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className={`${color === 'indigo' ? 'text-indigo-400' : 'text-rose-400'}`}
                >
                     <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <Volleyball size={12} fill="currentColor" />
                     </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Main Row: Badge OR Timeout Controls (Badge takes priority) */}
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : 'justify-start'} h-6`}>
        <AnimatePresence mode="wait">
          {hasBadge ? (
            <motion.div
              key="badge"
              initial={{ y: 5, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: -5, opacity: 0 }}
              className={`
                px-2 py-0.5 rounded-md flex items-center gap-1 shadow-lg backdrop-blur-md border border-white/10
                ${isMatchPoint 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                    : (color === 'indigo' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30')}
              `}
            >
               <span className="text-xs font-black uppercase tracking-wider leading-none whitespace-nowrap">
                 {isMatchPoint ? t('status.match_point') : t('status.set_point')}
               </span>
            </motion.div>
          ) : (
            <motion.button
                key="timeout"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={(e) => { e.stopPropagation(); onTimeout(); }}
                className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'} hover:bg-white/5 px-1.5 py-0.5 rounded transition-colors`}
            >
                <TimeoutDots count={timeouts} total={2} color={color} />
                <Timer size={10} className="text-slate-500" />
            </motion.button>
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

  let content = null;
  let key = 'timer';

  // Helper for Status Pills
  const StatusPill = ({ icon: Icon, text, colorClass, borderClass, bgClass, animateIcon }: any) => (
      <motion.div 
         layout
         className={`flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md ${borderClass} ${bgClass} shadow-lg`}
      >
           <motion.div 
             animate={animateIcon}
             transition={{ duration: 1.5, repeat: Infinity }}
           >
              <Icon size={12} className={colorClass} />
           </motion.div>
           <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${colorClass}`}>
             {text}
           </span>
      </motion.div>
  );

  if (inSuddenDeath) {
    key = 'sudden-death';
    content = <StatusPill icon={Skull} text={t('status.sudden_death')} colorClass="text-red-200" borderClass="border-red-500/30" bgClass="bg-red-900/40" animateIcon={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} />;
  } else if (isDeuce) {
    key = 'deuce';
    content = <StatusPill icon={TrendingUp} text={t('status.advantage')} colorClass="text-orange-200" borderClass="border-orange-500/30" bgClass="bg-orange-900/40" animateIcon={{ y: [-1, 1, -1] }} />;
  } else {
    content = (
      <button onClick={onToggleTimer} className="flex flex-col items-center group">
        <span className={`font-mono text-xl font-bold tabular-nums leading-none tracking-tight transition-colors ${isTimerRunning ? 'text-slate-200' : 'text-slate-500'}`}>
            {formatTime(time)}
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5 flex items-center gap-1 ${isTieBreak ? 'text-amber-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
            {isTieBreak && <Scale size={8} />}
            {isTieBreak ? 'TIE' : `SET ${currentSet}`}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center justify-center h-full relative z-10 min-w-[80px]">
      <AnimatePresence mode="popLayout" custom={key}>
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: 0.9, filter: "blur(5px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.9, filter: "blur(5px)" }}
          transition={springSnappy}
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
    <div className="fixed top-2 md:top-4 left-0 w-full z-[55] flex justify-center pointer-events-none">
      
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="
          pointer-events-auto
          relative flex items-center
          bg-slate-950/40 backdrop-blur-xl 
          border border-white/10 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)]
          px-1 py-1
        "
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6 px-3">
            
          <TeamInfoStealth 
            name={props.teamNameA} 
            color={props.colorA} 
            isServing={props.isServingLeft} 
            onSetServer={props.onSetServerA} 
            align="left"
            isMatchPoint={props.isMatchPointA}
            isSetPoint={props.isSetPointA}
            timeouts={props.timeoutsA}
            onTimeout={props.onTimeoutA}
          />

          <div className="justify-self-center px-2 md:px-4 relative border-x border-white/5 h-6 flex items-center">
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

          <TeamInfoStealth 
            name={props.teamNameB} 
            color={props.colorB} 
            isServing={props.isServingRight} 
            onSetServer={props.onSetServerB} 
            align="right"
            isMatchPoint={props.isMatchPointB}
            isSetPoint={props.isSetPointB}
            timeouts={props.timeoutsB}
            onTimeout={props.onTimeoutB}
          />

        </div>
      </motion.div>
    </div>
  );
});