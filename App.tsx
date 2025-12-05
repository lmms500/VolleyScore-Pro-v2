
import React, { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react';
import { useVolleyGame } from './hooks/useVolleyGame';
import { usePWAInstallPrompt } from './hooks/usePWAInstallPrompt';
import { ScoreCardNormal } from './components/ScoreCardNormal';
import { ScoreCardFullscreen } from './components/ScoreCardFullscreen';
import { HistoryBar } from './components/HistoryBar';
import { Controls } from './components/Controls';
import { Minimize2 } from 'lucide-react';
import { TeamId } from './types';
import { MeasuredFullscreenHUD } from './components/MeasuredFullscreenHUD';
import { useTranslation } from './contexts/LanguageContext';
import { FloatingControlBar } from './components/Fullscreen/FloatingControlBar';
import { FloatingTopBar } from './components/Fullscreen/FloatingTopBar';
import { FullscreenMenuDrawer } from './components/Fullscreen/FullscreenMenuDrawer';
import { LayoutProvider } from './contexts/LayoutContext';
import { useHudMeasure } from './hooks/useHudMeasure';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { SuddenDeathOverlay } from './components/ui/CriticalPointAnimation';
import { BackgroundGlow } from './components/ui/BackgroundGlow';
import { motion, LayoutGroup } from 'framer-motion';
import { useHistoryStore } from './stores/historyStore';
import { v4 as uuidv4 } from 'uuid';

// Lazy Loaded Heavy Modals
const SettingsModal = lazy(() => import('./components/modals/SettingsModal').then(module => ({ default: module.SettingsModal })));
const TeamManagerModal = lazy(() => import('./components/modals/TeamManagerModal').then(module => ({ default: module.TeamManagerModal })));
const MatchOverModal = lazy(() => import('./components/modals/MatchOverModal').then(module => ({ default: module.MatchOverModal })));
const ConfirmationModal = lazy(() => import('./components/modals/ConfirmationModal').then(module => ({ default: module.ConfirmationModal })));
const HistoryModal = lazy(() => import('./components/modals/HistoryModal').then(module => ({ default: module.HistoryModal })));

function App() {
  const game = useVolleyGame();
  const { 
    state, 
    isLoaded, 
    addPoint, 
    subtractPoint, 
    setServer, 
    useTimeout, 
    undo, 
    toggleSides, 
    applySettings, 
    resetMatch, 
    generateTeams, 
    togglePlayerFixed, 
    removePlayer, 
    movePlayer, 
    updateTeamName, 
    updatePlayerName,
    updatePlayerSkill,
    addPlayer, 
    undoRemovePlayer, 
    commitDeletions, 
    rotateTeams,
    setRotationMode,
    balanceTeams,
    savePlayerToProfile,
    revertPlayerChanges,
    upsertProfile,
    deleteProfile
  } = game;

  const { t } = useTranslation();
  const historyStore = useHistoryStore();
  
  const pwa = usePWAInstallPrompt();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFullscreenMenu, setShowFullscreenMenu] = useState(false);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [interactingTeam, setInteractingTeam] = useState<TeamId | null>(null);

  // Refs for HUD Measurement (Passed down to ScoreCards)
  const [scoreElA, setScoreElA] = useState<HTMLElement | null>(null);
  const [scoreElB, setScoreElB] = useState<HTMLElement | null>(null);

  // Auto-Save Match History Logic with Undo Support
  const savedMatchIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Match Just Finished -> Save
    if (state.isMatchOver && !savedMatchIdRef.current && state.matchWinner) {
      const newId = uuidv4();
      historyStore.addMatch({
        id: newId,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        durationSeconds: state.matchDurationSeconds,
        teamAName: state.teamAName,
        teamBName: state.teamBName,
        setsA: state.setsA,
        setsB: state.setsB,
        winner: state.matchWinner,
        sets: state.history,
        config: state.config
      });
      savedMatchIdRef.current = newId;
    } 
    
    // 2. Reset the ref if match is no longer over (New Game Started OR Undo happened)
    // We do NOT delete here anymore. Explicit deletion happens in handleUndo.
    if (!state.isMatchOver) {
        savedMatchIdRef.current = null;
    }
  }, [state.isMatchOver, state.matchWinner, state.matchDurationSeconds, state.teamAName, state.teamBName, state.setsA, state.setsB, state.history, state.config, historyStore]);

  // Wrapper for Undo to handle History deletion logic
  const handleUndo = useCallback(() => {
    if (state.isMatchOver && savedMatchIdRef.current) {
        historyStore.deleteMatch(savedMatchIdRef.current);
        savedMatchIdRef.current = null;
    }
    game.undo();
  }, [state.isMatchOver, game.undo, historyStore]);

  // Determine which visual element corresponds to which logic based on swap
  const isSwapped = state.swappedSides;
  const visualLeftScoreEl = isSwapped ? scoreElB : scoreElA;
  const visualRightScoreEl = isSwapped ? scoreElA : scoreElB;

  // Force re-measure trigger on swap
  const [layoutVersion, setLayoutVersion] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setLayoutVersion(v => v + 1), 50);
    return () => clearTimeout(t);
  }, [isSwapped, isFullscreen]);

  const hudPlacement = useHudMeasure({ 
      leftScoreEl: visualLeftScoreEl, 
      rightScoreEl: visualRightScoreEl,
      enabled: isFullscreen,
      maxSets: state.config.maxSets,
      version: layoutVersion
  });

  const enterFullscreenMode = async () => {
    const element = document.documentElement;
    if (element.requestFullscreen && !document.fullscreenElement) {
      try {
        await element.requestFullscreen();
        if (screen.orientation && typeof (screen.orientation as any).lock === 'function') {
          const lockPromise = (screen.orientation as any).lock('landscape');
          if (lockPromise && typeof lockPromise.catch === 'function') lockPromise.catch(() => {});
        }
      } catch (error) {
        console.error("Error entering fullscreen:", error);
      }
    }
  };

  const exitFullscreenMode = async () => {
    if (document.exitFullscreen && document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error("Error exiting fullscreen:", error);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      enterFullscreenMode();
    } else {
      exitFullscreenMode();
    }
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      if (!isCurrentlyFullscreen) {
        if (screen.orientation && typeof (screen.orientation as any).unlock === 'function') {
           const unlockPromise = (screen.orientation as any).unlock();
           if (unlockPromise && typeof unlockPromise.catch === 'function') unlockPromise.catch(() => {});
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleTimer = useCallback(() => {
    game.setState(prev => ({ ...prev, isTimerRunning: !prev.isTimerRunning }));
  }, [game]);

  // Stable Handlers for Interactions
  // These are crucial to prevent prop churn on ScoreCards during gestures
  const handleInteractionStartA = useCallback(() => setInteractingTeam('A'), []);
  const handleInteractionStartB = useCallback(() => setInteractingTeam('B'), []);
  const handleInteractionEnd = useCallback(() => setInteractingTeam(null), []);
  
  // Handlers for Score (Wrapped to keep JSX clean AND stable for memoization)
  const handleAddA = useCallback(() => addPoint('A'), [addPoint]);
  const handleSubA = useCallback(() => subtractPoint('A'), [subtractPoint]);
  const handleAddB = useCallback(() => addPoint('B'), [addPoint]);
  const handleSubB = useCallback(() => subtractPoint('B'), [subtractPoint]);
  const handleSetServerA = useCallback(() => setServer('A'), [setServer]);
  const handleSetServerB = useCallback(() => setServer('B'), [setServer]);
  const handleTimeoutA = useCallback(() => useTimeout('A'), [useTimeout]);
  const handleTimeoutB = useCallback(() => useTimeout('B'), [useTimeout]);

  if (!isLoaded) return <div className="h-screen flex items-center justify-center text-slate-500 font-inter">{t('app.loading')}</div>;

  const setsLeft = isSwapped ? state.setsB : state.setsA;
  const setsRight = isSwapped ? state.setsA : state.setsB;
  const colorLeft = isSwapped ? 'rose' : 'indigo';
  const colorRight = isSwapped ? 'indigo' : 'rose';
  
  return (
    <ErrorBoundary>
      <LayoutProvider>
        <div className="flex flex-col h-[100dvh] bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-slate-100 overflow-hidden relative">
          
          <BackgroundGlow 
            isSwapped={isSwapped} 
            isFullscreen={isFullscreen} 
          />

          <SuddenDeathOverlay active={state.inSuddenDeath} />

          {/* History Bar - Hidden in Fullscreen, Sticky in Normal */}
          <div className={`
              z-30 transition-all duration-500 flex-none
              ${isFullscreen 
                ? '-translate-y-24 opacity-0 pointer-events-none absolute w-full' 
                : 'relative pt-[env(safe-area-inset-top)] pl-[calc(1rem+env(safe-area-inset-left))] pr-[calc(1rem+env(safe-area-inset-right))] pb-4 mt-2'}
          `}>
            <HistoryBar 
              history={state.history} 
              duration={state.matchDurationSeconds} 
              setsA={state.setsA}
              setsB={state.setsB}
            />
          </div>
          
          {isFullscreen && (
              <>
                <FloatingTopBar
                    time={state.matchDurationSeconds}
                    currentSet={state.currentSet}
                    isTieBreak={game.isTieBreak}
                    onToggleTimer={toggleTimer}
                    isTimerRunning={state.isTimerRunning}
                    teamNameA={isSwapped ? state.teamBName : state.teamAName}
                    teamNameB={isSwapped ? state.teamAName : state.teamBName}
                    colorA={colorLeft}
                    colorB={colorRight}
                    isServingLeft={isSwapped ? state.servingTeam === 'B' : state.servingTeam === 'A'}
                    isServingRight={isSwapped ? state.servingTeam === 'A' : state.servingTeam === 'B'}
                    onSetServerA={isSwapped ? handleSetServerB : handleSetServerA}
                    onSetServerB={isSwapped ? handleSetServerA : handleSetServerB}
                    timeoutsA={isSwapped ? state.timeoutsB : state.timeoutsA}
                    timeoutsB={isSwapped ? state.timeoutsA : state.timeoutsB}
                    onTimeoutA={isSwapped ? handleTimeoutB : handleTimeoutA}
                    onTimeoutB={isSwapped ? handleTimeoutA : handleTimeoutB}
                    isMatchPointA={isSwapped ? game.isMatchPointB : game.isMatchPointA}
                    isSetPointA={isSwapped ? game.isSetPointB : game.isSetPointA}
                    isMatchPointB={isSwapped ? game.isMatchPointA : game.isMatchPointB}
                    isSetPointB={isSwapped ? game.isSetPointA : game.isSetPointB}
                    isDeuce={game.isDeuce}
                    inSuddenDeath={state.inSuddenDeath}
                />

                <MeasuredFullscreenHUD
                    placement={hudPlacement}
                    setsLeft={setsLeft}
                    setsRight={setsRight}
                    colorLeft={colorLeft}
                    colorRight={colorRight}
                />
              </>
          )}

          <main className="relative flex-1 z-10 flex flex-col justify-center items-center min-h-0 p-4">
              <div className={`
                  transition-all duration-500 overflow-visible w-full
                  ${isFullscreen 
                     ? 'fixed inset-0 z-10 p-0 border-none m-0 block' 
                     : 'flex flex-col landscape:flex-row md:flex-row gap-4'
                  }
              `}>
                 
                 {isFullscreen ? (
                    <>
                      <ScoreCardFullscreen 
                          teamId="A"
                          score={state.scoreA}
                          isServing={state.servingTeam === 'A'}
                          onAdd={handleAddA}
                          onSubtract={handleSubA} 
                          isMatchPoint={game.isMatchPointA}
                          isSetPoint={game.isSetPointA}
                          isDeuce={game.isDeuce}
                          inSuddenDeath={state.inSuddenDeath}
                          colorTheme="indigo"
                          isLocked={interactingTeam !== null && interactingTeam !== 'A'}
                          onInteractionStart={handleInteractionStartA}
                          onInteractionEnd={handleInteractionEnd}
                          reverseLayout={isSwapped}
                          scoreRefCallback={setScoreElA}
                          alignment={isSwapped ? 'right' : 'left'}
                      />
                      <ScoreCardFullscreen
                          teamId="B"
                          score={state.scoreB}
                          isServing={state.servingTeam === 'B'}
                          onAdd={handleAddB}
                          onSubtract={handleSubB} 
                          isMatchPoint={game.isMatchPointB}
                          isSetPoint={game.isSetPointB}
                          isDeuce={game.isDeuce}
                          inSuddenDeath={state.inSuddenDeath}
                          colorTheme="rose"
                          isLocked={interactingTeam !== null && interactingTeam !== 'B'}
                          onInteractionStart={handleInteractionStartB}
                          onInteractionEnd={handleInteractionEnd}
                          reverseLayout={isSwapped}
                          scoreRefCallback={setScoreElB}
                          alignment={isSwapped ? 'left' : 'right'}
                      />
                    </>
                 ) : (
                    <LayoutGroup>
                      {/* Team A Wrapper */}
                      <motion.div 
                        layout 
                        key="card-wrapper-A"
                        className={`flex-1 w-full h-full flex flex-col ${isSwapped ? 'order-last' : 'order-first'}`}
                        transition={{ type: "spring", stiffness: 250, damping: 25 }}
                      >
                        <ScoreCardNormal
                            teamId="A"
                            team={state.teamARoster}
                            score={state.scoreA}
                            setsWon={state.setsA}
                            isServing={state.servingTeam === 'A'}
                            onAdd={handleAddA}
                            onSubtract={handleSubA}
                            onSetServer={handleSetServerA}
                            timeouts={state.timeoutsA}
                            onTimeout={handleTimeoutA}
                            isMatchPoint={game.isMatchPointA}
                            isSetPoint={game.isSetPointA}
                            isDeuce={game.isDeuce}
                            inSuddenDeath={state.inSuddenDeath}
                            setsNeededToWin={game.setsNeededToWin}
                            colorTheme="indigo"
                            isLocked={interactingTeam !== null && interactingTeam !== 'A'}
                            onInteractionStart={handleInteractionStartA}
                            onInteractionEnd={handleInteractionEnd}
                        />
                      </motion.div>

                      {/* Team B Wrapper */}
                      <motion.div 
                        layout 
                        key="card-wrapper-B"
                        className={`flex-1 w-full h-full flex flex-col ${isSwapped ? 'order-first' : 'order-last'}`}
                        transition={{ type: "spring", stiffness: 250, damping: 25 }}
                      >
                        <ScoreCardNormal
                            teamId="B"
                            team={state.teamBRoster}
                            score={state.scoreB}
                            setsWon={state.setsB}
                            isServing={state.servingTeam === 'B'}
                            onAdd={handleAddB}
                            onSubtract={handleSubB}
                            onSetServer={handleSetServerB}
                            timeouts={state.timeoutsB}
                            onTimeout={handleTimeoutB}
                            isMatchPoint={game.isMatchPointB}
                            isSetPoint={game.isSetPointB}
                            isDeuce={game.isDeuce}
                            inSuddenDeath={state.inSuddenDeath}
                            setsNeededToWin={game.setsNeededToWin}
                            colorTheme="rose"
                            isLocked={interactingTeam !== null && interactingTeam !== 'B'}
                            onInteractionStart={handleInteractionStartB}
                            onInteractionEnd={handleInteractionEnd}
                        />
                      </motion.div>
                    </LayoutGroup>
                 )}
    
                 {isFullscreen && (
                     <button 
                        onClick={toggleFullscreen}
                        className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-[60] p-3 rounded-full bg-black/20 text-white/30 hover:text-white hover:bg-black/60 backdrop-blur-md border border-white/5 transition-all active:scale-95"
                     >
                         <Minimize2 size={24} />
                     </button>
                 )}
              </div>
          </main>

          <div 
            className={`
                flex-none w-full z-50 flex justify-center pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4
                transition-all duration-500 overflow-hidden
                ${isFullscreen ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-40 opacity-100 pointer-events-auto'}
                pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]
            `}
          >
              <Controls 
                  onUndo={handleUndo}
                  canUndo={game.canUndo}
                  onSwap={toggleSides}
                  onSettings={() => setShowSettings(true)}
                  onRoster={() => setShowManager(true)}
                  onHistory={() => setShowHistory(true)}
                  onReset={() => setShowResetConfirm(true)}
                  onToggleFullscreen={toggleFullscreen}
              />
          </div>

          {isFullscreen && (
            <FloatingControlBar 
                onUndo={handleUndo}
                canUndo={game.canUndo}
                onSwap={toggleSides}
                onReset={() => setShowResetConfirm(true)}
                onMenu={() => setShowFullscreenMenu(true)}
            />
          )}

          <FullscreenMenuDrawer 
             isOpen={showFullscreenMenu}
             onClose={() => setShowFullscreenMenu(false)}
             onOpenSettings={() => setShowSettings(true)}
             onOpenRoster={() => setShowManager(true)}
             onOpenHistory={() => setShowHistory(true)}
             onExitFullscreen={exitFullscreenMode}
          />

          <Suspense fallback={null}>
            {showSettings && (
              <SettingsModal 
                isOpen={showSettings} 
                onClose={() => setShowSettings(false)}
                config={state.config}
                onSave={applySettings}
                onInstall={pwa.promptInstall}
                canInstall={pwa.isInstallable}
                isIOS={pwa.isIOS}
                isStandalone={pwa.isStandalone}
                isMatchActive={game.isMatchActive}
              />
            )}

            {showManager && (
              <TeamManagerModal 
                isOpen={showManager}
                onClose={() => setShowManager(false)}
                courtA={state.teamARoster}
                courtB={state.teamBRoster}
                queue={state.queue}
                rotationMode={game.rotationMode}
                onSetRotationMode={setRotationMode}
                onBalanceTeams={balanceTeams}
                onGenerate={generateTeams}
                onToggleFixed={togglePlayerFixed}
                onRemove={removePlayer}
                onMove={movePlayer}
                onUpdateTeamName={updateTeamName}
                onUpdatePlayerName={updatePlayerName}
                onUpdatePlayerSkill={updatePlayerSkill}
                onSaveProfile={savePlayerToProfile}
                onRevertProfile={revertPlayerChanges}
                onAddPlayer={addPlayer}
                onUndoRemove={undoRemovePlayer}
                canUndoRemove={game.hasDeletedPlayers}
                onCommitDeletions={commitDeletions}
                deletedCount={game.deletedCount}
                profiles={game.profiles}
                upsertProfile={upsertProfile} 
                deleteProfile={deleteProfile} 
              />
            )}

            {showHistory && (
              <HistoryModal 
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
              />
            )}

            {state.isMatchOver && (
              <MatchOverModal 
                isOpen={state.isMatchOver}
                state={state}
                onRotate={rotateTeams}
                onReset={resetMatch}
                onUndo={handleUndo}
              />
            )}

            {showResetConfirm && (
              <ConfirmationModal 
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={resetMatch}
                title="Reset Match?"
                message="Are you sure you want to reset the match? All scores and history will be lost."
              />
            )}
          </Suspense>
        </div>
      </LayoutProvider>
    </ErrorBoundary>
  );
}

export default App;
