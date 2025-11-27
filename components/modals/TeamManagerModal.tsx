import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Team, Player } from '../../types';
import { Pin, Trash2, Shuffle, ArrowRight, Edit2, GripVertical, Plus, Undo2, Ban } from 'lucide-react';

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
  onDragStart: (e: React.DragEvent | React.TouchEvent, playerId: string, fromId: string) => void; // Unified event
  onDragEnd?: () => void;
  isDraggingGlobal: boolean;
}

// --- Auto-Scroll Helpers (Clean Code) ---
const SCROLL_ZONE_PX = 40; // Area near edge to trigger scroll
const SCROLL_SPEED = 8;    // Scroll speed
let scrollAssistInterval: number | null = null;
let lastScrollElement: HTMLElement | null = null;

/**
 * Inicia o assistente de scroll automático quando o item arrastado se aproxima da borda.
 */
const startScrollAssist = (element: HTMLElement, direction: 'up' | 'down') => {
    // Se já estivermos rolando este elemento na mesma direção, ou se for outro elemento, pare e recomece
    if (scrollAssistInterval && lastScrollElement === element) return;
    stopScrollAssist();
    lastScrollElement = element;

    scrollAssistInterval = (setInterval(() => {
        if (!lastScrollElement) {
            stopScrollAssist();
            return;
        }
        if (direction === 'up') {
            lastScrollElement.scrollTop -= SCROLL_SPEED;
        } else {
            lastScrollElement.scrollTop += SCROLL_SPEED;
        }
    }, 20) as unknown as number); // Smooth scroll check every 20ms
};

/**
 * Para o assistente de scroll.
 */
const stopScrollAssist = () => {
    if (scrollAssistInterval) {
        clearInterval(scrollAssistInterval);
        scrollAssistInterval = null;
        lastScrollElement = null;
    }
};

