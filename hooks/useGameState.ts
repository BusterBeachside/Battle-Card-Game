
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GameState, Phase, GameMode, PlayerState, Card, FieldCard, Rank, Color, Suit } from '../types';
import { createDeck, createTutorialDeck, sortHand, createTutorialCard } from '../utils/cards';
import { createFieldCard, getEffectiveColor } from '../utils/rules';
import { generateId, addLog, shuffle } from '../utils/core';
import { INITIAL_LIFE, MAX_RESOURCES } from '../constants';
import { TUTORIAL_LESSONS } from '../data/tutorials';
import { playSound } from '../utils/soundUtils';

interface GameStateRefs {
    handRef: React.RefObject<HTMLDivElement>;
    cpuHandRef: React.RefObject<HTMLDivElement>;
    topDeckRef: React.RefObject<HTMLDivElement>;
    bottomDeckRef: React.RefObject<HTMLDivElement>;
    topDiscardRef: React.RefObject<HTMLButtonElement | HTMLDivElement>;
    bottomDiscardRef: React.RefObject<HTMLButtonElement | HTMLDivElement>;
}

interface GameStateProps {
    effects: any; // Using explicit type in real implementation, simplified here for decoupling
    refs: GameStateRefs;
    autoSort: boolean;
}

export const useGameState = ({ effects, refs, autoSort }: GameStateProps) => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const gameStateRef = useRef<GameState | null>(null);
    const isDrawingInitialRef = useRef(false);

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    const formatCardLog = (card: Card) => `[${card.rank}${card.suit}]`;

    const getActiveDecisionPlayerId = (state: GameState): number => {
        if (state.mode === 'SANDBOX') {
            if (state.isSandboxRun) return state.turnPlayer;
            return state.turnPlayer; 
        }
        if (state.phase === Phase.BLOCK_DECLARE) return state.turnPlayer === 0 ? 1 : 0;
        return state.turnPlayer;
    };

    const startGame = useCallback((mode: GameMode, cpuConfig: { p1: boolean, p2: boolean }, lessonId?: string) => {
        let tutorialConfig = null;
        let initialPhase = mode === 'SANDBOX' ? Phase.MAIN : Phase.INIT_SELECT;
        let startingPlayerId = 0;
        
        if (mode === 'TUTORIAL' && lessonId) {
            tutorialConfig = TUTORIAL_LESSONS.find(l => l.id === lessonId);
            if (tutorialConfig && tutorialConfig.setup) {
                initialPhase = tutorialConfig.setup.phase || Phase.INIT_SELECT;
                if (tutorialConfig.setup.startingPlayerId !== undefined) {
                    startingPlayerId = tutorialConfig.setup.startingPlayerId;
                }
            }
        }

        let sharedDeck: Card[] = [];
        if (mode === 'STREET') {
            sharedDeck = createDeck();
        } else if (mode === 'TUTORIAL') {
            if (lessonId === 'lesson-3') {
                // Special Deck for Lesson 3: 
                // Exclude all Face Cards and Aces to prevent random tactic draws
                const fullDeck = createDeck();
                const allowedRanks = [Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten];
                const riggedDeck = fullDeck.filter(c => allowedRanks.includes(c.rank));
                sharedDeck = shuffle(riggedDeck);
            } else if (lessonId === 'lesson-4') {
                // Special Deck for Lesson 4: J, Q, K stacked on top
                const fullDeck = createDeck();
                // Filter out the specific cards we want to stack so we don't have duplicates
                let remainder = fullDeck.filter(c => 
                    !(c.rank === Rank.Jack && c.suit === Suit.Spades) &&
                    !(c.rank === Rank.Queen && c.suit === Suit.Clubs) &&
                    !(c.rank === Rank.King && c.suit === Suit.Diamonds)
                );
                remainder = shuffle(remainder);
                // Stack specific cards at the beginning (Draw order: Shift from array)
                // We want P1 to draw J first, then Q, then K.
                sharedDeck = [
                    createTutorialCard(Rank.Jack, Suit.Spades),
                    createTutorialCard(Rank.Queen, Suit.Clubs),
                    createTutorialCard(Rank.King, Suit.Diamonds),
                    ...remainder
                ];
            } else {
                sharedDeck = tutorialConfig?.setup ? createDeck() : createTutorialDeck();
            }

            // Filter out cards already used in setup
            if (tutorialConfig?.setup) {
                const usedCards: Card[] = [
                    ...(tutorialConfig.setup.p1Hand || []),
                    ...(tutorialConfig.setup.p1Resources || []),
                    ...(tutorialConfig.setup.p1Field || []),
                    ...(tutorialConfig.setup.p2Hand || []),
                    ...(tutorialConfig.setup.p2Resources || []),
                    ...(tutorialConfig.setup.p2Field || [])
                ];

                sharedDeck = sharedDeck.filter(deckCard => {
                    return !usedCards.some(used => used.rank === deckCard.rank && used.suit === deckCard.suit);
                });
            }
        }

        const createPlayer = (id: number, name: string, isCpu: boolean): PlayerState => {
            let hand: Card[] = [];
            let resources: FieldCard[] = [];
            let field: FieldCard[] = [];
            let life = INITIAL_LIFE;
            
            if (mode === 'TUTORIAL' && tutorialConfig?.setup) {
                if (id === 0) {
                    hand = tutorialConfig.setup.p1Hand || [];
                    resources = (tutorialConfig.setup.p1Resources || []).map(c => createFieldCard(c, 0));
                    if (tutorialConfig.setup.p1Field) {
                        field = tutorialConfig.setup.p1Field.map(c => {
                            const fc = createFieldCard(c, 0);
                            fc.instanceId = c.id; 
                            fc.isSummoningSick = false;
                            return fc;
                        });
                    }
                    if (tutorialConfig.setup.p1Life) life = tutorialConfig.setup.p1Life;
                } else {
                    hand = tutorialConfig.setup.p2Hand || [];
                    resources = (tutorialConfig.setup.p2Resources || []).map(c => createFieldCard(c, 1));
                    if (tutorialConfig.setup.p2Field) {
                        field = tutorialConfig.setup.p2Field.map(c => {
                            const fc = createFieldCard(c, 1);
                            fc.instanceId = c.id; 
                            fc.isSummoningSick = false;
                            return fc;
                        });
                    }
                    if (tutorialConfig.setup.p2Life) life = tutorialConfig.setup.p2Life;
                }
            }

            return {
                id, name, isCpu, life, hand, 
                library: mode === 'PRO' ? createDeck() : [],
                resources, field, discard: [],
                consecutiveDrawFailures: 0,
                hasAttackedThisTurn: false
            };
        };

        const p1 = createPlayer(0, cpuConfig.p1 ? "CPU 1" : "Player 1", cpuConfig.p1);
        const p2 = createPlayer(1, cpuConfig.p2 ? "CPU 2" : "Player 2", cpuConfig.p2);

        const initialState: GameState = {
            mode,
            deck: sharedDeck,
            players: [p1, p2],
            turnPlayer: initialPhase === Phase.INIT_SELECT ? 0 : startingPlayerId, 
            startingPlayerId: startingPlayerId, 
            phase: initialPhase,
            turnCount: 1,
            pendingAttackers: [],
            pendingBlocks: {},
            selectedCardId: null,
            activeCombatCardId: null,
            initSelectedIds: [],
            targetMode: 'NONE',
            sourceCardId: null,
            winner: null,
            recentDamage: {},
            logs: [{ id: generateId(), text: `Game Started. Mode: ${mode}.` }],
            tutorialState: mode === 'TUTORIAL' && tutorialConfig ? {
                active: true,
                lessonId,
                currentStepIndex: 0,
                steps: tutorialConfig.steps
            } : undefined
        };
        setGameState(initialState);
    }, []);

    const checkGameOver = (state: GameState) => {
        if (state.players[0].life <= 0) state.winner = 1;
        else if (state.players[1].life <= 0) state.winner = 0;
        
        if (state.winner !== null) {
            state.phase = Phase.GAME_OVER;
            if (state.mode !== 'TUTORIAL') playSound('game_over');
        }
    };

    const resolveTiebreaker = (state: GameState): GameState => {
        const p1 = state.players[0];
        const p2 = state.players[1];
        
        let reason = "";
        let winner: number | null = null; // null = draw

        // a. Higher Life
        if (p1.life > p2.life) {
            winner = 0;
            reason = "Tiebreaker: Player 1 has higher Life.";
        } else if (p2.life > p1.life) {
            winner = 1;
            reason = "Tiebreaker: Player 2 has higher Life.";
        } else {
            // b. Higher Field Value
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
                // c. Draw
                winner = null; 
                reason = "Tiebreaker: Total Draw (Life & Field Value equal).";
            }
        }

        const nextState = { ...state, phase: Phase.GAME_OVER, logs: addLog(state, reason) };
        if (winner !== null) nextState.winner = winner;
        
        if (state.mode !== 'TUTORIAL') playSound('game_over');
        return nextState;
    };

    const drawCards = async (playerId: number, count: number) => {
        const startState = gameStateRef.current;
        if (!startState) return;
        const pIndex = startState.players.findIndex(p => p.id === playerId);
        const isSpectate = startState.players[0].isCpu && startState.players[1].isCpu;
        const isHotseat = !startState.players[1].isCpu || startState.players[0].isCpu;
        const viewId = (isHotseat && !isSpectate) ? startState.turnPlayer : 0;
        const isBottom = playerId === viewId;
        
        const deck = startState.mode === 'STREET' || startState.mode === 'TUTORIAL' ? startState.deck : startState.players[pIndex].library;
        const cardsToDraw = deck.slice(0, Math.min(count, deck.length));
        const failuresNeeded = count - cardsToDraw.length;

        for (const card of cardsToDraw) {
             let startRect = isBottom ? refs.bottomDeckRef.current?.getBoundingClientRect() : refs.topDeckRef.current?.getBoundingClientRect();
             let targetRect = isBottom ? refs.handRef.current?.getBoundingClientRect() : refs.cpuHandRef.current?.getBoundingClientRect();
             
             if (isSpectate && playerId === 1) {
                 startRect = refs.topDeckRef.current?.getBoundingClientRect();
                 targetRect = refs.cpuHandRef.current?.getBoundingClientRect();
             }

             if (startRect && targetRect) { effects.triggerFlyer(card, startRect, targetRect); }
             
             playSound('draw');

             setGameState(prev => {
                 if (!prev) return null;
                 const nextPlayers = [...prev.players];
                 const nextP = { ...nextPlayers[pIndex] };
                 let nextDeck = prev.deck;
                 if (prev.mode === 'STREET' || prev.mode === 'TUTORIAL') { nextDeck = prev.deck.filter(c => c.id !== card.id); } 
                 else { nextP.library = nextP.library.filter(c => c.id !== card.id); }
                 nextP.hand = [...nextP.hand, card];
                 // Reset consecutive failure on successful draw
                 nextP.consecutiveDrawFailures = 0;
                 if (autoSort) nextP.hand = sortHand(nextP.hand);
                 nextPlayers[pIndex] = nextP;
                 return { ...prev, deck: prev.mode === 'STREET' || prev.mode === 'TUTORIAL' ? nextDeck : prev.deck, players: nextPlayers };
             });
             await new Promise(r => setTimeout(r, 100)); // Increased slighty for sound pacing
        }
        if (cardsToDraw.length > 0) { setGameState(prev => prev ? { ...prev, logs: addLog(prev, `${startState.players[pIndex].name} drew ${cardsToDraw.length} cards.`) } : null); }
        
        if (failuresNeeded > 0) {
            setGameState(prev => {
                 if (!prev) return null;
                 const nextPlayers = prev.players.map(pl => pl.id === playerId ? { ...pl, consecutiveDrawFailures: pl.consecutiveDrawFailures + failuresNeeded } : pl);
                 const nextState = { ...prev, players: nextPlayers, logs: addLog(prev, `${prev.players[pIndex].name} deck empty!`) };
                 
                 // Tiebreaker Check
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
                        // Tutorial Mode: Draw logic is sometimes handled by scripts, but default to engine
                        // For Lesson 3 P2 turn, we rely on the engine to draw the card
                    }
                    setTimeout(() => {
                        drawCards(player.id, 1).then(() => {
                            setGameState(current => {
                                if(!current) return null;
                                // Check if game over triggered during draw
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

    const playCard = async (card: Card, targetId?: string, targetOwnerId?: number) => {
        let cardIdx = -1; let playedCard: Card | null = null;
        const isFaceCard = ['K', 'Q', 'J'].includes(card.rank);
        const currentState = gameStateRef.current;
        if (!currentState) return;

        if (card.rank === 'K' || card.rank === 'Q') {
            if (!targetId || targetOwnerId === undefined) return;
            const targetP = currentState.players.find(p => p.id === targetOwnerId);
            const targetF = targetP?.field.find(f => f.instanceId === targetId);
            if (!targetF) return; 
            if (card.rank === 'K' && getEffectiveColor(targetF) !== card.baseColor) { 
                setGameState(prev => prev ? ({ ...prev, logs: addLog(prev, "Invalid Target: Color mismatch.") }) : null);
                return; 
            }
        }

        // Trigger Sounds
        if (isFaceCard) {
            playSound('tactic');
            if (card.rank === 'K') playSound('king');
            if (card.rank === 'Q') playSound('queen');
        } else {
            if (card.baseColor === Color.Red) playSound('conscript_mag');
            else playSound('conscript_phy');
        }

        if (isFaceCard) {
            let targetRect: DOMRect | undefined;
            if (targetId) { const targetEl = document.getElementById(targetId); if (targetEl) targetRect = targetEl.getBoundingClientRect(); }
            effects.setSpecialAnim({ type: card.rank as 'K'|'Q'|'J', card, targetRect });
            await new Promise(r => setTimeout(r, card.rank === 'K' ? 1200 : card.rank === 'Q' ? 1000 : 800));
            effects.setSpecialAnim(null);
        } else {
            const cardEl = document.getElementById(card.id);
            const fieldEl = document.getElementById('field-area');
            if (cardEl && fieldEl) {
                await effects.triggerFlyer(card, cardEl.getBoundingClientRect(), fieldEl.getBoundingClientRect());
            }
        }

        setGameState(prev => {
            if (!prev) return null;
            const p = prev.players[prev.turnPlayer];
            cardIdx = p.hand.findIndex(c => c.id === card.id);
            if (cardIdx === -1) return prev;
            const newHand = [...p.hand];
            [playedCard] = newHand.splice(cardIdx, 1);
            let toTap = card.cost;
            const newResources = p.resources.map(r => {
                if (!r.isTapped && toTap > 0) { toTap--; return { ...r, isTapped: true }; }
                return r;
            });
            const nextState = { ...prev, players: [...prev.players] };
            const nextPlayer = { ...p, hand: newHand, resources: newResources };
            nextState.players[prev.turnPlayer] = nextPlayer;
            
            if (card.rank === 'J') { 
                nextPlayer.discard.push(playedCard!); 
                return { ...nextState, logs: addLog(nextState, `Played Jack ${formatCardLog(card)}.`) }; 
            } else if (card.rank === 'K') {
                const targetP = nextState.players[targetOwnerId!];
                const targetFIdx = targetP.field.findIndex(f => f.instanceId === targetId);
                if (targetFIdx === -1) return prev; 
                const targetF = targetP.field[targetFIdx];
                if (getEffectiveColor(targetF) !== card.baseColor) return prev;
                effects.triggerExplosion(targetId!); 
                playSound('destroy');
                effects.triggerScreenShake(4); // Heavy shake for King
                
                // Trigger Soul Trail for King Kill
                const isSpectate = nextState.players[0].isCpu && nextState.players[1].isCpu;
                const isHotseat = !nextState.players[1].isCpu || nextState.players[0].isCpu;
                const viewId = (isHotseat && !isSpectate) ? nextState.turnPlayer : 0;
                const isTop = targetOwnerId !== viewId;
                const targetRef = isTop ? refs.topDiscardRef : refs.bottomDiscardRef;
                
                if (targetRef.current && targetId) {
                    const trailColor = getEffectiveColor(targetF) === Color.Red ? 'red' : 'cyan';
                    effects.triggerSoulTrail(targetId, targetRef.current.getBoundingClientRect(), trailColor);
                }

                nextPlayer.discard.push(playedCard!); 
                targetP.field.splice(targetFIdx, 1); 
                targetP.discard.push(targetF.card, ...targetF.attachedCards);
                return { ...nextState, logs: addLog(nextState, `King ${formatCardLog(card)} executed ${formatCardLog(targetF.card)}.`) };
            } else if (card.rank === 'Q') {
                const targetP = nextState.players[targetOwnerId!];
                const targetF = targetP.field.find(f => f.instanceId === targetId);
                if(targetF) {
                    const existingQueens = targetF.attachedCards.filter(c => c.rank === Rank.Queen);
                    if (existingQueens.length > 0) { targetP.discard.push(...existingQueens); targetF.attachedCards = targetF.attachedCards.filter(c => c.rank !== Rank.Queen); }
                    targetF.attachedCards.push(playedCard!);
                }
                return { ...nextState, logs: addLog(nextState, `Queen ${formatCardLog(card)} shifted ${targetF ? formatCardLog(targetF.card) : 'target'}.`) };
            } else {
                const newSoldier = createFieldCard(playedCard!, p.id); 
                if (prev.mode === 'TUTORIAL') {
                    newSoldier.instanceId = card.id;
                }
                nextPlayer.field.push(newSoldier);
                return { ...nextState, logs: addLog(nextState, `Conscripted ${formatCardLog(card)}.`) };
            }
        });

        if (card.rank === 'J' && gameStateRef.current) { await drawCards(gameStateRef.current.turnPlayer, 2); }
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

    const confirmAttack = () => {
        // Play tap sound if attackers are declared
        if (gameStateRef.current && gameStateRef.current.pendingAttackers.length > 0) {
            playSound('draw');
        }

        setGameState(prev => {
            if(!prev) return null;
            if (prev.mode === 'TUTORIAL' && prev.tutorialState?.lessonId === 'lesson-2' && prev.turnPlayer === 0 && prev.phase === Phase.ATTACK_DECLARE) {
                if (prev.turnCount > 1) {
                    const p = prev.players[0];
                    const attackers = p.field.filter(f => prev.pendingAttackers.includes(f.instanceId));
                    const attackerNames = attackers.map(f => formatCardLog(f.card)).join(', ');
                    p.field.forEach(f => { if (prev.pendingAttackers.includes(f.instanceId)) f.isTapped = true; });
                    p.hasAttackedThisTurn = true;
                    return { ...prev, phase: Phase.DAMAGE, logs: addLog(prev, `${p.name} attacks with ${attackerNames}. Direct Hit!`) };
                }
                const blocks: Record<string, string> = {};
                blocks['tut-2-♠'] = 'tut-2-♣';
                const p = prev.players[0];
                const attackers = p.field.filter(f => prev.pendingAttackers.includes(f.instanceId));
                const attackerNames = attackers.map(f => formatCardLog(f.card)).join(', ');
                p.field.forEach(f => { if (prev.pendingAttackers.includes(f.instanceId)) f.isTapped = true; });
                p.hasAttackedThisTurn = true;
                return { ...prev, pendingBlocks: blocks, phase: Phase.BLOCK_DECLARE, logs: addLog(prev, `${p.name} attacks with ${attackerNames}.`) };
            }
            if (prev.pendingAttackers.length === 0) return { ...prev, phase: Phase.MAIN, logs: addLog(prev, "No attacks declared.") };
            const p = prev.players[prev.turnPlayer];
            const attackers = p.field.filter(f => prev.pendingAttackers.includes(f.instanceId));
            const attackerNames = attackers.map(f => formatCardLog(f.card)).join(', ');
            p.field.forEach(f => { if (prev.pendingAttackers.includes(f.instanceId)) f.isTapped = true; });
            p.hasAttackedThisTurn = true;
            const defender = prev.players[prev.turnPlayer === 0 ? 1 : 0];
            const attackingColors = new Set(attackers.map(getEffectiveColor));
            const untappedDefenders = defender.field.filter(f => !f.isTapped);
            const canDefend = untappedDefenders.some(def => attackingColors.has(getEffectiveColor(def)));
            if (!canDefend) return { ...prev, phase: Phase.DAMAGE, logs: addLog(prev, `${p.name} attacks with ${attackerNames}. Direct Hit!`) };
            return { ...prev, phase: Phase.BLOCK_DECLARE, logs: addLog(prev, `${p.name} attacks with ${attackerNames}.`) };
        });
    };

    const confirmBlocks = () => { setGameState(prev => prev ? { ...prev, phase: Phase.DAMAGE } : null); };

    // Resolve Combat Loop
    useEffect(() => { 
        if (gameState?.phase === Phase.DAMAGE) {
            (async () => {
                const state = gameStateRef.current!;
                const attackerPlayer = state.players[state.turnPlayer];
                const defenderPlayer = state.players[state.turnPlayer === 0 ? 1 : 0];
                const attackers = attackerPlayer.field.filter(f => state.pendingAttackers.includes(f.instanceId));
                const directAttackers = attackers.filter(atk => !Object.values(state.pendingBlocks).includes(atk.instanceId));
                
                // Helper to trigger death effects
                const handleCardDeath = (cardInstanceId: string, ownerId: number) => {
                    const isHotseat = !state.players[1].isCpu || state.mode === 'SANDBOX';
                    const viewId = (isHotseat) ? state.turnPlayer : 0;
                    const isTop = ownerId !== viewId;
                    
                    const targetRef = isTop ? refs.topDiscardRef : refs.bottomDiscardRef;
                    const dyingCard = state.players.find(p => p.id === ownerId)?.field.find(f => f.instanceId === cardInstanceId);
                    
                    if (targetRef.current && dyingCard) {
                        const trailColor = getEffectiveColor(dyingCard) === Color.Red ? 'red' : 'cyan';
                        effects.triggerSoulTrail(cardInstanceId, targetRef.current.getBoundingClientRect(), trailColor);
                    }
                    effects.triggerExplosion(cardInstanceId);
                };

                // Blocked Combats
                for (const atk of attackers) {
                    const blockerId = Object.keys(state.pendingBlocks).find(k => state.pendingBlocks[k] === atk.instanceId);
                    if (blockerId) {
                        setGameState(prev => prev ? { ...prev, activeCombatCardId: atk.instanceId } : null);
                        playSound('menu_click'); // Lunge sound
                        
                        await new Promise(r => setTimeout(r, 400));
                        setGameState(prev => {
                            if (!prev) return null;
                            const blk = defenderPlayer.field.find(f => f.instanceId === blockerId);
                            if (!blk) return prev;
                            const nextRecentDamage = { ...prev.recentDamage };
                            nextRecentDamage[atk.instanceId] = blk.card.numericValue;
                            nextRecentDamage[blk.instanceId] = atk.card.numericValue;
                            const logMsg = `⚔️ Battle: ${formatCardLog(atk.card)} (${atk.card.numericValue}) vs ${formatCardLog(blk.card)} (${blk.card.numericValue})`;
                            return { ...prev, recentDamage: nextRecentDamage, logs: addLog(prev, logMsg) };
                        });
                        await new Promise(r => setTimeout(r, 600)); 
                        setGameState(prev => prev ? { ...prev, activeCombatCardId: null } : null);
                        await new Promise(r => setTimeout(r, 100));
                    }
                }
                
                // Direct Attacks
                for (const atk of directAttackers) {
                    setGameState(prev => prev ? { ...prev, activeCombatCardId: atk.instanceId } : null);
                    
                    // Shake Intensity for direct attacks
                    const shakeIntensity = atk.card.rank === 'A' ? 1 : Math.min(4, Math.ceil(atk.card.numericValue / 2.5));
                    effects.triggerScreenShake(shakeIntensity);

                    const val = atk.card.numericValue;
                    if (val <= 4 || atk.card.rank === 'A') playSound('damage_sm');
                    else if (val <= 7) playSound('damage_md');
                    else playSound('damage_lg');

                    await new Promise(r => setTimeout(r, 200));
                    const dmg = atk.card.rank === 'A' ? 1 : atk.card.numericValue;
                    
                    const applyDamage = () => {
                        setGameState(prev => {
                            if (!prev) return null;
                            const nextPlayers = [...prev.players];
                            const defIdx = nextPlayers.findIndex(p => p.id === defenderPlayer.id);
                            if (defIdx > -1) { 
                                nextPlayers[defIdx] = { ...nextPlayers[defIdx], life: Math.max(0, nextPlayers[defIdx].life - dmg) }; 
                            }
                            let nextState = { ...prev, players: nextPlayers };
                            return nextState;
                        });
                    };
                    effects.addDamageAnim(dmg, defenderPlayer.id, applyDamage);

                    setGameState(prev => prev ? { ...prev, logs: addLog(prev, `🔥 Direct Hit! ${formatCardLog(atk.card)} deals ${dmg} damage.`) } : null);
                    // Wait longer than animation (1200ms) to ensure impact happens before next loop or cleanup
                    await new Promise(r => setTimeout(r, 1250)); 
                    setGameState(prev => prev ? { ...prev, activeCombatCardId: null } : null);
                }

                // Cleanup Phase - SEQUENTIAL ANIMATION
                // Re-fetch state because life totals might have changed during direct attacks
                const finalState = gameStateRef.current!;
                const activeAtkIds = finalState.pendingAttackers;
                const dyingData: { instanceId: string, ownerId: number }[] = [];

                // 1. Identify Deaths (Read-Only)
                // Need to re-calculate based on current field state (which hasn't changed structure yet, just values in React state possibly)
                // We use the same logic as before but store it first.
                const fAtkP = finalState.players[finalState.turnPlayer];
                const fDefP = finalState.players[finalState.turnPlayer === 0 ? 1 : 0];
                
                const activeAtk = fAtkP.field.filter(f => activeAtkIds.includes(f.instanceId));

                for (const atk of activeAtk) {
                     const blockerId = Object.keys(finalState.pendingBlocks).find(k => finalState.pendingBlocks[k] === atk.instanceId);
                     if (blockerId) {
                         const blk = fDefP.field.find(f => f.instanceId === blockerId);
                         if (blk) {
                             const atkVal = atk.card.numericValue; 
                             const blkVal = blk.card.numericValue;
                             const atkIsAce = atk.card.rank === 'A'; 
                             const blkIsAce = blk.card.rank === 'A';
                             
                             let atkDies = false; let blkDies = false;
                             
                             if (atkIsAce) blkDies = true; 
                             if (blkIsAce) atkDies = true;
                             
                             if (!atkIsAce && !blkIsAce) {
                                 if (atkVal > blkVal) blkDies = true; 
                                 else if (blkVal > atkVal) atkDies = true; 
                                 else { atkDies = true; blkDies = true; }
                             } else { 
                                 if(atkIsAce && !blkIsAce) atkDies = true; 
                                 if(blkIsAce && !atkIsAce) blkDies = true; 
                             }

                             if (atkDies) { dyingData.push({ instanceId: atk.instanceId, ownerId: fAtkP.id }); }
                             if (blkDies) { dyingData.push({ instanceId: blk.instanceId, ownerId: fDefP.id }); }
                         }
                     }
                }

                // 2. Trigger Animations Staggered AND REMOVE CARDS IMMEDIATELY
                if (dyingData.length > 0) {
                    for (const d of dyingData) {
                        handleCardDeath(d.instanceId, d.ownerId); // Visual Effect
                        playSound('destroy');
                        
                        // Immediately remove the specific card to sync with explosion
                        setGameState(prev => {
                            if (!prev) return null;
                            const nextState = { ...prev };
                            const nextPlayers = [...nextState.players];
                            
                            const pIndex = nextPlayers.findIndex(p => p.id === d.ownerId);
                            if (pIndex > -1) {
                                const p = { ...nextPlayers[pIndex] };
                                const fIndex = p.field.findIndex(f => f.instanceId === d.instanceId);
                                if (fIndex > -1) {
                                    const [dead] = p.field.splice(fIndex, 1);
                                    p.discard = [...p.discard, dead.card, ...dead.attachedCards];
                                    nextPlayers[pIndex] = p;
                                }
                            }
                            
                            return { ...nextState, players: nextPlayers };
                        });

                        await new Promise(r => setTimeout(r, 200)); // Stagger delay
                    }
                    // Wait a little extra for the last explosion/soul trail to traverse
                    await new Promise(r => setTimeout(r, 600));
                }

                // 3. Final State Update (Phase change, clear pending)
                setGameState(prev => {
                    if (!prev) return null;
                    const nextState = { ...prev };
                    
                    nextState.recentDamage = {}; 
                    nextState.pendingAttackers = []; 
                    nextState.pendingBlocks = {}; 
                    nextState.phase = Phase.MAIN;
                    
                    // Game Over Check (re-check with latest life totals)
                    if (nextState.players[0].life <= 0) nextState.winner = 1;
                    else if (nextState.players[1].life <= 0) nextState.winner = 0;
                    
                    if (nextState.winner !== null) {
                        nextState.phase = Phase.GAME_OVER;
                        if (nextState.mode !== 'TUTORIAL') playSound('game_over');
                    }
                    return nextState;
                });

            })();
        }
    }, [gameState?.phase]);

    return {
        gameState, setGameState, gameStateRef,
        startGame,
        drawCards,
        playCard,
        advancePhase,
        performEndTurn,
        confirmAttack,
        confirmBlocks,
        isDrawingInitialRef,
        getActiveDecisionPlayerId
    };
};
