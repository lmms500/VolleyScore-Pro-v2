# VolleyScore Pro v2 - Referência de Código para Refatoração

**Objetivo**: Snippets prontos para copiar/colar durante refatoração  
**Stack**: TypeScript + React Hooks  
**Fase**: 1 (useVolleyGame Refactoring)

---

## 📦 Parte 1: useGameHistory.ts

### Arquivo Completo

```typescript
// hooks/useGameHistory.ts
import { useState, useCallback } from 'react';
import type { ActionLog } from '../types';

export interface GameHistory {
  actions: ActionLog[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  addAction: (action: ActionLog) => void;
  clearHistory: () => void;
  getCurrentAction: () => ActionLog | null;
  getHistorySize: () => number;
}

export const useGameHistory = (maxHistorySize: number = 100): GameHistory => {
  const [actions, setActions] = useState<ActionLog[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  /**
   * Adiciona uma ação ao histórico
   * Se houver redo stack, ele é descartado (padrão do Undo)
   */
  const addAction = useCallback(
    (action: ActionLog) => {
      setActions((prev) => {
        // Remove qualquer redo stack
        const trimmed = prev.slice(0, currentIndex + 1);
        const updated = [...trimmed, action];

        // Limita tamanho máximo (evita memory leak)
        if (updated.length > maxHistorySize) {
          return updated.slice(-maxHistorySize);
        }

        return updated;
      });

      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, maxHistorySize]
  );

  /**
   * Desfaz uma ação
   */
  const undo = useCallback(() => {
    setCurrentIndex((prev) => {
      const newIndex = Math.max(-1, prev - 1);
      return newIndex;
    });
  }, []);

  /**
   * Refaz uma ação (se houver redo stack disponível)
   */
  const redo = useCallback(() => {
    setCurrentIndex((prev) => {
      const newIndex = Math.min(actions.length - 1, prev + 1);
      return newIndex;
    });
  }, [actions.length]);

  /**
   * Retorna a ação atual (índice currentIndex)
   */
  const getCurrentAction = useCallback((): ActionLog | null => {
    if (currentIndex === -1 || currentIndex >= actions.length) {
      return null;
    }
    return actions[currentIndex];
  }, [actions, currentIndex]);

  /**
   * Limpa todo o histórico
   */
  const clearHistory = useCallback(() => {
    setActions([]);
    setCurrentIndex(-1);
  }, []);

  return {
    actions,
    currentIndex,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < actions.length - 1,
    undo,
    redo,
    addAction,
    clearHistory,
    getCurrentAction,
    getHistorySize: () => actions.length,
  };
};
```

### Como Usar em Componentes

```typescript
// Example: ScoreCard.tsx
import { useGameHistory } from '../hooks/useGameHistory';

export const ScoreCard = ({ ... }) => {
  const history = useGameHistory();

  const handleUndoClick = () => {
    if (history.canUndo) {
      history.undo();
      // Recalculate game state based on history
    }
  };

  return (
    <div>
      <button 
        onClick={handleUndoClick} 
        disabled={!history.canUndo}
      >
        Undo {history.canUndo ? `(${history.currentIndex})` : ''}
      </button>
    </div>
  );
};
```

---

## ⏱️ Parte 2: useGameTimer.ts

### Arquivo Completo

