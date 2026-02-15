
import { Card, FieldCard, PlayerState, GameState, Rank, Color } from '../types';
import { MAX_RESOURCES } from '../constants';
import { getEffectiveColor, canBlock } from './rules';

// Helper function for scoring cards to decide what to keep/resource
const getKeepScore = (c: Card, currentRes: number) => {
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

export const getCpuResourceDecision = (cpu: PlayerState, turnCount: number): { 
    action: 'ADD' | 'SWAP' | 'SKIP', 
    cardIdToAdd?: string,
    cardIdToSwapHand?: string,
    resourceInstanceIdToSwap?: string
} => {
    const currentRes = cpu.resources.length;
    
    // Calculate keep scores for hand
    const scoredHand = cpu.hand.map(c => ({ c, score: getKeepScore(c, currentRes) }));
    // Sort Ascending: Lowest score (worst card) first
    scoredHand.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.c.numericValue - b.c.numericValue;
    });

    const worstHandCard = scoredHand[0];

    // DECISION: Should we SWAP?
    // Check swap first to see if there's huge value
    const scoredResources = cpu.resources.map(r => ({ r, score: getKeepScore(r.card, currentRes) }));
    scoredResources.sort((a, b) => b.score - a.score); // Highest score (best card) first
    
    const bestResource = scoredResources[0];

    // Determine Swap Threshold based on game stage
    // Early game (low resources): High threshold to discourage swapping (we need to RAMP)
    // Late game (high resources): Low threshold to encourage filtering before maxing out
    let swapThreshold = 40;
    if (currentRes < 5) {
        swapThreshold = 80; // RAMP MODE: Only swap if getting something insanely better (e.g. Ace for a 2)
    } else if (currentRes < 8) {
        swapThreshold = 50; // MID GAME
    } else if (currentRes >= 9) {
        swapThreshold = 10; // LATE GAME: Filter aggressively before locking at 10
    }

    if (bestResource && worstHandCard) {
        if (bestResource.score > worstHandCard.score + swapThreshold) {
            return { 
                action: 'SWAP', 
                cardIdToSwapHand: worstHandCard.c.id, 
                resourceInstanceIdToSwap: bestResource.r.instanceId 
            };
        }
    }

    // DECISION: Should we ADD a resource?
    // Logic update: CPU MUST add if < 10 resources, unless swapping.
    if (currentRes < MAX_RESOURCES && worstHandCard) {
        return { action: 'ADD', cardIdToAdd: worstHandCard.c.id };
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
    let bestQueenPlay: { cardId: string, targetId: string, score: number } | null = null;

    for (const queen of queens) {
        const qColor = queen.baseColor;
        
        // 1. Evaluate Enemy Targets (Disrupt defense or mitigate offense)
        const enemyTargets = opponent.field.filter(f => getEffectiveColor(f) !== qColor);
        for (const t of enemyTargets) {
            let score = 0;
            const tVal = t.card.numericValue;
            
            // A. Offensive Value: Is this enemy blocking my big units?
            // My units in target's CURRENT color
            const myAttackersCurrent = cpu.field.filter(f => !f.isTapped && !f.isSummoningSick && getEffectiveColor(f) === getEffectiveColor(t));
            // If I have a big attacker here, moving the blocker is good.
            const blockedAttacker = myAttackersCurrent.sort((a,b) => b.card.numericValue - a.card.numericValue)[0];
            if (blockedAttacker && blockedAttacker.card.numericValue >= tVal) {
                score += 40; // Remove blocker
                if (blockedAttacker.card.numericValue > tVal) score += 10; // Save my unit from trade
            }

            // B. Defensive Value: Is this enemy threatening me, and can I block it if I move it?
            // Do I have blockers in the NEW color?
            const myBlockersNew = cpu.field.filter(f => !f.isTapped && getEffectiveColor(f) === qColor);
            const bestBlocker = myBlockersNew.sort((a,b) => b.card.numericValue - a.card.numericValue)[0];
            
            // Do I LACK blockers in the OLD color?
            const myBlockersOld = cpu.field.filter(f => !f.isTapped && getEffectiveColor(f) === getEffectiveColor(t));
            
            if (myBlockersOld.length === 0 && myBlockersNew.length > 0) {
                // Moving unblocked threat to blocked lane
                score += 50;
                if (bestBlocker && bestBlocker.card.numericValue > tVal) score += 20; // Favorable trade
            } else if (myBlockersOld.length === 0 && myBlockersNew.length === 0) {
                // Moving unblocked threat to... still unblocked lane.
                score -= 50; 
            }

            if (score > 30) {
                if (!bestQueenPlay || score > bestQueenPlay.score) {
                    bestQueenPlay = { cardId: queen.id, targetId: t.instanceId, score };
                }
            }
        }

        // 2. Evaluate Self Targets (Fix bad matchups)
        const selfTargets = cpu.field.filter(f => getEffectiveColor(f) !== qColor);
        for (const t of selfTargets) {
            let score = 0;
            const tVal = t.card.numericValue;

            // A. Offense: Am I blocked? Will I be unblocked?
            const enemyBlockersOld = opponent.field.filter(f => !f.isTapped && getEffectiveColor(f) === getEffectiveColor(t));
            const enemyBlockersNew = opponent.field.filter(f => !f.isTapped && getEffectiveColor(f) === qColor);
            
            const biggestBlockerOld = enemyBlockersOld.sort((a,b) => b.card.numericValue - a.card.numericValue)[0];
            const biggestBlockerNew = enemyBlockersNew.sort((a,b) => b.card.numericValue - a.card.numericValue)[0];

            // If I am currently blocked by a bigger/equal unit
            if (biggestBlockerOld && biggestBlockerOld.card.numericValue >= tVal) {
                // And in new lane, I am unblocked OR blocked by smaller unit
                if (!biggestBlockerNew) {
                    score += 50; // Free hit!
                } else if (biggestBlockerNew.card.numericValue < tVal) {
                    score += 40; // Favorable trade
                }
            } else if (!biggestBlockerOld) {
                // Currently unblocked. Moving to unblocked is neutral. Moving to blocked is bad.
                if (biggestBlockerNew) score -= 30;
            }

            // B. Defense: Do I need to block something in the new lane?
            const enemyThreatsNew = opponent.field.filter(f => !f.isTapped && getEffectiveColor(f) === qColor); // Potential attackers
            // If there is an unblocked threat in new lane that I can handle
            if (enemyThreatsNew.length > 0) {
                 const bigThreat = enemyThreatsNew.sort((a,b) => b.card.numericValue - a.card.numericValue)[0];
                 // If I move there, can I kill it or trade?
                 if (tVal >= bigThreat.card.numericValue) {
                     score += 30; // Move to intercept
                 }
            }

            if (score > 30) {
                if (!bestQueenPlay || score > bestQueenPlay.score) {
                    bestQueenPlay = { cardId: queen.id, targetId: t.instanceId, score };
                }
            }
        }
    }

    if (bestQueenPlay) {
        return { type: 'PLAY_TACTIC', cardId: bestQueenPlay.cardId, targetId: bestQueenPlay.targetId };
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
    
    // --- LETHAL CHECK (Checkmate Logic) ---
    // If attacking with everything results in a win, do it. Ignore safety.
    const getPotentialDamage = (attackers: FieldCard[], currentBlockers: FieldCard[]) => {
        const redAtk = attackers.filter(c => getEffectiveColor(c) === Color.Red).map(c => c.card.rank === 'A' ? 1 : c.card.numericValue).sort((a,b) => b-a);
        const blackAtk = attackers.filter(c => getEffectiveColor(c) === Color.Black).map(c => c.card.rank === 'A' ? 1 : c.card.numericValue).sort((a,b) => b-a);
        
        const redBlkCount = currentBlockers.filter(c => getEffectiveColor(c) === Color.Red).length;
        const blackBlkCount = currentBlockers.filter(c => getEffectiveColor(c) === Color.Black).length;
        
        // Remove damage that gets blocked (Highest damage sources are blocked first by rational opponent)
        const unblockedRed = redAtk.slice(redBlkCount);
        const unblockedBlack = blackAtk.slice(blackBlkCount);
        
        return [...unblockedRed, ...unblockedBlack].reduce((sum, val) => sum + val, 0);
    };

    if (getPotentialDamage(potential, blockers) >= opponent.life) {
        return potential.map(c => c.instanceId);
    }

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
        
        // Calculate max incoming damage assuming opponent attacks with everything
        const blackThreats = threats.filter(t => getEffectiveColor(t) === Color.Black).map(t => t.card.rank === 'A' ? 1 : t.card.numericValue).sort((a,b) => b-a);
        const redThreats = threats.filter(t => getEffectiveColor(t) === Color.Red).map(t => t.card.rank === 'A' ? 1 : t.card.numericValue).sort((a,b) => b-a);
        
        let dmg = 0;
        if (blackThreats.length > blackBlockers) {
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
             // Just break to preserve whatever offense we have.
             break;
        }
        
        predictedDamage = calculatePredictedDamage(cpu.field.filter(f => !candidates.includes(f)));
    }

    return candidates.map(c => c.instanceId);
};

