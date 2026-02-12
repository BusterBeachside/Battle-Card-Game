
import React, { useState, useEffect } from 'react';

const SUITS = ['♠', '♣', '♥', '♦'];

interface Particle {
    id: number;
    suit: string;
    isRed: boolean;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
    rotation: number;
}

export const MainMenuBackground: React.FC = () => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        // Generate particles only on client side to avoid hydration mismatch
        const newParticles = Array.from({ length: 30 }).map((_, i) => {
            const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
            const isRed = suit === '♥' || suit === '♦';
            return {
                id: i,
                suit,
                isRed,
                x: Math.random() * 100, // 0-100%
                y: Math.random() * 100, // 0-100%
                size: Math.random() * 6 + 3, // 3rem to 9rem
                duration: Math.random() * 30 + 20, // 20s to 50s
                delay: Math.random() * -30, // Negative delay to start mid-animation
                opacity: Math.random() * 0.15 + 0.05, // 0.05 to 0.20
                rotation: Math.random() * 360
            };
        });
        setParticles(newParticles);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-slate-950">
            {/* Deep Background Gradient - Top Spotlight */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-black"></div>
            
            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.05]" 
                 style={{ 
                     backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
                 }}
            ></div>

            {/* Floating Particles */}
            {particles.map((p) => (
                <div 
                    key={p.id}
                    className="absolute font-serif font-bold animate-float-slow"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        fontSize: `${p.size}rem`,
                        color: p.isRed ? '#ef4444' : '#6366f1', // Red-500 or Indigo-500
                        opacity: p.opacity,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`,
                        textShadow: p.isRed ? '0 0 40px rgba(220,38,38,0.6)' : '0 0 40px rgba(99,102,241,0.6)',
                        transform: `rotate(${p.rotation}deg)`,
                        filter: 'blur(1px)'
                    }}
                >
                    {p.suit}
                </div>
            ))}

            {/* Bottom Vignette to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
            
            <style>{`
                @keyframes float-slow {
                    0% { transform: translateY(0) rotate(0deg) scale(1); }
                    33% { transform: translateY(-40px) rotate(5deg) scale(1.1); }
                    66% { transform: translateY(20px) rotate(-5deg) scale(0.95); }
                    100% { transform: translateY(0) rotate(0deg) scale(1); }
                }
                .animate-float-slow {
                    animation-name: float-slow;
                    animation-timing-function: ease-in-out;
                    animation-iteration-count: infinite;
                }
            `}</style>
        </div>
    );
};
