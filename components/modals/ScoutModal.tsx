import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Team, SkillType } from '../../types';
import { Swords, Shield, Target, AlertTriangle, X, User, ChevronLeft, GripHorizontal } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface ScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  onConfirm: (playerId: string, skill: SkillType) => void;
  colorTheme: 'indigo' | 'rose';
}

// Spring configuration for silky smooth movement
const springTransition = {
    type: "spring" as const,
    damping: 30,
    stiffness: 400
};

export const ScoutModal: React.FC<ScoutModalProps> = ({ 
    isOpen, 
    onClose, 
    team, 
    onConfirm,
    colorTheme 
}) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedPlayerId(null);
        }
    }, [isOpen]);

    const handlePlayerSelect = (pid: string) => {
        setSelectedPlayerId(pid);
    };

    const handleSkillSelect = (skill: SkillType) => {
        if (selectedPlayerId) {
            onConfirm(selectedPlayerId, skill);
            // We rely on parent to close, but we can trigger it visually immediately
            onClose();
        }
    };

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
        }
    };

    const skills: { id: SkillType, label: string, icon: any, color: string }[] = [
        { id: 'attack', label: 'Attack / Kill', icon: Swords, color: 'text-indigo-400' },
        { id: 'block', label: 'Block', icon: Shield, color: 'text-emerald-400' },
        { id: 'ace', label: 'Service Ace', icon: Target, color: 'text-amber-400' },
        { id: 'opponent_error', label: 'Opponent Error', icon: AlertTriangle, color: 'text-rose-400' },
    ];

    const themeColors = colorTheme === 'indigo' 
        ? { text: 'text-indigo-400', bg: 'bg-indigo-500', border: 'border-indigo-500/30' }
        : { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500/30' };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div 
                    className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center items-center sm:p-4"
                    // Stop propagation to prevent scoreboard clicks
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Backdrop */}
                    <motion.div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    
                    {/* Bottom Sheet Container */}
                    <motion.div 
                        ref={containerRef}
                        className="
                            relative w-full max-w-md 
                            bg-slate-900/95 backdrop-blur-2xl 
                            border-t sm:border border-white/10 
                            rounded-t-[2rem] sm:rounded-[2rem] 
                            shadow-2xl overflow-hidden
                            flex flex-col max-h-[85vh]
                        "
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={springTransition}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        onDragEnd={handleDragEnd}
                    >
                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none">
                            <div className="w-12 h-1.5 rounded-full bg-white/20" />
                        </div>

                        {/* Header */}
                        <div className="px-6 pb-2 pt-2 flex justify-between items-center z-10">
                            <div className="flex flex-col">
                                <h3 className="font-bold text-white text-lg leading-tight">
                                    {selectedPlayerId ? 'Select Skill' : 'Identify Player'}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${!selectedPlayerId ? themeColors.bg : 'bg-slate-600'}`} />
                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedPlayerId ? themeColors.bg : 'bg-slate-600'}`} />
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area - Slider */}
                        <div className="relative overflow-hidden w-full flex-1">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {!selectedPlayerId ? (
                                    /* STEP 1: PLAYERS */
                                    <motion.div 
                                        key="step1"
                                        className="p-4 pt-2 pb-8 grid grid-cols-2 gap-3 overflow-y-auto max-h-[60vh] custom-scrollbar"
                                        initial={{ x: "-100%", opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: "-20%", opacity: 0 }}
                                        transition={springTransition}
                                    >
                                        {team.players.map(p => (
                                            <button 
                                                key={p.id}
                                                onClick={() => handlePlayerSelect(p.id)}
                                                className={`
                                                    relative group overflow-hidden
                                                    flex flex-col items-center justify-center gap-2 p-4 rounded-2xl
                                                    bg-white/5 active:scale-95 transition-all
                                                    border border-white/5 hover:border-white/20 hover:bg-white/10
                                                `}
                                            >
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-lg font-bold text-white shadow-inner">
                                                    {p.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-sm text-slate-200 text-center line-clamp-1 w-full px-1">
                                                    {p.name}
                                                </span>
                                                {/* Skill dots */}
                                                <div className="flex gap-0.5 opacity-50">
                                                    {[...Array(5)].map((_, i) => (
                                                        <div key={i} className={`w-1 h-1 rounded-full ${i < p.skillLevel ? themeColors.bg : 'bg-slate-700'}`} />
                                                    ))}
                                                </div>
                                            </button>
                                        ))}
                                        
                                        {/* Unknown Player Option */}
                                        <button 
                                            onClick={() => handlePlayerSelect('unknown')}
                                            className="
                                                col-span-2 flex items-center justify-center gap-2 p-3 mt-1 rounded-xl 
                                                border border-dashed border-white/10 text-slate-500 
                                                hover:text-white hover:border-white/30 hover:bg-white/5 transition-all
                                            "
                                        >
                                            <User size={16} />
                                            <span className="font-bold text-xs uppercase tracking-wider">Unknown Player</span>
                                        </button>
                                    </motion.div>
                                ) : (
                                    /* STEP 2: SKILLS */
                                    <motion.div 
                                        key="step2"
                                        className="p-4 pt-2 pb-8 flex flex-col h-full"
                                        initial={{ x: "100%", opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: "20%", opacity: 0 }}
                                        transition={springTransition}
                                    >
                                        <div className="grid grid-cols-2 gap-3 mb-auto">
                                            {skills.map(s => (
                                                <button 
                                                    key={s.id}
                                                    onClick={() => handleSkillSelect(s.id)}
                                                    className={`
                                                        relative overflow-hidden group
                                                        aspect-square rounded-3xl flex flex-col items-center justify-center gap-3
                                                        bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20
                                                        active:scale-95 transition-all
                                                    `}
                                                >
                                                    <div className={`
                                                        p-4 rounded-full bg-white/5 shadow-inner transition-colors
                                                        ${s.color} group-hover:bg-white/10
                                                    `}>
                                                        <s.icon size={32} strokeWidth={1.5} />
                                                    </div>
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${s.color}`}>
                                                        {s.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        <button 
                                            onClick={() => setSelectedPlayerId(null)}
                                            className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest py-4 hover:bg-white/5 rounded-xl transition-colors"
                                        >
                                            <ChevronLeft size={16} /> Change Player
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
