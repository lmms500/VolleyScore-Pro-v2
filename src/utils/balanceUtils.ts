
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
 * 
 * This ensures that if one team has a locked high-skill player, 
 * the algorithm fills the other team first to compensate.
 */
export const balanceTeamsSnake = (
  allPlayers: Player[], 
  currentCourtA: Team, 
  currentCourtB: Team
): { courtA: Team, courtB: Team, queue: Team[] } => {
  
  const courtLimit = PLAYER_LIMIT_ON_COURT; // 6

  // 1. Separate Fixed (Anchors) vs Free Pool
  const fixedInA = currentCourtA.players.filter(p => p.isFixed);
  const fixedInB = currentCourtB.players.filter(p => p.isFixed);
  
  // Pool contains non-fixed players, Sorted by Skill DESC
  const pool = allPlayers.filter(p => !p.isFixed).sort((a, b) => {
    if (b.skillLevel !== a.skillLevel) return b.skillLevel - a.skillLevel;
    return a.originalIndex - b.originalIndex; // Stable sort fallback
  });

  // 2. Initialize Buckets with Anchors
  // teamBuckets[0] = Team A, teamBuckets[1] = Team B, others = Queue
  const totalPlayers = fixedInA.length + fixedInB.length + pool.length;
  const totalTeamsNeeded = Math.ceil(totalPlayers / courtLimit);
  
  const teamBuckets: Player[][] = Array.from({ length: totalTeamsNeeded }, () => []);
  teamBuckets[0] = [...fixedInA];
  if (totalTeamsNeeded > 1) teamBuckets[1] = [...fixedInB];

  // 3. Define Active Draft Buckets (Court A and Court B usually)
  // Logic: We only "balance" the active courts. Overflow goes to queue.
  // Unless we want to balance the entire queue too? 
  // Standard practice: Balance A vs B for the match, rest go to queue.
  const activeBucketIndices = [0, 1].filter(i => i < totalTeamsNeeded);

  // 4. Weighted Distribution
  for (const player of pool) {
      // Find valid buckets (those not full)
      const validBuckets = activeBucketIndices.filter(i => teamBuckets[i].length < courtLimit);
      
      if (validBuckets.length > 0) {
          // Find the WEAKEST bucket among valid ones
          // Sort by Total Skill ASC
          validBuckets.sort((a, b) => getTotalSkill(teamBuckets[a]) - getTotalSkill(teamBuckets[b]));
          
          // Add to weakest
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

export const distributeStandard = (
    allPlayers: Player[], 
    currentCourtA: Team, 
    currentCourtB: Team
  ): { courtA: Team, courtB: Team, queue: Team[] } => {
    
    // For Standard Distribute (Reset), we respect Fixed players staying in their lane?
    // Usually "Restore Order" implies purely index based. 
    // However, if a player is LOCKED, they should probably stay put or return to their locked side.
    // For now, implementing standard "Reset to Original Index" logic but keeping locked players if they match side?
    // Simplest approach: Unfix everyone OR Ignore fix. 
    // Given UI label "Restore Order", we assume purely index-based reset.
    
    const sorted = [...allPlayers].sort((a, b) => a.originalIndex - b.originalIndex);
    
    const teamAPlayers = sorted.slice(0, PLAYER_LIMIT_ON_COURT);
    const teamBPlayers = sorted.slice(PLAYER_LIMIT_ON_COURT, PLAYER_LIMIT_ON_COURT * 2);
    const remaining = sorted.slice(PLAYER_LIMIT_ON_COURT * 2);
    
    const queueTeams: Team[] = [];
    let qIdx = 1;
    for (let i = 0; i < remaining.length; i += PLAYERS_PER_TEAM) {
        const chunk = remaining.slice(i, i + PLAYERS_PER_TEAM);
        queueTeams.push(createTeamContainer(uuidv4(), `Team ${qIdx + 2}`, chunk));
        qIdx++;
    }
  
    return {
      courtA: { ...currentCourtA, players: teamAPlayers },
      courtB: { ...currentCourtB, players: teamBPlayers },
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
 * 1. Loser goes to end.
 * 2. Next team enters.
 * 3. Fill gaps by stealing from END of subsequent teams.
 * 4. SKIP LOCKED PLAYERS when stealing.
 */
export const getStandardRotationResult = (
    loserTeam: Team, 
    currentQueue: Team[]
): RotationResult => {
    const queue = currentQueue.map(t => ({...t, players: [...t.players]})); // Deep copy
    const loser = { ...loserTeam, players: [...loserTeam.players], id: uuidv4() };
    
    // 1. Push loser to end
    queue.push(loser);

    // 2. Determine Incoming
    const incomingTeam = queue.shift();

    if (!incomingTeam) {
        return { incomingTeam: loser, queue: [], stolenPlayers: [] };
    }

    const stolenPlayers: Player[] = [];
    
    // 3. Fill gaps if needed
    while (incomingTeam.players.length < PLAYER_LIMIT_ON_COURT) {
        let foundDonor = false;

        // Try to steal from the NEW queue (index 0 is the team AFTER incoming)
        for (const donorTeam of queue) {
            if (donorTeam.players.length > 0) {
                
                // CRITICAL CHANGE: Find last NON-FIXED player
                let stolenIndex = -1;
                // Iterate backwards
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
                    break; // Start loop again to check next need
                }
            }
        }

        if (!foundDonor) break; // No more moveable players available
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
 * 1. Loser goes to end.
 * 2. Next team enters.
 * 3. Fill gaps by picking players from Queue that MINIMIZE skill delta.
 * 4. IGNORE LOCKED PLAYERS as candidates.
 */
export const getBalancedRotationResult = (
    winnerTeam: Team,
    loserTeam: Team,
    currentQueue: Team[]
): RotationResult => {
    const queue = currentQueue.map(t => ({...t, players: [...t.players]}));
    const loser = { ...loserTeam, players: [...loserTeam.players], id: uuidv4() };
    
    // 1. Push loser to end
    queue.push(loser);

    // 2. Incoming Team
    const incomingTeam = queue.shift();
    if (!incomingTeam) {
        return { incomingTeam: loser, queue: [], stolenPlayers: [] };
    }

    const targetAvg = getNumericStrength(winnerTeam.players);
    const stolenPlayers: Player[] = [];

    // 3. Fill Gaps
    while (incomingTeam.players.length < PLAYER_LIMIT_ON_COURT) {
        let bestCandidate: { player: Player, teamIndex: number, playerIndex: number, delta: number } | null = null;
        
        const currentSum = incomingTeam.players.reduce((sum, p) => sum + p.skillLevel, 0);
        const nextCount = incomingTeam.players.length + 1;

        // Iterate all queue teams
        for (let tIdx = 0; tIdx < queue.length; tIdx++) {
            const team = queue[tIdx];
            for (let pIdx = 0; pIdx < team.players.length; pIdx++) {
                const player = team.players[pIdx];
                
                // CRITICAL CHECK: Skip Locked Players
                if (player.isFixed) continue;

                // Simulate adding this player
                const newAvg = (currentSum + player.skillLevel) / nextCount;
                const delta = Math.abs(newAvg - targetAvg);

                if (!bestCandidate || delta < bestCandidate.delta) {
                    bestCandidate = {
                        player,
                        teamIndex: tIdx,
                        playerIndex: pIdx,
                        delta
                    };
                }
            }
        }

        if (bestCandidate) {
            const sourceTeam = queue[bestCandidate.teamIndex];
            const [movedPlayer] = sourceTeam.players.splice(bestCandidate.playerIndex, 1);
            incomingTeam.players.push(movedPlayer);
            stolenPlayers.push(movedPlayer);
        } else {
            // No valid candidates (everyone else might be locked)
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
