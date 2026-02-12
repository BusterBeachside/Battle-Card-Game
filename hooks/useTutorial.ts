
import { useCallback } from 'react';
import { GameState, Phase, TutorialStep } from '../types';
import { addLog } from '../utils/core';
import { playSound } from '../utils/soundUtils';

interface UseTutorialProps {
    gameState: GameState | null;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    gameStateRef: React.MutableRefObject<GameState | null>;
    performEndTurn: () => void;
    confirmBlocks: () => void;
}

export const useTutorial = ({ 
    gameState, 
    setGameState, 
    gameStateRef, 
    performEndTurn, 
    confirmBlocks 
}: UseTutorialProps) => {

    const advanceTutorialStep = useCallback((actionType: 'CLICK_CARD' | 'CLICK_UI_BUTTON' | 'PLAY_CARD' | 'PHASE_CHANGE' | 'DECLARE_BLOCK' | 'NONE', targetId?: string) => {
        setGameState(prev => {
            if (!prev || !prev.tutorialState || !prev.tutorialState.active) return prev;
            
            const step = prev.tutorialState.steps[prev.tutorialState.currentStepIndex];
            if (!step) return prev;

            // Check Requirements
            if (step.requiredAction !== 'NONE') {
                 if (step.requiredAction !== actionType) return prev;
                 if (step.targetId && step.targetId !== targetId) return prev;
            }

            // Advance
            const nextIndex = prev.tutorialState.currentStepIndex + 1;
            if (nextIndex < prev.tutorialState.steps.length) {
                return {
                    ...prev,
                    tutorialState: {
                        ...prev.tutorialState,
                        currentStepIndex: nextIndex
                    }
                };
            } else {
                // End Tutorial and Save Progress
                if (prev.tutorialState.lessonId) {
                    localStorage.setItem(`battle_lesson_complete_${prev.tutorialState.lessonId}`, 'true');
                }
                
                // Play victory sound (using game_over sound) specifically for completion
                playSound('game_over');

                return {
                    ...prev,
                    tutorialState: { ...prev.tutorialState, active: false, completed: true },
                    logs: addLog(prev, "Lesson Complete!")
                };
            }
        });
    }, [setGameState]);

    const handleTutorialNext = useCallback(() => {
        const state = gameStateRef.current;
        // Special logic for Lesson 2 flow control (force block confirm after watching)
        if (state?.mode === 'TUTORIAL' && state.tutorialState?.lessonId === 'lesson-2') {
            const stepId = state.tutorialState.steps[state.tutorialState.currentStepIndex]?.id;
            if (stepId === 'l2-block-watch') {
                confirmBlocks(); // Force proceed to damage
            }
            else if (stepId === 'l2-result-expl') {
                performEndTurn(); 
            }
        }

        advanceTutorialStep('CLICK_UI_BUTTON', 'btn-tutorial-next');
    }, [gameStateRef, confirmBlocks, performEndTurn, advanceTutorialStep]);

    const isInteractionAllowed = useCallback((interactionId: string): boolean => {
        const state = gameStateRef.current;
        if (!state || state.mode !== 'TUTORIAL' || !state.tutorialState || !state.tutorialState.active) {
            return true; 
        }
        
        const step = state.tutorialState.steps[state.tutorialState.currentStepIndex];
        if (step.requiredAction === 'NONE') return false; 
        
        return step ? step.allowedInteractionIds.includes(interactionId) : false;
    }, [gameStateRef]);

    const handleGlobalClick = useCallback(() => {
        if (gameState?.tutorialState?.active) {
            const step = gameState.tutorialState.steps[gameState.tutorialState.currentStepIndex];
            if (step && step.requiredAction === 'NONE') {
                advanceTutorialStep('NONE');
            }
        }
    }, [gameState, advanceTutorialStep]);

    return {
        advanceTutorialStep,
        handleTutorialNext,
        isInteractionAllowed,
        handleGlobalClick
    };
};
