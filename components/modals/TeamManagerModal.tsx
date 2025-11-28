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
  locationId: string;
  onToggleFixed?: (playerId: string, teamId?: 'A' | 'B') => void;
  onRemove: (id: string) => void;
  // Handler para iniciar o drag
  startDrag: (player: Player, locationId: string) => void;
  // Estados visuais
  isGhost?: boolean; // Se é o item flutuante
  isOriginal?: boolean; // Se é o item original que está sendo arrastado (fica opaco)
}

// Configurações Auto-Scroll
const SCROLL_ZONE_SIZE = 50; // pixels da borda
const SCROLL_SPEED = 15;

const PlayerItem: React.FC<PlayerItemProps> = ({ 
    player, locationId, onToggleFixed, onRemove, startDrag, isGhost, isOriginal
}) => {
  const timerRef = useRef<number | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  // --- LONG PRESS HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (player.isFixed || isGhost) return;
    setIsPressing(true);
    timerRef.current = window.setTimeout(() => {
        // Ativa drag após 500ms
        startDrag(player, locationId);
        setIsPressing(false); // Reset visual
        if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
    }
    setIsPressing(false);
  };

  const handleTouchMove = () => {
    // Se mover muito, cancela (ex: scroll normal)
    if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
        setIsPressing(false);
    }
  };

  return (
    <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        className={`
            flex items-center justify-between p-2.5 rounded-xl mb-2 border transition-all select-none
            ${isGhost ? 'bg-indigo-600 border-indigo-400 shadow-2xl scale-105 z-50 pointer-events-none opacity-90' : ''}
            ${isOriginal ? 'opacity-30 grayscale' : ''}
            ${isPressing && !isOriginal && !isGhost ? 'scale-95 bg-indigo-500/20 border-indigo-500 ring-2 ring-indigo-500/30' : ''}
            ${!isGhost && !isOriginal && !isPressing ? (player.isFixed ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/5') : ''}
        `}
        style={{ touchAction: 'pan-y' }} // Permite scroll normal
    >
        <div className="flex items-center gap-3 overflow-hidden pointer-events-none">
            <GripVertical size={14} className="text-slate-600 flex-shrink-0" />
            <div className="flex flex-col min-w-0">
                <span className="font-medium text-sm text-slate-200 truncate">{player.name}</span>
            </div>
        </div>
        
        {!isGhost && (
            <div className="flex items-center gap-2 flex-shrink-0">
                {onToggleFixed && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFixed(player.id, (locationId === 'A' || locationId === 'B') ? locationId : undefined); }}
                        className={`p-1.5 rounded-lg transition-all ${player.isFixed ? 'text-indigo-400' : 'text-slate-600'}`}
                    >
                        <Pin size={14} fill={player.isFixed ? "currentColor" : "none"} />
                    </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onRemove(player.id); }} className="text-slate-600 hover:text-rose-500 p-1.5">
                    <Trash2 size={14} />
                </button>
            </div>
        )}
    </div>
  );
};

// Componente de Drop Zone (apenas visual e data-attribute para identificação)
const DroppableZone: React.FC<{ 
    id: string; 
    children: React.ReactNode; 
    isActive: boolean;
    className?: string;
}> = ({ id, children, isActive, className }) => (
    <div 
        data-drop-zone={id}
        className={`transition-all duration-300 ${isActive ? 'bg-indigo-500/10 border-indigo-500/50 border-dashed' : ''} ${className}`}
    >
        {children}
    </div>
);


