

export type TeamId = 'A' | 'B';

export type DeuceType = 'standard' | 'sudden_death_3pt';

export type RotationMode = 'standard' | 'balanced';

export type GameMode = 'indoor' | 'beach';

export type SkillType = 'attack' | 'block' | 'ace' | 'opponent_error';

export type PlayerId = string; // UUID v4

export type SyncStatus = 'synced' | 'desynced' | 'unlinked';

// Supported Theme Colors (Presets + Hex Strings)
export type TeamColor = string; 

// 1. O PERFIL MESTRE (Persistente / Banco de Dados Local)
export interface PlayerProfile {
  id: PlayerId;
  name: string;       // Normalizado (trim)
  skillLevel: number; // 1 a 5 (Estrelas)
  createdAt: number;
  lastUpdated: number;
}

export interface GameConfig {
  mode: GameMode; // 'indoor' | 'beach'
  maxSets: 1 | 3 | 5;
  pointsPerSet: 15 | 21 | 25;
  hasTieBreak: boolean;
  tieBreakPoints: 15 | 25; // Limitado a valores comuns
  deuceType: DeuceType;
  rotationMode: RotationMode;
  enablePlayerStats: boolean; // Toggle Scout Mode
  enableSound: boolean; // Global Audio Toggle
}

// 2. A INSTÂNCIA DE JOGO (Volátil / Em Quadra)
export interface Player {
  id: string; // ID único da instância na lista/quadra
  profileId?: PlayerId; // Link para o Perfil Mestre (Undefined = Jogador Anônimo/Temporário)
  name: string;
  number?: string; // Jersey Number
  skillLevel: number; // 1 to 5
  isFixed: boolean; // Se true, o jogador não é movido durante o balanceamento automático
  fixedSide?: 'A' | 'B' | null; // Se fixo, lembra de onde veio (opcional)
  originalIndex: number; // CRÍTICO: Para permitir o "Reset" da ordem exata de entrada
}

export interface Team {
  id: string; 
  name: string;
  color: TeamColor; // New visual property
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
  | { 
      type: 'POINT'; 
      team: TeamId;
      prevScoreA: number;
      prevScoreB: number;
      prevServingTeam: TeamId | null;
      timestamp?: number;
      // Scout Metadata (Explicitly typed)
      playerId?: string; 
      skill?: SkillType; 
    }
  | { 
      type: 'TIMEOUT'; 
      team: TeamId;
      prevTimeoutsA: number;
      prevTimeoutsB: number;
      timestamp?: number;
    };

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
  actionLog: ActionLog[]; // Current Set Undo Stack (Clears every set)
  matchLog: ActionLog[];  // Full Match History (PERSISTENT - Do not clear between sets)
  lastSnapshot?: GameState; // For critical undo (Match/Set transitions)
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
  pendingSideSwitch: boolean; // Controls the "Switch Sides" overlay
  matchDurationSeconds: number;
  isTimerRunning: boolean;
  
  // Roster Management
  teamARoster: Team;
  teamBRoster: Team;
  queue: Team[]; 
  rotationReport: RotationReport | null;
}