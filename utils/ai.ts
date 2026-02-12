
import { Card, FieldCard, PlayerState, GameState, Rank, Color } from '../types';
import { MAX_RESOURCES } from '../constants';
import { getEffectiveColor, canBlock } from './rules';

export const getCpuInitSelection = (hand: Card[]): string[] => {
    // We want to resource cards that are:
    // 1. Not Aces (Wilds are valuable) - Score 100
    // 2. Not Face Cards (Tactics are valuable) - Score 90
    // 3. Not low cost soldiers (Need early game board presence) - Score 80
    // So we prefer to resource High Cost Soldiers (6, 7, 8, 9, 10) first (Score 0).
    
    const getResourcePreference = (c: Card) => {
        if (c.rank === Rank.Ace) return 100; // KEEP
        if (['K', 'Q', 'J'].includes(c.rank)) return 90; // KEEP
        if (c.numericValue <= 4) return 80; // KEEP (Early plays)
        // 5, 6, 7, 8, 9, 10 -> These are good resource candidates
        // Higher value = Better soldier, but harder to cast.
        // We prefer resourcing the middle-high stuff.
        return 0; // Resource these
    };

    const sorted = [...hand].sort((a, b) => getResourcePreference(a) - getResourcePreference(b));
    
    // Pick the 3 with the lowest preference (i.e., the best to throw away as resources)
    return sorted.slice(0, 3).map(c => c.id);
};

export const getCpuResourceDecision = (cpu: PlayerState, turnCount: number): { action: 'ADD' | 'SWAP' | 'SKIP', cardIdToAdd?: string } => {
    if (cpu.resources.length >= MAX_RESOURCES) return { action: 'SKIP' };
    
    // Soft Cap: If we have enough resources (e.g. 6), slow down unless hand is full
    if (cpu.resources.length >= 6 && cpu.hand.length < 6) return { action: 'SKIP' };

    const currentRes = cpu.resources.length;
    
    // Calculate a "Utility Score" for keeping each card. Lowest score gets resourced.
    // We want to KEEP: Playable units, Tactics, and units that complete our curve.
    // We want to DUMP: High cost units that we can't play for a long time.
    
    const getKeepScore = (c: Card) => {
        if (c.rank === Rank.Ace) return 200; // Must Keep (Wild + Cheap)

        // Always try to keep Tactics
        if (['K', 'Q', 'J'].includes(c.rank)) return 90; 
        
        // High priority: Units we can play NOW or Next Turn
        if (c.cost <= currentRes) return 110; 
        if (c.cost === currentRes + 1) return 80;
        
        // Low priority: Expensive units. 
        // We add numericValue to score so we prefer keeping bigger threats if costs are equal.
        // e.g. Cost 8 vs Cost 9. Both score low (~30), but we keep the 9.
        return 20 + c.numericValue; 
    };

    const scoredHand = cpu.hand.map(c => ({ c, score: getKeepScore(c) }));
    
    // Sort Ascending: Lowest score (worst card) first
    // Tie-breaker: Numeric Value (Resource the weaker card if both are equally playable)
    scoredHand.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.c.numericValue - b.c.numericValue;
    });

    const worstCard = scoredHand[0];

    // Safety: If the "worst" card is actually a playable card (Score > 100), 
    // we should only resource it if we really have nothing better to do (e.g. need to double spell).
    // If we have < 3 resources, always ramp.
    if (currentRes >= 3 && worstCard.score > 100) {
        // Check if we can already play a card without ramping
        const canPlay = cpu.hand.some(c => c.cost <= currentRes);
        if (canPlay) return { action: 'SKIP' };
    }

    if (worstCard) {
        return { action: 'ADD', cardIdToAdd: worstCard.c.id };
    }

    return { action: 'SKIP' };
};

