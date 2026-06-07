
import { GameState, FieldCard, Rank, Color } from '../../types';
import { getEffectiveColor, canBlock } from '../../utils/rules';

export const getCpuAttackers = (gameState: GameState): string[] => {
    const cpu = gameState.players[gameState.turnPlayer];
    const opponent = gameState.players[gameState.turnPlayer === 0 ? 1 : 0];
    const potential = cpu.field.filter(f => !f.isTapped && !f.isSummoningSick);
    const blockers = opponent.field.filter(f => !f.isTapped);
    
    const difficulty = cpu.difficulty || 'HARD';

    if (difficulty === 'EASY') {
        // EASY AI: Recklessly attack with absolutely everything that is untapped 60% of the time!
        if (Math.random() < 0.60) {
            return potential.map(c => c.instanceId);
        }
    }

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

        // --- ACE ATTACK CONSTRAINT ---
        // An Ace can trade with any blocker. But we only want to trade if the blocker is worth >= 5.
        // EASY AI skips this optimization.
        if (atk.card.rank === 'A' && difficulty !== 'EASY') {
            const hasCheapBlocker = validBlockers.some(b => b.card.numericValue < 5 && b.card.rank !== 'A');
            if (hasCheapBlocker) {
                continue; // Skip attacking with Ace to preserve it
            }
        }

        // EASY AI completely ignores enemy blockers when setting candidates!
        if (difficulty !== 'EASY') {
            const freeKill = validBlockers.some(b => {
                if (atk.card.rank === 'A') {
                    // If we attack with Ace (combat power 1), any non-Ace blocker with value >= 2 lives and kills the Ace.
                    return b.card.numericValue >= 2 && b.card.rank !== 'A';
                }
                if (b.card.rank === 'A') {
                    // Enemy Ace blocker. It trades with anything, so it's not a "free" kill for them (it's a trade).
                    return false;
                }
                return b.card.numericValue > atk.card.numericValue;
            });
            if (freeKill) continue; 

            const equalTrade = validBlockers.some(b => {
                if (atk.card.rank === 'A' && b.card.rank === 'A') return true;
                if (atk.card.rank === 'A') {
                    // If we attack with Ace, treat it like at least a 5, so only count as equal/fair trade if blocker is >= 5.
                    return b.card.numericValue >= 5;
                }
                if (b.card.rank === 'A') {
                    // Opponent's Ace blocker. If we are standard unit of value <= 4, trading for their Ace is AMAZING value for us!
                    return atk.card.numericValue <= 4;
                }
                return b.card.numericValue === atk.card.numericValue;
            });

            if (equalTrade) {
                // Aggressive or desperate
                // If the attacker is an Ace, we treat it like at least a 5, so we can trade it (Ace's numericValue is technically 1).
                const effectiveAtkValue = atk.card.rank === 'A' ? 5 : atk.card.numericValue;
                // MEDIUM is slightly more willing to trade than HARD
                const tradeThreshold = difficulty === 'MEDIUM' ? 10 : 8;
                if (effectiveAtkValue <= tradeThreshold || cpu.life < 10) {
                    candidates.push(atk);
                }
                continue;
            }
        }

        // We win combat or we are on EASY difficulty
        candidates.push(atk);
    }

    // 2. Safety Check: Ensure we don't die on crackback
    // Identify Threats: All opponent units
    const threats = opponent.field; 

    // EASY AI ignores crackback danger completely!
    if (difficulty === 'EASY') {
        return candidates.map(c => c.instanceId);
    }

    // MEDIUM AI 35% of the time neglects the safety check
    if (difficulty === 'MEDIUM' && Math.random() < 0.35) {
        return candidates.map(c => c.instanceId);
    }

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
    while (predictedDamage >= cpu.life && candidates.length > 0) {
        const currentBlockers = cpu.field.filter(f => !candidates.includes(f));
        const blackBlockers = currentBlockers.filter(b => getEffectiveColor(b) === Color.Black).length;
        const redBlockers = currentBlockers.filter(b => getEffectiveColor(b) === Color.Red).length;
        
        const blackThreats = threats.filter(t => getEffectiveColor(t) === Color.Black).length;
        const redThreats = threats.filter(t => getEffectiveColor(t) === Color.Red).length;
        
        const needBlack = blackThreats > blackBlockers;
        const needRed = redThreats > redBlockers;
        
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
        if (currentSum >= bestSum) return;

        // Success: we killed it
        if (currentSum >= targetVal) {
            bestSum = currentSum;
            bestCombination = [...currentCards];
            return;
        }

        if (index >= blockers.length) return;

        // Include card at index
        const card = blockers[index];
        const val = card.card.rank === 'A' ? 1 : card.card.numericValue;
        
        search(index + 1, currentSum + val, [...currentCards, card]);

        // Exclude card at index
        search(index + 1, currentSum, currentCards);
    };

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
    
    const difficulty = cpu.difficulty || 'HARD';

    if (difficulty === 'EASY') {
        // EASY AI: 25% chance of skipping blocking entirely
        if (Math.random() < 0.25) {
            return {};
        }

        // EASY AI: 30% chance of matching lanes completely randomly
        if (Math.random() < 0.30) {
            const randomBlocks: Record<string, string> = {};
            const availableBlockers = [...myBlockers];
            for (const atk of attackers) {
                const valid = availableBlockers.filter(b => canBlock(atk, b));
                if (valid.length > 0) {
                    const picked = valid[Math.floor(Math.random() * valid.length)];
                    randomBlocks[picked.instanceId] = atk.instanceId;
                    const idx = availableBlockers.findIndex(b => b.instanceId === picked.instanceId);
                    if (idx !== -1) availableBlockers.splice(idx, 1);
                }
            }
            return randomBlocks;
        }
    }

    if (difficulty === 'MEDIUM') {
        // MEDIUM AI: 10% chance of block skip
        if (Math.random() < 0.10) {
            return {};
        }
    }

    // Sort attackers high to low (Prioritize blocking biggest threats)
    attackers.sort((a, b) => b.card.numericValue - a.card.numericValue);

    // Calculate Potential Damage for Lethal Check
    let potentialDamage = 0;
    for(const atk of attackers) {
        potentialDamage += (atk.card.rank === Rank.Ace ? 1 : atk.card.numericValue);
    }
    const isLethal = potentialDamage >= cpu.life;

    for (const atk of attackers) {
        const validBlockers = myBlockers.filter(b => {
            if (usedBlockers.has(b.instanceId)) return false;
            if (!canBlock(atk, b)) return false;
            // Prevent using an Ace to defend against attacking units < 5 unless it's a lethal emergency
            // EASY AI does not preserve its Aces!
            if (b.card.rank === 'A' && atk.card.numericValue < 5 && !isLethal && difficulty !== 'EASY') return false;
            return true;
        });
        
        if (validBlockers.length > 0) {
            let chosen: FieldCard[] = [];

            // --- 1. SINGLE BLOCK STRATEGY ---
            // A. Kill Attacker (Blocker > Atk)
            const killer = validBlockers.find(b => b.card.numericValue > atk.card.numericValue && b.card.rank !== 'A');
            
            // B. Trade Equal (Blocker == Atk)
            const trader = !killer ? validBlockers.find(b => b.card.numericValue === atk.card.numericValue) : undefined;
            
            // C. Trade Up (Blocker < Atk, but Blocker is Ace)
            const aceTrader = (!killer && !trader && atk.card.rank !== 'A' && (atk.card.numericValue >= 5 || isLethal)) 
                ? validBlockers.find(b => b.card.rank === 'A') 
                : undefined;

            if (killer) chosen = [killer];
            else if (trader) chosen = [trader];
            else if (aceTrader) chosen = [aceTrader];

            // --- 2. MULTI-BLOCK STRATEGY (If enabled & no single good block found) ---
            if (chosen.length === 0 && gameState.isMultiBlockingEnabled) {
                const atkVal = atk.card.rank === 'A' ? 1 : atk.card.numericValue;
                const combo = findMultiBlockCombination(atkVal, validBlockers);
                
                if (combo) {
                    const comboCost = combo.reduce((sum, c) => sum + (c.card.rank === 'A' ? 1 : c.card.numericValue), 0);
                    if (isLethal || comboCost <= atkVal) {
                        chosen = combo;
                    }
                }
            }

            // --- 3. CHUMP BLOCK STRATEGY (Last Resort) ---
            if (chosen.length === 0) {
                validBlockers.sort((a, b) => a.card.numericValue - b.card.numericValue);
                const weakest = validBlockers[0];
                
                const damageIfUnblocked = atk.card.rank === 'A' ? 1 : atk.card.numericValue;
                const valueLost = weakest.card.rank === 'A' ? 10 : weakest.card.numericValue; 
                
                let blockThreshold = 4;
                if (cpu.life < 10) blockThreshold = 2;
                if (difficulty === 'EASY') blockThreshold = 0; // Extremely loose chump block criteria
                if (difficulty === 'MEDIUM') blockThreshold = 2; // Mid-level willingness to block
                if (isLethal) blockThreshold = -999; 

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
