
import { useState, useCallback } from 'react';
import { Card, FlyingCard, FlyingText, SoulTrail } from '../types';
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
    const [soulTrails, setSoulTrails] = useState<SoulTrail[]>([]);
    const [explosions, setExplosions] = useState<{ id: string, x: number, y: number }[]>([]);
    const [damageAnims, setDamageAnims] = useState<DamageAnimInstance[]>([]);
    const [specialAnim, setSpecialAnim] = useState<{ type: 'K'|'Q'|'J', card: Card, targetRect?: DOMRect } | null>(null);
    const [showTurnAnim, setShowTurnAnim] = useState(false);
    const [screenShake, setScreenShake] = useState<{ intensity: number } | null>(null);

    const triggerFlyer = useCallback(async (card: Card, startRect: DOMRect, targetRect: DOMRect): Promise<void> => {
        return new Promise(resolve => {
            const id = generateId();
            const newFly: FlyingCard = {
                id, card, 
                startX: startRect.left, 
                startY: startRect.top, 
                targetX: targetRect.left + targetRect.width / 2 - 20, 
                targetY: targetRect.top + targetRect.height / 2 - 30
            };
            setFlyingCards(prev => [...prev, newFly]);
            setTimeout(() => { 
                setFlyingCards(prev => prev.filter(f => f.id !== id)); 
                resolve(); 
            }, 600);
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

    return {
        flyingTexts, setFlyingTexts,
        flyingCards, triggerFlyer,
        soulTrails, triggerSoulTrail,
        explosions, triggerExplosion, removeExplosion,
        damageAnims, setDamageAnims, addDamageAnim,
        specialAnim, setSpecialAnim,
        showTurnAnim, setShowTurnAnim,
        screenShake, triggerScreenShake
    };
};