```typescript
// hooks/useGameTimer.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useHaptics } from './useHaptics';
import { useGameAudio } from './useGameAudio';

export interface GameTimer {
  timeoutSeconds: number;
  isRunning: boolean;
  startTimeout: (seconds: number, onExpire?: () => void) => void;
  stopTimeout: () => void;
  resetTimeout: () => void;
  addTime: (seconds: number) => void;
  removeTime: (seconds: number) => void;
  setTime: (seconds: number) => void;
}

export const useGameTimer = (): GameTimer => {
  const [timeoutSeconds, setTimeoutSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const onExpireCallback = useRef<(() => void) | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const haptics = useHaptics();
  const audio = useGameAudio();

  /**
   * Cleanup timer interval
   */
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Main timer effect
   */
  useEffect(() => {
    if (!isRunning || timeoutSeconds <= 0) {
      clearTimer();
      setIsRunning(false);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeoutSeconds((prev) => {
        const next = prev - 1;

        // Trigger feedback at specific intervals
        if (next === 10 || next === 5 || next === 1) {
          haptics.selection();
          audio.play('beep_warning');
        }

        // Timer expired
        if (next <= 0) {
          setIsRunning(false);
          clearTimer();
          haptics.impact('medium');
          audio.play('timeout_expired');
          onExpireCallback.current?.();
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => clearTimer();
  }, [isRunning, timeoutSeconds, clearTimer, haptics, audio]);

  const startTimeout = useCallback(
    (seconds: number, onExpire?: () => void) => {
      setTimeoutSeconds(seconds);
      if (onExpire) {
        onExpireCallback.current = onExpire;
      }
      setIsRunning(true);
    },
    []
  );

  const stopTimeout = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetTimeout = useCallback(() => {
    setTimeoutSeconds(0);
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const addTime = useCallback((seconds: number) => {
    setTimeoutSeconds((prev) => prev + seconds);
  }, []);

  const removeTime = useCallback((seconds: number) => {
    setTimeoutSeconds((prev) => Math.max(0, prev - seconds));
  }, []);

  const setTime = useCallback((seconds: number) => {
    setTimeoutSeconds(Math.max(0, seconds));
  }, []);

  return {
    timeoutSeconds,
    isRunning,
    startTimeout,
    stopTimeout,
    resetTimeout,
    addTime,
    removeTime,
    setTime,
  };
};
```

### Como Usar em Componentes

```typescript
// Example: ControlPanel.tsx
import { useGameTimer } from '../hooks/useGameTimer';

export const ControlPanel = ({ ... }) => {
  const timer = useGameTimer();

  const requestTimeout = () => {
    timer.startTimeout(30, () => {
      // Callback when timeout expires
      console.log('Timeout expired!');
    });
  };

  return (
    <div>
      <p>Timeout: {timer.timeoutSeconds}s</p>
      <button onClick={requestTimeout} disabled={timer.isRunning}>
        Request Timeout
      </button>
      {timer.isRunning && (
        <button onClick={timer.stopTimeout}>Stop Timer</button>
      )}
    </div>
  );
};
```

---

## 💾 Parte 3: useGamePersistence.ts

### Arquivo Completo

```typescript
// hooks/useGamePersistence.ts
import { useEffect, useRef, useCallback } from 'react';
import type { GameState } from '../types';
import type { ActionLog } from '../types';
import { SecureStorage } from '../services/SecureStorage';

export interface PersistenceConfig {
  debounceMs?: number;
  autoSave?: boolean;
  storageKey?: string;
}

export const useGamePersistence = (
  gameState: GameState,
  actionLog: ActionLog[],
  config: PersistenceConfig = {}
) => {
  const {
    debounceMs = 1000,
    autoSave = true,
    storageKey = 'currentGame',
  } = config;

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  /**
   * Serializar estado para detectar mudanças
   */
  const serialize = useCallback(() => {
    return JSON.stringify({
      state: gameState,
      actionLog,
      timestamp: Date.now(),
    });
  }, [gameState, actionLog]);

  /**
   * Salvar estado de forma segura
   */
  const save = useCallback(async () => {
    try {
      const data = {
        state: gameState,
        actionLog,
        timestamp: Date.now(),
      };

      await SecureStorage.set(storageKey, data);
      lastSavedRef.current = JSON.stringify(data);
    } catch (error) {
      console.error('[GamePersistence] Save failed:', error);
      // Não falha o jogo se persistência falhar
    }
  }, [gameState, actionLog, storageKey]);

  /**
   * Carregar estado anterior
   */
  const load = useCallback(async () => {
    try {
      const data = await SecureStorage.get(storageKey);
      return data as typeof gameState & { actionLog: ActionLog[] };
    } catch (error) {
      console.error('[GamePersistence] Load failed:', error);
      return null;
    }
  }, [storageKey]);

  /**
   * Deletar estado persistido
   */
  const clear = useCallback(async () => {
    try {
      await SecureStorage.remove(storageKey);
      lastSavedRef.current = '';
    } catch (error) {
      console.error('[GamePersistence] Clear failed:', error);
    }
  }, [storageKey]);

  /**
   * Auto-save com debounce
   */
  useEffect(() => {
    if (!autoSave) return;

    // Limpar timer anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Verificar se estado mudou
    const serialized = serialize();
    if (serialized === lastSavedRef.current) {
      return; // Sem mudanças, skip save
    }

    // Debounce save
    debounceTimer.current = setTimeout(() => {
      save();
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [gameState, actionLog, autoSave, debounceMs, save, serialize]);

  return {
    save,
    load,
    clear,
    hasChanges: serialize() !== lastSavedRef.current,
  };
};
```

