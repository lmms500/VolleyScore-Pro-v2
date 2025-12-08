# VolleyScore Pro v2 - Plano de Ação Executivo

**Objetivo**: Transformar avaliação arquitectural em ações concretas  
**Timeline**: 4-6 sprints (~2-3 meses)  
**Responsabilidade**: AI Lead Engineer  
**Status**: Roadmap Planejado  

---

## 📊 Priorização de Tarefas

### Matriz de Impacto vs Esforço

```
HIGH IMPACT │  ⭐ Refactor        │  ⭐ IndexedDB
HIGH EFFORT │  useVolleyGame      │  Migration
            │  (15-20 dias)       │  (10-15 dias)
            │────────────────────┼───────────────
            │  ✅ Add Tests       │  ✅ Lazy Load
MEDIUM      │  (10-15 dias)       │  (3-5 dias)
EFFORT      │────────────────────┼───────────────
            │  🟢 Docs            │  🟢 Error
            │  (5-10 dias)        │  Handlers
LOW IMPACT  │  (2-3 dias)         │
            └────────────────────┴───────────────
            LOW             MEDIUM            HIGH
                            IMPACT

⭐ = Execute first (game changers)
✅ = Critical path items
🟢 = Nice-to-have, mas recomendado
```

---

## 🎯 Phase 1: Refatoração de useVolleyGame (SPRINT 1-2)

### 1.1 Objetivo

Dividir `hooks/useVolleyGame.ts` (700 linhas) em 4 hooks especializados.

**Resultado Esperado**:
- ✅ Cada hook < 200 linhas (legível)
- ✅ Zero breaking changes na UI
- ✅ 50% mais testável
- ✅ Facilita adicionar novas regras

### 1.2 Fase 1a: Preparação (1 dia)

#### Passo 1: Análise de Dependências
```bash
# Comandos para entender estrutura atual
grep -r "useVolleyGame" src/components/ | wc -l
# Encontrar todos os pontos de uso

grep -n "setState" hooks/useVolleyGame.ts | head -20
# Mapear todas as atualizações de estado
```

#### Passo 2: Backup + Branch
```bash
git checkout -b refactor/split-volleyball-hooks
# Feature branch para isolação
```

### 1.3 Fase 1b: Criação de useGameHistory (2 dias)

**Arquivo Novo**: `hooks/useGameHistory.ts`

```typescript
// ==========================================
// EXTRAIR de useVolleyGame:
// ==========================================
// actionLog: ActionLog[]
// historyIndex: number
// undoStack / redoStack
// undo() function
// redo() function
// clearHistory() function

export interface GameHistory {
  actions: ActionLog[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  addAction: (action: ActionLog) => void;
}

export const useGameHistory = (): GameHistory => {
  const [actions, setActions] = useState<ActionLog[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const undo = useCallback(() => {
    setCurrentIndex(prev => Math.max(-1, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setCurrentIndex(prev => Math.min(actions.length - 1, prev + 1));
  }, [actions.length]);

  const addAction = useCallback((action: ActionLog) => {
    // Truncate redo stack
    setActions(prev => [...prev.slice(0, currentIndex + 1), action]);
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex]);

  return {
    actions,
    currentIndex,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < actions.length - 1,
    undo,
    redo,
    addAction,
  };
};
```

**Teste Manual**:
```bash
# Componente que usa Undo/Redo continua funcionando?
npm run dev
# Testar: Score → Undo → Score → Redo
```

### 1.4 Fase 1c: Criação de useGameTimer (2 dias)

**Arquivo Novo**: `hooks/useGameTimer.ts`

```typescript
export interface GameTimer {
  timeoutSeconds: number;
  isRunning: boolean;
  startTimeout: (seconds: number) => void;
  stopTimeout: () => void;
  addTime: (seconds: number) => void;
}

export const useGameTimer = (): GameTimer => {
  const [timeoutSeconds, setTimeoutSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || timeoutSeconds <= 0) {
      setIsRunning(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeoutSeconds(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          // Trigger haptic feedback
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeoutSeconds]);

  return {
    timeoutSeconds,
    isRunning,
    startTimeout: (seconds: number) => {
      setTimeoutSeconds(seconds);
      setIsRunning(true);
    },
    stopTimeout: () => setIsRunning(false),
    addTime: (seconds: number) =>
      setTimeoutSeconds(prev => prev + seconds),
  };
};
```

