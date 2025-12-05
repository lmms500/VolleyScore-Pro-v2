

import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Team, Player, RotationMode, PlayerProfile, TeamColor } from '../../types';
import { calculateTeamStrength } from '../../utils/balanceUtils';
import { Pin, Trash2, Shuffle, ArrowRight, Edit2, GripVertical, Plus, Undo2, Ban, Star, Save, RefreshCw, AlertCircle, CheckCircle2, User, Upload, List, Lock, Hash } from 'lucide-react';
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
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import { useTranslation } from '../../contexts/LanguageContext';
import { TEAM_COLORS, COLOR_KEYS } from '../../utils/colors';
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
  onMove: (playerId: string, fromId: string, toId: string) => void;
  onUpdateTeamName: (teamId: string, name: string) => void;
  onUpdateTeamColor: (teamId: string, color: TeamColor) => void; // NEW
  onUpdatePlayerName: (playerId: string, name: string) => void;
  onUpdatePlayerNumber: (playerId: string, number: string) => void; // NEW
  onUpdatePlayerSkill: (playerId: string, skill: number) => void;
  onSaveProfile: (playerId: string) => void;
  onRevertProfile: (playerId: string) => void;
  onAddPlayer: (name: string, target: 'A' | 'B' | 'Queue') => void;
  onUndoRemove: () => void;
  canUndoRemove: boolean;
  onCommitDeletions: () => void;
  deletedCount: number;
  profiles: Map<string, PlayerProfile>;
  deleteProfile?: (id: string) => void;
  upsertProfile?: (name: string, skill: number, id?: string) => PlayerProfile;
}

type PlayerLocationStatus = 'A' | 'B' | 'Queue' | null;

// --- OPTIMIZED SUB-COMPONENTS ---

const SkillSelector = memo(({ level, onChange }: { level: number, onChange: (l: number) => void }) => {
    return (
        <div className="flex gap-0.5 relative z-20" onPointerDown={(e) => e.stopPropagation()}>
            {[1, 2, 3, 4, 5].map(i => (
                <button 
                   key={i} 
                   onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(i); }}
                   className="focus:outline-none p-0.5 hover:scale-125 transition-transform touch-manipulation cursor-pointer"
                >
                    <Star 
                        size={12} 
                        className={i <= level ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"} 
                    />
                </button>
            ))}
        </div>
    );
});

