export type TeamId = 'A' | 'B';

export type DeuceType = 'standard' | 'sudden_death_3pt';

export interface GameConfig {
  maxSets: 1 | 3 | 5;
  pointsPerSet: 15 | 21 | 25;
  hasTieBreak: boolean;
  tieBreakPoints: number;
  deuceType: DeuceType;
}

export interface Player {
  id: string;
  name: string;
  isFixed: boolean;
  fixedSide?: TeamId | null; // If fixed, which side?
}

export interface Team {
  id: string; // Changed from TeamId to string to allow UUIDs for queue teams
  name: string;
  players: Player[];
}

export interface SetHistory {
  setNumber: number;
  scoreA: number;
  scoreB: number;
  winner: TeamId;
}

export interface RotationReport {
  outgoingTeam: Team;
  incomingTeam: Team;
  retainedPlayers: Player[]; // Fixed players who stayed
  stolenPlayers: Player[]; // Players taken from queue/loser to fill spots
  queueAfterRotation: Team[]; // Queue is now a list of Teams
}

export interface ActionLog {
  type: 'POINT' | 'TIMEOUT';
  team: TeamId;
}

export interface GameState {
  // Names
  teamAName: string;
  teamBName: string;
  
  // Scores & Sets
  scoreA: number;
  scoreB: number;
  setsA: number;
  setsB: number;
  currentSet: number;
  
  // History & Logic
  history: SetHistory[];
  actionLog: ActionLog[]; // Stack of actions for accurate Undo
  isMatchOver: boolean;
  matchWinner: TeamId | null;
  
  // Game Status
  servingTeam: TeamId | null;
  swappedSides: boolean;
  config: GameConfig;
  
  // Timeouts
  timeoutsA: number;
  timeoutsB: number;
  
  // Advanced State
  inSuddenDeath: boolean;
  matchDurationSeconds: number;
  isTimerRunning: boolean;
  
  // Roster Management
  teamARoster: Team;
  teamBRoster: Team;
  queue: Team[]; // Changed from Player[] to Team[]
  rotationReport: RotationReport | null;
}