### 1.5 Fase 1d: Criação de useGamePersistence (2 dias)

**Arquivo Novo**: `hooks/useGamePersistence.ts`

```typescript
export const useGamePersistence = (
  gameState: GameState,
  actionLog: ActionLog[]
) => {
  // useEffect que sincroniza estado com SecureStorage
  useEffect(() => {
    const save = async () => {
      try {
        await SecureStorage.set('currentGame', {
          state: gameState,
          actionLog,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Save failed:', error);
      }
    };

    const debounced = debounce(save, 1000);
    debounced();

    return () => debounced.cancel();
  }, [gameState, actionLog]);
};
```

### 1.6 Fase 1e: Refatoração de useVolleyGame (2 dias)

**Remover de useVolleyGame**:
- ❌ Timer logic (movido para useGameTimer)
- ❌ Undo/Redo logic (movido para useGameHistory)
- ❌ Persistence side effects (movido para useGamePersistence)

**Resultado**:
```typescript
// useVolleyGame agora é PURO (~ 200 linhas)
export const useVolleyGame = (initialState?: GameState): GameState => {
  const [state, setState] = useState(initialState || DEFAULT_STATE);

  const addPoint = (teamId: TeamId) => {
    setState(prev => ({
      ...prev,
      [teamId]: { ...prev[teamId], score: prev[teamId].score + 1 }
    }));
  };

  // ... scoring logic only
  // Timer, History, Persistence são hooks separados
};
```

### 1.7 Fase 1f: Integração em App.tsx (1 dia)

```typescript
// ANTES
const gameState = useVolleyGame();

// DEPOIS
const gameState = useVolleyGame();
const history = useGameHistory();
const timer = useGameTimer();
useGamePersistence(gameState, history.actions);

// UI consome todos os hooks normalmente
<ScoreCard 
  state={gameState}
  onUndo={history.undo}
  onTimeout={timer.startTimeout}
/>
```

### 1.8 Validação de Phase 1

#### Checklist
- [ ] `hooks/useGameHistory.ts` criado e testado
- [ ] `hooks/useGameTimer.ts` criado e testado
- [ ] `hooks/useGamePersistence.ts` criado
- [ ] `hooks/useVolleyGame.ts` reduzido a ~200 linhas
- [ ] App.tsx compilando sem erros TypeScript
- [ ] Undo/Redo funcionando na UI
- [ ] Timer funcionando
- [ ] Placar salvando corretamente
- [ ] Testes de regressão passando

#### Testes Manuais
```bash
npm run dev
# 1. Marcar 5 pontos → Undo 3 vezes → Pontuação volta corretamente?
# 2. Solicitar timeout → 30s countdown → Haptic feedback quando 0?
# 3. Fechar app → Reabrir → Histórico persiste?
```

---

## 🔄 Phase 2: Migração para IndexedDB (SPRINT 3)

### 2.1 Objetivo

Remover `localStorage` síncrono (bloqueia Main Thread) e usar IndexedDB (assíncrono).

**Impacto**:
- ✅ Zero jank em Android old ao salvar histórico
- ✅ Performance +40% em dispositivos legacy
- ✅ Suporta blobs (fotos de partidas)

### 2.2 Fase 2a: Setup (1 dia)

#### Instalação
```bash
npm install idb-keyval
npm install --save-dev @types/idb-keyval
```

#### Criar `services/IDBStorage.ts`

```typescript
import { get, set, del } from 'idb-keyval';

export class IDBStorage {
  static async save<T>(key: string, data: T): Promise<void> {
    try {
      await set(key, data);
    } catch (error) {
      console.error(`IDB save failed for ${key}:`, error);
      // Fallback a localStorage se IndexedDB indisponível
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  static async load<T>(key: string): Promise<T | null> {
    try {
      return await get(key);
    } catch (error) {
      console.error(`IDB load failed for ${key}:`, error);
      // Fallback a localStorage
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    }
  }

  static async remove(key: string): Promise<void> {
    await del(key);
    localStorage.removeItem(key);
  }
}
```

### 2.3 Fase 2b: Migração de useGamePersistence (2 dias)

