
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Phase, GameMode } from './types';
import { addLog } from './utils/core';
import { createFieldCard, getEffectiveColor } from './utils/rules';
import { RotateCcw, Play, Edit3, Trash2, GraduationCap, Volume2, Users } from 'lucide-react';
import { sortHand } from './utils/cards';
import { primeAudio, playSound } from './utils/soundUtils';
import { 
    loadProgression, 
    saveProgression, 
    updateQuestsProgress, 
    addXpAndGold, 
    getStreakReward,
    rerollQuest,
    ProgressionData, 
    SessionStats 
} from './utils/progression';
import { loadCampaign, saveCampaign, generateCampaignMap, CampaignState, getRandomElement } from './utils/campaign';
// Imported Components
import { CoinFlipOverlay } from './components/overlays/CoinFlipOverlay';
import { TurnChangeOverlay } from './components/overlays/TurnChangeOverlay';
import { TutorialOverlay } from './components/overlays/TutorialOverlay';
import { Confetti, Explosion, DamageOverlay } from './components/effects/VisualEffects';
import { Flyer, SpecialCardAnimation, SoulOrb, Summoner } from './components/effects/GameAnimations';
import { MainMenu } from './components/screens/MainMenu';
import { MainMenuBackground } from './components/effects/MainMenuBackground';
import { SandboxTools } from './components/tools/SandboxTools';
import { EndTurnModal, ResignModal, QuitModal, PauseMenu } from './components/modals/GameModals';
import { OptionsMenu } from './components/modals/OptionsMenu';
import { DiscardModal } from './components/modals/DiscardModal';
import { MobileLayout } from './components/game/MobileLayout';
import { DesktopLayout } from './components/game/DesktopLayout';
import { CountUp } from './components/ui/CountUp';
import { GoldCoin } from './components/ui/GoldCoin';

// Hooks
import { useGameRefs } from './hooks/useGameRefs';
import { useGameEffects } from './hooks/useGameEffects';
import { useGameUI } from './hooks/useGameUI';
import { useGameState } from './hooks/useGameState';
import { useTutorial } from './hooks/useTutorial';
import { useGameAI } from './hooks/useGameAI';
import { useGameInteractions } from './hooks/useGameInteractions';
import { useMultiplayer, MultiplayerAction } from './hooks/useMultiplayer';

