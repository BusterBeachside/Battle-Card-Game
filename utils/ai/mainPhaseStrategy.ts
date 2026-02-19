
import { Card, GameState, Rank } from '../../types';
import { getEffectiveColor } from '../../utils/rules';

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