```typescript
// ANTES: Síncrono (localStorage)
useEffect(() => {
  localStorage.setItem('currentGame', JSON.stringify(state));
}, [state]);

// DEPOIS: Assíncrono (IndexedDB + fallback)
useEffect(() => {
  const timer = setTimeout(async () => {
    await IDBStorage.save('currentGame', {
      state,
      actionLog,
      timestamp: Date.now(),
    });
  }, 500); // Debounce

  return () => clearTimeout(timer);
}, [state, actionLog]);
```

### 2.4 Fase 2c: Migração de usePlayerProfiles (1 dia)

```typescript
// profiles: Map<UUID, PlayerProfile>
// ANTES: localStorage.getItem/setItem

// DEPOIS: await IDBStorage.load/save
```

### 2.5 Fase 2d: Testes de Regressão (1 dia)

```bash
# 1. Criar partida → Salvar → Reabrir → Dados íntegros?
# 2. Histórico persiste em IDB?
# 3. Fallback a localStorage em browsers antigos?
# 4. Performance melhorou (< 50ms/save)?
```

---

## 🧩 Phase 3: Decomposição de TeamManagerModal (SPRINT 4)

### 3.1 Objetivo

Dividir `components/modals/TeamManagerModal.tsx` (1100 linhas) em componentes menores.

**Resultado**:
```
TeamManagerModal/
├─ index.tsx (250 linhas, orquestração)
├─ RosterTab.tsx (300 linhas, drag-drop)
├─ ProfilesTab.tsx (280 linhas, busca)
├─ BatchImportTab.tsx (200 linhas, CSV)
└─ sub/
   ├─ PlayerCard.tsx
   ├─ TeamColumn.tsx
   └─ ProfileCard.tsx
```

### 3.2 Fase 3a: Extração de RosterTab (2 dias)

```typescript
// components/modals/TeamManagerModal/RosterTab.tsx
export const RosterTab = ({
  courtA, courtB, onUpdate, ...
}) => (
  <div>
    <TeamColumn team={courtA} onUpdate={...} />
    <TeamColumn team={courtB} onUpdate={...} />
  </div>
);
```

### 3.3 Fase 3b: Extração de ProfilesTab (2 dias)

```typescript
// components/modals/TeamManagerModal/ProfilesTab.tsx
export const ProfilesTab = ({
  profiles, onAddPlayer, ...
}) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => filterProfiles(...), [search, profiles]);
  
  return (
    <div>
      <SearchInput value={search} onChange={setSearch} />
      <div className="grid">
        {filtered.map(profile => (
          <ProfileCard key={profile.id} profile={profile} />
        ))}
      </div>
    </div>
  );
};
```

### 3.4 Fase 3c: Extração de BatchImportTab (1 dia)

```typescript
// components/modals/TeamManagerModal/BatchImportTab.tsx
export const BatchImportTab = ({ onGenerateTeams, ... }) => {
  const [csv, setCsv] = useState('');
  
  const handleImport = () => {
    const players = parseCSV(csv);
    onGenerateTeams(players);
  };
  
  return (
    <div>
      <textarea value={csv} onChange={e => setCsv(e.target.value)} />
      <button onClick={handleImport}>Import</button>
    </div>
  );
};
```

### 3.5 Fase 3d: Refatoração de index.tsx (1 dia)

```typescript
// components/modals/TeamManagerModal/index.tsx
export const TeamManagerModal = (props) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'profiles' | 'batch'>('roster');

  return (
    <Modal {...props}>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab label="Roster">
          <RosterTab {...props} />
        </Tab>
        <Tab label="Profiles">
          <ProfilesTab {...props} />
        </Tab>
        <Tab label="Batch Import">
          <BatchImportTab {...props} />
        </Tab>
      </Tabs>
    </Modal>
  );
};
```

---

## ✅ Phase 4: Testes Unitários (SPRINT 5)

### 4.1 Objetivo

Cobertura de testes para lógica crítica (não UI).

### 4.2 Setup (1 dia)

```bash
npm install --save-dev vitest @testing-library/react @testing-library/user-event
```

### 4.3 Testes de balanceUtils.ts (1 dia)

