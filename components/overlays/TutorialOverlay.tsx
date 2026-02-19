
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
        const isMobile = window.innerWidth < 768;

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
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const screenW = window.innerWidth;
                const screenH = window.innerHeight;

                const newTextStyle: React.CSSProperties = {
                    position: 'fixed',
                    zIndex: 150,
                    maxWidth: isMobile ? 'none' : '350px',
                    width: isMobile ? '90%' : '90%',
                    transition: 'all 0.5s ease-out',
                    maxHeight: '60vh',
                    overflowY: 'auto'
                };

                const isTargetLow = centerY > screenH * 0.6;

                // Special overrides for Lesson 4 interaction steps on Mobile to prevent obscuring the field
                const forceCenterSteps = ['l4-p2-attack', 'l4-play-queen', 'l4-play-king', 'l4-attack-8'];
                const shouldCenter = isMobile && forceCenterSteps.includes(step.id);

                if (shouldCenter) {
                    newTextStyle.top = '50%';
                    newTextStyle.left = '50%';
                    newTextStyle.transform = 'translate(-50%, -50%)';
                    newTextStyle.bottom = 'auto';
                    newTextStyle.right = 'auto';
                } else if (isMobile) {
                    newTextStyle.left = '5%';
                    newTextStyle.right = 'auto';
                    newTextStyle.transform = 'none';
                    // Mobile docking: If target is Low, dock Top. If target is High, dock Bottom.
                    if (isTargetLow) {
                        newTextStyle.top = '70px'; // Clear of header
                        newTextStyle.bottom = 'auto';
                    } else {
                        newTextStyle.bottom = '20px'; // Clear of bottom interactions
                        newTextStyle.top = 'auto';
                    }
                } else {
                    // Desktop Logic: Float near element
                    newTextStyle.transform = 'none';
                    if (isTargetLow) {
                        newTextStyle.bottom = '5%';
                        newTextStyle.top = 'auto'; 
                    } else {
                        let topPos = Math.max(100, centerY - 100);
                        if (topPos > screenH - 300) topPos = screenH - 300;
                        newTextStyle.top = `${topPos}px`;
                        newTextStyle.bottom = 'auto';
                    }

                    if (centerX < screenW / 2) {
                        const idealLeft = rect.right + 20;
                        if (idealLeft + 350 < screenW) {
                             newTextStyle.left = `${idealLeft}px`;
                        } else {
                             newTextStyle.right = '5%';
                        }
                    } else {
                        const idealRight = screenW - rect.left + 20;
                        if (screenW - idealRight - 350 > 0) {
                             newTextStyle.right = `${idealRight}px`;
                        } else {
                             newTextStyle.left = '5%';
                        }
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
                setTextStyle({ 
                    right: 'auto', left: '5%', top: '20%', bottom: 'auto',
                    position: 'fixed', zIndex: 150, width: '90%', maxWidth: isMobile ? 'none' : '350px' 
                });
            }
        } else {
            // No highlight (general phase)
            if (mode === 'MASK' && !step.highlightElementId) {
                setHighlightStyle({
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    zIndex: 140,
                });
            } else {
                setHighlightStyle(null);
            }
            setTextStyle({ 
                right: 'auto', left: '5%', top: isMobile ? '70px' : '20%', bottom: 'auto',
                position: 'fixed', zIndex: 150, width: '90%', maxWidth: isMobile ? 'none' : '350px' 
            });
        }
        rafRef.current = requestAnimationFrame(updateHighlight);
    };

    useEffect(() => {
        updateHighlight();
        return () => cancelAnimationFrame(rafRef.current);
    }, [step.highlightElementId, step.highlightMode, step.id]); // Added step.id dependency

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
                <div className="bg-slate-900/95 backdrop-blur border-2 border-amber-500 rounded-xl p-3 md:p-6 shadow-[0_0_30px_rgba(245,158,11,0.3)] text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                    <h3 className="text-amber-500 font-bold font-title uppercase tracking-widest text-[10px] md:text-sm mb-1 md:mb-2">Tutorial</h3>
                    <p className="text-white text-xs md:text-lg font-medium leading-relaxed">{step.instructionText}</p>
                    
                    {step.requiredAction !== 'NONE' && step.targetId !== 'btn-tutorial-next' && (
                        <div className="mt-2 md:mt-4 text-[9px] md:text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">
                            Action Required: {step.requiredAction.replace('CLICK_', 'Select ').replace('UI_BUTTON', 'Button').replace('DECLARE_', 'Declare ').replace('PLAY_', 'Play ')}
                        </div>
                    )}
                    
                    {step.requiredAction === 'CLICK_UI_BUTTON' && step.targetId === 'btn-tutorial-next' && onNext && (
                         <div className="mt-2 md:mt-4 flex justify-center">
                            <button 
                                onClick={onNext}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 md:px-6 md:py-2 text-xs md:text-base rounded-lg font-bold shadow-lg flex items-center gap-2 transform transition-all active:scale-95 animate-pulse"
                            >
                                Continue <ArrowRight size={14} className="md:w-4 md:h-4" />
                            </button>
                         </div>
                    )}
                    
                    {step.requiredAction === 'NONE' && (
                        <div className="mt-2 md:mt-4 text-[9px] md:text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Watch closely...
                        </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                </div>
            </div>
        </>
    );
};
