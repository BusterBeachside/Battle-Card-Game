
import { Card, FieldCard, Rank, Color } from '../types';
import { generateId } from './core';

// Determine the EFFECTIVE color of a soldier (considering attached Queens)
export const getEffectiveColor = (fieldCard: FieldCard): Color => {
  // If a Queen is attached, the soldier takes the Queen's spectrum
  const attachedQueen = fieldCard.attachedCards.find(c => c.rank === Rank.Queen);
  if (attachedQueen) {
    return attachedQueen.baseColor;
  }
  return fieldCard.card.baseColor;
};

export const canBlock = (attacker: FieldCard, blocker: FieldCard): boolean => {
    // Must be in same lane (Same Effective Color)
    const attackerColor = getEffectiveColor(attacker);
    const blockerColor = getEffectiveColor(blocker);
    
    // Physical (Black) vs Physical (Black), Magical (Red) vs Magical (Red)
    return attackerColor === blockerColor;
};

export const createFieldCard = (card: Card, ownerId: number): FieldCard => ({
  instanceId: generateId(),
  card,
  ownerId,
  isTapped: false,
  isSummoningSick: true,
  attachedCards: [],
  currentHealth: card.numericValue
});
