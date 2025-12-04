
import { Player, Team } from '../types';
import { PLAYER_LIMIT_ON_COURT } from '../constants';
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
 * Used for "Balanced Mode" where individual skill matters more than team cohesion.
 * Here, "Fixed" acts as an Anchor to the Court (King of the Court style).
 * 
 * UPDATE: Prioritizes filling "Full Teams" (6 players) first to maximize complete squads.
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
  // We want to maximize COMPLETE teams.
  // E.g., 20 players -> 3 full teams (18) + 1 remainder (2).
  const totalCount = allPlayers.length;
  const numFullTeams = Math.floor(totalCount / courtLimit); 
  const totalTeamsNeeded = Math.ceil(totalCount / courtLimit);
  
  // Ensure we have at least 2 buckets for A vs B
  const requiredBuckets = Math.max(2, totalTeamsNeeded, currentStructure.length);
  
  // Initialize buckets with just the anchors
  const buckets: Player[][] = Array.from({ length: requiredBuckets }, (_, i) => [...(anchors[i] || [])]);

  // 4. Distribution Logic
  for (const player of pool) {
      let bestBucketIdx = -1;
      let minTotalSkill = Infinity;

      // Logic: Only target "Priority Buckets" (Indices 0 to numFullTeams-1) 
      // if they have space. Otherwise, target "Overflow Buckets".
      
      const targetIndices: number[] = [];
      let priorityHasSpace = false;

      // Check if any priority bucket has space
      for(let i = 0; i < numFullTeams; i++) {
          if (buckets[i] && buckets[i].length < courtLimit) {
              priorityHasSpace = true;
              break;
          }
      }

      if (priorityHasSpace) {
          // Fill Priority Buckets (Balancing among them)
          for(let i = 0; i < numFullTeams; i++) {
              if (buckets[i] && buckets[i].length < courtLimit) {
                  targetIndices.push(i);
              }
          }
      } else {
          // All Priority Buckets full. Fill Overflow Buckets.
          // If numFullTeams is 0 (e.g. 5 players), we treat all buckets as overflow from start.
          for(let i = numFullTeams; i < buckets.length; i++) {
               // We include index 'i' even if full? 
               // Standard logic: try to find non-full. If all full, we overfill?
               // The requiredBuckets calc ensures we usually have space.
               // But if we have huge overflow, we just target all remainder buckets.
               targetIndices.push(i);
          }
          // If numFullTeams=0, we start at index 0
          if (numFullTeams === 0) {
               for(let i = 0; i < buckets.length; i++) targetIndices.push(i);
          }
      }

      // Find the best bucket among the targets (Lowest Skill -> Snake Draft effect)
      for (const i of targetIndices) {
          if (!buckets[i]) continue;
          
          const currentSkill = getTotalSkill(buckets[i]);
          
          if (currentSkill < minTotalSkill) {
              minTotalSkill = currentSkill;
              bestBucketIdx = i;
          }
      }

      if (bestBucketIdx !== -1) {
          buckets[bestBucketIdx].push(player);
      } else {
          // Fallback (e.g. severe math edge case), just put in last bucket
          buckets[buckets.length - 1].push(player);
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
 * Standard Rotation (Squad Logic):
 * 1. Winner Team: Stays on Court (Intact).
 * 2. Loser Team: Goes to END of Queue (Intact).
 * 3. Incoming Team: Enters from START of Queue.
 * 4. Gap Filling:
 *    - If Incoming Team < 6 players:
 *    - Scans Queue teams starting from [0].
 *    - Steals ONLY non-fixed players.
 *    - Skips players/teams that are Fixed.
 */
export const getStandardRotationResult = (
    winnerTeam: Team, // Needed to ensure we don't mess with them
    loserTeam: Team, 
    currentQueue: Team[]
): RotationResult => {
    // Deep copy queue to avoid mutation
    const queue = currentQueue.map(t => ({...t, players: [...t.players]}));
    
    // 1. Loser Team goes to END of queue
    // In Standard Mode, "Fixed" means locked to the SQUAD, not the COURT.
    // So even fixed players leave the court with their losing team.
    queue.push({ 
        ...loserTeam, 
        id: uuidv4(), // New ID to prevent key conflicts, but same players
        players: [...loserTeam.players] 
    });

    // 2. Identify Incoming Team
    if (queue.length === 0) {
        // Fallback if no queue
        return { incomingTeam: loserTeam, queue: [], stolenPlayers: [] };
    }

    const incomingTeam = queue.shift()!;
    const stolenPlayers: Player[] = [];
    const TARGET_SIZE = PLAYER_LIMIT_ON_COURT;

    // 3. Fill Gaps in Incoming Team (The "Steal" Logic)
    if (incomingTeam.players.length < TARGET_SIZE) {
        
        // Iterate through queue teams to find donors
        for (const donorTeam of queue) {
            if (incomingTeam.players.length >= TARGET_SIZE) break;
            if (donorTeam.players.length === 0) continue;

            // Find valid candidates: MUST NOT BE FIXED
            // We iterate backwards to steal from the end of the donor list (LIFO stealing)
            // This preserves the "Core" of the donor team at the top of their list.
            const candidates = [];
            for(let i = donorTeam.players.length - 1; i >= 0; i--) {
                const p = donorTeam.players[i];
                if (!p.isFixed) {
                    candidates.push({ player: p, index: i });
                }
            }

            // Move candidates to incoming
            for (const candidate of candidates) {
                if (incomingTeam.players.length >= TARGET_SIZE) break;

                // Remove from donor
                donorTeam.players.splice(candidate.index, 1);
                
                // Add to incoming
                incomingTeam.players.push(candidate.player);
                stolenPlayers.push(candidate.player);
            }
        }
    }

    // 4. Cleanup Empty Teams in Queue
    const finalQueue = queue.filter(t => t.players.length > 0);

    return {
        incomingTeam,
        queue: finalQueue,
        stolenPlayers
    };
};

/**
 * Balanced Rotation:
 * Fills gaps by picking players that minimize skill difference.
 */
export const getBalancedRotationResult = (
    winnerTeam: Team,
    loserTeam: Team,
    currentQueue: Team[]
): RotationResult => {
    const queue = currentQueue.map(t => ({...t, players: [...t.players]}));
    
    // 1. Split Loser (Anchors stay, Leavers go)
    const anchors = loserTeam.players.filter(p => p.isFixed);
    const leavers = loserTeam.players.filter(p => !p.isFixed);
    
    if (leavers.length > 0) {
        queue.push({ ...loserTeam, players: leavers, id: uuidv4() });
    }

    // 2. Merge Incoming
    let incomingBase = queue.shift();
    let incomingPlayers = incomingBase ? [...incomingBase.players] : [];
    
    // In Balanced Mode, Anchors STAY on the court side
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

        for (let tIdx = 0; tIdx < queue.length; tIdx++) {
            const team = queue[tIdx];
            for (let pIdx = 0; pIdx < team.players.length; pIdx++) {
                const player = team.players[pIdx];
                
                // In Balanced Mode, we respect locks in queue too
                if (player.isFixed) continue;

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
