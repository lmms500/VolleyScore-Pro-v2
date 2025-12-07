import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Team, Player, RotationMode, PlayerProfile, TeamColor } from '../../types';
import { calculateTeamStrength } from '../../utils/balanceUtils';
import { Pin, Trash2, Shuffle, Edit2, GripVertical, Plus, Undo2, Ban, Star, Save, RefreshCw, AlertCircle, CheckCircle2, User, Upload, List, Lock, Hash, Users, Layers, Search, X, ListFilter, SortAsc, SortDesc, ArrowDownAZ, ArrowDown01, ArrowUpWideNarrow } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
  TouchSensor
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import { useTranslation } from '../../contexts/LanguageContext';
import { TEAM_COLORS, COLOR_KEYS, resolveTheme } from '../../utils/colors';
import { motion, AnimatePresence } from 'framer-motion';

const SortableContextFixed = SortableContext as any;
const DragOverlayFixed = DragOverlay as any;

// --- PROPS ---
interface TeamManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  courtA: Team;
  courtB: Team;
  queue: Team[];
  rotationMode: RotationMode;
  onSetRotationMode: (mode: RotationMode) => void;
  onBalanceTeams: () => void;
  onGenerate: (names: string[]) => void;
  onToggleFixed: (playerId: string) => void;
  onRemove: (id: string) => void;
  onMove: (playerId: string, fromId: string, toId: string, newIndex?: number) => void;
  onUpdateTeamName: (teamId: string, name: string) => void;
  onUpdateTeamColor: (teamId: string, color: TeamColor) => void;
  onUpdatePlayerName: (playerId: string, name: string) => void;
  onUpdatePlayerNumber: (playerId: string, number: string) => void;
  onUpdatePlayerSkill: (playerId: string, skill: number) => void;
  onSaveProfile: (playerId: string) => void;
  onRevertProfile: (playerId: string) => void;
  onAddPlayer: (name: string, target: 'A' | 'B' | 'Queue', number?: string, skill?: number) => void;
  onUndoRemove: () => void;
  canUndoRemove: boolean;
  onCommitDeletions: () => void;
  deletedCount: number;
  profiles: Map<string, PlayerProfile>;
  deleteProfile?: (id: string) => void;
  upsertProfile?: (name: string, skill: number, id?: string) => PlayerProfile;
  onSortTeam: (teamId: string, criteria: 'name' | 'number' | 'skill') => void;
}

type PlayerLocationStatus = 'A' | 'B' | 'Queue' | null;

// --- SUB-COMPONENTS ---

const SkillSelector = memo(({ level, onChange, size = 10 }: { level: number, onChange: (l: number) => void, size?: number }) => {
    return (
        <div className="flex gap-0.5 relative z-20" onPointerDown={(e) => e.stopPropagation()}>
            {[1, 2, 3, 4, 5].map(i => (
                <button 
                   key={i} 
                   onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(i); }}
                   className="focus:outline-none p-0.5 hover:scale-125 transition-transform touch-manipulation cursor-pointer"
                >
                    <Star 
                        size={size} 
                        className={i <= level ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"} 
                    />
                </button>
            ))}
        </div>
    );
});

