
import { Card, PlayerState, Rank } from '../../types';
import { MAX_RESOURCES } from '../../constants';

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

export const getCpuInitSelection = (hand: Card[], difficulty?: 'EASY' | 'MEDIUM' | 'HARD'): string[] => {
    if (difficulty === 'EASY') {
        // EASY AI: Picks 3 cards at random to resource
        const shuffled = [...hand].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3).map(c => c.id);
    }

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
    let chosenIds = sorted.slice(0, 3).map(c => c.id);

    if (difficulty === 'MEDIUM' && Math.random() < 0.25) {
        // MEDIUM AI: 25% chance of swapping one of the optimal selections with a random face/low-cost card
        const nonChosen = sorted.slice(3);
        if (nonChosen.length > 0) {
            const swapIdx = Math.floor(Math.random() * 3);
            const rIdx = Math.floor(Math.random() * nonChosen.length);
            chosenIds[swapIdx] = nonChosen[rIdx].id;
        }
    }

    return chosenIds;
};

export const getCpuResourceDecision = (cpu: PlayerState, turnCount: number): { 
    action: 'ADD' | 'SWAP' | 'SKIP', 
    cardIdToAdd?: string,
    cardIdToSwapHand?: string,
    resourceInstanceIdToSwap?: string
} => {
    const currentRes = cpu.resources.length;
    const difficulty = cpu.difficulty || 'HARD';

    // EASY AI Random Actions
    if (difficulty === 'EASY') {
        // 1. "Swap resources whenever it feels like" - 40% chance of random swap if resources/hand exist
        if (cpu.resources.length > 0 && cpu.hand.length > 0 && Math.random() < 0.40) {
            const randHandCard = cpu.hand[Math.floor(Math.random() * cpu.hand.length)];
            const randRes = cpu.resources[Math.floor(Math.random() * cpu.resources.length)];
            return {
                action: 'SWAP',
                cardIdToSwapHand: randHandCard.id,
                resourceInstanceIdToSwap: randRes.instanceId
            };
        }
        // 2. 15% chance to skip adding resource entirely if resource level is decent
        if (currentRes >= 5 && Math.random() < 0.15) {
            return { action: 'SKIP' };
        }
    }

    // MEDIUM AI Random Actions
    if (difficulty === 'MEDIUM') {
        // 15% chance of a random swap
        if (cpu.resources.length > 0 && cpu.hand.length > 0 && Math.random() < 0.15) {
            const randHandCard = cpu.hand[Math.floor(Math.random() * cpu.hand.length)];
            const randRes = cpu.resources[Math.floor(Math.random() * cpu.resources.length)];
            return {
                action: 'SWAP',
                cardIdToSwapHand: randHandCard.id,
                resourceInstanceIdToSwap: randRes.instanceId
            };
        }
    }

    // Calculate keep scores for hand
    const scoredHand = cpu.hand.map(c => ({ c, score: getKeepScore(c, currentRes) }));
    // Sort Ascending: Lowest score (worst card) first
    scoredHand.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.c.numericValue - b.c.numericValue;
    });

    let worstHandCard = scoredHand[0];

    // Suboptimal resource add for EASY & MEDIUM
    if (scoredHand.length > 1) {
        if (difficulty === 'EASY' && Math.random() < 0.25) {
            // Adds a random card (could be Ace/King/Queen!)
            const randIdx = Math.floor(Math.random() * scoredHand.length);
            worstHandCard = scoredHand[randIdx];
        } else if (difficulty === 'MEDIUM' && Math.random() < 0.10) {
            // Adds second/third worst card instead of absolute worst
            const randIdx = Math.min(scoredHand.length - 1, 1 + Math.floor(Math.random() * 2));
            worstHandCard = scoredHand[randIdx];
        }
    }

    // DECISION: Should we SWAP?
    // Check swap first to see if there's huge value
    const scoredResources = cpu.resources.map(r => ({ r, score: getKeepScore(r.card, currentRes) }));
    scoredResources.sort((a, b) => b.score - a.score); // Highest score (best card) first
    
    const bestResource = scoredResources[0];

    // Determine Swap Threshold based on game stage
    let swapThreshold = 40;
    if (currentRes < 5) {
        swapThreshold = 80; // RAMP MODE: Only swap if getting something insanely better (e.g. Ace for a 2)
    } else if (currentRes < 8) {
        swapThreshold = 50; // MID GAME
    } else if (currentRes >= 9) {
        swapThreshold = 10; // LATE GAME: Filter aggressively before locking at 10
    }

    // Tweak swap threshold for difficulty
    if (difficulty === 'EASY') {
        swapThreshold = 10; // Extremely loose swapping
    } else if (difficulty === 'MEDIUM') {
        swapThreshold = Math.max(10, swapThreshold - 20); // Softer threshold
    }

    // Panic Check
    const hasPlayableCardInHand = cpu.hand.some(c => c.cost <= currentRes);
    const hasPlayableCardInResources = cpu.resources.some(r => r.card.cost <= currentRes);
    const isPanic = cpu.life <= 10 && cpu.resources.length > 0 && !hasPlayableCardInHand && hasPlayableCardInResources;

    // Only swap if we have at least 7 resources OR if we are in a panic state
    let canConsiderSwap = currentRes >= 7 || isPanic;
    if (difficulty === 'EASY') {
        canConsiderSwap = true; // Easy swaps whenever it wants
    } else if (difficulty === 'MEDIUM') {
        canConsiderSwap = currentRes >= 5 || isPanic; // Swap earlier in midgame
    }

    if (canConsiderSwap && bestResource && worstHandCard) {
        if (bestResource.score > worstHandCard.score + swapThreshold) {
            return { 
                action: 'SWAP', 
                cardIdToSwapHand: worstHandCard.c.id, 
                resourceInstanceIdToSwap: bestResource.r.instanceId 
            };
        }
    }

    // DECISION: Should we ADD a resource?
    if (currentRes < MAX_RESOURCES && worstHandCard) {
        return { action: 'ADD', cardIdToAdd: worstHandCard.c.id };
    }

    return { action: 'SKIP' };
};