export const App: React.FC = () => {
  const refs = useGameRefs();
  const effects = useGameEffects();
  const ui = useGameUI();
  
  // Audio Priming State
  const [audioPrimed, setAudioPrimed] = useState(false);

  const [localPlayerId, setLocalPlayerId] = useState(0);
  const [coinFlipWinner, setCoinFlipWinner] = useState<number | null>(null);

  // CPU difficulty state
  const [cpuDifficulty, setCpuDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('HARD');
  const [cpu2Difficulty, setCpu2Difficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('HARD');

  // Tutorial reward states for current run
  const [rewardClaimedThisSession, setRewardClaimedThisSession] = useState<boolean>(false);
  const [bonusClaimedThisSession, setBonusClaimedThisSession] = useState<boolean>(false);

  // Progression States
  const [progression, setProgression] = useState<ProgressionData>(() => loadProgression());
  const [endGameRewards, setEndGameRewards] = useState<{
    xpGained: number;
    goldGained: number;
    isQualifying: boolean;
    levelUpGains: { level: number; gold: number }[];
    initialQuests: any[];
    finalQuests: any[];
    gotCompletionBonus?: boolean;
  } | null>(null);
  
  const isGameEndProcessedRef = useRef(false);

    const { 
        gameState, setGameState, gameStateRef,
        startGame, drawCards, playCard, advancePhase, 
        performEndTurn, confirmAttack, confirmBlocks, 
        isDrawingInitialRef, getActiveDecisionPlayerId 
    } = useGameState({ effects, refs, autoSort: ui.autoSort, localPlayerId });

    const { advanceTutorialStep, handleTutorialNext, isInteractionAllowed, handleGlobalClick } = useTutorial({
        gameState,
        setGameState,
        gameStateRef,
        performEndTurn,
        confirmBlocks,
        refs,
        effects
    });

    const handleDragDropData = (cardObj: any, targetInstanceId: string | null, targetElementId: string | null, sourceType: string, instanceId?: string) => {
        if (gameState?.isOnline && getActiveDecisionPlayerId(gameState) === localPlayerId) {
            broadcast({ type: 'DRAG_DROP', cardObj, targetInstanceId, targetElementId, sourceType, instanceId });
        }
    };

    const interactions = useGameInteractions(gameState, {
        setGameState,
        gameStateRef,
        getActiveDecisionPlayerId,
        drawCards,
        playCard,
        advancePhase,
        performEndTurn,
        confirmAttack,
        confirmBlocks,
        onDragDropData: handleDragDropData
    }, effects, {
        isInteractionAllowed,
        advanceTutorialStep
    }, ui, refs);

    const onActionReceived = useCallback((action: MultiplayerAction) => {
        const currentState = gameStateRef.current;
        if (!currentState && action.type !== 'START_GAME') return;

        switch (action.type) {
            case 'START_GAME':
                setLocalPlayerId(1); // You are the guest
                setGameState(action.state);
                if (action.coinFlipWinner !== undefined) {
                    setCoinFlipWinner(action.coinFlipWinner);
                    ui.setIsCoinFlipping(true);
                }
                ui.setMenuStep('MODE'); // Get out of setup
                break;
            case 'SYNC_STATE':
                setGameState(action.state);
                break;
            case 'CARD_CLICK':
                interactions.handleCardClick(action.card, action.location as any, action.ownerId, action.instanceId, true);
                break;
            case 'CONFIRM_INIT':
                interactions.handleConfirmInitSelection();
                break;
            case 'PHASE_ACTION':
                interactions.handlePhaseAction(action.action as any);
                break;
            case 'DRAG_DROP':
                interactions.handleRemoteDrop(action.cardObj, action.targetInstanceId, action.targetElementId, action.sourceType, action.instanceId);
                break;
            case 'RESIGN':
                playSound('game_over');
                setGameState(prev => {
                    if(!prev) return null;
                    const opponentId = action.playerId === 0 ? 1 : 0;
                    return { ...prev, winner: opponentId, phase: Phase.GAME_OVER, logs: addLog(prev, `${prev.players[action.playerId].name} resigned.`) };
                });
                break;
            case 'CHAT':
                setGameState(prev => {
                    if(!prev) return null;
                    return { ...prev, logs: addLog(prev, `Friend: ${action.message}`) };
                });
                break;
        }
    }, [setGameState, ui, interactions]);

    const { peerId, status, error, isHost, connectToPeer, broadcast, disconnect, connection } = useMultiplayer(onActionReceived);

    const handleCardClick = (card: any, location: any, ownerId: number, instanceId?: string, fromRemote: boolean = false) => {
        if (!fromRemote && gameState?.isOnline && getActiveDecisionPlayerId(gameState) === localPlayerId) {
            broadcast({ type: 'CARD_CLICK', card, location, ownerId, instanceId });
        }
        interactions.handleCardClick(card, location, ownerId, instanceId, fromRemote);
    };

    const handleConfirmInitSelection = (fromRemote: boolean = false) => {
        if (!fromRemote && gameState?.isOnline && getActiveDecisionPlayerId(gameState) === localPlayerId) {
            broadcast({ type: 'CONFIRM_INIT' });
        }
        interactions.handleConfirmInitSelection();
    };

    const handlePhaseAction = (action: any, fromRemote: boolean = false) => {
        // Only broadcast if it's not the intent to open a local modal
        if (!fromRemote && gameState?.isOnline && getActiveDecisionPlayerId(gameState) === localPlayerId) {
            if (action !== 'END_TURN') {
                broadcast({ type: 'PHASE_ACTION', action });
            }
        }
        interactions.handlePhaseAction(action);
    };

    const handleSyncState = () => {
        if (gameState?.isOnline) {
            broadcast({ type: 'SYNC_STATE', state: gameState });
        }
    };

    const hasBroadcastedStart = useRef(false);

    // Initial Start as Host
    useEffect(() => {
        const needsCoinFlip = ui.selectedMode === 'STREET' || ui.selectedMode === 'PRO';
        const isWinnerReady = !needsCoinFlip || coinFlipWinner !== null;

        if (isHost && connection?.open && gameState && gameState.isOnline && !hasBroadcastedStart.current && isWinnerReady) {
            broadcast({ type: 'START_GAME', state: { ...gameState, isMultiplayerStarted: true } as any, coinFlipWinner });
            hasBroadcastedStart.current = true;
        }
    }, [isHost, connection?.open, gameState?.isOnline, broadcast, gameState, coinFlipWinner, ui.selectedMode]);

    // --- DEBUG MODE ---
    const DEBUG_MODE_ENABLED = true;
    useEffect(() => {
        const nameLower = (progression.playerName || '').toLowerCase();
        if (!DEBUG_MODE_ENABLED || (nameLower !== 'bluster' && nameLower !== 'buster')) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!e.shiftKey) return;
            
            switch (e.code) {
                case 'Digit1': {
                    e.preventDefault();
                    setProgression(prev => {
                        const updated = { ...prev, gold: (prev.gold || 0) + 1000 };
                        saveProgression(updated);
                        return updated;
                    });
                    console.log("DEBUG: Added 1,000 gold.");
                    break;
                }
                case 'Digit2': {
                    e.preventDefault();
                    if (gameState && gameState.winner === null) {
                        setGameState(prev => {
                            if (!prev) return null;
                            return { 
                                ...prev, 
                                winner: localPlayerId, 
                                phase: Phase.GAME_OVER,
                                logs: addLog(prev, "DEBUG: Auto-win initialized.") 
                            };
                        });
                        console.log("DEBUG: Auto-winning game.");
                    }
                    break;
                }
                case 'Digit4': {
                    e.preventDefault();
                    const campState = loadCampaign();
                    if (campState.nodes[campState.currentNodeIndex]) {
                        campState.nodes[campState.currentNodeIndex].completed = true;
                        campState.currentNodeIndex = Math.min(9, campState.currentNodeIndex + 1);
                        saveCampaign(campState);
                        window.dispatchEvent(new Event('campaign-updated'));
                        console.log(`DEBUG: Cleared current node. Advanced to ${campState.currentNodeIndex}`);
                    }
                    break;
                }
                case 'Digit5': {
                    e.preventDefault();
                    const campState = loadCampaign();
                    if (campState.currentNodeIndex === 9) {
                        const challenges: any[] = ['SUPPLY_CHAIN', 'AMBUSH', 'WEAK_SOLDIERS', 'UNGA_BUNGA', 'BIG_BOI'];
                        const currentChallenge = campState.nodes[9].challenge;
                        const others = challenges.filter(c => c !== currentChallenge);
                        const nextChallenge = getRandomElement(others);
                        campState.nodes[9].challenge = nextChallenge;
                        saveCampaign(campState);
                        window.dispatchEvent(new Event('campaign-updated'));
                        console.log(`DEBUG: Changed Boss Challenge to ${nextChallenge}`);
                    }
                    break;
                }
                case 'Digit6': {
                    e.preventDefault();
                    const campState = loadCampaign();
                    const nextCampState = generateCampaignMap(
                        campState.rulesFormat,
                        campState.areasCleared,
                        campState.bestWinStreak,
                        campState.currentWinStreak
                    );
                    saveCampaign(nextCampState);
                    window.dispatchEvent(new Event('campaign-updated'));
                    console.log(`DEBUG: Instantly generated a new campaign map with theme: ${nextCampState.theme}`);
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [progression.playerName, gameState, ui.uiMode, localPlayerId]);

  const gameHandlers = {
      onCardClick: handleCardClick,
      handleConfirmInitSelection,
      handlePhaseAction,
      onDragStart: interactions.handleDragStart,
      onPhaseAction: handlePhaseAction,
      setViewingDiscard: ui.setViewingDiscard,
      setShowMenu: ui.setShowMenu,
      toggleLog: () => ui.setShowMobileLog(!ui.showMobileLog)
  };

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
          handleCardClick,
          handleConfirmInitSelection,
          getActiveDecisionPlayerId
      },
      isCoinFlipping: ui.isCoinFlipping,
      showMenu: ui.showMenu,
      showTurnAnim: effects.showTurnAnim
  });

  const handleAppInteraction = () => {
      handleGlobalClick();
  };

  // --- Handlers wrapping UI logic ---
  const handleModeSelect = (mode: GameMode) => {
      if (mode === 'SANDBOX') { startGame('SANDBOX', { p1: false, p2: false }); } 
      else if (mode === 'TUTORIAL') { ui.setMenuStep('TUTORIAL_MENU'); }
      else { ui.setSelectedMode(mode); }
  };
  
  const startLesson = (lessonId: string) => { 
      isGameEndProcessedRef.current = false;
      setEndGameRewards(null);
      setRewardClaimedThisSession(false);
      setBonusClaimedThisSession(false);
      startGame('TUTORIAL', { p1: false, p2: true }, lessonId); 
  };
  
    const handleStartGameClick = (isCpu: boolean, modeOverride?: GameMode) => { 
        const mode = modeOverride || ui.selectedMode;
        if (mode) {
            setLocalPlayerId(0);
            isGameEndProcessedRef.current = false;
            setEndGameRewards(null);
            startGame(mode, { p1: false, p2: isCpu }, undefined, ui.enableMultiBlocking, 'HARD', cpuDifficulty);
            if (mode === 'STREET' || mode === 'PRO') {
                ui.setIsCoinFlipping(true);
            }
        }
    };

    const handleStartMultiplayer = () => {
        if (!ui.selectedMode) return;
        setLocalPlayerId(0); // Host is Player 0
        const winner = Math.random() > 0.5 ? 0 : 1;
        setCoinFlipWinner(winner);
        isGameEndProcessedRef.current = false;
        setEndGameRewards(null);
        startGame(ui.selectedMode, { p1: false, p2: false }, undefined, ui.enableMultiBlocking);
        setGameState(prev => prev ? { ...prev, isOnline: true } : null);
        if (ui.selectedMode === 'STREET' || ui.selectedMode === 'PRO') {
            ui.setIsCoinFlipping(true);
        }
    };

  const handleSpectateClick = (modeOverride?: GameMode) => { 
      const mode = modeOverride || ui.selectedMode;
      if (mode) {
          isGameEndProcessedRef.current = false;
          setEndGameRewards(null);
          startGame(mode, { p1: true, p2: true }, undefined, ui.enableMultiBlocking, cpuDifficulty, cpu2Difficulty);
          if (mode === 'STREET' || mode === 'PRO') {
              ui.setIsCoinFlipping(true);
          }
      }
  };

  const handleQuitToTitle = () => {
      let isCampaign = false;
      try {
          isCampaign = sessionStorage.getItem('battle_is_campaign_game') === 'true';
          sessionStorage.removeItem('battle_preview_back');
          sessionStorage.removeItem('battle_preview_face');
          sessionStorage.removeItem('battle_is_preview_game');
          sessionStorage.removeItem('battle_preview_name');
          sessionStorage.removeItem('battle_is_campaign_game');
      } catch (e) {}

      if (gameState?.isOnline) {
          disconnect();
          hasBroadcastedStart.current = false;
      }
      const isTutorial = gameState?.mode === 'TUTORIAL';
      isGameEndProcessedRef.current = false;
      setEndGameRewards(null);
      setGameState(null);
      ui.resetModals();
      if (isTutorial) {
          ui.setMenuStep('TUTORIAL_MENU');
      } else if (isCampaign) {
          ui.setMenuStep('CAMPAIGN_MAP');
      } else {
          ui.setMenuStep('MODE');
      }
  };

  const handleResign = () => {
      if (!gameState) return;
      if (gameState.isOnline) {
          broadcast({ type: 'RESIGN', playerId: localPlayerId });
      }
      playSound('game_over'); // Play sound on resign
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

  // Progression Reset Watcher
  useEffect(() => {
    if (!gameState || gameState.phase !== Phase.GAME_OVER) {
      isGameEndProcessedRef.current = false;
      setEndGameRewards(null);
    }
  }, [gameState?.phase]);

  // Progression Game-Over Watcher
  useEffect(() => {
    if (gameState && gameState.phase === Phase.GAME_OVER && !isGameEndProcessedRef.current) {
      isGameEndProcessedRef.current = true;
      
      const p1 = gameState.players[0];
      const p2 = gameState.players[1];
      const isCpuMatch = !p1.isCpu && p2.isCpu;
      const isOnlineMatch = !!gameState.isOnline;
      const isPreview = (() => {
        try {
          return sessionStorage.getItem('battle_is_preview_game') === 'true';
        } catch(e) { return false; }
      })();
      const isCampaign = (() => {
        try {
          return sessionStorage.getItem('battle_is_campaign_game') === 'true';
        } catch(e) { return false; }
      })();
      const isQualifying = (gameState.mode === 'STREET' || gameState.mode === 'PRO') && (isCpuMatch || isOnlineMatch) && !gameState.isSandboxRun && !isPreview && !isCampaign;
      
      if (isCampaign) {
        const stats: SessionStats = gameState.sessionStats || {
          damageDealt: 0,
          conscriptedCount: 0,
          tacticsPlayed: 0,
          killsCount: 0
        };
        
        const isWin = gameState.winner === localPlayerId;
        
        // Take a snapshot of old quests to display differences side by side
        const initialQuests = JSON.parse(JSON.stringify(progression.quests));
        
        // Update quest achievements
        const campState = loadCampaign();
        const isCampaignCleared = isWin && (campState.currentNodeIndex + 1) >= 10;
        let updatedProg = updateQuestsProgress(progression, stats, true, isCampaignCleared);
        
        // Load & update campaign state
        let nextCampState = { ...campState };
        let campaignXpGained = isWin ? 200 : 80;
        let campaignGoldGained = isWin ? 100 : 0;
        let gotCompletionBonus = false;
        
        if (isWin) {
          // Mark current active node completed
          if (nextCampState.nodes[nextCampState.currentNodeIndex]) {
            nextCampState.nodes[nextCampState.currentNodeIndex].completed = true;
          }
          nextCampState.currentWinStreak += 1;
          if (nextCampState.currentWinStreak > nextCampState.bestWinStreak) {
            nextCampState.bestWinStreak = nextCampState.currentWinStreak;
          }
          
          const wonNodeIndex = nextCampState.currentNodeIndex;
          const nextNodeIndex = wonNodeIndex + 1;
          
          if (nextNodeIndex >= 10) {
            // 10th node completed successfully!
            campaignXpGained += 1000;
            campaignGoldGained += 500;
            gotCompletionBonus = true;
            nextCampState.areasCleared += 1;
            
            // Regenerate campaign path
            nextCampState = generateCampaignMap(
              campState.rulesFormat,
              nextCampState.areasCleared,
              nextCampState.bestWinStreak,
              nextCampState.currentWinStreak
            );
          } else {
            nextCampState.currentNodeIndex = nextNodeIndex;
          }
        } else {
          // Reset streak but try node again (currentNodeIndex stays the same)
          nextCampState.currentWinStreak = 0;
        }
        
        saveCampaign(nextCampState);
        
        // Apply campaign end-game rewards
        const { updatedData: finalProg, levelUpGains } = addXpAndGold(updatedProg, campaignXpGained, campaignGoldGained);
        setProgression(finalProg);
        
        setEndGameRewards({
          xpGained: campaignXpGained,
          goldGained: campaignGoldGained,
          isQualifying: true,
          levelUpGains,
          initialQuests,
          finalQuests: finalProg.quests,
          gotCompletionBonus
        });
      } else if (isQualifying) {
        const stats: SessionStats = gameState.sessionStats || {
          damageDealt: 0,
          conscriptedCount: 0,
          tacticsPlayed: 0,
          killsCount: 0
        };
        
        const isWin = gameState.winner === localPlayerId;
        const xpGained = isWin ? 200 : 80;
        const goldGained = isWin ? 100 : 0;
        
        // Take a snapshot of old quests to display differences side by side
        const initialQuests = JSON.parse(JSON.stringify(progression.quests));
        
        // Update quest achievements
        let updatedProg = updateQuestsProgress(progression, stats, isQualifying);
        
        // Apply end-game rewards
        const { updatedData: finalProg, levelUpGains } = addXpAndGold(updatedProg, xpGained, goldGained);
        
        setProgression(finalProg);
        
        setEndGameRewards({
          xpGained,
          goldGained,
          isQualifying: true,
          levelUpGains,
          initialQuests,
          finalQuests: finalProg.quests
        });
      } else {
        setEndGameRewards({
          xpGained: 0,
          goldGained: 0,
          isQualifying: false,
          levelUpGains: [],
          initialQuests: [],
          finalQuests: []
        });
      }
    }
  }, [gameState?.phase, gameState?.winner, progression, localPlayerId]);

  // Initial Draw Effect (Moved logic slightly to ensure it runs once)
  useEffect(() => {
    let active = true;
    let timer: NodeJS.Timeout | undefined;

    if (gameState && gameState.mode !== 'SANDBOX' && gameState.mode !== 'TUTORIAL' && gameState.phase === Phase.INIT_SELECT && !ui.isCoinFlipping) {
      if (!isDrawingInitialRef.current) {
        const p1 = gameState.players[0];
        const p2 = gameState.players[1];
        if (p1.hand.length === 0 || p2.hand.length === 0) {
             isDrawingInitialRef.current = true;
             // Add a small delay to ensure refs/layout are stable
             timer = setTimeout(() => {
                 (async () => {
                     if (!active) return;
                     await drawCards(0, 8);
                     if (!active) return;
                     await drawCards(1, 8);
                     if (!active) return;
                     setGameState(prev => prev ? { ...prev, logs: addLog(prev, "Deployment Phase: Select 3 resources.") } : null);
                     isDrawingInitialRef.current = false;
                 })();
             }, 200);
        }
      }
    }

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [gameState?.phase, ui.isCoinFlipping, gameState?.mode]);

  // --- AUTO END TURN LOGIC ---
  useEffect(() => {
    if (effects.hasActiveAnimations) return;

    if (ui.autoEndTurn && gameState && gameState.phase === Phase.MAIN) {
        const activePid = getActiveDecisionPlayerId(gameState);
        const player = gameState.players[activePid];
        const opponent = gameState.players[activePid === 0 ? 1 : 0];
        
        // Only run for non-CPU players (or if we are watching CPU vs CPU in Spectate, logic handles turn anyway)
        // But useGameAI handles CPU turns. We only want this for the interactive player.
        const isActivePlayerCpu = player.isCpu;
        if (isActivePlayerCpu) return;

        const availableRes = player.resources.filter(r => !r.isTapped).length;
        
        const canPlayCard = player.hand.some(c => {
            if (c.cost > availableRes) return false;
            // Additional checks for tactics
            if (c.rank === 'K') return opponent.field.some(f => getEffectiveColor(f) === c.baseColor);
            if (c.rank === 'Q') return opponent.field.length > 0 || player.field.length > 0;
            return true;
        });

        const canAttack = !player.hasAttackedThisTurn && player.field.some(c => !c.isTapped && !c.isSummoningSick);

        if (!canPlayCard && !canAttack) {
            const timer = setTimeout(() => {
                // Double check state hasn't changed
                if (gameState.phase === Phase.MAIN && gameState.turnPlayer === activePid && !effects.hasActiveAnimations) {
                    if (gameState.isOnline) {
                        if (activePid === localPlayerId) {
                            broadcast({ type: 'PHASE_ACTION', action: 'AUTO_END_TURN' });
                            performEndTurn();
                        }
                    } else {
                        performEndTurn();
                    }
                }
            }, 1000); // 1s delay for better UX
            return () => clearTimeout(timer);
        }
    }
  }, [gameState?.phase, gameState?.turnPlayer, gameState?.players, ui.autoEndTurn, effects.hasActiveAnimations]);

  const tutorialComplete = gameState?.tutorialState?.completed;

  // React Effect to handle Tutorial Completion Rewards
  useEffect(() => {
    if (tutorialComplete && gameState?.tutorialState?.lessonId) {
      const lessonId = gameState.tutorialState.lessonId;
      const claimedBefore = progression.claimedTutorialRewards?.includes(lessonId) || false;

      if (!claimedBefore) {
        setRewardClaimedThisSession(true);
        
        // Find if all lessons are completed
        const allLessons = ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4'];
        const completedAll = allLessons.every(id => 
          id === lessonId || localStorage.getItem(`battle_lesson_complete_${id}`) === 'true'
        );
        const claimedAllBefore = !!progression.claimedAllTutorialsBonus;
        if (completedAll && !claimedAllBefore) {
          setBonusClaimedThisSession(true);
        }
      }

      setProgression(prev => {
        const claimed = prev.claimedTutorialRewards || [];
        if (claimed.includes(lessonId)) {
          return prev;
        }

        playSound('conscript_mag');
        let goldReward = 1000;
        const nextClaimed = [...claimed, lessonId];

        // Check if all lessons are completed
        const allLessons = ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4'];
        const completedAll = allLessons.every(id => 
          id === lessonId || localStorage.getItem(`battle_lesson_complete_${id}`) === 'true'
        );

        let claimedAll = !!prev.claimedAllTutorialsBonus;
        if (completedAll && !claimedAll) {
          goldReward += 5000;
          claimedAll = true;
        }

        const updated = {
          ...prev,
          gold: prev.gold + goldReward,
          claimedTutorialRewards: nextClaimed,
          claimedAllTutorialsBonus: claimedAll
        };

        saveProgression(updated);
        return updated;
      });
    }
  }, [tutorialComplete, gameState?.tutorialState?.lessonId, progression.claimedTutorialRewards, progression.claimedAllTutorialsBonus]);

  // --- AUDIO PRIMING OVERLAY (TITLE SCREEN) ---
  if (!audioPrimed) {
      return (
          <div 
              className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center cursor-pointer select-none"
              onClick={() => {
                  primeAudio();
                  setAudioPrimed(true);
              }}
          >
              <MainMenuBackground />
              
              <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-1000 space-y-12 p-4">
                  
                  {/* Title Section */}
                  <div className="text-center space-y-6">
                      <div className="flex items-center justify-center gap-4 opacity-80">
                              <div className="h-px w-16 md:w-32 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                              <span className="text-indigo-400 text-xs md:text-sm font-bold tracking-[0.4em] uppercase font-title text-shadow-sm">Tactical Card Warfare</span>
                              <div className="h-px w-16 md:w-32 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                      </div>
                      <h1 className="text-7xl md:text-9xl font-black font-title tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-100 via-slate-300 to-slate-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                          BATTLE
                      </h1>
                  </div>

                  {/* Start Prompt */}
                  <div className="animate-pulse mt-8">
                      <span className="text-white/80 font-bold tracking-[0.2em] text-lg md:text-xl border-b-2 border-transparent group-hover:border-indigo-500 transition-all">
                          CLICK TO START
                      </span>
                  </div>
              </div>
          </div>
      );
  }

  if (!gameState) {
      return (
        <div 
            className="relative flex flex-col items-center justify-center h-screen w-full bg-slate-950 overflow-hidden selection:bg-indigo-500/30"
            onClick={handleAppInteraction}
        >
            <MainMenuBackground />
            <MainMenu 
                menuStep={ui.menuStep}
                setMenuStep={ui.setMenuStep}
                handleModeSelect={handleModeSelect}
                handleStartGameClick={handleStartGameClick}
                handleSpectateClick={handleSpectateClick}
                startLesson={startLesson}
                onOpenOptions={() => ui.setShowOptions(true)}
                enableMultiBlocking={ui.enableMultiBlocking}
                setEnableMultiBlocking={ui.setEnableMultiBlocking}
                multiplayer={{
                    peerId,
                    status,
                    error,
                    connect: connectToPeer
                }}
                selectedMode={ui.selectedMode}
                progression={progression}
                setProgression={setProgression}
                cpuDifficulty={cpuDifficulty}
                setCpuDifficulty={setCpuDifficulty}
                cpu2Difficulty={cpu2Difficulty}
                setCpu2Difficulty={setCpu2Difficulty}
            />
            {status === 'CONNECTED' && isHost && !gameState && (
                <div className="absolute inset-0 z-[100] bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                        <Users className="w-16 h-16 text-indigo-400 animate-bounce" />
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2 font-title">Friend Connected!</h2>
                            <p className="text-slate-400 text-sm">Ready to start the tactical warfare?</p>
                        </div>
                        <button 
                            onClick={handleStartMultiplayer}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                        >
                            START GAME
                        </button>
                    </div>
                </div>
            )}
            {ui.showOptions && (
                <OptionsMenu 
                    onClose={() => ui.setShowOptions(false)}
                    autoSort={ui.autoSort}
                    toggleAutoSort={() => ui.toggleAutoSort(setGameState, getActiveDecisionPlayerId)}
                    autoEndTurn={ui.autoEndTurn}
                    toggleAutoEndTurn={ui.toggleAutoEndTurn}
                    sfxVolume={ui.sfxVolume}
                    setSfxVolume={ui.setSfxVolume}
                />
            )}
        </div>
      );
  }

  const activeDecisionPlayerId = getActiveDecisionPlayerId(gameState);
  const isHotseat = !gameState.players[1].isCpu || gameState.mode === 'SANDBOX' || gameState.isOnline;
  const viewPlayerId = gameState.isOnline ? localPlayerId : (isHotseat ? activeDecisionPlayerId : 0); 
  const bottomPlayer = gameState.players[viewPlayerId];
  const topPlayer = gameState.players[viewPlayerId === 0 ? 1 : 0];
  const isPlayerTurn = activeDecisionPlayerId === viewPlayerId;
  const isActivePlayerCpu = gameState.players[activeDecisionPlayerId].isCpu;
  const isInteractive = isPlayerTurn && !isActivePlayerCpu;

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
      onTouchMove={(e) => {
          if (interactions.dragState) {
              const touch = e.touches[0];
              interactions.setDragState(prev => prev ? { ...prev, currentX: touch.clientX, currentY: touch.clientY } : null);
          }
      }}
      onMouseUp={(e) => interactions.handleDrop(e.nativeEvent)}
      onTouchEnd={(e) => interactions.handleDrop(e.nativeEvent)}
      onClick={handleAppInteraction}
    >
      {ui.isCoinFlipping && gameState && (
           <CoinFlipOverlay 
                p1Name={gameState.isOnline ? (localPlayerId === 0 ? "You" : "Opponent") : gameState.players[0].name} 
                p2Name={gameState.isOnline ? (localPlayerId === 1 ? "You" : "Opponent") : gameState.players[1].name} 
                forcedWinner={coinFlipWinner}
                onComplete={(winner) => {
                    setGameState(prev => prev ? { ...prev, turnPlayer: winner, startingPlayerId: winner, logs: addLog(prev, `Coin Flip: ${prev.players[winner].name} goes first!`) } : null);
                    ui.setIsCoinFlipping(false);
                    setCoinFlipWinner(null);
                }} 
           />
      )}

      {gameState.tutorialState?.active && !tutorialComplete && gameState.tutorialState.steps[gameState.tutorialState.currentStepIndex] && (
          <TutorialOverlay step={gameState.tutorialState.steps[gameState.tutorialState.currentStepIndex]} onNext={handleTutorialNext} />
      )}

      {tutorialComplete && (
          <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-1000 overflow-hidden">
              <Confetti />
              <div className="text-center space-y-6 relative z-[130] w-full max-w-md px-6">
                  <GraduationCap className="w-20 h-20 mx-auto text-emerald-400 animate-bounce" />
                  <h1 className="text-4xl md:text-5xl font-black font-title text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 drop-shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                      LESSON COMPLETE!
                  </h1>

                  {/* Gold claim animations */}
                  {rewardClaimedThisSession ? (
                      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3.5 shadow-2xl animate-in zoom-in-95 delay-150 duration-500 text-center">
                          <div className="text-xs uppercase font-extrabold tracking-widest text-amber-400">Reward Claimed</div>
                          <div className="text-3xl font-black text-yellow-400 flex items-center justify-center gap-1.5">
                              <span>+1,000</span> <GoldCoin size={24} />
                          </div>
                          <div className="text-xs text-slate-400 font-medium font-mono">One-time tutorial lesson completion reward.</div>
                          
                          {/* All-completed grand bonus block */}
                          {bonusClaimedThisSession && (
                              <div className="bg-gradient-to-br from-indigo-950/50 via-amber-950/30 to-slate-900 border border-amber-500/30 p-3 rounded-xl text-center mt-3 animate-pulse">
                                  <div className="text-[10px] text-amber-300 font-black uppercase tracking-widest flex items-center justify-center gap-1">🏆 Grandmaster Bonus Unlocked!</div>
                                  <div className="text-xl font-black text-amber-400 mt-1 flex items-center justify-center gap-1.5">
                                      +5,000 <GoldCoin size={20} /> Gold Added!
                                  </div>
                                  <div className="text-[9px] text-yellow-250 italic">Completed all 4 master tutorials!</div>
                              </div>
                          )}
                      </div>
                  ) : (
                      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-2.5 shadow-xl animate-in zoom-in-95 delay-150 duration-500 text-center">
                          <div className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Lesson Completed</div>
                          <p className="text-sm text-slate-350 leading-relaxed">
                              You've successfully cleared this lesson! You've already claimed this one-time 1,000 Gold reward on a previous run.
                          </p>
                      </div>
                  )}

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
          <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-1000 overflow-y-auto py-10">
              <Confetti />
              <div className="text-center space-y-6 relative z-[130] w-full max-w-lg px-4">
                  <h1 className="text-6xl md:text-7xl font-black font-title text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 drop-shadow-[0_0_25px_rgba(234,179,8,0.5)] animate-bounce mt-4">
                      GAME OVER
                  </h1>
                  <h2 className="text-3xl font-bold text-white drop-shadow-md">
                      {gameState.winner !== null ? `${gameState.players[gameState.winner].name} Wins!` : "It's a Draw!"}
                  </h2>
                  <div className="text-sm text-slate-400 font-title uppercase tracking-widest mt-1">
                      Total Turns: {gameState.turnCount}
                  </div>

                  {endGameRewards && (
                      <div className="max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-2xl text-left animate-in zoom-in-95 duration-500">
                          <h3 className="text-sm font-semibold tracking-wider text-indigo-400 uppercase border-b border-slate-800 pb-2 flex justify-between items-center">
                              <span>Match Summary</span>
                              {!endGameRewards.isQualifying && <span className="text-[10px] text-slate-500 lowercase normal-case italic">Custom modes (vs CPU/P2P matches earn progress)</span>}
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-950/55 p-3 rounded-lg border border-slate-800/40 text-center">
                                  <div className="text-[10px] uppercase text-indigo-400/80 tracking-widest font-bold">XP Gained</div>
                                  <div className="text-2xl font-black text-indigo-300 mt-1">
                                      +<CountUp end={endGameRewards.xpGained} delay={400} suffix=" XP" />
                                  </div>
                              </div>
                              <div className="bg-slate-950/55 p-3 rounded-lg border border-slate-800/40 text-center">
                                  <div className="text-[10px] uppercase text-amber-400/80 tracking-widest font-bold">Gold Gained</div>
                                  <div className="text-2xl font-black text-amber-400 mt-1">
                                      {endGameRewards.goldGained > 0 ? (
                                          <span>+<CountUp end={endGameRewards.goldGained} delay={700} suffix=" Gold" /></span>
                                      ) : (
                                          <span className="text-slate-500">0 Gold</span>
                                      )}
                                  </div>
                              </div>
                          </div>

                          {/* Campaign Completion Bonus Alert */}
                          {endGameRewards.gotCompletionBonus && (
                              <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/40 p-4 rounded-xl text-center shadow-lg shadow-amber-500/5 animate-in zoom-in-95 duration-500">
                                  <div className="text-sm text-amber-300 font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5">
                                      🏆 Area Cleared!
                                  </div>
                                  <div className="text-xs text-slate-300 mt-1 leading-normal">
                                      Area clear! Completion Bonus: <span className="font-bold text-amber-300">1,000 XP</span> and <span className="font-bold text-amber-400">500 Gold</span>
                                  </div>
                              </div>
                          )}

                          {/* Level Up Alerts */}
                          {endGameRewards.levelUpGains.length > 0 && (
                              <div className="bg-gradient-to-r from-amber-600/20 to-purple-600/20 border border-amber-500/30 p-3 rounded-lg text-center animate-pulse">
                                  <div className="text-xs text-amber-300 font-bold uppercase tracking-widest">Level Up!</div>
                                  {endGameRewards.levelUpGains.map(g => (
                                      <div key={g.level} className="text-sm text-yellow-105 mt-1">
                                          Reached <span className="font-extrabold text-yellow-400">Level {g.level}</span>! Gained <span className="font-extrabold text-amber-400">+{g.gold} Gold</span>
                                      </div>
                                  ))}
                              </div>
                          )}

                          {/* Quest Progress Section */}
                          {endGameRewards.isQualifying && endGameRewards.finalQuests.length > 0 && (() => {
                              const progressedQuests = endGameRewards.finalQuests.map((q) => {
                                  const initQ = endGameRewards.initialQuests?.find((iq: any) => iq.id === q.id);
                                  const progressDiff = q.current - (initQ ? initQ.current : 0);
                                  if (progressDiff <= 0 && !q.completed) return null;

                                  const pct = (q.current / q.target) * 100;

                                  return (
                                      <div key={q.id} className="bg-slate-950/40 p-2.5 rounded border border-slate-800 text-xs space-y-1">
                                          <div className="flex justify-between font-medium">
                                              <span className="text-slate-200">{q.description}</span>
                                              <span className="text-slate-400 font-mono font-bold">{q.current}/{q.target}</span>
                                          </div>
                                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                              <div 
                                                  className={`h-full transition-all duration-1000 ${q.completed ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-indigo-505 to-purple-500'}`}
                                                  style={{ width: `${pct}%` }}
                                              ></div>
                                          </div>
                                          {q.completed && (
                                              <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                                                  ✓ Completed! (Head to menu to claim rewards)
                                              </div>
                                          )}
                                      </div>
                                  );
                              }).filter(Boolean);

                              return (
                                  <div className="space-y-2">
                                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Quests Advanced:</h4>
                                      <div className="space-y-2.5">
                                          {progressedQuests.length > 0 ? (
                                              progressedQuests
                                          ) : (
                                              <div className="text-slate-500 text-xs italic">No quests progressed in this match.</div>
                                          )}
                                      </div>
                                  </div>
                              );
                          })()}
                      </div>
                  )}

                  <div className="flex gap-4 justify-center pt-2">
                      <button onClick={handleQuitToTitle} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-xl shadow-lg shadow-indigo-500/30 transform transition-all hover:scale-105 active:scale-95">
                          {(() => {
                              let isCampaignGame = false;
                              try {
                                  isCampaignGame = sessionStorage.getItem('battle_is_campaign_game') === 'true';
                              } catch (e) {}
                              const isCampaignWin = isCampaignGame && gameState.winner === localPlayerId;
                              return isCampaignWin ? 'Next' : 'Rematch / Menu';
                          })()}
                      </button>
                  </div>
              </div>
          </div>
      )}

      <EndTurnModal show={ui.showEndTurnModal} onCancel={() => ui.setShowEndTurnModal(false)} onConfirm={() => { 
          ui.setShowEndTurnModal(false); 
          handlePhaseAction('AUTO_END_TURN'); 
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
        autoEndTurn={ui.autoEndTurn}
        onToggleAutoEndTurn={ui.toggleAutoEndTurn}
        onSyncState={gameState?.isOnline ? handleSyncState : undefined}
        sfxVolume={ui.sfxVolume}
        setSfxVolume={ui.setSfxVolume}
      />

      <DiscardModal 
        viewingDiscard={ui.viewingDiscard} 
        players={gameState.players} 
        onClose={() => ui.setViewingDiscard(null)} 
        mode={gameState.mode} 
      />

      {gameState.isOnline && status === 'DISCONNECTED' && (
          <div className="absolute top-4 inset-x-0 mx-auto w-max z-[150] bg-red-600/90 text-white px-4 py-2 rounded-full font-bold shadow-xl animate-in fade-in slide-in-from-top flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-300 animate-ping"></span>
              Connection Lost! P2P Peer Disconnected.
          </div>
      )}

      {effects.specialAnim && <SpecialCardAnimation type={effects.specialAnim.type} card={effects.specialAnim.card} targetRect={effects.specialAnim.targetRect} cardFace={effects.specialAnim.cardFace} cardBack={effects.specialAnim.cardBack} onComplete={() => effects.setSpecialAnim(null)} />}

      {effects.flyingCards.map(fc => (
          <Flyer key={fc.id} fc={fc} />
      ))}

      {effects.summoningCards.map(sc => (
          <Summoner key={sc.id} sc={sc} />
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
              const attackerEl = document.getElementById(attackerId as string);
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
      
      {sessionStorage.getItem('battle_is_preview_game') === 'true' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/95 hover:bg-slate-850 border border-indigo-500/60 shadow-[0_0_25px_rgba(99,102,241,0.35)] pl-5 pr-3 py-2 rounded-full flex items-center gap-4 pointer-events-auto transition-all animate-pulse">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#a5b4fc]">
                  Cosmetics Preview: <span className="text-amber-400 font-extrabold">{sessionStorage.getItem('battle_preview_name') || 'Cosmetic Theme'}</span>
              </span>
              <button
                  onClick={() => {
                      playSound('menu_click');
                      handleQuitToTitle();
                  }}
                  className="px-3.5 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase transition-all cursor-pointer shadow-md active:scale-95 font-title tracking-wider"
              >
                  Exit Preview
              </button>
          </div>
      )}
      
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
            progression={progression}
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
            progression={progression}
          />
      )}
    </div>
    </>
  );
};