// PREMIUM COLOR PICKER
const ColorPicker = memo(({ 
    selected, 
    onChange, 
    usedColors 
}: { 
    selected: TeamColor, 
    onChange: (c: TeamColor) => void,
    usedColors: Set<string>
}) => {
    
    return (
        <div 
            className="w-full relative z-20" 
            onPointerDown={(e) => e.stopPropagation()} 
        >
            <div className="flex flex-wrap items-center justify-center gap-2 py-2">
                {COLOR_KEYS.map(color => {
                     const isSelected = selected === color;
                     const isTaken = usedColors.has(color) && !isSelected;
                     const theme = TEAM_COLORS[color];
                     
                     return (
                         <button
                            key={color}
                            onClick={() => !isTaken && onChange(color)}
                            disabled={isTaken}
                            className={`
                                relative w-6 h-6 rounded-full transition-all flex items-center justify-center shrink-0
                                ${theme.solid}
                                ${isSelected 
                                    ? 'ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900 ring-slate-400 dark:ring-slate-500 shadow-md scale-110 opacity-100' 
                                    : isTaken
                                        ? 'opacity-20 grayscale cursor-not-allowed scale-90 border border-black/10'
                                        : 'hover:scale-110 opacity-60 hover:opacity-100 cursor-pointer'
                                }
                            `}
                            title={isTaken ? 'Color taken' : color.charAt(0).toUpperCase() + color.slice(1)}
                         >
                            {isSelected && (
                                <motion.div 
                                    layoutId="selected-color-check"
                                    className="w-2 h-2 bg-white rounded-full shadow-sm"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                         </button>
                     );
                })}
            </div>
        </div>
    );
});

const SyncIndicator = memo(({ player, hasProfile, profileMatch, onSave, onRevert }: { player: Player, hasProfile: boolean, profileMatch: boolean, onSave: () => void, onRevert: () => void }) => {
    const { t } = useTranslation();
    
    let status: 'synced' | 'desynced' | 'unlinked' = 'unlinked';
    if (hasProfile) {
        status = profileMatch ? 'synced' : 'desynced';
    }

    const config = {
        synced: { color: 'bg-emerald-500', icon: CheckCircle2, text: t('teamManager.sync.synced') },
        desynced: { color: 'bg-amber-500', icon: AlertCircle, text: t('teamManager.sync.desynced') },
        unlinked: { color: 'bg-slate-300 dark:bg-slate-600', icon: User, text: t('teamManager.sync.unlinked') }
    }[status];

    return (
        <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${config.color} shadow-[0_0_3px_currentColor]`} title={config.text} />
            
            {status !== 'synced' && (
                <div className="flex gap-0.5 animate-in fade-in zoom-in duration-200">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onSave(); }}
                        className={`p-1 rounded-md text-white shadow-sm hover:scale-105 transition-all ${status === 'desynced' ? 'bg-amber-500 hover:bg-amber-400' : 'bg-slate-400 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500'}`}
                        title={status === 'desynced' ? t('teamManager.sync.updateTooltip') : t('teamManager.sync.createTooltip')}
                     >
                         <Save size={10} />
                     </button>
                     {status === 'desynced' && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); onRevert(); }}
                            className="p-1 rounded-md bg-white/10 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title={t('teamManager.sync.revertTooltip')}
                         >
                             <Undo2 size={10} />
                         </button>
                     )}
                </div>
            )}
        </div>
    );
});

const EditableTitle = memo(({ name, onSave, className, isPlayer }: { name: string; onSave: (val: string) => void; className?: string; isPlayer?: boolean }) => {
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
            className={`bg-transparent text-slate-900 dark:text-white border-b border-indigo-500 outline-none w-full px-0 py-0 font-bold ${isPlayer ? 'text-sm' : 'text-xs uppercase tracking-widest'}`}
            value={val} onChange={e => setVal(e.target.value)} onBlur={save}
            onKeyDown={e => { if(e.key === 'Enter') save(); if(e.key === 'Escape') cancel(); }}
            onPointerDown={e => e.stopPropagation()} 
        />
    );
  }
  return (
      <div className={`flex items-center gap-2 group cursor-pointer min-w-0 ${className}`} onClick={() => setIsEditing(true)}>
          <span className="truncate">{name}</span>
          <Edit2 size={8} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 flex-shrink-0" />
      </div>
  );
});

const EditableNumber = memo(({ number, onSave }: { number?: string; onSave: (val: string) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [val, setVal] = useState(number || '');
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => { setVal(number || ''); }, [number]);
    useEffect(() => { if(isEditing) inputRef.current?.focus(); }, [isEditing]);

    const save = () => {
        setIsEditing(false);
        if (val !== (number || '')) onSave(val.trim());
    };

    if(isEditing) {
        return (
            <input 
                ref={inputRef} 
                type="text" 
                maxLength={3}
                className="w-7 h-7 bg-white dark:bg-black/50 text-center rounded-lg border border-indigo-500 outline-none text-xs font-bold text-slate-800 dark:text-white shadow-sm"
                value={val} 
                onChange={e => setVal(e.target.value)} 
                onBlur={save}
                onKeyDown={e => { if(e.key === 'Enter') save(); if(e.key === 'Escape') setIsEditing(false); }}
                onPointerDown={e => e.stopPropagation()} 
            />
        );
    }

    return (
        <button 
            onClick={() => setIsEditing(true)} 
            onPointerDown={e => e.stopPropagation()}
            className={`
                w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all
                ${number 
                    ? 'bg-white/80 dark:bg-white/5 text-slate-800 dark:text-white border-transparent shadow-sm' 
                    : 'bg-transparent text-slate-300 dark:text-slate-600 border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-400'}
            `}
        >
            {number || <Hash size={10} />}
        </button>
    );
});

// --- PROFILE CARD COMPONENT ---

const ProfileCard = memo((({
    profile,
    onUpdate,
    onDelete,
    onAddToGame,
    status
}: {
    profile: PlayerProfile;
    onUpdate: (name: string, skill: number) => void;
    onDelete: () => void;
    onAddToGame: (target: 'A' | 'B' | 'Queue') => void;
    status: PlayerLocationStatus;
}) => {
    const { t } = useTranslation();
    
    // Configuração Visual baseada no Status
    const statusConfig = {
        A: { bg: 'bg-indigo-500/5 border-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', label: t('teamManager.location.courtA') },
        B: { bg: 'bg-rose-500/5 border-rose-500/10', text: 'text-rose-600 dark:text-rose-400', label: t('teamManager.location.courtB') },
        Queue: { bg: 'bg-slate-500/5 border-slate-500/10', text: 'text-slate-600 dark:text-slate-400', label: t('teamManager.location.queue') },
        null: { bg: 'bg-transparent', text: '', label: '' }
    }[status || 'null'];

    const handleUpdateName = useCallback((val: string) => onUpdate(val, profile.skillLevel), [onUpdate, profile.skillLevel]);
    const handleUpdateSkill = useCallback((l: number) => onUpdate(profile.name, l), [onUpdate, profile.name]);
    const handleAddA = useCallback(() => onAddToGame('A'), [onAddToGame]);
    const handleAddB = useCallback(() => onAddToGame('B'), [onAddToGame]);
    const handleAddQ = useCallback(() => onAddToGame('Queue'), [onAddToGame]);

    return (
        <div className={`
            group flex items-center justify-between p-3 rounded-2xl
            bg-white/40 dark:bg-white/[0.02] border backdrop-blur-sm
            transition-all shadow-sm
            ${status ? statusConfig.bg : 'border-white/40 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10'}
        `}>
             <div className="flex flex-col min-w-0 flex-1 pr-3">
                 <EditableTitle 
                    name={profile.name} 
                    onSave={handleUpdateName} 
                    isPlayer={true} 
                    className="font-bold text-sm text-slate-800 dark:text-slate-200" 
                 />
                 <div className="mt-1">
                    <SkillSelector 
                        level={profile.skillLevel} 
                        onChange={handleUpdateSkill} 
                    />
                 </div>
             </div>
             
             <div className="flex items-center gap-2">
                 {status ? (
                     <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${statusConfig.text} ${statusConfig.bg}`}>
                        {statusConfig.label}
                     </span>
                 ) : (
                     <div className="flex gap-1">
                         <Button size="sm" onClick={handleAddA} className="h-7 px-2 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white border-transparent" title={t('teamManager.actions.addToA')}>
                             A
                         </Button>
                         <Button size="sm" onClick={handleAddB} className="h-7 px-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white border-transparent" title={t('teamManager.actions.addToB')}>
                             B
                         </Button>
                         <Button size="sm" onClick={handleAddQ} className="h-7 px-2 bg-slate-500/10 text-slate-600 hover:bg-slate-500 hover:text-white border-transparent" title={t('teamManager.actions.addToQueue')}>
                             Q
                         </Button>
                     </div>
                 )}
                 
                 <div className="w-px h-6 bg-black/5 dark:bg-white/5 mx-0.5"></div>
                 
                 <button 
                    onClick={onDelete} 
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                 >
                     <Trash2 size={14} />
                 </button>
             </div>
        </div>
    );
});

