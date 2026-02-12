
import React, { useEffect } from 'react';
import { Phase, GameMode } from './types';
import { addLog } from './utils/core';
import { createFieldCard } from './utils/rules';
import { RotateCcw, Play, Edit3, Trash2, GraduationCap } from 'lucide-react';
import { sortHand } from './utils/cards';

// Imported Components
import { CoinFlipOverlay } from './components/overlays/CoinFlipOverlay';
import { TurnChangeOverlay } from './components/overlays/TurnChangeOverlay';
import { TutorialOverlay } from './components/overlays/TutorialOverlay';
import { Confetti, Explosion, DamageOverlay } from './components/effects/VisualEffects';
import { Flyer, SpecialCardAnimation, SoulOrb } from './components/effects/GameAnimations';
import { MainMenu } from './components/screens/MainMenu';
import { MainMenuBackground } from './components/effects/MainMenuBackground';
import { SandboxTools } from './components/tools/SandboxTools';
import { EndTurnModal, ResignModal, QuitModal, PauseMenu } from './components/modals/GameModals';
import { DiscardModal } from './components/modals/DiscardModal';
import { MobileLayout } from './components/game/MobileLayout';
import { DesktopLayout } from './components/game/DesktopLayout';

// Hooks
import { useGameRefs } from './hooks/useGameRefs';
import { useGameEffects } from './hooks/useGameEffects';
import { useGameUI } from './hooks/useGameUI';
import { useGameState } from './hooks/useGameState';
import { useTutorial } from './hooks/useTutorial';
import { useGameAI } from './hooks/useGameAI';
import { useGameInteractions } from './hooks/useGameInteractions';

