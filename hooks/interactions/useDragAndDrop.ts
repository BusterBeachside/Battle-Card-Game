
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

    const performDropAction = (cardObj: any, targetInstanceId: string | null, targetElementId: string | null, sourceType: string, instanceId?: string) => {
        if (sourceType === 'HAND' && gameState!.phase === Phase.MAIN) {
            if (targetElementId === 'field-area' || targetInstanceId) { 
                const player = gameState!.players[gameState!.turnPlayer];
                const untappedRes = player.resources.filter((r: any) => !r.isTapped).length;
                if (untappedRes < cardObj.cost) { 
                    actions.setGameState((prev: any) => ({ ...prev!, logs: addLog(prev!, "Not enough resources!") })); 
                } else {
                    let cardWasPlayed = false;
                    if (cardObj.rank === 'Q' || cardObj.rank === 'K') {
                        if (targetInstanceId) {
                            let targetOwnerId = -1;
                            gameState!.players.forEach((p: any) => { if (p.field.some((f: any) => f.instanceId === targetInstanceId)) targetOwnerId = p.id; });
                            if (targetOwnerId !== -1) {
                                // Tutorial strict check: make sure correct target is attached to
                                if (gameState!.mode === 'TUTORIAL') {
                                    const step = gameState!.tutorialState?.steps[gameState!.tutorialState.currentStepIndex];
                                    if (step && step.id === 'l4-play-queen' && targetInstanceId !== 'tut-9-♦') {
                                        // User tried to attach Queen to something other than the target 9 of Diamonds
                                        return;
                                    }
                                    if (step && step.id === 'l4-play-king' && targetInstanceId !== 'tut-10-♥') {
                                        // User tried to attack/kill something other than the target 10 of Hearts
                                        return;
                                    }
                                }
                                actions.playCard(cardObj, targetInstanceId, targetOwnerId);
                                cardWasPlayed = true;
                            }
                        }
                    } else { 
                        actions.playCard(cardObj); 
                        cardWasPlayed = true;
                    }

                    if (cardWasPlayed && gameState!.mode === 'TUTORIAL') {
                         tutorial.advanceTutorialStep('PLAY_CARD', cardObj.id);
                    }
                }
            }
        }
        else if (sourceType === 'FIELD' && gameState!.phase === Phase.BLOCK_DECLARE) {
            if (targetInstanceId && instanceId) { 
                 const blockerInstanceId = instanceId;
                 const attackerInstanceId = targetInstanceId;
                 
                 // Tutorial strict check: make sure correct blocker blocks the correct attacker
                 if (gameState!.mode === 'TUTORIAL') {
                     const step = gameState!.tutorialState?.steps[gameState!.tutorialState.currentStepIndex];
                     if (step && step.id === 'l4-p2-attack') {
                         if (blockerInstanceId !== 'tut-A-♠' || attackerInstanceId !== 'tut-10-♠') {
                             return;
                         }
                     }
                 }

                 actions.setGameState((prev: any) => {
                    if (!prev) return null;
                    if (!prev.pendingAttackers.includes(attackerInstanceId)) return prev;
                    const defP = prev.players[prev.turnPlayer === 0 ? 1 : 0];
                    const blocker = defP.field.find((f: any) => f.instanceId === blockerInstanceId);
                    const attacker = prev.players[prev.turnPlayer].field.find((f: any) => f.instanceId === attackerInstanceId);
                    if (!blocker || !attacker || blocker.isTapped) return prev;
                    if (!canBlock(attacker, blocker)) return { ...prev, logs: addLog(prev, "Invalid Block: Wrong Spectrum!") };
                    
                    let newBlocks = { ...prev.pendingBlocks };
                    
                    const isAlreadyBlocked = Object.values(newBlocks).includes(attackerInstanceId);
                    if (!prev.isMultiBlockingEnabled && isAlreadyBlocked) {
                         for (const [key, value] of Object.entries(newBlocks)) {
                             if (value === attackerInstanceId) {
                                 delete newBlocks[key];
                             }
                         }
                    }

                    newBlocks[blockerInstanceId] = attackerInstanceId;
                    return { ...prev, pendingBlocks: newBlocks };
                });
                
                if (gameState!.mode === 'TUTORIAL') tutorial.advanceTutorialStep('DECLARE_BLOCK', blockerInstanceId);
            }
        }
    };

    const handleRemoteDrop = (cardObj: any, targetInstanceId: string | null, targetElementId: string | null, sourceType: string, instanceId?: string) => {
         performDropAction(cardObj, targetInstanceId, targetElementId, sourceType, instanceId);
    };

    const handleDrop = (e: MouseEvent | TouchEvent | React.TouchEvent | React.MouseEvent) => {
         if (!dragState || !gameState) return;
         
         let clientX: number, clientY: number;

         if ('changedTouches' in e && (e as TouchEvent).changedTouches.length > 0) {
              clientX = (e as TouchEvent).changedTouches[0].clientX;
              clientY = (e as TouchEvent).changedTouches[0].clientY;
         } else if ('clientX' in e) {
              clientX = (e as MouseEvent).clientX;
              clientY = (e as MouseEvent).clientY;
         } else {
              setDragState(null);
              return;
         }

         const elements = document.elementsFromPoint(clientX, clientY);
         let targetElement = elements.find(el => el.getAttribute('data-instance-id') || el.id === 'field-area');
         
         // Mobile drag-drop usability fallback for cards from HAND:
         // If a hand card is dropped and we didn't land directly on a specific target element or specific field-area backdrop,
         // but the release coordinate is upper than the scrollable hand container itself (at least above the bottom 140px), 
         // we fall back to dropping on 'field-area' container itself to make playing fluid.
         if (!targetElement && dragState.sourceType === 'HAND' && clientY < window.innerHeight - 130) {
              const fieldAreaEl = document.getElementById('field-area');
              if (fieldAreaEl) {
                  targetElement = fieldAreaEl;
              }
         }

         if (!targetElement) {
              setDragState(null);
              return;
         }
         
         const targetInstanceId = targetElement.getAttribute('data-instance-id');
         const targetElementId = targetElement.id;

         if (gameState.mode === 'TUTORIAL') {
             if (targetInstanceId && !tutorial.isInteractionAllowed(targetInstanceId)) {
                  setDragState(null);
                  return;
             }
         }

         if (actions.onDragDropData) {
             actions.onDragDropData(dragState.cardObj, targetInstanceId, targetElementId, dragState.sourceType, dragState.instanceId);
         }

         performDropAction(dragState.cardObj, targetInstanceId, targetElementId, dragState.sourceType, dragState.instanceId);
         
         setDragState(null);
    };

    return { dragState, setDragState, handleDragStart, handleDrop, handleRemoteDrop };
};
