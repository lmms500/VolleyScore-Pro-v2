import { useState, useCallback, useEffect, useMemo } from 'react';
import { Player, Team, TeamId, RotationReport, RotationMode, PlayerProfile, TeamColor } from '../types';
import { PLAYER_LIMIT_ON_COURT, PLAYERS_PER_TEAM } from '../constants';
import { sanitizeInput } from '../utils/security';
import { usePlayerProfiles } from './usePlayerProfiles';
import { balanceTeamsSnake, distributeStandard, getStandardRotationResult, getBalancedRotationResult } from '../utils/balanceUtils';
import { v4 as uuidv4 } from 'uuid';
import { arrayMove } from '@dnd-kit/sortable';

interface QueueState {
  courtA: Team;
  courtB: Team;
  queue: Team[];
  lastReport: RotationReport | null;
  mode: RotationMode;
}

interface DeletedPlayerRecord {
  player: Player;
  originId: string;
  timestamp: number;
}

const INITIAL_QUEUE_STATE: QueueState = {
  courtA: { id: 'A', name: 'Home', color: 'indigo', players: [] },
  courtB: { id: 'B', name: 'Guest', color: 'rose', players: [] },
  queue: [],
  lastReport: null,
  mode: 'standard'
};

export const usePlayerQueue = (onNamesChange: (nameA: string, nameB: string) => void) => {
  const [queueState, setQueueState] = useState<QueueState>(INITIAL_QUEUE_STATE);
  const [deletedHistory, setDeletedHistory] = useState<DeletedPlayerRecord[]>([]);
  
  const { profiles, upsertProfile, deleteProfile, findProfileByName, isReady: profilesReady } = usePlayerProfiles();

  // Internal helper, not exposed
  const _updateNames = useCallback((cA: Team, cB: Team) => {
    onNamesChange(cA.name, cB.name);
  }, [onNamesChange]);

  // --- SYNC ENGINE (Simplified - only runs when profilesReady changes to true) ---
  useEffect(() => {
    if (!profilesReady) return;
    // Just mark that profiles are ready - don't sync on every profile change
    // This prevents infinite loops from the Map changing references
  }, [profilesReady]);


  // --- FACTORIES (Pure functions, no hooks needed) ---
  const createPlayer = useCallback((name: string, index: number, existingProfile?: PlayerProfile, number?: string, skillLevel?: number): Player => {
      const safeName = sanitizeInput(name);
      const profile = existingProfile;

      return {
          id: uuidv4(),
          profileId: profile?.id,
          name: profile ? profile.name : safeName,
          number: number || undefined, 
          skillLevel: skillLevel !== undefined ? skillLevel : (profile ? profile.skillLevel : 3),
          isFixed: false,
          fixedSide: null,
          originalIndex: index
      };
  }, []);

  const createTeam = (name: string, players: Player[], color: TeamColor = 'slate'): Team => ({
    id: uuidv4(),
    name: sanitizeInput(name),
    color,
    players
  });

  // --- ACTIONS ---

  const setRotationMode = useCallback((mode: RotationMode) => {
      setQueueState(prev => ({ ...prev, mode }));
  }, []);

  const overrideQueueState = useCallback((courtA: Team, courtB: Team, queue: Team[]) => {
      console.log("[Queue] Overriding State from Snapshot (Undo)");
      setQueueState(prev => ({
          ...prev,
          courtA,
          courtB,
          queue,
          lastReport: null 
      }));
  }, []);

  const balanceTeams = useCallback(() => {
    setQueueState(prev => {
        const allPlayers = [
            ...prev.courtA.players,
            ...prev.courtB.players,
            ...prev.queue.flatMap(t => t.players)
        ];

        let result;
        if (prev.mode === 'balanced') {
            result = balanceTeamsSnake(allPlayers, prev.courtA, prev.courtB, prev.queue);
        } else {
            result = distributeStandard(allPlayers, prev.courtA, prev.courtB, prev.queue);
        }

        return {
            ...prev,
            courtA: result.courtA,
            courtB: result.courtB,
            queue: result.queue,
            lastReport: null
        };
    });
  }, []);

  const generateTeams = useCallback((namesList: string[]) => {
    const validNames = namesList.filter(n => n.trim().length > 0);
    const allNewPlayers = validNames.map((name, idx) => createPlayer(name, idx));

    setQueueState(prev => {
        const cleanA = { ...prev.courtA, players: [] };
        const cleanB = { ...prev.courtB, players: [] };
        
        const result = distributeStandard(allNewPlayers, cleanA, cleanB, []);
        
        _updateNames(result.courtA, result.courtB);

        return {
            ...prev,
            courtA: result.courtA,
            courtB: result.courtB,
            queue: result.queue,
            lastReport: null
        };
    });
    setDeletedHistory([]);
  }, [createPlayer, _updateNames]); 

  // --- PERSISTENCE & SYNC ---
  const savePlayerToProfile = useCallback((playerId: string) => {
      setQueueState(prev => {
          let target: Player | undefined;
          [...prev.courtA.players, ...prev.courtB.players, ...prev.queue.flatMap(t => t.players)].forEach(p => {
              if (p.id === playerId) target = p;
          });

          if (!target) return prev;

          const profile = upsertProfile(target.name, target.skillLevel, target.profileId);
          
          const linkList = (list: Player[]) => list.map(p => p.id === playerId ? { ...p, profileId: profile.id } : p);
          
          return {
                 ...prev,
                 courtA: { ...prev.courtA, players: linkList(prev.courtA.players) },
                 courtB: { ...prev.courtB, players: linkList(prev.courtB.players) },
                 queue: prev.queue.map(t => ({ ...t, players: linkList(t.players) }))
          };
      });
  }, [upsertProfile]);

  const revertPlayerChanges = useCallback((playerId: string) => {
     setQueueState(prev => {
         const revertList = (list: Player[]): Player[] => list.map(p => {
             if (p.id === playerId && p.profileId) {
                 const master = profiles.get(p.profileId);
                 if (master) return { ...p, name: master.name, skillLevel: master.skillLevel };
             }
             return p;
         });

         return {
             ...prev,
             courtA: { ...prev.courtA, players: revertList(prev.courtA.players) },
             courtB: { ...prev.courtB, players: revertList(prev.courtB.players) },
             queue: prev.queue.map(t => ({ ...t, players: revertList(t.players) }))
         };
     });
  }, [profiles]);

  // --- CRUD ---

  const updatePlayer = useCallback((playerId: string, updates: Partial<Player>) => {
    setQueueState(prev => {
        const updateList = (list: Player[]) => list.map(p => p.id === playerId ? { ...p, ...updates } : p);
        return {
            ...prev,
            courtA: { ...prev.courtA, players: updateList(prev.courtA.players) },
            courtB: { ...prev.courtB, players: updateList(prev.courtB.players) },
            queue: prev.queue.map(t => ({ ...t, players: updateList(t.players) }))
        };
    });
  }, []);

  const updatePlayerName = useCallback((id: string, name: string) => updatePlayer(id, { name }), [updatePlayer]);
  const updatePlayerNumber = useCallback((id: string, number: string) => updatePlayer(id, { number }), [updatePlayer]);
  const updatePlayerSkill = useCallback((id: string, skillLevel: number) => updatePlayer(id, { skillLevel }), [updatePlayer]);

  const updateTeamName = useCallback((teamId: string, name: string) => {
    const safeName = sanitizeInput(name);
    setQueueState(prev => {
      const newState = { ...prev };
      if (teamId === 'A' || teamId === prev.courtA.id) newState.courtA = { ...prev.courtA, name: safeName };
      else if (teamId === 'B' || teamId === prev.courtB.id) newState.courtB = { ...prev.courtB, name: safeName };
      else newState.queue = prev.queue.map(t => t.id === teamId ? { ...t, name: safeName } : t);
      return newState;
    });
  }, []);

  const updateTeamColor = useCallback((teamId: string, color: TeamColor) => {
    setQueueState(prev => {
      const newState = { ...prev };
      if (teamId === 'A' || teamId === prev.courtA.id) newState.courtA = { ...prev.courtA, color };
      else if (teamId === 'B' || teamId === prev.courtB.id) newState.courtB = { ...prev.courtB, color };
      else newState.queue = prev.queue.map(t => t.id === teamId ? { ...t, color } : t);
      return newState;
    });
  }, []);

  // --- ROTATION & MOVEMENT ---

  const getRotationPreview = useCallback((winnerId: TeamId): RotationReport | null => {
    const { courtA, courtB, queue, mode } = queueState;
    if (queue.length === 0 && courtA.players.length >= PLAYER_LIMIT_ON_COURT && courtB.players.length >= PLAYER_LIMIT_ON_COURT) {
       return null;
    }

    const winnerTeam = winnerId === 'A' ? courtA : courtB;
    const loserTeam = winnerId === 'A' ? courtB : courtA;

    if (mode === 'balanced') {
        const result = getBalancedRotationResult(winnerTeam, loserTeam, queue);
        return {
            outgoingTeam: loserTeam,
            incomingTeam: result.incomingTeam,
            retainedPlayers: [],
            stolenPlayers: result.stolenPlayers,
            queueAfterRotation: result.queueAfterRotation
        };
    } else {
        const result = getStandardRotationResult(winnerTeam, loserTeam, queue);
        return {
            outgoingTeam: loserTeam,
            incomingTeam: result.incomingTeam,
            retainedPlayers: [],
            stolenPlayers: result.stolenPlayers,
            queueAfterRotation: result.queueAfterRotation
        };
    }
  }, [queueState]);

  const rotateTeams = useCallback((winnerId: TeamId, manualReport?: RotationReport | null) => {
    const report = manualReport || getRotationPreview(winnerId);
    
    if (!report) {
        console.warn("Rotation attempted but no report generated. Queue likely empty.");
        return;
    }

    setQueueState(prev => {
      const nextCourtA = winnerId === 'A' ? prev.courtA : report.incomingTeam;
      const nextCourtB = winnerId === 'B' ? prev.courtB : report.incomingTeam;
      
      _updateNames(nextCourtA, nextCourtB);
      
      return {
        ...prev,
        courtA: nextCourtA,
        courtB: nextCourtB,
        queue: report.queueAfterRotation,
        lastReport: report
      };
    });
  }, [getRotationPreview, _updateNames]);

  const addPlayer = useCallback((name: string, target: 'A' | 'B' | 'Queue', number?: string, skill?: number) => {
      setQueueState(prev => {
          const getMaxIndex = (s: QueueState) => {
              const all = [...s.courtA.players, ...s.courtB.players, ...s.queue.flatMap(t => t.players)];
              return all.reduce((max, p) => Math.max(max, p.originalIndex), -1);
          };

          const safeName = sanitizeInput(name);
          const profile = findProfileByName(safeName);
          
          const newPlayer = createPlayer(safeName, getMaxIndex(prev) + 1, profile, number, skill);
          
          if (target === 'A' && prev.courtA.players.length < PLAYER_LIMIT_ON_COURT) {
              return { ...prev, courtA: { ...prev.courtA, players: [...prev.courtA.players, newPlayer] } };
          }
          if (target === 'B' && prev.courtB.players.length < PLAYER_LIMIT_ON_COURT) {
              return { ...prev, courtB: { ...prev.courtB, players: [...prev.courtB.players, newPlayer] } };
          }
          if (target === 'Queue') {
              const newQueue = [...prev.queue];
              if (newQueue.length > 0 && newQueue[newQueue.length - 1].players.length < PLAYERS_PER_TEAM) {
                  const last = newQueue[newQueue.length - 1];
                  newQueue[newQueue.length - 1] = { ...last, players: [...last.players, newPlayer] };
              } else {
                  newQueue.push(createTeam(`Queue Team ${newQueue.length + 1}`, [newPlayer], 'slate'));
              }
              return { ...prev, queue: newQueue };
          }
          return prev;
      });
  }, [findProfileByName, createPlayer]);

  const removePlayer = useCallback((id: string) => {
    setQueueState(prev => {
       let deletedPlayer: Player | undefined;
       let originId = '';
       
       const findAndRemove = (list: Player[]) => {
           const found = list.find(p => p.id === id);
           if (found) { deletedPlayer = found; return list.filter(p => p.id !== id); }
           return list;
       };

       let newA = findAndRemove(prev.courtA.players);
       let newB = prev.courtA.players === newA ? findAndRemove(prev.courtB.players) : prev.courtB.players;
       if (prev.courtA.players === newA && prev.courtB.players === newB) originId = 'Queue';
       else originId = prev.courtA.players !== newA ? 'A' : 'B';

       if(!deletedPlayer && originId === 'Queue') {
           const newQueue = prev.queue.map(t => {
               const p = t.players.find(pl => pl.id === id);
               if(p) { deletedPlayer = p; return { ...t, players: t.players.filter(pl => pl.id !== id) }; }
               return t;
           }).filter(t => t.players.length > 0);
           
           if(deletedPlayer) {
                setDeletedHistory(h => [...h, { player: deletedPlayer!, originId: 'Queue', timestamp: Date.now() }]);
                return { ...prev, queue: newQueue };
           }
       }

       if (deletedPlayer) {
           setDeletedHistory(h => [...h, { player: deletedPlayer!, originId, timestamp: Date.now() }]);
           return {
               ...prev,
               courtA: { ...prev.courtA, players: newA },
               courtB: { ...prev.courtB, players: newB }
           };
       }
       return prev;
    });
  }, []);

  const undoRemovePlayer = useCallback(() => {
     setDeletedHistory(prev => {
        if (prev.length === 0) return prev;
        const history = [...prev];
        const record = history.pop()!;
        
        setQueueState(qs => {
             const { player, originId } = record;
             if (originId === 'A') return { ...qs, courtA: { ...qs.courtA, players: [...qs.courtA.players, player] }};
             if (originId === 'B') return { ...qs, courtB: { ...qs.courtB, players: [...qs.courtB.players, player] }};
             const newQueue = [...qs.queue];
             if(newQueue.length > 0) newQueue[newQueue.length -1].players.push(player);
             else newQueue.push(createTeam("Restored", [player], 'slate'));
             return { ...qs, queue: newQueue };
        });
        return history;
     });
  }, []);

  const movePlayer = useCallback((playerId: string, fromId: string, toId: string, newIndex?: number) => {
      setQueueState(prev => {
         // Same Team
         if (fromId === toId) {
             const reorderList = (list: Player[]) => {
                 const oldIndex = list.findIndex(p => p.id === playerId);
                 if (oldIndex !== -1 && newIndex !== undefined) {
                     return arrayMove(list, oldIndex, newIndex);
                 }
                 return list;
             };

             let newA = prev.courtA;
             let newB = prev.courtB;
             let newQ = prev.queue;

             if (fromId === 'A' || fromId === prev.courtA.id) newA = { ...newA, players: reorderList(newA.players) };
             else if (fromId === 'B' || fromId === prev.courtB.id) newB = { ...newB, players: reorderList(newB.players) };
             else {
                 newQ = newQ.map(t => t.id === fromId ? { ...t, players: reorderList(t.players) } : t);
             }
             return { ...prev, courtA: newA, courtB: newB, queue: newQ };
         }

         // Cross Team
         let player: Player | undefined;
         let newA = { ...prev.courtA };
         let newB = { ...prev.courtB };
         let newQ = [...prev.queue];

         const removeFromList = (list: Player[]) => list.filter(p => p.id !== playerId);
         
         if (fromId === 'A' || fromId === prev.courtA.id) {
             player = newA.players.find(p => p.id === playerId);
             newA.players = removeFromList(newA.players);
         } else if (fromId === 'B' || fromId === prev.courtB.id) {
             player = newB.players.find(p => p.id === playerId);
             newB.players = removeFromList(newB.players);
         } else {
             newQ = newQ.map(t => {
                 if (t.id === fromId) {
                     const found = t.players.find(p => p.id === playerId);
                     if (found) player = found;
                     return { ...t, players: removeFromList(t.players) };
                 }
                 return t;
             });
         }

         if (!player) return prev;

         const addToList = (list: Player[], p: Player, idx?: number) => {
             const copy = [...list];
             if (idx !== undefined && idx >= 0 && idx <= copy.length) {
                 copy.splice(idx, 0, p);
             } else {
                 copy.push(p);
             }
             return copy;
         };

         if (toId === 'A' || toId === prev.courtA.id) {
             newA.players = addToList(newA.players, player, newIndex);
         } else if (toId === 'B' || toId === prev.courtB.id) {
             newB.players = addToList(newB.players, player, newIndex);
         } else {
             const targetIdx = newQ.findIndex(t => t.id === toId);
             if (targetIdx >= 0) {
                 newQ[targetIdx] = { 
                     ...newQ[targetIdx], 
                     players: addToList(newQ[targetIdx].players, player, newIndex) 
                 };
             }
         }
         
         return { ...prev, courtA: newA, courtB: newB, queue: newQ };
      });
  }, []);
  
  const togglePlayerFixed = useCallback((playerId: string) => {
      setQueueState(prev => {
          const toggle = (list: Player[]) => list.map(p => p.id === playerId ? { ...p, isFixed: !p.isFixed } : p);
          
          return {
              ...prev,
              courtA: { ...prev.courtA, players: toggle(prev.courtA.players) },
              courtB: { ...prev.courtB, players: toggle(prev.courtB.players) },
              queue: prev.queue.map(t => ({ ...t, players: toggle(t.players) }))
          };
      });
  }, []);

  const sortTeam = useCallback((teamId: string, criteria: 'name' | 'number' | 'skill') => {
      setQueueState(prev => {
          const sortFn = (a: Player, b: Player) => {
              if (criteria === 'name') return a.name.localeCompare(b.name);
              if (criteria === 'number') {
                  const nA = parseInt(a.number || '999');
                  const nB = parseInt(b.number || '999');
                  return nA - nB;
              }
              if (criteria === 'skill') return b.skillLevel - a.skillLevel;
              return 0;
          };

          const doSort = (list: Player[]) => [...list].sort(sortFn);

          let newA = prev.courtA;
          let newB = prev.courtB;
          let newQ = prev.queue;

          if (teamId === 'A' || teamId === prev.courtA.id) newA = { ...newA, players: doSort(newA.players) };
          else if (teamId === 'B' || teamId === prev.courtB.id) newB = { ...newB, players: doSort(newB.players) };
          else {
              newQ = newQ.map(t => t.id === teamId ? { ...t, players: doSort(t.players) } : t);
          }

          return { ...prev, courtA: newA, courtB: newB, queue: newQ };
      });
  }, []);
  
  const commitDeletions = useCallback(() => setDeletedHistory([]), []);

  // Memoize queueState to stabilize reference (only changes when players/queue actually changes)
  const memoizedQueueState = useMemo(() => queueState, [
    queueState.courtA.players.length, 
    queueState.courtB.players.length, 
    queueState.queue.length,
    queueState.mode
  ]);

  // OPTIMIZATION: Memoize the return object to keep stable references for functions
  return useMemo(() => ({
    queueState: memoizedQueueState,
    generateTeams,
    updateTeamName,
    updateTeamColor,
    updatePlayerName,
    updatePlayerNumber,
    updatePlayerSkill,
    rotateTeams,
    getRotationPreview,
    overrideQueueState, 
    togglePlayerFixed,
    movePlayer,
    addPlayer,
    removePlayer,
    undoRemovePlayer,
    commitDeletions,
    hasDeletedPlayers: deletedHistory.length > 0,
    deletedCount: deletedHistory.length,
    setRotationMode,
    balanceTeams,
    sortTeam,
    savePlayerToProfile,
    revertPlayerChanges,
    deleteProfile,
    upsertProfile,
    profiles
  }), [
    memoizedQueueState, deletedHistory.length, profiles, 
    generateTeams, updateTeamName, updateTeamColor, updatePlayerName, updatePlayerNumber, updatePlayerSkill,
    rotateTeams, getRotationPreview, overrideQueueState, togglePlayerFixed, movePlayer, addPlayer, removePlayer,
    undoRemovePlayer, commitDeletions, setRotationMode, balanceTeams, sortTeam, savePlayerToProfile, revertPlayerChanges,
    deleteProfile, upsertProfile
  ]);
};