export const getBestMainPhaseAction = (gameState: GameState): { type: 'PLAY_UNIT' | 'PLAY_TACTIC' | 'END_TURN', cardId?: string, targetId?: string } => {
    const cpu = gameState.players[gameState.turnPlayer];
    const opponent = gameState.players[gameState.turnPlayer === 0 ? 1 : 0];
    const availableResources = cpu.resources.filter(r => !r.isTapped).length;
    const playable = cpu.hand.filter(c => c.cost <= availableResources);

    if (playable.length === 0) return { type: 'END_TURN' };

    // 1. TACTICS (Priority)
    // King: Use if we have a valid target
    const kings = playable.filter(c => c.rank === Rank.King);
    for (const king of kings) {
        // Target highest value opponent in matching lane
        const targets = opponent.field.filter(f => getEffectiveColor(f) === king.baseColor);
        targets.sort((a, b) => b.card.numericValue - a.card.numericValue);
        
        // UPDATE: CPU should not waste Kings on weak units unless desperate
        if (targets.length > 0) {
            const bestTarget = targets[0];
            // Only Execute if target is worth it (Value >= 7) OR if CPU is low on life and target is moderate threat
            const isWorthIt = bestTarget.card.numericValue >= 7 || (cpu.life <= 10 && bestTarget.card.numericValue >= 5);
            
            if (isWorthIt) {
                return { type: 'PLAY_TACTIC', cardId: king.id, targetId: bestTarget.instanceId };
            }
        }
    }

    // Queen: Strategy -> Shift a unit's color.
    const queens = playable.filter(c => c.rank === Rank.Queen);
    for (const queen of queens) {
        const queenColor = queen.baseColor;
        
        // Find enemies that are NOT this color
        const enemyTargets = opponent.field.filter(f => getEffectiveColor(f) !== queenColor);
        enemyTargets.sort((a, b) => b.card.numericValue - a.card.numericValue);
        
        // UPDATE: Only Shift if it gives a clear advantage (e.g. bypassing a big blocker, or blocking a big attacker)
        // For now, simplify to: Only shift enemies if they are substantial (Value >= 6)
        if (enemyTargets.length > 0 && enemyTargets[0].card.numericValue >= 6) {
            return { type: 'PLAY_TACTIC', cardId: queen.id, targetId: enemyTargets[0].instanceId };
        }

        // Fallback: Own units - Shift own unit to avoid a blocker?
        // Basic AI: Randomly shifting own units can be detrimental. Restrict to very specific logic or skip.
        // Let's skip shifting own units for now to avoid bad plays, effectively saving the Queen for enemy disruption or resources.
    }

    // Jack: Play for draw
    const jacks = playable.filter(c => c.rank === Rank.Jack);
    if (jacks.length > 0) return { type: 'PLAY_TACTIC', cardId: jacks[0].id };

    // 2. UNITS
    const units = playable.filter(c => !['J', 'Q', 'K'].includes(c.rank));
    if (units.length === 0) return { type: 'END_TURN' };

    // Sort units by value high to low
    units.sort((a, b) => b.numericValue - a.numericValue);
    const bigUnit = units[0];

    // STRATEGY: Go Wide vs Go Big
    const boardDisadvantage = Math.max(0, opponent.field.length - cpu.field.length);
    const smallUnits = units.slice(1).sort((a, b) => a.cost - b.cost); // Cheapest first
    const widePlay: Card[] = [];
    let currentCost = 0;
    
    for (const u of smallUnits) {
        if (currentCost + u.cost <= availableResources) {
            widePlay.push(u);
            currentCost += u.cost;
        }
    }

    if (widePlay.length > 1) {
        const bigVal = bigUnit.numericValue;
        const wideVal = widePlay.reduce((sum, c) => sum + c.numericValue, 0);
        const wideBonus = boardDisadvantage * 3; // Value board presence more if behind

        if (wideVal + wideBonus >= bigVal) {
             return { type: 'PLAY_UNIT', cardId: widePlay[0].id };
        }
    }

    return { type: 'PLAY_UNIT', cardId: bigUnit.id };
};