// PREMIUM COLOR PICKER - Fix Scroll Bug by removing outer AnimatePresence
const ColorPicker = memo(({ selected, onChange }: { selected: TeamColor, onChange: (c: TeamColor) => void }) => {
    return (
        <div 
            className="flex items-center gap-3 overflow-x-auto py-3 px-2 no-scrollbar"
            style={{ 
                maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
            }}
        >
            {COLOR_KEYS.map(color => {
                 const isSelected = selected === color;
                 const theme = TEAM_COLORS[color];
                 
                 return (
                     <button
                        key={color}
                        onClick={() => onChange(color)}
                        className={`
                            relative w-6 h-6 rounded-full transition-all flex items-center justify-center shrink-0
                            ${theme.bg.replace('/10', '')}
                            ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900 ring-slate-400 dark:ring-slate-500 shadow-md scale-110' : 'hover:scale-110 opacity-60 hover:opacity-100'}
                        `}
                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                     >
                        <AnimatePresence>
                            {isSelected && (
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="w-2.5 h-2.5 bg-white rounded-full shadow-sm"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </AnimatePresence>
                     </button>
                 );
            })}
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
            <div className={`w-1.5 h-1.5 rounded-full ${config.color} shadow-[0_0_5px_currentColor]`} title={config.text} />
            
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
            className={`bg-black/5 dark:bg-black/40 text-slate-900 dark:text-white border-b border-indigo-500 outline-none w-full px-1 py-0.5 font-bold ${isPlayer ? 'text-sm' : 'text-xs uppercase tracking-widest'}`}
            value={val} onChange={e => setVal(e.target.value)} onBlur={save}
            onKeyDown={e => { if(e.key === 'Enter') save(); if(e.key === 'Escape') cancel(); }}
            onPointerDown={e => e.stopPropagation()} 
        />
    );
  }
  return (
      <div className={`flex items-center gap-2 group cursor-pointer min-w-0 ${className}`} onClick={() => setIsEditing(true)}>
          <span className="truncate">{name}</span>
          <Edit2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 flex-shrink-0" />
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
                className="w-8 h-8 bg-white dark:bg-black/50 text-center rounded-lg border border-indigo-500 outline-none text-xs font-bold text-slate-800 dark:text-white shadow-sm"
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
                w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-all
                ${number 
                    ? 'bg-white dark:bg-white/10 text-slate-800 dark:text-white border-slate-200 dark:border-white/10 shadow-sm' 
                    : 'bg-transparent text-slate-300 dark:text-slate-600 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 hover:text-slate-400'}
            `}
        >
            {number || <Hash size={12} />}
        </button>
    );
});

// --- PROFILE CARD COMPONENT ---

const ProfileCard = memo(({
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
        A: { bg: 'bg-indigo-500/10 border-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', label: t('teamManager.location.courtA') },
        B: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-600 dark:text-rose-400', label: t('teamManager.location.courtB') },
        Queue: { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-600 dark:text-slate-400', label: t('teamManager.location.queue') },
        null: { bg: 'bg-transparent', text: '', label: '' }
    }[status || 'null'];

    const handleUpdateName = useCallback((val: string) => onUpdate(val, profile.skillLevel), [onUpdate, profile.skillLevel]);
    const handleUpdateSkill = useCallback((l: number) => onUpdate(profile.name, l), [onUpdate, profile.name]);
    const handleAddA = useCallback(() => onAddToGame('A'), [onAddToGame]);
    const handleAddB = useCallback(() => onAddToGame('B'), [onAddToGame]);
    const handleAddQ = useCallback(() => onAddToGame('Queue'), [onAddToGame]);

    return (
        <div className={`
            group flex items-center justify-between p-3 rounded-xl 
            bg-white/60 dark:bg-white/5 border 
            transition-all shadow-sm
            ${status ? statusConfig.bg : 'border-black/5 dark:border-white/5 hover:border-indigo-500/30'}
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
                         <Button size="sm" onClick={handleAddA} className="h-7 px-2 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white border-indigo-500/20" title={t('teamManager.actions.addToA')}>
                             A
                         </Button>
                         <Button size="sm" onClick={handleAddB} className="h-7 px-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white border-rose-500/20" title={t('teamManager.actions.addToB')}>
                             B
                         </Button>
                         <Button size="sm" onClick={handleAddQ} className="h-7 px-2 bg-slate-500/10 text-slate-600 hover:bg-slate-500 hover:text-white border-slate-500/20" title={t('teamManager.actions.addToQueue')}>
                             Q
                         </Button>
                     </div>
                 )}
                 
                 <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-0.5"></div>
                 
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
    onRevertProfile
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
}) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: player.id,
    data: { fromId: locationId, player },
    disabled: player.isFixed,
  });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, touchAction: 'none' };
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

  return (
    <div ref={setNodeRef} style={style} className={`
        group relative flex items-center justify-between p-1.5 rounded-xl border transition-all duration-300
        ${isFixed 
            ? 'bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/20' 
            : 'bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/20 shadow-sm'
        }
    `}>
      
      {/* Left Section: Grip + Number + Name/Stars (Responsive flex-1) */}
      <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
        <div {...attributes} {...listeners} className={`cursor-grab active:cursor-grabbing p-1 -ml-0.5 touch-none flex-shrink-0 ${isFixed ? 'cursor-not-allowed opacity-50' : 'text-slate-400 dark:text-slate-600'}`}>
          <GripVertical size={16} />
        </div>
        
        {/* Editable Number */}
        <EditableNumber number={player.number} onSave={handleSaveNumber} />

        <div className="flex flex-col min-w-0 flex-1 pr-0.5 relative">
          <EditableTitle name={player.name} onSave={handleSaveName} isPlayer={true} className="font-bold text-sm text-slate-800 dark:text-slate-200" />
          <div className="mt-0.5 relative z-20">
             <SkillSelector level={player.skillLevel} onChange={handleUpdateSkill} />
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
        
        <div className="w-px h-5 bg-black/10 dark:bg-white/10 mx-0.5"></div>

        <button onClick={handleToggleFixed} onPointerDown={e => e.stopPropagation()} 
            className={`
                p-1 rounded-lg transition-all relative
                ${isFixed ? 'bg-amber-500 text-amber-900 shadow-md shadow-amber-500/20' : 'bg-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
            `} 
            title={isFixed ? t('teamManager.unlockPlayer') : t('teamManager.lockPlayer')}
        >
            {isFixed ? <Lock size={14} fill="currentColor" /> : <Pin size={14} />}
            {isFixed && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
            )}
        </button>
        <button onClick={handleRemove} onPointerDown={e => e.stopPropagation()} className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-500/10 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}, (prev, next) => {
    // Custom comparison for high performance: Only re-render if player data or dragging state changes
    return (
        prev.player === next.player && 
        prev.locationId === next.locationId &&
        prev.profiles === next.profiles // Map ref check (should be stable from hook)
    );
});

