import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Team, Player } from '../../types';
import { Pin, Trash2, Shuffle, ArrowRight, Edit2, GripVertical, Plus, Undo2, Ban } from 'lucide-react';
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
  onAddPlayer: (name: string, target: 'A' | 'B' | 'Queue') => void;
  onUndoRemove: () => void;
  canUndoRemove: boolean;
  onCommitDeletions: () => void;
  deletedCount: number;
}

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

const AddPlayerInput: React.FC<{ onAdd: (name: string) => void; disabled?: boolean }> = ({ onAdd, disabled }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => { if(isOpen) inputRef.current?.focus(); }, [isOpen]);

    const submit = () => {
        if(name.trim()) { onAdd(name.trim()); setName(''); }
        setIsOpen(false);
    };

    if (isOpen && !disabled) {
        return (
            <div className="flex flex-col mt-2 px-1 animate-in fade-in slide-in-from-top-1 bg-white/5 dark:bg-black/20 p-3 rounded-xl border border-black/5 dark:border-white/5 shadow-inner">
                <div className="flex items-center gap-2">
                    <input ref={inputRef}
                        className="flex-1 bg-transparent border-b border-black/10 dark:border-white/10 px-1 py-1 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-bold placeholder:font-medium"
                        placeholder={t('teamManager.addPlayerPlaceholder')} value={name} onChange={e => setName(e.target.value)}
                        onKeyDown={e => { if(e.key === 'Enter') submit(); if(e.key === 'Escape') setIsOpen(false); }}
                    />
                    <button onClick={submit} className="p-1.5 bg-indigo-500 rounded-lg hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"><Plus size={14} /></button>
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

const PlayerCard: React.FC<{ player: Player; locationId: string; onToggleFixed: (playerId: string, teamId?: string) => void; onRemove: (id: string) => void; onUpdateName: (id: string, name: string) => void; }> = ({ player, locationId, onToggleFixed, onRemove, onUpdateName }) => {
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
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-500 dark:text-slate-600 touch-none flex-shrink-0">
          <GripVertical size={16} />
        </div>
        
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

const TeamColumn: React.FC<{ id: string; team: Team; onUpdateTeamName: (id: string, name: string) => void; onUpdatePlayerName: (pid: string, n: string) => void; onAddPlayer: (name: string) => void; onToggleFixed: (playerId: string, teamId?: string) => void; onRemove: (id: string) => void; color: 'indigo' | 'rose' | 'slate'; }> = ({ id, team, onUpdateTeamName, onUpdatePlayerName, onAddPlayer, onToggleFixed, onRemove, color }) => {
  const { t } = useTranslation();
  const isFull = team.players.length >= 6;
  const { setNodeRef, isOver } = useSortable({ id: id, data: { type: 'container' } });
  
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
        
        <span className={`${isFull ? 'text-rose-500 dark:text-rose-400' : `${theme[color].text}/50`} text-xs font-bold`}>{team.players.length}/6</span>
      </div>

      <div className="overflow-y-auto custom-scrollbar pr-1 min-h-[60px] max-h-[400px] space-y-2">
        {team.players.length === 0 && <span className="text-xs text-slate-500 dark:text-slate-600 italic px-2 block pt-2">{t('teamManager.dragPlayersHere')}</span>}
        <SortableContextFixed items={team.players.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {team.players.map(p => (
            <PlayerCard key={p.id} player={p} locationId={id} onToggleFixed={onToggleFixed} onRemove={onRemove} onUpdateName={onUpdatePlayerName} />
          ))}
        </SortableContextFixed>
      </div>
      <AddPlayerInput onAdd={onAddPlayer} disabled={isFull} />
    </div>
  );
};

export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({ 
  isOpen, onClose, courtA, courtB, queue, onGenerate, onToggleFixed, onRemove, onMove, onUpdateTeamName, onUpdatePlayerName, onAddPlayer, onUndoRemove, canUndoRemove, onCommitDeletions, deletedCount
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
          
          <div className="flex flex-col md:grid md:grid-cols-3 gap-4 items-start pb-20 min-h-[60vh]">
            <TeamColumn id="A" team={courtA} onUpdateTeamName={onUpdateTeamName} onUpdatePlayerName={onUpdatePlayerName} onAddPlayer={(n) => onAddPlayer(n, 'A')} onToggleFixed={onToggleFixed} onRemove={onRemove} color="indigo" />
            <TeamColumn id="B" team={courtB} onUpdateTeamName={onUpdateTeamName} onUpdatePlayerName={onUpdatePlayerName} onAddPlayer={(n) => onAddPlayer(n, 'B')} onToggleFixed={onToggleFixed} onRemove={onRemove} color="rose" />
            
            <div className="w-full bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col h-fit">
                <h3 className="font-bold text-slate-500 dark:text-slate-400 mb-3 text-xs uppercase tracking-widest flex items-center gap-2 flex-none"><div className="w-2 h-2 rounded-full bg-slate-500 dark:bg-slate-600"></div>{t('teamManager.queue')}</h3>
                <div className="overflow-y-auto custom-scrollbar pr-1 space-y-4 max-h-[60vh]">
                  {queue.length === 0 && <span className="text-xs text-slate-500 dark:text-slate-600 italic px-2">{t('teamManager.queueEmpty')}</span>}
                  {queue.map(team => (
                    <TeamColumn key={team.id} id={team.id} team={team} onUpdateTeamName={onUpdateTeamName} onUpdatePlayerName={onUpdatePlayerName} onAddPlayer={_ => {}} onToggleFixed={onToggleFixed} onRemove={onRemove} color="slate" />
                  ))}
                </div>
                <div className="pt-2 border-t border-black/5 dark:border-white/5 mt-4"><AddPlayerInput onAdd={(n) => onAddPlayer(n, 'Queue')} /></div>
            </div>
          </div>
          {createPortal(
            <DragOverlayFixed>
              {activePlayer ? (
                <PlayerCard player={activePlayer} locationId="" onToggleFixed={() => {}} onRemove={() => {}} onUpdateName={() => {}} />
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