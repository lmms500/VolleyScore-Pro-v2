import React, { useState, useEffect } from 'react';
import { useVolleyGame } from './hooks/useVolleyGame';
import { usePWAInstallPrompt } from './hooks/usePWAInstallPrompt';
import { ScoreCardNormal } from './components/ScoreCardNormal';
import { ScoreCardFullscreen } from './components/ScoreCardFullscreen';
import { HistoryBar } from './components/HistoryBar';
import { Controls } from './components/Controls';
import { FullscreenHUD } from './components/FullscreenHUD';
import { SettingsModal } from './components/modals/SettingsModal';
import { TeamManagerModal } from './components/modals/TeamManagerModal';
import { MatchOverModal } from './components/modals/MatchOverModal';
import { ConfirmationModal } from './components/modals/ConfirmationModal';
import { Minimize2 } from 'lucide-react';
import { TeamId } from './types';

function App() {
  const game = useVolleyGame();
  const { state, isLoaded } = game;
  
  // PWA Hook
  const pwa = usePWAInstallPrompt();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // State to track which scorecard is currently being interacted with (Mutex lock)
  const [interactingTeam, setInteractingTeam] = useState<TeamId | null>(null);

  // Handle native fullscreen toggle if desired (optional, purely UI driven for now)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((e) => {
            console.log("Fullscreen not supported/allowed", e);
        });
        setIsFullscreen(true);
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        setIsFullscreen(false);
    }
  };

  // Listen to fullscreen changes (ESC key, etc)
  useEffect(() => {
      const handleChange = () => {
          setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleChange);
      return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  if (!isLoaded) return <div className="h-screen flex items-center justify-center text-slate-500 font-inter">Loading...</div>;

  const isSwapped = state.swappedSides;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#020617] text-slate-100 overflow-hidden relative">
      
      {/* Background Spotlights - Dynamic based on Swap State */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Top Left Spotlight (Defaults to Team A/Indigo) */}
        <div className={`
            absolute -top-[20%] -left-[20%] w-[80vw] h-[80vw] blur-[120px] rounded-full mix-blend-screen opacity-60 animate-pulse duration-[4000ms] transition-colors duration-1000
            ${isSwapped ? 'bg-rose-600/20' : 'bg-indigo-600/20'}
        `}></div>
        
        {/* Bottom Right Spotlight (Defaults to Team B/Rose) */}
        <div className={`
            absolute -bottom-[20%] -right-[20%] w-[80vw] h-[80vw] blur-[120px] rounded-full mix-blend-screen opacity-60 animate-pulse duration-[5000ms] transition-colors duration-1000
            ${isSwapped ? 'bg-indigo-600/20' : 'bg-rose-600/20'}
        `}></div>
      </div>

      {/* Top Bar - Floating Glass (Hidden in Fullscreen) */}
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

      {/* FULLSCREEN HUD (The Central Glass Hub) */}
      {isFullscreen && (
          <FullscreenHUD 
            setsA={state.setsA}
            setsB={state.setsB}
            time={state.matchDurationSeconds}
            currentSet={state.currentSet}
            isTieBreak={game.isTieBreak}
            isDeuce={game.isDeuce}
            onUndo={game.undo}
            canUndo={game.canUndo}
            onSwap={game.toggleSides}
            onReset={() => setShowResetConfirm(true)}
            onSettings={() => setShowSettings(true)}
            onRoster={() => setShowManager(true)}
            timeoutsA={state.timeoutsA}
            timeoutsB={state.timeoutsB}
            onTimeoutA={() => game.useTimeout('A')}
            onTimeoutB={() => game.useTimeout('B')}
          />
      )}

      {/* Main Game Area */}
      <main className={`
          flex-1 flex relative z-10 transition-all duration-500 min-h-0 overflow-visible
          flex-col landscape:flex-row md:flex-row
          ${isFullscreen ? 'p-0' : 'pb-28 landscape:pb-20 pt-2 md:pb-32'}
      `}>
         
         {isFullscreen ? (
            <ScoreCardFullscreen 
                teamId="A"
                team={state.teamARoster}
                score={state.scoreA}
                isServing={state.servingTeam === 'A'}
                onAdd={() => game.addPoint('A')}
                onSubtract={() => game.subtractPoint('A')}
                onToggleServe={() => game.toggleService()}
                timeouts={state.timeoutsA}
                onTimeout={() => game.useTimeout('A')}
                isMatchPoint={game.isMatchPointA}
                isSetPoint={game.isSetPointA}
                isDeuce={game.isDeuce}
                inSuddenDeath={game.state.inSuddenDeath}
                colorTheme="indigo"
                isLocked={interactingTeam !== null && interactingTeam !== 'A'}
                onInteractionStart={() => setInteractingTeam('A')}
                onInteractionEnd={() => setInteractingTeam(null)}
                reverseLayout={state.swappedSides}
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
                inSuddenDeath={game.state.inSuddenDeath}
                reverseLayout={state.swappedSides}
                setsNeededToWin={game.setsNeededToWin}
                colorTheme="indigo"
                isLocked={interactingTeam !== null && interactingTeam !== 'A'}
                onInteractionStart={() => setInteractingTeam('A')}
                onInteractionEnd={() => setInteractingTeam(null)}
            />
         )}

         {/* Spacer */}
         <div className={`
            flex-shrink-0 transition-all duration-500
            ${isFullscreen 
                ? 'h-0 w-0 landscape:w-32 landscape:h-full md:w-32' // Gap for HUD in landscape 
                : 'w-px h-2 landscape:h-px landscape:w-4 md:w-8'}
         `}></div>

         {isFullscreen ? (
            <ScoreCardFullscreen
                teamId="B"
                team={state.teamBRoster}
                score={state.scoreB}
                isServing={state.servingTeam === 'B'}
                onAdd={() => game.addPoint('B')}
                onSubtract={() => game.subtractPoint('B')}
                onToggleServe={() => game.toggleService()}
                timeouts={state.timeoutsB}
                onTimeout={() => game.useTimeout('B')}
                isMatchPoint={game.isMatchPointB}
                isSetPoint={game.isSetPointB}
                isDeuce={game.isDeuce}
                inSuddenDeath={game.state.inSuddenDeath}
                colorTheme="rose"
                isLocked={interactingTeam !== null && interactingTeam !== 'B'}
                onInteractionStart={() => setInteractingTeam('B')}
                onInteractionEnd={() => setInteractingTeam(null)}
                reverseLayout={state.swappedSides}
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
                inSuddenDeath={game.state.inSuddenDeath}
                reverseLayout={state.swappedSides}
                setsNeededToWin={game.setsNeededToWin}
                colorTheme="rose"
                isLocked={interactingTeam !== null && interactingTeam !== 'B'}
                onInteractionStart={() => setInteractingTeam('B')}
                onInteractionEnd={() => setInteractingTeam(null)}
            />
         )}

         {/* Exit Fullscreen Button Floating */}
         {isFullscreen && (
             <button 
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 z-50 p-3 rounded-full bg-black/20 text-white/30 hover:text-white hover:bg-black/60 backdrop-blur-md border border-white/5 transition-all"
             >
                 <Minimize2 size={24} />
             </button>
         )}

      </main>

      {/* Floating Controls Dock Container */}
      <div 
        className={`
            fixed bottom-0 left-0 w-full z-50 flex justify-center pb-6 
            transition-all duration-500 pointer-events-none
            ${isFullscreen ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}
        `}
      >
        <div className={isFullscreen ? 'pointer-events-none' : 'pointer-events-auto'}>
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
      </div>

      {/* Modals */}
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
        onClose={() => { /* Prevent closing without decision */ }}
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