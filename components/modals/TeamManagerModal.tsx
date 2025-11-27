import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Team, Player } from '../../types';
import { Pin, Trash2, Shuffle, ArrowRight, Edit2, GripVertical, Plus, Undo2, Ban } from 'lucide-react';

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

interface PlayerItemProps {
  player: Player;
  locationId: string;
  onToggleFixed?: (playerId: string, teamId?: 'A' | 'B') => void;
  onRemove: (id: string) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, playerId: string, fromId: string) => void;
}

// --- Auto-Scroll Helpers ---
const SCROLL_ZONE_PX = 50;
const SCROLL_SPEED = 10;
let scrollAssistInterval: number | null = null;
let lastScrollElement: HTMLElement | null = null;

const startScrollAssist = (element: HTMLElement, direction: 'up' | 'down') => {
  if (scrollAssistInterval && lastScrollElement === element) return;
  stopScrollAssist();
  lastScrollElement = element;

  scrollAssistInterval = window.setInterval(() => {
    if (!lastScrollElement) return stopScrollAssist();
    lastScrollElement.scrollTop += direction === 'up' ? -SCROLL_SPEED : SCROLL_SPEED;
  }, 20);
};

const stopScrollAssist = () => {
  if (scrollAssistInterval) {
    window.clearInterval(scrollAssistInterval);
    scrollAssistInterval = null;
    lastScrollElement = null;
  }
};

