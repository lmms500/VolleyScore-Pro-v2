import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useVolleyGame } from './hooks/useVolleyGame';
import { useTutorial } from './hooks/useTutorial';
import { useHaptics } from './hooks/useHaptics';

// EAGER IMPORTS
import { ScoreCardNormal } from './components/ScoreCardNormal';
import { ScoreCardFullscreen } from './components/Fullscreen/ScoreCardFullscreen';
import { HistoryBar } from './components/HistoryBar';
import { Controls } from './components/Controls';
import { MeasuredFullscreenHUD } from './components/Fullscreen/MeasuredFullscreenHUD';
import { FloatingControlBar } from './components/Fullscreen/FloatingControlBar';
import { FloatingTopBar } from './components/Fullscreen/FloatingTopBar';
import { FullscreenMenuDrawer } from './components/Fullscreen/FullscreenMenuDrawer';
import { LayoutProvider } from './contexts/LayoutContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { SuddenDeathOverlay } from './components/ui/CriticalPointAnimation';
import { BackgroundGlow } from './components/ui/BackgroundGlow';
import { useTranslation } from './contexts/LanguageContext';
import { useHudMeasure } from './hooks/useHudMeasure';
import { useHistoryStore } from './stores/historyStore';
import { useGameAudio } from './hooks/useGameAudio';
import { TeamId, SkillType } from './types';
import { Minimize2, RefreshCw, Loader2 } from 'lucide-react';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useScreenOrientationLock } from './hooks/useScreenOrientationLock';

// MODAL IMPORTS - Lazy-loaded for code-splitting (Fase 3.1)
import { 
  LazySettingsModal, 
  LazyTeamManagerModal, 
  LazyMatchOverModal, 
  LazyConfirmationModal, 
  LazyHistoryModal, 
  LazyTutorialModal 
} from './components/modals/LazyModals';