// React.memo to prevent re-renders of PlayerCard unless props change
const PlayerCard = memo(({ 
    player, 
    locationId, 
    profiles, 
    onToggleFixed, 
    onRemove, 
    onUpdateName, 
    onUpdateNumber,
    onUpdateSkill,
    onSaveProfile,
    onRevertProfile,
    isCompact = false,
    forceDragStyle = false
}: { 
    player: Player; 
    locationId: string; 
    profiles: Map<string, PlayerProfile>;
    onToggleFixed: (id: string) => void; 
    onRemove: (id: string) => void; 
    onUpdateName: (id: string, name: string) => void; 
    onUpdateNumber: (id: string, number: string) => void;
    onUpdateSkill: (id: string, skill: number) => void;
    onSaveProfile: (id: string) => void;
    onRevertProfile: (id: string) => void;
    isCompact?: boolean;
    forceDragStyle?: boolean;
}) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: player.id,
    data: { fromId: locationId, player },
    disabled: player.isFixed,
  });

  const style = { 
      transform: CSS.Transform.toString(transform), 
      transition, 
      opacity: isDragging ? 0 : 1, // Hide original when dragging (overlay is used)
      zIndex: isDragging ? 50 : 'auto',
  };
  
  const isFixed = player.isFixed;
  const profile = player.profileId ? profiles.get(player.profileId) : undefined;
  const hasProfile = !!profile;
  const profileMatch = hasProfile && profile!.name === player.name && profile!.skillLevel === player.skillLevel;

  const handleSaveName = useCallback((val: string) => onUpdateName(player.id, val), [onUpdateName, player.id]);
  const handleSaveNumber = useCallback((val: string) => onUpdateNumber(player.id, val), [onUpdateNumber, player.id]);
  const handleUpdateSkill = useCallback((l: number) => onUpdateSkill(player.id, l), [onUpdateSkill, player.id]);
  const handleSaveProfile = useCallback(() => onSaveProfile(player.id), [onSaveProfile, player.id]);
  const handleRevertProfile = useCallback(() => onRevertProfile(player.id), [onRevertProfile, player.id]);
  const handleToggleFixed = useCallback(() => onToggleFixed(player.id), [onToggleFixed, player.id]);
  const handleRemove = useCallback(() => onRemove(player.id), [onRemove, player.id]);

  // Performance Optimization for Dragging:
  // Using opaque colors (bg-slate-100) instead of blurs (backdrop-blur) for the drag overlay
  // reduces GPU load significantly, eliminating lag.
  const containerClass = forceDragStyle
    ? `bg-slate-100 dark:bg-slate-800 border-2 border-indigo-500 shadow-2xl scale-105 z-50`
    : `bg-white/40 dark:bg-white/[0.03] hover:bg-white/60 dark:hover:bg-white/[0.06] border-transparent hover:border-black/5 dark:hover:border-white/10 transition-all duration-300`;

  const fixedClass = isFixed 
    ? 'bg-amber-500/5 border-amber-500/20 shadow-sm shadow-amber-500/5' 
    : '';

  return (
    <div ref={setNodeRef} style={style} className={`
        group relative flex items-center justify-between rounded-xl border
        ${isCompact ? 'p-1.5 min-h-[44px]' : 'p-1.5 min-h-[50px]'}
        ${forceDragStyle ? containerClass : (isFixed ? fixedClass : containerClass)}
    `}>
      
      {/* Left Section: Grip + Number + Name/Stars (Responsive flex-1) */}
      <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
        {/* Grip Handle - Retains touch-none to claim pointer events for drag */}
        <div {...attributes} {...listeners} className={`cursor-grab active:cursor-grabbing p-1 -ml-0.5 touch-none flex-shrink-0 ${isFixed ? 'cursor-not-allowed opacity-30' : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400'}`}>
          <GripVertical size={14} />
        </div>
        
        {/* Editable Number */}
        {!isCompact && <EditableNumber number={player.number} onSave={handleSaveNumber} />}
        {isCompact && player.number && <span className="text-[10px] font-bold text-slate-400">#{player.number}</span>}

        <div className="flex flex-col min-w-0 flex-1 pr-0.5 relative justify-center">
          <EditableTitle name={player.name} onSave={handleSaveName} isPlayer={true} className={`font-bold ${isCompact ? 'text-xs' : 'text-sm'} text-slate-800 dark:text-slate-200`} />
          {/* Always show skill selector, but adjust size if compact */}
          <div className="relative z-20 -mt-0.5">
            <SkillSelector level={player.skillLevel} onChange={handleUpdateSkill} size={isCompact ? 9 : 10} />
          </div>
        </div>
      </div>
      
      {/* Right Section: Actions (Fixed width, does not shrink) */}
      <div className="flex items-center gap-0.5 flex-shrink-0 ml-0.5 pl-1 relative z-30">
        <SyncIndicator 
            player={player}
            hasProfile={hasProfile}
            profileMatch={profileMatch} 
            onSave={handleSaveProfile}
            onRevert={handleRevertProfile}
        />
        
        <button onClick={handleToggleFixed} onPointerDown={e => e.stopPropagation()} 
            className={`
                p-1 rounded-lg transition-all relative
                ${isFixed ? 'bg-amber-500 text-white shadow-sm' : 'bg-transparent text-slate-300 hover:text-slate-600 dark:hover:text-slate-300'}
            `} 
            title={isFixed ? t('teamManager.unlockPlayer') : t('teamManager.lockPlayer')}
        >
            {isFixed ? <Lock size={12} fill="currentColor" /> : <Pin size={12} />}
        </button>
        <button onClick={handleRemove} onPointerDown={e => e.stopPropagation()} className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-500/10 transition-colors">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}, (prev, next) => {
    return (
        prev.player === next.player && 
        prev.locationId === next.locationId &&
        prev.profiles === next.profiles &&
        prev.isCompact === next.isCompact &&
        prev.forceDragStyle === next.forceDragStyle
    );
});