const AddPlayerInput = memo(({ onAdd, disabled }: { onAdd: (name: string) => void; disabled?: boolean }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => { if(isOpen) inputRef.current?.focus(); }, [isOpen]);

    const submit = () => {
        if(name.trim()) { onAdd(name.trim()); setName(''); }
        inputRef.current?.focus();
    };

    if (isOpen && !disabled) {
        return (
            <div className="flex flex-col mt-2 px-1 animate-in fade-in slide-in-from-top-1 bg-white dark:bg-slate-900 p-2 rounded-xl border border-black/5 dark:border-white/10 shadow-lg ring-1 ring-black/5">
                <div className="flex items-center gap-2">
                    <input ref={inputRef}
                        className="flex-1 bg-transparent border-b border-black/10 dark:border-white/10 px-1 py-1 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-medium placeholder:text-slate-400 min-w-0"
                        placeholder={t('teamManager.addPlayerPlaceholder')} value={name} onChange={e => setName(e.target.value)}
                        onKeyDown={e => { if(e.key === 'Enter') submit(); if(e.key === 'Escape') setIsOpen(false); }}
                    />
                    <button onClick={submit} className="p-1.5 bg-indigo-500 rounded-lg hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"><Plus size={16} /></button>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-[10px] text-slate-400 mt-2 hover:text-slate-600 text-center uppercase font-bold tracking-wider">{t('common.done')}</button>
            </div>
        );
    }
    return (
        <button onClick={() => !disabled && setIsOpen(true)} disabled={disabled}
            className={`mt-2 w-full py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest rounded-xl border border-dashed transition-all ${disabled ? 'border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed' : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`} >
            {disabled ? (<><Ban size={14} /> {t('common.full')}</>) : (<><Plus size={14} /> {t('common.add')}</>)}
        </button>
    );
});

