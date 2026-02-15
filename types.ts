
export enum Suit {
  Spades = '♠',
  Clubs = '♣',
  Hearts = '♥',
  Diamonds = '♦',
}

export enum Color {
  Black = 'BLACK', // Physical
  Red = 'RED', // Magical
}

export enum Rank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
}

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  numericValue: number; // 2-10, J=11, Q=12, K=13, A=1
  cost: number;
  baseColor: Color;
}

export interface FieldCard {
  instanceId: string;
  card: Card;
  ownerId: number;
  isTapped: boolean;
  isSummoningSick: boolean;
  attachedCards: Card[]; // For Queens
  currentHealth?: number;
}

export enum Phase {
  INIT_SELECT = 'INIT_SELECT', // Choosing initial resources
  UPKEEP = 'UPKEEP',
  DRAW = 'DRAW',
  RESOURCE_START = 'RESOURCE_START', // Decision: Play new or swap?
  RESOURCE_ADD_SELECT = 'RESOURCE_ADD_SELECT',
  RESOURCE_SWAP_SELECT_HAND = 'RESOURCE_SWAP_SELECT_HAND',
  RESOURCE_SWAP_SELECT_PILE = 'RESOURCE_SWAP_SELECT_PILE',
  MAIN = 'MAIN',
  ATTACK_DECLARE = 'ATTACK_DECLARE',
  BLOCK_DECLARE = 'BLOCK_DECLARE',
  DAMAGE = 'DAMAGE',
  END = 'END',
  GAME_OVER = 'GAME_OVER',
}

export interface PlayerState {
  id: number;
  name: string;
  isCpu: boolean;
  life: number;
  hand: Card[];
  library: Card[]; // Deck for Pro mode
  resources: FieldCard[]; // Changed from Card[] to FieldCard[] to support tapping
  field: FieldCard[];
  discard: Card[];
  consecutiveDrawFailures: number;
  hasAttackedThisTurn: boolean;
}

export type GameMode = 'STREET' | 'PRO' | 'SANDBOX' | 'TUTORIAL';

export interface LogEntry {
  id: string;
  text: string;
}

export interface TutorialState {
  active: boolean;
  lessonId?: string;
  currentStepIndex: number;
  steps: TutorialStep[];
  completed?: boolean;
}

export interface GameState {
  mode: GameMode;
  isSandboxRun?: boolean;
  isMultiBlockingEnabled?: boolean;
  deck: Card[]; // Shared deck for Street mode
  players: PlayerState[];
  turnPlayer: number; // 0 or 1
  startingPlayerId: number;
  phase: Phase;
  turnCount: number;
  pendingAttackers: string[]; // instanceIds
  pendingBlocks: Record<string, string>; // blockerId -> attackerId
  selectedCardId: string | null; // For hand interaction
  targetMode: 'NONE' | 'QUEEN' | 'KING';
  sourceCardId: string | null; // The card initiating the target mode
  winner: number | null; // 0, 1, or -1 (Draw)
  logs: LogEntry[];
  initSelectedIds: string[];
  recentDamage: Record<string, number>;
  activeCombatCardId: string | null;
  tutorialState?: TutorialState;
}

export interface FlyingCard {
  id: string;
  card: Card;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
}

export interface FlyingText {
  id: string;
  text: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
}

export interface SoulTrail {
    id: string;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    color: string;
}

export interface DragState {
  cardId: string;
  sourceType: 'HAND' | 'FIELD';
  ownerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  cardObj: Card;
  instanceId?: string;
}

export interface TutorialStep {
  id: string;
  instructionText: string;
  highlightElementId?: string;
  highlightMode?: 'MASK' | 'OUTLINE' | 'NONE';
  requiredAction: 'NONE' | 'CLICK_UI_BUTTON' | 'CLICK_CARD' | 'PLAY_CARD' | 'DECLARE_BLOCK' | 'PHASE_CHANGE';
  targetId?: string;
  allowedInteractionIds?: string[];
}

export interface TutorialLessonConfig {
  id: string;
  title: string;
  subtitle: string;
  steps: TutorialStep[];
  setup?: {
    p1Hand?: Card[];
    p1Resources?: Card[];
    p1Field?: Card[];
    p1Life?: number;
    p2Hand?: Card[];
    p2Resources?: Card[];
    p2Field?: Card[];
    p2Life?: number;
    phase?: Phase;
    startingPlayerId?: number;
  }
}