### Como Usar em App.tsx

```typescript
// Example: App.tsx integration
import { useGamePersistence } from './hooks/useGamePersistence';

export const App = () => {
  const gameState = useVolleyGame();
  const history = useGameHistory();
  
  // Auto-persist a cada mudança de estado (debounced 1s)
  useGamePersistence(gameState, history.actions, {
    debounceMs: 1000,
    autoSave: true,
  });

  return (
    // ... render UI
  );
};
```

---

## 🎮 Parte 4: Refactored useVolleyGame.ts

### Arquivo Simplificado (Apenas Core Scoring)

```typescript
// hooks/useVolleyGame.ts - REFACTORED
import { useState, useCallback, useReducer } from 'react';
import type {
  GameState,
  TeamId,
  GameMode,
  Team,
} from '../types';
import { DEFAULT_CONFIG } from '../constants';

const INITIAL_STATE: GameState = {
  courtA: { score: 0, team: { players: [] }, setsWon: 0 },
  courtB: { score: 0, team: { players: [] }, setsWon: 0 },
  currentSet: 1,
  inSuddenDeath: false,
  gameMode: 'best-of-3',
  timestamp: Date.now(),
};

/**
 * REFACTORED: Este hook agora contém APENAS lógica de scoring
 * Timer, History, Persistence são extraídos para hooks dedicados
 */
export const useVolleyGame = (
  initialState?: GameState
): GameState & {
  addPoint: (teamId: TeamId) => void;
  subtractPoint: (teamId: TeamId) => void;
  resetScore: () => void;
  resetSet: () => void;
  resetMatch: () => void;
  setGameMode: (mode: GameMode) => void;
  getMatchStatus: () => string;
  isMatchOver: () => boolean;
  getWinner: () => TeamId | null;
} => {
  const [state, setState] = useState<GameState>(
    initialState || INITIAL_STATE
  );

  /**
   * Calcular se time venceu o set
   */
  const checkSetWin = (teamScore: number, opponentScore: number): boolean => {
    const MIN_LEAD = DEFAULT_CONFIG.MIN_LEAD_TO_WIN; // 2
    const MIN_POINTS = DEFAULT_CONFIG.POINTS_TO_WIN_SET; // 25

    if (state.inSuddenDeath) {
      return teamScore >= 15 && teamScore - opponentScore >= MIN_LEAD;
    }

    return teamScore >= MIN_POINTS && teamScore - opponentScore >= MIN_LEAD;
  };

  /**
   * Adicionar ponto para um time
   */
  const addPoint = useCallback(
    (teamId: TeamId) => {
      setState((prev) => {
        const updatedTeam = {
          ...prev[teamId],
          score: prev[teamId].score + 1,
        };

        const opponent = teamId === 'courtA' ? 'courtB' : 'courtA';
        const opponentScore = prev[opponent].score;

        let newState = { ...prev, [teamId]: updatedTeam };

        // Check set win
        if (
          checkSetWin(updatedTeam.score, opponentScore)
        ) {
          newState = {
            ...newState,
            [teamId]: {
              ...updatedTeam,
              setsWon: prev[teamId].setsWon + 1,
            },
            currentSet: prev.currentSet + 1,
            courtA: {
              ...newState.courtA,
              score: 0,
            },
            courtB: {
              ...newState.courtB,
              score: 0,
            },
            inSuddenDeath: false,
          };

          // Check sudden death (2-2 em sets)
          if (
            newState.courtA.setsWon === 2 &&
            newState.courtB.setsWon === 2
          ) {
            newState.inSuddenDeath = true;
          }
        }

        return newState;
      });
    },
    [state.inSuddenDeath]
  );

  /**
   * Remover ponto
   */
  const subtractPoint = useCallback((teamId: TeamId) => {
    setState((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        score: Math.max(0, prev[teamId].score - 1),
      },
    }));
  }, []);

  /**
   * Resetar pontuação do set (não afeta sets ganhos)
   */
  const resetScore = useCallback(() => {
    setState((prev) => ({
      ...prev,
      courtA: { ...prev.courtA, score: 0 },
      courtB: { ...prev.courtB, score: 0 },
    }));
  }, []);

  /**
   * Resetar set (zera sets ganhos)
   */
  const resetSet = useCallback(() => {
    setState((prev) => ({
      ...prev,
      courtA: { ...prev.courtA, score: 0, setsWon: 0 },
      courtB: { ...prev.courtB, score: 0, setsWon: 0 },
      currentSet: 1,
      inSuddenDeath: false,
    }));
  }, []);

  /**
   * Resetar match (estado inicial)
   */
  const resetMatch = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  /**
   * Mudar modo de jogo
   */
  const setGameMode = useCallback((mode: GameMode) => {
    setState((prev) => ({
      ...prev,
      gameMode: mode,
    }));
  }, []);

  /**
   * Retornar status legível do match
   */
  const getMatchStatus = useCallback((): string => {
    if (isMatchOver()) {
      return 'Match Over';
    }
    return `Set ${state.currentSet} - ${state.courtA.score} x ${state.courtB.score}`;
  }, [state]);

  /**
   * Verificar se match acabou
   */
  const isMatchOver = useCallback((): boolean => {
    const maxSets = DEFAULT_CONFIG.SETS_TO_WIN_MATCH;
    return (
      state.courtA.setsWon >= maxSets || state.courtB.setsWon >= maxSets
    );
  }, [state]);

  /**
   * Retornar vencedor do match (ou null se ainda em andamento)
   */
  const getWinner = useCallback((): TeamId | null => {
    if (!isMatchOver()) return null;
    return state.courtA.setsWon > state.courtB.setsWon ? 'courtA' : 'courtB';
  }, [state]);

  return {
    ...state,
    addPoint,
    subtractPoint,
    resetScore,
    resetSet,
    resetMatch,
    setGameMode,
    getMatchStatus,
    isMatchOver,
    getWinner,
  };
};
```