```typescript
// utils/__tests__/balanceUtils.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTeamStrength, balanceTeamsSnake } from '../balanceUtils';

describe('calculateTeamStrength', () => {
  it('should calculate average skill correctly', () => {
    const players = [
      { skill: 5, position: 'middle' },
      { skill: 3, position: 'setter' },
    ];
    expect(calculateTeamStrength(players)).toBe(4);
  });

  it('should handle empty roster', () => {
    expect(calculateTeamStrength([])).toBe(0);
  });
});

describe('balanceTeamsSnake', () => {
  it('should alternate picks in snake draft', () => {
    const players = [
      { id: '1', skill: 5 },
      { id: '2', skill: 4 },
      { id: '3', skill: 3 },
      { id: '4', skill: 2 },
    ];
    const [teamA, teamB] = balanceTeamsSnake(players);
    // Team A: [player1, player4]
    // Team B: [player2, player3]
    expect(teamA[0].id).toBe('1');
    expect(teamB[0].id).toBe('2');
  });
});
```

### 4.4 Testes de useGameHistory (2 dias)

```typescript
// hooks/__tests__/useGameHistory.test.ts
import { renderHook, act } from '@testing-library/react';
import { useGameHistory } from '../useGameHistory';

describe('useGameHistory', () => {
  it('should undo last action', () => {
    const { result } = renderHook(() => useGameHistory());
    
    act(() => {
      result.current.addAction({ type: 'POINT', team: 'A' });
    });
    
    expect(result.current.currentIndex).toBe(0);
    
    act(() => {
      result.current.undo();
    });
    
    expect(result.current.currentIndex).toBe(-1);
  });

  it('should block undo when at beginning', () => {
    const { result } = renderHook(() => useGameHistory());
    expect(result.current.canUndo).toBe(false);
  });
});
```

### 4.5 Testes de SecureStorage (1 dia)

```typescript
// services/__tests__/SecureStorage.test.ts
import { SecureStorage } from '../SecureStorage';

describe('SecureStorage', () => {
  it('should save and retrieve data with integrity', async () => {
    const storage = SecureStorage.getInstance();
    const data = { playerA: 15, playerB: 13 };
    
    await storage.set('match', data);
    const retrieved = await storage.get('match');
    
    expect(retrieved).toEqual(data);
  });

  it('should detect corrupted data', async () => {
    const storage = SecureStorage.getInstance();
    await storage.set('match', { score: 15 });
    
    // Simulate corruption
    const corrupted = localStorage.getItem('match_hash');
    localStorage.setItem('match_hash', 'wrong_hash');
    
    expect(() => storage.get('match')).toThrow();
  });
});
```

---

## 📚 Phase 5: Documentação (SPRINT 5-6)

### 5.1 Documentos Já Criados
- ✅ ARCHITECTURE_TEAMMANAGER.md
- ✅ DATAFLOW_TEAMMANAGER.md
- ✅ TROUBLESHOOTING_TEAMMANAGER.md
- ✅ ARCHITECTURE_ANALYSIS.md

### 5.2 Próximos Documentos (1 semana)

#### ARCHITECTURE_GAME_STATE.md
```markdown
# Game State Management Architecture

## After Refactoring (Phase 1)

### useVolleyGame Hook (Pure Logic)
- Core scoring rules
- Team state mutations
- Set/Match determination

### useGameHistory Hook (Action Log)
- Undo/Redo stack
- Action serialization
- History persistence

### useGameTimer Hook (Timeout)
- Countdown logic
- Haptic triggers
- Time persistence

### useGamePersistence Hook (Storage Sync)
- IndexedDB integration
- Debounced saves
- Error recovery

## Data Flow
[ASCII diagram showing integration]
```

#### PERFORMANCE_TUNING.md
```markdown
# Performance Tuning Guide

## Baseline Metrics (Before Optimization)
- Initial load: ~2.5s
- Score update: ~16ms
- Memory: ~25MB (web), ~45MB (android)

## Profiling Commands
```bash
npx lighthouse ci:run
```

## GPU Optimization Checklist
- [ ] will-change: transform on animations
- [ ] Avoid backdrop-filter on dynamic elements
- [ ] DragOverlay in portal
- [ ] React.memo on score displays
```

---

## 🚀 Execution Timeline

