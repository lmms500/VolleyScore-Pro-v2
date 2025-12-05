
import { useState, useCallback, useEffect } from 'react';
import { GameState, TeamId, SetHistory, GameConfig, Team, Player, RotationReport } from '../types';
import { DEFAULT_CONFIG, MIN_LEAD_TO_WIN, SETS_TO_WIN_MATCH } from '../constants';
import { usePlayerQueue } from './usePlayerQueue'; 
import { SecureStorage } from '../services/SecureStorage';
import { sanitizeInput, isValidScoreOperation, isValidTimeoutRequest } from '../utils/security';

const STORAGE_KEY = 'action_log';

const INITIAL_STATE: GameState = {
  teamAName: 'Home',
  teamBName: 'Guest',
  scoreA: 0,
  scoreB: 0,
  setsA: 0,
  setsB: 0,
  currentSet: 1,
  history: [],
  actionLog: [],
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

  // Sync names with queue manager (Sanitized)
  const updateNamesFromQueue = useCallback((nameA: string, nameB: string) => {
      setState(prev => {
          const safeNameA = sanitizeInput(nameA);
          const safeNameB = sanitizeInput(nameB);
          
          if (prev.teamAName !== safeNameA || prev.teamBName !== safeNameB) {
              return { ...prev, teamAName: safeNameA, teamBName: safeNameB };
          }
          return prev;
      });
  }, []);

  const queueManager = usePlayerQueue(updateNamesFromQueue);

  // Sync Queue State -> Game State
  useEffect(() => {
      const { courtA, courtB, queue, lastReport } = queueManager.queueState;
      setState(prev => {
          const reportToUse = lastReport || prev.rotationReport;
          // Identity check to avoid render loops
          if (prev.teamARoster === courtA && prev.teamBRoster === courtB && prev.queue === queue && prev.rotationReport === reportToUse) return prev;
          
          return {
              ...prev,
              teamARoster: courtA,
              teamBRoster: courtB,
              queue: queue,
              rotationReport: reportToUse, 
              teamAName: sanitizeInput(courtA.name),
              teamBName: sanitizeInput(courtB.name)
          };
      });
  }, [queueManager.queueState]);

  // Persistence: LOAD
  useEffect(() => {
    const loadGame = async () => {
      const savedState = await SecureStorage.load<GameState>(STORAGE_KEY);
      
      if (savedState) { 
        if(!savedState.config) savedState.config = DEFAULT_CONFIG;
        if(!Array.isArray(savedState.queue)) savedState.queue = [];
        if(!savedState.actionLog) savedState.actionLog = [];

        savedState.teamAName = sanitizeInput(savedState.teamAName);
        savedState.teamBName = sanitizeInput(savedState.teamBName);
        
        savedState.actionLog = savedState.actionLog.filter((action: any) => action.type !== 'TOGGLE_SERVE');
        
        // Ensure legacy saves don't break with new snapshot field
        if ((savedState as any).lastSnapshot) delete (savedState as any).lastSnapshot;

        setState(savedState); 
      }
      setIsLoaded(true);
    };
    loadGame();
  }, []);

  // Persistence: SAVE
  // This ensures the match state, including individual sets history, is saved to persistent storage.
  useEffect(() => {
    if (isLoaded) {
        // We strip lastSnapshot to avoid recursive JSON structures and save space
        const { lastSnapshot, ...stateToSave } = state;
        SecureStorage.save(STORAGE_KEY, stateToSave);
    }
  }, [state, isLoaded]);

  // Timer: Optimized to use functional update to avoid dependency on 'state' in effects
  useEffect(() => {
    let interval: any;
    if (state.isTimerRunning && !state.isMatchOver) {
      interval = setInterval(() => {
        setState(prev => ({ ...prev, matchDurationSeconds: prev.matchDurationSeconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.isTimerRunning, state.isMatchOver]);

  // --- SCORE LOGIC ---
  // Calculated derived state for UI consumption
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
  const isMatchActive = state.scoreA > 0 || state.scoreB > 0 || state.setsA > 0 || state.setsB > 0 || state.currentSet > 1;

  // Optimized Actions
  
  const addPoint = useCallback((team: TeamId) => {
    setState(prev => {
      if (prev.isMatchOver) return prev;
      if (prev.scoreA > 200 || prev.scoreB > 200) return prev;

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
          
          // CRITICAL: We save the 'prev' state as a snapshot before transitioning to a win state.
          // This allows "Undo" to revert the set/match win.
          // IMPORTANT: We must capture the exact roster/queue state at this moment to revert rotation logic correctly.
          const snapshotState = { ...prev };

          return {
              ...prev, 
              scoreA: matchWinner ? newScoreA : 0, scoreB: matchWinner ? newScoreB : 0, setsA: newSetsA, setsB: newSetsB,
              history: [...prev.history, historyEntry], currentSet: matchWinner ? prev.currentSet : prev.currentSet + 1, 
              matchWinner: matchWinner, 
              isMatchOver: !!matchWinner, 
              rotationReport: previewReport, 
              servingTeam: null, isTimerRunning: matchWinner ? false : true, timeoutsA: 0, timeoutsB: 0, 
              inSuddenDeath: false,
              actionLog: [], // Clear log for new set, but snapshot handles the undo
              lastSnapshot: snapshotState // Save clean snapshot
          };
      }
      
      return { 
          ...prev, 
          scoreA: newScoreA, 
          scoreB: newScoreB, 
          servingTeam: team, 
          isTimerRunning: true, 
          inSuddenDeath: prev.inSuddenDeath || enteringSuddenDeath,
          actionLog: [...prev.actionLog, { 
              type: 'POINT', 
              team,
              prevScoreA: prev.scoreA,
              prevScoreB: prev.scoreB,
              prevServingTeam: prev.servingTeam
          }],
          lastSnapshot: undefined // Clear snapshot on normal point to prevent stale jump-backs
      };
    });
  }, [queueManager]);

  const subtractPoint = useCallback((team: TeamId) => {
    setState(prev => {
        if (prev.isMatchOver) return prev;
        if (!isValidScoreOperation(team === 'A' ? prev.scoreA : prev.scoreB, -1)) return prev;
        
        // Manual subtraction essentially functions like an undo but without popping the history stack cleanly.
        // We log the manual change for consistency if needed, but usually this is just a correction.
        return { 
            ...prev, 
            scoreA: team === 'A' ? prev.scoreA - 1 : prev.scoreA, 
            scoreB: team === 'B' ? prev.scoreB - 1 : prev.scoreB,
            // We do NOT clear lastSnapshot here because manual adjustment might be minor.
            // But strict undo is preferred.
        };
    });
  }, []);
  
  const useTimeout = useCallback((team: TeamId) => {
    setState(prev => {
      if (team === 'A' && !isValidTimeoutRequest(prev.timeoutsA)) return prev;
      if (team === 'B' && !isValidTimeoutRequest(prev.timeoutsB)) return prev;

      let newTimeoutsA = prev.timeoutsA;
      let newTimeoutsB = prev.timeoutsB;

      if (team === 'A') newTimeoutsA++;
      if (team === 'B') newTimeoutsB++;

      return { 
          ...prev, 
          timeoutsA: newTimeoutsA, 
          timeoutsB: newTimeoutsB,
          actionLog: [...prev.actionLog, { 
              type: 'TIMEOUT', 
              team,
              prevTimeoutsA: prev.timeoutsA,
              prevTimeoutsB: prev.timeoutsB
          }],
          lastSnapshot: undefined
      };
    });
  }, []);

  const undo = useCallback(() => { 
    setState(prev => {
        // Priority 1: Restore Snapshot (Set/Match Transitions)
        // This handles the "Undo Match Win" scenario, effectively reverting to Match Point.
        if (prev.lastSnapshot) {
            console.log("Restoring snapshot (Undo Match/Set Win)");
            // CRITICAL FIX: Explicitly restore the Queue State in the QueueManager.
            // The snapshot contains the roster state *before* the match/set ended.
            // If we don't do this, the QueueManager thinks rotation happened, but the GameState thinks it didn't.
            if (prev.lastSnapshot.teamARoster && prev.lastSnapshot.teamBRoster) {
                queueManager.overrideQueueState(
                    prev.lastSnapshot.teamARoster,
                    prev.lastSnapshot.teamBRoster,
                    prev.lastSnapshot.queue
                );
            }
            return prev.lastSnapshot;
        }

        if (prev.isMatchOver) return prev; 
        if (prev.actionLog.length === 0) return prev;

        const newLog = [...prev.actionLog];
        const lastAction = newLog.pop()!;

        if (lastAction.type === 'TIMEOUT') {
            return {
                ...prev,
                actionLog: newLog,
                timeoutsA: lastAction.prevTimeoutsA,
                timeoutsB: lastAction.prevTimeoutsB,
                lastSnapshot: undefined
            };
        }

        if (lastAction.type === 'POINT') {
            return {
                ...prev,
                actionLog: newLog,
                scoreA: lastAction.prevScoreA,
                scoreB: lastAction.prevScoreB,
                servingTeam: lastAction.prevServingTeam, // Restore correctly instead of null
                lastSnapshot: undefined
            };
        }

        return prev;
    });
  }, [queueManager]); 

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
  
  const setServer = useCallback((team: TeamId) => {
      setState(prev => ({ ...prev, servingTeam: team }));
  }, []);

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
    // Pass the existing report to ensure the rotation matches what was previewed
    queueManager.rotateTeams(state.matchWinner, state.rotationReport);
    setState(prev => ({
        ...prev, scoreA: 0, scoreB: 0, setsA: 0, setsB: 0, currentSet: 1, history: [], actionLog: [], isMatchOver: false, matchWinner: null, servingTeam: null, timeoutsA: 0, timeoutsB: 0, inSuddenDeath: false, matchDurationSeconds: 0, isTimerRunning: false,
    }));
  }, [state.matchWinner, state.rotationReport, queueManager]);

  return {
    state, setState, isLoaded, addPoint, subtractPoint, undo, resetMatch, toggleSides, setServer, useTimeout, applySettings, 
    canUndo: state.actionLog.length > 0 || !!state.lastSnapshot, 
    isMatchActive,
    generateTeams: queueManager.generateTeams,
    rotateTeams,
    updateTeamName: queueManager.updateTeamName,
    updatePlayerName: queueManager.updatePlayerName,
    updatePlayerSkill: queueManager.updatePlayerSkill,
    movePlayer: queueManager.movePlayer,
    removePlayer: queueManager.removePlayer,
    addPlayer: queueManager.addPlayer,
    undoRemovePlayer: queueManager.undoRemovePlayer,
    hasDeletedPlayers: queueManager.hasDeletedPlayers,
    togglePlayerFixed: queueManager.togglePlayerFixed,
    commitDeletions: queueManager.commitDeletions,
    deletedCount: queueManager.deletedCount,
    setRotationMode: queueManager.setRotationMode,
    balanceTeams: queueManager.balanceTeams,
    savePlayerToProfile: queueManager.savePlayerToProfile,
    revertPlayerChanges: queueManager.revertPlayerChanges,
    deleteProfile: queueManager.deleteProfile, // Passthrough
    upsertProfile: queueManager.upsertProfile, // Passthrough
    rotationMode: queueManager.queueState.mode,
    profiles: queueManager.profiles,

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
