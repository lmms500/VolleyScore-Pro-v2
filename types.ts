
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
  fixedSide?: string | null; // Changed to string to allow Queue Team IDs
}

export interface Team {
  id: string; 
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
  retainedPlayers: Player[]; 
  stolenPlayers: Player[]; 
  queueAfterRotation: Team[]; 
}

export type ActionLog = 
  | { type: 'POINT'; team: TeamId }
  | { type: 'TIMEOUT'; team: TeamId }
  | { type: 'TOGGLE_SERVE'; previousServer: TeamId | null };

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
  actionLog: ActionLog[]; 
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
  queue: Team[]; 
  rotationReport: RotationReport | null;
}
