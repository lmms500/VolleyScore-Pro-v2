import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Team, Player } from '../../types';
import { Pin, Trash2, Shuffle, ArrowRight, Edit2, GripVertical, Plus, Undo2, Ban, ArrowLeft, ArrowRight as ArrowRightIcon } from 'lucide-react';
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

// --- Type Definitions ---
interface TeamManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  courtA: Team;
  courtB: Team;
  queue: Team[];
  onGenerate: (names: string[]) => void;
  onToggleFixed: (playerId: string, teamId?: 'A' | 'B') => void;
  onRemove: (id: string) => void;
  onMove: (playerId: string, fromId: string, toId: string) => void;
  onUpdateTeamName: (teamId: string, name: string) => void;
  onAddPlayer: (name: string, target: 'A' | 'B' | 'Queue') => void;
  onUndoRemove: () => void;
  canUndoRemove: boolean;
}

// --- Sub-components ---

const EditableTitle: React.FC<{ name: string; onSave: (val: string) => void; className?: string }> = ({ name, onSave, className }) => {
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

  if(isEditing) {
    return (
        <input 
            ref={inputRef} type="text"
            className="bg-black/50 text-white border-b border-white/50 outline-none w-full max-w-[150px] px-1 py-0.5 text-xs font-bold uppercase tracking-widest"
            value={val} onChange={e => setVal(e.target.value)} onBlur={save}
            onKeyDown={e => { if(e.key === 'Enter') save(); if(e.key === 'Escape') { setIsEditing(false); setVal(name); } }}
        />
    );
  }
  return (
      <div className={`flex items-center gap-2 group cursor-pointer ${className}`} onClick={() => setIsEditing(true)}>
          <span>{name}</span>
          <Edit2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
      </div>
  );
};

const AddPlayerInput: React.FC<{ onAdd: (name: string) => void; disabled?: boolean }> = ({ onAdd, disabled }) => {
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
            <div className="flex items-center gap-2 mt-2 px-1 animate-in fade-in slide-in-from-top-1">
                <input ref={inputRef}
                    className="flex-1 bg-black/40 border border-white/20 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="New player name..." value={name} onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if(e.key === 'Enter') submit(); if(e.key === 'Escape') setIsOpen(false); }}
                    onBlur={() => setTimeout(submit, 100)}
                />
                <button onClick={submit} className="p-1.5 bg-indigo-500 rounded-md hover:bg-indigo-400"><Plus size={14} /></button>
            </div>
        );
    }
    return (
        <button onClick={() => !disabled && setIsOpen(true)} disabled={disabled}
            className={`mt-2 w-full py-2 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-transparent transition-all ${disabled ? 'text-slate-600 cursor-not-allowed opacity-50' : 'text-slate-500 hover:text-white hover:bg-white/5 hover:border-white/5'}`} >
            {disabled ? (<><Ban size={12} /> Roster Full</>) : (<><Plus size={12} /> Add Player</>)}
        </button>
    );
};

const PlayerCard: React.FC<{
  player: Player;
  locationId: string;
  onToggleFixed: (playerId: string, teamId?: 'A' | 'B') => void;
  onRemove: (id: string) => void;
  onMovePlayer: (direction: 'left' | 'right') => void;
  isQueue: boolean;
}> = ({ player, locationId, onToggleFixed, onRemove, onMovePlayer, isQueue }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: player.id,
    data: {
      fromId: locationId,
      player,
    },
    disabled: player.isFixed,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: player.isFixed ? 'auto' : 'none',
  };

  return (
    <div ref={setNodeRef} style={style} className={`group relative flex items-center justify-between p-2 rounded-xl border transition-all ${player.isFixed ? 'bg-indigo-500/10 border-indigo-500/30 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20'}`}>
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-600 touch-none">
          <GripVertical size={16} />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="font-medium text-sm text-slate-200 truncate">{player.name}</span>
          <span className="text-[9px] font-mono text-slate-500/50">#{player.id.slice(0, 4)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!isQueue && (
          <button
            onClick={() => onToggleFixed(player.id, locationId === 'A' || locationId === 'B' ? locationId : undefined)}
            className={`p-1.5 rounded-lg transition-all ${player.isFixed ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'bg-white/5 text-slate-500 hover:text-white'}`}
            title={player.isFixed ? "Unlock Player" : "Lock Player"}
          >
            <Pin size={14} fill={player.isFixed ? "currentColor" : "none"} />
          </button>
        )}
        <button onClick={() => onRemove(player.id)} className="text-slate-600 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

       {/* Mobile-only Move Buttons */}
       <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex md:hidden items-center opacity-0 group-hover:opacity-100 transition-opacity">
          {locationId !== 'B' && (
              <button onClick={() => onMovePlayer('right')} className="p-1 rounded-full bg-slate-700/80 text-white backdrop-blur-sm -mr-1"><ArrowRightIcon size={12} /></button>
          )}
          {locationId !== 'A' && (
               <button onClick={() => onMovePlayer('left')} className="p-1 rounded-full bg-slate-700/80 text-white backdrop-blur-sm"><ArrowLeft size={12} /></button>
          )}
       </div>
    </div>
  );
};

