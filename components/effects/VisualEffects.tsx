
import React, { useEffect, useState } from 'react';

export const Confetti: React.FC = () => {
    const particles = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100 + '%',
        animationDelay: Math.random() * 2 + 's',
        backgroundColor: ['#ef4444', '#3b82f6', '#eab308', '#a855f7'][Math.floor(Math.random() * 4)],
        rotation: Math.random() * 360 + 'deg'
    }));

    return (
        <div className="fixed inset-0 pointer-events-none z-[130] overflow-hidden">
            {particles.map(p => (
                <div 
                    key={p.id}
                    className="absolute w-3 h-3 rounded-sm animate-fall"
                    style={{
                        left: p.left,
                        top: '-20px',
                        backgroundColor: p.backgroundColor,
                        transform: `rotate(${p.rotation})`,
                        animation: `fall 3s linear infinite ${p.animationDelay}`
                    }}
                />
            ))}
            <style>{`
                @keyframes fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export const Explosion: React.FC<{ x: number; y: number; onComplete: () => void }> = ({ x, y, onComplete }) => {
    useEffect(() => {
        const t = setTimeout(onComplete, 800);
        return () => clearTimeout(t);
    }, [onComplete]);

    return (
        <div 
            className="fixed pointer-events-none z-[150] flex items-center justify-center"
            style={{ left: x, top: y, width: 0, height: 0 }}
        >
            {[...Array(8)].map((_, i) => (
                <div 
                    key={i}
                    className="absolute bg-white border border-slate-300 w-4 h-6 rounded-sm shadow-xl"
                    style={{
                        animation: `shatter-${i} 0.8s ease-out forwards`,
                        transformOrigin: 'center',
                    }}
                />
            ))}
            {/* Shortened burst animation */}
            <div 
                className="absolute w-20 h-20 bg-white rounded-full opacity-50" 
                style={{ animation: 'burst 0.5s ease-out forwards' }}
            />
            <style>{`
                @keyframes burst {
                    0% { transform: scale(0); opacity: 0.8; }
                    100% { transform: scale(2); opacity: 0; }
                }
                ${[...Array(8)].map((_, i) => {
                    const angle = (i / 8) * 360;
                    const dist = 60 + Math.random() * 40;
                    return `
                        @keyframes shatter-${i} {
                            0% { transform: rotate(${angle}deg) translate(0px) rotate(0deg); opacity: 1; }
                            100% { transform: rotate(${angle}deg) translate(${dist}px) rotate(${Math.random() * 360}deg); opacity: 0; }
                        }
                    `;
                }).join('\n')}
            `}</style>
        </div>
    );
};

export const DamageOverlay: React.FC<{ dmg: number, targetRef: React.RefObject<HTMLDivElement>, onComplete: () => void, onImpact?: () => void }> = ({ dmg, targetRef, onComplete, onImpact }) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(0.5)',
        opacity: 0,
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });

    useEffect(() => {
        // Phase 1: POP
        requestAnimationFrame(() => {
            setStyle({
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(1.5)',
                opacity: 1,
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            });
        });

        // Phase 2: FLY
        const flyTimer = setTimeout(() => {
            if (targetRef.current) {
                const rect = targetRef.current.getBoundingClientRect();
                setStyle({
                    position: 'fixed',
                    top: rect.top + rect.height/2,
                    left: rect.left + rect.width/2,
                    transform: 'translate(-50%, -50%) scale(0.5)',
                    opacity: 0.5,
                    transition: 'all 0.6s ease-in-out'
                });
            }
        }, 600);

        // Phase 3: IMPACT & COMPLETE
        // Flight takes 600ms (transition duration defined in Phase 2 style)
        // Total time = 600ms (pop) + 600ms (fly) = 1200ms
        const completeTimer = setTimeout(() => {
            if (onImpact) onImpact();
            onComplete();
        }, 1200);

        return () => {
            clearTimeout(flyTimer);
            clearTimeout(completeTimer);
        };
    }, []);

    return (
        <div 
            className="z-[100] pointer-events-none text-red-500 font-black text-8xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]" 
            style={{ 
                ...style, 
                textShadow: '-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff' 
            }}
        >
            -{dmg}
        </div>
    );
};
