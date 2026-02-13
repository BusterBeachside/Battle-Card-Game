
import React, { useEffect, useState, useRef } from 'react';

interface TurnChangeOverlayProps {
    playerName: string;
    turnCount: number;
    onComplete: () => void;
}

export const TurnChangeOverlay: React.FC<TurnChangeOverlayProps> = ({ playerName, turnCount, onComplete }) => {
    const [animationState, setAnimationState] = useState<'ENTER' | 'EXIT' | 'HIDDEN'>('HIDDEN');
    const completeRef = useRef(onComplete);

    // Keep ref updated
    useEffect(() => {
        completeRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        // Start hidden (left), move to center
        requestAnimationFrame(() => {
            setAnimationState('ENTER');
        });

        // Start exit animation
        const timer1 = setTimeout(() => {
            setAnimationState('EXIT');
        }, 1200);

        // Force complete strictly
        const timer2 = setTimeout(() => {
            completeRef.current();
        }, 1600);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []); // Empty dependency array ensures this runs exactly once on mount and timer is never reset by prop updates

    let transformClass = '-translate-x-full opacity-0'; // Default hidden left
    if (animationState === 'ENTER') transformClass = 'translate-x-0 opacity-100';
    if (animationState === 'EXIT') transformClass = 'translate-x-full opacity-0';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none overflow-hidden">
            {/* Backdrop slice */}
            <div className={`absolute inset-x-0 h-48 bg-slate-900/90 border-y border-amber-500/50 flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${transformClass}`}>
                
                <div className="text-amber-500 font-bold tracking-[0.3em] text-sm uppercase mb-2 animate-bounce">
                    Turn {turnCount}
                </div>
                
                <div className="text-6xl md:text-8xl font-black text-white font-title drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tighter">
                    {playerName}
                </div>
                
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-4"></div>
            </div>
        </div>
    );
};
