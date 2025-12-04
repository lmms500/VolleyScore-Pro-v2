
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
 * 1. Identifies Fixed (Locked) players in Courts AND Queue (Anchors).
 * 2. Sorts Free Agents by Skill (Desc).
 * 3. Assigns Free Agents to the team with the LOWEST current Total Skill.
 */
export const balanceTeamsSnake = (
  allPlayers: Player[], 
  currentCourtA: Team, 
  currentCourtB: Team,
  currentQueue: Team[]
): { courtA: Team, courtB: Team, queue: Team[] } => {
  
  const courtLimit = PLAYER_LIMIT_ON_COURT; // 6

  // 1. Identify Anchors for every possible slot
  // Mapped indices: 0=A, 1=B, 2=Q0, 3=Q1...
  const currentStructure = [currentCourtA, currentCourtB, ...currentQueue];
  
  // Extract locked players for each existing bucket
  const anchors: Player[][] = currentStructure.map(team => team.players.filter(p => p.isFixed));
  
  // 2. Identify Pool (Non-fixed)
  const fixedIds = new Set<string>();
  anchors.flat().forEach(p => fixedIds.add(p.id));
  
  const pool = allPlayers
    .filter(p => !fixedIds.has(p.id))
    .sort((a, b) => {
        if (b.skillLevel !== a.skillLevel) return b.skillLevel - a.skillLevel;
        return a.originalIndex - b.originalIndex; // Stable sort fallback
    });

  // 3. Determine needed buckets
  // We need enough buckets to hold all players, BUT we also need to respect existing anchor positions.
  // (e.g. if Queue 5 has a lock, we need buckets up to index 7 (0,1 + 5))
  let maxAnchorIndex = -1;
  anchors.forEach((list, idx) => {
      if (list.length > 0) maxAnchorIndex = idx;
  });
  
  const totalPlayers = allPlayers.length;
  const calculatedTeamsNeeded = Math.ceil(totalPlayers / courtLimit);
  // We need at least 2 teams (Courts A & B) even if empty
  const totalBucketsNeeded = Math.max(2, calculatedTeamsNeeded, maxAnchorIndex + 1);

  // 4. Initialize Buckets with Anchors
  // Note: We clone the anchor arrays to avoid mutation issues
  const buckets: Player[][] = Array.from({ length: totalBucketsNeeded }, (_, i) => [...(anchors[i] || [])]);

  // 5. Weighted Distribution (Snake/Best-Fit) for the pool
  for (const player of pool) {
      // Find valid bucket indices (those that are not full)
      const validIndices = buckets.map((b, i) => i).filter(i => buckets[i].length < courtLimit);
      
      if (validIndices.length === 0) {
          // All existing buckets full? Create a new one.
          buckets.push([player]);
          continue;
      }

      // Prioritize filling active Courts (0 & 1) first if they have space
      const courtsWithSpace = validIndices.filter(i => i < 2);
      const queuesWithSpace = validIndices.filter(i => i >= 2);
      
      let candidates = courtsWithSpace.length > 0 ? courtsWithSpace : queuesWithSpace;
      
      // Sort candidates by current Total Skill (Ascending) -> Fill weakest team first
      candidates.sort((a, b) => getTotalSkill(buckets[a]) - getTotalSkill(buckets[b]));
      
      const targetBucketIndex = candidates[0];
      buckets[targetBucketIndex].push(player);
  }

  // 6. Reconstruct Teams
  const newCourtA = { ...currentCourtA, players: buckets[0] || [] };
  const newCourtB = { ...currentCourtB, players: buckets[1] || [] };
  
  const newQueue: Team[] = [];
  // Buckets 2+ correspond to Queue teams
  for (let i = 2; i < buckets.length; i++) {
      if (buckets[i] && buckets[i].length > 0) {
          // Try to preserve existing Team ID/Name if available for this slot
          const existingQTeam = currentQueue[i - 2]; 
          const tId = existingQTeam ? existingQTeam.id : uuidv4();
          const tName = existingQTeam ? existingQTeam.name : `Team ${i + 1}`;
          newQueue.push({ id: tId, name: tName, players: buckets[i] });
      }
  }

  return { courtA: newCourtA, courtB: newCourtB, queue: newQueue };
};

/**
 * Standard Distribution (Restore Order)
 * Respects Fixed Players as Anchors in ALL positions (A, B, Queue).
 * 1. Fixed players stay in their current courts/queue slots.
 * 2. Non-fixed players are sorted by Original Index.
 * 3. Non-fixed players fill gaps in A, then B, then Queue linearly.
 */
export const distributeStandard = (
    allPlayers: Player[], 
    currentCourtA: Team, 
    currentCourtB: Team,
    currentQueue: Team[]
  ): { courtA: Team, courtB: Team, queue: Team[] } => {
    
    // 1. Identify Anchors
    const currentStructure = [currentCourtA, currentCourtB, ...currentQueue];
    const anchors = currentStructure.map(t => t.players.filter(p => p.isFixed));
    
    // 2. Identify Pool (Sorted by Index)
    const fixedIds = new Set(anchors.flat().map(p => p.id));
    const pool = allPlayers
        .filter(p => !fixedIds.has(p.id))
        .sort((a, b) => a.originalIndex - b.originalIndex);
    
    // 3. Setup Buckets
    // Determine max index needed by anchors
    let maxAnchorIndex = -1;
    anchors.forEach((list, idx) => {
        if (list.length > 0) maxAnchorIndex = idx;
    });
    
    // Initial buckets with anchors
    const buckets = Array.from({length: maxAnchorIndex + 1}, (_, i) => [...(anchors[i] || [])]);
    
    // Ensure at least Court A and B exist
    while(buckets.length < 2) buckets.push([]);

    // 4. Fill Buckets Linearly
    // We fill bucket 0, then 1, then 2...
    let currentBucketIdx = 0;
    
    while(pool.length > 0) {
        // Ensure bucket exists
        if (!buckets[currentBucketIdx]) buckets[currentBucketIdx] = [];
        
        // If current bucket full, move to next
        if (buckets[currentBucketIdx].length >= PLAYER_LIMIT_ON_COURT) {
            currentBucketIdx++;
            continue;
        }
        
        // Add player
        buckets[currentBucketIdx].push(pool.shift()!);
    }

    // 5. Reconstruct
    const newCourtA = { ...currentCourtA, players: buckets[0] || [] };
    const newCourtB = { ...currentCourtB, players: buckets[1] || [] };
    
    const newQueue: Team[] = [];
    for (let i = 2; i < buckets.length; i++) {
        if (buckets[i] && buckets[i].length > 0) {
            const existingQTeam = currentQueue[i - 2];
            const tId = existingQTeam ? existingQTeam.id : uuidv4();
            const tName = existingQTeam ? existingQTeam.name : `Team ${i + 1}`;
            newQueue.push({ id: tId, name: tName, players: buckets[i] });
        }
    }
  
    return {
      courtA: newCourtA,
      courtB: newCourtB,
      queue: newQueue
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
        const ejectIdx = incomingPlayers.findIndex(p => !p.isFixed);
        if (ejectIdx !== -1) {
            const [ejected] = incomingPlayers.splice(ejectIdx, 1);
            overflow.push(ejected);
        } else {
            const [ejected] = incomingPlayers.splice(0, 1);
            overflow.push(ejected);
        }
    }

    // If we had overflow, push them to the end of the queue (or create new team)
    if (overflow.length > 0) {
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

        // Try to steal from the NEW queue
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