// Optimized TeamColumn with React.memo
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
    onRemove
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
    onAddPlayer: (name: string) => void; 
    onToggleFixed: (playerId: string) => void; 
    onRemove: (id: string) => void; 
}) => {
  const { t } = useTranslation();
  const isFull = team.players.length >= 6;
  const { setNodeRef, isOver } = useSortable({ id: id, data: { type: 'container' } });
  
  const teamStrength = useMemo(() => calculateTeamStrength(team.players), [team.players]);

  const colorConfig = TEAM_COLORS[team.color || 'slate'];

  const handleUpdateName = useCallback((n: string) => onUpdateTeamName(id, n), [onUpdateTeamName, id]);
  const handleUpdateColor = useCallback((c: TeamColor) => onUpdateTeamColor(id, c), [onUpdateTeamColor, id]);

  return (
    <div ref={setNodeRef} className={`flex flex-col w-full h-fit ${colorConfig.bg} p-3 rounded-2xl ${colorConfig.border} border transition-all duration-300 ${isOver && !isFull ? `ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900 ${colorConfig.ring}` : ''}`}>
      <div className="flex flex-col mb-2 gap-2">
        <div className="flex items-start justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${colorConfig.halo} shadow-[0_0_10px_currentColor] opacity-80`}></div>
                <div className="flex flex-col min-w-0 flex-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider opacity-60 ${colorConfig.text}`}>{t('teamManager.teamLabel')}</span>
                    <EditableTitle name={team.name} onSave={handleUpdateName} className={`font-black uppercase tracking-tight text-base ${colorConfig.text}`} />
                </div>
            </div>
            
            <div className="flex flex-col items-end flex-shrink-0">
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-black/20 ${colorConfig.text} flex items-center gap-1 shadow-sm border border-black/5 dark:border-white/5 mb-0.5`}>
                    <Star size={10} className="fill-current" /> {teamStrength}
                </div>
                <span className={`${isFull ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400'} text-[10px] font-bold`}>{team.players.length}/6</span>
            </div>
        </div>
        
        {/* Color Picker integrated smoothly */}
        <ColorPicker selected={team.color || 'slate'} onChange={handleUpdateColor} />
      </div>

      <div className="min-h-[60px] space-y-2 mt-1">
        {team.players.length === 0 && <span className="text-xs text-slate-400 italic py-6 block text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">{t('teamManager.dragPlayersHere')}</span>}
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
            />
          ))}
        </SortableContextFixed>
      </div>
      <AddPlayerInput onAdd={onAddPlayer} disabled={isFull} />
    </div>
  );
});

