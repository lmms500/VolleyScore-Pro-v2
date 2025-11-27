import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Team, Player } from '../../types';
import { Pin, Trash2, Shuffle, ArrowRight, Edit2, GripVertical, Plus, Undo2, Ban } from 'lucide-react';
import { createPortal } from 'react-dom';

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

interface PlayerItemProps {
  player: Player;
  locationId: string; // ID of the container (TeamID or 'A'/'B')
  onToggleFixed?: (playerId: string, teamId?: 'A' | 'B') => void;
  onRemove: (id: string) => void;
  onPointerDown?: (e: React.PointerEvent, player: Player, fromId: string) => void;
  isBeingDragged?: boolean;
}

const PlayerItem: React.FC<PlayerItemProps> = ({ player, locationId, onToggleFixed, onRemove, onPointerDown, isBeingDragged }) => {
  return (
    <div 
        onPointerDown={(e) => onPointerDown && !player.isFixed && onPointerDown(e, player, locationId)}
        className={`
            group flex items-center justify-between p-2.5 rounded-xl mb-2 border transition-all 
            ${player.isFixed ? 'cursor-default' : 'cursor-grab active:cursor-grabbing touch-none'}
            ${isBeingDragged 
                ? 'opacity-30 grayscale border-dashed border-indigo-400/50 bg-black/20' 
                : player.isFixed 
                    ? 'bg-indigo-500/10 border-indigo-500/30' 
                    : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20'
            }
        `}
    >
        {/* Left: Info */}
        <div className="flex items-center gap-3 overflow-hidden pointer-events-none">
            <GripVertical size={14} className="text-slate-600 flex-shrink-0" />
            
            {onToggleFixed && (
                <button 
                    onPointerDown={(e) => e.stopPropagation()} // Allow click without drag start
                    onClick={() => onToggleFixed(player.id, (locationId === 'A' || locationId === 'B') ? locationId : undefined)}
                    className={`p-1.5 rounded-lg transition-all flex-shrink-0 pointer-events-auto ${player.isFixed ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                    title={player.isFixed ? "Player Fixed" : "Fix Player"}
                >
                    <Pin size={14} fill={player.isFixed ? "currentColor" : "none"} />
                </button>
            )}
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-slate-200 truncate">{player.name}</span>
                    <span className="text-[9px] font-mono text-slate-500/50 bg-white/5 px-1 rounded border border-white/5">
                        #{player.id.slice(0, 4)}
                    </span>
                </div>
            </div>
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
            <button 
                onPointerDown={(e) => e.stopPropagation()} // Allow click without drag start
                onClick={() => onRemove(player.id)} 
                className="text-slate-600 hover:text-rose-500 p-1.5 rounded hover:bg-rose-500/10 transition-colors pointer-events-auto"
            >
                <Trash2 size={14} />
            </button>
        </div>
    </div>
  );
};

// --- Drag & Drop Container ---
const DroppableTeam: React.FC<{ 
    targetId: string; 
    isFull?: boolean;
    isGlobalDragging?: boolean;
    children: React.ReactNode;
    className?: string;
}> = ({ targetId, isFull, isGlobalDragging, children, className }) => {
    
    // Enhanced Style logic for better visibility:
    let dynamicStyles = '';
    
    // Note: We don't use onDragOver/Drop here anymore because we use geometric detection on PointerUp
    
    if (isGlobalDragging && !isFull) {
        // Valid Drop Candidate (Hint) - Stronger visual with thicker border
        dynamicStyles = 'bg-indigo-500/10 border-4 border-dashed border-indigo-500/80 ring-4 ring-indigo-500/20 animate-pulse shadow-[inset_0_0_20px_rgba(99,102,241,0.2)]';
    } else if (isGlobalDragging && isFull) {
        // Invalid Target (Full)
        dynamicStyles = 'opacity-40 grayscale scale-[0.98] transition-opacity border-rose-500/20';
    }

    return (
        <div 
            data-drop-target-id={targetId} // Critical for elementFromPoint detection
            className={`transition-all duration-200 ease-out ${dynamicStyles} ${className}`}
        >
            {children}
        </div>
    );
};

// Sub-component for inline editing of team names
const EditableTitle: React.FC<{ name: string; onSave: (val: string) => void; className?: string }> = ({ name, onSave, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

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
            ref={inputRef}
            type="text"
            className="bg-black/50 text-white border-b border-white/50 outline-none w-full max-w-[150px] px-1 py-0.5 text-xs font-bold uppercase tracking-widest"
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={save}
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

// Sub-component for Adding Player
const AddPlayerInput: React.FC<{ onAdd: (name: string) => void; placeholder?: string; disabled?: boolean }> = ({ onAdd, placeholder, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if(isOpen) inputRef.current?.focus(); }, [isOpen]);

    const submit = () => {
        if(name.trim()) {
            onAdd(name.trim());
            setName('');
        }
        setIsOpen(false);
    };

    if (isOpen && !disabled) {
        return (
            <div className="flex items-center gap-2 mt-2 px-2 animate-in fade-in slide-in-from-top-1">
                <input 
                    ref={inputRef}
                    className="flex-1 bg-black/40 border border-white/20 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="New player name..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if(e.key === 'Enter') submit(); if(e.key === 'Escape') setIsOpen(false); }}
                    onBlur={() => setTimeout(submit, 100)} // Delay to allow click on button
                />
                <button onClick={submit} className="p-1 bg-indigo-500 rounded hover:bg-indigo-400"><Plus size={14} /></button>
            </div>
        );
    }

    return (
        <button 
            onClick={() => !disabled && setIsOpen(true)} 
            disabled={disabled}
            className={`
                mt-2 w-full py-1.5 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-transparent transition-all
                ${disabled 
                    ? 'text-slate-600 bg-transparent cursor-not-allowed opacity-50' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5 hover:border-white/5'}
            `}
        >
            {disabled ? (
                <>
                    <Ban size={12} /> Roster Full
                </>
            ) : (
                <>
                    <Plus size={12} /> Add Player
                </>
            )}
        </button>
    );
};

export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({ 
  isOpen, onClose, courtA, courtB, queue, 
  onGenerate, onToggleFixed, onRemove, onMove, onUpdateTeamName, onAddPlayer, onUndoRemove, canUndoRemove
}) => {
  const [rawNames, setRawNames] = useState('');
  const [view, setView] = useState<'input' | 'roster'>('roster');
  
  // Custom Drag State
  const [dragState, setDragState] = useState<{
      isDragging: boolean;
      player: Player | null;
      fromId: string | null;
      x: number;
      y: number;
  }>({ isDragging: false, player: null, fromId: null, x: 0, y: 0 });

  // Pointer Event Handlers for Drag & Drop
  const handlePointerDown = (e: React.PointerEvent, player: Player, fromId: string) => {
      e.preventDefault(); // Prevent scrolling/selection
      setDragState({
          isDragging: true,
          player,
          fromId,
          x: e.clientX,
          y: e.clientY
      });
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
        if (!dragState.isDragging) return;
        setDragState(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
    };

    const handlePointerUp = (e: PointerEvent) => {
        if (!dragState.isDragging) return;
        
        // Geometric detection of drop target
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const targetElement = elements.find(el => el.hasAttribute('data-drop-target-id'));
        
        if (targetElement) {
            const toId = targetElement.getAttribute('data-drop-target-id');
            if (toId && dragState.player && dragState.fromId && toId !== dragState.fromId) {
                // Determine if target is full is handled by onMove logic in hook, 
                // but we can check here visually if we passed isFull props correctly.
                // For now, rely on hook validation.
                onMove(dragState.player.id, dragState.fromId, toId);
            }
        }

        setDragState({ isDragging: false, player: null, fromId: null, x: 0, y: 0 });
    };

    if (dragState.isDragging) {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
    }

    return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragState.isDragging, dragState.player, dragState.fromId, onMove]);


  const handleGenerate = () => {
    const names = rawNames.split('\n').map(n => n.trim()).filter(n => n);
    if (names.length > 0) {
      onGenerate(names);
      setRawNames('');
      setView('roster');
    }
  };

  const counts = {
      A: courtA.players.length,
      B: courtB.players.length
  };

  const commonPlayerProps = {
      onToggleFixed,
      onRemove,
      onPointerDown: handlePointerDown
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
                <p className="text-xs text-indigo-200 flex items-center gap-2">
                    <ArrowRight size={14} />
                    Paste names below (one per line). We'll shuffle and distribute them.
                </p>
            </div>
            <textarea 
               className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/10 focus:outline-none focus:border-indigo-500/50 font-mono text-sm resize-none custom-scrollbar"
               placeholder="John Doe&#10;Jane Smith&#10;Michael Jordan&#10;..."
               value={rawNames}
               onChange={e => setRawNames(e.target.value)}
            />
            <Button onClick={handleGenerate} className="w-full" size="lg">
                <Shuffle size={18} /> Generate Teams
            </Button>
        </div>
      ) : (
        <div className="relative h-full flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-4 flex-1">
                {/* Court A */}
                <div className="flex flex-col h-full">
                    <DroppableTeam 
                        targetId="A" 
                        isFull={counts.A >= 6} 
                        isGlobalDragging={dragState.isDragging}
                        className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 flex-1 flex flex-col min-h-[400px]"
                    >
                        <h3 className="font-bold text-indigo-400 mb-4 text-xs uppercase tracking-widest flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_currentColor]"></div>
                                <EditableTitle name={courtA.name} onSave={n => onUpdateTeamName('A', n)} />
                            </span>
                            <span className={`${counts.A >= 6 ? 'text-rose-400' : 'text-indigo-400/50'}`}>{counts.A}/6</span>
                        </h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            {courtA.players.length === 0 && <span className="text-xs text-slate-600 italic px-2">Drag players here</span>}
                            {courtA.players.map(p => (
                                <PlayerItem 
                                    key={p.id} 
                                    player={p} 
                                    locationId="A" 
                                    {...commonPlayerProps} 
                                    isBeingDragged={dragState.isDragging && dragState.player?.id === p.id}
                                />
                            ))}
                        </div>
                        <AddPlayerInput onAdd={n => onAddPlayer(n, 'A')} disabled={counts.A >= 6} />
                    </DroppableTeam>
                </div>

                {/* Queue (Center) */}
                <div className="flex flex-col h-full order-last md:order-none gap-4">
                    {/* Render each Queue Team individually */}
                    <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex-1 flex flex-col min-h-[400px] overflow-hidden">
                         <h3 className="font-bold text-slate-400 mb-4 text-xs uppercase tracking-widest flex items-center gap-2 sticky top-0 bg-transparent z-10">
                            <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                            Waiting Queue
                        </h3>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
                            {queue.length === 0 && <span className="text-xs text-slate-600 italic px-2">Queue empty</span>}

                            {queue.map((team, idx) => (
                                <DroppableTeam 
                                    key={team.id}
                                    targetId={team.id}
                                    isGlobalDragging={dragState.isDragging}
                                    isFull={team.players.length >= 6}
                                    className={`
                                        bg-black/20 rounded-xl p-3 border 
                                        ${team.players.length >= 6 ? 'border-rose-500/20' : 'border-white/5'}
                                    `}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <EditableTitle 
                                            name={team.name} 
                                            onSave={(newName) => onUpdateTeamName(team.id, newName)}
                                            className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                                        />
                                        <span className={`text-[10px] font-bold ${team.players.length >= 6 ? 'text-rose-400' : 'text-slate-600'}`}>
                                            {team.players.length}/6
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        {team.players.map(p => (
                                            <PlayerItem 
                                                key={p.id} 
                                                player={p} 
                                                locationId={team.id} 
                                                {...commonPlayerProps} 
                                                isBeingDragged={dragState.isDragging && dragState.player?.id === p.id}
                                            />
                                        ))}
                                    </div>
                                </DroppableTeam>
                            ))}
                        </div>
                        <div className="pt-2 border-t border-white/5">
                            <AddPlayerInput onAdd={n => onAddPlayer(n, 'Queue')} />
                        </div>
                    </div>
                </div>

                {/* Court B */}
                <div className="flex flex-col h-full">
                    <DroppableTeam 
                        targetId="B" 
                        isFull={counts.B >= 6} 
                        isGlobalDragging={dragState.isDragging}
                        className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 flex-1 flex flex-col min-h-[400px]"
                    >
                        <h3 className="font-bold text-rose-400 mb-4 text-xs uppercase tracking-widest flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_currentColor]"></div>
                                <EditableTitle name={courtB.name} onSave={n => onUpdateTeamName('B', n)} />
                            </span>
                            <span className={`${counts.B >= 6 ? 'text-rose-400' : 'text-rose-400/50'}`}>{counts.B}/6</span>
                        </h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            {courtB.players.length === 0 && <span className="text-xs text-slate-600 italic px-2">Drag players here</span>}
                            {courtB.players.map(p => (
                                <PlayerItem 
                                    key={p.id} 
                                    player={p} 
                                    locationId="B" 
                                    {...commonPlayerProps} 
                                    isBeingDragged={dragState.isDragging && dragState.player?.id === p.id}
                                />
                            ))}
                        </div>
                        <AddPlayerInput onAdd={n => onAddPlayer(n, 'B')} disabled={counts.B >= 6} />
                    </DroppableTeam>
                </div>
            </div>

            {/* Ghost Drag Element (Portal) */}
            {dragState.isDragging && dragState.player && createPortal(
                <div 
                    className="fixed pointer-events-none z-[100] flex items-center justify-between p-2.5 rounded-xl border border-indigo-500 bg-indigo-900/90 text-white shadow-2xl w-64 backdrop-blur-md"
                    style={{ 
                        left: dragState.x, 
                        top: dragState.y,
                        transform: 'translate(-50%, -50%) rotate(3deg)' 
                    }}
                >
                    <div className="flex items-center gap-3">
                         <GripVertical size={14} className="text-indigo-300" />
                         <span className="font-medium text-sm">{dragState.player.name}</span>
                    </div>
                </div>,
                document.body
            )}
        </div>
      )}

       {/* Sticky Undo Toast (Fixed Position) */}
       {canUndoRemove && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-slate-800 text-white px-5 py-3 rounded-full shadow-2xl border border-white/10 flex items-center gap-4 animate-in slide-in-from-bottom-5">
                <span className="text-xs font-medium text-slate-300">Player removed</span>
                <div className="h-4 w-px bg-white/20"></div>
                <button onClick={onUndoRemove} className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider">
                    <Undo2 size={16} /> UNDO
                </button>
            </div>
        )}
    </Modal>
  );
};