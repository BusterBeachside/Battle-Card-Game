
import { useState, useCallback } from 'react';
import { Card, FlyingCard, FlyingText, SoulTrail, SummoningCard } from '../types';
import { generateId } from '../utils/core';

interface DamageAnimInstance {
    id: string;
    val: number;
    playerId: number;
    onApply?: () => void;
}

export const useGameEffects = () => {
    const [flyingTexts, setFlyingTexts] = useState<FlyingText[]>([]);
    const [flyingCards, setFlyingCards] = useState<FlyingCard[]>([]);
    const [summoningCards, setSummoningCards] = useState<SummoningCard[]>([]);
    const [soulTrails, setSoulTrails] = useState<SoulTrail[]>([]);
    const [explosions, setExplosions] = useState<{ id: string, x: number, y: number }[]>([]);
    const [damageAnims, setDamageAnims] = useState<DamageAnimInstance[]>([]);
    const [specialAnim, setSpecialAnim] = useState<{ type: 'K'|'Q'|'J', card: Card, targetRect?: DOMRect } | null>(null);
    const [showTurnAnim, setShowTurnAnim] = useState(false);
    const [screenShake, setScreenShake] = useState<{ intensity: number } | null>(null);

    const triggerFlyer = useCallback(async (
        card: Card, 
        startRect: DOMRect, 
        targetRect: DOMRect, 
        showFace: boolean = false, 
        onComplete?: () => void,
        pauseDuration?: number
    ): Promise<void> => {
        return new Promise(resolve => {
            const id = generateId();
            
            const handleComplete = () => {
                setFlyingCards(prev => prev.filter(f => f.id !== id));
                if (onComplete) onComplete();
                resolve();
            };

            const newFly: FlyingCard = {
                id, card, 
                startX: startRect.left, 
                startY: startRect.top, 
                targetX: targetRect.left + targetRect.width / 2 - 40, // Centering for md card (80px width)
                targetY: targetRect.top + targetRect.height / 2 - 56, // Centering for md card (112px height)
                showFace,
                pauseDuration,
                onComplete: handleComplete
            };
            setFlyingCards(prev => [...prev, newFly]);
        });
    }, []);

    const triggerSummon = useCallback(async (
        card: Card,
        startRect: DOMRect,
        targetElementId: string,
        ownerId: number
    ): Promise<void> => {
        return new Promise(resolve => {
            const id = generateId();
            
            const handleComplete = () => {
                setSummoningCards(prev => prev.filter(s => s.id !== id));
                resolve();
            };

            const newSummon: SummoningCard = {
                id,
                card,
                startX: startRect.left,
                startY: startRect.top,
                targetElementId,
                ownerId,
                onComplete: handleComplete
            };
            setSummoningCards(prev => [...prev, newSummon]);
        });
    }, []);

    const triggerExplosion = useCallback((instanceId: string) => {
        const el = document.getElementById(instanceId);
        if (el) {
            const rect = el.getBoundingClientRect();
            setExplosions(prev => [...prev, { id: generateId(), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }]);
        }
    }, []);

    const removeExplosion = useCallback((id: string) => {
        setExplosions(prev => prev.filter(e => e.id !== id));
    }, []);
    
    const triggerSoulTrail = useCallback((instanceId: string, targetRect: DOMRect, color: string = 'cyan') => {
        const el = document.getElementById(instanceId);
        if (el) {
            const rect = el.getBoundingClientRect();
            const id = generateId();
            setSoulTrails(prev => [...prev, {
                id,
                startX: rect.left + rect.width / 2,
                startY: rect.top + rect.height / 2,
                targetX: targetRect.left + targetRect.width / 2,
                targetY: targetRect.top + targetRect.height / 2,
                color
            }]);
            setTimeout(() => {
                setSoulTrails(prev => prev.filter(s => s.id !== id));
            }, 800);
        }
    }, []);

    const addDamageAnim = useCallback((val: number, playerId: number, onApply?: () => void) => {
        setDamageAnims(prev => [...prev, { id: generateId(), val, playerId, onApply }]);
    }, []);

    const triggerScreenShake = useCallback((intensity: number) => {
        setScreenShake({ intensity });
        setTimeout(() => setScreenShake(null), 300);
    }, []);

    const hasActiveAnimations = flyingTexts.length > 0 || 
                                flyingCards.length > 0 || 
                                summoningCards.length > 0 || 
                                soulTrails.length > 0 || 
                                explosions.length > 0 || 
                                damageAnims.length > 0 || 
                                specialAnim !== null;

    return {
        flyingTexts, setFlyingTexts,
        flyingCards, triggerFlyer,
        summoningCards, triggerSummon,
        soulTrails, triggerSoulTrail,
        explosions, triggerExplosion, removeExplosion,
        damageAnims, setDamageAnims, addDamageAnim,
        specialAnim, setSpecialAnim,
        showTurnAnim, setShowTurnAnim,
        screenShake, triggerScreenShake,
        hasActiveAnimations
    };
};
