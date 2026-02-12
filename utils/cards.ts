
import { Card, Suit, Rank, Color } from '../types';
import { CARD_VALUES } from '../constants';
import { generateId, shuffle } from './core';

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

export const createTutorialCard = (rank: Rank, suit: Suit): Card => {
    const baseColor = (suit === Suit.Spades || suit === Suit.Clubs) ? Color.Black : Color.Red;
    let cost = CARD_VALUES[rank];
    if (rank === Rank.Jack) cost = 2;
    if (rank === Rank.Queen) cost = 3;
    if (rank === Rank.King) cost = 4;
    if (rank === Rank.Ace) cost = 1;
    
    return {
        id: `tut-${rank}-${suit}`, // Fixed IDs for tutorial
        rank, suit, numericValue: CARD_VALUES[rank], cost, baseColor
    };
};

export const createTutorialDeck = (): Card[] => {
    // Legacy support or default deck
    return [
        createTutorialCard(Rank.Ten, Suit.Spades),
        createTutorialCard(Rank.Nine, Suit.Spades),
        createTutorialCard(Rank.Eight, Suit.Spades),
        createTutorialCard(Rank.Seven, Suit.Diamonds),
        createTutorialCard(Rank.Five, Suit.Hearts),
        createTutorialCard(Rank.Ace, Suit.Spades), 
        createTutorialCard(Rank.King, Suit.Diamonds),
        createTutorialCard(Rank.Queen, Suit.Clubs),
    ];
};

export const getSortedDeck = (): Card[] => {
    // Create a fresh deck but sort it for the Sandbox search
    const deck = createDeck();
    const suitOrder = { [Suit.Spades]: 0, [Suit.Hearts]: 1, [Suit.Clubs]: 2, [Suit.Diamonds]: 3 };
    const rankOrder = { 
        [Rank.Ace]: 0, [Rank.King]: 1, [Rank.Queen]: 2, [Rank.Jack]: 3, 
        [Rank.Ten]: 4, [Rank.Nine]: 5, [Rank.Eight]: 6, [Rank.Seven]: 7, 
        [Rank.Six]: 8, [Rank.Five]: 9, [Rank.Four]: 10, [Rank.Three]: 11, [Rank.Two]: 12 
    };
    
    return deck.sort((a, b) => {
        if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
        return rankOrder[a.rank] - rankOrder[b.rank];
    });
};

export const sortHand = (hand: Card[]): Card[] => {
  const getSortValue = (card: Card) => {
      // Tactics get boosted values for sorting purposes to separate them from soldiers
      if (card.rank === Rank.King) return 15;
      if (card.rank === Rank.Queen) return 14;
      if (card.rank === Rank.Jack) return 13;
      return card.numericValue;
  };

  return [...hand].sort((a, b) => {
    // 1. Sort by Color: Black First, then Red
    if (a.baseColor !== b.baseColor) {
      return a.baseColor === Color.Black ? -1 : 1;
    }
    // 2. Sort by "Sort Value" (Tactics first, then High-to-Low Soldiers)
    return getSortValue(b) - getSortValue(a);
  });
};
