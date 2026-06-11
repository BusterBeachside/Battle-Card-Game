
import React, { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { CardDisplay } from '../CardDisplay';
import { Card, FlyingCard, Rank, SoulTrail, SummoningCard, Color } from '../../types';

export const Flyer: React.FC<{ fc: FlyingCard }> = ({ fc }) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        left: 0,
        top: 0,
        position: 'fixed',
        zIndex: 100,
        transform: `translate3d(${fc.startX}px, ${fc.startY}px, 0) scale(0.6) rotate(0deg)`,
        transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        pointerEvents: 'none',
        willChange: 'transform'
    });

    useEffect(() => {
        const centerX = window.innerWidth / 2 - 40; // 40 = half of w-20 (80px)
        const centerY = window.innerHeight / 2 - 56; // 56 = half of h-28 (112px)
        
        let timeout1: number, timeout2: number;

        if (fc.pauseDuration && fc.pauseDuration > 0) {
            // STEP 1: Move to Center using only translation on GPU layer
            requestAnimationFrame(() => {
                setStyle(prev => ({
                    ...prev,
                    transform: `translate3d(${centerX}px, ${centerY}px, 0) scale(1.5) rotate(360deg)`, 
                    transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }));
            });

            // STEP 2: Wait then Move to Target using only translation on GPU layer
            timeout1 = window.setTimeout(() => {
                setStyle(prev => ({
                    ...prev,
                    transform: `translate3d(${fc.targetX}px, ${fc.targetY}px, 0) scale(0.8) rotate(360deg)`, // Approx hand scale
                    transition: 'transform 0.5s ease-in-out'
                }));
            }, 500 + fc.pauseDuration); // Fly time + pause

            // Finish
            timeout2 = window.setTimeout(() => {
                if (fc.onComplete) fc.onComplete();
            }, 500 + fc.pauseDuration + 500);

        } else {
            // Standard Direct Flight using absolute coordinates translated on GPU layer
            requestAnimationFrame(() => {
                setStyle(prev => ({
                    ...prev,
                    transform: `translate3d(${fc.targetX}px, ${fc.targetY}px, 0) scale(0.6) rotate(360deg)`
                }));
            });
            
            timeout1 = window.setTimeout(() => {
                if (fc.onComplete) fc.onComplete();
            }, 600);
        }

        return () => {
            clearTimeout(timeout1);
            clearTimeout(timeout2);
        };
    }, []);

    return (
        <div style={style}>
            <CardDisplay card={fc.card} showBack={!fc.showFace} size="md" cardBack={fc.cardBack} cardFace={fc.cardFace} />
        </div>
    );
};

export const Summoner: React.FC<{ sc: SummoningCard }> = ({ sc }) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        left: 0,
        top: 0,
        position: 'fixed',
        zIndex: 200,
        transform: `translate3d(${sc.startX}px, ${sc.startY}px, 0) translate(-50%, -50%) scale(0.8) rotate(0deg)`,
        transition: 'transform 0.4s ease-out, opacity 0.4s ease-out',
        pointerEvents: 'none',
        opacity: 1,
        willChange: 'transform, opacity'
    });
    
    const [phase, setPhase] = useState<'LIFT' | 'HOVER' | 'SLAM'>('LIFT');

    useEffect(() => {
        // Calculate Target Coordinates using exact element ID
        const targetEl = document.getElementById(sc.targetElementId);
        let targetX = window.innerWidth / 2;
        let targetY = window.innerHeight / 2;

        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            targetX = rect.left + rect.width / 2;
            targetY = rect.top + rect.height / 2;
        }

        // Phase 1: Lift & Reveal (Immediate)
        // We move it to slightly above the target zone, larger scale
        const isRed = sc.card.baseColor === Color.Red;
        const liftY = targetY + (sc.ownerId === 0 ? 50 : -50); // Slightly offset from lane center towards player

        requestAnimationFrame(() => {
            setStyle({
                left: 0,
                top: 0,
                position: 'fixed',
                zIndex: 300,
                transform: `translate3d(${targetX}px, ${liftY}px, 0) translate(-50%, -50%) scale(1.4) rotate(0deg)`,
                transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Spring out
                pointerEvents: 'none',
                boxShadow: isRed ? '0 0 30px rgba(220, 38, 38, 0.6)' : '0 0 30px rgba(99, 102, 241, 0.6)',
                willChange: 'transform, opacity'
            });
        });

        // Phase 2: Hover (Pause for recognition)
        const hoverTimer = setTimeout(() => {
            setPhase('HOVER');
        }, 400);

        // Phase 3: Slam (Down to board)
        const slamTimer = setTimeout(() => {
            setPhase('SLAM');
            setStyle(prev => ({
                ...prev,
                transform: `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%) scale(1.0)`,
                transition: 'transform 0.2s cubic-bezier(0.6, -0.28, 0.735, 0.045)', // Hard impact ease
                zIndex: 200
            }));
        }, 900); // 400ms lift + 500ms hover

        // Complete
        const doneTimer = setTimeout(() => {
            if (sc.onComplete) sc.onComplete();
        }, 1150); // 900 + 250ms slam

        return () => {
            clearTimeout(hoverTimer);
            clearTimeout(slamTimer);
            clearTimeout(doneTimer);
        };
    }, []);

    return (
        <div style={style}>
            <CardDisplay card={sc.card} showBack={false} size="md" cardFace={sc.cardFace} cardBack={sc.cardBack} />
            {phase === 'SLAM' && (
                <div className="absolute inset-0 -m-8 z-[-1] animate-ping opacity-50 bg-white rounded-full" />
            )}
        </div>
    );
};

