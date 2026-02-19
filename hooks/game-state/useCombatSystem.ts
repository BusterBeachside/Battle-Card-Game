import React, { useEffect } from 'react';
import { GameState, Phase, Card, Color } from '../../types';
import { getEffectiveColor } from '../../utils/rules';
import { addLog } from '../../utils/core';
import { playSound } from '../../utils/soundUtils';

interface UseCombatSystemProps {
    gameState: GameState | null;
    gameStateRef: React.MutableRefObject<GameState | null>;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    effects: any;
    refs: any;
}

export const useCombatSystem = ({ gameState, gameStateRef, setGameState, effects, refs }: UseCombatSystemProps) => {
    
    const formatCardLog = (card: Card) => `[${card.rank}${card.suit}]`;

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

                const blockedAttackers = attackers.filter(atk => Object.values(state.pendingBlocks).includes(atk.instanceId));
                
                for (const atk of blockedAttackers) {
                    const blockerIds = Object.keys(state.pendingBlocks).filter(k => state.pendingBlocks[k] === atk.instanceId);
                    const blockers = defenderPlayer.field.filter(f => blockerIds.includes(f.instanceId));
                    
                    if (blockers.length > 0) {
                        for (const blk of blockers) {
                            setGameState(prev => prev ? { ...prev, activeCombatCardId: atk.instanceId } : null);
                            playSound('menu_click');
                            await new Promise(r => setTimeout(r, 400));
                            setGameState(prev => {
                                if (!prev) return null;
                                const nextRecentDamage = { ...prev.recentDamage };
                                nextRecentDamage[atk.instanceId] = (nextRecentDamage[atk.instanceId] || 0) + blk.card.numericValue;
                                nextRecentDamage[blk.instanceId] = atk.card.numericValue;
                                const logMsg = `⚔️ Battle: ${formatCardLog(atk.card)} vs ${formatCardLog(blk.card)}`;
                                return { ...prev, recentDamage: nextRecentDamage, logs: addLog(prev, logMsg) };
                            });
                            await new Promise(r => setTimeout(r, 600)); 
                            setGameState(prev => prev ? { ...prev, activeCombatCardId: null } : null);
                            await new Promise(r => setTimeout(r, 100));
                        }
                    }
                }
                
                for (const atk of directAttackers) {
                    setGameState(prev => prev ? { ...prev, activeCombatCardId: atk.instanceId } : null);
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
                    await new Promise(r => setTimeout(r, 1250)); 
                    setGameState(prev => prev ? { ...prev, activeCombatCardId: null } : null);
                }

                const finalState = gameStateRef.current!;
                const activeAtkIds = finalState.pendingAttackers;
                const dyingData: { instanceId: string, ownerId: number }[] = [];
                const fAtkP = finalState.players[finalState.turnPlayer];
                const fDefP = finalState.players[finalState.turnPlayer === 0 ? 1 : 0];
                const activeAtk = fAtkP.field.filter(f => activeAtkIds.includes(f.instanceId));

                for (const atk of activeAtk) {
                     const blockerIds = Object.keys(finalState.pendingBlocks).filter(k => finalState.pendingBlocks[k] === atk.instanceId);
                     const blockers = fDefP.field.filter(f => blockerIds.includes(f.instanceId));
                     if (blockers.length > 0) {
                         const atkVal = atk.card.rank === 'A' ? 1 : atk.card.numericValue;
                         const atkIsAce = atk.card.rank === 'A';
                         let accumulatedDamageToAtk = 0;
                         let anyBlockerIsAce = false;
                         for (const blk of blockers) {
                             const blkVal = blk.card.rank === 'A' ? 1 : blk.card.numericValue;
                             const blkIsAce = blk.card.rank === 'A';
                             if (blkIsAce) anyBlockerIsAce = true;
                             accumulatedDamageToAtk += blkVal;
                             let blkDies = false;
                             if (atkIsAce) blkDies = true;
                             else if (atkVal >= blkVal) blkDies = true;
                             if (blkDies) {
                                 if (!dyingData.some(d => d.instanceId === blk.instanceId)) {
                                     dyingData.push({ instanceId: blk.instanceId, ownerId: fDefP.id });
                                 }
                             }
                         }
                         if (anyBlockerIsAce || accumulatedDamageToAtk >= atkVal) {
                             if (!dyingData.some(d => d.instanceId === atk.instanceId)) {
                                 dyingData.push({ instanceId: atk.instanceId, ownerId: fAtkP.id });
                             }
                         }
                     }
                }

                if (dyingData.length > 0) {
                    for (const d of dyingData) {
                        handleCardDeath(d.instanceId, d.ownerId);
                        playSound('destroy');
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
                        await new Promise(r => setTimeout(r, 200));
                    }
                    await new Promise(r => setTimeout(r, 600));
                }

                setGameState(prev => {
                    if (!prev) return null;
                    const nextState = { ...prev };
                    nextState.recentDamage = {}; 
                    nextState.pendingAttackers = []; 
                    nextState.pendingBlocks = {}; 
                    nextState.phase = Phase.MAIN;
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

    return { confirmAttack, confirmBlocks };
};