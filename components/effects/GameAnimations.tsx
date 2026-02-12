
import React, { useState, useLayoutEffect, useEffect } from 'react';
import { CardDisplay } from '../CardDisplay';
import { Card, FlyingCard, Rank, SoulTrail } from '../../types';

export const Flyer: React.FC<{ fc: FlyingCard }> = ({ fc }) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        left: fc.startX,
        top: fc.startY,
        position: 'fixed',
        zIndex: 100,
        transform: 'translate(0px, 0px) scale(1) rotate(0deg)',
        transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
        pointerEvents: 'none'
    });

    useLayoutEffect(() => {
        const deltaX = fc.targetX - fc.startX;
        const deltaY = fc.targetY - fc.startY;
        
        requestAnimationFrame(() => {
            setStyle(prev => ({
                ...prev,
                transform: `translate(${deltaX}px, ${deltaY}px) scale(0.6) rotate(360deg)`
            }));
        });
    }, [fc]);

    return (
        <div style={style}>
            <CardDisplay card={fc.card} showBack={true} size="md" />
        </div>
    );
};

export const SoulOrb: React.FC<{ trail: SoulTrail }> = ({ trail }) => {
    // Calculate angle ONCE at start so it doesn't spin during flight
    const dx = trail.targetX - trail.startX;
    const dy = trail.targetY - trail.startY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const [style, setStyle] = useState<React.CSSProperties>({
        left: trail.startX,
        top: trail.startY,
        position: 'fixed',
        width: '48px',
        height: '48px',
        zIndex: 200,
        // Set initial rotation immediately
        transform: `translate(-50%, -50%) rotate(${angle}deg) scale(1)`,
        opacity: 1,
        // Animate position and scale/opacity, but rotation stays fixed (via the transform string)
        transition: 'left 0.8s ease-in, top 0.8s ease-in, opacity 0.8s ease-in, transform 0.8s ease-in',
        pointerEvents: 'none'
    });

    useLayoutEffect(() => {
        requestAnimationFrame(() => {
            setStyle(prev => ({
                ...prev,
                left: trail.targetX,
                top: trail.targetY,
                opacity: 0,
                // Maintain angle, shrink scale
                transform: `translate(-50%, -50%) rotate(${angle}deg) scale(0.2)`
            }));
        });
    }, [trail, angle]);

    const isRed = trail.color === 'red';
    const glowColor = isRed ? '#dc2626' : '#2563eb'; // Deep Red or Blue
    const coreColor = isRed ? '#fca5a5' : '#93c5fd'; // Light Red or Blue
    const trailColor = isRed ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)';

    return (
        <div style={style}>
            {/* The Orb Core */}
            <div 
                className="absolute inset-0 rounded-full z-10"
                style={{
                    backgroundColor: 'white',
                    boxShadow: `0 0 20px 5px ${glowColor}, inset 0 0 10px ${glowColor}`
                }}
            />
            
            {/* The Inner Core Glow */}
            <div 
                className="absolute inset-2 rounded-full z-20 animate-pulse"
                style={{ backgroundColor: coreColor }}
            />

            {/* The Trail */}
            <div 
                className="absolute right-1/2 top-1/2 origin-right rounded-l-full z-0"
                style={{
                    width: '200px',
                    height: '40px',
                    transform: 'translateY(-50%) translateX(20px)', // Push slightly into the head
                    background: `linear-gradient(to left, ${trailColor} 0%, transparent 100%)`,
                    filter: 'blur(8px)',
                }}
            />
            {/* Secondary Trail for Intensity */}
            <div 
                className="absolute right-1/2 top-1/2 origin-right rounded-l-full z-0"
                style={{
                    width: '100px',
                    height: '20px',
                    transform: 'translateY(-50%) translateX(10px)',
                    background: `linear-gradient(to left, white 0%, transparent 100%)`,
                    filter: 'blur(4px)',
                    opacity: 0.6
                }}
            />
        </div>
    );
};

export const SpecialCardAnimation: React.FC<{ type: 'K' | 'Q' | 'J', card: Card, targetRect?: DOMRect, onComplete: () => void }> = ({ type, card, targetRect, onComplete }) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%) scale(0.5)',
        opacity: 0,
        zIndex: 200,
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });

    const [label, setLabel] = useState("");
    const [colorClass, setColorClass] = useState("");

    useEffect(() => {
        let animDuration = 1000;
        
        if (type === 'K') {
            setLabel("EXECUTE");
            setColorClass("text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]");
            animDuration = 1200;
        } else if (type === 'Q') {
            setLabel("SHIFT");
            setColorClass("text-fuchsia-500 drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]");
            animDuration = 1000;
        } else if (type === 'J') {
            setLabel("REINFORCE");
            setColorClass("text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]");
            animDuration = 800;
        }

        requestAnimationFrame(() => {
            const destX = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth / 2;
            const destY = targetRect ? targetRect.top + targetRect.height / 2 : window.innerHeight / 2;
            
            const finalLeft = type === 'J' ? '50%' : destX;
            const finalTop = type === 'J' ? '50%' : destY;
            const transform = type === 'J' ? 'translate(-50%, -50%) scale(1.2)' : 'translate(-50%, -50%) scale(1.5)';

            setStyle({
                position: 'fixed',
                left: finalLeft,
                top: finalTop,
                transform: transform,
                opacity: 1,
                zIndex: 200,
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            });
        });

        setTimeout(onComplete, animDuration);
    }, []);

    return (
        <div style={style} className="flex flex-col items-center justify-center pointer-events-none">
            <div className={`shadow-[0_0_50px_rgba(255,255,255,0.2)] rounded-lg ${type === 'Q' ? 'animate-pulse' : ''}`}>
                <CardDisplay card={card} size="lg" showBack={false} />
            </div>
            <div className={`mt-4 text-4xl font-black font-title uppercase tracking-widest ${colorClass} animate-bounce`}>
                {label}
            </div>
        </div>
    );
};
