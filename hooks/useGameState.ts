
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GameState, Phase, GameMode, PlayerState, Card, FieldCard, Rank, Suit } from '../types';
import { createDeck, createTutorialDeck, createTutorialCard } from '../utils/cards';
import { createFieldCard } from '../utils/rules';
import { generateId, shuffle } from '../utils/core';
import { INITIAL_LIFE } from '../constants';
import { TUTORIAL_LESSONS } from '../data/tutorials';
import { useTurnManager } from './game-state/useTurnManager';
import { useCardActions } from './game-state/useCardActions';
import { useCombatSystem } from './game-state/useCombatSystem';

interface GameStateRefs {
    handRef: React.RefObject<HTMLDivElement>;
    cpuHandRef: React.RefObject<HTMLDivElement>;
    topDeckRef: React.RefObject<HTMLDivElement>;
    bottomDeckRef: React.RefObject<HTMLDivElement>;
    topDiscardRef: React.RefObject<HTMLButtonElement | HTMLDivElement>;
    bottomDiscardRef: React.RefObject<HTMLButtonElement | HTMLDivElement>;
}

interface GameStateProps {
    effects: any;
    refs: GameStateRefs;
    autoSort: boolean;
}

export const useGameState = ({ effects, refs, autoSort }: GameStateProps) => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const gameStateRef = useRef<GameState | null>(null);
    const isDrawingInitialRef = useRef(false);

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    // --- SUB-HOOKS ---
    const { drawCards, advancePhase, performEndTurn, checkGameOver } = useTurnManager({ 
        gameStateRef, setGameState, effects, refs, autoSort 
    });

    const { playCard } = useCardActions({ 
        gameStateRef, setGameState, effects, refs, drawCards 
    });

    const { confirmAttack, confirmBlocks } = useCombatSystem({ 
        gameState, gameStateRef, setGameState, effects, refs 
    });

    const getActiveDecisionPlayerId = (state: GameState): number => {
        if (state.mode === 'SANDBOX') {
            if (state.isSandboxRun) return state.turnPlayer;
            return state.turnPlayer; 
        }
        if (state.phase === Phase.BLOCK_DECLARE) return state.turnPlayer === 0 ? 1 : 0;
        return state.turnPlayer;
    };

    const startGame = useCallback((mode: GameMode, cpuConfig: { p1: boolean, p2: boolean }, lessonId?: string, isMultiBlockingEnabled?: boolean) => {
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
                const fullDeck = createDeck();
                const allowedRanks = [Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten];
                const riggedDeck = fullDeck.filter(c => allowedRanks.includes(c.rank));
                sharedDeck = shuffle(riggedDeck);
            } else if (lessonId === 'lesson-4') {
                const fullDeck = createDeck();
                let remainder = fullDeck.filter(c => 
                    !(c.rank === Rank.Jack && c.suit === Suit.Spades) &&
                    !(c.rank === Rank.Queen && c.suit === Suit.Clubs) &&
                    !(c.rank === Rank.King && c.suit === Suit.Diamonds)
                );
                remainder = shuffle(remainder);
                sharedDeck = [
                    createTutorialCard(Rank.Jack, Suit.Spades),
                    createTutorialCard(Rank.Queen, Suit.Clubs),
                    createTutorialCard(Rank.King, Suit.Diamonds),
                    ...remainder
                ];
            } else {
                sharedDeck = tutorialConfig?.setup ? createDeck() : createTutorialDeck();
            }

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
            isMultiBlockingEnabled: isMultiBlockingEnabled || false,
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
