
import { Player, Team } from '../types';
import { PLAYER_LIMIT_ON_COURT, PLAYERS_PER_TEAM } from '../constants';
import { v4 as uuidv4 } from 'uuid';

// --- HELPER FUNCTIONS ---

export const calculateTeamStrength = (players: Player[]): string => {
  if (players.length === 0) return "0.0";
  const sum = players.reduce((acc, p) => acc + p.skillLevel, 0);
  return (sum / players.length).toFixed(1);
};

const createTeamContainer = (id: string, name: string, players: Player[]): Team => ({
  id,
  name,
  players
});

// --- ALGORITHMS ---

/**
 * Global Balanced Draft (Prioritizing Full Teams)
 * 
 * 1. Calcula quantos times COMPLETOS (6 jogadores) é possível formar.
 * 2. Seleciona os melhores jogadores para preencher esses times e faz o Snake Draft entre eles.
 * 3. Os jogadores excedentes (restante) vão para o último time, que ficará incompleto e com nível inferior.
 */
export const balanceTeamsSnake = (
  allPlayers: Player[], 
  currentCourtA: Team, 
  currentCourtB: Team
): { courtA: Team, courtB: Team, queue: Team[] } => {
  
  const courtLimit = PLAYER_LIMIT_ON_COURT; // 6

  // 1. Separar Fixos e Pool
  const fixedInA = currentCourtA.players.filter(p => p.isFixed);
  const fixedInB = currentCourtB.players.filter(p => p.isFixed);
  
  // Pool contém todos que NÃO são fixos, ordenados por Skill (Decrescente) -> Index (Crescente)
  const pool = allPlayers.filter(p => !p.isFixed).sort((a, b) => {
    if (b.skillLevel !== a.skillLevel) return b.skillLevel - a.skillLevel;
    return a.originalIndex - b.originalIndex;
  });

  const totalPlayers = fixedInA.length + fixedInB.length + pool.length;

  // Quantos times COMPLETOS conseguimos formar?
  const fullTeamsCount = Math.floor(totalPlayers / courtLimit);
  
  // Total de times necessários (incluindo o incompleto)
  const totalTeamsNeeded = Math.ceil(totalPlayers / courtLimit);

  // Definimos quais "Buckets" (times) participarão do Draft de Elite.
  // Se temos 20 jogadores -> 3 times completos. Buckets 0, 1, 2 participam do snake. Bucket 3 pega a sobra.
  // Se temos < 6 jogadores, garantimos pelo menos 1 bucket ativo para preencher o time A.
  const activeDraftBucketCount = Math.max(1, fullTeamsCount);

  // Inicializar Buckets
  const teamBuckets: Player[][] = Array.from({ length: totalTeamsNeeded }, () => []);
  teamBuckets[0] = [...fixedInA];
  if (totalTeamsNeeded > 1) teamBuckets[1] = [...fixedInB];

  // Calcular quantos jogadores do Pool cabem nos Buckets Ativos (Times Completos)
  let slotsInActiveBuckets = 0;
  for (let i = 0; i < activeDraftBucketCount; i++) {
      if (!teamBuckets[i]) teamBuckets[i] = [];
      const currentCount = teamBuckets[i].length;
      slotsInActiveBuckets += Math.max(0, courtLimit - currentCount);
  }

  // Dividir o Pool: Elite (para times completos) vs Overflow (para o time incompleto)
  const draftPool = pool.slice(0, slotsInActiveBuckets);
  const overflowPool = pool.slice(slotsInActiveBuckets);

  // 2. Distribuição Snake APENAS nos Times Completos (Elite)
  let asc = true;
  let teamIdx = 0;

  for (const player of draftPool) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < activeDraftBucketCount * 2) {
        if (!teamBuckets[teamIdx]) teamBuckets[teamIdx] = [];

        if (teamBuckets[teamIdx].length < courtLimit) {
            teamBuckets[teamIdx].push(player);
            placed = true;
        } else {
            // Se o bucket atual está cheio (por fixos), move o ponteiro
            if (asc) {
                teamIdx++;
                if (teamIdx >= activeDraftBucketCount) { teamIdx = activeDraftBucketCount - 1; asc = false; }
            } else {
                teamIdx--;
                if (teamIdx < 0) { teamIdx = 0; asc = true; }
            }
        }
        attempts++;
    }
    
    // Avança o ponteiro Snake
    if (placed) {
        if (asc) {
            teamIdx++;
            if (teamIdx >= activeDraftBucketCount) {
                teamIdx = activeDraftBucketCount - 1;
                asc = false;
            }
        } else {
            teamIdx--;
            if (teamIdx < 0) {
                teamIdx = 0;
                asc = true;
            }
        }
    }
  }

  // 3. Distribuição do Overflow (Sobra) nos times restantes
  // Começa preenchendo o primeiro bucket que não é um "Full Team" (ou se todos forem full, não faz nada)
  let overflowBucketIdx = activeDraftBucketCount;

  for (const player of overflowPool) {
      // Garante que o bucket existe
      if (!teamBuckets[overflowBucketIdx]) teamBuckets[overflowBucketIdx] = [];

      // Se por acaso o bucket de overflow encher (edge case), vai para o próximo
      if (teamBuckets[overflowBucketIdx].length >= courtLimit) {
          overflowBucketIdx++;
          if (!teamBuckets[overflowBucketIdx]) teamBuckets[overflowBucketIdx] = [];
      }
      
      teamBuckets[overflowBucketIdx].push(player);
  }

  // 4. Reconstrói os Objetos de Time
  const newCourtA = { ...currentCourtA, players: teamBuckets[0] || [] };
  const newCourtB = { ...currentCourtB, players: teamBuckets[1] || [] };
  
  const newQueue: Team[] = [];
  for (let i = 2; i < teamBuckets.length; i++) {
      if (teamBuckets[i] && teamBuckets[i].length > 0) {
          newQueue.push(createTeamContainer(
              uuidv4(), // Novo ID para evitar conflitos de chave
              `Team ${i + 1}`,
              teamBuckets[i]
          ));
      }
  }

  return {
    courtA: newCourtA,
    courtB: newCourtB,
    queue: newQueue
  };
};

/**
 * Standard Distribution
 * Respeita apenas a ordem de chegada (Original Index).
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
