
import React, { useEffect } from 'react';
import { GameState, Phase } from '../types';
import { getCpuInitSelection, getCpuResourceDecision, getBestMainPhaseAction, getCpuAttackers, getCpuBlocks } from '../utils/ai';

interface UseGameAIProps {
    gameState: GameState | null;
    gameStateRef: React.MutableRefObject<GameState | null>;
    actions: {
        setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
        advancePhase: (p: Phase) => void;
        performEndTurn: () => void;
        playCard: (c: any, targetId?: string, targetOwnerId?: number) => void;
        confirmAttack: () => void;
        confirmBlocks: () => void;
        handleCardClick: (card: any, location: 'HAND' | 'RESOURCE', ownerId: number, instanceId?: string, fromCpu?: boolean) => void; 
        handleConfirmInitSelection: () => void;
        getActiveDecisionPlayerId: (s: GameState) => number;
    };
    isCoinFlipping: boolean;
    showMenu: boolean;
    showTurnAnim: boolean;
}

export const useGameAI = ({ gameState, gameStateRef, actions, isCoinFlipping, showMenu, showTurnAnim }: UseGameAIProps) => {
    
    useEffect(() => {
        if (showMenu || showTurnAnim || !gameState || gameState.phase === Phase.GAME_OVER || isCoinFlipping) return;
        if (gameState.mode === 'SANDBOX' && !gameState.isSandboxRun) return; 
        if (gameState.mode === 'TUTORIAL') return;

        const activePlayerId = actions.getActiveDecisionPlayerId(gameState);
        const activePlayer = gameState.players[activePlayerId];
        
        if (activePlayer.isCpu) {
            const thinkTime = 1500 + Math.random() * 1500;
            const timer = setTimeout(async () => { await executeCpuTurn(); }, thinkTime); 
            return () => clearTimeout(timer);
        }
    }, [gameState?.phase, gameState?.turnPlayer, gameState?.turnCount, gameState?.players, isCoinFlipping, gameState?.mode, gameState?.isSandboxRun, showMenu, showTurnAnim]);

    const executeCpuTurn = async () => {
        const state = gameStateRef.current;
        if (!state) return;
        const activePlayerId = actions.getActiveDecisionPlayerId(state);
        const cpu = state.players[activePlayerId];

        switch(state.phase) {
            case Phase.INIT_SELECT:
                if (state.initSelectedIds.length === 0) {
                    const cpuIds = getCpuInitSelection(cpu.hand);
                    actions.setGameState(prev => {
                        if(!prev) return null;
                        return { ...prev, initSelectedIds: cpuIds };
                    });
                    await new Promise(r => setTimeout(r, 800));
                    actions.handleConfirmInitSelection();
                }
                break;
            case Phase.RESOURCE_START:
                const resDecision = getCpuResourceDecision(cpu, state.turnCount);
                if (resDecision.action === 'SKIP') {
                    actions.advancePhase(Phase.MAIN);
                } else if (resDecision.action === 'ADD' && resDecision.cardIdToAdd) {
                    const card = cpu.hand.find(c => c.id === resDecision.cardIdToAdd);
                    if (card) {
                        actions.advancePhase(Phase.RESOURCE_ADD_SELECT);
                        await new Promise(r => setTimeout(r, 500));
                        await actions.handleCardClick(card, 'HAND', activePlayerId, undefined, true);
                    }
                } else if (resDecision.action === 'SWAP' && resDecision.cardIdToSwapHand && resDecision.resourceInstanceIdToSwap) {
                     const handCard = cpu.hand.find(c => c.id === resDecision.cardIdToSwapHand);
                     const resCard = cpu.resources.find(r => r.instanceId === resDecision.resourceInstanceIdToSwap);
                     
                     if (handCard && resCard) {
                         // 1. Enter Swap Mode
                         actions.advancePhase(Phase.RESOURCE_SWAP_SELECT_HAND);
                         await new Promise(r => setTimeout(r, 600));
                         
                         // 2. Click Hand Card (Transition to SELECT_PILE)
                         await actions.handleCardClick(handCard, 'HAND', activePlayerId, undefined, true);
                         await new Promise(r => setTimeout(r, 600));

                         // 3. Click Resource Card (Execute Swap)
                         await actions.handleCardClick(resCard.card, 'RESOURCE', activePlayerId, resCard.instanceId, true);
                     } else {
                         actions.advancePhase(Phase.MAIN);
                     }
                }
                break;
            case Phase.MAIN:
                const action = getBestMainPhaseAction(state);
                if (action.type === 'END_TURN') {
                    const possibleAttackers = getCpuAttackers(state);
                    if (!cpu.hasAttackedThisTurn && possibleAttackers.length > 0) { actions.advancePhase(Phase.ATTACK_DECLARE); } 
                    else { actions.performEndTurn(); }
                } 
                else if (action.type === 'PLAY_UNIT' && action.cardId) {
                    const card = cpu.hand.find(c => c.id === action.cardId);
                    if(card) actions.playCard(card); 
                }
                else if (action.type === 'PLAY_TACTIC' && action.cardId) {
                    const card = cpu.hand.find(c => c.id === action.cardId);
                    if (card) {
                        let targetOwnerId = 0;
                        if (action.targetId) {
                            const opponentId = activePlayerId === 0 ? 1 : 0;
                            if (state.players[opponentId].field.some(f => f.instanceId === action.targetId)) {
                                targetOwnerId = opponentId;
                            } else if (state.players[activePlayerId].field.some(f => f.instanceId === action.targetId)) {
                                targetOwnerId = activePlayerId;
                            }
                        }
                        actions.playCard(card, action.targetId, targetOwnerId);
                    }
                }
                break;
            case Phase.ATTACK_DECLARE:
                const attackerIds = getCpuAttackers(state);
                if (attackerIds.length > 0) {
                    actions.setGameState(prev => ({ ...prev!, pendingAttackers: attackerIds }));
                    await new Promise(r => setTimeout(r, 500));
                    actions.confirmAttack();
                } else { actions.advancePhase(Phase.MAIN); }
                break;
            case Phase.BLOCK_DECLARE:
                const blocks = getCpuBlocks(state, activePlayerId);
                actions.setGameState(prev => ({ ...prev!, pendingBlocks: blocks }));
                await new Promise(r => setTimeout(r, 500));
                actions.confirmBlocks();
                break;
        }
    };
};