### Comparação: Antes vs Depois

```typescript
// ANTES (700 linhas): 1 arquivo HUGE
const gameState = useVolleyGame();
// Contém: scoring + history + timer + persistence

// DEPOIS (200 linhas): 4 arquivos FOCUSED
const gameState = useVolleyGame();        // scoring only
const history = useGameHistory();         // undo/redo
const timer = useGameTimer();             // timeouts
useGamePersistence(gameState, history.actions); // storage
```

---

## 🧪 Parte 5: Testes de Migração

### Arquivo de Testes

```typescript
// hooks/__tests__/useVolleyGame.refactor.test.ts
import { renderHook, act } from '@testing-library/react';
import { useVolleyGame } from '../useVolleyGame';
import { useGameHistory } from '../useGameHistory';
import { useGameTimer } from '../useGameTimer';
import { useGamePersistence } from '../useGamePersistence';

describe('Refactored Game Hooks - Integration', () => {
  it('should coordinate between useVolleyGame and useGameHistory', () => {
    const { result: gameResult } = renderHook(() => useVolleyGame());
    const { result: historyResult } = renderHook(() => useGameHistory());

    // Score a point
    act(() => {
      gameResult.current.addPoint('courtA');
      historyResult.current.addAction({
        type: 'POINT',
        team: 'courtA',
        timestamp: Date.now(),
      });
    });

    expect(gameResult.current.courtA.score).toBe(1);
    expect(historyResult.current.actions).toHaveLength(1);
    expect(historyResult.current.canUndo).toBe(true);
  });

  it('should persist score changes via useGamePersistence', async () => {
    const { result: gameResult } = renderHook(() => useVolleyGame());
    const { result: persistResult } = renderHook(() =>
      useGamePersistence(gameResult.current, [], {
        debounceMs: 100,
        autoSave: true,
      })
    );

    act(() => {
      gameResult.current.addPoint('courtA');
    });

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Should detect changes
    expect(persistResult.current.hasChanges).toBe(true);
  });

  it('should handle timeout separately via useGameTimer', () => {
    const { result: timerResult } = renderHook(() => useGameTimer());

    act(() => {
      timerResult.current.startTimeout(30);
    });

    expect(timerResult.current.isRunning).toBe(true);
    expect(timerResult.current.timeoutSeconds).toBe(30);
  });
});
```