// Helper: Find best combination of blockers to kill a target with minimized cost
const findMultiBlockCombination = (targetVal: number, blockers: FieldCard[]): FieldCard[] | null => {
    let bestCombination: FieldCard[] | null = null;
    let bestSum = Infinity;

    // Basic recursive subset sum search
    const search = (index: number, currentSum: number, currentCards: FieldCard[]) => {
        // Pruning: if current sum already exceeds best found sum, stop (we want min cost)
        if (currentSum >= bestSum) return;

        // Success: we killed it
        if (currentSum >= targetVal) {
            bestSum = currentSum;
            bestCombination = [...currentCards];
            return;
        }

        // Run out of cards
        if (index >= blockers.length) return;

        // Include card at index
        const card = blockers[index];
        const val = card.card.rank === 'A' ? 1 : card.card.numericValue;
        
        search(index + 1, currentSum + val, [...currentCards, card]);

        // Exclude card at index
        search(index + 1, currentSum, currentCards);
    };

    // Sort blockers by value descending to potentially hit target faster in DFS?
    // Actually, heuristic sort isn't strictly necessary for small N, but helps.
    search(0, 0, []);
    return bestCombination;
};

export const getCpuBlocks = (gameState: GameState, defendingPlayerId: number): Record<string, string> => {
    const blocks: Record<string, string> = {};
    const cpu = gameState.players[defendingPlayerId];
    const opponent = gameState.players[defendingPlayerId === 0 ? 1 : 0];
    const attackerIds = gameState.pendingAttackers;
    
    const attackers = opponent.field.filter(f => attackerIds.includes(f.instanceId));
    const myBlockers = cpu.field.filter(f => !f.isTapped);
    const usedBlockers = new Set<string>();
    
    // Sort attackers high to low (Prioritize blocking biggest threats)
    attackers.sort((a, b) => b.card.numericValue - a.card.numericValue);

    // Calculate Potential Damage for Lethal Check
    let potentialDamage = 0;
    for(const atk of attackers) {
        potentialDamage += (atk.card.rank === Rank.Ace ? 1 : atk.card.numericValue);
    }
    const isLethal = potentialDamage >= cpu.life;

    for (const atk of attackers) {
        const validBlockers = myBlockers.filter(b => !usedBlockers.has(b.instanceId) && canBlock(atk, b));
        
        if (validBlockers.length > 0) {
            let chosen: FieldCard[] = [];

            // --- 1. SINGLE BLOCK STRATEGY ---
            // A. Kill Attacker (Blocker > Atk)
            const killer = validBlockers.find(b => b.card.numericValue > atk.card.numericValue && b.card.rank !== 'A');
            
            // B. Trade Equal (Blocker == Atk)
            const trader = !killer ? validBlockers.find(b => b.card.numericValue === atk.card.numericValue) : undefined;
            
            // C. Trade Up (Blocker < Atk, but Blocker is Ace)
            const aceTrader = (!killer && !trader && atk.card.rank !== 'A') 
                ? validBlockers.find(b => b.card.rank === 'A') 
                : undefined;

            if (killer) chosen = [killer];
            else if (trader) chosen = [trader];
            else if (aceTrader) chosen = [aceTrader];

            // --- 2. MULTI-BLOCK STRATEGY (If enabled & no single good block found) ---
            if (chosen.length === 0 && gameState.isMultiBlockingEnabled) {
                // We couldn't single block effectively. Can we gang up?
                const atkVal = atk.card.rank === 'A' ? 1 : atk.card.numericValue;
                const combo = findMultiBlockCombination(atkVal, validBlockers);
                
                if (combo) {
                    const comboCost = combo.reduce((sum, c) => sum + (c.card.rank === 'A' ? 1 : c.card.numericValue), 0);
                    
                    // Evaluate Trade:
                    // We lose all blockers involved (Cost). We kill Attacker (Value).
                    // Accept if Cost <= Attacker Value (Fair Trade) OR if we are about to die.
                    // Note: We count Ace blocker as value 1 here, but Ace blocker would have been picked by single block logic usually.
                    
                    if (isLethal || comboCost <= atkVal) {
                        chosen = combo;
                    }
                }
            }

            // --- 3. CHUMP BLOCK STRATEGY (Last Resort) ---
            // If we still haven't picked a block, but we are dying or taking huge damage...
            if (chosen.length === 0) {
                validBlockers.sort((a, b) => a.card.numericValue - b.card.numericValue);
                const weakest = validBlockers[0];
                
                const damageIfUnblocked = atk.card.rank === 'A' ? 1 : atk.card.numericValue;
                const valueLost = weakest.card.rank === 'A' ? 10 : weakest.card.numericValue; 
                
                let blockThreshold = 4;
                if (cpu.life < 10) blockThreshold = 2;
                if (isLethal) blockThreshold = -999; // Block everything if lethal

                if ((damageIfUnblocked - valueLost) >= blockThreshold) {
                    chosen = [weakest];
                }
            }

            // Apply Blocks
            if (chosen.length > 0) {
                for (const b of chosen) {
                    blocks[b.instanceId] = atk.instanceId;
                    usedBlockers.add(b.instanceId);
                }
            }
        }
    }
    return blocks;
};
