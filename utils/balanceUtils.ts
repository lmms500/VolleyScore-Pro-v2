
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
 * Global Balanced Draft (Weighted Snake Logic)
 * 1. Identifies Fixed (Locked) players in Courts AND Queue.
 * 2. Collects all other players into a Pool.
 * 3. Sorts Pool by Skill (Desc).
 * 4. Distributes players to the bucket (Court A, B, Q1, Q2...) that currently has the LOWEST Total Skill.
 */
export const balanceTeamsSnake = (
  allPlayers: Player[], 
  currentCourtA: Team, 
  currentCourtB: Team,
  currentQueue: Team[]
): { courtA: Team, courtB: Team, queue: Team[] } => {
  
  const courtLimit = PLAYER_LIMIT_ON_COURT; 

  // 1. Identify Anchors (Players who cannot move)
  const currentStructure = [currentCourtA, currentCourtB, ...currentQueue];
  const anchors = currentStructure.map(team => team.players.filter(p => p.isFixed));

  // 2. Identify Pool (Everyone else)
  const fixedIds = new Set(anchors.flat().map(p => p.id));
  const pool = allPlayers
    .filter(p => !fixedIds.has(p.id))
    .sort((a, b) => b.skillLevel - a.skillLevel); // Sort by Skill High -> Low

  // 3. Determine Buckets Needed
  // We need enough buckets for all players.
  const totalTeamsNeeded = Math.ceil(allPlayers.length / courtLimit);
  // Ensure we have at least Court A and B (2 buckets), and enough for existing queues
  const requiredBuckets = Math.max(2, totalTeamsNeeded, currentStructure.length);
  
  // Initialize buckets with just the anchors
  const buckets: Player[][] = Array.from({ length: requiredBuckets }, (_, i) => [...(anchors[i] || [])]);

  // 4. Snake / Best-Fit Distribution
  // For each player, place them in the eligible bucket with the LOWEST current total skill.
  // This balances all teams globally.
  for (const player of pool) {
      let bestBucketIdx = -1;
      let minTotalSkill = Infinity;

      for (let i = 0; i < buckets.length; i++) {
          if (buckets[i].length >= courtLimit) continue; // Bucket full

          const currentSkill = getTotalSkill(buckets[i]);
          
          // We want the team with the lowest skill to get the next best player
          if (currentSkill < minTotalSkill) {
              minTotalSkill = currentSkill;
              bestBucketIdx = i;
          }
      }

      if (bestBucketIdx !== -1) {
          buckets[bestBucketIdx].push(player);
      } else {
          // If all full (fallback), append to last or create new
          buckets.push([player]);
      }
  }

  // 5. Reconstruct Structure
  const newCourtA = { ...currentCourtA, players: buckets[0] || [] };
  const newCourtB = { ...currentCourtB, players: buckets[1] || [] };
  
  const newQueue: Team[] = [];
  for (let i = 2; i < buckets.length; i++) {
      if (buckets[i] && buckets[i].length > 0) {
          const existing = currentQueue[i - 2];
          newQueue.push({
              id: existing?.id || uuidv4(),
              name: existing?.name || `Team ${i + 1}`,
              players: buckets[i]
          });
      }
  }

  return { courtA: newCourtA, courtB: newCourtB, queue: newQueue };
};

/**
 * Standard Distribution (Restore Order)
 * Respects Fixed Players. Fills gaps linearly based on Original Input Index.
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
    let maxAnchorIndex = -1;
    anchors.forEach((list, idx) => {
        if (list.length > 0) maxAnchorIndex = idx;
    });
    
    const buckets = Array.from({length: Math.max(2, maxAnchorIndex + 1)}, (_, i) => [...(anchors[i] || [])]);
    
    // 4. Fill Buckets Linearly
    let currentBucketIdx = 0;
    
    while(pool.length > 0) {
        if (!buckets[currentBucketIdx]) buckets[currentBucketIdx] = [];
        
        if (buckets[currentBucketIdx].length >= PLAYER_LIMIT_ON_COURT) {
            currentBucketIdx++;
            continue;
        }
        
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
  
    return { courtA: newCourtA, courtB: newCourtB, queue: newQueue };
  };

// --- ROTATION LOGIC ---

export interface RotationResult {
    incomingTeam: Team;
    queue: Team[];
    stolenPlayers: Player[];
}

/**
 * Standard Rotation (Strict Recycling Logic):
 * 1. Loser -> Goes to END of queue.
 * 2. Next team in Queue -> Enters Court (Merges with Fixed).
 * 3. If Entering Team < 6:
 *    Fill from Queue teams in order [0, 1, 2...].
 *    Steal from the END of each donor team (Reverse order).
 *    Note: The Loser is now at the end of the queue, so they are the last resort donor.
 */
