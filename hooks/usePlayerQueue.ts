
import { useState, useCallback, useEffect } from 'react';
import { Player, Team, TeamId, RotationReport, RotationMode, PlayerProfile } from '../types';
import { PLAYER_LIMIT_ON_COURT, PLAYERS_PER_TEAM } from '../constants';
import { sanitizeInput } from '../utils/security';
import { usePlayerProfiles } from './usePlayerProfiles';
import { balanceTeamsSnake, distributeStandard } from '../utils/balanceUtils';
import { v4 as uuidv4 } from 'uuid';

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
  courtA: { id: 'A', name: 'Home', players: [] },
  courtB: { id: 'B', name: 'Guest', players: [] },
  queue: [],
  lastReport: null,
  mode: 'standard'
};

export const usePlayerQueue = (onNamesChange: (nameA: string, nameB: string) => void) => {
  const [queueState, setQueueState] = useState<QueueState>(INITIAL_QUEUE_STATE);
  const [deletedHistory, setDeletedHistory] = useState<DeletedPlayerRecord[]>([]);
  
  const { profiles, upsertProfile, deleteProfile, findProfileByName, isReady: profilesReady } = usePlayerProfiles();

  const _updateNames = (cA: Team, cB: Team) => {
    onNamesChange(cA.name, cB.name);
  };

  // --- SYNC ENGINE ---
  useEffect(() => {
    if (!profilesReady) return;

    setQueueState(prev => {
      let hasChanges = false;
      
      const syncList = (list: Player[]): Player[] => {
          return list.map(p => {
              if (!p.profileId) return p;
              const master = profiles.get(p.profileId);
              
              if (!master) {
                   hasChanges = true;
                   return { ...p, profileId: undefined }; // Unlink if master deleted
              }

              if (master.name !== p.name || master.skillLevel !== p.skillLevel) {
                  hasChanges = true;
                  return { ...p, name: master.name, skillLevel: master.skillLevel };
              }
              return p;
          });
      };

      const newCourtA = { ...prev.courtA, players: syncList(prev.courtA.players) };
      const newCourtB = { ...prev.courtB, players: syncList(prev.courtB.players) };
      const newQueue = prev.queue.map(t => ({ ...t, players: syncList(t.players) }));

      if (!hasChanges) return prev;

      return { ...prev, courtA: newCourtA, courtB: newCourtB, queue: newQueue };
    });
  }, [profiles, profilesReady]);


  // --- FACTORIES ---
  const createPlayer = (name: string, index: number, existingProfile?: PlayerProfile): Player => {
      const safeName = sanitizeInput(name);
      const profile = existingProfile || findProfileByName(safeName);

      return {
          id: uuidv4(),
          profileId: profile?.id,
          name: profile ? profile.name : safeName,
          skillLevel: profile ? profile.skillLevel : 3, // Default 3 stars
          isFixed: false,
          fixedSide: null,
          originalIndex: index // Critical for Restore Order
      };
  };

  const createTeam = (name: string, players: Player[]): Team => ({
    id: uuidv4(),
    name: sanitizeInput(name),
    players
  });

  // --- ACTIONS ---

  const setRotationMode = useCallback((mode: RotationMode) => {
      setQueueState(prev => ({ ...prev, mode }));
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
            result = balanceTeamsSnake(allPlayers, prev.courtA, prev.courtB);
        } else {
            result = distributeStandard(allPlayers, prev.courtA, prev.courtB);
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
    // Create new players preserving index
    const allNewPlayers = validNames.map((name, idx) => createPlayer(name, idx));

    setQueueState(prev => {
        // When generating from scratch, we usually default to standard distribution initially
        const result = distributeStandard(allNewPlayers, prev.courtA, prev.courtB);
        
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
  }, [profiles, findProfileByName]); 

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

  // --- ROTATION & MOVEMENT ---

  const getRotationPreview = useCallback((winnerId: TeamId): RotationReport | null => {
    const { courtA, courtB, queue } = queueState;
    if (queue.length === 0) return null;

    const loserId = winnerId === 'A' ? 'B' : 'A';
    const loserTeam = loserId === 'A' ? courtA : courtB;
    const nextTeamInLine = queue[0];
    
    // Simple Rotation for now: Swap loser with queue head
    // (Complex steal logic removed for clarity, easy to re-add)
    let newQueue = [...queue];
    newQueue.shift();
    newQueue.push({ ...loserTeam, id: uuidv4() }); // Push loser to back

    return {
      outgoingTeam: loserTeam,
      incomingTeam: nextTeamInLine,
      retainedPlayers: [], 
      stolenPlayers: [],
      queueAfterRotation: newQueue
    };

  }, [queueState]);

  const rotateTeams = useCallback((winnerId: TeamId) => {
    const report = getRotationPreview(winnerId);
    if (!report) return;

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
  }, [getRotationPreview]);

  const addPlayer = useCallback((name: string, target: 'A' | 'B' | 'Queue') => {
      const getMaxIndex = (s: QueueState) => {
          const all = [...s.courtA.players, ...s.courtB.players, ...s.queue.flatMap(t => t.players)];
          return all.reduce((max, p) => Math.max(max, p.originalIndex), -1);
      };

      setQueueState(prev => {
          const newPlayer = createPlayer(name, getMaxIndex(prev) + 1);
          
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
                  newQueue.push(createTeam(`Queue Team ${newQueue.length + 1}`, [newPlayer]));
              }
              return { ...prev, queue: newQueue };
          }
          return prev;
      });
  }, [findProfileByName]);

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
           // Queue search
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
             // Simple queue restore
             const newQueue = [...qs.queue];
             if(newQueue.length > 0) newQueue[newQueue.length -1].players.push(player);
             else newQueue.push(createTeam("Restored", [player]));
             return { ...qs, queue: newQueue };
        });
        return history;
     });
  }, []);

  const movePlayer = useCallback((playerId: string, fromId: string, toId: string) => {
      setQueueState(prev => {
         let player: Player | undefined;
         let newA = { ...prev.courtA };
         let newB = { ...prev.courtB };
         let newQ = [...prev.queue];

         const removeFromList = (list: Player[]) => list.filter(p => p.id !== playerId);
         const addToList = (list: Player[], p: Player) => [...list, p];

         if (fromId === 'A') { player = newA.players.find(p => p.id === playerId); newA.players = removeFromList(newA.players); }
         else if (fromId === 'B') { player = newB.players.find(p => p.id === playerId); newB.players = removeFromList(newB.players); }
         else {
             newQ = newQ.map(t => {
                 if (t.id === fromId) {
                     const found = t.players.find(p => p.id === playerId);
                     if (found) player = found;
                     return { ...t, players: removeFromList(t.players) };
                 }
                 return t;
             }).filter(t => t.players.length > 0);
         }

         if (!player) return prev;

         if (toId === 'A') newA.players = addToList(newA.players, player);
         else if (toId === 'B') newB.players = addToList(newB.players, player);
         else {
             const targetIdx = newQ.findIndex(t => t.id === toId);
             if (targetIdx >= 0) {
                 newQ[targetIdx] = { ...newQ[targetIdx], players: addToList(newQ[targetIdx].players, player) };
             }
         }
         
         return { ...prev, courtA: newA, courtB: newB, queue: newQ };
      });
  }, []);
  
  const togglePlayerFixed = useCallback((playerId: string) => {
      setQueueState(prev => {
          let side: 'A' | 'B' | null = null;
          if (prev.courtA.players.some(p => p.id === playerId)) side = 'A';
          else if (prev.courtB.players.some(p => p.id === playerId)) side = 'B';
          
          const toggle = (list: Player[]) => list.map(p => p.id === playerId ? { ...p, isFixed: !p.isFixed, fixedSide: !p.isFixed ? side : null } : p);
          
          return {
              ...prev,
              courtA: { ...prev.courtA, players: toggle(prev.courtA.players) },
              courtB: { ...prev.courtB, players: toggle(prev.courtB.players) },
              queue: prev.queue.map(t => ({ ...t, players: toggle(t.players) }))
          };
      });
  }, []);
  

  return {
    queueState,
    generateTeams,
    updateTeamName,
    updatePlayerName: (id: string, name: string) => updatePlayer(id, { name }),
    updatePlayerSkill: (id: string, skillLevel: number) => updatePlayer(id, { skillLevel }),
    rotateTeams,
    getRotationPreview,
    togglePlayerFixed,
    movePlayer,
    addPlayer,
    removePlayer,
    undoRemovePlayer,
    commitDeletions: () => setDeletedHistory([]),
    hasDeletedPlayers: deletedHistory.length > 0,
    deletedCount: deletedHistory.length,
    setRotationMode,
    balanceTeams,
    savePlayerToProfile,
    revertPlayerChanges,
    deleteProfile, 
    profiles
  };
};