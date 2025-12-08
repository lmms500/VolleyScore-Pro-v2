import React, { memo } from 'react';
import { RotateCcw, ArrowLeftRight, Settings, Users, Undo2, Maximize2, History, Mic } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

interface ControlsProps {
  onUndo: () => void;
  canUndo: boolean;
  onSwap: () => void;
  onSettings: () => void;
  onRoster: () => void;
  onHistory: () => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
  onToggleVoice: () => void;
  isVoiceListening: boolean;
  hasVoicePermission: boolean;
}

const ControlButton = ({ onClick, disabled, icon: Icon, active, className }: any) => (
    <motion.button 
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.08 }}
        onClick={onClick} 
        disabled={disabled}
        className={`
            relative group p-3 rounded-2xl flex items-center justify-center transition-all duration-300
            ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer'}
            ${active 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'}
            ${className}
        `}
    >
        <Icon size={20} strokeWidth={1.5} />
    </motion.button>
);

const Divider = () => (
    <div className="w-px h-5 bg-black/5 dark:bg-white/10 mx-1"></div>
);

export const Controls: React.FC<ControlsProps> = memo(({ 
    onUndo, 
    canUndo, 
    onSwap, 
    onSettings, 
    onRoster, 
    onHistory, 
    onReset, 
    onToggleFullscreen, 
    onToggleVoice, 
    isVoiceListening, 
    hasVoicePermission
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-auto max-w-[95vw] animate-in fade-in slide-in-from-bottom-4 duration-500 pb-safe">
      <div className="
        flex items-center gap-1 px-2 py-2 
        bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl 
        border border-white/20 dark:border-white/10 
        rounded-[2.5rem] shadow-2xl shadow-black/10 dark:shadow-black/40 
        ring-1 ring-black/5 dark:ring-white/5
      ">
        
        {/* GAME ACTIONS */}
        <ControlButton onClick={onUndo} disabled={!canUndo} icon={Undo2} />
        <ControlButton onClick={onSwap} icon={ArrowLeftRight} />

        <Divider />

        {/* MANAGEMENT & TOOLS */}
        <ControlButton onClick={onRoster} icon={Users} className="text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10" />
        <ControlButton onClick={onHistory} icon={History} className="text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10" />
        <ControlButton 
            onClick={onToggleVoice} 
            icon={Mic} 
            active={isVoiceListening}
            disabled={!hasVoicePermission}
            className={!isVoiceListening ? "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10" : ''} 
        />

        <Divider />

        {/* SYSTEM */}
        <ControlButton onClick={onSettings} icon={Settings} />
        <ControlButton onClick={onToggleFullscreen} icon={Maximize2} />
        <ControlButton onClick={onReset} icon={RotateCcw} className="text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10" />

      </div>
    </div>
  );
});
