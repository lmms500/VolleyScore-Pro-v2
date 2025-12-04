
import { Player, Team } from '../types';
import { PLAYER_LIMIT_ON_COURT, PLAYERS_PER_TEAM } from '../constants';

// --- HELPER FUNCTIONS ---

export const calculateTeamStrength = (players: Player[]): string => {
  if (players.length === 0) return "0.0";
  const sum = players.reduce((acc, p) => acc + p.skillLevel, 0);
  return (sum / players.length).toFixed(1);
};

const chunkPlayersIntoTeams = (players: Player[], startId: number): Team[] => {
  const teams: Team[] = [];
  let currentId = startId;
  
  for (let i = 0; i < players.length; i += PLAYERS_PER_TEAM) {
    const chunk = players.slice(i, i + PLAYERS_PER_TEAM);
    teams.push({
      id: `Queue Team ${currentId}`,
      name: `Queue Team ${currentId}`,
      players: chunk
    });
    currentId++;
  }
  return teams;
};

// --- ALGORITHMS ---

/**
 * Global Snake Draft with Locks
 * 
 * 1. Respects `isFixed` players (they stay in their current team).
 * 2. Gathers all non-fixed players into a pool.
 * 3. Sorts pool by Skill Level (Desc).
 * 4. Distributes pool to fill A, then B, then Queue using a snake pattern (A, B, B, A) 
 *    to minimize skill gap between Court A and Court B.
 */
export const balanceTeamsSnake = (
  allPlayers: Player[], 
  currentCourtA: Team, 
  currentCourtB: Team
): { courtA: Team, courtB: Team, queue: Team[] } => {
  
  const courtLimit = PLAYER_LIMIT_ON_COURT;

  // 1. Identify Fixed vs Pool
  const fixedInA = currentCourtA.players.filter(p => p.isFixed);
  const fixedInB = currentCourtB.players.filter(p => p.isFixed);
  
  // Note: We currently don't support "Fixed in Queue", so anyone in queue or non-fixed in courts goes to pool
  // But if we did, we would filter them here.
  const pool = allPlayers.filter(p => !p.isFixed);

  // 2. Sort Pool by Skill
  pool.sort((a, b) => {
    if (b.skillLevel !== a.skillLevel) return b.skillLevel - a.skillLevel;
    // Secondary sort by Original Index to maintain some stability/seniority
    return a.originalIndex - b.originalIndex;
  });

  // 3. Prepare Targets
  const newTeamA = [...fixedInA];
  const newTeamB = [...fixedInB];
  const newQueue: Player[] = [];

  // 4. Snake Draft Distribution
  // We determine who needs players
  
  // While we have players in the pool...
  let poolIndex = 0;

  // Phase 1: Fill Courts
  while (poolIndex < pool.length) {
    const player = pool[poolIndex];
    const needsA = newTeamA.length < courtLimit;
    const needsB = newTeamB.length < courtLimit;

    if (!needsA && !needsB) {
      // Both courts full, remainder goes to queue
      newQueue.push(player);
      poolIndex++;
      continue;
    }

    // Smart Selection Logic (Snake-ish)
    // If both need players, compare current count or strength. 
    // Simple heuristic: Alternate filling to keep counts even, favoring A then B.
    
    if (needsA && !needsB) {
      newTeamA.push(player);
    } else if (!needsA && needsB) {
      newTeamB.push(player);
    } else {
      // Both need players. 
      // Snake logic based on current filling cycle relative to empty slots might be complex.
      // Simple toggle based on how many "non-fixed" we have added?
      // Let's use total size parity.
      if (newTeamA.length <= newTeamB.length) {
         newTeamA.push(player);
      } else {
         newTeamB.push(player);
      }
    }
    poolIndex++;
  }

  return {
    courtA: { ...currentCourtA, players: newTeamA },
    courtB: { ...currentCourtB, players: newTeamB },
    queue: chunkPlayersIntoTeams(newQueue, 1)
  };
};

/**
 * Standard Strategy (Restore Order)
 * Resets strictly by `originalIndex`.
 * Ignores `isFixed` property (Reset overrides locks usually, or we could preserve them, 
 * but "Restore Order" usually implies a hard reset to arrival list).
 * 
 * Update: To be safe/UX friendly, if someone is Fixed, we generally want them to STAY fixed visually,
 * but "Restore Order" implies strictly chronological. We will respect locks IF they are in the valid range?
 * No, "Restore Order" is usually an "Emergency Reset". We will ignore locks to ensure true original state.
 */
export const distributeStandard = (
    allPlayers: Player[], 
    currentCourtA: Team, 
    currentCourtB: Team
  ): { courtA: Team, courtB: Team, queue: Team[] } => {
    
    // Sort strictly by original index
    const sorted = [...allPlayers].sort((a, b) => a.originalIndex - b.originalIndex);

    const teamAPlayers = sorted.slice(0, PLAYER_LIMIT_ON_COURT);
    const teamBPlayers = sorted.slice(PLAYER_LIMIT_ON_COURT, PLAYER_LIMIT_ON_COURT * 2);
    const queuePlayers = sorted.slice(PLAYER_LIMIT_ON_COURT * 2);
  
    // We strip isFixed status on a hard reset? 
    // Optional: map(p => ({...p, isFixed: false})) if we want to clear locks.
    // For now, we keep the flags but move the players.
  
    return {
      courtA: { ...currentCourtA, players: teamAPlayers },
      courtB: { ...currentCourtB, players: teamBPlayers },
      queue: chunkPlayersIntoTeams(queuePlayers, 1)
    };
  };