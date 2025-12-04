import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Team, Player } from '../../types';
import { Pin, Trash2, Shuffle, ArrowRight, Edit2, GripVertical, Plus, Undo2, Ban, Scale, Activity } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import { useTranslation } from '../../contexts/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';

const SortableContextFixed = SortableContext as any;
const DragOverlayFixed = DragOverlay as any;

interface TeamManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  courtA: Team;
  courtB: Team;
  queue: Team[];
  onGenerate: (names: string[]) => void;
  onToggleFixed: (playerId: string, teamId?: string) => void;
  onRemove: (id: string) => void;
  onMove: (playerId: string, fromId: string, toId: string) => void;
  onUpdateTeamName: (teamId: string, name: string) => void;
  onUpdatePlayerName: (playerId: string, name: string) => void;
  onUpdatePlayerSkill: (playerId: string, skill: number) => void;
  onUpdateRosters: (cA: Player[], cB: Player[], q: Team[]) => void;
  onAddPlayer: (name: string, target: 'A' | 'B' | 'Queue', skill: number) => void;
  onUndoRemove: () => void;
  canUndoRemove: boolean;
  onCommitDeletions: () => void;
  deletedCount: number;
}

// --- HELPER: Colors & Gradients ---
const getSkillColorHex = (level: number) => {
  if (level <= 2) return '#ef4444'; // Red
  if (level <= 4) return '#f97316'; // Orange
  if (level <= 6) return '#eab308'; // Yellow
  if (level <= 8) return '#4ade80'; // Light Green
  return '#16a34a'; // Dark Green
};

const getSkillTailwindColor = (level: number) => {
  if (level <= 2) return 'text-red-500 border-red-500/30 bg-red-500/10';
  if (level <= 4) return 'text-orange-500 border-orange-500/30 bg-orange-500/10';
  if (level <= 6) return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
  if (level <= 8) return 'text-green-400 border-green-400/30 bg-green-400/10';
  return 'text-green-600 dark:text-green-500 border-green-600/30 bg-green-600/10';
};

const SKILL_GRADIENT = `linear-gradient(to right, #ef4444 0%, #f97316 25%, #eab308 50%, #4ade80 75%, #16a34a 100%)`;

const EditableTitle: React.FC<{ name: string; onSave: (val: string) => void; className?: string; isPlayer?: boolean }> = ({ name, onSave, className, isPlayer }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(name);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => { setVal(name); }, [name]);
  useEffect(() => { if(isEditing) inputRef.current?.focus(); }, [isEditing]);

  const save = () => {
    setIsEditing(false);
    if(val.trim() && val !== name) onSave(val.trim());
    else setVal(name);
  };

  const cancel = () => {
      setIsEditing(false);
      setVal(name);
  };

  if(isEditing) {
    return (
        <input 
            ref={inputRef} type="text"
            className={`bg-black/50 dark:bg-black/50 text-white border-b border-white/50 outline-none w-full px-1 py-0.5 font-bold ${isPlayer ? 'text-sm' : 'text-xs uppercase tracking-widest'}`}
            value={val} onChange={e => setVal(e.target.value)} onBlur={save}
            onKeyDown={e => { if(e.key === 'Enter') save(); if(e.key === 'Escape') cancel(); }}
            onPointerDown={e => e.stopPropagation()} 
        />
    );
  }
  return (
      <div className={`flex items-center gap-2 group cursor-pointer ${className}`} onClick={() => setIsEditing(true)}>
          <span className="truncate">{name}</span>
          <Edit2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 dark:text-slate-400 flex-shrink-0" />
      </div>
  );
};