const AddPlayerInput = memo(({ onAdd, disabled }: { onAdd: (name: string, number?: string, skill?: number) => void; disabled?: boolean }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [skill, setSkill] = useState(3);
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => { if(isOpen) inputRef.current?.focus(); }, [isOpen]);

    const submit = () => {
        if(name.trim()) { 
            onAdd(name.trim(), number.trim() || undefined, skill); 
            setName('');
            setNumber('');
            setSkill(3);
        }
        inputRef.current?.focus();
    };

    if (isOpen && !disabled) {
        return (
            <div className="flex flex-col mt-2 animate-in fade-in slide-in-from-top-1 bg-white/60 dark:bg-white/[0.04] p-2 rounded-xl border border-black/5 dark:border-white/5 shadow-sm ring-1 ring-black/5">
                {/* Row 1: Name */}
                <input ref={inputRef}
                    className="w-full bg-transparent border-b border-black/10 dark:border-white/10 px-1 py-1.5 text-sm text-slate-800 dark:text-white focus:outline-none font-medium placeholder:text-slate-400 mb-2"
                    placeholder={t('teamManager.addPlayerPlaceholder')} value={name} onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if(e.key === 'Enter') submit(); if(e.key === 'Escape') setIsOpen(false); }}
                />
                
                {/* Row 2: Details */}
                <div className="flex items-center gap-2">
                    <input 
                        className="w-12 text-center bg-white/50 dark:bg-black/20 rounded-lg border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-black/40 px-1 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                        placeholder="#"
                        value={number}
                        onChange={e => setNumber(e.target.value)}
                        maxLength={3}
                    />
                    
                    <div className="flex-1 flex items-center justify-center bg-white/30 dark:bg-white/5 rounded-lg px-2 py-1">
                        <SkillSelector level={skill} onChange={setSkill} size={12} />
                    </div>

                    <button onClick={submit} className="p-1.5 bg-indigo-500 rounded-lg hover:bg-indigo-400 text-white shadow-md active:scale-95 transition-transform"><Plus size={16} /></button>
                </div>
            </div>
        );
    }
    return (
        <button onClick={() => !disabled && setIsOpen(true)} disabled={disabled}
            className={`mt-2 w-full py-2.5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-dashed transition-all ${disabled ? 'border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed' : 'border-slate-300 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`} >
            {disabled ? (<><Ban size={12} /> {t('common.full')}</>) : (<><Plus size={12} /> {t('common.add')}</>)}
        </button>
    );
});

