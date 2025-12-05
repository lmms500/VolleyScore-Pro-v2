

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Team, SkillType } from '../../types';
import { Swords, Shield, Target, AlertTriangle, X, User, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalVariants } from '../../utils/animations';

interface ScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  onConfirm: (playerId: string, skill: SkillType) => void;
  colorTheme: 'indigo' | 'rose';
}

export const ScoutModal: React.FC<ScoutModalProps> = ({ 
    isOpen, 
    onClose, 
    team, 
    onConfirm,
    colorTheme 
}) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const mountTimeRef = useRef<number>(0);

    // Reset state when modal opens to ensure we start at Step 1
    useEffect(() => {
        if (isOpen) {
            setSelectedPlayerId(null);
            mountTimeRef.current = Date.now();
        }
    }, [isOpen]);

    const handlePlayerSelect = (pid: string) => {
        setSelectedPlayerId(pid);
    };

    const handleSkillSelect = (skill: SkillType) => {
        if (selectedPlayerId) {
            onConfirm(selectedPlayerId, skill);
            onClose();
        }
    };
    
    // Safety check: Prevent "Ghost Clicks" from the opening tap from immediately closing the modal.
    // We ignore backdrop clicks that happen within 350ms of the modal mounting.
    const handleBackdropClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (Date.now() - mountTimeRef.current < 350) return;
        onClose();
    };

    const skills: { id: SkillType, label: string, icon: any }[] = [
        { id: 'attack', label: 'Attack', icon: Swords },
        { id: 'block', label: 'Block', icon: Shield },
        { id: 'ace', label: 'Ace', icon: Target },
        { id: 'opponent_error', label: 'Opp. Error', icon: AlertTriangle },
    ];

    const themeColors = colorTheme === 'indigo' 
        ? { text: 'text-indigo-400', bg: 'bg-indigo-500', border: 'border-indigo-500/30', hover: 'hover:border-indigo-400 hover:shadow-indigo-500/20' }
        : { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500/30', hover: 'hover:border-rose-400 hover:shadow-rose-500/20' };

    // Use Portal to escape parent stacking contexts (e.g., Transforms in Swipeable Views or Framer Motion layout animations)
    // This ensures the modal is always on top.
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    // CRITICAL: Stop propagation to prevent scoreboard underneath from registering clicks
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Backdrop */}
                    <motion.div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleBackdropClick}
                    />
                    
                    {/* Modal Content - Neo Glass */}
                    <motion.div 
                        className="relative w-full max-w-md bg-slate-900/80 dark:bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div className="flex flex-col">
                                <h3 className="font-black text-white uppercase tracking-tight text-lg leading-none">
                                    {selectedPlayerId ? 'Select Action' : 'Who Scored?'}
                                </h3>
                                <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${themeColors.text}`}>
                                    {selectedPlayerId ? 'Step 2 of 2' : 'Step 1 of 2'}
                                </span>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="p-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                            <AnimatePresence mode="wait">
                                {!selectedPlayerId ? (
                                    /* STEP 1: SELECT PLAYER */
                                    <motion.div 
                                        key="step1"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="grid grid-cols-1 gap-2"
                                    >
                                        {team.players.map(p => (
                                            <button 
                                                key={p.id}
                                                onClick={() => handlePlayerSelect(p.id)}
                                                className={`
                                                    flex items-center gap-4 p-3 rounded-2xl
                                                    bg-white/5 hover:bg-white/10 border border-white/5 
                                                    transition-all group text-left
                                                    ${themeColors.hover}
                                                `}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-sm font-bold text-white border border-white/10 shadow-inner">
                                                    {p.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-base text-slate-200 group-hover:text-white transition-colors">
                                                        {p.name}
                                                    </span>
                                                    <div className="flex gap-0.5 mt-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <div key={i} className={`w-1 h-1 rounded-full ${i < p.skillLevel ? themeColors.bg : 'bg-slate-700'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                        <button 
                                            onClick={() => handlePlayerSelect('unknown')}
                                            className="mt-2 p-3 rounded-xl border border-dashed border-white/10 text-slate-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <User size={16} />
                                            <span className="font-bold text-xs uppercase tracking-wider">Unknown / Other</span>
                                        </button>
                                    </motion.div>
                                ) : (
                                    /* STEP 2: SELECT SKILL */
                                    <motion.div 
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="grid grid-cols-2 gap-3"
                                    >
                                        {skills.map(s => (
                                            <button 
                                                key={s.id}
                                                onClick={() => handleSkillSelect(s.id)}
                                                className={`
                                                    p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all
                                                    bg-white/5 border border-white/5 text-slate-300
                                                    active:scale-95 aspect-square
                                                    hover:bg-white/10 hover:text-white ${themeColors.hover}
                                                `}
                                            >
                                                <div className={`p-3 rounded-full bg-white/5 ${themeColors.text}`}>
                                                    <s.icon size={28} strokeWidth={1.5} />
                                                </div>
                                                <span className="font-bold text-xs uppercase tracking-widest">{s.label}</span>
                                            </button>
                                        ))}
                                        <button 
                                            onClick={() => setSelectedPlayerId(null)}
                                            className="col-span-2 mt-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest py-3 hover:bg-white/5 rounded-xl transition-colors"
                                        >
                                            <ChevronLeft size={14} /> Back to Players
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};