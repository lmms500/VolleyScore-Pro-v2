
import { Player, Team } from '../types';
import { PLAYER_LIMIT_ON_COURT, PLAYERS_PER_TEAM } from '../constants';
import { v4 as uuidv4 } from 'uuid';

// --- HELPER FUNCTIONS ---

export const calculateTeamStrength = (players: Player[]): string => {
  if (players.length === 0) return "0.0";
  const sum = players.reduce((acc, p) => acc + p.skillLevel, 0);
  return (sum / players.length).toFixed(1);
};

const getNumericStrength = (players: Player[]): number => {
    if (players.length === 0) return 0;
    return players.reduce((acc, p) => acc + p.skillLevel, 0) / players.length;
};

const getTotalSkill = (players: Player[]): number => {
    return players.reduce((acc, p) => acc + p.skillLevel, 0);
};

const createTeamContainer = (id: string, name: string, players: Player[]): Team => ({
  id,
  name,
  players
});

// --- ALGORITHMS ---

/**
 * Global Balanced Draft (Weighted Anchor Logic)
 * 1. Places Fixed (Locked) players into their teams first (Anchors).
 * 2. Sorts Free Agents by Skill (Desc).
 * 3. Assigns Free Agents to the team with the LOWEST current Total Skill.
 */
export const balanceTeamsSnake = (
  allPlayers: Player[], 
  currentCourtA: Team, 
  currentCourtB: Team
): { courtA: Team, courtB: Team, queue: Team[] } => {
  
  const courtLimit = PLAYER_LIMIT_ON_COURT; // 6

  // 1. Separate Fixed (Anchors) vs Free Pool
  // We strictly respect where fixed players currently are.
  const fixedInA = currentCourtA.players.filter(p => p.isFixed);
  const fixedInB = currentCourtB.players.filter(p => p.isFixed);
  
  // Pool contains non-fixed players, Sorted by Skill DESC
  const pool = allPlayers.filter(p => !p.isFixed).sort((a, b) => {
    if (b.skillLevel !== a.skillLevel) return b.skillLevel - a.skillLevel;
    return a.originalIndex - b.originalIndex; // Stable sort fallback
  });

  // 2. Initialize Buckets with Anchors
  const totalPlayers = fixedInA.length + fixedInB.length + pool.length;
  const totalTeamsNeeded = Math.ceil(totalPlayers / courtLimit);
  
  const teamBuckets: Player[][] = Array.from({ length: totalTeamsNeeded }, () => []);
  teamBuckets[0] = [...fixedInA];
  if (totalTeamsNeeded > 1) teamBuckets[1] = [...fixedInB];

  // 3. Define Active Draft Buckets (Court A and Court B usually)
  const activeBucketIndices = [0, 1].filter(i => i < totalTeamsNeeded);

  // 4. Weighted Distribution
  for (const player of pool) {
      // Find valid buckets (those not full)
      const validBuckets = activeBucketIndices.filter(i => teamBuckets[i].length < courtLimit);
      
      if (validBuckets.length > 0) {
          // Find the WEAKEST bucket among valid ones
          // Sort by Total Skill ASC to balance
          validBuckets.sort((a, b) => getTotalSkill(teamBuckets[a]) - getTotalSkill(teamBuckets[b]));
          
          const targetIndex = validBuckets[0];
          teamBuckets[targetIndex].push(player);
      } else {
          // Both courts full, push to Queue buckets
          let placedInQueue = false;
          for (let i = 2; i < totalTeamsNeeded; i++) {
              if (teamBuckets[i].length < courtLimit) {
                  teamBuckets[i].push(player);
                  placedInQueue = true;
                  break;
              }
          }
          // If all allocated buckets full (edge case), extend
          if (!placedInQueue) {
              const newIdx = teamBuckets.length;
              teamBuckets[newIdx] = [player];
          }
      }
  }

  // 5. Reconstruct Teams
  const newCourtA = { ...currentCourtA, players: teamBuckets[0] || [] };
  const newCourtB = { ...currentCourtB, players: teamBuckets[1] || [] };
  
  const newQueue: Team[] = [];
  for (let i = 2; i < teamBuckets.length; i++) {
      if (teamBuckets[i] && teamBuckets[i].length > 0) {
          newQueue.push(createTeamContainer(uuidv4(), `Team ${i + 1}`, teamBuckets[i]));
      }
  }

  return { courtA: newCourtA, courtB: newCourtB, queue: newQueue };
};

/**
 * Standard Distribution (Restore Order)
 * Respects Fixed Players as Anchors.
 * 1. Fixed players stay in their current courts.
 * 2. Non-fixed players are sorted by Original Index.
 * 3. Non-fixed players fill gaps in A, then B, then Queue.
 */
