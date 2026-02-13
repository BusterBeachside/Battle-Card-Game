
import React, { useCallback, useEffect } from 'react';
import { GameState, Phase, TutorialStep, Rank, Suit } from '../types';
import { addLog } from '../utils/core';
import { playSound } from '../utils/soundUtils';
import { createTutorialCard } from '../utils/cards';
import { createFieldCard } from '../utils/rules';

interface UseTutorialProps {
    gameState: GameState | null;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    gameStateRef: React.MutableRefObject<GameState | null>;
    performEndTurn: () => void;
    confirmBlocks: () => void;
    refs: any;
    effects: any;
}

// Helper to create card within hook (avoiding imports if possible, but we imported helpers)
const createCard = (r: Rank, s: Suit) => createTutorialCard(r, s);

export const useTutorial = ({ 
    gameState, 
    setGameState, 
    gameStateRef, 
    performEndTurn, 
    confirmBlocks, 
    refs,
    effects
}: UseTutorialProps) => {

    const advanceTutorialStep = useCallback((actionType: 'CLICK_CARD' | 'CLICK_UI_BUTTON' | 'PLAY_CARD' | 'PHASE_CHANGE' | 'DECLARE_BLOCK' | 'NONE', targetId?: string) => {
        setGameState(prev => {
            if (!prev || !prev.tutorialState || !prev.tutorialState.active) return prev;
            
            const step = prev.tutorialState.steps[prev.tutorialState.currentStepIndex];
            if (!step) return prev;

            // Check Requirements
            if (step.requiredAction !== 'NONE') {
                 if (step.requiredAction !== actionType) return prev;
                 if (step.targetId && step.targetId !== targetId) return prev;
            }

            // Advance
            const nextIndex = prev.tutorialState.currentStepIndex + 1;
            if (nextIndex < prev.tutorialState.steps.length) {
                return {
                    ...prev,
                    tutorialState: {
                        ...prev.tutorialState,
                        currentStepIndex: nextIndex
                    }
                };
            } else {
                // End Tutorial and Save Progress
                if (prev.tutorialState.lessonId) {
                    localStorage.setItem(`battle_lesson_complete_${prev.tutorialState.lessonId}`, 'true');
                }
                
                // Play victory sound (using game_over sound) specifically for completion
                playSound('game_over');

                return {
                    ...prev,
                    tutorialState: { ...prev.tutorialState, active: false, completed: true },
                    logs: addLog(prev, "Lesson Complete!")
                };
            }
        });
    }, [setGameState]);

    const handleTutorialNext = useCallback(() => {
        const state = gameStateRef.current;
        // Special logic for Lesson 2 flow control (force block confirm after watching)
        if (state?.mode === 'TUTORIAL' && state.tutorialState?.lessonId === 'lesson-2') {
            const stepId = state.tutorialState.steps[state.tutorialState.currentStepIndex]?.id;
            if (stepId === 'l2-block-watch') {
                confirmBlocks(); // Force proceed to damage
            }
            else if (stepId === 'l2-result-expl') {
                performEndTurn(); 
            }
        }

        advanceTutorialStep('CLICK_UI_BUTTON', 'btn-tutorial-next');
    }, [gameStateRef, confirmBlocks, performEndTurn, advanceTutorialStep]);

    const isInteractionAllowed = useCallback((interactionId: string): boolean => {
        const state = gameStateRef.current;
        if (!state || state.mode !== 'TUTORIAL' || !state.tutorialState || !state.tutorialState.active) {
            return true; 
        }
        
        const step = state.tutorialState.steps[state.tutorialState.currentStepIndex];
        if (step.requiredAction === 'NONE') return false; 
        
        return step ? step.allowedInteractionIds.includes(interactionId) : false;
    }, [gameStateRef]);

    const handleGlobalClick = useCallback(() => {
        if (gameState?.tutorialState?.active) {
            const step = gameState.tutorialState.steps[gameState.tutorialState.currentStepIndex];
            if (step && step.requiredAction === 'NONE') {
                advanceTutorialStep('NONE');
            }
        }
    }, [gameState, advanceTutorialStep]);

    // Lesson Scripts (3 & 4)
    useEffect(() => {
        if (!gameState || !gameState.tutorialState || !gameState.tutorialState.active) return;
        const lessonId = gameState.tutorialState.lessonId;
        const stepId = gameState.tutorialState.steps[gameState.tutorialState.currentStepIndex]?.id;

        // --- LESSON 3 SCRIPTS ---
        if (lessonId === 'lesson-3') {
            // Failsafe for softlock at l3-p1-end:
            if (stepId === 'l3-p1-end' && gameState.phase !== Phase.MAIN && gameState.turnPlayer === 1) {
                 advanceTutorialStep('CLICK_UI_BUTTON', 'btn-end-turn-modal-confirm');
            }

            // Script 1: P2 Setup Resources & Turn Start
            if (stepId === 'l3-p2-turn-1-expl' && gameState.players[1].resources.length === 0) {
                 setGameState(prev => {
                     if (!prev) return null;
                     const p2 = prev.players[1];
                     const resCards = p2.hand.slice(0, 3);
                     const newHand = p2.hand.slice(3);
                     const newRes = resCards.map(c => createFieldCard(c, 1));
                     
                     // Simulate P2 Draw
                     const deck = [...prev.deck];
                     const drawn = deck.shift();
                     if (drawn) newHand.push(drawn);

                     const nextPlayers = [...prev.players];
                     nextPlayers[1] = { ...p2, hand: newHand, resources: newRes };

                     return {
                         ...prev,
                         players: nextPlayers,
                         deck,
                         phase: Phase.MAIN, // P2 Turn 1 Main Phase
                         turnPlayer: 1, // P2 Turn
                         turnCount: 1,
                         logs: addLog(prev, "Player 2 set up resources. Turn 1.")
                     };
                 });
            }

            // Script 2: P2 Ends Turn, P1 Draws 6S
            if (stepId === 'l3-p1-resource' && gameState.turnPlayer === 1) {
                 const c6S = createCard(Rank.Six, Suit.Spades);
                 
                 // Trigger Animation
                 if (refs.bottomDeckRef.current && refs.handRef.current) {
                     effects.triggerFlyer(
                         c6S, 
                         refs.bottomDeckRef.current.getBoundingClientRect(), 
                         refs.handRef.current.getBoundingClientRect()
                     );
                 }
                 playSound('draw');
                 // Trigger Turn Animation explicitly since we are bypassing performEndTurn
                 effects.setShowTurnAnim(true);

                 setGameState(prev => {
                     if(!prev) return null;
                     
                     const p1 = prev.players[0];
                     // Ensure 6S isn't in deck duplicates (by Rank/Suit)
                     const newDeck = prev.deck.filter(c => !(c.rank === c6S.rank && c.suit === c6S.suit));
                     const newHand = [...p1.hand, c6S];
                     
                     const nextPlayers = [...prev.players];
                     nextPlayers[0] = { ...p1, hand: newHand };
                     
                     return {
                         ...prev,
                         players: nextPlayers,
                         deck: newDeck,
                         turnPlayer: 0,
                         turnCount: 2, // P2 was Turn 1, so P1 is Turn 2
                         phase: Phase.RESOURCE_START,
                         logs: addLog(prev, "Turn 2: Player 1. Drew [6♠].")
                     };
                 });
            }
            
            // Script 4: P2 Turn 2 (Simulated)
            if (stepId === 'l3-p2-watch' && gameState.turnPlayer === 1) {
                const timer = setTimeout(() => {
                    // Trigger P2 Animation and Sound for Conscription
                    playSound('conscript_mag');
                    if (refs.cpuHandRef.current && document.getElementById('field-area')) {
                         const c4H = createCard(Rank.Four, Suit.Hearts);
                         effects.triggerFlyer(
                             c4H,
                             refs.cpuHandRef.current.getBoundingClientRect(),
                             document.getElementById('field-area')!.getBoundingClientRect()
                         );
                    }

                    setGameState(prev => {
                        if (!prev || !prev.tutorialState) return null;
                        const p2 = prev.players[1];
                        
                        // Simulate P2 Turn 2 actions: Draw, Add Res, Draw 4H, Play 4H
                        const deck = [...prev.deck];
                        
                        // 1. Draw
                        if (deck.length > 0) p2.hand.push(deck.shift()!);
                        // 2. Add Res
                        const resC = p2.hand.pop();
                        if (resC) p2.resources.push(createFieldCard(resC, 1));
                        // 3. Draw 4H (Force)
                        const c4H = createCard(Rank.Four, Suit.Hearts);
                        p2.hand.push(c4H);
                        // 4. Play 4H
                        const f4H = createFieldCard(c4H, 1);
                        f4H.isSummoningSick = true;
                        p2.hand.pop();
                        p2.field.push(f4H);

                        // 5. TAP P2 Resources for the 4H
                        let costToPay = 4;
                        p2.resources.forEach(r => {
                            if (costToPay > 0 && !r.isTapped) {
                                r.isTapped = true;
                                costToPay--;
                            }
                        });

                        const nextPlayers = [...prev.players];
                        nextPlayers[1] = p2;
                        
                        return {
                            ...prev,
                            players: nextPlayers,
                            deck,
                            logs: addLog(prev, "Player 2 took their turn: Played [4♥]."),
                            // AUTO ADVANCE TO l3-p2-result
                            tutorialState: {
                                ...prev.tutorialState,
                                currentStepIndex: prev.tutorialState.currentStepIndex + 1
                            }
                        };
                    });
                }, 2000); 
                return () => clearTimeout(timer);
            }

            // Script 5: P1 Turn 3 Start (After clicking Next on Result Screen)
            if (stepId === 'l3-swap-intro' && gameState.turnPlayer === 1) {
                // Ensure P1 starts turn now
                 const highSoldier = createCard(Rank.Nine, Suit.Clubs); 
                 
                 // Trigger Animation
                 if (refs.bottomDeckRef.current && refs.handRef.current) {
                     effects.triggerFlyer(
                         highSoldier, 
                         refs.bottomDeckRef.current.getBoundingClientRect(), 
                         refs.handRef.current.getBoundingClientRect()
                     );
                 }
                 playSound('draw');
                 effects.setShowTurnAnim(true);

                 setGameState(prev => {
                     if(!prev) return null;
                     const nextPlayers = [...prev.players];
                     const p1 = nextPlayers[0];
                     
                     // P1 setup for Turn 3
                     p1.hand.push(highSoldier);
                     p1.consecutiveDrawFailures = 0; 
                     p1.resources.forEach(r => r.isTapped = false);
                     p1.field.forEach(f => { f.isTapped = false; f.isSummoningSick = false; });

                     return {
                         ...prev,
                         players: nextPlayers,
                         turnPlayer: 0,
                         turnCount: 3, 
                         phase: Phase.RESOURCE_START,
                         logs: addLog(prev, "Turn 3: Player 1.")
                     };
                 });
            }
        }

        // --- LESSON 4 SCRIPTS ---
        if (lessonId === 'lesson-4') {
            // Script: Force P2 Attack when transitioning to 'l4-p2-attack'
            if (stepId === 'l4-p2-attack' && gameState.phase === Phase.MAIN && gameState.turnPlayer === 1) {
                setGameState(prev => {
                    if(!prev) return null;
                    const nextPlayers = [...prev.players];
                    const p2 = { ...nextPlayers[1] };
                    // Find 10S
                    const t10s = p2.field.find(f => f.card.rank === Rank.Ten && f.card.suit === Suit.Spades);
                    if(t10s) t10s.isTapped = true;
                    nextPlayers[1] = p2;
                    playSound('attack_phase'); // Added sound for better feedback
                    
                    return {
                        ...prev,
                        players: nextPlayers,
                        turnPlayer: 1,
                        phase: Phase.BLOCK_DECLARE,
                        pendingAttackers: t10s ? [t10s.instanceId] : [],
                        logs: addLog(prev, "CPU 2 attacks with [10♠].")
                    };
                });
            }

            // Script: P2 Ends Turn / P1 Start after Ace battle resolution
            if (stepId === 'l4-p1-turn' && gameState.turnPlayer === 1) {
                // Ensure correct state for P1 start
                playSound('turn_start');
                effects.setShowTurnAnim(true);
                
                // Draw J from top of rigged deck
                setTimeout(() => {
                    if (refs.bottomDeckRef.current && refs.handRef.current) {
                        const jS = createCard(Rank.Jack, Suit.Spades);
                        effects.triggerFlyer(
                            jS,
                            refs.bottomDeckRef.current.getBoundingClientRect(),
                            refs.handRef.current.getBoundingClientRect()
                        );
                        playSound('draw');
                    }
                }, 800);

                setGameState(prev => {
                    if(!prev) return null;
                    const nextPlayers = prev.players.map(p => ({
                        ...p,
                        hasAttackedThisTurn: false,
                        field: p.id === 0 ? p.field.map(f => ({...f, isTapped: false, isSummoningSick: false})) : p.field,
                        resources: p.id === 0 ? p.resources.map(r => ({...r, isTapped: false})) : p.resources
                    }));
                    
                    const p1 = nextPlayers[0];
                    // Draw the Jack
                    const drawnCard = prev.deck[0]; // J Spades
                    const newDeck = prev.deck.slice(1);
                    p1.hand = [...p1.hand, drawnCard];

                    // Resource Phase Skipped (10 Res)
                    
                    return {
                        ...prev,
                        players: nextPlayers,
                        deck: newDeck,
                        turnPlayer: 0,
                        turnCount: prev.turnCount + 1,
                        phase: Phase.MAIN,
                        logs: addLog(prev, "Your Turn. Resource Phase Skipped (Max).")
                    };
                });
            }
        }

    }, [gameState?.tutorialState?.currentStepIndex, gameState?.mode, gameState?.turnPlayer, gameState?.phase]);

    return {
        advanceTutorialStep,
        handleTutorialNext,
        isInteractionAllowed,
        handleGlobalClick
    };
};
