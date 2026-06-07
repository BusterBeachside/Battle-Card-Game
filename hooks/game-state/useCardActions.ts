
import React from 'react';
import { GameState, Card, Rank, Color } from '../../types';
import { createFieldCard, getEffectiveColor } from '../../utils/rules';
import { addLog } from '../../utils/core';
import { playSound } from '../../utils/soundUtils';

interface UseCardActionsProps {
    gameStateRef: React.MutableRefObject<GameState | null>;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    effects: any;
    refs: any;
    drawCards: (playerId: number, count: number) => Promise<void>;
}

export const useCardActions = ({ gameStateRef, setGameState, effects, refs, drawCards }: UseCardActionsProps) => {
    
    const formatCardLog = (card: Card) => `[${card.rank}${card.suit}]`;

    const playCard = async (card: Card, targetId?: string, targetOwnerId?: number) => {
        const isFaceCard = ['K', 'Q', 'J'].includes(card.rank);
        const currentState = gameStateRef.current;
        if (!currentState) return;

        // --- VALIDATION & PREP ---
        if (currentState.campaignChallenge === 'UNGA_BUNGA' && currentState.turnPlayer === 0 && isFaceCard) {
            setGameState(prev => prev ? ({ ...prev, logs: addLog(prev, "Unga Bunga: Cannot use Tactics!") }) : null);
            return;
        }

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

        // --- VISUAL SETUP ---
        // Capture start position before we remove it from state
        let startRect: DOMRect | undefined;
        const cardEl = document.getElementById(card.id);
        if (cardEl) {
            startRect = cardEl.getBoundingClientRect();
        } else {
            // Fallback for CPU offscreen
            const handContainer = currentState.turnPlayer === 0 ? refs.handRef.current : refs.cpuHandRef.current;
            if (handContainer) {
                const r = handContainer.getBoundingClientRect();
                startRect = { left: r.left + r.width/2, top: r.top + r.height/2, width: 0, height: 0, bottom: 0, right: 0, x: 0, y: 0, toJSON: () => {} } as DOMRect;
            }
        }

        let targetRect: DOMRect | undefined;
        if (targetId) { 
            const targetEl = document.getElementById(targetId); 
            if (targetEl) targetRect = targetEl.getBoundingClientRect(); 
        }

        if (isFaceCard) {
            // --- TACTICS LOGIC (Existing) ---
            setGameState(prev => {
                if (!prev) return null;
                const p = prev.players[prev.turnPlayer];
                const cardIdx = p.hand.findIndex(c => c.id === card.id);
                if (cardIdx === -1) return prev; 
                const newHand = [...p.hand];
                newHand.splice(cardIdx, 1); 
                
                let toTap = card.cost;
                const newResources = p.resources.map(r => {
                    if (!r.isTapped && toTap > 0) { toTap--; return { ...r, isTapped: true }; }
                    return r;
                });
                const nextPlayers = [...prev.players];
                nextPlayers[prev.turnPlayer] = { ...p, hand: newHand, resources: newResources };
                
                let nextSessionStats = prev.sessionStats;
                if (prev.turnPlayer === 0 && nextSessionStats) {
                    nextSessionStats = {
                        ...nextSessionStats,
                        tacticsPlayed: nextSessionStats.tacticsPlayed + 1
                    };
                }
                return { ...prev, players: nextPlayers, sessionStats: nextSessionStats };
            });

            playSound('tactic');
            if (card.rank === 'K') playSound('king');
            if (card.rank === 'Q') playSound('queen');

            const playingP = currentState.players.find(p => p.id === currentState.turnPlayer);
            effects.setSpecialAnim({ type: card.rank as 'K'|'Q'|'J', card, targetRect, cardBack: playingP?.cardBack, cardFace: playingP?.cardFace });
            await new Promise(r => setTimeout(r, card.rank === 'K' ? 1200 : card.rank === 'Q' ? 1000 : 800));
            effects.setSpecialAnim(null);

            setGameState(prev => {
                if (!prev) return null;
                const nextState = { ...prev };
                
                if (card.rank === 'J') { 
                    const nextPlayers = prev.players.map((pl, idx) => {
                        if (idx === prev.turnPlayer) {
                            return { ...pl, discard: [...pl.discard, card] };
                        }
                        return pl;
                    });
                    return { ...nextState, players: nextPlayers, logs: addLog(nextState, `Played Jack ${formatCardLog(card)}.`) }; 
                } 
                else if (card.rank === 'K') {
                    const activePIdx = prev.turnPlayer;
                    const defPIdx = targetOwnerId!;
                    
                    const nextPlayers = prev.players.map((pl, idx) => {
                        if (idx === activePIdx || idx === defPIdx) {
                            return { ...pl, field: [...pl.field], discard: [...pl.discard] };
                        }
                        return pl;
                    });
                    
                    const p = nextPlayers[activePIdx];
                    const targetP = nextPlayers[defPIdx];
                    const targetFIdx = targetP.field.findIndex(f => f.instanceId === targetId);
                    if (targetFIdx === -1) return prev; 
                    const targetF = targetP.field[targetFIdx];
                    
                    effects.triggerExplosion(targetId!); 
                    playSound('destroy');
                    effects.triggerScreenShake(4); 
                    
                    const isSpectate = nextState.players[0].isCpu && nextState.players[1].isCpu;
                    const isHotseat = !nextState.players[1].isCpu || nextState.players[0].isCpu;
                    const viewId = (isHotseat && !isSpectate) ? nextState.turnPlayer : 0;
                    const isTop = targetOwnerId !== viewId;
                    const targetRef = isTop ? refs.topDiscardRef : refs.bottomDiscardRef;
                    
                    if (targetRef.current && targetId) {
                        const trailColor = getEffectiveColor(targetF) === Color.Red ? 'red' : 'cyan';
                        effects.triggerSoulTrail(targetId, targetRef.current.getBoundingClientRect(), trailColor);
                    }

                    p.discard = [...p.discard, card]; 
                    targetP.field.splice(targetFIdx, 1); 
                    targetP.discard = [...targetP.discard, targetF.card, ...targetF.attachedCards];
                    
                    let nextSessionStats = nextState.sessionStats;
                    if (targetOwnerId === 1 && nextSessionStats) {
                        nextSessionStats = {
                            ...nextSessionStats,
                            killsCount: nextSessionStats.killsCount + 1
                        };
                    }
                    return { ...nextState, players: nextPlayers, sessionStats: nextSessionStats, logs: addLog(nextState, `King ${formatCardLog(card)} executed ${formatCardLog(targetF.card)}.`) };
                } 
                else if (card.rank === 'Q') {
                    const targetP = nextState.players[targetOwnerId!];
                    const targetF = targetP.field.find(f => f.instanceId === targetId);
                    if(targetF) {
                        const existingQueens = targetF.attachedCards.filter(c => c.rank === Rank.Queen);
                        if (existingQueens.length > 0) { targetP.discard.push(...existingQueens); targetF.attachedCards = targetF.attachedCards.filter(c => c.rank !== Rank.Queen); }
                        targetF.attachedCards.push(card);
                    }
                    return { ...nextState, logs: addLog(nextState, `Queen ${formatCardLog(card)} shifted ${targetF ? formatCardLog(targetF.card) : 'target'}.`) };
                }
                return nextState;
            });

            if (card.rank === 'J' && gameStateRef.current) { await drawCards(gameStateRef.current.turnPlayer, 2); }

        } else {
            // --- SOLDIER LOGIC (REFINED ANIMATION) ---
            if (card.baseColor === Color.Red) playSound('conscript_mag');
            else playSound('conscript_phy');

            const pId = currentState.turnPlayer;
            const newSoldier = createFieldCard(card, pId);
            if (currentState.mode === 'TUTORIAL') newSoldier.instanceId = card.id;
            newSoldier.isBeingSummoned = true; // MARK INVISIBLE

            // STEP 1: Add to field immediately (Invisible) to reserve layout space
            setGameState(prev => {
                if (!prev) return null;
                const p = prev.players[prev.turnPlayer];
                const cardIdx = p.hand.findIndex(c => c.id === card.id);
                if (cardIdx === -1) return prev;

                const newHand = [...p.hand];
                newHand.splice(cardIdx, 1);

                let toTap = card.cost;
                const newResources = p.resources.map(r => {
                    if (!r.isTapped && toTap > 0) { toTap--; return { ...r, isTapped: true }; }
                    return r;
                });

                const nextPlayers = [...prev.players];
                const nextP = { ...p, hand: newHand, resources: newResources };
                // Clone field array to avoid mutation
                nextP.field = [...nextP.field, newSoldier]; // Push phantom
                
                nextPlayers[prev.turnPlayer] = nextP;
                
                let nextSessionStats = prev.sessionStats;
                if (pId === 0 && nextSessionStats) {
                    nextSessionStats = {
                        ...nextSessionStats,
                        conscriptedCount: nextSessionStats.conscriptedCount + 1
                    };
                }
                return { ...prev, players: nextPlayers, sessionStats: nextSessionStats, logs: addLog(prev, `Conscripted ${formatCardLog(card)}.`) };
            });

            // STEP 2: Wait for DOM Reflow
            await new Promise(r => setTimeout(r, 50));

            // STEP 3: Animate to the exact reserved position
            if (startRect) {
                // Now that the invisible card is in DOM, we can target it
                const playingP = currentState.players.find(p => p.id === currentState.turnPlayer);
                await effects.triggerSummon(card, startRect, newSoldier.instanceId, pId, playingP?.cardBack, playingP?.cardFace);
            }

            // STEP 4: Reveal
            if (card.numericValue >= 7) playSound('damage_md'); // Heavy thud landing
            setGameState(prev => {
                if (!prev) return null;
                const nextPlayers = [...prev.players];
                // CRITICAL: Use captured pId (ownerId) because turnPlayer might have changed during animation
                const pIndex = nextPlayers.findIndex(pl => pl.id === pId);
                if (pIndex === -1) return prev;

                const p = { ...nextPlayers[pIndex] };
                const fieldIdx = p.field.findIndex(f => f.instanceId === newSoldier.instanceId);
                
                if (fieldIdx !== -1) {
                    const newField = [...p.field];
                    newField[fieldIdx] = { ...newField[fieldIdx], isBeingSummoned: false };
                    p.field = newField;
                    nextPlayers[pIndex] = p;
                }
                return { ...prev, players: nextPlayers };
            });
        }
    };

    return { playCard };
};
