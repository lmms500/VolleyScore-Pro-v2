

import { useState, useCallback, useEffect } from 'react';
import { GameState, TeamId, SetHistory, GameConfig, Team, Player, RotationReport } from '../types';
import { DEFAULT_CONFIG, MIN_LEAD_TO_WIN, SETS_TO_WIN_MATCH } from '../constants';
import { usePlayerQueue } from './usePlayerQueue'; 

const STORAGE_KEY = 'volleyscore_pro_v25_action_log';

const INITIAL_STATE: GameState = {
  teamAName: 'Home',
  teamBName: 'Guest',
  scoreA: 0,
  scoreB: 0,
  setsA: 0,
  setsB: 0,
  currentSet: 1,
  history: [],
  actionLog: [], // Initialize empty log
  isMatchOver: false,
  matchWinner: null,
  servingTeam: null,
  swappedSides: false,
  config: DEFAULT_CONFIG,
  timeoutsA: 0,
  timeoutsB: 0,
  inSuddenDeath: false,
  matchDurationSeconds: 0,
  isTimerRunning: false,
  teamARoster: { id: 'A', name: 'Home', players: [] },
  teamBRoster: { id: 'B', name: 'Guest', players: [] },
  queue: [], 
  rotationReport: null
};

export const useVolleyGame = () => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sincroniza nomes com o gerenciador de fila
  const updateNamesFromQueue = useCallback((nameA: string, nameB: string) => {
      setState(prev => {
          if (prev.teamAName !== nameA || prev.teamBName !== nameB) {
              return { ...prev, teamAName: nameA, teamBName: nameB };
          }
          return prev;
      });
  }, []);

  const queueManager = usePlayerQueue(updateNamesFromQueue);

  // Sincroniza Estado da Fila -> Estado do Jogo
  useEffect(() => {
      const { courtA, courtB, queue, lastReport } = queueManager.queueState;
      setState(prev => {
          const reportToUse = lastReport || prev.rotationReport;
          
          if (prev.teamARoster === courtA && prev.teamBRoster === courtB && prev.queue === queue && prev.rotationReport === reportToUse) return prev;
          
          return {
              ...prev,
              teamARoster: courtA,
              teamBRoster: courtB,
              queue: queue,
              rotationReport: reportToUse, 
              teamAName: courtA.name,
              teamBName: courtB.name
          };
      });
  }, [queueManager.queueState]);

  // Persistência
  useEffect(() => {
    const loadGame = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) { 
        try { 
            const parsed = JSON.parse(saved);
            if(!parsed.config) parsed.config = DEFAULT_CONFIG;
            if(!Array.isArray(parsed.queue)) parsed.queue = [];
            // Migration for old saves without actionLog
            if(!parsed.actionLog) parsed.actionLog = [];
            setState(parsed); 
        } catch (e) { 
            console.error(e); 
        } 
      }
      setIsLoaded(true);
    };
    loadGame();
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, isLoaded]);

  // Timer
  useEffect(() => {
    let interval: any;
    if (state.isTimerRunning && !state.isMatchOver) {
      interval = setInterval(() => setState(prev => ({ ...prev, matchDurationSeconds: prev.matchDurationSeconds + 1 })), 1000);
    }
    return () => clearInterval(interval);
  }, [state.isTimerRunning, state.isMatchOver]);

  // --- LÓGICA AVANÇADA DE PONTUAÇÃO ---

  const isTieBreak = state.config.hasTieBreak && state.currentSet === state.config.maxSets;
  const pointsToWinCurrentSet = isTieBreak ? state.config.tieBreakPoints : state.config.pointsPerSet;
  const setsNeededToWin = SETS_TO_WIN_MATCH(state.config.maxSets);
  
  const getGameStatus = (scoreMy: number, scoreOpponent: number, setsMy: number) => {
      const isSetPoint = scoreMy >= pointsToWinCurrentSet - 1 && scoreMy > scoreOpponent;
      const isMatchPoint = isSetPoint && (setsMy === setsNeededToWin - 1);
      return { isSetPoint, isMatchPoint };
  };

  const statusA = getGameStatus(state.scoreA, state.scoreB, state.setsA);
  const statusB = getGameStatus(state.scoreB, state.scoreA, state.setsB);

  const isDeuce = state.scoreA === state.scoreB && state.scoreA >= pointsToWinCurrentSet - 1;

  // Derivação para saber se o jogo está "ativo" (já começou)
  // Útil para impedir mudanças de configuração sem resetar.
  const isMatchActive = state.scoreA > 0 || state.scoreB > 0 || state.setsA > 0 || state.setsB > 0 || state.currentSet > 1;

  const addPoint = useCallback((team: TeamId) => {
    if (state.isMatchOver) return;
    setState(prev => {
      let newScoreA = team === 'A' ? prev.scoreA + 1 : prev.scoreA;
      let newScoreB = team === 'B' ? prev.scoreB + 1 : prev.scoreB;
      
      const target = (prev.config.hasTieBreak && prev.currentSet === prev.config.maxSets) ? prev.config.tieBreakPoints : prev.config.pointsPerSet;
      let enteringSuddenDeath = false;

      if (prev.config.deuceType === 'sudden_death_3pt' && !prev.inSuddenDeath) {
         if (newScoreA === target - 1 && newScoreB === target - 1) {
             newScoreA = 0;
             newScoreB = 0;
             enteringSuddenDeath = true;
         }
      }

      let setWinner: TeamId | null = null;
      if (prev.inSuddenDeath || enteringSuddenDeath) {
          if (newScoreA >= 3 && newScoreA > newScoreB) setWinner = 'A';
          else if (newScoreB >= 3 && newScoreB > newScoreA) setWinner = 'B';
      } else {
           if (newScoreA >= target && newScoreA >= newScoreB + MIN_LEAD_TO_WIN) setWinner = 'A';
           else if (newScoreB >= target && newScoreB >= newScoreA + MIN_LEAD_TO_WIN) setWinner = 'B';
      }
      
      // If set is won, we don't push to actionLog (Undo across sets is disabled for simplicity)
      if (setWinner) {
          const newSetsA = setWinner === 'A' ? prev.setsA + 1 : prev.setsA;
          const newSetsB = setWinner === 'B' ? prev.setsB + 1 : prev.setsB;
          const historyEntry: SetHistory = { setNumber: prev.currentSet, scoreA: newScoreA, scoreB: newScoreB, winner: setWinner };
          const setsNeeded = SETS_TO_WIN_MATCH(prev.config.maxSets);
          const matchWinner = newSetsA === setsNeeded ? 'A' : (newSetsB === setsNeeded ? 'B' : null);
          
          let previewReport = null;
          if (matchWinner) {
              previewReport = queueManager.getRotationPreview(matchWinner);
          }

          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          
          return {
              ...prev, 
              scoreA: matchWinner ? newScoreA : 0, scoreB: matchWinner ? newScoreB : 0, setsA: newSetsA, setsB: newSetsB,
              history: [...prev.history, historyEntry], currentSet: matchWinner ? prev.currentSet : prev.currentSet + 1, 
              matchWinner: matchWinner, 
              isMatchOver: !!matchWinner, 
              rotationReport: previewReport, 
              servingTeam: null, isTimerRunning: matchWinner ? false : true, timeoutsA: 0, timeoutsB: 0, 
              inSuddenDeath: false,
              actionLog: [] // Clear log on set change
          };
      }
      
      return { 
          ...prev, 
          scoreA: newScoreA, 
          scoreB: newScoreB, 
          servingTeam: team, 
          isTimerRunning: true, 
          inSuddenDeath: prev.inSuddenDeath || enteringSuddenDeath,
          actionLog: [...prev.actionLog, { type: 'POINT', team }] 
      };
    });
  }, [state.isMatchOver, queueManager]);

  const subtractPoint = useCallback((team: TeamId) => {
    // Manual subtraction does NOT go into the log (it's a correction, not an action flow)
    if (state.isMatchOver) return;
    setState(prev => {
        if (team === 'A' && prev.scoreA === 0) return prev;
        if (team === 'B' && prev.scoreB === 0) return prev;
        return { ...prev, scoreA: team === 'A' ? prev.scoreA - 1 : prev.scoreA, scoreB: team === 'B' ? prev.scoreB - 1 : prev.scoreB };
    });
  }, [state.isMatchOver]);
  
  const useTimeout = useCallback((team: TeamId) => setState(prev => {
      let newTimeoutsA = prev.timeoutsA;
      let newTimeoutsB = prev.timeoutsB;
      let used = false;

      if (team === 'A' && prev.timeoutsA < 2) {
          newTimeoutsA = prev.timeoutsA + 1;
          used = true;
      }
      if (team === 'B' && prev.timeoutsB < 2) {
          newTimeoutsB = prev.timeoutsB + 1;
          used = true;
      }

      if (!used) return prev;

      return { 
          ...prev, 
          timeoutsA: newTimeoutsA, 
          timeoutsB: newTimeoutsB,
          actionLog: [...prev.actionLog, { type: 'TIMEOUT', team }]
      };
  }), []);

  const undo = useCallback(() => { 
    if (state.isMatchOver) return; 

    setState(prev => {
        // Strict undo logic: Only undo if there are actions in the log.
        // Heuristic fallback has been removed to ensure data consistency.
        if (prev.actionLog.length === 0) return prev;

        const newLog = [...prev.actionLog];
        const lastAction = newLog.pop()!;

        if (lastAction.type === 'TIMEOUT') {
            return {
                ...prev,
                actionLog: newLog,
                timeoutsA: lastAction.team === 'A' ? Math.max(0, prev.timeoutsA - 1) : prev.timeoutsA,
                timeoutsB: lastAction.team === 'B' ? Math.max(0, prev.timeoutsB - 1) : prev.timeoutsB,
            };
        }

        if (lastAction.type === 'POINT') {
            return {
                ...prev,
                actionLog: newLog,
                scoreA: lastAction.team === 'A' ? Math.max(0, prev.scoreA - 1) : prev.scoreA,
                scoreB: lastAction.team === 'B' ? Math.max(0, prev.scoreB - 1) : prev.scoreB,
                // On undo point, we reset server to avoid confusion.
                // Trade-off: User has to re-select server, but prevents invalid server state.
                servingTeam: null 
            };
        }

        if (lastAction.type === 'TOGGLE_SERVE') {
            return {
                ...prev,
                actionLog: newLog,
                servingTeam: lastAction.previousServer
            };
        }

        return prev;
    });
  }, [state.isMatchOver]); 

  const resetMatch = useCallback(() => {
      setState(prev => ({ 
          ...INITIAL_STATE, 
          teamAName: prev.teamAName, 
          teamBName: prev.teamBName, 
          teamARoster: prev.teamARoster, 
          teamBRoster: prev.teamBRoster, 
          queue: prev.queue, 
          config: prev.config 
      }));
  }, []);

  const toggleSides = useCallback(() => setState(prev => ({ ...prev, swappedSides: !prev.swappedSides })), []);
  
  const toggleService = useCallback(() => {
      setState(prev => {
          // Logic: A -> B -> null -> A
          const nextServer = prev.servingTeam === 'A' ? 'B' : (prev.servingTeam === 'B' ? null : 'A');
          return { 
              ...prev, 
              servingTeam: nextServer,
              actionLog: [...prev.actionLog, { type: 'TOGGLE_SERVE', previousServer: prev.servingTeam }]
          };
      });
  }, []);

  // Safe Apply Settings: Can optionally enforce a reset
  const applySettings = useCallback((newConfig: GameConfig, shouldReset: boolean = false) => {
      setState(prev => {
          if (shouldReset) {
              return {
                ...INITIAL_STATE,
                teamAName: prev.teamAName,
                teamBName: prev.teamBName,
                teamARoster: prev.teamARoster,
                teamBRoster: prev.teamBRoster,
                queue: prev.queue,
                config: newConfig
              };
          }
          return { ...prev, config: newConfig };
      });
  }, []);

  const rotateTeams = useCallback(() => {
    if (!state.matchWinner) return;
    queueManager.rotateTeams(state.matchWinner);
    setState(prev => ({
        ...prev, scoreA: 0, scoreB: 0, setsA: 0, setsB: 0, currentSet: 1, history: [], actionLog: [], isMatchOver: false, matchWinner: null, servingTeam: null, timeoutsA: 0, timeoutsB: 0, inSuddenDeath: false, matchDurationSeconds: 0, isTimerRunning: false,
    }));
  }, [state.matchWinner, queueManager]);

  return {
    state, setState, isLoaded, addPoint, subtractPoint, undo, resetMatch, toggleSides, toggleService, useTimeout, applySettings, 
    canUndo: state.actionLog.length > 0, 
    isMatchActive,
    generateTeams: queueManager.generateTeams,
    updateRosters: queueManager.updateRosters,
    rotateTeams,
    updateTeamName: queueManager.updateTeamName,
    updatePlayerName: queueManager.updatePlayerName,
    movePlayer: queueManager.movePlayer,
    removePlayer: queueManager.removePlayer,
    addPlayer: queueManager.addPlayer,
    undoRemovePlayer: queueManager.undoRemovePlayer,
    hasDeletedPlayers: queueManager.hasDeletedPlayers,
    togglePlayerFixed: queueManager.togglePlayerFixed,
    commitDeletions: queueManager.commitDeletions,
    deletedCount: queueManager.deletedCount,
    
    isTieBreak,
    isMatchPointA: statusA.isMatchPoint,
    isSetPointA: statusA.isSetPoint,
    isMatchPointB: statusB.isMatchPoint,
    isSetPointB: statusB.isSetPoint,
    pointsToWinCurrentSet,
    setsNeededToWin,
    isDeuce
  };
};