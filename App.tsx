
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
import { getSupabase, clearSupabaseInstance } from './utils/supabaseClient';
import { syncUserData, pushProgressionUpdate } from './utils/supabaseSync';
// Imported Components
import { TutorialCompleteScreen } from './components/screens/TutorialCompleteScreen';
import { CoinFlipOverlay } from './components/overlays/CoinFlipOverlay';
import { TurnChangeOverlay } from './components/overlays/TurnChangeOverlay';
import { TutorialOverlay } from './components/overlays/TutorialOverlay';
import { Confetti, Explosion, DamageOverlay } from './components/effects/VisualEffects';
import { Flyer, SpecialCardAnimation, SoulOrb, Summoner } from './components/effects/GameAnimations';
import { GameOverScreen } from './components/screens/GameOverScreen';
import { MainMenuBackground } from './components/effects/MainMenuBackground';
import { MainMenu } from './components/screens/MainMenu';
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

  // Underdog ID / Supabase States
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  // Gating state to prevent stale local progression from overwriting database records before synchronization is complete
  const [isInitialSyncCompleted, setIsInitialSyncCompleted] = useState<boolean>(false);

  // Ref to cache matching progression pushes and avoid redundant round-trips
  const lastPushedProgressionRef = useRef<string | null>(null);

  // Ref to gate active or pending sync session user ID
  const syncInProgressUserIdRef = useRef<string | null>(null);

  // Ref to track last synchronized settings to prevent infinite loops
  const prevProgSettingsRef = useRef<{
    autoSort: boolean | undefined;
    autoEndTurn: boolean | undefined;
    sfxVolume: number | undefined;
  }>({ autoSort: undefined, autoEndTurn: undefined, sfxVolume: undefined });

  // Sign out handler
  const handleSignOut = async () => {
    console.log("Initiating underdogs ID sign out process...");
    
    // 1. Instantly update React state so the UI reflects signed-out status immediately
    setSupabaseUser(null);
    setProgression(loadProgression());
    setIsInitialSyncCompleted(false);
    lastPushedProgressionRef.current = null;
    syncInProgressUserIdRef.current = null;
    
    // 2. Clear all cache/supabase keys in localStorage synchronously and immediately
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.startsWith('supabase.'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log("Immediately cleared Supabase keys from localStorage on signout:", keysToRemove);
    } catch (lsErr) {
      console.error("Failed to clear localStorage keys on signout:", lsErr);
    }

    // 3. Fire the remote signout safely raced with a 400ms timeout.
    // This allows the browser/network a fair window to invalidate the server side,
    // but ensures that iframe restrictions, timeouts, or lagging proxy pipelines
    // have returned control before the user can re-open the Login window,
    // avoiding async event clobbering or endless spinning during immediate re-login.
    const supabase = getSupabase();
    if (supabase) {
      try {
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((resolve) => setTimeout(resolve, 400))
        ]);
        console.log("Supabase signOut completed or timed out safely within 400ms constraint.");
      } catch (err) {
        console.error("Error during Supabase signOut:", err);
      }
    }
    
    // Clear Supabase Client singleton so that any subsequent login gets a fresh, clean client instance
    clearSupabaseInstance();
    
    console.log("Sign out completed. Progression reverted to offline profile state.");
  };

  // Auth success callback
  const handleAuthSuccess = (user: any, syncedProg: ProgressionData) => {
    syncInProgressUserIdRef.current = user.id;
    lastPushedProgressionRef.current = JSON.stringify(syncedProg);
    setIsInitialSyncCompleted(false);
    setSupabaseUser(user);
    setProgression(syncedProg);
    setIsInitialSyncCompleted(true);
  };

  // Track premium app startup loading state, checking if there is probably an active login session first
  const [isAppLoading, setIsAppLoading] = useState<boolean>(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('-auth-token'))) {
          return true;
        }
      }
    } catch (e) {}
    return false;
  });

  // Keep settings inside progression in sync with option/settings changes (Upward sync)
  useEffect(() => {
    setProgression(prev => {
      if (
        prev.autoSort === ui.autoSort &&
        prev.autoEndTurn === ui.autoEndTurn &&
        prev.sfxVolume === ui.sfxVolume
      ) {
        return prev;
      }
      const updated = {
        ...prev,
        autoSort: ui.autoSort,
        autoEndTurn: ui.autoEndTurn,
        sfxVolume: ui.sfxVolume
      };
      saveProgression(updated);
      return updated;
    });
  }, [ui.autoSort, ui.autoEndTurn, ui.sfxVolume]);

  // Keep options UI states in sync with (possibly cloud-sync'd) progression properties (Downward sync)
  useEffect(() => {
    const prev = prevProgSettingsRef.current;
    const current = {
      autoSort: progression.autoSort,
      autoEndTurn: progression.autoEndTurn,
      sfxVolume: progression.sfxVolume
    };

    // Only proceed if progression settings have actually changed from their last known values
    if (
      current.autoSort !== prev.autoSort ||
      current.autoEndTurn !== prev.autoEndTurn ||
      current.sfxVolume !== prev.sfxVolume
    ) {
      // Update ref with new known values
      prevProgSettingsRef.current = current;

      // Only overwrite UI if progression value is defined and doesn't match current UI state
      if (current.autoSort !== undefined && current.autoSort !== ui.autoSort) {
        ui.setAutoSort(current.autoSort);
        localStorage.setItem('battle_autosort', JSON.stringify(current.autoSort));
      }
      if (current.autoEndTurn !== undefined && current.autoEndTurn !== ui.autoEndTurn) {
        ui.setAutoEndTurn(current.autoEndTurn);
        localStorage.setItem('battle_auto_end_turn', JSON.stringify(current.autoEndTurn));
      }
      if (current.sfxVolume !== undefined && current.sfxVolume !== ui.sfxVolume) {
        ui.setSfxVolume(current.sfxVolume);
        localStorage.setItem('battle_sfx_volume', current.sfxVolume.toString());
      }
    }
  }, [progression.autoSort, progression.autoEndTurn, progression.sfxVolume]);

  // Safety fallback: if startup loading or sync gets stuck for some system or network reason, force-clear it to let the player proceed.
  useEffect(() => {
    if (isAppLoading) {
      const timer = setTimeout(() => {
        console.warn("[Sync Safety] Startup loader safety timeout reached (7.5s). Forcing load completion to bypass potential locks.");
        setIsAppLoading(false);
        setIsInitialSyncCompleted(true);
      }, 7500);
      return () => clearTimeout(timer);
    }
  }, [isAppLoading]);

  // Listen to Auth Changes on mount
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsAppLoading(false);
      setIsInitialSyncCompleted(true);
      return;
    }

    let isMounted = true;

    // Helper helper to race a promise against a timeout
    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> => {
      let timeoutId: any;
      const timeoutPromise = new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => {
          console.warn(`[Sync Safety] Connection/sync operation exceeded ${timeoutMs}ms limit. Falling back to offline/local progression state.`);
          resolve(fallbackValue);
        }, timeoutMs);
      });
      try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId);
        return result;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    // Listen for auth events as the single source of truth for the entire session lifecycle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      
      if (!isMounted) return;

      console.log(`[Sync Engine] Auth Event Triggered: "${event}". User ID:`, currentUser ? currentUser.id : "none");

      // 1. Update the Supabase user state
      setSupabaseUser(currentUser);

      if (currentUser) {
        // If we are already syncing or have successfully synced this exact user, bypass to avoid redundancy or race conditions
        if (syncInProgressUserIdRef.current === currentUser.id) {
          console.log(`[Sync Gate] Already matching active sync or completed sync in progress for user ${currentUser.id}. Bypassing extra trigger.`);
          // Clear loading screen immediately since we are already synced/syncing
          setIsAppLoading(false);
          return;
        }

        // Set the active sync ref to block redundant triggers
        syncInProgressUserIdRef.current = currentUser.id;
        
        // Ensure gated push is blocked during startup sync
        setIsInitialSyncCompleted(false);
        setIsAppLoading(true);

        try {
          console.log(`[Sync Engine] Initializing database synchronization for user ${currentUser.id}...`);
          
          const localFallback = { syncedData: loadProgression(), source: 'local' as const };
          // Wrap with a 5-second timeout fallback to prevent the sync process from blocking the loading screen forever
          const { syncedData } = await withTimeout(
            syncUserData(currentUser.id, localFallback.syncedData),
            5000,
            localFallback
          );
          
          if (isMounted && syncInProgressUserIdRef.current === currentUser.id) {
            // Update local progression state with the verified synced progression
            setProgression(syncedData);
            
            // Critical: Update the last pushed progression ref to match the freshly synced data.
            // This prevents the gated push useEffect from immediately pushing downloaded cloud data back to the DB!
            lastPushedProgressionRef.current = JSON.stringify(syncedData);
            
            // Mark initial sync complete to open the gateway for future local progress updates to push
            setIsInitialSyncCompleted(true);
            console.log("[Sync Engine] Synchronization finalized successfully.");
          }
        } catch (err) {
          console.error("[Sync Engine] Error syncing user progress:", err);
          // Recover gracefully to let the user play anyway
          if (isMounted && syncInProgressUserIdRef.current === currentUser.id) {
            setIsInitialSyncCompleted(true);
          }
        } finally {
          if (isMounted && syncInProgressUserIdRef.current === currentUser.id) {
            // Slight delay of 500ms to view the loading screen elegantly
            setTimeout(() => {
              if (isMounted) setIsAppLoading(false);
            }, 500);
          }
        }
      } else {
        // Safe reset if user is cleared or signed out
        console.log("[Sync Engine] No active session. Transitioning to Guest mode.");
        syncInProgressUserIdRef.current = null;
        lastPushedProgressionRef.current = null;
        setProgression(loadProgression());
        setIsInitialSyncCompleted(true); // Offline users need the gate open so their local progress saves correctly in client state
        setIsAppLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Synchronize campaign updates with React progression state to trigger cloud backup
  useEffect(() => {
    const handleCampaignUpdated = () => {
      try {
        const currentCampaign = loadCampaign();
        setProgression(prev => {
          if (JSON.stringify(prev.campaignState) === JSON.stringify(currentCampaign)) return prev;
          const next = { ...prev, campaignState: currentCampaign };
          try {
            localStorage.setItem('battle_card_progression_v1', JSON.stringify(next));
          } catch (err) {}
          return next;
        });
      } catch (e) {
        console.error("Error keeping campaign and progression state coupled:", e);
      }
    };
    window.addEventListener('campaign-updated', handleCampaignUpdated);
    return () => window.removeEventListener('campaign-updated', handleCampaignUpdated);
  }, []);

  // Automatically push progression updates to the cloud if signed in and synchronization is completed
  useEffect(() => {
    if (supabaseUser && isInitialSyncCompleted) {
      const progString = JSON.stringify(progression);
      if (lastPushedProgressionRef.current === progString) {
        console.log("[Sync Debug] Skipping push - Progression is identical to the last synchronized/pushed state.");
        return;
      }

      console.log("[Sync Debug] Gated push - Active synchronization complete. Saving push to database.");
      lastPushedProgressionRef.current = progString;
      pushProgressionUpdate(supabaseUser.id, progression);
    } else if (supabaseUser) {
      console.log("[Sync Debug] Blocked push - Initial synchronization is still in progress under user:", supabaseUser.id);
    }
  }, [progression, supabaseUser, isInitialSyncCompleted]);
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
  const broadcastRef = useRef<any>(null);

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
            broadcastRef.current?.({ type: 'DRAG_DROP', cardObj, targetInstanceId, targetElementId, sourceType, instanceId });
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
            case 'START_GAME': {
                setLocalPlayerId(1); // You are the guest
                const guestName = progression.playerName || "Player 2";
                const guestBack = progression.selectedCardBack || "battle";
                const guestFace = progression.selectedCardFace || "classic";

                // Update Guest Player's own info locally in the copied state
                const updatedState = { ...action.state };
                if (updatedState.players && updatedState.players[1]) {
                    updatedState.players[1] = {
                        ...updatedState.players[1],
                        name: guestName,
                        cardBack: guestBack,
                        cardFace: guestFace
                    };
                }
                setGameState(updatedState);

                if (action.coinFlipWinner !== undefined) {
                    setCoinFlipWinner(action.coinFlipWinner);
                    ui.setIsCoinFlipping(true);
                }
                ui.setMenuStep('MODE'); // Get out of setup

                // Broadcast guest's real info to the host!
                broadcastRef.current?.({
                    type: 'UPDATE_PLAYER_INFO',
                    playerId: 1,
                    name: guestName,
                    cardBack: guestBack,
                    cardFace: guestFace
                });
                break;
            }
            case 'UPDATE_PLAYER_INFO':
                setGameState(prev => {
                    if (!prev) return null;
                    const players = [...prev.players];
                    if (players[action.playerId]) {
                        players[action.playerId] = {
                            ...players[action.playerId],
                            name: action.name,
                            cardBack: action.cardBack,
                            cardFace: action.cardFace
                        };
                    }
                    return { ...prev, players };
                });
                break;
            case 'SYNC_STATE':
                setGameState(prev => {
                    if (!prev) return action.state;
                    const nextState = { ...action.state };
                    if (nextState.players && prev.players) {
                        nextState.players = nextState.players.map((p, idx) => {
                            const prevP = prev.players[idx];
                            if (!prevP) return p;
                            return {
                                ...p,
                                name: prevP.name || p.name,
                                cardBack: prevP.cardBack || p.cardBack,
                                cardFace: prevP.cardFace || p.cardFace
                            };
                        });
                    }
                    return nextState;
                });
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
    }, [setGameState, ui, interactions, progression]);

    const { peerId, status, error, isHost, connectToPeer, broadcast, disconnect, connection } = useMultiplayer(onActionReceived);
    broadcastRef.current = broadcast;

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
    }, [gameState, localPlayerId]);

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
      if (mode === 'SANDBOX') { 
          startGame('SANDBOX', { p1: false, p2: false }); 
          ui.setSandboxToolsOpen(true);
      } 
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
        updatedProg.campaignState = nextCampState;
        
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
          id === lessonId || 
          localStorage.getItem(`battle_lesson_complete_${id}`) === 'true' ||
          progression.claimedTutorialRewards?.includes(id)
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
          id === lessonId || 
          localStorage.getItem(`battle_lesson_complete_${id}`) === 'true' ||
          claimed.includes(id)
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

  // --- IN-GAME INITIAL DISCOVERY & SYNCHRONIZATION LOADING SCREEN ---
  if (isAppLoading) {
      return (
          <div className="relative flex flex-col items-center justify-center h-screen w-full bg-slate-950 overflow-hidden text-slate-100 selection:bg-indigo-500/30">
              <MainMenuBackground />
              <div className="z-10 flex flex-col items-center gap-6 max-w-sm px-6 py-8 rounded-3xl bg-slate-900/60 border border-slate-800/40 backdrop-blur-md shadow-2xl text-center">
                  
                  {/* Glowing Halos & Rotating Orbits */}
                  <div className="relative w-20 h-20 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/10 to-transparent rounded-full filter blur-xl animate-pulse"></div>
                      
                      {/* Active rotating spinner */}
                      <div className="absolute w-16 h-16 border-2 border-indigo-500/10 rounded-full"></div>
                      <div className="absolute w-16 h-16 border-t-2 border-r-2 border-indigo-400 rounded-full animate-spin"></div>
                      
                      {/* Innermost pulsing light */}
                      <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center animate-pulse">
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]"></div>
                      </div>
                  </div>
                  
                  <div className="space-y-1.5">
                      <h2 className="text-xl font-bold font-title uppercase tracking-widest text-[#a5b4fc]">
                          Loading Profile...
                      </h2>
                      <p className="text-[10px] text-slate-500 tracking-[0.2em] font-bold uppercase">
                          Synchronizing Progress
                      </p>
                  </div>
                  
                  <div className="h-4 flex items-center justify-center">
                      <p className="text-[11px] text-slate-400 font-medium font-mono animate-pulse">
                          {supabaseUser ? "Syncing data with server archives..." : "Checking user session credentials..."}
                      </p>
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
                supabaseUser={supabaseUser}
                onSignOut={handleSignOut}
                onAuthSuccess={handleAuthSuccess}
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
          <TutorialOverlay 
              step={gameState.tutorialState.steps[gameState.tutorialState.currentStepIndex]} 
              onNext={handleTutorialNext} 
              isCombatResolving={gameState.phase === Phase.DAMAGE}
          />
      )}

      {tutorialComplete && (
          <TutorialCompleteScreen 
             rewardClaimedThisSession={rewardClaimedThisSession}
             bonusClaimedThisSession={bonusClaimedThisSession}
             handleQuitToTitle={handleQuitToTitle}
          />
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
          <GameOverScreen 
            gameState={gameState}
            endGameRewards={endGameRewards}
            localPlayerId={localPlayerId}
            handleQuitToTitle={handleQuitToTitle}
          />
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
        isTutorial={gameState?.mode === 'TUTORIAL'}
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
