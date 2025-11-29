import React, { memo } from 'react';
import { Volleyball, Timer, Skull, TrendingUp, Scale, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { popRotateVariants, springSnappy } from '../../utils/animations';
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

// --- SUB-COMPONENTS ---

const TimeoutDots = memo<{ 
  count: number; 
  total: number; 
  color: 'indigo' | 'rose'; 
}>(({ count, color }) => {
  const activeClass = color === 'indigo' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]';
  
  return (
    <div className="flex gap-1.5 mt-1.5">
        {[1, 2].map(i => {
          const isUsed = i <= count;
          return (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isUsed ? 'bg-white/20' : activeClass}`}
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
  align: 'left' | 'right';
}>(({ timeouts, onTimeout, color }) => {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onTimeout(); }}
      className={`
         flex flex-col items-center justify-center p-2 rounded-xl transition-all active:scale-90
         hover:bg-white/10 border border-transparent hover:border-white/5
         ${timeouts >= 2 ? 'opacity-40 cursor-not-allowed' : 'opacity-100 cursor-pointer'}
      `}
    >
        <div className={`p-1.5 rounded-lg ${color === 'indigo' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-rose-500/20 text-rose-300'}`}>
            <Timer size={18} />
        </div>
        <TimeoutDots count={timeouts} total={2} color={color} />
    </button>
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

  return (
    <div 
      className={`flex flex-col ${align === 'right' ? 'items-end text-right' : 'items-start text-left'} justify-center relative min-w-0 flex-shrink`}
    >
      {/* Top Row: Name + Serve Icon */}
      <div 
        className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'} cursor-pointer group`}
        onClick={(e) => { e.stopPropagation(); onSetServer(); }}
      >
        <span className={`text-[11px] font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors truncate max-w-[80px] md:max-w-[120px]`}>
          {name}
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
                        <Volleyball size={14} fill="currentColor" fillOpacity={0.2} />
                     </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Badge Row */}
      <div className={`h-4 mt-1 flex ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        <AnimatePresence mode="wait">
          {hasBadge && (
            <motion.div
              key="badge"
              initial={{ y: 5, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: -5, opacity: 0 }}
              className={`
                px-2 py-[2px] rounded-md flex items-center gap-1 shadow-lg backdrop-blur-md border
                ${isMatchPoint 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                    : (color === 'indigo' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30')}
              `}
            >
               <span className="text-[9px] font-black uppercase tracking-widest leading-none whitespace-nowrap">
                 {isMatchPoint ? t('status.match_point') : t('status.set_point')}
               </span>
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

  let content = null;
  let key = 'timer';

  // Helper for Status Pills
  const StatusPill = ({ icon: Icon, text, colorClass, borderClass, bgClass, animateIcon }: any) => (
      <motion.div 
         layout
         className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md ${borderClass} ${bgClass} shadow-lg`}
      >
           <motion.div 
             animate={animateIcon}
             transition={{ duration: 1.5, repeat: Infinity }}
           >
              <Icon size={14} className={colorClass} strokeWidth={2.5} />
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
      <button onClick={onToggleTimer} className="flex flex-col items-center group py-1 select-none">
        <span className={`font-mono text-xl font-bold tabular-nums leading-none tracking-tight transition-colors ${isTimerRunning ? 'text-white drop-shadow-md' : 'text-slate-500'}`}>
            {formatTime(time)}
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5 ${isTieBreak ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
            {isTieBreak ? <Scale size={10} /> : <Hash size={10} />}
            {isTieBreak ? 'TIE' : `SET ${currentSet}`}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center justify-center h-full relative z-10 min-w-[60px]">
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
  const glassContainer = "bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40";

  return (
    <div className="fixed top-2 md:top-6 left-0 w-full z-[55] flex justify-center pointer-events-none px-4">
      
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          pointer-events-auto
          w-auto max-w-[95vw]
          ${glassContainer}
          rounded-2xl
          py-2 px-6
        `}
      >
        <div className="flex items-center justify-between gap-4 md:gap-8">
            
          <TeamInfoStealth 
            name={props.teamNameA} 
            color={props.colorA} 
            isServing={props.isServingLeft} 
            onSetServer={props.onSetServerA} 
            align="left"
            isMatchPoint={props.isMatchPointA}
            isSetPoint={props.isSetPointA}
          />

          <div className="border-r border-white/5 pr-3 md:pr-4 py-1">
            <TimeoutButton 
                timeouts={props.timeoutsA} 
                onTimeout={props.onTimeoutA} 
                color={props.colorA}
                align="left"
            />
          </div>

          <div className="flex items-center justify-center px-1">
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

          <div className="border-l border-white/5 pl-3 md:pl-4 py-1">
            <TimeoutButton 
                timeouts={props.timeoutsB} 
                onTimeout={props.onTimeoutB} 
                color={props.colorB}
                align="right"
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
          />

        </div>
      </motion.div>
    </div>
  );
});