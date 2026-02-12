
import { Card, Suit, Rank, Color, FieldCard } from './types';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const CARD_VALUES: Record<Rank, number> = {
  [Rank.Two]: 2,
  [Rank.Three]: 3,
  [Rank.Four]: 4,
  [Rank.Five]: 5,
  [Rank.Six]: 6,
  [Rank.Seven]: 7,
  [Rank.Eight]: 8,
  [Rank.Nine]: 9,
  [Rank.Ten]: 10,
  [Rank.Jack]: 2, // Cost 2
  [Rank.Queen]: 3, // Cost 3
  [Rank.King]: 4, // Cost 4
  [Rank.Ace]: 1, // Cost 1, Value 1
};

export const createDeck = (): Card[] => {
  const suits = [Suit.Spades, Suit.Clubs, Suit.Hearts, Suit.Diamonds];
  const ranks = Object.values(Rank);
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      const baseColor = (suit === Suit.Spades || suit === Suit.Clubs) ? Color.Black : Color.Red;
      const numericValue = CARD_VALUES[rank];
      
      // Cost is equal to numeric value, except Ace=1, J=2, Q=3, K=4
      let cost = numericValue;
      if (rank === Rank.Jack) cost = 2;
      if (rank === Rank.Queen) cost = 3;
      if (rank === Rank.King) cost = 4;
      if (rank === Rank.Ace) cost = 1;

      deck.push({
        id: generateId(),
        suit,
        rank,
        numericValue,
        cost,
        baseColor
      });
    }
  }
  return shuffle(deck);
};

export const shuffle = <T>(array: T[]): T[] => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

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
  attachedCards: []
});
