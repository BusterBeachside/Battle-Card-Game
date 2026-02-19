
import React, { useState } from 'react';
import { Card, Phase, DragState, GameState } from '../../types';
import { canBlock } from '../../utils/rules';
import { addLog } from '../../utils/core';

interface UseDragAndDropProps {
    gameState: GameState | null;
    actions: any;
    tutorial: any;
    ui: any;
}

export const useDragAndDrop = ({ gameState, actions, tutorial, ui }: UseDragAndDropProps) => {
    const [dragState, setDragState] = useState<DragState | null>(null);

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent, card: Card, type: 'HAND' | 'FIELD', ownerId: number, instanceId?: string) => {
        if (!gameState) return;
        if (gameState.mode === 'TUTORIAL') {
            const id = instanceId || card.id;
            if (!tutorial.isInteractionAllowed(id)) return;
        }

        if (gameState.mode === 'SANDBOX' && !gameState.isSandboxRun) {
             let clientX, clientY;
             if ('touches' in e) {
                 clientX = e.touches[0].clientX;
                 clientY = e.touches[0].clientY;
             } else {
                 clientX = (e as React.MouseEvent).clientX;
                 clientY = (e as React.MouseEvent).clientY;
             }
             setDragState({ cardId: card.id, sourceType: type, ownerId, startX: clientX, startY: clientY, currentX: clientX, currentY: clientY, cardObj: card, instanceId });
             return;
        }
        const activePid = actions.getActiveDecisionPlayerId(gameState);
        if (ownerId !== activePid) return;
        
        if (gameState.players[activePid].isCpu) return;

        if (gameState.phase === Phase.BLOCK_DECLARE && type === 'FIELD') { /* Allow */ } 
        else if (gameState.phase === Phase.MAIN && type === 'HAND') { /* Allow */ }
        else { return; }
        
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        setDragState({ cardId: card.id, sourceType: type, ownerId, startX: clientX, startY: clientY, currentX: clientX, currentY: clientY, cardObj: card, instanceId });
        e.stopPropagation();
    };

    const handleDrop = (e: MouseEvent | TouchEvent | React.TouchEvent | React.MouseEvent) => {
        if (!dragState || !gameState) return;
        
        let clientX: number, clientY: number;

        // Handle Native and React events
        if ('changedTouches' in e && (e as TouchEvent).changedTouches.length > 0) {
             // TouchEvent (Native or React)
             clientX = (e as TouchEvent).changedTouches[0].clientX;
             clientY = (e as TouchEvent).changedTouches[0].clientY;
        } else if ('clientX' in e) {
             // MouseEvent
             clientX = (e as MouseEvent).clientX;
             clientY = (e as MouseEvent).clientY;
        } else {
            return;
        }

        const elements = document.elementsFromPoint(clientX, clientY);
        const targetElement = elements.find(el => el.getAttribute('data-instance-id') || el.id === 'field-area');
        if (!targetElement) {
             setDragState(null);
             return;
        }
        
        if (dragState.sourceType === 'HAND' && gameState.phase === Phase.MAIN) {
            const targetInstanceId = targetElement.getAttribute('data-instance-id');
            if (targetElement.id === 'field-area' || targetInstanceId) { 
                const player = gameState.players[gameState.turnPlayer];
                const untappedRes = player.resources.filter((r: any) => !r.isTapped).length;
                if (untappedRes < dragState.cardObj.cost) { 
                    actions.setGameState((prev: any) => ({ ...prev!, logs: addLog(prev!, "Not enough resources!") })); 
                } else {
                    if (dragState.cardObj.rank === 'Q' || dragState.cardObj.rank === 'K') {
                        if (targetInstanceId) {
                            let targetOwnerId = -1;
                            gameState.players.forEach((p: any) => { if (p.field.some((f: any) => f.instanceId === targetInstanceId)) targetOwnerId = p.id; });
                            if (targetOwnerId !== -1) actions.playCard(dragState.cardObj, targetInstanceId, targetOwnerId);
                        }
                    } else { 
                        actions.playCard(dragState.cardObj); 
                    }
                    if (gameState.mode === 'TUTORIAL') {
                         tutorial.advanceTutorialStep('PLAY_CARD', dragState.cardObj.id);
                    }
                }
            }
        }
        else if (dragState.sourceType === 'FIELD' && gameState.phase === Phase.BLOCK_DECLARE) {
            const targetInstanceId = targetElement.getAttribute('data-instance-id');
            if (targetInstanceId && dragState.instanceId) { 
                 const blockerInstanceId = dragState.instanceId;
                 const attackerInstanceId = targetInstanceId;
                 
                 actions.setGameState((prev: any) => {
                    if (!prev) return null;
                    if (!prev.pendingAttackers.includes(attackerInstanceId)) return prev;
                    const defP = prev.players[prev.turnPlayer === 0 ? 1 : 0];
                    const blocker = defP.field.find((f: any) => f.instanceId === blockerInstanceId);
                    const attacker = prev.players[prev.turnPlayer].field.find((f: any) => f.instanceId === attackerInstanceId);
                    if (!blocker || !attacker || blocker.isTapped) return prev;
                    if (!canBlock(attacker, blocker)) return { ...prev, logs: addLog(prev, "Invalid Block: Wrong Spectrum!") };
                    
                    let newBlocks = { ...prev.pendingBlocks };
                    
                    // IF Multi-blocking disabled, ensure 1-to-1 by removing any previous block on this attacker
                    const isAlreadyBlocked = Object.values(newBlocks).includes(attackerInstanceId);
                    if (!prev.isMultiBlockingEnabled && isAlreadyBlocked) {
                         // Find and remove the existing blocker for this attacker
                         for (const [key, value] of Object.entries(newBlocks)) {
                             if (value === attackerInstanceId) {
                                 delete newBlocks[key];
                             }
                         }
                    }

                    newBlocks[blockerInstanceId] = attackerInstanceId;
                    return { ...prev, pendingBlocks: newBlocks };
                });
                
                if (gameState.mode === 'TUTORIAL') tutorial.advanceTutorialStep('DECLARE_BLOCK', blockerInstanceId);
            }
        }
        setDragState(null);
    };

    return { dragState, setDragState, handleDragStart, handleDrop };
};