// --- Sub-components ---
const PlayerItem: React.FC<PlayerItemProps> = ({ player, locationId, onToggleFixed, onRemove, onPointerDown }) => {
  return (
    <div
      onPointerDown={(e) => !player.isFixed && onPointerDown(e, player.id, locationId)}
      style={{ touchAction: player.isFixed ? 'auto' : 'none' }}
      className={`
        group flex items-center justify-between p-2.5 rounded-xl mb-2 border transition-all 
        ${player.isFixed 
          ? 'bg-indigo-500/10 border-indigo-500/30 cursor-not-allowed' 
          : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20 cursor-grab active:cursor-grabbing'
        }
      `}
      data-player-id={player.id}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <GripVertical size={14} className="text-slate-600 flex-shrink-0" />
        {onToggleFixed && (
          <button 
            onClick={() => onToggleFixed(player.id, (locationId === 'A' || locationId === 'B') ? locationId : undefined)}
            className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${player.isFixed ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'bg-white/5 text-slate-500 hover:text-white'}`}
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
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onRemove(player.id)} className="text-slate-600 hover:text-rose-500 p-1.5 rounded hover:bg-rose-500/10 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const DroppableTeam: React.FC<{
  isHighlighted: boolean;
  isFull: boolean;
  children: React.ReactNode;
  className?: string;
  id: string;
}> = ({ isHighlighted, isFull, children, className, id }) => {
    
  let dynamicStyles = '';
  if (isHighlighted && !isFull) {
      dynamicStyles = 'bg-indigo-500/10 border-4 border-dashed border-indigo-500/80 ring-4 ring-indigo-500/20 animate-pulse shadow-[inset_0_0_20px_rgba(99,102,241,0.2)]';
  } else if (isHighlighted && isFull) {
      dynamicStyles = 'opacity-40 grayscale scale-[0.98] transition-opacity border-rose-500/20';
  }

  return (
    <div data-drop-target-id={id} className={`transition-all duration-200 ease-out ${dynamicStyles} ${className}`}>
      {children}
    </div>
  );
};

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
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if(isOpen) inputRef.current?.focus(); }, [isOpen]);

    const submit = () => {
        if(name.trim()) { onAdd(name.trim()); setName(''); }
        setIsOpen(false);
    };

    if (isOpen && !disabled) {
        return (
            <div className="flex items-center gap-2 mt-2 px-2 animate-in fade-in slide-in-from-top-1">
                <input ref={inputRef}
                    className="flex-1 bg-black/40 border border-white/20 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="New player name..." value={name} onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if(e.key === 'Enter') submit(); if(e.key === 'Escape') setIsOpen(false); }}
                    onBlur={() => setTimeout(submit, 100)}
                />
                <button onClick={submit} className="p-1 bg-indigo-500 rounded hover:bg-indigo-400"><Plus size={14} /></button>
            </div>
        );
    }
    return (
        <button onClick={() => !disabled && setIsOpen(true)} disabled={disabled}
            className={`mt-2 w-full py-1.5 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-transparent transition-all ${disabled ? 'text-slate-600 cursor-not-allowed opacity-50' : 'text-slate-500 hover:text-white hover:bg-white/5 hover:border-white/5'}`} >
            {disabled ? (<><Ban size={12} /> Roster Full</>) : (<><Plus size={12} /> Add Player</>)}
        </button>
    );
};


// --- Main Modal Component ---
export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({ 
  isOpen, onClose, courtA, courtB, queue, onGenerate, onToggleFixed, onRemove, onMove, onUpdateTeamName, onAddPlayer, onUndoRemove, canUndoRemove
}) => {
  const [rawNames, setRawNames] = useState('');
  const [view, setView] = useState<'input' | 'roster'>('roster');
  
  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ id: string, fromId: string, element: HTMLElement } | null>(null);
  const [ghostPosition, setGhostPosition] = useState({ x: 0, y: 0 });
  const longPressTimeout = useRef<number | null>(null);
  
  // Scroll Refs
  const courtARef = useRef<HTMLDivElement>(null);
  const courtBRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, playerId: string, fromId: string) => {
    const target = e.currentTarget;
    longPressTimeout.current = window.setTimeout(() => {
        setIsDragging(true);
        const clonedNode = target.cloneNode(true) as HTMLElement;
        clonedNode.style.width = `${target.offsetWidth}px`; // Fix width on clone
        setDraggedItem({ id: playerId, fromId, element: clonedNode });
        setGhostPosition({ x: e.clientX, y: e.clientY });
        target.setPointerCapture(e.pointerId); // Capture pointer for this element
    }, 200); // 200ms for long press
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // If not a long press, clear the timeout
    if (longPressTimeout.current) {
        // Simple move detection to cancel long press if user is just scrolling
        if(Math.abs(e.movementY) > 5) {
            window.clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
        }
    }

    if (isDragging && draggedItem) {
        setGhostPosition({ x: e.clientX, y: e.clientY });

        // Auto-Scroll Logic
        const refs = [courtARef, courtBRef, queueRef];
        let scrolled = false;
        for (const ref of refs) {
            if (ref.current) {
                const rect = ref.current.getBoundingClientRect();
                if (e.clientY < rect.top + SCROLL_ZONE_PX) {
                    startScrollAssist(ref.current, 'up');
                    scrolled = true;
                } else if (e.clientY > rect.bottom - SCROLL_ZONE_PX) {
                    startScrollAssist(ref.current, 'down');
                    scrolled = true;
                }
            }
        }
        if (!scrolled) {
            stopScrollAssist();
        }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (longPressTimeout.current) {
        window.clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
    }
    stopScrollAssist();

    if (isDragging && draggedItem) {
        if(document.body.style.cursor) document.body.style.cursor = '';
        
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch(err) {
            // This can fail if the element was removed from DOM, which is fine.
        }

        // Hide ghost immediately to check element underneath
        if (draggedItem.element) {
            draggedItem.element.style.display = 'none';
        }
        
        const dropTarget = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-drop-target-id]');
        const toId = dropTarget?.getAttribute('data-drop-target-id');

        if (toId && toId !== draggedItem.fromId) {
            onMove(draggedItem.id, draggedItem.fromId, toId);
        }
    }
    
    setIsDragging(false);
    setDraggedItem(null);
  };
  
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Squad Management" maxWidth="max-w-5xl">
       {/* Ghost Element for Dragging */}
        {isDragging && draggedItem && (
            <div 
                className="fixed top-0 left-0 pointer-events-none z-[100] -translate-x-1/2 -translate-y-[calc(50%_+_8px)] opacity-80 rotate-[-3deg] shadow-2xl shadow-black/50"
                style={{
                    transform: `translate(${ghostPosition.x}px, ${ghostPosition.y}px) scale(1.05) rotate(-3deg)`,
                }}
                dangerouslySetInnerHTML={{ __html: draggedItem.element.innerHTML }}
            />
        )}
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
        <div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-4 flex-1 h-full min-h-[60vh]"
            onPointerMove={handlePointerMove as any}
            onPointerUp={handlePointerUp as any}
            onPointerCancel={handlePointerUp as any}
        >
          {/* Court A */}
          <div className="flex flex-col h-full">
            <DroppableTeam id="A" isHighlighted={isDragging} isFull={counts.A >= 6} className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 flex-1 flex flex-col">
              <h3 className="font-bold text-indigo-400 mb-4 text-xs uppercase tracking-widest flex items-center justify-between">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_currentColor]"></div><EditableTitle name={courtA.name} onSave={n => onUpdateTeamName('A', n)} /></span>
                <span className={`${counts.A >= 6 ? 'text-rose-400' : 'text-indigo-400/50'}`}>{counts.A}/6</span>
              </h3>
              <div ref={courtARef} className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                {courtA.players.length === 0 && <span className="text-xs text-slate-600 italic px-2">Drag here</span>}
                {courtA.players.map(p => <PlayerItem key={p.id} player={p} locationId="A" onToggleFixed={onToggleFixed} onRemove={onRemove} onPointerDown={handlePointerDown}/>)}
              </div>
              <AddPlayerInput onAdd={n => onAddPlayer(n, 'A')} disabled={counts.A >= 6} />
            </DroppableTeam>
          </div>

          {/* Queue */}
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex-1 flex flex-col overflow-hidden">
            <h3 className="font-bold text-slate-400 mb-4 text-xs uppercase tracking-widest flex items-center gap-2 sticky top-0 bg-transparent z-10"><div className="w-2 h-2 rounded-full bg-slate-600"></div>Waiting Queue</h3>
            <div ref={queueRef} className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
              {queue.length === 0 && <span className="text-xs text-slate-600 italic px-2">Queue empty</span>}
              {queue.map(team => (
                <DroppableTeam key={team.id} id={team.id} isHighlighted={isDragging} isFull={team.players.length >= 6} className={`bg-black/20 rounded-xl p-3 border ${team.players.length >= 6 ? 'border-rose-500/20' : 'border-white/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <EditableTitle name={team.name} onSave={(newName) => onUpdateTeamName(team.id, newName)} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest" />
                    <span className={`text-[10px] font-bold ${team.players.length >= 6 ? 'text-rose-400' : 'text-slate-600'}`}>{team.players.length}/6</span>
                  </div>
                  <div>
                    {team.players.map(p => <PlayerItem key={p.id} player={p} locationId={team.id} onToggleFixed={onToggleFixed} onRemove={onRemove} onPointerDown={handlePointerDown}/>)}
                  </div>
                </DroppableTeam>
              ))}
            </div>
            <div className="pt-2 border-t border-white/5"><AddPlayerInput onAdd={n => onAddPlayer(n, 'Queue')} /></div>
          </div>
          
          {/* Court B */}
          <div className="flex flex-col h-full">
            <DroppableTeam id="B" isHighlighted={isDragging} isFull={counts.B >= 6} className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 flex-1 flex flex-col">
              <h3 className="font-bold text-rose-400 mb-4 text-xs uppercase tracking-widest flex items-center justify-between">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_currentColor]"></div><EditableTitle name={courtB.name} onSave={n => onUpdateTeamName('B', n)} /></span>
                <span className={`${counts.B >= 6 ? 'text-rose-400' : 'text-rose-400/50'}`}>{counts.B}/6</span>
              </h3>
              <div ref={courtBRef} className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                {courtB.players.length === 0 && <span className="text-xs text-slate-600 italic px-2">Drag here</span>}
                {courtB.players.map(p => <PlayerItem key={p.id} player={p} locationId="B" onToggleFixed={onToggleFixed} onRemove={onRemove} onPointerDown={handlePointerDown}/>)}
              </div>
              <AddPlayerInput onAdd={n => onAddPlayer(n, 'B')} disabled={counts.B >= 6} />
            </DroppableTeam>
          </div>
        </div>
      )}
       {canUndoRemove && (
            <div className="fixed bottom-6 left-12 md:left-1/2 md:-translate-x-1/2 z-[70] bg-slate-800 text-white px-5 py-3 rounded-full shadow-2xl border border-white/10 flex items-center gap-4 animate-in slide-in-from-bottom-5">
                <span className="text-xs font-medium text-slate-300">Player removed</span>
                <div className="h-4 w-px bg-white/20"></div>
                <button onClick={onUndoRemove} className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"><Undo2 size={16} /> UNDO</button>
            </div>
        )}
    </Modal>
  );
};