// --- COMPONENT: Custom Range Slider ---
const CustomSlider: React.FC<{ value: number; onChange: (val: number) => void }> = ({ value, onChange }) => {
    return (
        <div className="relative w-full h-6 flex items-center">
            {/* Track Background */}
            <div className="absolute w-full h-1.5 rounded-full overflow-hidden bg-slate-700/50">
                <div className="w-full h-full opacity-80" style={{ background: SKILL_GRADIENT }}></div>
            </div>
            
            {/* Native Input (Invisible but interactive) */}
            <input 
                type="range" min="1" max="10" step="1"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                style={{ touchAction: 'none' }}
            />

            {/* Visual Thumb */}
            <div 
                className="absolute h-4 w-4 bg-white rounded-full shadow-md border border-slate-200 pointer-events-none transition-transform duration-75 ease-out flex items-center justify-center z-0"
                style={{ 
                    left: `${((value - 1) / 9) * 100}%`,
                    transform: 'translateX(-50%)',
                }}
            >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getSkillColorHex(value) }}></div>
            </div>
        </div>
    );
};

// --- COMPONENT: SkillBadge with Portal ---
const SkillBadge: React.FC<{ skill: number; onChange: (newSkill: number) => void; isEditingDisabled?: boolean }> = ({ skill, onChange, isEditingDisabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (isEditingDisabled) return;

    if (!isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
            top: rect.top - 12, // Gap above button
            left: rect.left + rect.width / 2 // Center relative to button
        });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false); 
    const handleClickOutside = (e: MouseEvent) => {
       if (e.target instanceof Element && !e.target.closest('.skill-popover') && e.target !== buttonRef.current) {
          setIsOpen(false);
       }
    };
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
       window.removeEventListener('scroll', handleScroll, true);
       window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const colorClass = getSkillTailwindColor(skill);
  const hexColor = getSkillColorHex(skill);

  return (
    <>
       <button 
         ref={buttonRef}
         onClick={toggleOpen}
         onPointerDown={(e) => e.stopPropagation()} 
         className={`
           w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border
           transition-transform hover:scale-110 active:scale-95 flex-shrink-0
           ${colorClass}
           ${isEditingDisabled ? 'cursor-default opacity-70' : 'cursor-pointer'}
         `}
       >
         {skill}
       </button>
       
       {isOpen && createPortal(
         <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-10px" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-100%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-10px" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{ 
                position: 'fixed',
                top: coords.top, 
                left: coords.left,
                zIndex: 9999
            }}
            className="skill-popover relative group"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
         >
             {/* Main Container */}
             <div className="bg-slate-900/90 backdrop-blur-xl p-3 rounded-2xl shadow-2xl border border-white/10 flex flex-col gap-1 w-[180px]">
                 
                 {/* Header: Label + Value */}
                 <div className="flex items-center justify-between px-1 mb-1">
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Skill Level</span>
                     <span 
                        className="text-sm font-black transition-colors duration-200"
                        style={{ color: hexColor }}
                     >
                        {skill}
                     </span>
                 </div>

                 {/* Custom Slider */}
                 <div className="flex items-center gap-2">
                     <span className="text-[9px] font-bold text-slate-500">1</span>
                     <div className="flex-1">
                        <CustomSlider value={skill} onChange={onChange} />
                     </div>
                     <span className="text-[9px] font-bold text-slate-500">10</span>
                 </div>
             </div>

             {/* Arrow Indicator (Bottom Center) */}
             <div className="absolute left-1/2 -bottom-1.5 w-3 h-3 bg-slate-900/90 backdrop-blur-xl border-r border-b border-white/10 rotate-45 -translate-x-1/2 shadow-sm"></div>
         </motion.div>,
         document.body
       )}
    </>
  );
};

