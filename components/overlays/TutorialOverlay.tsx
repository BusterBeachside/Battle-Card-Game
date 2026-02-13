
import React, { useEffect, useState, useRef } from 'react';
import { TutorialStep } from '../../types';
import { ArrowRight } from 'lucide-react';

interface TutorialOverlayProps {
    step: TutorialStep;
    onNext?: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, onNext }) => {
    const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);
    const [textStyle, setTextStyle] = useState<React.CSSProperties>({
        right: '5%',
        top: '20%',
    });
    const rafRef = useRef<number>(0);

    const updateHighlight = () => {
        const mode = step.highlightMode || 'MASK';

        // 1. Highlight Box Calculation
        if (step.highlightElementId && mode !== 'NONE') {
            const el = document.getElementById(step.highlightElementId);
            if (el) {
                const rect = el.getBoundingClientRect();
                
                if (mode === 'MASK') {
                    setHighlightStyle({
                        position: 'fixed',
                        top: rect.top - 4,
                        left: rect.left - 4,
                        width: rect.width + 8,
                        height: rect.height + 8,
                        borderRadius: '8px',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)', 
                        zIndex: 140,
                        pointerEvents: 'none',
                        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                    });
                } else if (mode === 'OUTLINE') {
                    setHighlightStyle({
                        position: 'fixed',
                        top: rect.top - 4,
                        left: rect.left - 4,
                        width: rect.width + 8,
                        height: rect.height + 8,
                        borderRadius: '8px',
                        border: '4px solid #f59e0b', // Amber-500
                        zIndex: 140,
                        pointerEvents: 'none',
                        animation: 'pulse-border 2s infinite',
                        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                    });
                }
                
                // 2. Text Positioning Logic
                // Heuristic: If target is on Left half of screen, put text on Right.
                // If target is on Right half, put text on Left.
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const screenW = window.innerWidth;
                const screenH = window.innerHeight;

                const newTextStyle: React.CSSProperties = {
                    position: 'fixed',
                    zIndex: 150,
                    maxWidth: '350px',
                    width: '90%',
                    transition: 'all 0.5s ease-out',
                    maxHeight: '60vh',
                    overflowY: 'auto'
                };

                // Vertical safe zone & Anchoring
                // If target is in the bottom 40% of screen, anchor text to bottom to ensure it fits.
                // Otherwise, anchor to top or align with element.
                const isTargetLow = centerY > screenH * 0.6;

                if (isTargetLow) {
                    newTextStyle.bottom = '5%';
                    newTextStyle.top = 'auto'; 
                } else {
                    let topPos = Math.max(100, centerY - 100);
                    // Clamp top pos if it pushes box too low even if not in "Low" zone
                    if (topPos > screenH - 300) topPos = screenH - 300;
                    newTextStyle.top = `${topPos}px`;
                    newTextStyle.bottom = 'auto';
                }

                if (centerX < screenW / 2) {
                    // Left side target -> Right side text
                    const idealLeft = rect.right + 20;
                    if (idealLeft + 350 < screenW) {
                         newTextStyle.left = `${idealLeft}px`;
                    } else {
                         newTextStyle.right = '5%';
                    }
                } else {
                    // Right side target -> Left side text
                    const idealRight = screenW - rect.left + 20;
                    if (screenW - idealRight - 350 > 0) {
                         newTextStyle.right = `${idealRight}px`;
                    } else {
                         newTextStyle.left = '5%';
                    }
                }
                setTextStyle(newTextStyle);

            } else {
                // Element not found, fallback
                if (mode === 'MASK') {
                     setHighlightStyle({
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        zIndex: 140,
                    });
                } else {
                    setHighlightStyle(null);
                }
                setTextStyle({ right: '5%', top: '20%', position: 'fixed', zIndex: 150, maxWidth: '350px', maxHeight: '60vh', overflowY: 'auto' });
            }
        } else {
            // No highlight
            if (mode === 'MASK' && !step.highlightElementId) {
                // Mask everything if explicit mask requested but no ID (general phase)
                setHighlightStyle({
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    zIndex: 140,
                });
            } else {
                setHighlightStyle(null);
            }
            // Default Text Position
            setTextStyle({ right: '5%', top: '20%', position: 'fixed', zIndex: 150, maxWidth: '350px', maxHeight: '60vh', overflowY: 'auto' });
        }
        rafRef.current = requestAnimationFrame(updateHighlight);
    };

    useEffect(() => {
        updateHighlight();
        return () => cancelAnimationFrame(rafRef.current);
    }, [step.highlightElementId, step.highlightMode]);

    return (
        <>
            <style>{`
                @keyframes pulse-border {
                    0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); border-color: rgba(245, 158, 11, 1); }
                    70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); border-color: rgba(245, 158, 11, 0.5); }
                    100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); border-color: rgba(245, 158, 11, 1); }
                }
            `}</style>
            
            {/* The Highlight Element (Mask or Outline) */}
            {highlightStyle && <div style={highlightStyle} />}

            {/* Instruction Text */}
            <div style={textStyle} className="animate-in fade-in zoom-in duration-300 pointer-events-auto">
                <div className="bg-slate-900/95 backdrop-blur border-2 border-amber-500 rounded-xl p-6 shadow-[0_0_30px_rgba(245,158,11,0.3)] text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                    <h3 className="text-amber-500 font-bold font-title uppercase tracking-widest text-sm mb-2">Tutorial</h3>
                    <p className="text-white text-lg font-medium leading-relaxed">{step.instructionText}</p>
                    
                    {step.requiredAction !== 'NONE' && step.targetId !== 'btn-tutorial-next' && (
                        <div className="mt-4 text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">
                            Action Required: {step.requiredAction.replace('CLICK_', 'Select ').replace('UI_BUTTON', 'Button')}
                        </div>
                    )}
                    
                    {step.requiredAction === 'CLICK_UI_BUTTON' && step.targetId === 'btn-tutorial-next' && onNext && (
                         <div className="mt-4 flex justify-center">
                            <button 
                                onClick={onNext}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transform transition-all active:scale-95 animate-pulse"
                            >
                                Continue <ArrowRight size={16} />
                            </button>
                         </div>
                    )}
                    
                    {step.requiredAction === 'NONE' && (
                        <div className="mt-4 text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Watch closely...
                        </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                </div>
            </div>
        </>
    );
};
