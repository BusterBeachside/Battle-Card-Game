import React, { useState, useEffect } from 'react';

export const CoinFlipOverlay: React.FC<{ onComplete: (winner: number) => void, p1Name: string, p2Name: string }> = ({ onComplete, p1Name, p2Name }) => {
    const [rotation, setRotation] = useState(0);
    const [resultText, setResultText] = useState("Flipping...");

    useEffect(() => {
        const winner = Math.random() > 0.5 ? 0 : 1;
        const target = 1800 + (winner === 1 ? 180 : 0);
        
        requestAnimationFrame(() => {
            setRotation(target);
        });

        const spinDuration = 2000;
        const resultDuration = 1500;

        setTimeout(() => {
            setResultText(winner === 0 ? `HEADS! ${p1Name} goes first.` : `TAILS! ${p2Name} goes first.`);
            setTimeout(() => {
                onComplete(winner);
            }, resultDuration);
        }, spinDuration);
    }, []);

    return (
        <div className="fixed inset-0 z-[150] bg-slate-900/90 flex flex-col items-center justify-center">
            <div 
                className="relative w-48 h-48 transition-all duration-[2000ms] ease-out"
                style={{ transform: `rotateY(${rotation}deg)`, transformStyle: 'preserve-3d' }}
            >
                 <div className="absolute inset-0 bg-gradient-to-b from-amber-300 to-amber-600 rounded-full border-4 border-amber-700 flex flex-col items-center justify-center backface-hidden shadow-[0_0_50px_rgba(245,158,11,0.5)]" style={{ backfaceVisibility: 'hidden' }}>
                    <div className="text-amber-900 font-black text-4xl drop-shadow-sm font-title tracking-widest">HEADS</div>
                    <div className="text-amber-900 font-bold text-xs uppercase mt-2">1st Player</div>
                 </div>

                 <div className="absolute inset-0 bg-gradient-to-b from-slate-300 to-slate-500 rounded-full border-4 border-slate-700 flex flex-col items-center justify-center backface-hidden shadow-[0_0_50px_rgba(100,116,139,0.5)]" style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
                    <div className="text-slate-900 font-black text-4xl drop-shadow-sm font-title tracking-widest">TAILS</div>
                    <div className="text-slate-900 font-bold text-xs uppercase mt-2">2nd Player</div>
                 </div>
            </div>
            
            <div className="mt-16 text-2xl font-bold text-white animate-bounce tracking-wide">
                {resultText}
            </div>
        </div>
    );
};