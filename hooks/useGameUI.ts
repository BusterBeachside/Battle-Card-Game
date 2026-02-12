
import { useState, useEffect, useCallback } from 'react';
import { GameMode, GameState, Card } from '../types';
import { sortHand } from '../utils/cards';

export const useGameUI = () => {
    // Meta State
    const [menuStep, setMenuStep] = useState<'MODE' | 'PLAYERS' | 'TUTORIAL_MENU'>('MODE');
    const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
    const [isCoinFlipping, setIsCoinFlipping] = useState(false);
    const [autoSort, setAutoSort] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Modal/Overlay State
    const [showEndTurnModal, setShowEndTurnModal] = useState(false);
    const [showResignModal, setShowResignModal] = useState(false);
    const [showQuitModal, setShowQuitModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [viewingDiscard, setViewingDiscard] = useState<'SHARED' | number | null>(null);
    const [showMobileLog, setShowMobileLog] = useState(false);

    // Sandbox State
    const [sandboxToolsOpen, setSandboxToolsOpen] = useState(false);
    const [sandboxSearchTerm, setSandboxSearchTerm] = useState("");
    const [sandboxTargetPlayer, setSandboxTargetPlayer] = useState<0 | 1>(0);
    const [selectedSandboxCard, setSelectedSandboxCard] = useState<Card | null>(null);
    const [cardActionTarget, setCardActionTarget] = useState<{card: Card, loc: string, ownerId: number, instanceId?: string} | null>(null);
    const [showPlaySetup, setShowPlaySetup] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleAutoSort = useCallback((setGameState: React.Dispatch<React.SetStateAction<GameState | null>>, getActiveDecisionPlayerId: (s: GameState) => number) => {
        setAutoSort(prev => {
            const next = !prev;
            if (!next) {
                 setGameState(prevGs => {
                    if(!prevGs) return null;
                    const activePid = getActiveDecisionPlayerId(prevGs);
                    const nextPlayers = [...prevGs.players];
                    nextPlayers[activePid].hand = sortHand(nextPlayers[activePid].hand);
                    return { ...prevGs, players: nextPlayers };
                 });
            }
            return next;
        });
    }, []);

    const resetModals = useCallback(() => {
        setShowQuitModal(false);
        setShowResignModal(false);
        setShowMenu(false);
        setShowEndTurnModal(false);
        setViewingDiscard(null);
    }, []);

    return {
        menuStep, setMenuStep,
        selectedMode, setSelectedMode,
        isCoinFlipping, setIsCoinFlipping,
        autoSort, toggleAutoSort, setAutoSort,
        isMobile,
        showEndTurnModal, setShowEndTurnModal,
        showResignModal, setShowResignModal,
        showQuitModal, setShowQuitModal,
        showMenu, setShowMenu,
        viewingDiscard, setViewingDiscard,
        showMobileLog, setShowMobileLog,
        sandboxToolsOpen, setSandboxToolsOpen,
        sandboxSearchTerm, setSandboxSearchTerm,
        sandboxTargetPlayer, setSandboxTargetPlayer,
        selectedSandboxCard, setSelectedSandboxCard,
        cardActionTarget, setCardActionTarget,
        showPlaySetup, setShowPlaySetup,
        resetModals
    };
};
