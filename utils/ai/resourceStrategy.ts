
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
