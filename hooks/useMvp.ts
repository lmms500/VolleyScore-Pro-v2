import { useMemo } from 'react';
import { GameState, TeamId } from '../types';

// To prevent unnecessary recalculations, we only accept the specific state slices we need.
interface UseMvpArgs {
  matchLog: GameState['matchLog'];
  teamARoster: GameState['teamARoster'];
  teamBRoster: GameState['teamBRoster'];
}

export type MvpData = { name: string; totalPoints: number; team: TeamId } | null;

/**
 * Calculates the Most Valuable Player (MVP) based on the total points scored in the match.
 * This hook is memoized and will only recalculate when the match log or team rosters change.
 * @param {UseMvpArgs} args - The necessary slices of the game state.
 * @returns {MvpData} - The data for the MVP or null if no points were scored.
 */
export const useMvp = ({ matchLog, teamARoster, teamBRoster }: UseMvpArgs): MvpData => {
  const mvpData = useMemo(() => {
    if (!matchLog || matchLog.length === 0) return null;

    // The map now correctly uses the 'totalPoints' property to match the MvpData type.
    const pointsMap = new Map<string, { totalPoints: number; name: string; team: TeamId }>();
    const playerMap = new Map<string, { name: string; team: TeamId }>();

    // Create a quick lookup map for all players in the match.
    teamARoster.players.forEach(p => playerMap.set(p.id, { name: p.name, team: 'A' }));
    teamBRoster.players.forEach(p => playerMap.set(p.id, { name: p.name, team: 'B' }));

    // Iterate through the match log to tally points for each player.
    matchLog.forEach(log => {
        if (log.type === 'POINT' && log.playerId && playerMap.has(log.playerId)) {
            const playerInfo = playerMap.get(log.playerId)!;
            // Initialize with the correct property name: totalPoints.
            const currentScore = pointsMap.get(log.playerId) || { totalPoints: 0, name: playerInfo.name, team: playerInfo.team };
            currentScore.totalPoints += 1;
            pointsMap.set(log.playerId, currentScore);
        }
    });

    if (pointsMap.size === 0) return null;

    // Sort using the correct property name.
    const sortedByPoints = Array.from(pointsMap.values()).sort((a, b) => b.totalPoints - a.totalPoints);
    const topScorer = sortedByPoints[0];

    // The top scorer is the MVP, provided they scored at least one point.
    // The check and the returned object now correctly align with the MvpData type.
    return topScorer.totalPoints > 0 ? topScorer : null;

  }, [matchLog, teamARoster, teamBRoster]);

  return mvpData;
};