export const getCpuAttackers = (gameState: GameState): string[] => {
    const cpu = gameState.players[gameState.turnPlayer];
    const opponent = gameState.players[gameState.turnPlayer === 0 ? 1 : 0];
    const potential = cpu.field.filter(f => !f.isTapped && !f.isSummoningSick);
    const blockers = opponent.field.filter(f => !f.isTapped);
    
    // 1. Identify desirable attacks (Greedy Phase)
    let candidates: FieldCard[] = [];

    for (const atk of potential) {
        const atkColor = getEffectiveColor(atk);
        const validBlockers = blockers.filter(b => getEffectiveColor(b) === atkColor);
        
        if (validBlockers.length === 0) {
            candidates.push(atk); continue;
        }

        const freeKill = validBlockers.some(b => b.card.numericValue > atk.card.numericValue && b.card.rank !== 'A' && atk.card.rank !== 'A');
        if (freeKill) continue; 

        const equalTrade = validBlockers.some(b => 
            (b.card.numericValue === atk.card.numericValue) || 
            (b.card.rank === 'A' && atk.card.rank !== 'A') || 
            (atk.card.rank === 'A' && b.card.rank !== 'A')
        );

        if (equalTrade) {
            // Aggressive or desperate
            if (atk.card.numericValue <= 8 || cpu.life < 10) {
                candidates.push(atk);
            }
            continue;
        }

        // We win combat
        candidates.push(atk);
    }

    // 2. Safety Check: Ensure we don't die on crackback
    // Identify Threats: All opponent units (untapped + tapped, as they will untap next turn)
    const threats = opponent.field; 

    // Simulation function to check damage leaking through
    const calculatePredictedDamage = (myBlockers: FieldCard[]) => {
        const blackBlockers = myBlockers.filter(b => getEffectiveColor(b) === Color.Black).length;
        const redBlockers = myBlockers.filter(b => getEffectiveColor(b) === Color.Red).length;
        
        // Sort threats descending by value to simulate worst case (blocking best, taking dmg from rest? no usually we block best)
        // Opponent attacks with everything. We block optimally.
        // We assume 1 blocker stops 1 attacker.
        // The damage we take is from the unblocked attackers.
        // Which attackers go unblocked? The opponent chooses who attacks, but we choose blockers.
        // We will block the highest damage threats.
        // So we take damage from the remaining threats.
        
        const blackThreats = threats.filter(t => getEffectiveColor(t) === Color.Black).map(t => t.card.rank === 'A' ? 1 : t.card.numericValue).sort((a,b) => b-a);
        const redThreats = threats.filter(t => getEffectiveColor(t) === Color.Red).map(t => t.card.rank === 'A' ? 1 : t.card.numericValue).sort((a,b) => b-a);
        
        let dmg = 0;
        if (blackThreats.length > blackBlockers) {
            // We have fewer blockers than threats. We block the top N. The rest get through.
            // Wait, logic is: Threats[0] is blocked by Blocker[0].
            // We take damage from Threats[blackBlockers ... end].
            dmg += blackThreats.slice(blackBlockers).reduce((a, b) => a + b, 0);
        }
        if (redThreats.length > redBlockers) {
            dmg += redThreats.slice(redBlockers).reduce((a, b) => a + b, 0);
        }
        return dmg;
    };

    let predictedDamage = calculatePredictedDamage(cpu.field.filter(f => !candidates.includes(f)));

    // If danger, pull back attackers
    // Limit loop to prevent infinite (though candidates shrinks, so it's finite)
    while (predictedDamage >= cpu.life && candidates.length > 0) {
        const currentBlockers = cpu.field.filter(f => !candidates.includes(f));
        const blackBlockers = currentBlockers.filter(b => getEffectiveColor(b) === Color.Black).length;
        const redBlockers = currentBlockers.filter(b => getEffectiveColor(b) === Color.Red).length;
        
        const blackThreats = threats.filter(t => getEffectiveColor(t) === Color.Black).length;
        const redThreats = threats.filter(t => getEffectiveColor(t) === Color.Red).length;
        
        const needBlack = blackThreats > blackBlockers;
        const needRed = redThreats > redBlockers;
        
        // Sort candidates: We want to pull back the WEAKEST attacker that can block
        // Actually, we want to pull back the one that contributes least to offense but helps defense.
        // For simplicity, pull back lowest numeric value.
        candidates.sort((a, b) => a.card.numericValue - b.card.numericValue);
        
        let pulled = false;
        
        // Try to pull a candidate that helps the color we are leaking
        if (needBlack) {
            const idx = candidates.findIndex(c => getEffectiveColor(c) === Color.Black);
            if (idx !== -1) {
                candidates.splice(idx, 1);
                pulled = true;
            }
        }
        
        if (!pulled && needRed) {
            const idx = candidates.findIndex(c => getEffectiveColor(c) === Color.Red);
            if (idx !== -1) {
                candidates.splice(idx, 1);
                pulled = true;
            }
        }
        
        if (!pulled) {
             // Mismatch, remaining candidates can't help with defense colors.
             break;
        }
        
        predictedDamage = calculatePredictedDamage(cpu.field.filter(f => !candidates.includes(f)));
    }

    return candidates.map(c => c.instanceId);
};

