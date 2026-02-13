
import React from 'react';
import { GameState, PlayerState, Card, DragState, Phase } from '../../types';

export interface GameHandlers {
    onCardClick: (card: Card, location: 'HAND' | 'RESOURCE' | 'FIELD', ownerId: number, instanceId?: string) => void;
    onDragStart: (e: React.MouseEvent, card: Card, type: 'HAND' | 'FIELD', ownerId: number, instanceId?: string) => void;
    onPhaseAction: (action: 'ATTACK_PHASE' | 'END_TURN' | 'CONFIRM_ATTACK' | 'CONFIRM_BLOCK' | 'ADD_RESOURCE' | 'SWAP_RESOURCE' | 'CANCEL_RESOURCE' | 'CONFIRM_INIT') => void;
    setViewingDiscard: (view: 'SHARED' | number | null) => void;
    setShowMenu: (show: boolean) => void;
    toggleLog?: () => void;
}

export interface GameRefs {
    handRef: React.RefObject<HTMLDivElement>;
    cpuHandRef: React.RefObject<HTMLDivElement>;
    topDeckRef: React.RefObject<HTMLDivElement>;
    bottomDeckRef: React.RefObject<HTMLDivElement>;
    lifeIconRef: React.RefObject<HTMLDivElement>;
    bottomLifeRef: React.RefObject<HTMLDivElement>;
    topDiscardRef: React.RefObject<HTMLButtonElement | HTMLDivElement>;
    bottomDiscardRef: React.RefObject<HTMLButtonElement | HTMLDivElement>;
}

export interface LayoutProps {
    gameState: GameState;
    topPlayer: PlayerState;
    bottomPlayer: PlayerState;
    activeDecisionPlayerId: number;
    isInteractive: boolean;
    dragState: DragState | null;
    handlers: GameHandlers;
    refs: GameRefs;
    uiState: {
        showMobileLog: boolean;
        showMenu: boolean;
    };
}