```
WEEK 1-2 (Phase 1)
└─ Sprint 1: Refactor useVolleyGame
   ├─ Dia 1: Análise + Branch
   ├─ Dias 2-3: useGameHistory
   ├─ Dias 4-5: useGameTimer
   ├─ Dias 6-7: useGamePersistence
   └─ Dia 8-10: Integração + Testes

WEEK 3 (Phase 2)
└─ Sprint 2: IndexedDB Migration
   ├─ Dia 1: Setup + IDBStorage
   ├─ Dias 2-3: useGamePersistence migration
   ├─ Dia 4: usePlayerProfiles migration
   └─ Dia 5: Regressão testing

WEEK 4 (Phase 3)
└─ Sprint 3: TeamManagerModal Decomposition
   ├─ Dias 1-2: RosterTab extraction
   ├─ Dias 3-4: ProfilesTab extraction
   ├─ Dia 5: BatchImportTab extraction
   └─ Dia 6: index.tsx refactoring

WEEK 5-6 (Phase 4-5)
└─ Sprint 4-5: Testing + Docs
   ├─ Dias 1-3: Unit tests (balanceUtils, useGameHistory, SecureStorage)
   ├─ Dias 4-5: Integration tests
   └─ Dias 6-10: Complete documentation
```

---

## 💾 Git Workflow

### Por Phase

#### Phase 1
```bash
git checkout -b refactor/split-volleyball-hooks

# Commit 1: Create useGameHistory
git commit -m "refactor: extract game history logic into useGameHistory"

# Commit 2: Create useGameTimer
git commit -m "refactor: extract timer logic into useGameTimer"

# Commit 3: Create useGamePersistence
git commit -m "refactor: extract persistence logic into useGamePersistence"

# Commit 4: Clean up useVolleyGame
git commit -m "refactor: reduce useVolleyGame scope (core scoring only)"

# Pull request & merge
git push origin refactor/split-volleyball-hooks
```

#### Phase 2
```bash
git checkout -b feat/idb-migration

git commit -m "feat: add IDBStorage service with localStorage fallback"
git commit -m "refactor: migrate useGamePersistence to IndexedDB"
git commit -m "refactor: migrate usePlayerProfiles to IndexedDB"

git push origin feat/idb-migration
```

#### Phase 3
```bash
git checkout -b refactor/decompose-team-manager

git commit -m "refactor: extract RosterTab from TeamManagerModal"
git commit -m "refactor: extract ProfilesTab from TeamManagerModal"
git commit -m "refactor: extract BatchImportTab from TeamManagerModal"

git push origin refactor/decompose-team-manager
```

---

## ✔️ Critérios de Sucesso

### Phase 1: Refactoring
- [ ] useVolleyGame reduzido para < 250 linhas
- [ ] Todos os 4 hooks compilam sem erros TypeScript
- [ ] Undo/Redo funciona em UI
- [ ] Placar atualiza sem travamentos
- [ ] Histórico persiste após reload

### Phase 2: IndexedDB
- [ ] IDBStorage criado e testado
- [ ] Fallback a localStorage funciona
- [ ] Zero localStorage.setItem() calls em hot paths
- [ ] Performance melhorou 30%+ em dispositivos old

### Phase 3: Decomposition
- [ ] TeamManagerModal.tsx < 300 linhas
- [ ] Cada tab é componente separado
- [ ] Sub-components reutilizáveis
- [ ] Sem quebra de funcionalidades

### Phase 4: Testing
- [ ] 80%+ cobertura de utils/balanceUtils.ts
- [ ] 70%+ cobertura de hooks/
- [ ] 0 regressions em testes manuais
- [ ] CI/CD passa

### Phase 5: Documentation
- [ ] Todos 4 docs em markdown completos
- [ ] Diagramas ASCII de fluxo
- [ ] Exemplos de código compiláveis
- [ ] Links internos funcionando

---

## 📞 Escalação de Riscos

### Se alguma phase atrasada

**Phase 1 atrasada**: Pular Phase 2 (IndexedDB não é blocker)  
**Phase 2 atrasada**: Manter localStorage por mais 1 sprint  
**Phase 3 atrasada**: TeamManagerModal funciona mesmo sem decomposição  
**Phase 4 atrasada**: Testes podem ser feitos depois (docs é priority)

### Se houver bugs em produção

- Reverter última fase (git revert)
- Fix bug em branch separado
- Rebase feature branch
- Retry merge

---

## 🎓 Knowledge Transfer

Após Phase 5, criar:
- [ ] Vídeo tutorial (10min) mostrando arquitetura
- [ ] README.md atualizado com links aos documentos
- [ ] Checklist para onboarding novos devs
- [ ] Slides de arquitetura para apresentação

---

**Document Version**: 1.0  
**Status**: Planejado e Pronto para Execução  
**Last Updated**: December 8, 2025  
**Next Review**: After Phase 1 completion