export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({ 
  isOpen, onClose, courtA, courtB, queue, 
  onGenerate, onToggleFixed, onRemove, onMove, onUpdateTeamName, onAddPlayer, onUndoRemove, canUndoRemove
}) => {
  const [draggedPlayer, setDraggedPlayer] = useState<{player: Player, from: string} | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  
  // Refs para Scroll
  const scrollIntervalRef = useRef<number | null>(null);

  // --- TOUCH HANDLERS GLOBAIS ---
  // Apenas ativos quando dragging=true
  const handleGlobalTouchMove = (e: React.TouchEvent) => {
    if (!draggedPlayer) return;

    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    // 1. Atualiza Ghost
    setGhostPos({ x: clientX, y: clientY });

    // 2. Previne Scroll Nativo
    e.preventDefault(); 
    
    // 3. Auto-Scroll Logic
    checkAutoScroll(clientX, clientY);
  };

  const handleGlobalTouchEnd = (e: React.TouchEvent) => {
    if (!draggedPlayer) return;
    
    stopAutoScroll();

    const touch = e.changedTouches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    // Detecta elemento solto. 
    // Como o Ghost tem pointer-events-none, o elementFromPoint pega o que está embaixo.
    const targetEl = document.elementFromPoint(clientX, clientY);
    const dropZone = targetEl?.closest('[data-drop-zone]');

    if (dropZone) {
        const toId = dropZone.getAttribute('data-drop-zone');
        if (toId && toId !== draggedPlayer.from) {
            onMove(draggedPlayer.player.id, draggedPlayer.from, toId);
        }
    }

    setDraggedPlayer(null);
  };

  // --- AUTO SCROLL ENGINE ---
  const checkAutoScroll = (x: number, y: number) => {
    // Identifica qual container scrollável está sob o dedo
    const el = document.elementFromPoint(x, y);
    const scrollContainer = el?.closest('.custom-scrollbar') as HTMLElement;
    
    if (!scrollContainer) {
        stopAutoScroll();
        return;
    }

    const rect = scrollContainer.getBoundingClientRect();
    const distTop = y - rect.top;
    const distBottom = rect.bottom - y;

    if (distTop < SCROLL_ZONE_SIZE) {
        startAutoScroll(scrollContainer, -1); // Up
    } else if (distBottom < SCROLL_ZONE_SIZE) {
        startAutoScroll(scrollContainer, 1); // Down
    } else {
        stopAutoScroll();
    }
  };

  const startAutoScroll = (el: HTMLElement, dir: 1 | -1) => {
      if (scrollIntervalRef.current) return; // Já rodando
      
      scrollIntervalRef.current = window.setInterval(() => {
          el.scrollTop += (dir * SCROLL_SPEED);
      }, 20);
  };

  const stopAutoScroll = () => {
      if (scrollIntervalRef.current) {
          window.clearInterval(scrollIntervalRef.current);
          scrollIntervalRef.current = null;
      }
  };

  const startDrag = (player: Player, from: string) => {
      setDraggedPlayer({ player, from });
      // Posição inicial offscreen ou atual não importa muito pois atualiza no primeiro move
  };

  // Componentes auxiliares (EditableTitle, AddPlayerInput) mantidos simplificados para foco
  const EditableTitle = ({name, onSave}: any) => (
    <span className="font-bold text-xs uppercase cursor-pointer" onClick={()=>{}}>{name}</span>
  );
  const AddPlayerInput = ({onAdd}: any) => (
    <div onClick={()=>onAdd(prompt("Name:"))} className="mt-2 text-center text-xs opacity-50 p-2 border border-dashed border-white/10 rounded cursor-pointer">+ Add Player</div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Squad Management" maxWidth="max-w-5xl">
       <div 
         className="flex-1 flex flex-col h-full min-h-[60vh] relative"
         // Listener Global no container principal
         onTouchMove={handleGlobalTouchMove}
         onTouchEnd={handleGlobalTouchEnd}
       >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 flex-1">
             
             {/* Court A */}
             <DroppableZone 
                id="A" 
                isActive={!!draggedPlayer}
                className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 flex flex-col overflow-hidden h-[50vh]"
             >
                <div className="flex justify-between mb-2"><span className="text-indigo-400 font-bold text-xs">TEAM A</span></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {courtA.players.map(p => (
                        <PlayerItem 
                            key={p.id} player={p} locationId="A" 
                            onRemove={onRemove} onToggleFixed={onToggleFixed}
                            startDrag={startDrag}
                            isOriginal={draggedPlayer?.player.id === p.id}
                        />
                    ))}
                </div>
                <AddPlayerInput onAdd={(n:string) => onAddPlayer(n, 'A')} />
             </DroppableZone>

             {/* Queue */}
             <div className="flex flex-col gap-4 overflow-hidden h-[50vh]">
                 <div className="flex-1 bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex flex-col overflow-hidden">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Queue</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        {queue.map(team => (
                             <DroppableZone 
                                key={team.id} id={team.id}
                                isActive={!!draggedPlayer}
                                className="bg-black/20 p-2 rounded-xl border border-white/5"
                             >
                                {team.players.map(p => (
                                    <PlayerItem 
                                        key={p.id} player={p} locationId={team.id} 
                                        onRemove={onRemove} onToggleFixed={onToggleFixed}
                                        startDrag={startDrag}
                                        isOriginal={draggedPlayer?.player.id === p.id}
                                    />
                                ))}
                             </DroppableZone>
                        ))}
                    </div>
                    <AddPlayerInput onAdd={(n:string) => onAddPlayer(n, 'Queue')} />
                 </div>
             </div>

             {/* Court B */}
             <DroppableZone 
                id="B" 
                isActive={!!draggedPlayer}
                className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 flex flex-col overflow-hidden h-[50vh]"
             >
                <div className="flex justify-between mb-2"><span className="text-rose-400 font-bold text-xs">TEAM B</span></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {courtB.players.map(p => (
                        <PlayerItem 
                            key={p.id} player={p} locationId="B" 
                            onRemove={onRemove} onToggleFixed={onToggleFixed}
                            startDrag={startDrag}
                            isOriginal={draggedPlayer?.player.id === p.id}
                        />
                    ))}
                </div>
                <AddPlayerInput onAdd={(n:string) => onAddPlayer(n, 'B')} />
             </DroppableZone>

          </div>
          
          {/* Instruções Touch */}
          <div className="text-center text-[10px] text-slate-600 uppercase tracking-widest mt-2">
             Hold player to drag • Drag to edges to scroll
          </div>

          {/* GHOST ELEMENT (Seguindo o dedo) */}
          {draggedPlayer && (
              <div 
                className="fixed pointer-events-none z-[100] w-[200px]"
                style={{ 
                    left: ghostPos.x, 
                    top: ghostPos.y,
                    transform: 'translate(-50%, -50%)' 
                }}
              >
                  <PlayerItem 
                    player={draggedPlayer.player} 
                    locationId="" 
                    onRemove={()=>{}} 
                    startDrag={()=>{}} 
                    isGhost 
                  />
              </div>
          )}
       </div>
    </Modal>
  );
};