const PlayerItem: React.FC<PlayerItemProps> = ({ 
    player, 
    locationId, 
    onToggleFixed, 
    onRemove, 
    onDragStart, 
    onDragEnd,
    isDraggingGlobal
}) => {
  const [isDraggingThis, setIsDraggingThis] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  
  // Handlers for Mouse/Native Drag
  const handleDragStart = (e: React.DragEvent) => {
      if(player.isFixed) return;
      setIsDraggingThis(true);
      onDragStart(e, player.id, locationId);
  };

  const handleDragEnd = () => {
      setIsDraggingThis(false);
      if (onDragEnd) onDragEnd();
  };

  // --- Touch Event Emulation (Critical for mobile fix) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (player.isFixed) return;
    
    // Inicia a lógica de drag para touch
    setIsDraggingThis(true);
    // Usa a função de dragStart original, passando o evento touch
    onDragStart(e, player.id, locationId);
  };
  
  const handleTouchEnd = () => {
      setIsDraggingThis(false);
      // TouchEnd será tratado globalmente para o drop
      if (onDragEnd) onDragEnd();
  };
  // -----------------------------------------------------

  return (
    <div 
        ref={itemRef}
        // Native Drag for mouse/desktop
        draggable={!player.isFixed}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        // Touch Handlers for Mobile (Necessário para que o touch inicie a drag logic)
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        // Previne o scroll nativo na direção vertical durante o arrasto
        style={{ touchAction: player.isFixed ? 'auto' : 'none' }}
        
        className={`
            group flex items-center justify-between p-2.5 rounded-xl mb-2 border transition-all cursor-grab active:cursor-grabbing
            ${isDraggingThis || isDraggingGlobal && itemRef.current?.dataset.dragged === player.id 
                ? 'opacity-50 grayscale scale-105 border-indigo-400 border-dashed bg-black/40 ring-2 ring-indigo-500/20' 
                : player.isFixed 
                    ? 'bg-indigo-500/10 border-indigo-500/30' 
                    : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20'
            }
        `}
        data-player-id={player.id} // Usado para detecção de drop
        data-from-location={locationId} // Usado para detecção de drop
        data-dragged={isDraggingThis ? player.id : ''} // Helper para styling
    >
        {/* Left: Info */}
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
        
        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => onRemove(player.id)} className="text-slate-600 hover:text-rose-500 p-1.5 rounded hover:bg-rose-500/10 transition-colors">
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
    onDropPlayer: (playerId: string, fromId: string, toId: string) => void;
    children: React.ReactNode;
    className?: string;
    scrollRef: React.RefObject<HTMLDivElement>; // Ref para auto-scroll
    onPlayerTouchMove: (e: React.TouchEvent, ref: React.RefObject<HTMLDivElement>) => void; // Touch Move
    onPlayerTouchEnd: (e: React.TouchEvent, toId: string) => void; // Touch Drop
}> = ({ targetId, isFull, isGlobalDragging, onDropPlayer, children, className, scrollRef, onPlayerTouchMove, onPlayerTouchEnd }) => {
    const [isOver, setIsOver] = useState(false);

    // --- Native Drag Handlers ---
    const handleDragOver = (e: React.DragEvent) => {
        if(isFull) return;
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => setIsOver(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        if(isFull) return;

        const playerId = e.dataTransfer.getData('playerId');
        const fromId = e.dataTransfer.getData('fromLocation');
        
        if(playerId && fromId && fromId !== targetId) {
            onDropPlayer(playerId, fromId, targetId);
        }
    };
    // ----------------------------

    // --- Touch Handlers (Usando Refs para Auto-Scroll e Drop) ---
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isGlobalDragging) return;
        
        // Passa o evento e o scrollRef para o handler global no Modal
        onPlayerTouchMove(e, scrollRef);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!isGlobalDragging) return;
        
        // Chama o handler global
        onPlayerTouchEnd(e, targetId);
    };

    // Enhanced Style logic for better visibility:
    let dynamicStyles = '';
    
    if (isOver && !isFull) {
        // Active Hover Target
        dynamicStyles = 'bg-indigo-500/30 ring-4 ring-indigo-500/50 border-indigo-400 scale-[1.01] shadow-[0_0_35px_rgba(99,102,241,0.4)] z-10';
    } else if (isGlobalDragging && !isFull) {
        // Valid Drop Candidate (Hint) - Stronger visual with thicker border
        dynamicStyles = 'bg-indigo-500/10 border-4 border-dashed border-indigo-500/80 ring-4 ring-indigo-500/20 animate-pulse shadow-[inset_0_0_20px_rgba(99,102,241,0.2)]';
    } else if (isGlobalDragging && isFull) {
        // Invalid Target (Full)
        dynamicStyles = 'opacity-40 grayscale scale-[0.98] transition-opacity border-rose-500/20';
    }

    return (
        <div 
            // Native Drag
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            
            // Touch Drag (Delegado, mas o TouchMove é crucial para o Scroll Assist)
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            
            data-droppable-id={targetId} // Adicionado para detecção de drop por touch
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
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [draggedFromId, setDraggedFromId] = useState<string | null>(null);

  // Refs para as áreas de scroll dos containers
  const courtARef = useRef<HTMLDivElement>(null);
  const courtBRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<HTMLDivElement>(null); // Ref para a área scrollable principal da Queue

  // Global safety net for drag end: 
  useEffect(() => {
    const handleWindowDragEnd = () => {
        stopScrollAssist(); // Stop scroll assist on native drag end
        setIsDragging(false);
        setDraggedPlayerId(null);
        setDraggedFromId(null);
    };

    if (isDragging) {
        // Use window listeners for mouse drag end
        window.addEventListener('dragend', handleWindowDragEnd);
        // Add global touch move to prevent default scroll behavior on the entire screen while dragging
        document.body.style.overflow = 'hidden'; // Temporarily disable body scroll
    } else {
         document.body.style.overflow = ''; // Restore body scroll
    }

    return () => {
        window.removeEventListener('dragend', handleWindowDragEnd);
        document.body.style.overflow = '';
    };
  }, [isDragging]);

  const handleGenerate = () => {
    const names = rawNames.split('\n').map(n => n.trim()).filter(n => n);
    if (names.length > 0) {
      onGenerate(names);
      setRawNames('');
      setView('roster');
    }
  };

  const handleDragStartWrapper = (e: React.DragEvent | React.TouchEvent, playerId: string, fromId: string) => {
      // For Native Drag
      if ((e as React.DragEvent).dataTransfer) {
          (e as React.DragEvent).dataTransfer.setData('playerId', playerId);
          (e as React.DragEvent).dataTransfer.setData('fromLocation', fromId);
          (e as React.DragEvent).dataTransfer.effectAllowed = 'move';
      }
      // For Touch Emulation
      setDraggedPlayerId(playerId);
      setDraggedFromId(fromId);
      setIsDragging(true);
  };
  
  const handleGlobalDragEnd = () => {
      // Global handler for React synthetic events and final touch end
      stopScrollAssist();
      setIsDragging(false);
      setDraggedPlayerId(null);
      setDraggedFromId(null);
  };

  const handleMoveWrapper = (playerId: string, fromId: string, toId: string) => {
      setIsDragging(false);
      setDraggedPlayerId(null);
      setDraggedFromId(null);
      onMove(playerId, fromId, toId);
  };
  
  // --- TOUCH HANDLERS FOR SCROLL ASSIST AND DROP ---
  const handlePlayerTouchMove = (e: React.TouchEvent, ref: React.RefObject<HTMLDivElement>) => {
      if (!isDragging || !ref.current) return;

      const touch = e.touches[0];
      const { clientY } = touch;
      const element = ref.current;
      const rect = element.getBoundingClientRect();

      // Check if near top edge of scrollable area
      if (clientY < rect.top + SCROLL_ZONE_PX && element.scrollTop > 0) {
          startScrollAssist(element, 'up');
      } 
      // Check if near bottom edge of scrollable area
      else if (clientY > rect.bottom - SCROLL_ZONE_PX && element.scrollHeight > element.clientHeight + element.scrollTop) {
          startScrollAssist(element, 'down');
      } 
      // Stop scrolling if touch is in the middle
      else {
          stopScrollAssist();
      }
  };

  const handlePlayerTouchEnd = (e: React.TouchEvent, toId: string) => {
      stopScrollAssist();
      if (!draggedPlayerId || !draggedFromId || draggedFromId === toId) {
          handleGlobalDragEnd();
          return;
      }

      // Find the element currently under the touch point
      const touch = e.changedTouches[0];
      const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
      
      const closestDroppable = targetElement?.closest('[data-droppable-id]');
      
      // Se o drop ocorreu em um container válido E não estiver cheio:
      if (closestDroppable && closestDroppable.getAttribute('data-droppable-id') === toId) {
          handleMoveWrapper(draggedPlayerId, draggedFromId, toId);
      }
      
      handleGlobalDragEnd();
  };
  // --------------------------------------------------

  const counts = {
      A: courtA.players.length,
      B: courtB.players.length
  };

  const commonPlayerProps = {
      onToggleFixed,
      onRemove,
      onDragStart: handleDragStartWrapper,
      onDragEnd: handleGlobalDragEnd,
      isDraggingGlobal: isDragging,
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
        <div 
            className="relative h-full flex flex-col"
            onDragEnd={handleGlobalDragEnd} 
            onTouchMove={(e) => { 
                 // Prevents scroll on the Modal itself when dragging (only allows it in the scrollable areas)
                 if (isDragging) e.preventDefault(); 
            }}
            onTouchEnd={handleGlobalDragEnd} // Global handler for missed drops
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-4 flex-1">
                {/* Court A */}
                <div className="flex flex-col h-full">
                    <DroppableTeam 
                        targetId="A" 
                        isFull={counts.A >= 6} 
                        isGlobalDragging={isDragging}
                        onDropPlayer={handleMoveWrapper}
                        scrollRef={courtARef} 
                        onPlayerTouchMove={handlePlayerTouchMove} 
                        onPlayerTouchEnd={handlePlayerTouchEnd} 
                        className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 flex-1 flex flex-col min-h-[400px]"
                    >
                        <h3 className="font-bold text-indigo-400 mb-4 text-xs uppercase tracking-widest flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_currentColor]"></div>
                                <EditableTitle name={courtA.name} onSave={n => onUpdateTeamName('A', n)} />
                            </span>
                            <span className={`${counts.A >= 6 ? 'text-rose-400' : 'text-indigo-400/50'}`}>{counts.A}/6</span>
                        </h3>
                        <div ref={courtARef} className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            {courtA.players.length === 0 && <span className="text-xs text-slate-600 italic px-2">Drag players here</span>}
                            {courtA.players.map(p => <PlayerItem key={p.id} player={p} locationId="A" {...commonPlayerProps} />)}
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
                        
                        <div ref={queueRef} className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
                            {queue.length === 0 && <span className="text-xs text-slate-600 italic px-2">Queue empty</span>}

                            {queue.map((team, idx) => (
                                <DroppableTeam 
                                    key={team.id}
                                    targetId={team.id}
                                    onDropPlayer={handleMoveWrapper}
                                    isGlobalDragging={isDragging}
                                    isFull={team.players.length >= 6}
                                    scrollRef={queueRef} // Pass queue ref here too
                                    onPlayerTouchMove={handlePlayerTouchMove} 
                                    onPlayerTouchEnd={handlePlayerTouchEnd} 
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
                                            <PlayerItem key={p.id} player={p} locationId={team.id} {...commonPlayerProps} />
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
                        isGlobalDragging={isDragging}
                        onDropPlayer={handleMoveWrapper}
                        scrollRef={courtBRef} 
                        onPlayerTouchMove={handlePlayerTouchMove} 
                        onPlayerTouchEnd={handlePlayerTouchEnd} 
                        className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 flex-1 flex flex-col min-h-[400px]"
                    >
                        <h3 className="font-bold text-rose-400 mb-4 text-xs uppercase tracking-widest flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_currentColor]"></div>
                                <EditableTitle name={courtB.name} onSave={n => onUpdateTeamName('B', n)} />
                            </span>
                            <span className={`${counts.B >= 6 ? 'text-rose-400' : 'text-rose-400/50'}`}>{counts.B}/6</span>
                        </h3>
                        <div ref={courtBRef} className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            {courtB.players.length === 0 && <span className="text-xs text-slate-600 italic px-2">Drag players here</span>}
                            {courtB.players.map(p => <PlayerItem key={p.id} player={p} locationId="B" {...commonPlayerProps} />)}
                        </div>
                        <AddPlayerInput onAdd={n => onAddPlayer(n, 'B')} disabled={counts.B >= 6} />
                    </DroppableTeam>
                </div>
            </div>
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