const AddPlayerInput: React.FC<{ onAdd: (name: string, skill: number) => void; disabled?: boolean }> = ({ onAdd, disabled }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [skill, setSkill] = useState(5);
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => { if(isOpen) inputRef.current?.focus(); }, [isOpen]);

    const submit = () => {
        if(name.trim()) { onAdd(name.trim(), skill); setName(''); setSkill(5); }
        setIsOpen(false);
    };

    if (isOpen && !disabled) {
        return (
            <div className="flex flex-col mt-2 px-1 animate-in fade-in slide-in-from-top-1 bg-white/5 dark:bg-black/20 p-3 rounded-xl border border-black/5 dark:border-white/5 shadow-inner">
                <div className="flex items-center gap-2 mb-3">
                    <input ref={inputRef}
                        className="flex-1 bg-transparent border-b border-black/10 dark:border-white/10 px-1 py-1 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-bold placeholder:font-medium"
                        placeholder={t('teamManager.addPlayerPlaceholder')} value={name} onChange={e => setName(e.target.value)}
                        onKeyDown={e => { if(e.key === 'Enter') submit(); if(e.key === 'Escape') setIsOpen(false); }}
                    />
                    <button onClick={submit} className="p-1.5 bg-indigo-500 rounded-lg hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"><Plus size={14} /></button>
                </div>
                
                {/* Visual Skill Slider Integrated */}
                <div className="flex items-center gap-3">
                     <span 
                        className="text-[10px] font-black uppercase w-8 text-right transition-colors"
                        style={{ color: getSkillColorHex(skill) }}
                     >
                        LVL {skill}
                     </span>
                     <div className="flex-1">
                        <CustomSlider value={skill} onChange={setSkill} />
                     </div>
                </div>
            </div>
        );
    }
    return (
        <button onClick={() => !disabled && setIsOpen(true)} disabled={disabled}
            className={`mt-2 w-full py-2 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-transparent transition-all ${disabled ? 'text-slate-500 dark:text-slate-600 cursor-not-allowed opacity-50' : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/5 dark:hover:border-white/5'}`} >
            {disabled ? (<><Ban size={12} /> {t('teamManager.rosterFull')}</>) : (<><Plus size={12} /> {t('teamManager.addPlayer')}</>)}
        </button>
    );
};

