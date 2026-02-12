import { Rank, Suit } from './types';

export const INITIAL_LIFE = 20;
export const MAX_RESOURCES = 10;
export const STARTING_HAND_SIZE = 5; // After setting aside 3 resources
export const STARTING_RESOURCE_COUNT = 3;

export const SUIT_COLORS: Record<Suit, string> = {
  [Suit.Spades]: 'text-slate-900',
  [Suit.Clubs]: 'text-slate-900',
  [Suit.Hearts]: 'text-red-600',
  [Suit.Diamonds]: 'text-red-600',
};

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
