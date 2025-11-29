import React, { useState, useEffect, lazy, Suspense } from 'react';
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

// Lazy Loaded Heavy Modals
const SettingsModal = lazy(() => import('./components/modals/SettingsModal').then(module => ({ default: module.SettingsModal })));
const TeamManagerModal = lazy(() => import('./components/modals/TeamManagerModal').then(module => ({ default: module.TeamManagerModal })));
const MatchOverModal = lazy(() => import('./components/modals/MatchOverModal').then(module => ({ default: module.MatchOverModal })));
const ConfirmationModal = lazy(() => import('./components/modals/ConfirmationModal').then(module => ({ default: module.ConfirmationModal })));

function App() {
  const game = useVolleyGame();
  const { state, setState, isLoaded } = game;
  const { t } = useTranslation();
  
  const pwa = usePWAInstallPrompt();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFullscreenMenu, setShowFullscreenMenu] = useState(false);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [interactingTeam, setInteractingTeam] = useState<TeamId | null>(null);

  // Refs for HUD Measurement (Passed down to ScoreCards)
  const [scoreElA, setScoreElA] = useState<HTMLElement | null>(null);
  const [scoreElB, setScoreElB] = useState<HTMLElement | null>(null);

  // Determine which visual element corresponds to which logic based on swap
  const isSwapped = state.swappedSides;
  const visualLeftScoreEl = isSwapped ? scoreElB : scoreElA;
  const visualRightScoreEl = isSwapped ? scoreElA : scoreElB;

  // Force re-measure trigger on swap
  const [layoutVersion, setLayoutVersion] = useState(0);
  useEffect(() => {
    // Small delay to allow DOM transition to settle
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

  const toggleTimer = () => {
    setState(prev => ({ ...prev, isTimerRunning: !prev.isTimerRunning }));
  };

  if (!isLoaded) return <div className="h-screen flex items-center justify-center text-slate-500 font-inter">{t('app.loading')}</div>;

  // Prop Calculation for Display
  const setsLeft = isSwapped ? state.setsB : state.setsA;
  const setsRight = isSwapped ? state.setsA : state.setsB;
  const colorLeft = isSwapped ? 'rose' : 'indigo';
  const colorRight = isSwapped ? 'indigo' : 'rose';
  
  return (
    <ErrorBoundary>
      <LayoutProvider>
        <div className="flex flex-col h-[100dvh] bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-slate-100 overflow-hidden relative">
          
          {/* Background - Fixed to cover entire viewport including safe areas */}
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden will-change-transform">
            <div className={`
                absolute -top-[20%] -left-[20%] w-[80vw] h-[80vw] blur-[120px] rounded-full mix-blend-screen opacity-60 animate-pulse duration-[4000ms] transition-colors duration-1000
                ${isSwapped ? 'bg-rose-600/20' : 'bg-indigo-600/20'}
            `}></div>
            <div className={`
                absolute -bottom-[20%] -right-[20%] w-[80vw] h-[80vw] blur-[120px] rounded-full mix-blend-screen opacity-60 animate-pulse duration-[5000ms] transition-colors duration-1000
                ${isSwapped ? 'bg-indigo-600/20' : 'bg-rose-600/20'}
            `}></div>
          </div>

          {/* Normal Mode History Bar */}
          <div className={`
              z-30 transition-all duration-500 flex-none
              ${isFullscreen 
                ? '-translate-y-24 opacity-0 pointer-events-none absolute w-full' 
                : 'relative pt-[env(safe-area-inset-top)] pl-[calc(1rem+env(safe-area-inset-left))] pr-[calc(1rem+env(safe-area-inset-right))] pb-2 mt-2'}
          `}>
            <HistoryBar 
              history={state.history} 
              duration={state.matchDurationSeconds} 
              setsA={state.setsA}
              setsB={state.setsB}
            />
          </div>
          
          {/* Fullscreen Floating Elements */}
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
                    onSetServerA={isSwapped ? () => game.setServer('B') : () => game.setServer('A')}
                    onSetServerB={isSwapped ? () => game.setServer('A') : () => game.setServer('B')}
                    timeoutsA={isSwapped ? state.timeoutsB : state.timeoutsA}
                    timeoutsB={isSwapped ? state.timeoutsA : state.timeoutsB}
                    onTimeoutA={isSwapped ? () => game.useTimeout('B') : () => game.useTimeout('A')}
                    onTimeoutB={isSwapped ? () => game.useTimeout('A') : () => game.useTimeout('B')}
                    // Status Passing
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

          {/* Main Content Area */}
          <main className={`
              transition-all duration-500 min-h-0 overflow-visible
              ${isFullscreen 
                 ? 'fixed inset-0 z-10 w-screen h-screen p-0 border-none m-0 block' 
                 : 'relative flex-1 z-10 flex flex-col landscape:flex-row md:flex-row pb-28 landscape:pb-20 pt-2 md:pb-32 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]'
              }
          `}>
             
             {isFullscreen ? (
                <>
                  <ScoreCardFullscreen 
                      teamId="A"
                      score={state.scoreA}
                      isServing={state.servingTeam === 'A'}
                      onAdd={() => game.addPoint('A')}
                      onSubtract={() => game.subtractPoint('A')} 
                      isMatchPoint={game.isMatchPointA}
                      isSetPoint={game.isSetPointA}
                      isDeuce={game.isDeuce}
                      inSuddenDeath={state.inSuddenDeath}
                      colorTheme="indigo"
                      isLocked={interactingTeam !== null && interactingTeam !== 'A'}
                      onInteractionStart={() => setInteractingTeam('A')}
                      onInteractionEnd={() => setInteractingTeam(null)}
                      reverseLayout={isSwapped}
                      scoreRefCallback={setScoreElA}
                      // Alignment logic based on swapping to keep center clean
                      alignment={isSwapped ? 'right' : 'left'}
                  />
                  <ScoreCardFullscreen
                      teamId="B"
                      score={state.scoreB}
                      isServing={state.servingTeam === 'B'}
                      onAdd={() => game.addPoint('B')}
                      onSubtract={() => game.subtractPoint('B')} 
                      isMatchPoint={game.isMatchPointB}
                      isSetPoint={game.isSetPointB}
                      isDeuce={game.isDeuce}
                      inSuddenDeath={state.inSuddenDeath}
                      colorTheme="rose"
                      isLocked={interactingTeam !== null && interactingTeam !== 'B'}
                      onInteractionStart={() => setInteractingTeam('B')}
                      onInteractionEnd={() => setInteractingTeam(null)}
                      reverseLayout={isSwapped}
                      scoreRefCallback={setScoreElB}
                      // Alignment logic based on swapping to keep center clean
                      alignment={isSwapped ? 'left' : 'right'}
                  />
                </>
             ) : (
                <>
                  <ScoreCardNormal
                      teamId="A"
                      team={state.teamARoster}
                      score={state.scoreA}
                      setsWon={state.setsA}
                      isServing={state.servingTeam === 'A'}
                      onAdd={() => game.addPoint('A')}
                      onSubtract={() => game.subtractPoint('A')}
                      onSetServer={() => game.setServer('A')}
                      timeouts={state.timeoutsA}
                      onTimeout={() => game.useTimeout('A')}
                      isMatchPoint={game.isMatchPointA}
                      isSetPoint={game.isSetPointA}
                      isDeuce={game.isDeuce}
                      inSuddenDeath={state.inSuddenDeath}
                      reverseLayout={isSwapped}
                      setsNeededToWin={game.setsNeededToWin}
                      colorTheme="indigo"
                      isLocked={interactingTeam !== null && interactingTeam !== 'A'}
                      onInteractionStart={() => setInteractingTeam('A')}
                      onInteractionEnd={() => setInteractingTeam(null)}
                  />
                  <ScoreCardNormal
                      teamId="B"
                      team={state.teamBRoster}
                      score={state.scoreB}
                      setsWon={state.setsB}
                      isServing={state.servingTeam === 'B'}
                      onAdd={() => game.addPoint('B')}
                      onSubtract={() => game.subtractPoint('B')}
                      onSetServer={() => game.setServer('B')}
                      timeouts={state.timeoutsB}
                      onTimeout={() => game.useTimeout('B')}
                      isMatchPoint={game.isMatchPointB}
                      isSetPoint={game.isSetPointB}
                      isDeuce={game.isDeuce}
                      inSuddenDeath={state.inSuddenDeath}
                      reverseLayout={isSwapped}
                      setsNeededToWin={game.setsNeededToWin}
                      colorTheme="rose"
                      isLocked={interactingTeam !== null && interactingTeam !== 'B'}
                      onInteractionStart={() => setInteractingTeam('B')}
                      onInteractionEnd={() => setInteractingTeam(null)}
                  />
                </>
             )}

             {isFullscreen && (
                 <button 
                    onClick={toggleFullscreen}
                    className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-[60] p-3 rounded-full bg-black/20 text-white/30 hover:text-white hover:bg-black/60 backdrop-blur-md border border-white/5 transition-all active:scale-95"
                 >
                     <Minimize2 size={24} />
                 </button>
             )}
          </main>

          {/* Standard Bottom Controls */}
          <div 
            className={`
                fixed bottom-0 left-0 w-full z-50 flex justify-center pb-[calc(env(safe-area-inset-bottom)+1.5rem)] 
                transition-all duration-500
                ${isFullscreen ? 'translate-y-32 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'}
                pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]
            `}
          >
              <Controls 
                  onUndo={game.undo}
                  canUndo={game.canUndo}
                  onSwap={game.toggleSides}
                  onSettings={() => setShowSettings(true)}
                  onRoster={() => setShowManager(true)}
                  onReset={() => setShowResetConfirm(true)}
                  onToggleFullscreen={toggleFullscreen}
              />
          </div>

          {/* Floating Control Bar */}
          {isFullscreen && (
            <FloatingControlBar 
                onUndo={game.undo}
                canUndo={game.canUndo}
                onSwap={game.toggleSides}
                onReset={() => setShowResetConfirm(true)}
                onMenu={() => setShowFullscreenMenu(true)}
            />
          )}

          <FullscreenMenuDrawer 
             isOpen={showFullscreenMenu}
             onClose={() => setShowFullscreenMenu(false)}
             onOpenSettings={() => setShowSettings(true)}
             onOpenRoster={() => setShowManager(true)}
             onExitFullscreen={exitFullscreenMode}
          />

          {/* Lazy Loaded Modals wrapped in Suspense */}
          <Suspense fallback={null}>
            {showSettings && (
              <SettingsModal 
                isOpen={showSettings} 
                onClose={() => setShowSettings(false)}
                config={state.config}
                onSave={game.applySettings}
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
                onGenerate={game.generateTeams}
                onToggleFixed={game.togglePlayerFixed}
                onRemove={game.removePlayer}
                onMove={game.movePlayer}
                onUpdateTeamName={game.updateTeamName}
                onUpdatePlayerName={game.updatePlayerName}
                onAddPlayer={game.addPlayer}
                onUndoRemove={game.undoRemovePlayer}
                canUndoRemove={game.hasDeletedPlayers}
                onCommitDeletions={game.commitDeletions}
                deletedCount={game.deletedCount}
              />
            )}

            {state.isMatchOver && (
              <MatchOverModal 
                isOpen={state.isMatchOver}
                state={state}
                onRotate={game.rotateTeams}
                onClose={() => {}}
              />
            )}

            {showResetConfirm && (
              <ConfirmationModal 
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={game.resetMatch}
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