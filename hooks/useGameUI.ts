
import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, GameState, Card } from '../types';
import { sortHand } from '../utils/cards';
import { setGlobalSfxVolume, setGlobalMusicVolume } from '../utils/soundUtils';

export const useGameUI = () => {
    // Meta State
    const [menuStep, setMenuStep] = useState<'MODE' | 'PLAYERS' | 'TUTORIAL_MENU'>('MODE');
    const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
    const [isCoinFlipping, setIsCoinFlipping] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [enableMultiBlocking, setEnableMultiBlocking] = useState(false);

    // Persistent Settings
    const [autoSort, setAutoSort] = useState(() => {
        try {
            const saved = localStorage.getItem('battle_autosort');
            return saved !== null ? JSON.parse(saved) : true;
        } catch { return true; }
    });
    const [sfxVolume, setSfxVolumeState] = useState(() => {
        try {
            const saved = localStorage.getItem('battle_sfx_volume');
            return saved !== null ? parseFloat(saved) : 0.5;
        } catch { return 0.5; }
    });
    const [musicVolume, setMusicVolumeState] = useState(() => {
        try {
            const saved = localStorage.getItem('battle_music_volume');
            return saved !== null ? parseFloat(saved) : 0.5;
        } catch { return 0.5; }
    });

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

    // Initialize Audio Engine with stored values on mount
    useEffect(() => {
        setGlobalSfxVolume(sfxVolume);
        setGlobalMusicVolume(musicVolume);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleAutoSort = useCallback((setGameState: React.Dispatch<React.SetStateAction<GameState | null>>, getActiveDecisionPlayerId: (s: GameState) => number) => {
        setAutoSort(prev => {
            const next = !prev;
            localStorage.setItem('battle_autosort', JSON.stringify(next));
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

    const setSfxVolume = useCallback((v: number) => {
        setSfxVolumeState(v);
        setGlobalSfxVolume(v);
        localStorage.setItem('battle_sfx_volume', v.toString());
    }, []);

    const setMusicVolume = useCallback((v: number) => {
        setMusicVolumeState(v);
        setGlobalMusicVolume(v);
        localStorage.setItem('battle_music_volume', v.toString());
    }, []);

    const resetModals = useCallback(() => {
        setShowQuitModal(false);
        setShowResignModal(false);
        setShowMenu(false);
        setShowEndTurnModal(false);
        setViewingDiscard(null);
        setShowOptions(false);
    }, []);

    return {
        menuStep, setMenuStep,
        selectedMode, setSelectedMode,
        isCoinFlipping, setIsCoinFlipping,
        autoSort, toggleAutoSort, setAutoSort,
        isMobile,
        showOptions, setShowOptions,
        enableMultiBlocking, setEnableMultiBlocking,
        sfxVolume, setSfxVolume,
        musicVolume, setMusicVolume,
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
