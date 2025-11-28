import React, { useState, useEffect, Ref } from 'react';
import { useVolleyGame } from './hooks/useVolleyGame';
import { usePWAInstallPrompt } from './hooks/usePWAInstallPrompt';
import { ScoreCardNormal } from './components/ScoreCardNormal';
import { ScoreCardFullscreen } from './components/ScoreCardFullscreen';
import { HistoryBar } from './components/HistoryBar';
import { Controls } from './components/Controls';
import { SettingsModal } from './components/modals/SettingsModal';
import { TeamManagerModal } from './components/modals/TeamManagerModal';
import { MatchOverModal } from './components/modals/MatchOverModal';
import { ConfirmationModal } from './components/modals/ConfirmationModal';
import { Minimize2 } from 'lucide-react';
import { TeamId } from './types';

import { useHudMeasure } from './hooks/useHudMeasure';
import { MeasuredFullscreenHUD } from './components/MeasuredFullscreenHUD';
import { useTranslation } from './contexts/LanguageContext';
import { FloatingControlBar } from './components/Fullscreen/FloatingControlBar';
import { FloatingTopBar } from './components/Fullscreen/FloatingTopBar';
import { FullscreenMenuDrawer } from './components/Fullscreen/FullscreenMenuDrawer';

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

  const [leftScoreNode, setLeftScoreNode] = useState<HTMLSpanElement | null>(null);
  const [rightScoreNode, setRightScoreNode] = useState<HTMLSpanElement | null>(null);
  const [bottomAnchorNode, setBottomAnchorNode] = useState<HTMLHeadingElement | null>(null);

  const hudPlacement = useHudMeasure({
    leftScoreEl: leftScoreNode,
    rightScoreEl: rightScoreNode,
    bottomAnchorEl: bottomAnchorNode,
    enabled: isFullscreen,
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

  // Timer Toggle Logic
  const toggleTimer = () => {
    setState(prev => ({ ...prev, isTimerRunning: !prev.isTimerRunning }));
  };

  if (!isLoaded) return <div className="h-screen flex items-center justify-center text-slate-500 font-inter">{t('app.loading')}</div>;

  const isSwapped = state.swappedSides;
  
  const refA: Ref<HTMLSpanElement> = isSwapped ? setRightScoreNode : setLeftScoreNode;
  const refB: Ref<HTMLSpanElement> = isSwapped ? setLeftScoreNode : setRightScoreNode;
  const bottomAnchorForB: Ref<HTMLHeadingElement> | undefined = isSwapped ? undefined : setBottomAnchorNode;

  // Visual Props Calculation for HUD (Swap Handling)
  const setsLeft = isSwapped ? state.setsB : state.setsA;
  const setsRight = isSwapped ? state.setsA : state.setsB;
  const timeoutsLeft = isSwapped ? state.timeoutsB : state.timeoutsA;
  const timeoutsRight = isSwapped ? state.timeoutsA : state.timeoutsB;
  const onTimeoutLeft = isSwapped ? () => game.useTimeout('B') : () => game.useTimeout('A');
  const onTimeoutRight = isSwapped ? () => game.useTimeout('A') : () => game.useTimeout('B');
  const colorLeft = isSwapped ? 'rose' : 'indigo';
  const colorRight = isSwapped ? 'indigo' : 'rose';

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-slate-100 overflow-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`
            absolute -top-[20%] -left-[20%] w-[80vw] h-[80vw] blur-[120px] rounded-full mix-blend-screen opacity-60 animate-pulse duration-[4000ms] transition-colors duration-1000
            ${isSwapped ? 'bg-rose-600/20' : 'bg-indigo-600/20'}
        `}></div>
        <div className={`
            absolute -bottom-[20%] -right-[20%] w-[80vw] h-[80vw] blur-[120px] rounded-full mix-blend-screen opacity-60 animate-pulse duration-[5000ms] transition-colors duration-1000
            ${isSwapped ? 'bg-indigo-600/20' : 'bg-rose-600/20'}
        `}></div>
      </div>

      <div className={`
          z-30 transition-all duration-500 flex-none
          ${isFullscreen 
            ? '-translate-y-24 opacity-0 pointer-events-none absolute w-full' 
            : 'relative pt-4 px-4 pb-2'}
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
                isDeuce={game.isDeuce}
                onToggleTimer={toggleTimer}
                isTimerRunning={state.isTimerRunning}
                inSuddenDeath={state.inSuddenDeath}
            />

            <MeasuredFullscreenHUD
                placement={hudPlacement}
                setsLeft={setsLeft}
                setsRight={setsRight}
                timeoutsLeft={timeoutsLeft}
                timeoutsRight={timeoutsRight}
                onTimeoutLeft={onTimeoutLeft}
                onTimeoutRight={onTimeoutRight}
                colorLeft={colorLeft}
                colorRight={colorRight}
            />
          </>
      )}

      <main className={`
          flex-1 flex relative z-10 transition-all duration-500 min-h-0 overflow-visible
          flex-col landscape:flex-row md:flex-row
          ${isFullscreen ? 'p-0' : 'pb-28 landscape:pb-20 pt-2 md:pb-32'}
      `}>
         
         {isFullscreen ? (
            <ScoreCardFullscreen 
                scoreRef={refA}
                teamId="A"
                team={state.teamARoster}
                score={state.scoreA}
                isServing={state.servingTeam === 'A'}
                onAdd={() => game.addPoint('A')}
                onSubtract={() => game.undo()} 
                onToggleServe={() => game.toggleService()}
                timeouts={state.timeoutsA}
                onTimeout={() => game.useTimeout('A')}
                isMatchPoint={game.isMatchPointA}
                isSetPoint={game.isSetPointA}
                isDeuce={game.isDeuce}
                inSuddenDeath={state.inSuddenDeath}
                colorTheme="indigo"
                isLocked={interactingTeam !== null && interactingTeam !== 'A'}
                onInteractionStart={() => setInteractingTeam('A')}
                onInteractionEnd={() => setInteractingTeam(null)}
                reverseLayout={isSwapped}
            />
         ) : (
            <ScoreCardNormal
                teamId="A"
                team={state.teamARoster}
                score={state.scoreA}
                setsWon={state.setsA}
                isServing={state.servingTeam === 'A'}
                onAdd={() => game.addPoint('A')}
                onSubtract={() => game.subtractPoint('A')}
                onToggleServe={() => game.toggleService()}
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
         )}

         {isFullscreen ? (
            <ScoreCardFullscreen
                scoreRef={refB}
                bottomAnchorRef={bottomAnchorForB}
                teamId="B"
                team={state.teamBRoster}
                score={state.scoreB}
                isServing={state.servingTeam === 'B'}
                onAdd={() => game.addPoint('B')}
                onSubtract={() => game.undo()} 
                onToggleServe={() => game.toggleService()}
                timeouts={state.timeoutsB}
                onTimeout={() => game.useTimeout('B')}
                isMatchPoint={game.isMatchPointB}
                isSetPoint={game.isSetPointB}
                isDeuce={game.isDeuce}
                inSuddenDeath={state.inSuddenDeath}
                colorTheme="rose"
                isLocked={interactingTeam !== null && interactingTeam !== 'B'}
                onInteractionStart={() => setInteractingTeam('B')}
                onInteractionEnd={() => setInteractingTeam(null)}
                reverseLayout={isSwapped}
            />
         ) : (
            <ScoreCardNormal
                teamId="B"
                team={state.teamBRoster}
                score={state.scoreB}
                setsWon={state.setsB}
                isServing={state.servingTeam === 'B'}
                onAdd={() => game.addPoint('B')}
                onSubtract={() => game.subtractPoint('B')}
                onToggleServe={() => game.toggleService()}
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
         )}

         {isFullscreen && (
             <button 
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 z-[60] p-3 rounded-full bg-black/20 text-white/30 hover:text-white hover:bg-black/60 backdrop-blur-md border border-white/5 transition-all active:scale-95"
             >
                 <Minimize2 size={24} />
             </button>
         )}
      </main>

      {/* Standard Bottom Controls (Only visible in Normal Mode) */}
      <div 
        className={`
            fixed bottom-0 left-0 w-full z-50 flex justify-center pb-6 
            transition-all duration-500
            ${isFullscreen ? 'translate-y-32 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'}
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

      {/* Floating Control Bar (Only visible in Fullscreen) */}
      {isFullscreen && (
        <FloatingControlBar 
            onUndo={game.undo}
            canUndo={game.canUndo}
            onSwap={game.toggleSides}
            onReset={() => setShowResetConfirm(true)}
            onMenu={() => setShowFullscreenMenu(true)}
        />
      )}

      {/* Fullscreen Drawer */}
      <FullscreenMenuDrawer 
         isOpen={showFullscreenMenu}
         onClose={() => setShowFullscreenMenu(false)}
         onOpenSettings={() => setShowSettings(true)}
         onOpenRoster={() => setShowManager(true)}
         onExitFullscreen={exitFullscreenMode}
      />

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        config={state.config}
        teamAName={state.teamAName}
        teamBName={state.teamBName}
        onSave={game.applySettings}
        onInstall={pwa.promptInstall}
        canInstall={pwa.isInstallable}
        isIOS={pwa.isIOS}
        isStandalone={pwa.isStandalone}
      />

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
        onAddPlayer={game.addPlayer}
        onUndoRemove={game.undoRemovePlayer}
        canUndoRemove={game.hasDeletedPlayers}
      />

      <MatchOverModal 
        isOpen={state.isMatchOver}
        state={state}
        onRotate={game.rotateTeams}
        onClose={() => {}}
      />

      <ConfirmationModal 
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={game.resetMatch}
        title="Reset Match?"
        message="Are you sure you want to reset the match? All scores and history will be lost."
      />
    </div>
  );
}

export default App;