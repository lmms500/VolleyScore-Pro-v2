

export type TeamId = 'A' | 'B';

export type DeuceType = 'standard' | 'sudden_death_3pt';

export type RotationMode = 'standard' | 'balanced';

export type PlayerId = string; // UUID v4

export type SyncStatus = 'synced' | 'desynced' | 'unlinked';

// 1. O PERFIL MESTRE (Persistente / Banco de Dados Local)
export interface PlayerProfile {
  id: PlayerId;
  name: string;       // Normalizado (trim)
  skillLevel: number; // 1 a 5 (Estrelas)
  createdAt: number;
  lastUpdated: number;
}

export interface GameConfig {
  maxSets: 1 | 3 | 5;
  pointsPerSet: 15 | 21 | 25;
  hasTieBreak: boolean;
  tieBreakPoints: number;
  deuceType: DeuceType;
  rotationMode: RotationMode;
}

// 2. A INSTÂNCIA DE JOGO (Volátil / Em Quadra)
export interface Player {
  id: string; // ID único da instância na lista/quadra
  profileId?: PlayerId; // Link para o Perfil Mestre (Undefined = Jogador Anônimo/Temporário)
  name: string;
  skillLevel: number; // 1 to 5
  isFixed: boolean; // Se true, o jogador não é movido durante o balanceamento automático
  fixedSide?: 'A' | 'B' | null; // Se fixo, lembra de onde veio (opcional)
  originalIndex: number; // CRÍTICO: Para permitir o "Reset" da ordem exata de entrada
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
  logs?: string[]; // Debug logs for rotation logic
}

export type ActionLog = 
  | { type: 'POINT'; team: TeamId }
  | { type: 'TIMEOUT'; team: TeamId };

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