// Simple SuspenseLoader component
const SuspenseLoader: React.FC = () => (
  <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-[#020617]">
    <Loader2 className="animate-spin text-indigo-500" size={48} />
  </div>
);

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
    updateTeamColor,
    updatePlayerName,
    updatePlayerNumber,
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
    deleteProfile,
    sortTeam
  } = game;

  const { t } = useTranslation();
  const historyStore = useHistoryStore();

  const tutorial = useTutorial(Capacitor.isNativePlatform());

  const [showSettings, setShowSettings] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFullscreenMenu, setShowFullscreenMenu] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [interactingTeam, setInteractingTeam] = useState<TeamId | null>(null);

  const [scoreElA, setScoreElA] = useState<HTMLElement | null>(null);
  const [scoreElB, setScoreElB] = useState<HTMLElement | null>(null);

  const savedMatchIdRef = useRef<string | null>(null);
  const audio = useGameAudio(state.config);
  const haptics = useHaptics(true); // Haptics always enabled (independent from audio)
  const prevSetsRef = useRef({ a: 0, b: 0 });

  const prevStatusRef = useRef({
      setPointA: false, matchPointA: false,
      setPointB: false, matchPointB: false,
      inSuddenDeath: false
  });

  useScreenOrientationLock(isFullscreen);

  // Fase 4: Native initialization - Splash Screen + Status Bar optimization
  useEffect(() => {
    const initializeApp = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Lock orientation to portrait
          await ScreenOrientation.lock({ orientation: 'portrait' });
          
          // Configure Status Bar (dark theme by default)
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#020617' }); // slate-950
          await StatusBar.setOverlaysWebView({ overlay: false }); // Fixed height
          
          // Smooth fade-out after app is ready
          setTimeout(async () => {
            await SplashScreen.hide({ fadeOutDuration: 400 }); // Smooth 400ms fade
          }, 200); // Wait 200ms for DOM ready
        } catch (error) {
          console.error("Native initialization error:", error);
          await SplashScreen.hide(); // Fallback: hide immediately
        }
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    const setsChanged = state.setsA > prevSetsRef.current.a || state.setsB > prevSetsRef.current.b;
    if (setsChanged && !state.isMatchOver) {
        audio.playSetWin();
        haptics.gamePatterns.setWin();
    }
    prevSetsRef.current = { a: state.setsA, b: state.setsB };

    if (state.isMatchOver && !savedMatchIdRef.current && state.matchWinner) {
      audio.playMatchWin();
      haptics.gamePatterns.matchWin();

      const newId = uuidv4();
      historyStore.addMatch({
        id: newId,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        durationSeconds: state.matchDurationSeconds,
        teamAName: state.teamAName,
        teamBName: state.teamBName,
        teamARoster: state.teamARoster,
        teamBRoster: state.teamBRoster,
        setsA: state.setsA,
        setsB: state.setsB,
        winner: state.matchWinner,
        sets: state.history,
        actionLog: state.matchLog,
        config: state.config
      });
      savedMatchIdRef.current = newId;
    }

    if (!state.isMatchOver) {
        savedMatchIdRef.current = null;
    }
  }, [state.isMatchOver, state.matchWinner, state.setsA, state.setsB, historyStore, audio, state.matchDurationSeconds, state.teamAName, state.teamBName, state.teamARoster, state.teamBRoster, state.history, state.matchLog, state.config, haptics]);

  const handleUndo = useCallback(() => {
    if (state.isMatchOver && savedMatchIdRef.current) {
        historyStore.deleteMatch(savedMatchIdRef.current);
        savedMatchIdRef.current = null;
    }
    undo();
    audio.playUndo();
    haptics.gamePatterns.timeout();
  }, [state.isMatchOver, undo, historyStore, audio, haptics]);

  useEffect(() => {
      if (state.pendingSideSwitch) {
          audio.playWhistle();
          haptics.gamePatterns.sideSwitch();
      }
  }, [state.pendingSideSwitch, audio, haptics]);

  useEffect(() => {
      const current = {
          setPointA: game.isSetPointA,
          matchPointA: game.isMatchPointA,
          setPointB: game.isSetPointB,
          matchPointB: game.isMatchPointB,
          inSuddenDeath: state.inSuddenDeath
      };

      const prev = prevStatusRef.current;

      const enteredMatchPoint = (current.matchPointA && !prev.matchPointA) || (current.matchPointB && !prev.matchPointB);
      const enteredSetPoint = (current.setPointA && !prev.setPointA && !current.matchPointA) || (current.setPointB && !prev.setPointB && !current.matchPointB);
      const enteredSuddenDeath = current.inSuddenDeath && !prev.inSuddenDeath;

      if (enteredSuddenDeath) {
          audio.playSuddenDeath();
          haptics.gamePatterns.suddenDeath();
      } else if (enteredMatchPoint) {
          audio.playMatchPointAlert();
          haptics.gamePatterns.matchPoint();
      } else if (enteredSetPoint) {
          audio.playSetPointAlert();
          haptics.gamePatterns.setPoint();
      }

      prevStatusRef.current = current;
  }, [game.isMatchPointA, game.isMatchPointB, game.isSetPointA, game.isSetPointB, state.inSuddenDeath, audio, haptics]);

  const visualLeftScoreEl = state.swappedSides ? scoreElB : scoreElA;
  const visualRightScoreEl = state.swappedSides ? scoreElA : scoreElB;

  const [layoutVersion, setLayoutVersion] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setLayoutVersion(v => v + 1), 50);
    return () => clearTimeout(t);
  }, [state.swappedSides, isFullscreen]);

  const hudPlacement = useHudMeasure({
      leftScoreEl: visualLeftScoreEl,
      rightScoreEl: visualRightScoreEl,
      enabled: isFullscreen,
      maxSets: state.config.maxSets,
      version: layoutVersion
  });

  const toggleFullscreen = useCallback(() => {
    audio.playTap();
    haptics.gamePatterns.scored();
    setIsFullscreen(prev => !prev);
  }, [audio, haptics]);

  const toggleTimer = useCallback(() => {
    audio.playTap();
    haptics.gamePatterns.scored();
    game.setState(prev => ({ ...prev, isTimerRunning: !prev.isTimerRunning }));
  }, [game.setState, audio, haptics]);

  const handleInteractionStartA = useCallback(() => setInteractingTeam('A'), []);
  const handleInteractionStartB = useCallback(() => setInteractingTeam('B'), []);
  const handleInteractionEnd = useCallback(() => setInteractingTeam(null), []);

  const handleAddA = useCallback((teamId: TeamId, playerId?: string, skill?: any) => {
    const metadata = playerId ? { playerId, skill: skill as SkillType } : undefined;
    if (!playerId && !state.config.enablePlayerStats) {
         audio.playScore();
         haptics.gamePatterns.scored();
    }
    addPoint('A', metadata);
  }, [addPoint, state.config.enablePlayerStats, audio, haptics]);

  const handleSubA = useCallback(() => {
    audio.playUndo();
    haptics.gamePatterns.timeout();
    subtractPoint('A');
  }, [subtractPoint, audio, haptics]);

  const handleAddB = useCallback((teamId: TeamId, playerId?: string, skill?: any) => {
    const metadata = playerId ? { playerId, skill: skill as SkillType } : undefined;
    if (!playerId && !state.config.enablePlayerStats) {
         audio.playScore();
         haptics.gamePatterns.scored();
    }
    addPoint('B', metadata);
  }, [addPoint, state.config.enablePlayerStats, audio, haptics]);

  const handleSubB = useCallback(() => {
    audio.playUndo();
    haptics.gamePatterns.timeout();
    subtractPoint('B');
  }, [subtractPoint, audio, haptics]);

  const handleSetServerA = useCallback(() => { audio.playTap(); haptics.gamePatterns.scored(); setServer('A'); }, [setServer, audio, haptics]);
  const handleSetServerB = useCallback(() => { audio.playTap(); haptics.gamePatterns.scored(); setServer('B'); }, [setServer, audio, haptics]);

  const handleTimeoutA = useCallback(() => { audio.playWhistle(); haptics.gamePatterns.timeout(); useTimeout('A'); }, [useTimeout, audio, haptics]);
  const handleTimeoutB = useCallback(() => { audio.playWhistle(); haptics.gamePatterns.timeout(); useTimeout('B'); }, [useTimeout, audio, haptics]);

  const openSettings = useCallback(() => { audio.playTap(); haptics.gamePatterns.scored(); setShowSettings(true); }, [audio, haptics]);
  const openManager = useCallback(() => { audio.playTap(); haptics.gamePatterns.scored(); setShowManager(true); }, [audio, haptics]);
  const openHistory = useCallback(() => { audio.playTap(); haptics.gamePatterns.scored(); setShowHistory(true); }, [audio, haptics]);
  const openReset = useCallback(() => { audio.playTap(); haptics.gamePatterns.scored(); setShowResetConfirm(true); }, [audio, haptics]);
  const toggleSwap = useCallback(() => { audio.playTap(); haptics.impact('medium'); toggleSides(); }, [audio, toggleSides, haptics]);
  const closeSettings = useCallback(() => setShowSettings(false), []);
  const closeManager = useCallback(() => setShowManager(false), []);
  const closeHistory = useCallback(() => setShowHistory(false), []);
  const closeReset = useCallback(() => setShowResetConfirm(false), []);
  const closeMenu = useCallback(() => setShowFullscreenMenu(false), []);
  const openMenu = useCallback(() => { audio.playTap(); haptics.gamePatterns.scored(); setShowFullscreenMenu(true); }, [audio, haptics]);

  if (!isLoaded) return <SuspenseLoader />;

  const setsLeft = state.swappedSides ? state.setsB : state.setsA;
  const setsRight = state.swappedSides ? state.setsA : state.setsB;

  const colorA = state.teamARoster.color || 'indigo';
  const colorB = state.teamBRoster.color || 'rose';

  const colorLeft = state.swappedSides ? colorB : colorA;
  const colorRight = state.swappedSides ? colorA : colorB;

  const isServingLeft = state.swappedSides ? state.servingTeam === 'B' : state.servingTeam === 'A';
  const isServingRight = state.swappedSides ? state.servingTeam === 'A' : state.servingTeam === 'B';
  const isMatchPoint = game.isMatchPointA || game.isMatchPointB;

  return (
    <ErrorBoundary>
      <LayoutProvider>
        <div className="flex flex-col h-[100dvh] bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-slate-100 overflow-hidden relative transition-colors duration-700 ease-in-out pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">

          <BackgroundGlow
            isSwapped={state.swappedSides}
            isFullscreen={isFullscreen}
            colorA={colorA}
            colorB={colorB}
          />

          <SuddenDeathOverlay active={state.inSuddenDeath} />

          <AnimatePresence>
             {state.pendingSideSwitch && (
                 <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={toggleSwap}
                 >
                     <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-indigo-500 text-center flex flex-col items-center gap-4 animate-bounce-subtle">
                         <RefreshCw size={48} className="text-indigo-500 animate-spin-slow" />
                         <div>
                             <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Switch Sides</h2>
                             <p className="text-sm font-bold text-slate-500">Sum of points is multiple of {state.config.hasTieBreak && state.currentSet === state.config.maxSets ? 5 : 7}</p>
                         </div>
                         <button className="px-6 py-2 bg-indigo-500 text-white rounded-full font-bold uppercase tracking-widest hover:bg-indigo-600 transition-colors">
                             Tap to Swap
                         </button>
                     </div>
                 </motion.div>
             )}
          </AnimatePresence>

          <div className={`
              z-30 transition-all duration-500 flex-none
              ${isFullscreen
                ? '-translate-y-24 opacity-0 pointer-events-none absolute w-full'
                : 'relative pt-[calc(env(safe-area-inset-top)+0.8rem)] pr-4 pb-2 pl-4 mt-1'}
          `}>
            <HistoryBar
              history={state.history}
              duration={state.matchDurationSeconds}
              setsA={state.setsA}
              setsB={state.setsB}
              colorA={colorA}
              colorB={colorB}
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
                    teamNameA={state.swappedSides ? state.teamBName : state.teamAName}
                    teamNameB={state.swappedSides ? state.teamAName : state.teamBName}
                    colorA={colorLeft}
                    colorB={colorRight}
                    isServingLeft={isServingLeft}
                    isServingRight={isServingRight}
                    onSetServerA={state.swappedSides ? handleSetServerB : handleSetServerA}
                    onSetServerB={state.swappedSides ? handleSetServerA : handleSetServerB}
                    timeoutsA={state.swappedSides ? state.timeoutsB : state.timeoutsA}
                    timeoutsB={state.swappedSides ? state.timeoutsA : state.timeoutsB}
                    onTimeoutA={state.swappedSides ? handleTimeoutB : handleTimeoutA}
                    onTimeoutB={state.swappedSides ? handleTimeoutA : handleTimeoutB}
                    isMatchPointA={state.swappedSides ? game.isMatchPointB : game.isMatchPointA}
                    isSetPointA={state.swappedSides ? game.isSetPointB : game.isSetPointA}
                    isMatchPointB={state.swappedSides ? game.isMatchPointA : game.isMatchPointB}
                    isSetPointB={state.swappedSides ? game.isSetPointA : game.isSetPointB}
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

          <main className="relative flex-1 z-10 flex flex-col justify-center items-center min-h-0 p-4 overflow-hidden">
              <div className={`
                  w-full h-full overflow-hidden
                  ${isFullscreen
                     ? 'fixed inset-0 z-10 p-0 border-none m-0 block'
                     : 'flex flex-col landscape:flex-row md:flex-row gap-2 md:gap-4'}
              `}>

                 {isFullscreen ? (
                    <>
                      <ScoreCardFullscreen
                          teamId="A"
                          team={state.teamARoster}
                          score={state.scoreA}
                          isServing={state.servingTeam === 'A'}
                          onAdd={handleAddA}
                          onSubtract={handleSubA}
                          isMatchPoint={game.isMatchPointA}
                          isSetPoint={game.isSetPointA}
                          isDeuce={game.isDeuce}
                          inSuddenDeath={state.inSuddenDeath}
                          isLocked={interactingTeam !== null && interactingTeam !== 'A'}
                          onInteractionStart={handleInteractionStartA}
                          onInteractionEnd={handleInteractionEnd}
                          reverseLayout={state.swappedSides}
                          scoreRefCallback={setScoreElA}
                          alignment={state.swappedSides ? 'right' : 'left'}
                          config={state.config}
                          colorTheme={colorA}
                      />
                      <ScoreCardFullscreen
                          teamId="B"
                          team={state.teamBRoster}
                          score={state.scoreB}
                          isServing={state.servingTeam === 'B'}
                          onAdd={handleAddB}
                          onSubtract={handleSubB}
                          isMatchPoint={game.isMatchPointB}
                          isSetPoint={game.isSetPointB}
                          isDeuce={game.isDeuce}
                          inSuddenDeath={state.inSuddenDeath}
                          isLocked={interactingTeam !== null && interactingTeam !== 'B'}
                          onInteractionStart={handleInteractionStartB}
                          onInteractionEnd={handleInteractionEnd}
                          reverseLayout={state.swappedSides}
                          scoreRefCallback={setScoreElB}
                          alignment={state.swappedSides ? 'left' : 'right'}
                          config={state.config}
                          colorTheme={colorB}
                      />
                    </>
                 ) : (
                    <LayoutGroup>
                      <motion.div
                        layout
                        key="card-wrapper-A"
                        className={`flex-1 w-full h-auto flex flex-col ${state.swappedSides ? 'order-last' : 'order-first'}`}
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
                            colorTheme={colorA}
                            isLocked={interactingTeam !== null && interactingTeam !== 'A'}
                            onInteractionStart={handleInteractionStartA}
                            onInteractionEnd={handleInteractionEnd}
                            config={state.config}
                        />
                      </motion.div>

                      <motion.div
                        layout
                        key="card-wrapper-B"
                        className={`flex-1 w-full h-auto flex flex-col ${state.swappedSides ? 'order-first' : 'order-last'}`}
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
                            colorTheme={colorB}
                            isLocked={interactingTeam !== null && interactingTeam !== 'B'}
                            onInteractionStart={handleInteractionStartB}
                            onInteractionEnd={handleInteractionEnd}
                            config={state.config}
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
                flex-none w-full z-50 flex justify-center pt-2
                transition-all duration-500 overflow-hidden
                ${isFullscreen
                    ? 'max-h-0 opacity-0 pointer-events-none'
                    : 'max-h-40 opacity-100 pointer-events-auto pb-[calc(env(safe-area-inset-bottom)+0.5rem)]'}
                pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]
            `}
          >
              <Controls
                  onUndo={handleUndo}
                  canUndo={game.canUndo}
                  onSwap={toggleSwap}
                  onSettings={openSettings}
                  onRoster={openManager}
                  onHistory={openHistory}
                  onReset={openReset}
                  onToggleFullscreen={toggleFullscreen}
              />
          </div>

          {isFullscreen && (
            <FloatingControlBar
                onUndo={handleUndo}
                canUndo={game.canUndo}
                onSwap={toggleSwap}
                onReset={openReset}
                onMenu={openMenu}
            />
          )}

          <FullscreenMenuDrawer
             isOpen={showFullscreenMenu}
             onClose={closeMenu}
             onOpenSettings={openSettings}
             onOpenRoster={openManager}
             onOpenHistory={openHistory}
             onExitFullscreen={toggleFullscreen}
          />

          <Suspense fallback={<SuspenseLoader />}>
            {tutorial.showTutorial && (
              <LazyTutorialModal
                isOpen={tutorial.showTutorial}
                onClose={tutorial.completeTutorial}
              />
            )}

            {showSettings && (
              <LazySettingsModal
                isOpen={showSettings}
                onClose={closeSettings}
                config={state.config}
                onSave={applySettings}
                isMatchActive={game.isMatchActive}
              />
            )}

            {showManager && (
              <LazyTeamManagerModal
                isOpen={showManager}
                onClose={closeManager}
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
                onUpdateTeamColor={updateTeamColor}
                onUpdatePlayerName={updatePlayerName}
                onUpdatePlayerNumber={updatePlayerNumber}
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
                onSortTeam={sortTeam}
              />
            )}

            {showHistory && (
              <LazyHistoryModal
                isOpen={showHistory}
                onClose={closeHistory}
              />
            )}

            {state.isMatchOver && (
              <LazyMatchOverModal
                isOpen={state.isMatchOver}
                state={state}
                onRotate={rotateTeams}
                onReset={resetMatch}
                onUndo={handleUndo}
              />
            )}

            {showResetConfirm && (
              <LazyConfirmationModal
                isOpen={showResetConfirm}
                onClose={closeReset}
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