export const distributeStandard = (
    allPlayers: Player[], 
    currentCourtA: Team, 
    currentCourtB: Team
  ): { courtA: Team, courtB: Team, queue: Team[] } => {
    
    // 1. Identify Anchors
    const anchorsA = currentCourtA.players.filter(p => p.isFixed);
    const anchorsB = currentCourtB.players.filter(p => p.isFixed);
    
    // 2. Identify Pool (Sorted by Index)
    const pool = allPlayers
        .filter(p => !p.isFixed)
        .sort((a, b) => a.originalIndex - b.originalIndex);
    
    // 3. Fill Court A
    const playersA = [...anchorsA];
    while (playersA.length < PLAYER_LIMIT_ON_COURT && pool.length > 0) {
        playersA.push(pool.shift()!);
    }
    // Re-sort A by index so fixed/non-fixed interleave naturally based on arrival order
    playersA.sort((a,b) => a.originalIndex - b.originalIndex);

    // 4. Fill Court B
    const playersB = [...anchorsB];
    while (playersB.length < PLAYER_LIMIT_ON_COURT && pool.length > 0) {
        playersB.push(pool.shift()!);
    }
    playersB.sort((a,b) => a.originalIndex - b.originalIndex);

    // 5. Create Queue
    const queueTeams: Team[] = [];
    let qIdx = 1;
    
    while (pool.length > 0) {
        const chunk = pool.splice(0, PLAYERS_PER_TEAM);
        queueTeams.push(createTeamContainer(uuidv4(), `Team ${qIdx + 2}`, chunk));
        qIdx++;
    }
  
    return {
      courtA: { ...currentCourtA, players: playersA },
      courtB: { ...currentCourtB, players: playersB },
      queue: queueTeams
    };
  };

// --- ROTATION LOGIC ---

export interface RotationResult {
    incomingTeam: Team;
    queue: Team[];
    stolenPlayers: Player[];
}

/**
 * Standard Rotation (Respects Locks):
 * 1. Loser -> Non-fixed players go to queue. Fixed players stay.
 * 2. Next team enters and merges with Fixed players.
 * 3. If merged team > 6, overflow players (non-fixed) go to end of queue.
 * 4. If merged team < 6, fill gaps by stealing from end of queue (skipping fixed).
 */
export const getStandardRotationResult = (
    loserTeam: Team, 
    currentQueue: Team[]
): RotationResult => {
    const queue = currentQueue.map(t => ({...t, players: [...t.players]})); // Deep copy
    
    // 1. Split Loser Team
    const anchors = loserTeam.players.filter(p => p.isFixed);
    const leavers = loserTeam.players.filter(p => !p.isFixed);
    
    // Push leavers to end of queue
    if (leavers.length > 0) {
        queue.push({ ...loserTeam, players: leavers, id: uuidv4() });
    }

    // 2. Determine Incoming Base
    // If queue is empty, incoming is just the anchors (logic handles refill below)
    let incomingBase = queue.shift();
    let incomingPlayers = incomingBase ? [...incomingBase.players] : [];
    
    // 3. Merge Anchors (They stay on court)
    // We add anchors to the incoming team.
    incomingPlayers.push(...anchors);
    
    // 4. Handle Overflow (If Incoming + Anchors > 6)
    const overflow: Player[] = [];
    while (incomingPlayers.length > PLAYER_LIMIT_ON_COURT) {
        // Eject non-fixed players to make room for anchors
        // We prefer to eject from the 'incoming' portion, preserving anchors.
        // We take from the 'start' of the array (FIFO) if they were added first, 
        // or look for non-fixed specifically.
        const ejectIdx = incomingPlayers.findIndex(p => !p.isFixed);
        if (ejectIdx !== -1) {
            const [ejected] = incomingPlayers.splice(ejectIdx, 1);
            overflow.push(ejected);
        } else {
            // Should theoretically not happen if logic is sound (cannot have >6 fixed players)
            // But if so, just pop.
            const [ejected] = incomingPlayers.splice(0, 1);
            overflow.push(ejected);
        }
    }

    // If we had overflow, push them to the end of the queue (or create new team)
    if (overflow.length > 0) {
        // Find last queue team to append, or create new
        if (queue.length > 0) {
            queue[queue.length - 1].players.push(...overflow);
        } else {
            queue.push(createTeamContainer(uuidv4(), "Overflow", overflow));
        }
    }

    // 5. Setup Incoming Container
    const incomingTeam = { 
        ...(incomingBase || loserTeam), 
        id: uuidv4(),
        players: incomingPlayers 
    };

    const stolenPlayers: Player[] = [];
    
    // 6. Fill gaps if needed (< 6 players)
    while (incomingTeam.players.length < PLAYER_LIMIT_ON_COURT) {
        let foundDonor = false;

        // Try to steal from the NEW queue (index 0 is the team AFTER incoming)
        for (const donorTeam of queue) {
            if (donorTeam.players.length > 0) {
                // Find last NON-FIXED player (Steal from end)
                let stolenIndex = -1;
                for (let i = donorTeam.players.length - 1; i >= 0; i--) {
                    if (!donorTeam.players[i].isFixed) {
                        stolenIndex = i;
                        break;
                    }
                }

                if (stolenIndex !== -1) {
                    const [stolen] = donorTeam.players.splice(stolenIndex, 1);
                    incomingTeam.players.push(stolen);
                    stolenPlayers.push(stolen);
                    foundDonor = true;
                    break;
                }
            }
        }
        if (!foundDonor) break; 
    }

    const cleanedQueue = queue.filter(t => t.players.length > 0);

    return {
        incomingTeam,
        queue: cleanedQueue,
        stolenPlayers
    };
};