export const getCpuBlocks = (gameState: GameState, defendingPlayerId: number): Record<string, string> => {
    const blocks: Record<string, string> = {};
    const cpu = gameState.players[defendingPlayerId];
    const opponent = gameState.players[defendingPlayerId === 0 ? 1 : 0];
    const attackerIds = gameState.pendingAttackers;
    
    const attackers = opponent.field.filter(f => attackerIds.includes(f.instanceId));
    const myBlockers = cpu.field.filter(f => !f.isTapped);
    const usedBlockers = new Set<string>();
    
    // Sort attackers high to low
    attackers.sort((a, b) => b.card.numericValue - a.card.numericValue);

    // Calculate Potential Damage
    let potentialDamage = 0;
    for(const atk of attackers) {
        potentialDamage += (atk.card.rank === Rank.Ace ? 1 : atk.card.numericValue);
    }

    const isLethal = potentialDamage >= cpu.life;

    for (const atk of attackers) {
        const validBlockers = myBlockers.filter(b => !usedBlockers.has(b.instanceId) && canBlock(atk, b));
        
        if (validBlockers.length > 0) {
            let chosen: FieldCard | undefined;

            if (isLethal) {
                // CHUMP BLOCK MODE: Use weakest blocker to survive
                validBlockers.sort((a, b) => a.card.numericValue - b.card.numericValue);
                chosen = validBlockers[0];
            } else {
                // VALUE MODE: 
                // 1. Try to kill Attacker (Blocker > Atk)
                chosen = validBlockers.find(b => b.card.numericValue > atk.card.numericValue && b.card.rank !== 'A');
                
                // 2. Try to trade Equal (Blocker == Atk)
                if (!chosen) chosen = validBlockers.find(b => b.card.numericValue === atk.card.numericValue);
                
                // 3. Trade Up (Blocker < Atk, but Blocker is an Ace or Deathtouch equivalent - not in this game, but Ace vs Ace fits here)
                if (!chosen && atk.card.rank === Rank.Ace) {
                     validBlockers.sort((a,b) => a.card.numericValue - b.card.numericValue);
                     chosen = validBlockers[0];
                }

                // 4. Strategic Chump Block (Save Life if damage is high relative to blocker cost)
                if (!chosen) {
                    // Sort valid blockers by value (lowest first)
                    validBlockers.sort((a, b) => a.card.numericValue - b.card.numericValue);
                    const weakest = validBlockers[0];
                    
                    const damageIfUnblocked = atk.card.rank === 'A' ? 1 : atk.card.numericValue;
                    const valueLost = weakest.card.rank === 'A' ? 10 : weakest.card.numericValue; // Ace is valuable, treat as 10
                    
                    // Threshold: If incoming damage is significantly higher than the value we lose.
                    // e.g. Incoming 9, losing a 2. Diff = 7. Block.
                    // e.g. Incoming 4, losing a 3. Diff = 1. Don't Block.
                    
                    let blockThreshold = 4;
                    if (cpu.life < 10) blockThreshold = 2; // Be more defensive if life low
                    if (cpu.life < 5) blockThreshold = 0; // Desperate

                    if ((damageIfUnblocked - valueLost) >= blockThreshold) {
                        chosen = weakest;
                    }
                }
            }

            if (chosen) {
                blocks[chosen.instanceId] = atk.instanceId;
                usedBlockers.add(chosen.instanceId);
            }
        }
    }
    return blocks;
};