// Optimized TeamColumn with Chameleon Effect
const TeamColumn = memo(({ 
    id, 
    team, 
    profiles,
    onUpdateTeamName, 
    onUpdateTeamColor,
    onUpdatePlayerName, 
    onUpdatePlayerNumber,
    onUpdateSkill,
    onSaveProfile,
    onRevertProfile,
    onAddPlayer, 
    onToggleFixed, 
    onRemove, 
    usedColors,
    isQueue = false,
    onSortTeam
}: { 
    id: string; 
    team: Team; 
    profiles: Map<string, PlayerProfile>;
    onUpdateTeamName: (id: string, name: string) => void; 
    onUpdateTeamColor: (id: string, color: TeamColor) => void;
    onUpdatePlayerName: (pid: string, n: string) => void; 
    onUpdatePlayerNumber: (pid: string, n: string) => void;
    onUpdateSkill: (pid: string, s: number) => void;
    onSaveProfile: (pid: string) => void;
    onRevertProfile: (pid: string) => void;
    onAddPlayer: (name: string, number?: string, skill?: number) => void; 
    onToggleFixed: (playerId: string) => void; 
    onRemove: (id: string) => void; 
    usedColors: Set<string>;
    isQueue?: boolean;
    onSortTeam: (teamId: string, criteria: 'name' | 'number' | 'skill') => void;
}) => {
  const { t } = useTranslation();
  const [showSortMenu, setShowSortMenu] = useState(false);
  const isFull = team.players.length >= 6;
  const { setNodeRef, isOver } = useSortable({ id: id, data: { type: 'container', containerId: id } });
  
  const teamStrength = useMemo(() => calculateTeamStrength(team.players), [team.players]);

  // Use Dynamic Resolver
  const colorConfig = resolveTheme(team.color);

  const handleUpdateName = useCallback((n: string) => onUpdateTeamName(id, n), [onUpdateTeamName, id]);
  const handleUpdateColor = useCallback((c: TeamColor) => onUpdateTeamColor(id, c), [onUpdateTeamColor, id]);

  return (
    <div ref={setNodeRef} 
         className={`
            flex flex-col w-full h-full p-4 rounded-[2rem] border backdrop-blur-2xl transition-all duration-500
            bg-white/40 dark:bg-[#0f172a]/60 
            bg-gradient-to-b ${colorConfig.gradient}
            ${colorConfig.border}
            ${isQueue ? 'opacity-80 scale-[0.98] grayscale-[0.3] hover:opacity-100 hover:scale-100 hover:grayscale-0' : 'shadow-xl shadow-black/5'}
            ${isOver ? `ring-2 ${colorConfig.ring} ring-offset-2 ring-offset-slate-100 dark:ring-offset-black` : ''}
         `}
    >
      <div className="flex flex-col mb-4">
        <div className="flex items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-3 mb-2">
            {/* Indicator Pill */}
            <div className={`w-1.5 self-stretch rounded-full ${colorConfig.halo} shadow-[0_0_10px_currentColor] opacity-90`} />
            
            <div className="flex-1 min-w-0">
                <span className={`text-[10px] font-bold uppercase tracking-widest opacity-70 ${colorConfig.text}`}>{t('teamManager.teamLabel')}</span>
                <EditableTitle name={team.name} onSave={handleUpdateName} className={`text-lg font-black uppercase tracking-tight ${colorConfig.text} ${colorConfig.textDark}`} />
            </div>
            
            {/* Sort & Strength Group */}
            <div className="flex items-center gap-2">
                {/* Sort Button */}
                <div className="relative">
                    <button 
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        className={`p-1.5 rounded-lg border border-transparent hover:border-black/5 dark:hover:border-white/5 hover:bg-black/5 dark:hover:bg-white/10 ${showSortMenu ? 'bg-black/5 dark:bg-white/10' : ''}`}
                    >
                        <ListFilter size={14} className={`${colorConfig.text}`} />
                    </button>
                    <AnimatePresence>
                        {showSortMenu && (
                            <motion.div 
                                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-black/5 dark:border-white/10 p-1 flex flex-col min-w-[120px]"
                            >
                                <button onClick={() => { onSortTeam(id, 'name'); setShowSortMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-left">
                                    <ArrowDownAZ size={14} /> Name
                                </button>
                                <button onClick={() => { onSortTeam(id, 'number'); setShowSortMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-left">
                                    <ArrowDown01 size={14} /> Number
                                </button>
                                <button onClick={() => { onSortTeam(id, 'skill'); setShowSortMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-left">
                                    <ArrowUpWideNarrow size={14} /> Skill
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Player Count Badge */}
                <div className={`
                    px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 shadow-sm
                    ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text}
                `}>
                    <Users size={10} strokeWidth={2.5} /> {team.players.length}
                </div>

                {/* Strength Badge */}
                <div className={`
                    px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 shadow-sm
                    ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text}
                `}>
                    <Star size={10} fill="currentColor" /> {teamStrength}
                </div>
            </div>
        </div>
        
        {/* Color Picker with Unique Checks */}
        <ColorPicker 
            selected={team.color || 'slate'} 
            onChange={handleUpdateColor} 
            usedColors={usedColors}
        />
      </div>

      <div className={`flex-1 space-y-1 mt-1 ${isQueue ? 'min-h-[40px]' : 'min-h-[60px]'}`}>
        {team.players.length === 0 && <span className="text-[10px] text-slate-400 italic py-6 block text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl bg-slate-50/50 dark:bg-white/[0.01]">{t('teamManager.dragPlayersHere')}</span>}
        <SortableContextFixed items={team.players.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {team.players.map(p => (
            <PlayerCard 
                key={p.id} 
                player={p} 
                locationId={id} 
                profiles={profiles}
                onToggleFixed={onToggleFixed} 
                onRemove={onRemove} 
                onUpdateName={onUpdatePlayerName} 
                onUpdateNumber={onUpdatePlayerNumber}
                onUpdateSkill={onUpdateSkill}
                onSaveProfile={onSaveProfile}
                onRevertProfile={onRevertProfile}
                isCompact={isQueue}
            />
          ))}
        </SortableContextFixed>
      </div>
      {!isQueue && <AddPlayerInput onAdd={onAddPlayer} disabled={isFull} />}
      {/* For queue teams, allow adding as long as not full, it effectively adds to the end of the queue list logic-wise */}
      {isQueue && <AddPlayerInput onAdd={onAddPlayer} disabled={isFull} />}
    </div>
  );
});

// Separated Batch Input to avoid re-rendering main modal on keystrokes
const BatchInputSection = memo(({ onGenerate }: { onGenerate: (names: string[]) => void }) => {
    const { t } = useTranslation();
    const [rawNames, setRawNames] = useState('');

    const handleGenerate = () => {
        const names = rawNames.split('
').map(n => n.trim()).filter(n => n);
        if (names.length > 0) {
            onGenerate(names);
            setRawNames('');
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 px-1 pb-10"> 
            <textarea className="w-full h-64 bg-white/50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm resize-none custom-scrollbar"
               placeholder={t('teamManager.batchInputPlaceholder')} value={rawNames} onChange={e => setRawNames(e.target.value)} />
            <Button onClick={handleGenerate} className="w-full" size="lg"><Shuffle size={18} /> {t('teamManager.generateTeams')}</Button>
        </div>
    );
});


// --- MAIN MODAL ---

export const TeamManagerModal: React.FC<TeamManagerModalProps> = (props) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'roster' | 'profiles' | 'input'>('roster');
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // OPTIMIZATION: Memoize sensors to avoid re-creating on every render
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor),
    useSensor(TouchSensor) // Add TouchSensor for better mobile support
  );
  
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (props.deletedCount > 0) {
      setUndoVisible(true);
      timer = setTimeout(() => {
        setUndoVisible(false);
        setTimeout(() => props.onCommitDeletions(), 200);
      }, 5000);
    } else {
      setUndoVisible(false);
    }
    return () => clearTimeout(timer);
  }, [props.deletedCount, props.onCommitDeletions]);

  // Drag Logic Helpers - wrapped in useCallback for stability if passed down (though here used internally)
  const findContainer = useCallback((id: string) => {
    if (id === 'A' || props.courtA.players.some(p => p.id === id)) return 'A';
    if (id === 'B' || props.courtB.players.some(p => p.id === id)) return 'B';
    for (const team of props.queue) { if (team.id === id || team.players.some(p => p.id === id)) return team.id; }
    return null;
  }, [props.courtA, props.courtB, props.queue]);

  const getTeamById = (id: string) => {
      if (id === 'A') return props.courtA;
      if (id === 'B') return props.courtB;
      return props.queue.find(t => t.id === id);
  };

  const playersById = useMemo(() => {
    const map = new Map<string, Player>();
    [...props.courtA.players, ...props.courtB.players, ...props.queue.flatMap(t => t.players)].forEach(p => map.set(p.id, p));
    return map;
  }, [props.courtA, props.courtB, props.queue]);

  // Determine Used Colors - Memoized
  const usedColors = useMemo(() => {
      const set = new Set<string>();
      if (props.courtA.color) set.add(props.courtA.color);
      if (props.courtB.color) set.add(props.courtB.color);
      props.queue.forEach(t => { if(t.color) set.add(t.color) });
      return set;
  }, [props.courtA.color, props.courtB.color, props.queue]);

  // OPTIMIZATION: Memoize filtering logic
  const filteredProfiles = useMemo(() => {
      return Array.from(props.profiles.values())
          .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .sort((a, b) => a.name.localeCompare(b.name));
  }, [props.profiles, searchTerm]);

  // --- DND HANDLERS ---

  const handleDragStart = (event: DragStartEvent) => {
    const player = playersById.get(event.active.id as string);
    if (player) setActivePlayer(player);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) return;

    // Handle Moving BETWEEN Containers during Drag (Visual Feedback)
    if (activeContainer !== overContainer) {
        const overTeam = getTeamById(overContainer);
        if (!overTeam) return;

        const activeIndex = active.data.current?.sortable.index;
        const overIndex = over.data.current?.sortable.index ?? overTeam.players.length + 1;

        props.onMove(activeId, activeContainer, overContainer, overIndex);
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePlayer(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (activeContainer && overContainer) {
        const overTeam = getTeamById(overContainer);
        if (!overTeam) return;

        const activeIndex = active.data.current?.sortable.index;
        const overIndex = over.data.current?.sortable.index;

        // If containers are same, check if reorder is needed
        if (activeContainer === overContainer && activeIndex !== overIndex) {
             props.onMove(activeId, activeContainer, overContainer, overIndex);
        }
        // If containers different, handleDragOver likely handled it, but ensure final position
        else if (activeContainer !== overContainer) {
             props.onMove(activeId, activeContainer, overContainer, overIndex ?? overTeam.players.length);
        }
    }
  };
  
  const handleGenerate = useCallback((names: string[]) => {
      props.onGenerate(names);
      setActiveTab('roster');
  }, [props.onGenerate]);

  const getProfileStatus = (profileId: string): PlayerLocationStatus => {
      if (props.courtA.players.some(p => p.profileId === profileId)) return 'A';
      if (props.courtB.players.some(p => p.profileId === profileId)) return 'B';
      for (const t of props.queue) {
          if (t.players.some(p => p.profileId === profileId)) return 'Queue';
      }
      return null;
  };

  // Stabilize handlers for TeamColumn
  const handleAddA = useCallback((n: string, num?: string, s?: number) => props.onAddPlayer(n, 'A', num, s), [props.onAddPlayer]);
  const handleAddB = useCallback((n: string, num?: string, s?: number) => props.onAddPlayer(n, 'B', num, s), [props.onAddPlayer]);
  const handleAddQueue = useCallback((n: string, num?: string, s?: number) => props.onAddPlayer(n, 'Queue', num, s), [props.onAddPlayer]);

  // Tab Button Helper
  const TabButton = ({ id, label, icon: Icon }: any) => (
      <button 
        onClick={() => setActiveTab(id)} 
        className={`
            relative px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all
            ${activeTab === id 
                ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'}
        `}
      >
          <Icon size={14} strokeWidth={2.5} />
          {label}
      </button>
  );

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title={t('teamManager.title')} maxWidth="max-w-[95vw] md:max-w-7xl">
      
      {/* --- HEADER CONTROL DECK --- */}
      <div className="sticky top-0 z-[100] mb-6 -mx-1 px-1">
          <div className="bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-2 shadow-lg shadow-black/5 dark:shadow-black/20 flex flex-col md:flex-row gap-3">
              
              {/* TABS (Segmented Control) */}
              <div className="flex bg-slate-200/50 dark:bg-black/20 p-1 rounded-2xl gap-1 flex-1">
                  <TabButton id="roster" label={t('teamManager.tabs.roster')} icon={List} />
                  <TabButton id="profiles" label={t('teamManager.tabs.profiles')} icon={Users} />
                  <TabButton id="input" label={t('teamManager.tabs.batch')} icon={Upload} />
              </div>

              {/* ACTIONS (Right Side) */}
              {activeTab === 'roster' && (
                  <div className="flex items-center gap-4 p-1 rounded-2xl overflow-x-auto no-scrollbar">
                      
                      {/* Rotation Mode Switch (Distinct Group) */}
                      <div className="flex items-center bg-slate-200/50 dark:bg-black/20 p-1 rounded-xl">
                          <button 
                             onClick={() => props.onSetRotationMode('standard')}
                             className={`
                                px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2
                                ${props.rotationMode === 'standard' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'}
                             `}
                             title={t('teamManager.modes.standardTooltip')}
                          >
                              <Layers size={14} /> 
                              <span className="hidden sm:inline">{t('teamManager.modes.standard')}</span>
                          </button>
                          <button 
                             onClick={() => props.onSetRotationMode('balanced')}
                             className={`
                                px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2
                                ${props.rotationMode === 'balanced' ? 'bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'}
                             `}
                             title={t('teamManager.modes.balancedTooltip')}
                          >
                              <Shuffle size={14} />
                              <span className="hidden sm:inline">{t('teamManager.modes.balanced')}</span>
                          </button>
                      </div>

                      {/* Main Action Button (Standalone) */}
                      <button 
                        onClick={props.onBalanceTeams}
                        className={`
                            px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-white shadow-lg flex items-center gap-2 whitespace-nowrap transition-transform active:scale-95 border-t border-white/20
                            ${props.rotationMode === 'balanced' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}
                        `}
                      >
                         {props.rotationMode === 'balanced' ? <><Shuffle size={16} /> {t('teamManager.actions.globalBalance')}</> : <><RefreshCw size={16} /> {t('teamManager.actions.restoreOrder')}</>}
                      </button>
                  </div>
              )}

              {/* SEARCH (Profiles Tab) */}
              {activeTab === 'profiles' && (
                  <div className="flex-1 w-full md:w-auto md:max-w-xs">
                      <div className="relative group">
                          <div className="absolute inset-0 bg-slate-200/50 dark:bg-black/20 rounded-xl transition-all group-focus-within:ring-2 group-focus-within:ring-indigo-500/30" />
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                          <input 
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder={t('teamManager.searchProfiles') || "Search profiles..."}
                              className="relative w-full bg-transparent border-none rounded-xl pl-10 pr-9 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none placeholder:text-slate-400 placeholder:font-medium"
                          />
                          {searchTerm && (
                              <button 
                                  onClick={() => setSearchTerm('')}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                              >
                                  <X size={14} />
                              </button>
                          )}
                      </div>
                  </div>
              )}
          </div>
      </div>

      {activeTab === 'input' && (
        <BatchInputSection onGenerate={handleGenerate} />
      )}

      {activeTab === 'profiles' && (
          <div className="pb-12 animate-in fade-in slide-in-from-bottom-2">
               {props.profiles.size === 0 ? (
                   <div className="text-center py-20 text-slate-400 italic">
                       {t('teamManager.emptyProfiles')}
                   </div>
               ) : filteredProfiles.length === 0 ? (
                   <div className="text-center py-20 text-slate-400 italic flex flex-col items-center gap-2">
                       <Search size={24} className="opacity-50" />
                       <span>No profiles found matching "{searchTerm}"</span>
                   </div>
               ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredProfiles.map(profile => (
                           <ProfileCard 
                              key={profile.id}
                              profile={profile}
                              onUpdate={(n, s) => props.upsertProfile && props.upsertProfile(n, s, profile.id)}
                              onDelete={() => props.deleteProfile && props.deleteProfile(profile.id)}
                              onAddToGame={(target) => props.onAddPlayer(profile.name, target)}
                              status={getProfileStatus(profile.id)}
                           />
                      ))}
                   </div>
               )}
          </div>
      )}

      {activeTab === 'roster' && (
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragStart={handleDragStart} 
            onDragOver={handleDragOver} 
            onDragEnd={handleDragEnd}
        >
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start pb-24 px-1 min-h-[60vh]">
            
            <TeamColumn 
                id="A" team={props.courtA}
                {...props}
                onUpdateSkill={props.onUpdatePlayerSkill} 
                onAddPlayer={handleAddA}
                usedColors={usedColors}
            />
            
            <TeamColumn 
                id="B" team={props.courtB}
                {...props}
                onUpdateSkill={props.onUpdatePlayerSkill} 
                onAddPlayer={handleAddB}
                usedColors={usedColors}
            />
            
            {/* Queue Teams - Displayed Individually */}
            {props.queue.map((team) => (
                <TeamColumn 
                    key={team.id}
                    id={team.id} 
                    team={team}
                    {...props}
                    onUpdateSkill={props.onUpdatePlayerSkill} 
                    onAddPlayer={handleAddQueue} 
                    usedColors={usedColors}
                    isQueue={true}
                />
            ))}
            
            {props.queue.length === 0 && (
                <div className="hidden md:flex items-center justify-center h-40 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2rem] text-slate-400 font-bold text-xs uppercase tracking-widest">
                    {t('teamManager.queueEmpty')}
                </div>
            )}
            
          </div>
          
        </DndContext>
      )}

       <div 
         className={`
            fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] 
            transition-all duration-300 cubic-bezier(0.175, 0.885, 0.32, 1.275)
            ${undoVisible && props.canUndoRemove ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90 pointer-events-none'}
         `}
       >
         <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl border border-white/10 flex items-center gap-4">
            <span className="text-xs font-bold text-slate-300 tracking-wide">{t('teamManager.playerRemoved')}</span>
            <div className="h-4 w-px bg-white/20"></div>
            <button onClick={props.onUndoRemove} className="flex items-center gap-1.5 text-xs font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider">
              <Undo2 size={16} /> {t('teamManager.undo')}
            </button>
         </div>
       </div>
       
       {createPortal(
            <DragOverlayFixed dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
              {activePlayer ? (
                <div className="w-[300px]">
                    <PlayerCard 
                        player={activePlayer} locationId="" profiles={props.profiles}
                        onToggleFixed={() => {}} onRemove={() => {}} onUpdateName={() => {}} onUpdateNumber={()=>{}} onUpdateSkill={()=>{}} onSaveProfile={()=>{}} onRevertProfile={()=>{}}
                        forceDragStyle={true}
                    />
                </div>
              ) : null}
            </DragOverlayFixed>,
            document.body
       )}
    </Modal>
  );
};