/**
 * Balanced Rotation (Respects Locks):
 * 1. Loser -> Non-fixed go to queue. Fixed stay.
 * 2. Next team enters + merges.
 * 3. Handle Overflow.
 * 4. Fill gaps by picking players from Queue (Non-Fixed) that MINIMIZE skill delta.
 */
export const getBalancedRotationResult = (
    winnerTeam: Team,
    loserTeam: Team,
    currentQueue: Team[]
): RotationResult => {
    const queue = currentQueue.map(t => ({...t, players: [...t.players]}));
    
    // 1. Split Loser
    const anchors = loserTeam.players.filter(p => p.isFixed);
    const leavers = loserTeam.players.filter(p => !p.isFixed);
    
    if (leavers.length > 0) {
        queue.push({ ...loserTeam, players: leavers, id: uuidv4() });
    }

    // 2. Merge Incoming
    let incomingBase = queue.shift();
    let incomingPlayers = incomingBase ? [...incomingBase.players] : [];
    incomingPlayers.push(...anchors);

    // 3. Overflow
    const overflow: Player[] = [];
    while (incomingPlayers.length > PLAYER_LIMIT_ON_COURT) {
        const ejectIdx = incomingPlayers.findIndex(p => !p.isFixed);
        if (ejectIdx !== -1) {
            const [ejected] = incomingPlayers.splice(ejectIdx, 1);
            overflow.push(ejected);
        } else {
            const [ejected] = incomingPlayers.splice(0, 1);
            overflow.push(ejected);
        }
    }
    if (overflow.length > 0) {
        if (queue.length > 0) queue[queue.length - 1].players.push(...overflow);
        else queue.push(createTeamContainer(uuidv4(), "Overflow", overflow));
    }

    const incomingTeam = { 
        ...(incomingBase || loserTeam), 
        id: uuidv4(),
        players: incomingPlayers 
    };

    const targetAvg = getNumericStrength(winnerTeam.players);
    const stolenPlayers: Player[] = [];

    // 4. Fill Gaps (Balanced Draft)
    while (incomingTeam.players.length < PLAYER_LIMIT_ON_COURT) {
        let bestCandidate: { player: Player, teamIndex: number, playerIndex: number, delta: number } | null = null;
        
        const currentSum = incomingTeam.players.reduce((sum, p) => sum + p.skillLevel, 0);
        const nextCount = incomingTeam.players.length + 1;

        // Iterate all queue teams
        for (let tIdx = 0; tIdx < queue.length; tIdx++) {
            const team = queue[tIdx];
            for (let pIdx = 0; pIdx < team.players.length; pIdx++) {
                const player = team.players[pIdx];
                
                // Skip Locked Players in Queue (They cannot be stolen)
                if (player.isFixed) continue;

                // Simulate adding this player
                const newAvg = (currentSum + player.skillLevel) / nextCount;
                const delta = Math.abs(newAvg - targetAvg);

                if (!bestCandidate || delta < bestCandidate.delta) {
                    bestCandidate = { player, teamIndex: tIdx, playerIndex: pIdx, delta };
                }
            }
        }

        if (bestCandidate) {
            const sourceTeam = queue[bestCandidate.teamIndex];
            const [movedPlayer] = sourceTeam.players.splice(bestCandidate.playerIndex, 1);
            incomingTeam.players.push(movedPlayer);
            stolenPlayers.push(movedPlayer);
        } else {
            break; 
        }
    }

    const cleanedQueue = queue.filter(t => t.players.length > 0);

    return {
        incomingTeam,
        queue: cleanedQueue,
        stolenPlayers
    };
};