export const App: React.FC = () => {
  const refs = useGameRefs();
  const effects = useGameEffects();
  const ui = useGameUI();
  
  const { 
    gameState, setGameState, gameStateRef,
    startGame, drawCards, playCard, advancePhase, 
    performEndTurn, confirmAttack, confirmBlocks, 
    isDrawingInitialRef, getActiveDecisionPlayerId 
  } = useGameState({ effects, refs, autoSort: ui.autoSort });

  const { advanceTutorialStep, handleTutorialNext, isInteractionAllowed, handleGlobalClick } = useTutorial({
      gameState,
      setGameState,
      gameStateRef,
      performEndTurn,
      confirmBlocks
  });

  const interactions = useGameInteractions(gameState, {
      setGameState,
      gameStateRef,
      getActiveDecisionPlayerId,
      drawCards,
      playCard,
      advancePhase,
      confirmAttack,
      confirmBlocks
  }, effects, {
      isInteractionAllowed,
      advanceTutorialStep
  }, ui, refs);

  // Initialize AI Hook
  useGameAI({
      gameState,
      gameStateRef,
      actions: {
          setGameState,
          advancePhase,
          performEndTurn,
          playCard,
          confirmAttack,
          confirmBlocks,
          handleCardClick: interactions.handleCardClick,
          handleConfirmInitSelection: interactions.handleConfirmInitSelection,
          getActiveDecisionPlayerId
      },
      isCoinFlipping: ui.isCoinFlipping,
      showMenu: ui.showMenu,
      showTurnAnim: effects.showTurnAnim
  });

  // --- Handlers wrapping UI logic ---
  const handleModeSelect = (mode: GameMode) => {
      if (mode === 'SANDBOX') { startGame('SANDBOX', { p1: false, p2: false }); } 
      else if (mode === 'TUTORIAL') { ui.setMenuStep('TUTORIAL_MENU'); }
      else { ui.setSelectedMode(mode); ui.setMenuStep('PLAYERS'); }
  };
  
  const startLesson = (lessonId: string) => { startGame('TUTORIAL', { p1: false, p2: true }, lessonId); };
  const handleStartGameClick = (isCpu: boolean) => { if (ui.selectedMode) startGame(ui.selectedMode, { p1: false, p2: isCpu }); };
  const handleSpectateClick = () => { if (ui.selectedMode) startGame(ui.selectedMode, { p1: true, p2: true }); };

  const handleQuitToTitle = () => {
      const isTutorial = gameState?.mode === 'TUTORIAL';
      setGameState(null);
      ui.resetModals();
      ui.setMenuStep(isTutorial ? 'TUTORIAL_MENU' : 'MODE');
  };

  const handleResign = () => {
      if (!gameState) return;
      setGameState(prev => {
          if(!prev) return null;
          const activePid = getActiveDecisionPlayerId(prev);
          const opponentId = activePid === 0 ? 1 : 0;
          return { ...prev, winner: opponentId, phase: Phase.GAME_OVER, logs: addLog(prev, `${prev.players[activePid].name} resigned.`) };
      });
      ui.resetModals();
  };

  const executeCardAction = (action: 'TAP' | 'DELETE') => {
      if (!ui.cardActionTarget) return;
      setGameState(prev => {
          if(!prev) return null;
          const nextState = { ...prev, players: [...prev.players] };
          const p = nextState.players.find(pl => pl.id === ui.cardActionTarget!.ownerId)!;
          if (ui.cardActionTarget!.loc === 'HAND') {
              if (action === 'DELETE') { p.hand = p.hand.filter(c => c.id !== ui.cardActionTarget!.card.id); }
          } else if (ui.cardActionTarget!.loc === 'FIELD') {
              if (action === 'DELETE') { p.field = p.field.filter(c => c.instanceId !== ui.cardActionTarget!.instanceId); } 
              else if (action === 'TAP') { const fc = p.field.find(c => c.instanceId === ui.cardActionTarget!.instanceId); if(fc) fc.isTapped = !fc.isTapped; }
          } else if (ui.cardActionTarget!.loc === 'RESOURCE') {
               if (action === 'DELETE') { p.resources = p.resources.filter(c => c.instanceId !== ui.cardActionTarget!.instanceId); } 
               else if (action === 'TAP') { const fc = p.resources.find(c => c.instanceId === ui.cardActionTarget!.instanceId); if(fc) fc.isTapped = !fc.isTapped; }
          }
          return nextState;
      });
      ui.setCardActionTarget(null);
  };

  const startPlayFromHere = (isCpu: boolean) => {
      setGameState(prev => {
          if(!prev) return null;
          return { ...prev, mode: 'STREET', phase: Phase.MAIN, isSandboxRun: true, players: prev.players.map(p => p.id === 1 ? { ...p, isCpu } : p) };
      });
      ui.setShowPlaySetup(false); ui.setSandboxToolsOpen(false);
  };

  const returnToSandbox = () => {
      setGameState(prev => {
          if(!prev) return null;
          return { ...prev, mode: 'SANDBOX', isSandboxRun: false, players: prev.players.map(p => p.id === 1 ? { ...p, isCpu: false } : p) };
      });
      ui.setSandboxToolsOpen(true);
  };

  // Initial Draw Effect (Moved logic slightly to ensure it runs once)
  useEffect(() => {
    if (gameState && gameState.mode !== 'SANDBOX' && gameState.mode !== 'TUTORIAL' && gameState.phase === Phase.INIT_SELECT && !ui.isCoinFlipping) {
      if (!isDrawingInitialRef.current) {
        const p1 = gameState.players[0];
        const p2 = gameState.players[1];
        if (p1.hand.length === 0 || p2.hand.length === 0) {
             isDrawingInitialRef.current = true;
             // Add a small delay to ensure refs/layout are stable
             setTimeout(() => {
                 (async () => {
                     await drawCards(0, 8);
                     await drawCards(1, 8);
                     setGameState(prev => prev ? { ...prev, logs: addLog(prev, "Deployment Phase: Select 3 resources.") } : null);
                     isDrawingInitialRef.current = false;
                 })();
             }, 200);
        }
      }
    }
  }, [gameState?.phase, ui.isCoinFlipping, gameState?.mode]);

  if (!gameState) {
      return (
        <div className="relative flex flex-col items-center justify-center h-screen w-full bg-slate-950 overflow-hidden selection:bg-indigo-500/30">
            <MainMenuBackground />
            <MainMenu 
                menuStep={ui.menuStep}
                setMenuStep={ui.setMenuStep}
                handleModeSelect={handleModeSelect}
                handleStartGameClick={handleStartGameClick}
                handleSpectateClick={handleSpectateClick}
                startLesson={startLesson}
            />
        </div>
      );
  }

  const activeDecisionPlayerId = getActiveDecisionPlayerId(gameState);
  const isHotseat = !gameState.players[1].isCpu || gameState.mode === 'SANDBOX';
  const viewPlayerId = isHotseat ? activeDecisionPlayerId : 0; 
  const bottomPlayer = gameState.players[viewPlayerId];
  const topPlayer = gameState.players[viewPlayerId === 0 ? 1 : 0];
  const isPlayerTurn = activeDecisionPlayerId === viewPlayerId;
  const isActivePlayerCpu = gameState.players[activeDecisionPlayerId].isCpu;
  const isInteractive = isPlayerTurn && !isActivePlayerCpu;
  const tutorialComplete = gameState.tutorialState?.completed;

  const gameHandlers = {
      onCardClick: interactions.handleCardClick,
      onDragStart: interactions.handleDragStart,
      onPhaseAction: interactions.handlePhaseAction,
      setViewingDiscard: ui.setViewingDiscard,
      setShowMenu: ui.setShowMenu,
      toggleLog: () => ui.setShowMobileLog(!ui.showMobileLog)
  };

  return (
    <>
    <style>{`
        .lane-physical {
            background-image: repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.3) 2px,
                rgba(0, 0, 0, 0.3) 4px
            );
            background-size: 100% 4px;
        }

        .lane-magical {
            box-shadow: inset 0 0 20px rgba(220, 38, 38, 0.1);
            animation: pulse-magical 4s ease-in-out infinite;
        }

        @keyframes pulse-magical {
            0%, 100% { box-shadow: inset 0 0 20px rgba(220, 38, 38, 0.1); }
            50% { box-shadow: inset 0 0 40px rgba(220, 38, 38, 0.4); }
        }

        @keyframes shake-1 { 0% { transform: translate(0, 0) } 25% { transform: translate(-2px, 2px) } 50% { transform: translate(2px, -2px) } 75% { transform: translate(-2px, -2px) } 100% { transform: translate(0, 0) } }
        @keyframes shake-2 { 0% { transform: translate(0, 0) } 25% { transform: translate(-4px, 4px) } 50% { transform: translate(4px, -4px) } 75% { transform: translate(-4px, -4px) } 100% { transform: translate(0, 0) } }
        @keyframes shake-3 { 0% { transform: translate(0, 0) } 25% { transform: translate(-6px, 6px) } 50% { transform: translate(6px, -6px) } 75% { transform: translate(-6px, -6px) } 100% { transform: translate(0, 0) } }
        @keyframes shake-4 { 0% { transform: translate(0, 0) } 25% { transform: translate(-8px, 8px) } 50% { transform: translate(8px, -8px) } 75% { transform: translate(-8px, -8px) } 100% { transform: translate(0, 0) } }
        .shake-1 { animation: shake-1 0.3s cubic-bezier(.36,.07,.19,.97) both; }
        .shake-2 { animation: shake-2 0.3s cubic-bezier(.36,.07,.19,.97) both; }
        .shake-3 { animation: shake-3 0.3s cubic-bezier(.36,.07,.19,.97) both; }
        .shake-4 { animation: shake-4 0.3s cubic-bezier(.36,.07,.19,.97) both; }
    `}</style>
    <div 
      className={`flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans select-none ${effects.screenShake ? `shake-${effects.screenShake.intensity}` : ''}`} 
      ref={refs.containerRef}
      onMouseMove={(e) => {
          if (interactions.dragState) interactions.setDragState(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
      }}
      onMouseUp={(e) => interactions.handleDrop(e.nativeEvent)}
      onClick={handleGlobalClick}
    >
      {ui.isCoinFlipping && (
           <CoinFlipOverlay 
                p1Name={gameState.players[0].name} 
                p2Name={gameState.players[1].name} 
                onComplete={(winner) => {
                    setGameState(prev => prev ? { ...prev, turnPlayer: winner, startingPlayerId: winner, logs: addLog(prev, `Coin Flip: ${prev.players[winner].name} goes first!`) } : null);
                    ui.setIsCoinFlipping(false);
                }} 
           />
      )}

      {gameState.tutorialState?.active && !tutorialComplete && gameState.tutorialState.steps[gameState.tutorialState.currentStepIndex] && (
          <TutorialOverlay step={gameState.tutorialState.steps[gameState.tutorialState.currentStepIndex]} onNext={handleTutorialNext} />
      )}

      {tutorialComplete && (
          <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-1000 overflow-hidden">
              <Confetti />
              <div className="text-center space-y-6 relative z-[130]">
                  <GraduationCap className="w-24 h-24 mx-auto text-emerald-500 animate-bounce" />
                  <h1 className="text-5xl md:text-7xl font-black font-title text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                      TUTORIAL COMPLETE
                  </h1>
                  <h2 className="text-2xl text-slate-300">You have mastered the basics!</h2>
                  <div className="flex gap-4 justify-center mt-8">
                      <button onClick={handleQuitToTitle} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-xl shadow-lg shadow-emerald-500/30 transform transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                          <RotateCcw size={20} /> Return to Menu
                      </button>
                  </div>
              </div>
          </div>
      )}

      {gameState.isSandboxRun && (
          <div className="absolute top-16 left-4 z-50 animate-in fade-in slide-in-from-top">
              <button onClick={returnToSandbox} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
                  <RotateCcw size={18}/> Return to Sandbox
              </button>
          </div>
      )}

      {ui.showPlaySetup && (
          <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 w-80">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Play size={20} className="text-emerald-400"/> Play Scenario</h3>
                  <div className="space-y-3">
                      <button onClick={() => startPlayFromHere(true)} className="w-full bg-slate-800 hover:bg-emerald-900/30 border border-slate-700 hover:border-emerald-500/50 p-3 rounded text-left font-bold flex items-center gap-2">
                          <Edit3 size={18}/> Vs CPU
                      </button>
                      <button onClick={() => startPlayFromHere(false)} className="w-full bg-slate-800 hover:bg-amber-900/30 border border-slate-700 hover:border-amber-500/50 p-3 rounded text-left font-bold flex items-center gap-2">
                          <Edit3 size={18}/> Hotseat
                      </button>
                  </div>
                  <button onClick={() => ui.setShowPlaySetup(false)} className="mt-4 text-slate-500 text-sm hover:text-white">Cancel</button>
              </div>
          </div>
      )}

      {ui.cardActionTarget && (
          <div className="absolute inset-0 z-[100] bg-black/50 flex items-center justify-center" onClick={() => ui.setCardActionTarget(null)}>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-2xl transform scale-100 transition-transform" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-center mb-4">
                      {/* Note: In a real refactor, createFieldCard logic might need to ensure Card is valid or reconstruct it */}
                      {/* Using safe access */}
                      <div className="w-32 h-44 bg-white rounded-md text-black flex items-center justify-center">
                          {ui.cardActionTarget.card.rank}{ui.cardActionTarget.card.suit}
                      </div>
                  </div>
                  <div className="flex gap-2 justify-center">
                      {ui.cardActionTarget.loc !== 'HAND' && (
                          <button onClick={() => executeCardAction('TAP')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2">
                              <RotateCcw size={16}/> Tap/Untap
                          </button>
                      )}
                      <button onClick={() => executeCardAction('DELETE')} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2">
                          <Trash2 size={16}/> Remove
                      </button>
                  </div>
              </div>
          </div>
      )}

      {gameState.mode === 'SANDBOX' && !gameState.isSandboxRun && !ui.sandboxToolsOpen && (
          <button 
            onClick={() => ui.setSandboxToolsOpen(true)} 
            className="absolute top-20 right-4 z-50 bg-slate-800 p-3 rounded-full border border-slate-600 shadow-xl hover:bg-slate-700 text-amber-400"
          >
              <Edit3 size={24} />
          </button>
      )}

      {ui.sandboxToolsOpen && (
          <SandboxTools 
              gameState={gameState}
              setGameState={setGameState}
              sandboxSearchTerm={ui.sandboxSearchTerm}
              setSandboxSearchTerm={ui.setSandboxSearchTerm}
              sandboxTargetPlayer={ui.sandboxTargetPlayer}
              setSandboxTargetPlayer={ui.setSandboxTargetPlayer}
              selectedSandboxCard={ui.selectedSandboxCard}
              setSelectedSandboxCard={ui.setSelectedSandboxCard}
              setSandboxToolsOpen={ui.setSandboxToolsOpen}
              setShowPlaySetup={ui.setShowPlaySetup}
          />
      )}
      
      {effects.showTurnAnim && (
          <TurnChangeOverlay 
              playerName={gameState.players[gameState.turnPlayer].name}
              turnCount={gameState.turnCount}
              onComplete={() => effects.setShowTurnAnim(false)}
          />
      )}
      
      {gameState.phase === Phase.GAME_OVER && !tutorialComplete && gameState.mode !== 'TUTORIAL' && (
          <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-1000 overflow-hidden">
              <Confetti />
              <div className="text-center space-y-6 relative z-[130]">
                  <h1 className="text-6xl md:text-8xl font-black font-title text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 drop-shadow-[0_0_25px_rgba(234,179,8,0.5)] animate-bounce">
                      GAME OVER
                  </h1>
                  <h2 className="text-3xl font-bold text-white drop-shadow-md">
                      {gameState.winner !== null ? `${gameState.players[gameState.winner].name} Wins!` : "It's a Draw!"}
                  </h2>
                  <div className="text-xl text-slate-400 font-title uppercase tracking-widest mt-2">
                      Total Turns: {gameState.turnCount}
                  </div>
                  <div className="flex gap-4 justify-center mt-8">
                      <button onClick={handleQuitToTitle} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-xl shadow-lg shadow-indigo-500/30 transform transition-all hover:scale-105 active:scale-95">
                          Rematch / Menu
                      </button>
                  </div>
              </div>
          </div>
      )}

      <EndTurnModal show={ui.showEndTurnModal} onCancel={() => ui.setShowEndTurnModal(false)} onConfirm={() => { 
          ui.setShowEndTurnModal(false); 
          performEndTurn(); 
          if(gameState.mode === 'TUTORIAL') advanceTutorialStep('CLICK_UI_BUTTON', 'btn-end-turn-modal-confirm');
      }} />
      <ResignModal show={ui.showResignModal} onCancel={() => ui.setShowResignModal(false)} onConfirm={handleResign} />
      <QuitModal show={ui.showQuitModal} onCancel={() => ui.setShowQuitModal(false)} onConfirm={handleQuitToTitle} />
      <PauseMenu 
        show={ui.showMenu} 
        onResume={() => ui.setShowMenu(false)} 
        onResign={() => ui.setShowResignModal(true)} 
        onQuit={() => ui.setShowQuitModal(true)} 
        autoSort={ui.autoSort} 
        onToggleSort={() => ui.toggleAutoSort(setGameState, getActiveDecisionPlayerId)} 
      />

      <DiscardModal 
        viewingDiscard={ui.viewingDiscard} 
        players={gameState.players} 
        onClose={() => ui.setViewingDiscard(null)} 
        mode={gameState.mode} 
      />

      {effects.specialAnim && <SpecialCardAnimation type={effects.specialAnim.type} card={effects.specialAnim.card} targetRect={effects.specialAnim.targetRect} onComplete={() => effects.setSpecialAnim(null)} />}

      {effects.flyingCards.map(fc => (
          <Flyer key={fc.id} fc={fc} />
      ))}
      
      {effects.soulTrails.map(st => (
          <SoulOrb key={st.id} trail={st} />
      ))}

      {effects.flyingTexts.map(ft => (
          <div 
             key={ft.id}
             className="fixed z-[70] text-5xl font-black text-red-500 pointer-events-none drop-shadow-md"
             style={{ 
                 left: ft.startX, top: ft.startY,
                 transition: 'all 1s ease-in-out',
                 transform: `translate(${ft.targetX - ft.startX}px, ${ft.targetY - ft.startY}px) scale(0.5)`,
                 opacity: 0,
                 animation: 'fly 1s forwards'
             }}
          >
              {ft.text}
              <style>{`@keyframes fly { 0% { opacity: 1; } 100% { opacity: 0; } }`}</style>
          </div>
      ))}

      {effects.explosions.map(e => (
          <Explosion key={e.id} x={e.x} y={e.y} onComplete={() => effects.removeExplosion(e.id)} />
      ))}
      
      {effects.damageAnims.map(da => (
          <DamageOverlay 
            key={da.id}
            dmg={da.val} 
            targetRef={da.playerId === topPlayer.id ? refs.lifeIconRef : refs.bottomLifeRef}
            onComplete={() => effects.setDamageAnims(prev => prev.filter(a => a.id !== da.id))}
            onImpact={da.onApply}
          />
      ))}

      <svg className="absolute inset-0 z-10 w-full h-full pointer-events-none">
          {Object.entries(gameState.pendingBlocks).map(([blockerId, attackerId]) => {
              const blockerEl = document.getElementById(blockerId);
              const attackerEl = document.getElementById(attackerId);
              if (blockerEl && attackerEl) {
                  const bRect = blockerEl.getBoundingClientRect();
                  const aRect = attackerEl.getBoundingClientRect();
                  return (
                      <line 
                        key={`${blockerId}-${attackerId}`}
                        x1={bRect.left + bRect.width/2} y1={bRect.top + bRect.height/2}
                        x2={aRect.left + aRect.width/2} y2={aRect.top + aRect.height/2}
                        stroke="#3b82f6" strokeWidth="4" strokeDasharray="0" className="opacity-70"
                      />
                  );
              }
              return null;
          })}
          {interactions.dragState?.sourceType === 'FIELD' && interactions.dragState.currentX && (
               (() => {
                   const startEl = document.getElementById(interactions.dragState.instanceId!);
                   if(startEl) {
                       const rect = startEl.getBoundingClientRect();
                       return (
                           <line 
                                x1={rect.left + rect.width/2} y1={rect.top + rect.height/2}
                                x2={interactions.dragState.currentX} y2={interactions.dragState.currentY}
                                stroke="#3b82f6" strokeWidth="4" strokeDasharray="5" className="opacity-70"
                           />
                       );
                   }
               })()
          )}
      </svg>
      
      {ui.isMobile ? (
          <MobileLayout 
            gameState={gameState}
            topPlayer={topPlayer}
            bottomPlayer={bottomPlayer}
            activeDecisionPlayerId={activeDecisionPlayerId}
            isInteractive={isInteractive}
            dragState={interactions.dragState}
            handlers={gameHandlers}
            refs={refs}
            uiState={{ showMobileLog: ui.showMobileLog, showMenu: ui.showMenu }}
          />
      ) : (
          <DesktopLayout 
            gameState={gameState}
            topPlayer={topPlayer}
            bottomPlayer={bottomPlayer}
            activeDecisionPlayerId={activeDecisionPlayerId}
            isInteractive={isInteractive}
            dragState={interactions.dragState}
            handlers={gameHandlers}
            refs={refs}
            uiState={{ showMobileLog: ui.showMobileLog, showMenu: ui.showMenu }}
          />
      )}
    </div>
    </>
  );
};
