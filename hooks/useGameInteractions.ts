
import React, { useState } from 'react';
import { Card, Phase, DragState } from '../types';
import { createFieldCard, canBlock, getEffectiveColor } from '../utils/rules';
import { addLog } from '../utils/core';
import { sortHand } from '../utils/cards';
import { playSound } from '../utils/soundUtils';

export const useGameInteractions = (
    gameState: any, 
    actions: any, 
    effects: any, 
    tutorial: any, 
    ui: any,
    refs: any
) => {
    const [dragState, setDragState] = useState<DragState | null>(null);

    const handleCardClick = async (card: Card, location: 'HAND' | 'RESOURCE' | 'FIELD', ownerId: number, instanceId?: string, fromCpu: boolean = false) => {
        const currentState = actions.gameStateRef.current;
        if (!currentState) return;
        
        const elementId = instanceId || card.id;
        if (currentState.mode === 'TUTORIAL') {
            if (!tutorial.isInteractionAllowed(elementId)) {
                console.log("Tutorial Blocked Interaction:", elementId);
                return;
            }
        }

        if (currentState.mode === 'SANDBOX' && !currentState.isSandboxRun) { 
            ui.setCardActionTarget({ card, loc: location, ownerId, instanceId }); 
            return; 
        }
        
        const activePlayerId = actions.getActiveDecisionPlayerId(currentState);
        if (!fromCpu && currentState.players[activePlayerId].isCpu && ownerId === activePlayerId) { if (currentState.phase !== Phase.INIT_SELECT) return; }
        
        if (currentState.phase === Phase.INIT_SELECT && location === 'HAND') {
            if (ownerId === activePlayerId) {
                actions.setGameState((prev: any) => {
                    if(!prev) return null;
                    const isSelected = prev.initSelectedIds.includes(card.id);
                    let newIds = isSelected ? prev.initSelectedIds.filter((id: string) => id !== card.id) : [...prev.initSelectedIds, card.id];
                    if (newIds.length > 3) newIds.pop();
                    return { ...prev, initSelectedIds: newIds };
                });
                if (currentState.mode === 'TUTORIAL') tutorial.advanceTutorialStep('CLICK_CARD', card.id);
            }
        }
        else if (currentState.phase === Phase.RESOURCE_ADD_SELECT && location === 'HAND' && ownerId === activePlayerId) {
            const targetResourceContainer = document.getElementById(`resource-container-${ownerId}`);
            let cardEl = document.getElementById(card.id); 
            
            playSound('play_resource');

            if (cardEl && targetResourceContainer) { await effects.triggerFlyer(card, cardEl.getBoundingClientRect(), targetResourceContainer.getBoundingClientRect()); }

            actions.setGameState((prev: any) => {
               if(!prev) return null;
               const p = prev.players[activePlayerId];
               const cardIdx = p.hand.findIndex((c: any) => c.id === card.id);
               const [resCard] = p.hand.splice(cardIdx, 1);
               p.resources.push(createFieldCard(resCard, p.id));
               return { ...prev, phase: Phase.MAIN, logs: addLog(prev, `Converted [${resCard.rank}${resCard.suit}] into a resource.`) };
            });
            await actions.drawCards(activePlayerId, 1);
            if (currentState.mode === 'TUTORIAL') tutorial.advanceTutorialStep('CLICK_CARD', card.id);
        }
        else if (currentState.phase === Phase.RESOURCE_SWAP_SELECT_HAND && location === 'HAND') {
             actions.setGameState((prev: any) => ({ ...prev!, selectedCardId: card.id, phase: Phase.RESOURCE_SWAP_SELECT_PILE, logs: addLog(prev!, "Select a resource to swap with.") }));
             if (currentState.mode === 'TUTORIAL') tutorial.advanceTutorialStep('CLICK_CARD', card.id);
        }
        else if (currentState.phase === Phase.RESOURCE_SWAP_SELECT_PILE && location === 'RESOURCE') {
            if (currentState.selectedCardId) {
                // Determine layout logic to find correct hand ref (Bottom vs Top player)
                const isHotseat = !currentState.players[1].isCpu || currentState.mode === 'SANDBOX';
                const viewPlayerId = isHotseat ? activePlayerId : 0;
                const isBottom = activePlayerId === viewPlayerId;

                const handCardEl = document.getElementById(currentState.selectedCardId);
                const resCardEl = instanceId ? document.getElementById(instanceId) : null; 
                const handContainer = isBottom ? refs.handRef.current : refs.cpuHandRef.current;
                const handCard = currentState.players[activePlayerId].hand.find((c: any) => c.id === currentState.selectedCardId);
                
                if (handCard && handCardEl && resCardEl && handContainer) {
                    const p1 = effects.triggerFlyer(handCard, handCardEl.getBoundingClientRect(), resCardEl.getBoundingClientRect());
                    const p2 = effects.triggerFlyer(card, resCardEl.getBoundingClientRect(), handContainer.getBoundingClientRect());
                    await Promise.all([p1, p2]);
                }
            }
            
            playSound('swap_resource');

            actions.setGameState((prev: any) => {
                if(!prev) return null;
                const p = prev.players[activePlayerId];
                const handIdx = p.hand.findIndex((c: any) => c.id === prev.selectedCardId);
                // Note: We match resource by card ID because instance ID might differ in non-tutorial flow, but in this specific block we trust the logic
                const resIdx = p.resources.findIndex((c: any) => c.card.id === card.id);
                if(handIdx > -1 && resIdx > -1) {
                    const handCard = p.hand[handIdx]; const resFieldCard = p.resources[resIdx];
                    
                    const logMsg = `Swapped [${handCard.rank}${handCard.suit}] from hand with [${resFieldCard.card.rank}${resFieldCard.card.suit}] from resources.`;

                    // Create new resource from hand card
                    const newRes = createFieldCard(handCard, p.id);
                    // Force instance ID match in tutorial for consistency if swapping back (edge case)
                    if (prev.mode === 'TUTORIAL') newRes.instanceId = handCard.id;

                    p.hand[handIdx] = resFieldCard.card; 
                    p.resources[resIdx] = newRes; 

                    if(ui.autoSort) p.hand = sortHand(p.hand);
                    return { ...prev, selectedCardId: null, phase: Phase.MAIN, logs: addLog(prev, logMsg) };
                }
                return { ...prev, selectedCardId: null, phase: Phase.MAIN };
            });
            if (currentState.mode === 'TUTORIAL') tutorial.advanceTutorialStep('CLICK_CARD', card.id);
        }
        else if (currentState.phase === Phase.ATTACK_DECLARE && location === 'FIELD' && ownerId === activePlayerId) {
             actions.setGameState((prev: any) => {
                if(!prev) return null;
                const p = prev.players[activePlayerId];
                const fieldCard = p.field.find((fc: any) => fc.instanceId === instanceId);
                if (!fieldCard || fieldCard.isTapped || fieldCard.isSummoningSick) return prev;
                const isAttacking = prev.pendingAttackers.includes(instanceId!);
                const newPending = isAttacking ? prev.pendingAttackers.filter((id: string) => id !== instanceId) : [...prev.pendingAttackers, instanceId!];
                return { ...prev, pendingAttackers: newPending as string[] };
            });
            if (currentState.mode === 'TUTORIAL') tutorial.advanceTutorialStep('CLICK_CARD', card.id);
        }
        else if (currentState.phase === Phase.BLOCK_DECLARE && location === 'FIELD' && ownerId === activePlayerId) {
            if (instanceId && currentState.pendingBlocks[instanceId]) { 
                actions.setGameState((prev: any) => {
                  if(!prev) return null;
                  const newBlocks = { ...prev.pendingBlocks };
                  delete newBlocks[instanceId];
                  return { ...prev, pendingBlocks: newBlocks };
                });
            }
        }
        else if (currentState.phase === Phase.MAIN && location === 'HAND' && ownerId === activePlayerId) {
             const player = currentState.players[activePlayerId];
             const untappedRes = player.resources.filter((r: any) => !r.isTapped).length;
             
             if (untappedRes < card.cost) {
                 actions.setGameState((prev: any) => ({ ...prev!, logs: addLog(prev!, "Not enough resources!") }));
                 return;
             }

             if (['K', 'Q'].includes(card.rank)) {
                 actions.setGameState((prev: any) => ({ ...prev!, logs: addLog(prev!, "Drag Face Cards to target!") }));
             } else {
                 actions.playCard(card);
                 if (currentState.mode === 'TUTORIAL') tutorial.advanceTutorialStep('PLAY_CARD', card.id);
             }
        }
    };

    const handleDragStart = (e: React.MouseEvent, card: Card, type: 'HAND' | 'FIELD', ownerId: number, instanceId?: string) => {
        if (!gameState) return;
        if (gameState.mode === 'TUTORIAL') {
            const id = instanceId || card.id;
            if (!tutorial.isInteractionAllowed(id)) return;
        }

        if (gameState.mode === 'SANDBOX' && !gameState.isSandboxRun) {
             setDragState({ cardId: card.id, sourceType: type, ownerId, startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY, cardObj: card, instanceId });
             return;
        }
        const activePid = actions.getActiveDecisionPlayerId(gameState);
        if (ownerId !== activePid) return;
        
        if (gameState.players[activePid].isCpu) return;

        if (gameState.phase === Phase.BLOCK_DECLARE && type === 'FIELD') { /* Allow */ } 
        else if (gameState.phase === Phase.MAIN && type === 'HAND') { /* Allow */ }
        else { return; }
        setDragState({ cardId: card.id, sourceType: type, ownerId, startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY, cardObj: card, instanceId });
        e.stopPropagation();
    };

    const handleDrop = (e: MouseEvent) => {
        if (!dragState || !gameState) return;
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
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
                    const newBlocks = { ...prev.pendingBlocks };
                    newBlocks[blockerInstanceId] = attackerInstanceId;
                    return { ...prev, pendingBlocks: newBlocks };
                });
                
                if (gameState.mode === 'TUTORIAL') tutorial.advanceTutorialStep('DECLARE_BLOCK', blockerInstanceId);
            }
        }
        setDragState(null);
    };

    const handleConfirmInitSelection = async () => {
         const currentState = actions.gameStateRef.current;
         if (!currentState) return;

         const activeId = actions.getActiveDecisionPlayerId(currentState);
         if (currentState.mode === 'TUTORIAL') {
             if (!tutorial.isInteractionAllowed('btn-confirm-init')) return;
             tutorial.advanceTutorialStep('CLICK_UI_BUTTON', 'btn-confirm-init');
         }

         const p = currentState.players[activeId];
         // Use updated state for selection
         const selectedCards = p.hand.filter((c: any) => currentState.initSelectedIds.includes(c.id));
         const resContainer = document.getElementById(`resource-container-${activeId}`);
         
         if (resContainer) {
             const resRect = resContainer.getBoundingClientRect();
             // Ensure CPU DOM elements are found. Sometimes the state update for selection runs fast, 
             // but if we are CPU, the cards are rendered.
             const animations = selectedCards.map((c: any) => {
                 let startRect: DOMRect | null = null;
                 const el = document.getElementById(c.id);
                 
                 if (el) {
                     startRect = el.getBoundingClientRect();
                 } else {
                     // Fallback for CPU cards that might be tricky to select (offscreen or reflowed)
                     const handContainer = activeId === 0 ? refs.handRef.current : refs.cpuHandRef.current;
                     if (handContainer) {
                         const parentRect = handContainer.getBoundingClientRect();
                         // Approximate position in center of hand container
                         startRect = {
                             ...parentRect,
                             left: parentRect.left + parentRect.width / 2,
                             top: parentRect.top + parentRect.height / 2,
                             x: parentRect.left + parentRect.width / 2,
                             y: parentRect.top + parentRect.height / 2,
                             width: 0, height: 0, bottom: 0, right: 0, toJSON: () => {}
                         } as DOMRect;
                     }
                 }

                 if (startRect) return effects.triggerFlyer(c, startRect, resRect);
                 return Promise.resolve();
             });
             await Promise.all(animations);
         }
         
         playSound('play_resource');

         actions.setGameState((prev: any) => {
            if (!prev) return null;
            const p = prev.players[activeId];
            const selected = p.hand.filter((c: any) => prev.initSelectedIds.includes(c.id));
            const remaining = p.hand.filter((c: any) => !prev.initSelectedIds.includes(c.id));
            p.hand = remaining;
            
            // CRITICAL FIX: Preserve IDs for tutorial resources to allow highlighting
            selected.forEach((c: any) => {
                const fc = createFieldCard(c, p.id);
                if (prev.mode === 'TUTORIAL') fc.instanceId = c.id;
                p.resources.push(fc);
            });

            const otherId = activeId === 0 ? 1 : 0;
            const other = prev.players[otherId];
            let nextState = { ...prev, initSelectedIds: [] };
            let gameStarting = false;

            // Simplified Start Logic: If the other player has resources, start. If not, swap.
            // This works for CPU vs CPU to avoid infinite loops.
            if (other.resources.length >= 3) {
                nextState.logs = addLog(nextState, "Battle Commencing!");
                nextState.phase = Phase.UPKEEP; 
                nextState.turnPlayer = prev.startingPlayerId;
                gameStarting = true;
                setTimeout(() => actions.advancePhase(Phase.UPKEEP, nextState), 500);
            } else {
                nextState.turnPlayer = otherId;
                nextState.logs = addLog(nextState, `${other.name}'s turn to setup.`);
            }

            if (gameStarting) setTimeout(() => effects.setShowTurnAnim(true), 100);
            return nextState;
         });
    };

    const handlePhaseAction = (action: 'ATTACK_PHASE' | 'END_TURN' | 'CONFIRM_ATTACK' | 'CONFIRM_BLOCK' | 'ADD_RESOURCE' | 'SWAP_RESOURCE' | 'CANCEL_RESOURCE' | 'CONFIRM_INIT') => {
        if(action === 'ATTACK_PHASE') {
             if (gameState?.mode === 'TUTORIAL') {
                  if (!tutorial.isInteractionAllowed('btn-attack-phase')) return;
                  tutorial.advanceTutorialStep('CLICK_UI_BUTTON', 'btn-attack-phase');
             }
             playSound('attack_phase');
             actions.advancePhase(Phase.ATTACK_DECLARE);
        }
        else if (action === 'END_TURN') {
             if (!tutorial.isInteractionAllowed('btn-end-turn')) return;
             ui.setShowEndTurnModal(true);
             playSound('menu_click');
        }
        else if (action === 'CONFIRM_ATTACK') {
             if (gameState?.mode === 'TUTORIAL') {
                  if (!tutorial.isInteractionAllowed('btn-confirm-attackers')) return;
                  tutorial.advanceTutorialStep('CLICK_UI_BUTTON', 'btn-confirm-attackers');
             }
             actions.confirmAttack();
        }
        else if (action === 'CONFIRM_BLOCK') {
             if (gameState?.mode === 'TUTORIAL') {
                  if (!tutorial.isInteractionAllowed('btn-confirm-blocks') && !tutorial.isInteractionAllowed('btn-tutorial-next')) return;
                  tutorial.advanceTutorialStep('CLICK_UI_BUTTON', 'btn-confirm-blocks');
             }
             actions.confirmBlocks();
        }
        else if (action === 'ADD_RESOURCE') {
             if (gameState?.mode === 'TUTORIAL') {
                  if (!tutorial.isInteractionAllowed('btn-add-resource')) return;
                  tutorial.advanceTutorialStep('CLICK_UI_BUTTON', 'btn-add-resource');
             }
             actions.advancePhase(Phase.RESOURCE_ADD_SELECT);
        }
        else if (action === 'SWAP_RESOURCE') {
             if (gameState?.mode === 'TUTORIAL') {
                  if (!tutorial.isInteractionAllowed('btn-swap-resource')) return;
                  tutorial.advanceTutorialStep('CLICK_UI_BUTTON', 'btn-swap-resource');
             }
             actions.advancePhase(Phase.RESOURCE_SWAP_SELECT_HAND);
        }
        else if (action === 'CANCEL_RESOURCE') actions.setGameState((prev: any) => prev ? { ...prev, phase: Phase.RESOURCE_START, selectedCardId: null } : null);
        else if (action === 'CONFIRM_INIT') handleConfirmInitSelection();
    };

    return {
        dragState, setDragState,
        handleCardClick,
        handleDragStart,
        handleDrop,
        handlePhaseAction,
        handleConfirmInitSelection // Exported for AI use
    };
};
