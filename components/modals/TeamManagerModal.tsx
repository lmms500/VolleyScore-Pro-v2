
import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Team, Player, RotationMode, PlayerProfile } from '../../types';
import { calculateTeamStrength } from '../../utils/balanceUtils';
import { Pin, Trash2, Shuffle, ArrowRight, Edit2, GripVertical, Plus, Undo2, Ban, Star, Save, RefreshCw, AlertCircle, CheckCircle2, User, Upload, List, UserPlus, Shield, PlayCircle } from 'lucide-react';
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
  onUpdatePlayerName: (playerId: string, name: string) => void;
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

// --- SUB-COMPONENTS ---

const SkillSelector: React.FC<{ level: number, onChange: (l: number) => void }> = ({ level, onChange }) => {
    return (
        <div className="flex gap-0.5" onPointerDown={(e) => e.stopPropagation()}>
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
};

const SyncIndicator: React.FC<{ player: Player, profiles: Map<string, PlayerProfile>, onSave: () => void, onRevert: () => void }> = ({ player, profiles, onSave, onRevert }) => {
    const profile = player.profileId ? profiles.get(player.profileId) : undefined;
    
    let status: 'synced' | 'desynced' | 'unlinked' = 'unlinked';
    if (profile) {
        if (profile.name !== player.name || profile.skillLevel !== player.skillLevel) status = 'desynced';
        else status = 'synced';
    }

    const config = {
        synced: { color: 'bg-emerald-500', icon: CheckCircle2, text: 'Synced' },
        desynced: { color: 'bg-amber-500', icon: AlertCircle, text: 'Unsaved Changes' },
        unlinked: { color: 'bg-slate-300 dark:bg-slate-600', icon: User, text: 'No Profile' }
    }[status];

    return (
        <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${config.color} shadow-[0_0_5px_currentColor]`} title={config.text} />
            
            {status !== 'synced' && (
                <div className="flex gap-1 animate-in fade-in zoom-in duration-200">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onSave(); }}
                        className={`p-1.5 rounded-md text-white shadow-sm hover:scale-105 transition-all ${status === 'desynced' ? 'bg-amber-500 hover:bg-amber-400' : 'bg-slate-400 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500'}`}
                        title={status === 'desynced' ? "Update Profile" : "Create Profile"}
                     >
                         <Save size={12} />
                     </button>
                     {status === 'desynced' && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); onRevert(); }}
                            className="p-1.5 rounded-md bg-white/10 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Revert to Profile Data"
                         >
                             <Undo2 size={12} />
                         </button>
                     )}
                </div>
            )}
        </div>
    );
};

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
};

// --- PROFILE CARD COMPONENT ---

const ProfileCard: React.FC<{
    profile: PlayerProfile;
    onUpdate: (name: string, skill: number) => void;
    onDelete: () => void;
    onAddToGame: (target: 'A' | 'B' | 'Queue') => void;
    status: PlayerLocationStatus;
}> = ({ profile, onUpdate, onDelete, onAddToGame, status }) => {
    
    // Configuração Visual baseada no Status
    const statusConfig = {
        A: { bg: 'bg-indigo-500/10 border-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', label: 'Court A' },
        B: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-600 dark:text-rose-400', label: 'Court B' },
        Queue: { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-600 dark:text-slate-400', label: 'In Queue' },
        null: { bg: 'bg-transparent', text: '', label: '' }
    }[status || 'null'];

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
                    onSave={(val) => onUpdate(val, profile.skillLevel)} 
                    isPlayer={true} 
                    className="font-bold text-sm text-slate-800 dark:text-slate-200" 
                 />
                 <div className="mt-1">
                    <SkillSelector 
                        level={profile.skillLevel} 
                        onChange={(l) => onUpdate(profile.name, l)} 
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
                         <Button size="sm" onClick={() => onAddToGame('A')} className="h-7 px-2 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white border-indigo-500/20" title="Add to A">
                             A
                         </Button>
                         <Button size="sm" onClick={() => onAddToGame('B')} className="h-7 px-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white border-rose-500/20" title="Add to B">
                             B
                         </Button>
                         <Button size="sm" onClick={() => onAddToGame('Queue')} className="h-7 px-2 bg-slate-500/10 text-slate-600 hover:bg-slate-500 hover:text-white border-slate-500/20" title="Add to Queue">
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
};

const PlayerCard: React.FC<{ 
    player: Player; 
    locationId: string; 
    profiles: Map<string, PlayerProfile>;
    onToggleFixed: (id: string) => void; 
    onRemove: (id: string) => void; 
    onUpdateName: (id: string, name: string) => void; 
    onUpdateSkill: (id: string, skill: number) => void;
    onSaveProfile: (id: string) => void;
    onRevertProfile: (id: string) => void;
}> = ({ player, locationId, profiles, onToggleFixed, onRemove, onUpdateName, onUpdateSkill, onSaveProfile, onRevertProfile }) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: player.id,
    data: { fromId: locationId, player },
    disabled: player.isFixed,
  });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, touchAction: 'none' };

  return (
    <div ref={setNodeRef} style={style} className={`group relative flex items-center justify-between p-2 rounded-xl border transition-all ${player.isFixed ? 'bg-indigo-500/10 border-indigo-500/30 cursor-not-allowed' : 'bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/20 shadow-sm'}`}>
      
      {/* Left Section: Grip + Name/Stars (Responsive flex-1) */}
      <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 -ml-1 text-slate-400 dark:text-slate-600 touch-none flex-shrink-0">
          <GripVertical size={16} />
        </div>
        
        <div className="flex flex-col min-w-0 flex-1 pr-1">
          <EditableTitle name={player.name} onSave={(val) => onUpdateName(player.id, val)} isPlayer={true} className="font-bold text-sm text-slate-800 dark:text-slate-200" />
          <div className="mt-0.5">
             <SkillSelector level={player.skillLevel} onChange={(l) => onUpdateSkill(player.id, l)} />
          </div>
        </div>
      </div>
      
      {/* Right Section: Actions (Fixed width, does not shrink) */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-1">
        <SyncIndicator 
            player={player} 
            profiles={profiles} 
            onSave={() => onSaveProfile(player.id)}
            onRevert={() => onRevertProfile(player.id)}
        />
        
        <div className="w-px h-5 bg-black/10 dark:bg-white/10 mx-1"></div>

        <button onClick={() => onToggleFixed(player.id)} onPointerDown={e => e.stopPropagation()} className={`p-1.5 rounded-lg transition-all ${player.isFixed ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'bg-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`} title={player.isFixed ? t('teamManager.unlockPlayer') : t('teamManager.lockPlayer')}>
            <Pin size={14} fill={player.isFixed ? "currentColor" : "none"} />
        </button>
        <button onClick={() => onRemove(player.id)} onPointerDown={e => e.stopPropagation()} className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const AddPlayerInput: React.FC<{ onAdd: (name: string) => void; disabled?: boolean }> = ({ onAdd, disabled }) => {
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
                <button onClick={() => setIsOpen(false)} className="text-[10px] text-slate-400 mt-2 hover:text-slate-600 text-center uppercase font-bold tracking-wider">Done</button>
            </div>
        );
    }
    return (
        <button onClick={() => !disabled && setIsOpen(true)} disabled={disabled}
            className={`mt-2 w-full py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest rounded-xl border border-dashed transition-all ${disabled ? 'border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed' : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`} >
            {disabled ? (<><Ban size={14} /> Full</>) : (<><Plus size={14} /> Add</>)}
        </button>
    );
};

const TeamColumn: React.FC<{ 
    id: string; 
    team: Team; 
    profiles: Map<string, PlayerProfile>;
    onUpdateTeamName: (id: string, name: string) => void; 
    onUpdatePlayerName: (pid: string, n: string) => void; 
    onUpdateSkill: (pid: string, s: number) => void;
    onSaveProfile: (pid: string) => void;
    onRevertProfile: (pid: string) => void;
    onAddPlayer: (name: string) => void; 
    onToggleFixed: (playerId: string) => void; 
    onRemove: (id: string) => void; 
    color: 'indigo' | 'rose' | 'slate'; 
}> = ({ id, team, profiles, onUpdateTeamName, onUpdatePlayerName, onUpdateSkill, onSaveProfile, onRevertProfile, onAddPlayer, onToggleFixed, onRemove, color }) => {
  const { t } = useTranslation();
  const isFull = team.players.length >= 6;
  const { setNodeRef, isOver } = useSortable({ id: id, data: { type: 'container' } });
  
  const teamStrength = useMemo(() => calculateTeamStrength(team.players), [team.players]);

  const theme = {
    indigo: { bg: 'bg-indigo-50/50 dark:bg-indigo-900/10', border: 'border-indigo-100 dark:border-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-300', glow: 'bg-indigo-500' },
    rose: { bg: 'bg-rose-50/50 dark:bg-rose-900/10', border: 'border-rose-100 dark:border-rose-500/20', text: 'text-rose-700 dark:text-rose-300', glow: 'bg-rose-500' },
    slate: { bg: 'bg-slate-50/50 dark:bg-slate-900/30', border: 'border-slate-200 dark:border-slate-800', text: 'text-slate-600 dark:text-slate-400', glow: 'bg-slate-500' }
  };

  return (
    <div ref={setNodeRef} className={`flex flex-col w-full h-fit ${theme[color].bg} p-3 rounded-2xl ${theme[color].border} border transition-all duration-300 ${isOver && !isFull ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900' : ''}`}>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/5 dark:border-white/5 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`w-1.5 h-6 rounded-full flex-shrink-0 ${theme[color].glow}`}></div>
            <div className="flex flex-col min-w-0 flex-1">
                <span className={`text-[9px] font-bold uppercase tracking-wider opacity-60 ${theme[color].text}`}>Team</span>
                <EditableTitle name={team.name} onSave={n => onUpdateTeamName(id, n)} className={`font-black uppercase tracking-tight text-sm ${theme[color].text}`} />
            </div>
        </div>
        
        <div className="flex flex-col items-end flex-shrink-0">
            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white dark:bg-black/20 ${theme[color].text} flex items-center gap-1 shadow-sm border border-black/5 dark:border-white/5 mb-0.5`}>
                <Star size={10} className="fill-current" /> {teamStrength}
            </div>
            <span className={`${isFull ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400'} text-[10px] font-bold`}>{team.players.length}/6</span>
        </div>
      </div>

      <div className="min-h-[60px] space-y-2">
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
};


// --- MAIN MODAL ---

export const TeamManagerModal: React.FC<TeamManagerModalProps> = (props) => {
  const { t } = useTranslation();
  const [rawNames, setRawNames] = useState('');
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
  
  const handleGenerate = () => {
    const names = rawNames.split('\n').map(n => n.trim()).filter(n => n);
    if (names.length > 0) {
      props.onGenerate(names);
      setRawNames('');
      setActiveTab('roster');
    }
  };

  // Logic to determine status of a profile ID in current game
  const getProfileStatus = (profileId: string): PlayerLocationStatus => {
      if (props.courtA.players.some(p => p.profileId === profileId)) return 'A';
      if (props.courtB.players.some(p => p.profileId === profileId)) return 'B';
      // Check Queue
      for (const t of props.queue) {
          if (t.players.some(p => p.profileId === profileId)) return 'Queue';
      }
      return null;
  };

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title={t('teamManager.title')} maxWidth="max-w-[95vw] md:max-w-7xl">
      
      {/* --- RESPONSIVE HEADER --- 
          Corrected z-index and positioning to handle scroll overlap. 
          Added -top-6 to account for Modal padding and solid background to mask content. 
      */}
      <div className="sticky -top-6 z-50 bg-slate-100 dark:bg-[#0a0a0a] border-b border-black/5 dark:border-white/5 -mx-6 px-6 py-4 shadow-sm mb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              
              {/* Tab Switcher - Now Wrap Capable */}
              <div className="flex flex-wrap p-1 bg-slate-200/50 dark:bg-white/5 rounded-xl gap-1">
                <button onClick={() => setActiveTab('roster')} className={`px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'roster' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                    <List size={14} /> Roster
                </button>
                <button onClick={() => setActiveTab('profiles')} className={`px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'profiles' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                    <User size={14} /> Profiles
                </button>
                <button onClick={() => setActiveTab('input')} className={`px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'input' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                    <Upload size={14} /> Batch
                </button>
              </div>

              {/* Actions - Flex Wrap with Gap */}
              {activeTab === 'roster' && (
                  <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto">
                      <div className="flex items-center bg-slate-200/50 dark:bg-white/5 rounded-lg p-1">
                          <button 
                             onClick={() => props.onSetRotationMode('standard')}
                             className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${props.rotationMode === 'standard' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
                          >
                              Standard
                          </button>
                          <button 
                             onClick={() => props.onSetRotationMode('balanced')}
                             className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${props.rotationMode === 'balanced' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500'}`}
                          >
                              Balanced
                          </button>
                      </div>

                      <Button 
                        size="sm" 
                        onClick={props.onBalanceTeams}
                        className={`whitespace-nowrap ${props.rotationMode === 'balanced' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}
                      >
                         {props.rotationMode === 'balanced' ? <><Shuffle size={14} /> Global Balance</> : <><RefreshCw size={14} /> Restore Order</>}
                      </Button>
                  </div>
              )}
          </div>
      </div>

      {activeTab === 'input' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 px-1 pb-10"> 
            <textarea className="w-full h-64 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm resize-none custom-scrollbar"
               placeholder={t('teamManager.batchInputPlaceholder')} value={rawNames} onChange={e => setRawNames(e.target.value)} />
            <Button onClick={handleGenerate} className="w-full" size="lg"><Shuffle size={18} /> {t('teamManager.generateTeams')}</Button>
        </div>
      )}

      {/* Profiles Tab */}
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
                       No profiles saved yet. Sync players in the Roster tab to create profiles.
                   </div>
               )}
          </div>
      )}

      {/* Roster Layout - Vertical on Mobile, Grid on Desktop */}
      {activeTab === 'roster' && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          
          <div className="flex flex-col md:grid md:grid-cols-2 xl:grid-cols-3 gap-6 items-start pb-24 px-1 min-h-[60vh]">
            
            <TeamColumn 
                id="A" team={props.courtA} color="indigo"
                {...props}
                onUpdateSkill={props.onUpdatePlayerSkill} 
                onAddPlayer={(n) => props.onAddPlayer(n, 'A')} 
            />
            
            <TeamColumn 
                id="B" team={props.courtB} color="rose"
                {...props}
                onUpdateSkill={props.onUpdatePlayerSkill} 
                onAddPlayer={(n) => props.onAddPlayer(n, 'B')} 
            />
            
            {/* Queue Column - Improved layout for narrow spaces */}
            <div className="w-full md:col-span-2 xl:col-span-1 bg-slate-100 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col h-fit">
                <h3 className="font-bold text-slate-500 dark:text-slate-400 mb-4 text-xs uppercase tracking-widest flex items-center gap-2 flex-none"><div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600"></div>{t('teamManager.queue')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
                  {props.queue.length === 0 && <div className="text-center py-8 text-slate-400 italic text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl col-span-full">{t('teamManager.queueEmpty')}</div>}
                  {props.queue.map(team => (
                    <TeamColumn 
                        key={team.id} id={team.id} team={team} color="slate"
                        {...props}
                        onUpdateSkill={props.onUpdatePlayerSkill} 
                        onAddPlayer={_ => {}} 
                    />
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-white/5 mt-4"><AddPlayerInput onAdd={(n) => props.onAddPlayer(n, 'Queue')} /></div>
            </div>
          </div>

          {createPortal(
            <DragOverlayFixed>
              {activePlayer ? (
                <div className="scale-105 shadow-2xl opacity-90 cursor-grabbing w-[300px]">
                    <PlayerCard 
                        player={activePlayer} locationId="" profiles={props.profiles}
                        onToggleFixed={() => {}} onRemove={() => {}} onUpdateName={() => {}} onUpdateSkill={()=>{}} onSaveProfile={()=>{}} onRevertProfile={()=>{}}
                    />
                </div>
              ) : null}
            </DragOverlayFixed>,
            document.body
          )}
        </DndContext>
      )}

       {/* Undo Toast */}
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