const TeamColumn: React.FC<{
  id: string;
  team: Team;
  onUpdateTeamName: (id: string, name: string) => void;
  onAddPlayer: (name: string) => void;
  onToggleFixed: (playerId: string, teamId?: 'A' | 'B') => void;
  onRemove: (id: string) => void;
  onMovePlayer: (playerId: string, fromId: string, toId: string) => void;
  color: 'indigo' | 'rose' | 'slate';
  isQueue?: boolean;
}> = ({ id, team, onUpdateTeamName, onAddPlayer, onToggleFixed, onRemove, onMovePlayer, color, isQueue = false }) => {
  const isFull = team.players.length >= 6;
  const { setNodeRef, isOver } = useSortable({ id: id, data: { type: 'container' } });

  const theme = {
    indigo: { bg: 'bg-indigo-500/5', border: 'border-indigo-500/10', text: 'text-indigo-400', glow: 'shadow-[0_0_10px_currentColor]' },
    rose: { bg: 'bg-rose-500/5', border: 'border-rose-500/10', text: 'text-rose-400', glow: 'shadow-[0_0_10px_currentColor]' },
    slate: { bg: 'bg-white/[0.02]', border: 'border-white/5', text: 'text-slate-400', glow: 'bg-slate-600' }
  };

  const handleMove = (player: Player, direction: 'left' | 'right') => {
      const fromId = id;
      let toId = '';
      if(direction === 'right') {
          toId = (fromId === 'A') ? (team.id.startsWith('queue') ? team.id : 'Queue') : 'B';
      } else {
          toId = (fromId === 'B') ? (team.id.startsWith('queue') ? team.id : 'Queue') : 'A';
      }
      onMovePlayer(player.id, fromId, toId);
  }

  return (
    <div ref={setNodeRef} className={`flex flex-col h-full ${theme[color].bg} p-4 rounded-2xl ${theme[color].border} transition-all duration-300 ${isOver && !isFull ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : ''}`}>
      <h3 className={`font-bold ${theme[color].text} mb-4 text-xs uppercase tracking-widest flex items-center justify-between`}>
        <span className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${theme[color].glow}`}></div>
          <EditableTitle name={team.name} onSave={n => onUpdateTeamName(id, n)} />
        </span>
        <span className={`${isFull ? 'text-rose-400' : `${theme[color].text}/50`}`}>{team.players.length}/6</span>
      </h3>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[200px] space-y-2">
        {team.players.length === 0 && <span className="text-xs text-slate-600 italic px-2">Drag players here</span>}
        <SortableContext items={team.players.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {team.players.map(p => (
            <PlayerCard
              key={p.id} player={p} locationId={id} onToggleFixed={onToggleFixed} onRemove={onRemove}
              onMovePlayer={(dir) => handleMove(p, dir)} isQueue={isQueue}
            />
          ))}
        </SortableContext>
      </div>
      <AddPlayerInput onAdd={onAddPlayer} disabled={isFull} />
    </div>
  );
};

// --- Main Modal Component ---
export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({ 
  isOpen, onClose, courtA, courtB, queue, onGenerate, onToggleFixed, onRemove, onMove, onUpdateTeamName, onAddPlayer, onUndoRemove, canUndoRemove
}) => {
  const [rawNames, setRawNames] = useState('');
  const [view, setView] = useState<'input' | 'roster'>('roster');
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );
  
  const containers = useMemo(() => {
    return ['A', 'B', ...queue.map(t => t.id)];
  }, [queue]);
  
  const playersById = useMemo(() => {
    const map = new Map<string, Player>();
    [...courtA.players, ...courtB.players, ...queue.flatMap(t => t.players)].forEach(p => {
      map.set(p.id, p);
    });
    return map;
  }, [courtA, courtB, queue]);

  const findContainer = (id: string) => {
    if (id === 'A') return 'A';
    if (id === 'B') return 'B';
    if (queue.some(t => t.id === id)) return id;
    for (const team of [courtA, courtB, ...queue]) {
      if (team.players.some(p => p.id === id)) {
        return team.id;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const player = playersById.get(active.id as string);
    if (player) {
      setActivePlayer(player);
    }
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
    <Modal isOpen={isOpen} onClose={onClose} title="Squad Management" maxWidth="max-w-5xl">
      <div className="flex p-1 bg-white/5 rounded-xl mb-6 border border-white/5">
        <button onClick={() => setView('roster')} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${view === 'roster' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Current Roster</button>
        <button onClick={() => setView('input')} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${view === 'input' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Batch Input</button>
      </div>

      {view === 'input' ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-xs text-indigo-200 flex items-center gap-2"><ArrowRight size={14} />Paste names below (one per line).</p>
            </div>
            <textarea className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/10 focus:outline-none focus:border-indigo-500/50 font-mono text-sm resize-none custom-scrollbar"
               placeholder="John Doe&#10;Jane Smith&#10;..." value={rawNames} onChange={e => setRawNames(e.target.value)} />
            <Button onClick={handleGenerate} className="w-full" size="lg"><Shuffle size={18} /> Generate Teams</Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex flex-col md:grid md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-4 min-h-[60vh]">
            <TeamColumn 
              id="A" team={courtA} onUpdateTeamName={onUpdateTeamName} onAddPlayer={(n) => onAddPlayer(n, 'A')}
              onToggleFixed={onToggleFixed} onRemove={onRemove} color="indigo" onMovePlayer={onMove}
            />
            
            <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex flex-col overflow-hidden min-h-[300px] md:min-h-0">
                <h3 className="font-bold text-slate-400 mb-4 text-xs uppercase tracking-widest flex items-center gap-2 flex-none"><div className="w-2 h-2 rounded-full bg-slate-600"></div>Waiting Queue</h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
                  {queue.length === 0 && <span className="text-xs text-slate-600 italic px-2">Queue empty</span>}
                  {queue.map(team => (
                    <TeamColumn
                      key={team.id} id={team.id} team={team} onUpdateTeamName={onUpdateTeamName} onAddPlayer={_ => {}}
                      onToggleFixed={onToggleFixed} onRemove={onRemove} color="slate" isQueue={true} onMovePlayer={onMove}
                    />
                  ))}
                </div>
                <div className="pt-2 border-t border-white/5"><AddPlayerInput onAdd={n => onAddPlayer(n, 'Queue')} /></div>
            </div>

            <TeamColumn
              id="B" team={courtB} onUpdateTeamName={onUpdateTeamName} onAddPlayer={(n) => onAddPlayer(n, 'B')}
              onToggleFixed={onToggleFixed} onRemove={onRemove} color="rose" onMovePlayer={onMove}
            />
          </div>
          {createPortal(
            <DragOverlay>
              {activePlayer ? (
                <PlayerCard
                  player={activePlayer} locationId="" onToggleFixed={() => {}} onRemove={() => {}}
                  onMovePlayer={() => {}} isQueue={false}
                />
              ) : null}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      )}

       {canUndoRemove && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-slate-800 text-white px-5 py-3 rounded-full shadow-2xl border border-white/10 flex items-center gap-4 animate-in slide-in-from-bottom-5">
                <span className="text-xs font-medium text-slate-300">Player removed</span>
                <div className="h-4 w-px bg-white/20"></div>
                <button onClick={onUndoRemove} className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"><Undo2 size={16} /> UNDO</button>
            </div>
        )}
    </Modal>
  );
};
