
import { GameState, FieldCard, Rank, Color } from '../../types';
import { getEffectiveColor, canBlock } from '../../utils/rules';

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
