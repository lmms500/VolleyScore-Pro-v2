
import { useState, useCallback } from 'react';
import { Player, Team, TeamId, RotationReport } from '../types';
import { PLAYER_LIMIT_ON_COURT, PLAYERS_PER_TEAM } from '../constants';
import { sanitizeInput } from '../utils/security';

// Fallback generator
const generateId = () => Math.random().toString(36).substr(2, 9);

interface QueueState {
  courtA: Team;
  courtB: Team;
  queue: Team[];
  lastReport: RotationReport | null;
}

interface DeletedPlayerRecord {
  player: Player;
  originId: string;
  timestamp: number;
}

const INITIAL_QUEUE_STATE: QueueState = {
  courtA: { id: 'A', name: 'Home', players: [] },
  courtB: { id: 'B', name: 'Guest', players: [] },
  queue: [],
  lastReport: null
};

export const usePlayerQueue = (onNamesChange: (nameA: string, nameB: string) => void) => {
  const [queueState, setQueueState] = useState<QueueState>(INITIAL_QUEUE_STATE);
  const [deletedHistory, setDeletedHistory] = useState<DeletedPlayerRecord[]>([]);

  const _updateNames = (cA: Team, cB: Team) => {
    onNamesChange(cA.name, cB.name);
  };

  const createTeam = (name: string, players: Player[]): Team => ({
    id: generateId(),
    name: sanitizeInput(name),
    players
  });

  const createPlayer = (name: string): Player => ({
    id: generateId(),
    name: sanitizeInput(name),
    isFixed: false,
    fixedSide: null
  });

  const generateTeams = useCallback((namesList: string[]) => {
    const allPlayers: Player[] = namesList
      .filter(n => n.trim().length > 0)
      .map(name => createPlayer(name));

    const teamA_Players = allPlayers.slice(0, PLAYER_LIMIT_ON_COURT);
    const teamB_Players = allPlayers.slice(PLAYER_LIMIT_ON_COURT, PLAYER_LIMIT_ON_COURT * 2);
    
    const remainingPlayers = allPlayers.slice(PLAYER_LIMIT_ON_COURT * 2);
    const newQueue: Team[] = [];
    
    for (let i = 0; i < remainingPlayers.length; i += PLAYERS_PER_TEAM) {
      const chunk = remainingPlayers.slice(i, i + PLAYERS_PER_TEAM);
      const teamNumber = i / PLAYERS_PER_TEAM + 1;
      newQueue.push(createTeam(`Queue Team ${teamNumber}`, chunk));
    }

    const newCourtA: Team = { ...queueState.courtA, players: teamA_Players, name: 'Team A' };
    const newCourtB: Team = { ...queueState.courtB, players: teamB_Players, name: 'Team B' };

    setQueueState({
      courtA: newCourtA,
      courtB: newCourtB,
      queue: newQueue,
      lastReport: null
    });
    setDeletedHistory([]); 
    _updateNames(newCourtA, newCourtB);
  }, [queueState.courtA, queueState.courtB]);

  const updateTeamName = useCallback((teamId: string, name: string) => {
    const safeName = sanitizeInput(name);
    setQueueState(prev => {
      const newState = { ...prev };
      
      if (teamId === 'A' || teamId === prev.courtA.id) {
          newState.courtA = { ...prev.courtA, name: safeName };
      } 
      else if (teamId === 'B' || teamId === prev.courtB.id) {
          newState.courtB = { ...prev.courtB, name: safeName };
      } 
      else {
          newState.queue = prev.queue.map(t => 
              t.id === teamId ? { ...t, name: safeName } : t
          );
      }
      return newState;
    });
  }, []);

  const updatePlayerName = useCallback((playerId: string, newName: string) => {
    const safeName = sanitizeInput(newName);
    setQueueState(prev => {
        const updatePlayerInList = (players: Player[]) => 
            players.map(p => p.id === playerId ? { ...p, name: safeName } : p);

        if (prev.courtA.players.some(p => p.id === playerId)) {
            return { ...prev, courtA: { ...prev.courtA, players: updatePlayerInList(prev.courtA.players) }};
        }
        if (prev.courtB.players.some(p => p.id === playerId)) {
            return { ...prev, courtB: { ...prev.courtB, players: updatePlayerInList(prev.courtB.players) }};
        }
        const newQueue = prev.queue.map(team => ({
            ...team,
            players: updatePlayerInList(team.players)
        }));
        
        return { ...prev, queue: newQueue };
    });
  }, []);

  const togglePlayerFixed = useCallback((playerId: string, teamId?: string) => {
    setQueueState(prev => {
      const toggle = (p: Player, currentSide: string | null) => {
          const newIsFixed = !p.isFixed;
          return { 
              ...p, 
              isFixed: newIsFixed, 
              fixedSide: newIsFixed ? currentSide : null 
          };
      };

      let found = false;
      const newCourtA = { ...prev.courtA, players: prev.courtA.players.map(p => {
          if (p.id === playerId) { found = true; return toggle(p, 'A'); }
          return p;
      })};

      const newCourtB = found ? prev.courtB : { ...prev.courtB, players: prev.courtB.players.map(p => {
          if (p.id === playerId) { found = true; return toggle(p, 'B'); }
          return p;
      })};

      const newQueue = found ? prev.queue : prev.queue.map(team => ({
          ...team,
          players: team.players.map(p => {
              if (p.id === playerId) {
                  return toggle(p, team.id);
              }
              return p;
          })
      }));

      return { ...prev, courtA: newCourtA, courtB: newCourtB, queue: newQueue };
    });
  }, []);

  // --- UNIT ROTATION LOGIC ---
  const getRotationPreview = useCallback((winnerId: TeamId): RotationReport | null => {
    const { courtA, courtB, queue } = queueState;
    const loserSideId = winnerId === 'A' ? 'B' : 'A';
    const loserTeam = loserSideId === 'A' ? courtA : courtB;
    
    if (queue.length === 0) return null;

    const nextTeamInLine = queue[0];
    let newTeamPlayers = [...nextTeamInLine.players];
    let stolenPlayers: Player[] = [];
    
    let tempQueue = [...queue]; 
    tempQueue.shift(); 
    
    const neededPlayers = PLAYER_LIMIT_ON_COURT - newTeamPlayers.length;

    if (neededPlayers > 0) {
        let stillNeeded = neededPlayers;

        if (tempQueue.length > 0) {
            const donorTeam = tempQueue[0];
            const donorCandidates = donorTeam.players.filter(p => !p.isFixed);
            const toSteal = donorCandidates.slice(0, stillNeeded);
            
            if (toSteal.length > 0) {
                stolenPlayers.push(...toSteal);
                newTeamPlayers.push(...toSteal);
                stillNeeded -= toSteal.length;

                const stolenIds = new Set(toSteal.map(p => p.id));
                const newDonorPlayers = donorTeam.players.filter(p => !stolenIds.has(p.id));
                tempQueue[0] = { ...donorTeam, players: newDonorPlayers };
            }
        }

        if (stillNeeded > 0) {
             const loserCandidates = loserTeam.players.filter(p => !p.isFixed);
             const toSteal = loserCandidates.slice(0, stillNeeded);
             
             if (toSteal.length > 0) {
                 stolenPlayers.push(...toSteal);
                 newTeamPlayers.push(...toSteal);
                 stillNeeded -= toSteal.length;
             }
        }
    }

    const stolenIds = new Set(stolenPlayers.map(p => p.id));
    const loserPlayersGoingToQueue = loserTeam.players.filter(p => !stolenIds.has(p.id));

    if (loserPlayersGoingToQueue.length > 0) {
        tempQueue.push(createTeam(loserTeam.name, loserPlayersGoingToQueue));
    }
    
    tempQueue = tempQueue.filter(t => t.players.length > 0);

    return {
      outgoingTeam: loserTeam,
      incomingTeam: { 
          id: nextTeamInLine.id, 
          name: nextTeamInLine.name, 
          players: newTeamPlayers 
      },
      retainedPlayers: [], 
      stolenPlayers: stolenPlayers,
      queueAfterRotation: tempQueue
    };

  }, [queueState]);

  const rotateTeams = useCallback((winnerId: TeamId) => {
    const report = getRotationPreview(winnerId);
    if (!report) return;

    setQueueState(prev => {
      let nextCourtA: Team;
      let nextCourtB: Team;

      if (winnerId === 'A') {
          nextCourtA = prev.courtA; 
          nextCourtB = report.incomingTeam; 
      } else {
          nextCourtB = prev.courtB; 
          nextCourtA = report.incomingTeam; 
      }
      
      _updateNames(nextCourtA, nextCourtB);
      
      return {
        courtA: nextCourtA,
        courtB: nextCourtB,
        queue: report.queueAfterRotation,
        lastReport: report
      };
    });
  }, [getRotationPreview]);

  const addPlayer = useCallback((name: string, target: 'A' | 'B' | 'Queue') => {
    const safeName = sanitizeInput(name);
    if (!safeName) return;

    setQueueState(prev => {
      if (target === 'A' && prev.courtA.players.length >= PLAYER_LIMIT_ON_COURT) return prev;
      if (target === 'B' && prev.courtB.players.length >= PLAYER_LIMIT_ON_COURT) return prev;
      
      const newPlayer = createPlayer(safeName);
      
      if (target === 'A') {
        return { ...prev, courtA: { ...prev.courtA, players: [...prev.courtA.players, newPlayer] } };
      } else if (target === 'B') {
        return { ...prev, courtB: { ...prev.courtB, players: [...prev.courtB.players, newPlayer] } };
      } else {
        const newState = { ...prev, queue: [...prev.queue] };
        if (newState.queue.length > 0) {
            const lastIdx = newState.queue.length - 1;
            if (newState.queue[lastIdx].players.length < PLAYERS_PER_TEAM) {
                const updatedTeam = { ...newState.queue[lastIdx], players: [...newState.queue[lastIdx].players, newPlayer] };
                newState.queue[lastIdx] = updatedTeam;
            } else {
                newState.queue.push(createTeam(`Queue Team ${newState.queue.length + 1}`, [newPlayer]));
            }
        } else {
            newState.queue.push(createTeam(`Queue Team 1`, [newPlayer]));
        }
        return newState;
      }
    });
  }, []);

  const removePlayer = useCallback((id: string) => {
    setQueueState(prev => {
      let deletedPlayer: Player | undefined;
      let originId: string = '';

      if (prev.courtA.players.find(p => p.id === id)) {
          deletedPlayer = prev.courtA.players.find(p => p.id === id);
          if (deletedPlayer?.isFixed) return prev;
          originId = 'A';
      }
      else if (prev.courtB.players.find(p => p.id === id)) {
          deletedPlayer = prev.courtB.players.find(p => p.id === id);
          if (deletedPlayer?.isFixed) return prev;
          originId = 'B';
      }
      else {
          for (const team of prev.queue) {
              const p = team.players.find(pl => pl.id === id);
              if (p) {
                  deletedPlayer = p;
                  originId = team.id;
                  break;
              }
          }
      }

      if (!deletedPlayer) return prev;

      setDeletedHistory(hist => [...hist, { player: deletedPlayer!, originId, timestamp: Date.now() }]);

      const filterPlayer = (p: Player) => p.id !== id;
      const filterTeam = (t: Team) => ({ ...t, players: t.players.filter(filterPlayer) });

      return {
        ...prev,
        courtA: filterTeam(prev.courtA),
        courtB: filterTeam(prev.courtB),
        queue: prev.queue.map(filterTeam).filter(t => t.players.length > 0)
      };
    });
  }, []);

  const undoRemovePlayer = useCallback(() => {
    setDeletedHistory(prev => {
        if (prev.length === 0) return prev;
        const history = [...prev];
        const record = history.pop()!;
        
        setQueueState(qs => {
            const player = record.player;
            const target = record.originId;

            if (target === 'A') {
                if (qs.courtA.players.length < PLAYER_LIMIT_ON_COURT) {
                    return { ...qs, courtA: { ...qs.courtA, players: [...qs.courtA.players, player] } };
                }
            } 
            else if (target === 'B') {
                if (qs.courtB.players.length < PLAYER_LIMIT_ON_COURT) {
                    return { ...qs, courtB: { ...qs.courtB, players: [...qs.courtB.players, player] } };
                }
            } 
            else {
                const queueIndex = qs.queue.findIndex(t => t.id === target);
                if (queueIndex !== -1 && qs.queue[queueIndex].players.length < PLAYERS_PER_TEAM) {
                     const newQueue = [...qs.queue];
                     newQueue[queueIndex] = { ...newQueue[queueIndex], players: [...newQueue[queueIndex].players, player] };
                     return { ...qs, queue: newQueue };
                } else {
                    const newQueue = [...qs.queue];
                    if (newQueue.length > 0 && newQueue[newQueue.length-1].players.length < PLAYERS_PER_TEAM) {
                        newQueue[newQueue.length-1].players.push(player);
                    } else {
                        newQueue.push(createTeam(`Queue Team ${newQueue.length + 1}`, [player]));
                    }
                    return { ...qs, queue: newQueue };
                }
            }
            return qs; 
        });

        return history;
    });
  }, []);

  const commitDeletions = useCallback(() => { setDeletedHistory([]); }, []);
  const updateRosters = useCallback((cA: Player[], cB: Player[], q: Player[]) => { }, []);
  
  const movePlayer = useCallback((playerId: string, fromId: string, toId: string) => {
    setQueueState(prev => {
      const newState = { ...prev };
      
      let targetTeam: Team | null = null;
      if (toId === 'A') targetTeam = newState.courtA;
      else if (toId === 'B') targetTeam = newState.courtB;
      else if (toId !== 'Queue') {
          targetTeam = newState.queue.find(t => t.id === toId) || null;
      }

      if (targetTeam && targetTeam.players.length >= PLAYER_LIMIT_ON_COURT) return prev; 

      let player: Player | undefined;

      const removeFromQueue = (pid: string, tid: string): Player | undefined => {
          for (let i = 0; i < newState.queue.length; i++) {
              if (newState.queue[i].id === tid) {
                  const found = newState.queue[i].players.find(p => p.id === pid);
                  if (found) {
                      newState.queue[i].players = newState.queue[i].players.filter(p => p.id !== pid);
                      if (newState.queue[i].players.length === 0) newState.queue.splice(i, 1);
                      return found;
                  }
              }
          }
          return undefined;
      };

      if (fromId === 'A') {
        player = newState.courtA.players.find(p => p.id === playerId);
        if (player?.isFixed) return prev; 
        newState.courtA.players = newState.courtA.players.filter(p => p.id !== playerId);
      } else if (fromId === 'B') {
        player = newState.courtB.players.find(p => p.id === playerId);
        if (player?.isFixed) return prev; 
        newState.courtB.players = newState.courtB.players.filter(p => p.id !== playerId);
      } else {
        player = removeFromQueue(playerId, fromId);
      }

      if (!player) return prev;

      if (player.isFixed) {
          if (toId === 'Queue') {
              player.fixedSide = null; 
          } else {
              player.fixedSide = toId;
          }
      } else {
          player.fixedSide = null;
      }

      if (toId === 'A') {
        newState.courtA.players = [...newState.courtA.players, player];
      } else if (toId === 'B') {
        newState.courtB.players = [...newState.courtB.players, player];
      } else if (targetTeam && toId !== 'Queue') {
        targetTeam.players = [...targetTeam.players, player];
        newState.queue = newState.queue.map(t => t.id === targetTeam!.id ? targetTeam! : t);
      } else {
        if (newState.queue.length > 0) {
            const lastTeam = newState.queue[newState.queue.length - 1];
            if (lastTeam.players.length < PLAYERS_PER_TEAM) {
                lastTeam.players.push(player);
                if (player.isFixed) player.fixedSide = lastTeam.id;
            } else {
                const newTeam = createTeam(`Queue Team ${newState.queue.length + 1}`, [player]);
                newState.queue.push(newTeam);
                if (player.isFixed) player.fixedSide = newTeam.id;
            }
        } else {
             const newTeam = createTeam(`Queue Team 1`, [player]);
             newState.queue.push(newTeam);
             if (player.isFixed) player.fixedSide = newTeam.id;
        }
      }

      return newState;
    });
  }, []);

  return {
    queueState,
    generateTeams,
    updateTeamName,
    updatePlayerName,
    rotateTeams,
    getRotationPreview,
    togglePlayerFixed,
    updateRosters,
    movePlayer,
    addPlayer,
    removePlayer,
    undoRemovePlayer,
    commitDeletions,
    hasDeletedPlayers: deletedHistory.length > 0,
    deletedCount: deletedHistory.length
  };
};
