

import { useState, useCallback, useEffect } from 'react';
import { GameState, TeamId, SetHistory, GameConfig, Team, Player, RotationReport, SkillType, ActionLog } from '../types';
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
  matchLog: [], // Initialize empty match log
  isMatchOver: false,
  matchWinner: null,
  servingTeam: null,
  swappedSides: false,
  config: DEFAULT_CONFIG,
  timeoutsA: 0,
  timeoutsB: 0,
  inSuddenDeath: false,
  pendingSideSwitch: false,
  matchDurationSeconds: 0,
  isTimerRunning: false,
  teamARoster: { id: 'A', name: 'Home', color: 'indigo', players: [] },
  teamBRoster: { id: 'B', name: 'Guest', color: 'rose', players: [] },
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
        // Migrate legacy config if needed
        if(!savedState.config) savedState.config = DEFAULT_CONFIG;
        else {
             if (savedState.config.mode === undefined) savedState.config.mode = 'indoor';
             if (savedState.config.enablePlayerStats === undefined) savedState.config.enablePlayerStats = false;
             if (savedState.config.enableSound === undefined) savedState.config.enableSound = true;
        }

        if(!Array.isArray(savedState.queue)) savedState.queue = [];
        if(!savedState.actionLog) savedState.actionLog = [];
        
        // Critical Fix: Ensure matchLog exists, or reconstruct/init it
        if(!savedState.matchLog) savedState.matchLog = [...savedState.actionLog]; 
        
        // Migration: Ensure color exists on legacy saves
        if (savedState.teamARoster && !savedState.teamARoster.color) savedState.teamARoster.color = 'indigo';
        if (savedState.teamBRoster && !savedState.teamBRoster.color) savedState.teamBRoster.color = 'rose';

        savedState.teamAName = sanitizeInput(savedState.teamAName);
        savedState.teamBName = sanitizeInput(savedState.teamBName);
        
        savedState.actionLog = savedState.actionLog.filter((action: any) => action.type !== 'TOGGLE_SERVE');
        savedState.matchLog = savedState.matchLog.filter((action: any) => action.type !== 'TOGGLE_SERVE');
        
        // Ensure legacy saves don't break with new snapshot field
        if ((savedState as any).lastSnapshot) delete (savedState as any).lastSnapshot;

        setState(savedState); 
      }
      setIsLoaded(true);
    };
    loadGame();
  }, []);

  // Persistence: SAVE
  useEffect(() => {
    if (isLoaded) {
        const { lastSnapshot, ...stateToSave } = state;
        SecureStorage.save(STORAGE_KEY, stateToSave);
    }
  }, [state, isLoaded]);

  // Timer
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
  
  // REFACTORED: Now accepts metadata object for proper spread into ActionLog
  const addPoint = useCallback((team: TeamId, metadata?: { playerId: string, skill: SkillType }) => {
    setState(prev => {
      if (prev.isMatchOver) return prev;
      if (prev.scoreA > 200 || prev.scoreB > 200) return prev;

      let newScoreA = team === 'A' ? prev.scoreA + 1 : prev.scoreA;
      let newScoreB = team === 'B' ? prev.scoreB + 1 : prev.scoreB;
      
      // --- BEACH MODE LOGIC (Rule Implementation) ---
      let triggerSideSwitch = false;
      const totalPoints = newScoreA + newScoreB;
      
      if (prev.config.mode === 'beach') {
         const isFinalSet = prev.config.hasTieBreak && prev.currentSet === prev.config.maxSets;
         const switchInterval = isFinalSet ? 5 : 7;
         if (totalPoints > 0 && totalPoints % switchInterval === 0) {
             triggerSideSwitch = true;
         }
      }
      // ------------------------------------

      const target = (prev.config.hasTieBreak && prev.currentSet === prev.config.maxSets) ? prev.config.tieBreakPoints : prev.config.pointsPerSet;
      let enteringSuddenDeath = false;

      // Deuce Logic
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

      // Create Action Log Entry
      const newAction: ActionLog = { 
        type: 'POINT', 
        team,
        prevScoreA: prev.scoreA,
        prevScoreB: prev.scoreB,
        prevServingTeam: prev.servingTeam,
        timestamp: Date.now(),
        ...(metadata || {})   
      };
      
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
              pendingSideSwitch: false, // Reset switch on set end
              actionLog: [], // Clear current set undo stack
              matchLog: [...prev.matchLog, newAction], // Keep full match history (stats) - CRITICAL FIX
              lastSnapshot: snapshotState
          };
      }
      
      return { 
          ...prev, 
          scoreA: newScoreA, 
          scoreB: newScoreB, 
          servingTeam: team, 
          isTimerRunning: true, 
          inSuddenDeath: prev.inSuddenDeath || enteringSuddenDeath,
          pendingSideSwitch: triggerSideSwitch,
          actionLog: [...prev.actionLog, newAction],
          matchLog: [...prev.matchLog, newAction], // Persist full match history
          lastSnapshot: undefined 
      };
    });
  }, [queueManager]);

  const subtractPoint = useCallback((team: TeamId) => {
    setState(prev => {
        if (prev.isMatchOver) return prev;
        if (!isValidScoreOperation(team === 'A' ? prev.scoreA : prev.scoreB, -1)) return prev;
        
        // Note: Subtract is "Manual Correction", not "Undo". It doesn't use actionLog.
        // It does not remove from matchLog because it's a correction of the current state, 
        // not a rewind of history. Ideally, users should use UNDO for mistakes.
        
        return { 
            ...prev, 
            scoreA: team === 'A' ? prev.scoreA - 1 : prev.scoreA, 
            scoreB: team === 'B' ? prev.scoreB - 1 : prev.scoreB,
            pendingSideSwitch: false // Removing a point cancels any pending switch
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

      const newAction: ActionLog = { 
        type: 'TIMEOUT', 
        team,
        prevTimeoutsA: prev.timeoutsA,
        prevTimeoutsB: prev.timeoutsB,
        timestamp: Date.now()
      };

      return { 
          ...prev, 
          timeoutsA: newTimeoutsA, 
          timeoutsB: newTimeoutsB,
          actionLog: [...prev.actionLog, newAction],
          matchLog: [...prev.matchLog, newAction],
          lastSnapshot: undefined
      };
    });
  }, []);

  const undo = useCallback(() => { 
    setState(prev => {
        // Priority 1: Restore Snapshot (Set/Match Transitions)
        if (prev.lastSnapshot) {
            console.log("Restoring snapshot (Undo Match/Set Win)");
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
        
        // Fix: Also remove from matchLog to keep stats accurate
        const newMatchLog = [...prev.matchLog];
        // Only pop if the last item in matchLog matches the one we are undoing
        // (It should always match in linear time, but safe to check type)
        if (newMatchLog.length > 0 && newMatchLog[newMatchLog.length - 1].type === lastAction.type) {
            newMatchLog.pop();
        }

        if (lastAction.type === 'TIMEOUT') {
            return {
                ...prev,
                actionLog: newLog,
                matchLog: newMatchLog,
                timeoutsA: lastAction.prevTimeoutsA,
                timeoutsB: lastAction.prevTimeoutsB,
                lastSnapshot: undefined
            };
        }

        if (lastAction.type === 'POINT') {
            return {
                ...prev,
                actionLog: newLog,
                matchLog: newMatchLog,
                scoreA: lastAction.prevScoreA,
                scoreB: lastAction.prevScoreB,
                servingTeam: lastAction.prevServingTeam, 
                pendingSideSwitch: false, // Undo cancels pending switch
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

  const toggleSides = useCallback(() => setState(prev => ({ 
      ...prev, 
      swappedSides: !prev.swappedSides,
      pendingSideSwitch: false // Acknowledged
  })), []);
  
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
    queueManager.rotateTeams(state.matchWinner, state.rotationReport);
    setState(prev => ({
        ...prev, 
        scoreA: 0, scoreB: 0, setsA: 0, setsB: 0, currentSet: 1, history: [], 
        actionLog: [], matchLog: [], // Clear logs for new match
        isMatchOver: false, matchWinner: null, servingTeam: null, timeoutsA: 0, timeoutsB: 0, inSuddenDeath: false, matchDurationSeconds: 0, isTimerRunning: false,
    }));
  }, [state.matchWinner, state.rotationReport, queueManager]);

  return {
    state, setState, isLoaded, addPoint, subtractPoint, undo, resetMatch, toggleSides, setServer, useTimeout, applySettings, 
    canUndo: state.actionLog.length > 0 || !!state.lastSnapshot, 
    isMatchActive,
    generateTeams: queueManager.generateTeams,
    rotateTeams,
    updateTeamName: queueManager.updateTeamName,
    updateTeamColor: queueManager.updateTeamColor,
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
    deleteProfile: queueManager.deleteProfile,
    upsertProfile: queueManager.upsertProfile,
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