export const getStandardRotationResult = (
    loserTeam: Team, 
    currentQueue: Team[]
): RotationResult => {
    // Working copy of queue
    let workingQueue = currentQueue.map(t => ({...t, players: [...t.players]}));
    
    // 1. Process Loser Team (Leaving Court)
    const anchors = loserTeam.players.filter(p => p.isFixed); // Stay on court
    const leavers = loserTeam.players.filter(p => !p.isFixed); // Go to queue

    // 2. Identify Incoming Team
    let incomingBase = workingQueue.shift(); 
    
    // 3. Add Leavers to End of Queue IMMEDIATELY
    // This ensures they are available as donors if the queue is short.
    if (leavers.length > 0) {
        workingQueue.push({ 
            id: uuidv4(), 
            name: loserTeam.name, 
            players: leavers 
        });
    }

    // 4. Construct the New Court Team
    let incomingPlayers = incomingBase ? [...incomingBase.players] : [];
    
    // Merge with Anchors (Fixed players stay)
    let combinedPlayers = [...anchors, ...incomingPlayers];

    // 5. Handle Overflow (If Anchors + Incoming > 6)
    // Eject non-fixed excess to end of queue.
    const overflow: Player[] = [];
    while (combinedPlayers.length > PLAYER_LIMIT_ON_COURT) {
        // Prioritize ejecting non-fixed players (the ones who just arrived)
        const ejectIdx = combinedPlayers.findIndex(p => !p.isFixed);
        if (ejectIdx !== -1) {
            overflow.push(combinedPlayers.splice(ejectIdx, 1)[0]);
        } else {
            overflow.push(combinedPlayers.pop()!);
        }
    }
    
    if (overflow.length > 0) {
        const lastTeam = workingQueue[workingQueue.length - 1];
        if (lastTeam && lastTeam.name === loserTeam.name) {
             lastTeam.players.push(...overflow);
        } else {
             workingQueue.push({ id: uuidv4(), name: "Overflow", players: overflow });
        }
    }

    // 6. FILL GAPS (The "Recycling" Logic)
    // If team is incomplete (< 6), steal from queue teams in order.
    // Steal from LAST player to FIRST (Reverse).
    const stolenPlayers: Player[] = [];
    
    while (combinedPlayers.length < PLAYER_LIMIT_ON_COURT && workingQueue.length > 0) {
        let foundDonor = false;

        // Iterate through queue teams [Q1, Q2, ... Loser]
        for (const donorTeam of workingQueue) {
            if (donorTeam.players.length === 0) continue;

            // Take from the END of the donor team
            for (let i = donorTeam.players.length - 1; i >= 0; i--) {
                const candidate = donorTeam.players[i];
                if (!candidate.isFixed) {
                    const [stolen] = donorTeam.players.splice(i, 1);
                    combinedPlayers.push(stolen);
                    stolenPlayers.push(stolen);
                    foundDonor = true;
                    
                    if (combinedPlayers.length >= PLAYER_LIMIT_ON_COURT) break;
                }
            }
            if (combinedPlayers.length >= PLAYER_LIMIT_ON_COURT) break;
        }

        // Stop if we can't find anyone
        if (!foundDonor) break; 
    }

    // 7. Finalize
    const incomingTeam = {
        ...(incomingBase || loserTeam), // Inherit ID/Name
        id: uuidv4(),
        players: combinedPlayers
    };

    const finalQueue = workingQueue.filter(t => t.players.length > 0);

    return {
        incomingTeam,
        queue: finalQueue,
        stolenPlayers
    };
};

/**
 * Balanced Rotation:
 * Similar to Standard, but fills gaps by picking players that minimize skill difference.
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
                
                if (player.isFixed) continue;

                // Simulate adding
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
