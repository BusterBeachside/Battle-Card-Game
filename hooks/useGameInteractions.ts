
import { useDragAndDrop } from './interactions/useDragAndDrop';
import { usePhaseInteractions } from './interactions/usePhaseInteractions';

export const useGameInteractions = (
    gameState: any, 
    actions: any, 
    effects: any, 
    tutorial: any, 
    ui: any,
    refs: any
) => {
    
    const { dragState, setDragState, handleDragStart, handleDrop } = useDragAndDrop({ 
        gameState, actions, tutorial, ui 
    });

    const { handleCardClick, handleConfirmInitSelection, handlePhaseAction } = usePhaseInteractions({ 
        gameState, actions, effects, tutorial, ui, refs 
    });

    return {
        dragState, setDragState,
        handleCardClick,
        handleDragStart,
        handleDrop,
        handlePhaseAction,
        handleConfirmInitSelection
    };
};
