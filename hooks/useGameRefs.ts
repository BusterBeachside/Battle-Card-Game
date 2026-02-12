
import { useRef } from 'react';
import { GameRefs } from '../components/game/types';

export const useGameRefs = (): GameRefs & { containerRef: React.RefObject<HTMLDivElement> } => {
    const handRef = useRef<HTMLDivElement>(null);
    const cpuHandRef = useRef<HTMLDivElement>(null);
    const topDeckRef = useRef<HTMLDivElement>(null);
    const bottomDeckRef = useRef<HTMLDivElement>(null);
    const lifeIconRef = useRef<HTMLDivElement>(null);
    const bottomLifeRef = useRef<HTMLDivElement>(null);
    const topDiscardRef = useRef<HTMLButtonElement | HTMLDivElement>(null);
    const bottomDiscardRef = useRef<HTMLButtonElement | HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    return {
        handRef,
        cpuHandRef,
        topDeckRef,
        bottomDeckRef,
        lifeIconRef,
        bottomLifeRef,
        topDiscardRef,
        bottomDiscardRef,
        containerRef
    };
};