const PlayerCard: React.FC<{ player: Player; locationId: string; onToggleFixed: (playerId: string, teamId?: string) => void; onRemove: (id: string) => void; onUpdateName: (id: string, name: string) => void; onUpdateSkill: (id: string, skill: number) => void; }> = ({ player, locationId, onToggleFixed, onRemove, onUpdateName, onUpdateSkill }) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: player.id,
    data: { fromId: locationId, player },
    disabled: player.isFixed,
  });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, touchAction: player.isFixed ? 'auto' : 'none' };

  return (
    <div ref={setNodeRef} style={style} className={`group relative flex items-center justify-between p-2 rounded-xl border transition-all ${player.isFixed ? 'bg-indigo-500/10 border-indigo-500/30 cursor-not-allowed' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/20'}`}>
      {/* Container for content */}
      <div className="flex items-center gap-2.5 overflow-hidden flex-1">
        {/* Drag Handle - Only THIS initiates drag */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-500 dark:text-slate-600 touch-none flex-shrink-0">
          <GripVertical size={16} />
        </div>
        
        {/* Skill Badge - Interaction protected by stopPropagation in component */}
        <SkillBadge skill={player.skillLevel || 5} onChange={(s) => onUpdateSkill(player.id, s)} isEditingDisabled={player.isFixed} />

        <div className="flex flex-col min-w-0 flex-1 pr-2">
          <EditableTitle name={player.name} onSave={(val) => onUpdateName(player.id, val)} isPlayer={true} className="font-medium text-sm text-slate-800 dark:text-slate-200" />
          <span className="text-[9px] font-mono text-slate-500/50 dark:text-slate-500/50">#{player.id.slice(0, 4)}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={() => onToggleFixed(player.id, locationId)} onPointerDown={e => e.stopPropagation()} className={`p-1.5 rounded-lg transition-all ${player.isFixed ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'}`} title={player.isFixed ? t('teamManager.unlockPlayer') : t('teamManager.lockPlayer')}>
            <Pin size={14} fill={player.isFixed ? "currentColor" : "none"} />
        </button>
        <button onClick={() => onRemove(player.id)} onPointerDown={e => e.stopPropagation()} className="text-slate-500 dark:text-slate-600 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const TeamColumn: React.FC<{ id: string; team: Team; onUpdateTeamName: (id: string, name: string) => void; onUpdatePlayerName: (pid: string, n: string) => void; onUpdateSkill: (id: string, s: number) => void; onAddPlayer: (name: string, skill: number) => void; onToggleFixed: (playerId: string, teamId?: string) => void; onRemove: (id: string) => void; color: 'indigo' | 'rose' | 'slate'; }> = ({ id, team, onUpdateTeamName, onUpdatePlayerName, onUpdateSkill, onAddPlayer, onToggleFixed, onRemove, color }) => {
  const { t } = useTranslation();
  const isFull = team.players.length >= 6;
  const { setNodeRef, isOver } = useSortable({ id: id, data: { type: 'container' } });
  
  // Calculate Strength
  const totalSkill = team.players.reduce((sum, p) => sum + (p.skillLevel || 5), 0);
  const avgSkill = team.players.length > 0 ? (totalSkill / team.players.length).toFixed(1) : "0.0";

  const theme = {
    indigo: { bg: 'bg-indigo-500/5', border: 'border-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', glow: 'shadow-[0_0_10px_currentColor]' },
    rose: { bg: 'bg-rose-500/5', border: 'border-rose-500/10', text: 'text-rose-600 dark:text-rose-400', glow: 'shadow-[0_0_10px_currentColor]' },
    slate: { bg: 'bg-black/[0.02] dark:bg-white/[0.02]', border: 'border-black/5 dark:border-white/5', text: 'text-slate-600 dark:text-slate-400', glow: 'bg-slate-600' }
  };

  return (
    <div ref={setNodeRef} className={`flex flex-col w-full h-fit ${theme[color].bg} p-3 rounded-2xl ${theme[color].border} transition-all duration-300 ${isOver && !isFull ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-bold ${theme[color].text} text-xs uppercase tracking-widest flex items-center gap-2`}>
            <div className={`w-2 h-2 rounded-full ${theme[color].glow}`}></div>
            <EditableTitle name={team.name} onSave={n => onUpdateTeamName(id, n)} />
        </h3>
        
        {/* Strength Badge */}
        <div className="flex items-center gap-2">
             <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10" title="Team Strength">
                <Activity size={10} className="text-slate-400" />
                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{totalSkill}</span>
             </div>
             <span className={`${isFull ? 'text-rose-500 dark:text-rose-400' : `${theme[color].text}/50`} text-xs font-bold`}>{team.players.length}/6</span>
        </div>
      </div>

      <div className="overflow-y-auto custom-scrollbar pr-1 min-h-[60px] max-h-[400px] space-y-2">
        {team.players.length === 0 && <span className="text-xs text-slate-500 dark:text-slate-600 italic px-2 block pt-2">{t('teamManager.dragPlayersHere')}</span>}
        <SortableContextFixed items={team.players.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {team.players.map(p => (
            <PlayerCard key={p.id} player={p} locationId={id} onToggleFixed={onToggleFixed} onRemove={onRemove} onUpdateName={onUpdatePlayerName} onUpdateSkill={onUpdateSkill} />
          ))}
        </SortableContextFixed>
      </div>
      <AddPlayerInput onAdd={onAddPlayer} disabled={isFull} />
    </div>
  );
};

export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({ 
  isOpen, onClose, courtA, courtB, queue, onGenerate, onToggleFixed, onRemove, onMove, onUpdateTeamName, onUpdatePlayerName, onUpdatePlayerSkill, onUpdateRosters, onAddPlayer, onUndoRemove, canUndoRemove, onCommitDeletions, deletedCount
}) => {
  const { t } = useTranslation();
  const [rawNames, setRawNames] = useState('');
  const [view, setView] = useState<'roster' | 'input'>('roster');
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }), useSensor(KeyboardSensor));
  
  // Timer for undo button
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (deletedCount > 0) {
      setUndoVisible(true);
      timer = setTimeout(() => {
        setUndoVisible(false);
        setTimeout(() => onCommitDeletions(), 200);
      }, 5000);
    } else {
      setUndoVisible(false);
    }
    return () => clearTimeout(timer);
  }, [deletedCount, onCommitDeletions]);

  const handleUndo = () => {
    onUndoRemove();
  };

  const playersById = useMemo(() => {
    const map = new Map<string, Player>();
    [...courtA.players, ...courtB.players, ...queue.flatMap(t => t.players)].forEach(p => map.set(p.id, p));
    return map;
  }, [courtA, courtB, queue]);

  const findContainer = (id: string) => {
    if (id === 'A' || courtA.players.some(p => p.id === id)) return 'A';
    if (id === 'B' || courtB.players.some(p => p.id === id)) return 'B';
    for (const team of queue) { if (team.id === id || team.players.some(p => p.id === id)) return team.id; }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const player = playersById.get(event.active.id as string);
    if (player) setActivePlayer(player);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromContainerId = findContainer(active.id as string);
    const toContainerId = findContainer(over.id as string);
    if (fromContainerId && toContainerId && fromContainerId !== toContainerId) {
      onMove(active.id as string, fromContainerId, toContainerId);
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        const fromContainerId = findContainer(active.id as string);
        const toContainerId = findContainer(over.id as string);
        if (fromContainerId && toContainerId && fromContainerId !== toContainerId) {
            onMove(active.id as string, fromContainerId, toContainerId);
        }
    }
    setActivePlayer(null);
  };
  
  const handleGenerate = () => {
    const names = rawNames.split('\n').map(n => n.trim()).filter(n => n);
    if (names.length > 0) {
      onGenerate(names);
      setRawNames('');
      setView('roster');
    }
  };

  // --- AUTOMATIC BALANCING ALGORITHM ---
  const handleBalanceTeams = () => {
      // 1. Gather all players from active courts (Queue is respected and not touched unless explicitly moved)
      const allActivePlayers = [...courtA.players, ...courtB.players];
      
      // 2. Sort players by Skill Level Descending (Best players first)
      allActivePlayers.sort((a, b) => (b.skillLevel || 5) - (a.skillLevel || 5));

      const newA: Player[] = [];
      const newB: Player[] = [];
      let sumA = 0;
      let sumB = 0;

      // 3. Distribute Greedy
      allActivePlayers.forEach(player => {
          if (newA.length >= 6) {
              newB.push(player);
              sumB += (player.skillLevel || 5);
          }
          else if (newB.length >= 6) {
              newA.push(player);
              sumA += (player.skillLevel || 5);
          }
          else {
              if (sumA <= sumB) {
                  newA.push(player);
                  sumA += (player.skillLevel || 5);
              } else {
                  newB.push(player);
                  sumB += (player.skillLevel || 5);
              }
          }
      });

      // 4. Batch Update State
      onUpdateRosters(newA, newB, []);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('teamManager.title')} maxWidth="max-w-5xl">
      <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl mb-6 border border-black/5 dark:border-white/5">
        <button onClick={() => setView('roster')} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${view === 'roster' ? 'bg-black/10 dark:bg-white/10 text-slate-800 dark:text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>{t('teamManager.currentRoster')}</button>
        <button onClick={() => setView('input')} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${view === 'input' ? 'bg-black/10 dark:bg-white/10 text-slate-800 dark:text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>{t('teamManager.batchInput')}</button>
      </div>

      {view === 'input' ? (
        <div className="space-y-4"> 
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-xs text-indigo-700 dark:text-indigo-200 flex items-center gap-2"><ArrowRight size={14} />{t('teamManager.batchInputPrompt')}</p>
            </div>
            <textarea className="w-full h-48 bg-black/20 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl p-4 text-slate-800 dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 font-mono text-sm resize-none custom-scrollbar"
               placeholder={t('teamManager.batchInputPlaceholder')} value={rawNames} onChange={e => setRawNames(e.target.value)} />
            <Button onClick={handleGenerate} className="w-full" size="lg"><Shuffle size={18} /> {t('teamManager.generateTeams')}</Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          
          <div className="flex justify-center mb-6">
             <Button 
                onClick={handleBalanceTeams} 
                variant="secondary"
                size="sm"
                className="bg-gradient-to-r from-indigo-500/10 to-rose-500/10 hover:from-indigo-500/20 hover:to-rose-500/20 border-white/10"
             >
                <Scale size={16} className="text-slate-500 dark:text-slate-300" />
                <span className="text-slate-700 dark:text-slate-200">Balance Teams (Skill)</span>
             </Button>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-3 gap-4 items-start pb-20 min-h-[60vh]">
            <TeamColumn id="A" team={courtA} onUpdateTeamName={onUpdateTeamName} onUpdatePlayerName={onUpdatePlayerName} onUpdateSkill={onUpdatePlayerSkill} onAddPlayer={(n, s) => onAddPlayer(n, 'A', s)} onToggleFixed={onToggleFixed} onRemove={onRemove} color="indigo" />
            <TeamColumn id="B" team={courtB} onUpdateTeamName={onUpdateTeamName} onUpdatePlayerName={onUpdatePlayerName} onUpdateSkill={onUpdatePlayerSkill} onAddPlayer={(n, s) => onAddPlayer(n, 'B', s)} onToggleFixed={onToggleFixed} onRemove={onRemove} color="rose" />
            
            <div className="w-full bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col h-fit">
                <h3 className="font-bold text-slate-500 dark:text-slate-400 mb-3 text-xs uppercase tracking-widest flex items-center gap-2 flex-none"><div className="w-2 h-2 rounded-full bg-slate-500 dark:bg-slate-600"></div>{t('teamManager.queue')}</h3>
                <div className="overflow-y-auto custom-scrollbar pr-1 space-y-4 max-h-[60vh]">
                  {queue.length === 0 && <span className="text-xs text-slate-500 dark:text-slate-600 italic px-2">{t('teamManager.queueEmpty')}</span>}
                  {queue.map(team => (
                    <TeamColumn key={team.id} id={team.id} team={team} onUpdateTeamName={onUpdateTeamName} onUpdatePlayerName={onUpdatePlayerName} onUpdateSkill={onUpdatePlayerSkill} onAddPlayer={_ => {}} onToggleFixed={onToggleFixed} onRemove={onRemove} color="slate" />
                  ))}
                </div>
                <div className="pt-2 border-t border-black/5 dark:border-white/5 mt-4"><AddPlayerInput onAdd={(n, s) => onAddPlayer(n, 'Queue', s)} /></div>
            </div>
          </div>
          {createPortal(
            <DragOverlayFixed>
              {activePlayer ? (
                <PlayerCard player={activePlayer} locationId="" onToggleFixed={() => {}} onRemove={() => {}} onUpdateName={() => {}} onUpdateSkill={() => {}} />
              ) : null}
            </DragOverlayFixed>,
            document.body
          )}
        </DndContext>
      )}

       <div 
         className={`
            fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] 
            transition-all duration-200 ease-in-out
            ${undoVisible && canUndoRemove ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
         `}
       >
         <div className="bg-slate-800/90 backdrop-blur-xl text-white px-5 py-3 rounded-full shadow-2xl border border-white/10 flex items-center gap-4">
            <span className="text-xs font-medium text-slate-300">{t('teamManager.playerRemoved')}</span>
            <div className="h-4 w-px bg-white/20"></div>
            <button onClick={handleUndo} className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider">
              <Undo2 size={16} /> {t('teamManager.undo')}
            </button>
         </div>
       </div>
    </Modal>
  );
};
