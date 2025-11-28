import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Team, Player } from '../../types';
import { Pin, Trash2, Shuffle, ArrowRight, ArrowLeftRight, Edit2, Plus, Undo2, Ban, Users, User } from 'lucide-react';

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
  onOpenMoveMenu: (player: Player, fromId: string) => void;
}

const PlayerItem: React.FC<PlayerItemProps> = ({ player, locationId, onToggleFixed, onRemove, onOpenMoveMenu }) => {
  return (
    <div className={`
        flex items-center justify-between p-2.5 rounded-xl mb-2 border transition-all
        ${player.isFixed 
          ? 'bg-indigo-500/10 border-indigo-500/30' 
          : 'bg-white/5 border-white/5'}
      `}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="p-1.5 bg-white/5 rounded-lg text-slate-500">
            <User size={14} />
        </div>
        
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
        {!player.isFixed && (
            <button 
                onClick={() => onOpenMoveMenu(player, locationId)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors text-[10px] font-bold uppercase tracking-wider"
            >
                Move <ArrowLeftRight size={12} />
            </button>
        )}
        <button onClick={() => onRemove(player.id)} className="text-slate-600 hover:text-rose-500 p-1.5 rounded hover:bg-rose-500/10 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const TeamContainer: React.FC<{
  title: React.ReactNode;
  count: number;
  max?: number;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}> = ({ title, count, max = 6, children, className, action }) => (
    <div className={`flex flex-col h-full rounded-2xl border flex-1 min-h-[350px] overflow-hidden ${className}`}>
        <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-2">{title}</div>
            <span className={`text-[10px] font-bold ${count >= max ? 'text-rose-400' : 'text-slate-500'}`}>
                {count}/{max}
            </span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {children}
        </div>
        {action && <div className="p-2 border-t border-white/5 bg-black/10">{action}</div>}
    </div>
);

const EditableTitle: React.FC<{ name: string; onSave: (val: string) => void; className?: string }> = ({ name, onSave, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(name);

  const save = () => { setIsEditing(false); if(val.trim() && val !== name) onSave(val.trim()); else setVal(name); };

  if(isEditing) {
    return <input autoFocus className="bg-black/50 text-white border-b border-white/50 outline-none w-[120px] px-1 text-xs font-bold uppercase" value={val} onChange={e => setVal(e.target.value)} onBlur={save} onKeyDown={e => e.key === 'Enter' && save()} />;
  }
  return (
      <div className={`flex items-center gap-2 group cursor-pointer ${className}`} onClick={() => setIsEditing(true)}>
          <span>{name}</span>
          <Edit2 size={10} className="opacity-0 group-hover:opacity-100 text-slate-400" />
      </div>
  );
};

const AddPlayerInput: React.FC<{ onAdd: (name: string) => void; disabled?: boolean }> = ({ onAdd, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');

    const submit = () => { if(name.trim()) { onAdd(name.trim()); setName(''); } setIsOpen(false); };

    if (isOpen && !disabled) {
        return (
            <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-1">
                <input autoFocus className="flex-1 bg-black/40 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500" placeholder="Name..." value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} onBlur={() => setTimeout(submit, 100)} />
                <button onClick={submit} className="p-1.5 bg-indigo-600 rounded-lg"><Plus size={14} /></button>
            </div>
        );
    }
    return (
        <button onClick={() => !disabled && setIsOpen(true)} disabled={disabled} className={`w-full py-2 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-dashed border-white/10 transition-all ${disabled ? 'text-slate-600 opacity-50' : 'text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/20'}`}>
            {disabled ? <><Ban size={12}/> Full</> : <><Plus size={12}/> Add Player</>}
        </button>
    );
};

export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({ 
  isOpen, onClose, courtA, courtB, queue, onGenerate, onToggleFixed, onRemove, onMove, onUpdateTeamName, onAddPlayer, onUndoRemove, canUndoRemove
}) => {
  const [rawNames, setRawNames] = useState('');
  const [view, setView] = useState<'input' | 'roster'>('roster');
  
  // State for Move Menu
  const [movingPlayer, setMovingPlayer] = useState<{player: Player, fromId: string} | null>(null);

  const handleGenerate = () => {
    const names = rawNames.split('\n').map(n => n.trim()).filter(n => n);
    if (names.length > 0) { onGenerate(names); setRawNames(''); setView('roster'); }
  };

  const handleMoveSelection = (toId: string) => {
      if (movingPlayer) {
          onMove(movingPlayer.player.id, movingPlayer.fromId, toId);
          setMovingPlayer(null);
      }
  };

  const isFull = (teamId: string) => {
      if (teamId === 'A') return courtA.players.length >= 6;
      if (teamId === 'B') return courtB.players.length >= 6;
      const qTeam = queue.find(t => t.id === teamId);
      return qTeam ? qTeam.players.length >= 6 : false;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Squad Management" maxWidth="max-w-6xl">
      
      {/* MOVE MENU OVERLAY */}
      {movingPlayer && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                  <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                      <div>
                          <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold block mb-1">Moving Player</span>
                          <h3 className="text-lg font-bold text-white leading-none">{movingPlayer.player.name}</h3>
                      </div>
                      <button onClick={() => setMovingPlayer(null)} className="text-xs text-slate-400 hover:text-white uppercase font-bold tracking-wider">Cancel</button>
                  </div>
                  <div className="p-4 grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 ml-1">Select Destination</p>
                      
                      {/* Court A Option */}
                      {movingPlayer.fromId !== 'A' && (
                          <button 
                            onClick={() => handleMoveSelection('A')}
                            disabled={isFull('A')}
                            className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-left disabled:opacity-40 disabled:cursor-not-allowed group"
                          >
                              <span className="font-bold text-indigo-300 text-sm">{courtA.name}</span>
                              {isFull('A') ? <span className="text-[10px] text-rose-400 font-bold uppercase">Full</span> : <ArrowRight size={16} className="text-indigo-500 group-hover:translate-x-1 transition-transform"/>}
                          </button>
                      )}

                      {/* Court B Option */}
                      {movingPlayer.fromId !== 'B' && (
                          <button 
                            onClick={() => handleMoveSelection('B')}
                            disabled={isFull('B')}
                            className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-left disabled:opacity-40 disabled:cursor-not-allowed group"
                          >
                              <span className="font-bold text-rose-300 text-sm">{courtB.name}</span>
                              {isFull('B') ? <span className="text-[10px] text-rose-400 font-bold uppercase">Full</span> : <ArrowRight size={16} className="text-rose-500 group-hover:translate-x-1 transition-transform"/>}
                          </button>
                      )}

                      <div className="h-px bg-white/10 my-1"></div>

                      {/* Queue Options */}
                      {queue.map((team, idx) => (
                          movingPlayer.fromId !== team.id && (
                            <button 
                                key={team.id}
                                onClick={() => handleMoveSelection(team.id)}
                                disabled={team.players.length >= 6}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-left disabled:opacity-40 disabled:cursor-not-allowed group"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-slate-500 bg-black/30 px-1.5 py-0.5 rounded">Q{idx+1}</span>
                                    <span className="font-bold text-slate-300 text-sm">{team.name}</span>
                                </div>
                                {team.players.length >= 6 ? <span className="text-[10px] text-rose-400 font-bold uppercase">Full</span> : <ArrowRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform"/>}
                            </button>
                          )
                      ))}
                      
                      {/* New Queue Team Option */}
                      <button 
                        onClick={() => handleMoveSelection('Queue')} // 'Queue' triggers adding to end/new team
                        className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/10 hover:bg-white/5 text-slate-400 hover:text-white transition-all mt-2"
                      >
                          <Plus size={14} /> <span className="text-xs font-bold uppercase tracking-wider">New Queue Team</span>
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex p-1 bg-white/5 rounded-xl mb-6 border border-white/5">
        <button onClick={() => setView('roster')} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${view === 'roster' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Current Roster</button>
        <button onClick={() => setView('input')} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${view === 'input' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Batch Input</button>
      </div>

      {view === 'input' ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-xs text-indigo-200 flex items-center gap-2"><ArrowRight size={14} />Paste names below (one per line).</p>
            </div>
            <textarea className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/10 focus:outline-none focus:border-indigo-500/50 font-mono text-sm resize-none custom-scrollbar"
               placeholder="John Doe&#10;Jane Smith&#10;..." value={rawNames} onChange={e => setRawNames(e.target.value)} />
            <Button onClick={handleGenerate} className="w-full" size="lg"><Shuffle size={18} /> Generate Teams</Button>
        </div>
      ) : (
        <div className="flex flex-col h-full min-h-[60vh] gap-4">
            
            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                
                {/* Team A */}
                <TeamContainer 
                    count={courtA.players.length}
                    className="bg-indigo-500/5 border-indigo-500/10"
                    title={<><div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_currentColor]"/> <EditableTitle name={courtA.name} onSave={n => onUpdateTeamName('A', n)} className="text-indigo-400 font-bold uppercase text-xs tracking-widest"/></>}
                    action={<AddPlayerInput onAdd={n => onAddPlayer(n, 'A')} disabled={courtA.players.length >= 6} />}
                >
                    {courtA.players.length === 0 && <div className="text-center text-xs text-slate-600 italic py-4">No players</div>}
                    {courtA.players.map(p => (
                        <PlayerItem key={p.id} player={p} locationId="A" onToggleFixed={onToggleFixed} onRemove={onRemove} onOpenMoveMenu={setMovingPlayer} />
                    ))}
                </TeamContainer>

                {/* Team B */}
                <TeamContainer 
                    count={courtB.players.length}
                    className="bg-rose-500/5 border-rose-500/10 lg:order-last"
                    title={<><div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_currentColor]"/> <EditableTitle name={courtB.name} onSave={n => onUpdateTeamName('B', n)} className="text-rose-400 font-bold uppercase text-xs tracking-widest"/></>}
                    action={<AddPlayerInput onAdd={n => onAddPlayer(n, 'B')} disabled={courtB.players.length >= 6} />}
                >
                    {courtB.players.length === 0 && <div className="text-center text-xs text-slate-600 italic py-4">No players</div>}
                    {courtB.players.map(p => (
                        <PlayerItem key={p.id} player={p} locationId="B" onToggleFixed={onToggleFixed} onRemove={onRemove} onOpenMoveMenu={setMovingPlayer} />
                    ))}
                </TeamContainer>

                {/* Queue Section (Scrollable List of Teams) */}
                <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-2 min-h-[350px]">
                    <div className="flex items-center justify-between px-2 pb-2 border-b border-white/5">
                        <h3 className="font-bold text-slate-500 text-xs uppercase tracking-widest flex items-center gap-2"><Users size={14}/> Queue</h3>
                        <AddPlayerInput onAdd={n => onAddPlayer(n, 'Queue')} />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 px-1">
                        {queue.length === 0 && <div className="text-center text-xs text-slate-600 italic py-10">Queue is empty</div>}
                        {queue.map((team, idx) => (
                            <TeamContainer
                                key={team.id}
                                count={team.players.length}
                                className="bg-black/20 border-white/5 min-h-0"
                                title={<><span className="font-mono text-[10px] text-slate-600">Q{idx+1}</span> <EditableTitle name={team.name} onSave={n => onUpdateTeamName(team.id, n)} className="text-slate-400 font-bold uppercase text-[10px] tracking-wider"/></>}
                            >
                                {team.players.map(p => (
                                    <PlayerItem key={p.id} player={p} locationId={team.id} onToggleFixed={onToggleFixed} onRemove={onRemove} onOpenMoveMenu={setMovingPlayer} />
                                ))}
                            </TeamContainer>
                        ))}
                    </div>
                </div>

            </div>
        </div>
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