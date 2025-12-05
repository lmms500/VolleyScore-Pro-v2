
import React, { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react';
import { useVolleyGame } from './hooks/useVolleyGame';
import { usePWAInstallPrompt } from './hooks/usePWAInstallPrompt';
import { ScoreCardNormal } from './components/ScoreCardNormal';
import { ScoreCardFullscreen } from './components/ScoreCardFullscreen';
import { HistoryBar } from './components/HistoryBar';
import { Controls } from './components/Controls';
import { Minimize2, RefreshCw } from 'lucide-react';
import { TeamId, SkillType } from './types';
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
import { ReloadPrompt } from './components/ui/ReloadPrompt';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { useHistoryStore } from './stores/historyStore';
import { v4 as uuidv4 } from 'uuid';
import { useGameAudio } from './hooks/useGameAudio';

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
  
  // Audio for App-level events (Match Over, Set Over)
  const audio = useGameAudio(state.config);

  // Track sets to detect Set Changes for Audio
  const prevSetsRef = useRef({ a: 0, b: 0 });

  useEffect(() => {
    // 1. Detect Set Win (Audio Only)
    const setsChanged = state.setsA > prevSetsRef.current.a || state.setsB > prevSetsRef.current.b;
    if (setsChanged && !state.isMatchOver) {
        audio.playSetWin();
    }
    prevSetsRef.current = { a: state.setsA, b: state.setsB };

    // 2. Match Over Logic
    if (state.isMatchOver && !savedMatchIdRef.current && state.matchWinner) {
      audio.playMatchWin(); // Play Win Sound

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
        actionLog: state.matchLog, // USE MATCHLOG to include all stats across all sets
        config: state.config
      });
      savedMatchIdRef.current = newId;
    } 
    
    if (!state.isMatchOver) {
        savedMatchIdRef.current = null;
    }
  }, [state.isMatchOver, state.matchWinner, state.setsA, state.setsB, historyStore, audio]);

  // Wrapper for Undo
  const handleUndo = useCallback(() => {
    if (state.isMatchOver && savedMatchIdRef.current) {
        historyStore.deleteMatch(savedMatchIdRef.current);
        savedMatchIdRef.current = null;
    }
    game.undo();
    audio.playUndo();
  }, [state.isMatchOver, game.undo, historyStore, audio]);

  // Handle Beach Switch Alert
  useEffect(() => {
      if (state.pendingSideSwitch) {
          audio.playWhistle();
          // Optional: Vibrate
          if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
      }
  }, [state.pendingSideSwitch, audio]);

  // Handle Critical Moments (Audio)
  useEffect(() => {
      if (game.isMatchPointA || game.isMatchPointB || game.isSetPointA || game.isSetPointB) {
          // Play subtle tension sound only once when entering state
          // (Implementation depends on user preference, kept subtle here)
          // audio.playCritical(); 
      }
  }, [game.isMatchPointA, game.isMatchPointB, game.isSetPointA, game.isSetPointB, audio]);

  // Fullscreen Logic
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

  const toggleFullscreen = () => {
    audio.playTap();
    if (!document.fullscreenElement) {
        const element = document.documentElement;
        if (element.requestFullscreen) element.requestFullscreen().catch(() => {});
    } else {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleTimer = useCallback(() => {
    audio.playTap();
    game.setState(prev => ({ ...prev, isTimerRunning: !prev.isTimerRunning }));
  }, [game, audio]);

  // Interaction Handlers
  const handleInteractionStartA = useCallback(() => setInteractingTeam('A'), []);
  const handleInteractionStartB = useCallback(() => setInteractingTeam('B'), []);
  const handleInteractionEnd = useCallback(() => setInteractingTeam(null), []);
  
  // --- UPDATED HANDLERS FOR SCOUT MODE & AUDIO ---
  // Ensure we pass a metadata object if playerId exists
  const handleAddA = useCallback((teamId: TeamId, playerId?: string, skill?: any) => {
    const metadata = playerId ? { playerId, skill: skill as SkillType } : undefined;
    
    // Play sound BEFORE state update for responsiveness, unless scout modal handles it
    if (!playerId && !state.config.enablePlayerStats) {
         audio.playScore(); 
    }
    
    addPoint('A', metadata);
  }, [addPoint, state.config.enablePlayerStats, audio]);

  const handleSubA = useCallback(() => {
    audio.playUndo();
    subtractPoint('A');
  }, [subtractPoint, audio]);

  const handleAddB = useCallback((teamId: TeamId, playerId?: string, skill?: any) => {
    const metadata = playerId ? { playerId, skill: skill as SkillType } : undefined;
    if (!playerId && !state.config.enablePlayerStats) {
         audio.playScore(); 
    }
    addPoint('B', metadata);
  }, [addPoint, state.config.enablePlayerStats, audio]);
  
  const handleSubB = useCallback(() => {
    audio.playUndo();
    subtractPoint('B');
  }, [subtractPoint, audio]);
  
  const handleSetServerA = useCallback(() => { audio.playTap(); setServer('A'); }, [setServer, audio]);
  const handleSetServerB = useCallback(() => { audio.playTap(); setServer('B'); }, [setServer, audio]);
  
  const handleTimeoutA = useCallback(() => { audio.playWhistle(); useTimeout('A'); }, [useTimeout, audio]);
  const handleTimeoutB = useCallback(() => { audio.playWhistle(); useTimeout('B'); }, [useTimeout, audio]);

  // Modal Open Wrappers with Sound
  const openSettings = () => { audio.playTap(); setShowSettings(true); };
  const openManager = () => { audio.playTap(); setShowManager(true); };
  const openHistory = () => { audio.playTap(); setShowHistory(true); };
  const openReset = () => { audio.playTap(); setShowResetConfirm(true); };
  const toggleSwap = () => { audio.playTap(); toggleSides(); };

  if (!isLoaded) return <div className="h-screen flex items-center justify-center text-slate-500 font-inter">{t('app.loading')}</div>;

  const setsLeft = state.swappedSides ? state.setsB : state.setsA;
  const setsRight = state.swappedSides ? state.setsA : state.setsB;
  const colorLeft = state.swappedSides ? 'rose' : 'indigo';
  const colorRight = state.swappedSides ? 'indigo' : 'rose';
  
  return (
    <ErrorBoundary>
      <LayoutProvider>
        <div className="flex flex-col h-[100dvh] bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-slate-100 overflow-hidden relative">
          
          <BackgroundGlow 
            isSwapped={state.swappedSides} 
            isFullscreen={isFullscreen} 
          />

          <SuddenDeathOverlay active={state.inSuddenDeath} />
          
          {/* PWA Update & Offline Notifier */}
          <ReloadPrompt />

          {/* Beach Mode Switch Alert Overlay */}
          <AnimatePresence>
             {state.pendingSideSwitch && (
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={toggleSwap} // Clicking anywhere swaps
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

          {/* History Bar */}
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
                    teamNameA={state.swappedSides ? state.teamBName : state.teamAName}
                    teamNameB={state.swappedSides ? state.teamAName : state.teamBName}
                    colorA={colorLeft}
                    colorB={colorRight}
                    isServingLeft={state.swappedSides ? state.servingTeam === 'B' : state.servingTeam === 'A'}
                    isServingRight={state.swappedSides ? state.servingTeam === 'A' : state.servingTeam === 'B'}
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
                          team={state.teamARoster} 
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
                          reverseLayout={state.swappedSides}
                          scoreRefCallback={setScoreElA}
                          alignment={state.swappedSides ? 'right' : 'left'}
                          config={state.config} 
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
                          colorTheme="rose"
                          isLocked={interactingTeam !== null && interactingTeam !== 'B'}
                          onInteractionStart={handleInteractionStartB}
                          onInteractionEnd={handleInteractionEnd}
                          reverseLayout={state.swappedSides}
                          scoreRefCallback={setScoreElB}
                          alignment={state.swappedSides ? 'left' : 'right'}
                          config={state.config} 
                      />
                    </>
                 ) : (
                    <LayoutGroup>
                      {/* Team A Wrapper */}
                      <motion.div 
                        layout 
                        key="card-wrapper-A"
                        className={`flex-1 w-full h-full flex flex-col ${state.swappedSides ? 'order-last' : 'order-first'}`}
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
                            config={state.config} 
                        />
                      </motion.div>

                      {/* Team B Wrapper */}
                      <motion.div 
                        layout 
                        key="card-wrapper-B"
                        className={`flex-1 w-full h-full flex flex-col ${state.swappedSides ? 'order-first' : 'order-last'}`}
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
                flex-none w-full z-50 flex justify-center pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4
                transition-all duration-500 overflow-hidden
                ${isFullscreen ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-40 opacity-100 pointer-events-auto'}
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
                onMenu={() => { audio.playTap(); setShowFullscreenMenu(true); }}
            />
          )}

          <FullscreenMenuDrawer 
             isOpen={showFullscreenMenu}
             onClose={() => setShowFullscreenMenu(false)}
             onOpenSettings={openSettings}
             onOpenRoster={openManager}
             onOpenHistory={openHistory}
             onExitFullscreen={toggleFullscreen}
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