### Checklist de Verificação Pós-Migração

```typescript
// Test Checklist: Criar arquivo de verificação manual
export const postMigrationChecklist = {
  '1. Core Scoring': {
    'Marcar ponto (Team A)': () => {
      // Navigate to score screen
      // Tap Team A zone
      // Score should increment
      // ✅ Pass
    },
    'Desmarcar ponto': () => {
      // Tap Team B zone
      // Score should increment
      // Tap undo
      // Score should decrement
      // ✅ Pass
    },
    'Set win detection': () => {
      // Marcar pontos até 25 x 23 (Team A)
      // Tela deve passar para próximo set
      // Set counter deve atualizar
      // ✅ Pass
    },
  },

  '2. Undo/Redo': {
    'Undo function': () => {
      // Marcar 5 pontos
      // Cliq undo 3 vezes
      // Deve retornar ao estado de 2 pontos
      // ✅ Pass
    },
    'Redo function': () => {
      // Undo 3 vezes
      // Cliq redo 2 vezes
      // Deve avançar para 4 pontos
      // ✅ Pass
    },
  },

  '3. Timer': {
    'Timeout countdown': () => {
      // Request timeout (30s)
      // Timer deve iniciar contagem
      // Ao chegar em 0, haptic feedback
      // ✅ Pass
    },
  },

  '4. Persistence': {
    'Match saved to storage': async () => {
      // Jogar partida
      // Fechar app
      // Reabrir app
      // Histórico deve estar preservado
      // ✅ Pass
    },
  },
};
```

---

## 🔗 Parte 6: Integração em App.tsx

### Exemplo Completo

```typescript
// App.tsx - After Refactoring
import { useVolleyGame } from './hooks/useVolleyGame';
import { useGameHistory } from './hooks/useGameHistory';
import { useGameTimer } from './hooks/useGameTimer';
import { useGamePersistence } from './hooks/useGamePersistence';

export const App = () => {
  // Core game state (scoring only)
  const gameState = useVolleyGame();

  // History management (undo/redo)
  const history = useGameHistory();

  // Timer management (timeouts)
  const timer = useGameTimer();

  // Persistence (storage sync)
  const persistence = useGamePersistence(gameState, history.actions, {
    debounceMs: 1000,
    autoSave: true,
  });

  // UI Components receive specific data they need
  return (
    <main>
      <ScoreCard
        score={gameState.courtA.score}
        onPoint={() => {
          gameState.addPoint('courtA');
          history.addAction({
            type: 'POINT',
            team: 'courtA',
            timestamp: Date.now(),
          });
        }}
      />

      <Controls
        onUndo={history.undo}
        canUndo={history.canUndo}
        onTimeout={(seconds) => timer.startTimeout(seconds)}
        timeoutActive={timer.isRunning}
      />

      <StatusBar
        matchStatus={gameState.getMatchStatus()}
        timerSeconds={timer.timeoutSeconds}
        hasUnsavedChanges={persistence.hasChanges}
      />
    </main>
  );
};
```

---

## 📝 Parte 7: Guia de Migração Prático

### Passo a Passo

**Dia 1: Criar useGameHistory**
1. Copiar `hooks/useGameHistory.ts` (Parte 1)
2. Testar: Score → Undo → Redo
3. ✅ Commit

**Dia 2: Criar useGameTimer**
1. Copiar `hooks/useGameTimer.ts` (Parte 2)
2. Testar: Request Timeout → Countdown
3. ✅ Commit

**Dia 3: Criar useGamePersistence**
1. Copiar `hooks/useGamePersistence.ts` (Parte 3)
2. Testar: Save → Close → Reopen → Data loads
3. ✅ Commit

**Dia 4: Refatorar useVolleyGame**
1. Copiar `hooks/useVolleyGame.ts` refactored (Parte 4)
2. Remover 500 linhas de código não-scoring
3. Testar: Scoring, sets, match win
4. ✅ Commit

**Dia 5: Integrar em App.tsx**
1. Usar exemplo (Parte 6)
2. Testar: Todos os flows funcionam
3. Testes manuais (Parte 5)
4. ✅ Commit final

---

**Document Version**: 1.0  
**Status**: Pronto para Implementação  
**Last Updated**: December 8, 2025  
**Time to Execute**: ~5 dias (1 dev)