// Separated Batch Input to avoid re-rendering main modal on keystrokes
const BatchInputSection = memo(({ onGenerate }: { onGenerate: (names: string[]) => void }) => {
    const { t } = useTranslation();
    const [rawNames, setRawNames] = useState('');

    const handleGenerate = () => {
        const names = rawNames.split('\n').map(n => n.trim()).filter(n => n);
        if (names.length > 0) {
            onGenerate(names);
            setRawNames('');
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 px-1 pb-10"> 
            <textarea className="w-full h-64 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm resize-none custom-scrollbar"
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

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 10 } }), useSensor(KeyboardSensor));
  
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

  // Drag Logic
  const findContainer = (id: string) => {
    if (id === 'A' || props.courtA.players.some(p => p.id === id)) return 'A';
    if (id === 'B' || props.courtB.players.some(p => p.id === id)) return 'B';
    for (const team of props.queue) { if (team.id === id || team.players.some(p => p.id === id)) return team.id; }
    return null;
  };

  const playersById = useMemo(() => {
    const map = new Map<string, Player>();
    [...props.courtA.players, ...props.courtB.players, ...props.queue.flatMap(t => t.players)].forEach(p => map.set(p.id, p));
    return map;
  }, [props.courtA, props.courtB, props.queue]);

  const handleDragStart = (event: DragStartEvent) => {
    const player = playersById.get(event.active.id as string);
    if (player) setActivePlayer(player);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = findContainer(active.id as string);
    const to = findContainer(over.id as string);
    if (from && to && from !== to) props.onMove(active.id as string, from, to);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        const from = findContainer(active.id as string);
        const to = findContainer(over.id as string);
        if (from && to && from !== to) props.onMove(active.id as string, from, to);
    }
    setActivePlayer(null);
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
  const handleAddA = useCallback((n: string) => props.onAddPlayer(n, 'A'), [props.onAddPlayer]);
  const handleAddB = useCallback((n: string) => props.onAddPlayer(n, 'B'), [props.onAddPlayer]);
  const handleAddQueue = useCallback((n: string) => props.onAddPlayer(n, 'Queue'), [props.onAddPlayer]);

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title={t('teamManager.title')} maxWidth="max-w-[95vw] md:max-w-7xl">
      
      <div className="sticky -top-6 z-50 bg-slate-100 dark:bg-[#0a0a0a] border-b border-black/5 dark:border-white/5 -mx-6 px-6 py-4 shadow-sm mb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              
              <div className="flex flex-wrap p-1 bg-slate-200/50 dark:bg-white/5 rounded-xl gap-1">
                <button onClick={() => setActiveTab('roster')} className={`px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'roster' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                    <List size={14} /> {t('teamManager.tabs.roster')}
                </button>
                <button onClick={() => setActiveTab('profiles')} className={`px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'profiles' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                    <User size={14} /> {t('teamManager.tabs.profiles')}
                </button>
                <button onClick={() => setActiveTab('input')} className={`px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'input' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                    <Upload size={14} /> {t('teamManager.tabs.batch')}
                </button>
              </div>

              {activeTab === 'roster' && (
                  <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto">
                      <div className="flex items-center bg-slate-200/50 dark:bg-white/5 rounded-lg p-1">
                          <button 
                             onClick={() => props.onSetRotationMode('standard')}
                             className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${props.rotationMode === 'standard' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
                             title={t('teamManager.modes.standardTooltip')}
                          >
                              {t('teamManager.modes.standard')}
                          </button>
                          <button 
                             onClick={() => props.onSetRotationMode('balanced')}
                             className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${props.rotationMode === 'balanced' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500'}`}
                             title={t('teamManager.modes.balancedTooltip')}
                          >
                              {t('teamManager.modes.balanced')}
                          </button>
                      </div>

                      <Button 
                        size="sm" 
                        onClick={props.onBalanceTeams}
                        className={`whitespace-nowrap ${props.rotationMode === 'balanced' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}
                      >
                         {props.rotationMode === 'balanced' ? <><Shuffle size={14} /> {t('teamManager.actions.globalBalance')}</> : <><RefreshCw size={14} /> {t('teamManager.actions.restoreOrder')}</>}
                      </Button>
                  </div>
              )}
          </div>
      </div>

      {activeTab === 'input' && (
        <BatchInputSection onGenerate={handleGenerate} />
      )}

      {activeTab === 'profiles' && (
          <div className="pb-12 animate-in fade-in slide-in-from-bottom-2">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from(props.profiles.values())
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(profile => (
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
               {props.profiles.size === 0 && (
                   <div className="text-center py-20 text-slate-400 italic">
                       {t('teamManager.emptyProfiles')}
                   </div>
               )}
          </div>
      )}

      {activeTab === 'roster' && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          
          <div className="flex flex-col md:grid md:grid-cols-2 xl:grid-cols-3 gap-6 items-start pb-24 px-1 min-h-[60vh]">
            
            <TeamColumn 
                id="A" team={props.courtA}
                {...props}
                onUpdateSkill={props.onUpdatePlayerSkill} 
                onAddPlayer={handleAddA} 
            />
            
            <TeamColumn 
                id="B" team={props.courtB}
                {...props}
                onUpdateSkill={props.onUpdatePlayerSkill} 
                onAddPlayer={handleAddB} 
            />
            
            {/* Optimized Queue Column: Reduced padding to maximize card width */}
            <div className="w-full md:col-span-2 xl:col-span-1 bg-slate-100 dark:bg-white/[0.02] p-2 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col h-fit">
                <h3 className="font-bold text-slate-500 dark:text-slate-400 mb-4 px-2 pt-2 text-xs uppercase tracking-widest flex items-center gap-2 flex-none"><div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600"></div>{t('teamManager.queue')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
                  {props.queue.length === 0 && <div className="text-center py-8 text-slate-400 italic text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl col-span-full">{t('teamManager.queueEmpty')}</div>}
                  {props.queue.map(team => (
                    <TeamColumn 
                        key={team.id} id={team.id} team={team}
                        {...props}
                        onUpdateSkill={props.onUpdatePlayerSkill} 
                        onAddPlayer={_ => {}} // Queue teams don't add via input here
                    />
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-white/5 mt-4"><AddPlayerInput onAdd={handleAddQueue} /></div>
            </div>
          </div>

          {createPortal(
            <DragOverlayFixed>
              {activePlayer ? (
                <div className="scale-105 shadow-2xl opacity-90 cursor-grabbing w-[300px]">
                    <PlayerCard 
                        player={activePlayer} locationId="" profiles={props.profiles}
                        onToggleFixed={() => {}} onRemove={() => {}} onUpdateName={() => {}} onUpdateNumber={()=>{}} onUpdateSkill={()=>{}} onSaveProfile={()=>{}} onRevertProfile={()=>{}}
                    />
                </div>
              ) : null}
            </DragOverlayFixed>,
            document.body
          )}
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
    </Modal>
  );
};