export const SoulOrb: React.FC<{ trail: SoulTrail }> = ({ trail }) => {
    // Calculate angle ONCE at start so it doesn't spin during flight
    const dx = trail.targetX - trail.startX;
    const dy = trail.targetY - trail.startY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const [style, setStyle] = useState<React.CSSProperties>({
        left: 0,
        top: 0,
        position: 'fixed',
        width: '48px',
        height: '48px',
        zIndex: 200,
        // Set initial rotation immediately
        transform: `translate3d(${trail.startX}px, ${trail.startY}px, 0) translate(-50%, -50%) rotate(${angle}deg) scale(1)`,
        opacity: 1,
        transition: 'transform 0.8s ease-in, opacity 0.8s ease-in',
        pointerEvents: 'none',
        willChange: 'transform, opacity'
    });

    useLayoutEffect(() => {
        requestAnimationFrame(() => {
            setStyle(prev => ({
                ...prev,
                opacity: 0,
                // Maintain angle, shrink scale
                transform: `translate3d(${trail.targetX}px, ${trail.targetY}px, 0) translate(-50%, -50%) rotate(${angle}deg) scale(0.2)`
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

export const SpecialCardAnimation: React.FC<{ type: 'K' | 'Q' | 'J', card: Card, targetRect?: DOMRect, cardFace?: string, cardBack?: string, onComplete: () => void }> = ({ type, card, targetRect, cardFace, cardBack, onComplete }) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        position: 'fixed',
        left: 0,
        top: 0,
        transform: `translate3d(${window.innerWidth / 2}px, ${window.innerHeight / 2}px, 0) translate(-50%, -50%) scale(0.5)`,
        opacity: 0,
        zIndex: 200,
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        willChange: 'transform, opacity'
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
            
            const finalX = type === 'J' ? window.innerWidth / 2 : destX;
            const finalY = type === 'J' ? window.innerHeight / 2 : destY;
            const scale = type === 'J' ? 1.2 : 1.5;

            setStyle({
                position: 'fixed',
                left: 0,
                top: 0,
                transform: `translate3d(${finalX}px, ${finalY}px, 0) translate(-50%, -50%) scale(${scale})`,
                opacity: 1,
                zIndex: 200,
                transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                willChange: 'transform, opacity'
            });
        });

        setTimeout(onComplete, animDuration);
    }, []);

    return (
        <div style={style} className="flex flex-col items-center justify-center pointer-events-none">
            <div className={`shadow-[0_0_50px_rgba(255,255,255,0.2)] rounded-lg ${type === 'Q' ? 'animate-pulse' : ''}`}>
                <CardDisplay card={card} size="lg" showBack={false} cardFace={cardFace} cardBack={cardBack} />
            </div>
            <div className={`mt-4 text-4xl font-black font-title uppercase tracking-widest ${colorClass} animate-bounce`}>
                {label}
            </div>
        </div>
    );
};
