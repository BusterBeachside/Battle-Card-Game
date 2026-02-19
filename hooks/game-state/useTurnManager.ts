
import React, { useRef, useCallback } from 'react';
import { GameState, Phase, PlayerState, Card } from '../../types';
import { sortHand } from '../../utils/cards';
import { addLog } from '../../utils/core';
import { MAX_RESOURCES } from '../../constants';
import { playSound } from '../../utils/soundUtils';

interface UseTurnManagerProps {
    gameStateRef: React.MutableRefObject<GameState | null>;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    effects: any;
    refs: any;
    autoSort: boolean;
}

export const useTurnManager = ({ gameStateRef, setGameState, effects, refs, autoSort }: UseTurnManagerProps) => {
    
    const resolveTiebreaker = (state: GameState): GameState => {
        const p1 = state.players[0];
        const p2 = state.players[1];
        let reason = "";
        let winner: number | null = null;

        if (p1.life > p2.life) {
            winner = 0;
            reason = "Tiebreaker: Player 1 has higher Life.";
        } else if (p2.life > p1.life) {
            winner = 1;
            reason = "Tiebreaker: Player 2 has higher Life.";
        } else {
            const getFieldValue = (p: PlayerState) => p.field.reduce((acc, f) => acc + (f.card.rank === 'A' ? 1 : f.card.numericValue), 0);
            const val1 = getFieldValue(p1);
            const val2 = getFieldValue(p2);
            
            if (val1 > val2) {
                winner = 0;
                reason = `Tiebreaker: Life equal. Player 1 has stronger field (${val1} vs ${val2}).`;
            } else if (val2 > val1) {
                winner = 1;
                reason = `Tiebreaker: Life equal. Player 2 has stronger field (${val2} vs ${val1}).`;
            } else {
                winner = null; 
                reason = "Tiebreaker: Total Draw (Life & Field Value equal).";
            }
        }

        const nextState = { ...state, phase: Phase.GAME_OVER, logs: addLog(state, reason) };
        if (winner !== null) nextState.winner = winner;
        if (state.mode !== 'TUTORIAL') playSound('game_over');
        return nextState;
    };

    const checkGameOver = (state: GameState) => {
        if (state.players[0].life <= 0) state.winner = 1;
        else if (state.players[1].life <= 0) state.winner = 0;
        
        if (state.winner !== null) {
            state.phase = Phase.GAME_OVER;
            if (state.mode !== 'TUTORIAL') playSound('game_over');
        }
    };

    const drawCards = async (playerId: number, count: number) => {
        const startState = gameStateRef.current;
        if (!startState) return;
        const pIndex = startState.players.findIndex(p => p.id === playerId);
        const player = startState.players[pIndex];
        
        // Setup View Logic
        const isSpectate = startState.players[0].isCpu && startState.players[1].isCpu;
        const isHotseat = !startState.players[1].isCpu || startState.players[0].isCpu;
        const viewId = (isHotseat && !isSpectate) ? startState.turnPlayer : 0;
        const isBottom = playerId === viewId;
        
        // Show face if: It's me, OR it's spectate mode, OR it's hotseat turn
        const shouldShowFace = (!player.isCpu) || isSpectate || (isHotseat && playerId === startState.turnPlayer);

        // Extract cards from deck model
        const deck = startState.mode === 'STREET' || startState.mode === 'TUTORIAL' ? startState.deck : player.library;
        const cardsToDraw = deck.slice(0, Math.min(count, deck.length));
        const failuresNeeded = count - cardsToDraw.length;

        // 1. Remove from deck state immediately
        setGameState(prev => {
            if (!prev) return null;
            const nextPlayers = [...prev.players];
            const nextP = { ...nextPlayers[pIndex] };
            let nextDeck = prev.deck;
            
            // Remove drawn cards from deck
            if (prev.mode === 'STREET' || prev.mode === 'TUTORIAL') { 
                const drawnIds = cardsToDraw.map(c => c.id);
                nextDeck = prev.deck.filter(c => !drawnIds.includes(c.id)); 
            } else { 
                const drawnIds = cardsToDraw.map(c => c.id);
                nextP.library = nextP.library.filter(c => !drawnIds.includes(c.id)); 
            }
            nextPlayers[pIndex] = nextP;
            return { ...prev, deck: nextDeck, players: nextPlayers };
        });

        // 2. Animate and Add to Hand
        const isOpeningDraw = count > 1; // Treat bulk draws as opening draws (fast)

        if (isOpeningDraw) {
            // --- FAST STAGGERED DRAW ---
            const promises = cardsToDraw.map((card, index) => {
                return new Promise<void>(resolve => {
                    setTimeout(() => {
                        let startRect = isBottom ? refs.bottomDeckRef.current?.getBoundingClientRect() : refs.topDeckRef.current?.getBoundingClientRect();
                        let targetRect = isBottom ? refs.handRef.current?.getBoundingClientRect() : refs.cpuHandRef.current?.getBoundingClientRect();
                        
                        if (isSpectate && playerId === 1) {
                            startRect = refs.topDeckRef.current?.getBoundingClientRect();
                            targetRect = refs.cpuHandRef.current?.getBoundingClientRect();
                        }

                        if (startRect && targetRect) {
                            playSound('draw');
                            effects.triggerFlyer(
                                card, 
                                startRect, 
                                targetRect, 
                                shouldShowFace, 
                                () => {
                                    setGameState(prev => {
                                        if (!prev) return null;
                                        const nextPlayers = [...prev.players];
                                        const nextP = { ...nextPlayers[pIndex] };
                                        nextP.hand = [...nextP.hand, card];
                                        nextP.consecutiveDrawFailures = 0;
                                        if (autoSort) nextP.hand = sortHand(nextP.hand);
                                        nextPlayers[pIndex] = nextP;
                                        return { ...prev, players: nextPlayers };
                                    });
                                    resolve();
                                },
                                0 // No pause duration
                            );
                        } else {
                            // Fallback if refs missing
                            setGameState(prev => {
                                if (!prev) return null;
                                const nextPlayers = [...prev.players];
                                const nextP = { ...nextPlayers[pIndex] };
                                nextP.hand = [...nextP.hand, card];
                                if (autoSort) nextP.hand = sortHand(nextP.hand);
                                nextPlayers[pIndex] = nextP;
                                return { ...prev, players: nextPlayers };
                            });
                            resolve();
                        }
                    }, index * 60); // 60ms stagger for speed
                });
            });
            await Promise.all(promises);

        } else {
            // --- SEQUENTIAL DRAMATIC DRAW ---
            for (const card of cardsToDraw) {
                 let startRect = isBottom ? refs.bottomDeckRef.current?.getBoundingClientRect() : refs.topDeckRef.current?.getBoundingClientRect();
                 let targetRect = isBottom ? refs.handRef.current?.getBoundingClientRect() : refs.cpuHandRef.current?.getBoundingClientRect();
                 
                 if (isSpectate && playerId === 1) {
                     startRect = refs.topDeckRef.current?.getBoundingClientRect();
                     targetRect = refs.cpuHandRef.current?.getBoundingClientRect();
                 }

                 // Logic: Pause only if it is the player's own draw (bottom)
                 const shouldPause = isBottom;
                 const pauseDuration = shouldPause ? 500 : 0;

                 if (startRect && targetRect) { 
                     playSound('draw');
                     await new Promise<void>(resolve => {
                         // Pass callback to add to hand after animation
                         effects.triggerFlyer(
                             card, 
                             startRect!, 
                             targetRect!, 
                             shouldShowFace, 
                             () => {
                                 // This runs when flyer lands in hand
                                 setGameState(prev => {
                                     if (!prev) return null;
                                     const nextPlayers = [...prev.players];
                                     const nextP = { ...nextPlayers[pIndex] };
                                     nextP.hand = [...nextP.hand, card];
                                     nextP.consecutiveDrawFailures = 0;
                                     if (autoSort) nextP.hand = sortHand(nextP.hand);
                                     nextPlayers[pIndex] = nextP;
                                     return { ...prev, players: nextPlayers };
                                 });
                                 resolve();
                             },
                             pauseDuration 
                         );
                     });
                 } else {
                     // Fallback if no rects (e.g. initial load without layout)
                     setGameState(prev => {
                         if (!prev) return null;
                         const nextPlayers = [...prev.players];
                         const nextP = { ...nextPlayers[pIndex] };
                         nextP.hand = [...nextP.hand, card];
                         if (autoSort) nextP.hand = sortHand(nextP.hand);
                         nextPlayers[pIndex] = nextP;
                         return { ...prev, players: nextPlayers };
                     });
                 }
            }
        }

        if (cardsToDraw.length > 0) { 
            setGameState(prev => prev ? { ...prev, logs: addLog(prev, `${player.name} drew ${cardsToDraw.length} cards.`) } : null); 
        }
        
        if (failuresNeeded > 0) {
            setGameState(prev => {
                 if (!prev) return null;
                 const nextPlayers = prev.players.map(pl => pl.id === playerId ? { ...pl, consecutiveDrawFailures: pl.consecutiveDrawFailures + failuresNeeded } : pl);
                 const nextState = { ...prev, players: nextPlayers, logs: addLog(prev, `${player.name} deck empty!`) };
                 if (nextPlayers[0].consecutiveDrawFailures > 0 && nextPlayers[1].consecutiveDrawFailures > 0) {
                     return resolveTiebreaker(nextState);
                 }
                 return nextState;
            });
            setTimeout(() => { if (gameStateRef.current) checkGameOver(gameStateRef.current); }, 100);
        }
    };

    const advancePhase = (targetPhase: Phase, overrideState?: GameState) => {
        setGameState(prev => {
            if (!prev && !overrideState) return null;
            let newState = overrideState ? { ...overrideState } : { ...prev! };
            newState.phase = targetPhase;
            const player = newState.players[newState.turnPlayer];

            switch (targetPhase) {
                case Phase.UPKEEP:
                    newState.players.forEach(p => {
                        if (p.id === newState.turnPlayer) {
                            p.field.forEach(c => { c.isTapped = false; c.isSummoningSick = false; });
                            p.resources.forEach(r => r.isTapped = false);
                        }
                    });
                    newState.pendingAttackers = []; newState.pendingBlocks = {}; newState.selectedCardId = null; newState.recentDamage = {}; newState.activeCombatCardId = null;
                    player.hasAttackedThisTurn = false;
                    newState.logs = addLog(newState, `Turn ${newState.turnCount}: ${player.name}'s Upkeep.`);
                    playSound('turn_start');
                    setTimeout(() => advancePhase(Phase.DRAW), 800);
                    break;
                case Phase.DRAW:
                    if (newState.mode === 'TUTORIAL') {
                        // Tutorial Mode specific overrides might prevent drawing here, 
                        // handled by useTutorial hook logic usually.
                    }
                    setTimeout(() => {
                        drawCards(player.id, 1).then(() => {
                            setGameState(current => {
                                if(!current) return null;
                                if (current.phase === Phase.GAME_OVER) return current;

                                const p = current.players[current.turnPlayer];
                                const isTurn1FirstPlayer = current.turnCount === 1 && current.turnPlayer === current.startingPlayerId;
                                const hasMaxResources = p.resources.length >= MAX_RESOURCES;
                                if (isTurn1FirstPlayer || hasMaxResources) {
                                    setTimeout(() => advancePhase(Phase.MAIN), 400);
                                    return { ...current, phase: Phase.RESOURCE_START, logs: addLog(current, isTurn1FirstPlayer ? "Turn 1: Resource Step skipped." : "Max Resources reached.") };
                                } else { return { ...current, phase: Phase.RESOURCE_START, logs: addLog(current, "Resource Step.") }; }
                            });
                        });
                    }, 0);
                    break;
                case Phase.RESOURCE_START: break;
                case Phase.MAIN: newState.logs = addLog(newState, "Main Phase."); break;
                case Phase.ATTACK_DECLARE: newState.logs = addLog(newState, "Declare Attackers."); break;
                case Phase.BLOCK_DECLARE:
                    const defender = newState.players[newState.turnPlayer === 0 ? 1 : 0];
                    newState.logs = addLog(newState, `${defender.name} declares blocks.`);
                    break;
            }
            return newState;
        });
    };

    const performEndTurn = () => {
        setGameState(prev => {
            if(!prev) return null;
            if (prev.mode === 'TUTORIAL' && prev.tutorialState?.lessonId === 'lesson-2') {
                if (prev.turnPlayer === 0) {
                    const nextPlayers = [...prev.players];
                    const p2 = { ...nextPlayers[1] };
                    p2.field = p2.field.map(f => {
                        if (f.instanceId === 'tut-5-♥') return { ...f, isTapped: true };
                        return f;
                    });
                    nextPlayers[1] = p2;
                    const nextState = { ...prev, players: nextPlayers, turnPlayer: 1, phase: Phase.BLOCK_DECLARE }; 
                    nextState.pendingAttackers = ['tut-5-♥'];
                    nextState.logs = addLog(nextState, "CPU 2 attacks with [5♥].");
                    return nextState;
                } else if (prev.turnPlayer === 1) {
                    const nextPlayers = prev.players.map(p => ({
                        ...p,
                        hasAttackedThisTurn: false,
                        field: p.id === 0 ? p.field.map(f => ({...f, isTapped: false, isSummoningSick: false})) : p.field,
                        resources: p.id === 0 ? p.resources.map(r => ({...r, isTapped: false})) : p.resources
                    }));
                    const nextState = { ...prev, players: nextPlayers, turnPlayer: 0, turnCount: prev.turnCount + 1, phase: Phase.MAIN, logs: addLog(prev, "Your Turn.") };
                    return nextState;
                }
            }
            const nextPlayerIdx = prev.turnPlayer === 0 ? 1 : 0;
            const nextTurnCount = nextPlayerIdx === prev.startingPlayerId ? prev.turnCount + 1 : prev.turnCount;
            const nextState = { ...prev, turnPlayer: nextPlayerIdx, turnCount: nextTurnCount, phase: Phase.UPKEEP };
            setTimeout(() => advancePhase(Phase.UPKEEP, nextState), 0);
            return nextState; 
        });
        effects.setShowTurnAnim(true);
    };

    return { drawCards, advancePhase, performEndTurn, checkGameOver };
};
