import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Team, SkillType, TeamColor } from '../../types';
import { Swords, Shield, Target, AlertTriangle, X, User, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence, PanInfo, useDragControls, Transition } from 'framer-motion';
import { resolveTheme } from '../../utils/colors';

interface ScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  onConfirm: (playerId: string, skill: SkillType) => void;
  colorTheme: TeamColor;
}

// Premium "Heavy" Spring for the sheet
const sheetTransition: Transition = {
    type: "spring",
    damping: 28,
    stiffness: 300,
    mass: 0.8
};

// Extremely snappy spring for internal elements to reduce perceived delay
const contentTransition: Transition = {
    type: "spring",
    damping: 35,
    stiffness: 600, // Increased stiffness for faster snap
    mass: 1
};

export const ScoutModal: React.FC<ScoutModalProps> = ({ 
    isOpen, 
    onClose, 
    team, 
    onConfirm,
    colorTheme 
}) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [isReadyToClose, setIsReadyToClose] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedPlayerId(null);
            // Safety: Do not allow closing via backdrop for the first 300ms.
            // This absorbs "ghost clicks" from the trigger button if they propagate.
            const timer = setTimeout(() => setIsReadyToClose(true), 300);
            return () => {
                clearTimeout(timer);
                setIsReadyToClose(false);
            };
        }
    }, [isOpen]);

    const handleBackdropClick = () => {
        if (isReadyToClose) {
            onClose();
        }
    };

    const handlePlayerSelect = (pid: string) => {
        setSelectedPlayerId(pid);
    };

    const handleSkillSelect = (skill: SkillType) => {
        if (selectedPlayerId) {
            onConfirm(selectedPlayerId, skill);
            onClose();
        }
    };

    const handleDragEnd = (_: any, info: PanInfo) => {
        // Threshold to close: Dragged down 100px OR flicked down fast
        if (info.offset.y > 100 || info.velocity.y > 300) {
            onClose();
        }
    };

    const skills: { id: SkillType, label: string, icon: any }[] = [
        { id: 'attack', label: 'Kill / Attack', icon: Swords },
        { id: 'block', label: 'Block', icon: Shield },
        { id: 'ace', label: 'Ace', icon: Target },
        { id: 'opponent_error', label: 'Opp. Error', icon: AlertTriangle },
    ];

    // Dynamic Theme Resolution
    const theme = resolveTheme(colorTheme);

    // Sort players: Fixed players first, then alphabetical
    const sortedPlayers = [...team.players].sort((a, b) => {
        if (a.isFixed === b.isFixed) return a.name.localeCompare(b.name);
        return a.isFixed ? -1 : 1;
    });

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div 
                    className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center items-center isolate"
                >
                    {/* Backdrop */}
                    <motion.div 
                        className="absolute inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-md z-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={handleBackdropClick}
                    />
                    
                    {/* Bottom Sheet Container */}
                    <motion.div 
                        ref={containerRef}
                        className="
                            relative z-10 w-full max-w-md 
                            bg-[#f8fafc] dark:bg-[#0f172a]
                            border-t border-white/20 dark:border-white/10
                            rounded-t-[2.5rem] sm:rounded-[2.5rem] 
                            shadow-2xl overflow-hidden
                            flex flex-col
                            pb-safe-bottom ring-1 ring-white/10
                            min-h-[50vh] max-h-[90vh]
                        "
                        style={{
                            boxShadow: `0 -20px 60px -20px ${colorTheme === 'slate' ? 'rgba(0,0,0,0.5)' : theme.text.replace('text-', 'rgba(').replace('-600', ',0.2)')}`
                        }}
                        initial={{ y: "100%" }} 
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={sheetTransition}
                        drag="y"
                        dragControls={dragControls}
                        dragListener={false} 
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0.05, bottom: 0.6 }}
                        dragSnapToOrigin
                        onDragEnd={handleDragEnd}
                    >
                        {/* Drag Handle Area (Active Drag Zone) */}
                        <div 
                            className="w-full flex justify-center pt-5 pb-3 cursor-grab active:cursor-grabbing touch-none z-20 bg-[#f8fafc] dark:bg-[#0f172a]"
                            onPointerDown={(e) => dragControls.start(e)}
                            style={{ touchAction: 'none' }}
                        >
                            <div className="w-16 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 pointer-events-none" />
                        </div>

                        {/* Header (Active Drag Zone) */}
                        <div 
                            className="px-8 pb-4 pt-1 flex justify-between items-end z-10 border-b border-slate-200 dark:border-white/5 cursor-grab active:cursor-grabbing bg-[#f8fafc] dark:bg-[#0f172a]"
                            onPointerDown={(e) => dragControls.start(e)}
                            style={{ touchAction: 'none' }}
                        >
                            <div className="flex flex-col">
                                <motion.span 
                                    key={selectedPlayerId ? 'step2' : 'step1'}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 pointer-events-none"
                                >
                                    {selectedPlayerId ? 'Step 2 of 2' : 'Step 1 of 2'}
                                </motion.span>
                                <h3 className="font-black text-slate-800 dark:text-white text-2xl leading-none tracking-tight pointer-events-none">
                                    {selectedPlayerId ? 'Select Action' : 'Who Scored?'}
                                </h3>
                            </div>
                            <button 
                                onClick={onClose}
                                onPointerDown={(e) => e.stopPropagation()} // Stop drag propagation on close button
                                className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content Area - Uses wait mode to prevent layout collapse */}
                        <div className="relative w-full flex-1 bg-slate-50 dark:bg-[#020617]/50 overflow-hidden flex flex-col">
                            <AnimatePresence mode="wait" initial={false}>
                                {!selectedPlayerId ? (
                                    /* STEP 1: PLAYERS GRID */
                                    <motion.div 
                                        key="step1"
                                        className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-10"
                                        initial={{ x: "-20%", opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: "-20%", opacity: 0, transition: { duration: 0.1 } }} // Instant exit for speed
                                        transition={contentTransition}
                                    >
                                        <div className="grid grid-cols-2 gap-3">
                                            {sortedPlayers.map(p => (
                                                <button 
                                                    key={p.id}
                                                    onClick={() => handlePlayerSelect(p.id)}
                                                    className={`
                                                        relative group overflow-hidden
                                                        flex flex-col items-center justify-center gap-3 p-5 rounded-3xl
                                                        bg-white dark:bg-white/5 active:scale-95 transition-all
                                                        border border-slate-200 dark:border-white/5 
                                                        hover:border-indigo-500/30 dark:hover:border-white/20 hover:shadow-lg
                                                        dark:hover:bg-white/10
                                                    `}
                                                >
                                                    {/* Player Avatar / "Jersey Number" */}
                                                    <div className={`
                                                        relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm
                                                        bg-slate-100 dark:bg-white/10 border border-black/5 dark:border-white/10
                                                        ${theme.text}
                                                    `}>
                                                        <span className="text-2xl font-black">
                                                            {p.number || p.name.substring(0, 2).toUpperCase()}
                                                        </span>
                                                        
                                                        {/* Original Index Tag (Hashtag) */}
                                                        <div className="absolute top-1 right-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-black/20 px-1 rounded-md">
                                                            #{p.originalIndex + 1}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col items-center w-full">
                                                        <span className="font-black text-base text-slate-800 dark:text-white text-center line-clamp-1 w-full tracking-tight">
                                                            {p.name}
                                                        </span>
                                                        {/* Star Rating - Enhanced Visibility */}
                                                        <div className="flex gap-1 mt-2">
                                                            {[...Array(5)].map((_, i) => (
                                                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < p.skillLevel ? 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.6)]' : 'bg-slate-200 dark:bg-white/10'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                            
                                            {/* Unknown Player Option */}
                                            <button 
                                                onClick={() => handlePlayerSelect('unknown')}
                                                className="
                                                    col-span-2 flex items-center justify-center gap-3 p-4 rounded-2xl
                                                    border border-dashed border-slate-300 dark:border-white/10 
                                                    text-slate-500 dark:text-slate-500
                                                    hover:text-slate-800 dark:hover:text-white 
                                                    hover:border-slate-400 dark:hover:border-white/20 
                                                    hover:bg-slate-100 dark:hover:bg-white/5 transition-all
                                                    group min-h-[80px]
                                                "
                                            >
                                                <div className="p-2 rounded-full bg-slate-200 dark:bg-white/5 group-hover:bg-white/10 transition-colors">
                                                    <User size={18} />
                                                </div>
                                                <span className="font-bold text-xs uppercase tracking-wider">Unknown / Guest Player</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    /* STEP 2: SKILLS GRID */
                                    <motion.div 
                                        key="step2"
                                        className="flex-1 flex flex-col p-4 h-full"
                                        initial={{ x: "20%", opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: "20%", opacity: 0, transition: { duration: 0.1 } }}
                                        transition={contentTransition}
                                    >
                                        <div className="grid grid-cols-2 gap-3">
                                            {skills.map(s => (
                                                <button 
                                                    key={s.id}
                                                    onClick={() => handleSkillSelect(s.id)}
                                                    className={`
                                                        relative overflow-hidden group
                                                        aspect-square rounded-3xl flex flex-col items-center justify-center gap-4
                                                        bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 
                                                        border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 dark:hover:border-white/20
                                                        active:scale-95 transition-all shadow-sm hover:shadow-md
                                                    `}
                                                >
                                                    <div className={`
                                                        p-5 rounded-2xl shadow-lg transition-transform group-hover:scale-110 duration-300
                                                        ${theme.bg} ${theme.border} border ${theme.text}
                                                    `}>
                                                        <s.icon size={32} strokeWidth={1.5} />
                                                    </div>
                                                    <span className={`text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300`}>
                                                        {s.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mt-auto pt-6 pb-2">
                                            <button 
                                                onClick={() => setSelectedPlayerId(null)}
                                                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white uppercase tracking-widest py-4 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-colors"
                                            >
                                                <ChevronLeft size={16} /> Change Player
                                            </button>
                                        </div>
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