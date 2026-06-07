import React from 'react';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { GameMode } from '../../../types';
import { playSound } from '../../../utils/soundUtils';
import { ProgressionData } from '../../../utils/progression';
import { COSMETIC_ITEMS } from '../../../data/cosmetics';
import { CardDisplay } from '../../CardDisplay';

interface CustomizeMenuProps {
    progression: ProgressionData;
    setProgression: React.Dispatch<React.SetStateAction<ProgressionData>>;
    setMenuStep: (step: any) => void;
    handleModeSelect: (mode: GameMode) => void;
    handleStartGameClick: (isCpu: boolean) => void;
}

export const CustomizeMenu: React.FC<CustomizeMenuProps> = ({
    progression,
    setProgression,
    setMenuStep,
    handleModeSelect,
    handleStartGameClick
}) => {
    const handleClick = (cb: () => void) => {
        playSound('menu_click');
        cb();
    };

    const handleEquipCosmetic = (type: 'BACK' | 'FACE', id: string) => {
        playSound('conscript_mag');
        const updated = {
            ...progression,
            selectedCardBack: type === 'BACK' ? id : progression.selectedCardBack,
            selectedCardFace: type === 'FACE' ? id : progression.selectedCardFace
        };

        setProgression(updated);
        try {
            localStorage.setItem('battle_card_progression_v1', JSON.stringify(updated));
        } catch(e) {}
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl animate-in slide-in-from-right fade-in duration-300 px-4 pb-12">
            <div className="flex items-center justify-between text-slate-300 border-b border-slate-800 pb-4 w-full">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleClick(() => setMenuStep('MODE'))} 
                        className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <span className="text-lg md:text-xl font-bold font-title uppercase tracking-wider text-violet-500 block">Personal Deck Customizer</span>
                        <span className="text-xs text-slate-400 mt-0.5 block">Equip unlocked themes to personalize your game cards.</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
                {/* Real-time Preview Pane */}
                <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center space-y-6 text-center shadow-xl h-fit">
                    <h3 className="text-xs font-black tracking-widest text-indigo-400 uppercase">Live Canvas Preview</h3>
                    
                    <div className="flex gap-4 items-center justify-center py-4 select-none">
                        {/* Card Front Preview */}
                        <div className="space-y-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Card Front</span>
                            <CardDisplay 
                                card={{ id: 'preview-f', suit: '♣', rank: 'K', baseColor: 'BLACK' } as any} 
                                showBack={false} 
                                size="lg"
                                cardFace={progression.selectedCardFace || 'classic'}
                            />
                            <span className="text-xs font-extrabold text-[#c084fc] block truncate max-w-[100px] mx-auto text-center mt-1">
                                {COSMETIC_ITEMS.find(it => it.id === progression.selectedCardFace && it.type === 'FACE')?.name || 'Classic'}
                            </span>
                        </div>

                        {/* Card Back Preview */}
                        <div className="space-y-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Card Back</span>
                            <CardDisplay 
                                card={{ id: 'preview-b', suit: '♦', rank: '8', baseColor: 'RED' } as any} 
                                showBack={true} 
                                size="lg"
                                cardBack={progression.selectedCardBack || 'battle'}
                            />
                            <span className="text-xs font-extrabold text-[#818cf8] block truncate max-w-[100px] mx-auto text-center mt-1">
                                {COSMETIC_ITEMS.find(it => it.id === progression.selectedCardBack && it.type === 'BACK')?.name || 'Battle'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            playSound('menu_click');
                            sessionStorage.setItem('battle_preview_back', progression.selectedCardBack || 'battle');
                            sessionStorage.setItem('battle_preview_face', progression.selectedCardFace || 'classic');
                            sessionStorage.setItem('battle_is_preview_game', 'true');
                            sessionStorage.setItem('battle_preview_name', 'Equipped Deck Setup');
                            handleModeSelect('STREET');
                            handleStartGameClick(false);
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black uppercase rounded-lg shadow-md hover:shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer font-title tracking-wider mt-2 border border-indigo-500/30"
                    >
                        Test Custom Setup in Hotseat
                    </button>
                </div>

                {/* Unlocked Choices Drawer */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Card Back Selectors */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-[#a5b4fc] uppercase tracking-wider">Unlocked Card Backs</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {/* Include Default back option */}
                            {[{ id: 'battle', name: 'Battle Back', description: 'Classic Tactical Battle Card blue casing back.', type: 'BACK' } as any, ...COSMETIC_ITEMS.filter(it => it.type === 'BACK')].map(item => {
                                const isUnlocked = item.id === 'battle' || (progression.unlockedCardBacks || []).includes(item.id);
                                const isEquipped = (progression.selectedCardBack || 'battle') === item.id;
                                
                                if (!isUnlocked) return null;

                                return (
                                    <button
                                        key={'equip-' + item.id}
                                        onClick={() => handleClick(() => handleEquipCosmetic('BACK', item.id))}
                                        className={`p-3.5 rounded-xl border flex items-center gap-3.5 text-left w-full transition-all cursor-pointer group select-none
                                            ${isEquipped 
                                              ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                            }
                                        `}
                                    >
                                        <div className="scale-75 origin-left pointer-events-none">
                                            <CardDisplay card={{ id: 'equip-prev-b' } as any} showBack={true} size="sm" cardBack={item.id} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-xs text-white truncate">{item.name}</div>
                                            <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</div>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isEquipped ? 'bg-indigo-500 border-indigo-400' : 'border-slate-700 bg-slate-950'}`}>
                                            {isEquipped && <CheckCircle size={10} className="text-white" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Card Face Selectors */}
                    <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-black text-[#ddd6fe] uppercase tracking-wider">Unlocked Card Faces</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {/* Include Default face option */}
                            {[{ id: 'classic', name: 'Classic Front', description: 'Royal Red and Deep Charcoal card markings.', type: 'FACE' } as any, ...COSMETIC_ITEMS.filter(it => it.type === 'FACE')].map(item => {
                                const isUnlocked = item.id === 'classic' || (progression.unlockedCardFaces || []).includes(item.id);
                                const isEquipped = (progression.selectedCardFace || 'classic') === item.id;
                                
                                if (!isUnlocked) return null;

                                return (
                                    <button
                                        key={'equip-f-' + item.id}
                                        onClick={() => handleClick(() => handleEquipCosmetic('FACE', item.id))}
                                        className={`p-3.5 rounded-xl border flex items-center gap-3.5 text-left w-full transition-all cursor-pointer group select-none
                                            ${isEquipped 
                                              ? 'bg-violet-950/40 border-violet-500 shadow-lg shadow-violet-500/10' 
                                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                            }
                                        `}
                                    >
                                        <div className="scale-75 origin-left pointer-events-none">
                                            <CardDisplay card={{ id: 'equip-prev-f', suit: '♥', rank: 'A', baseColor: 'RED' } as any} showBack={false} size="sm" cardFace={item.id} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-xs text-white truncate">{item.name}</div>
                                            <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</div>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isEquipped ? 'bg-violet-500 border-violet-400' : 'border-slate-700 bg-slate-950'}`}>
                                            {isEquipped && <CheckCircle size={10} className="text-white" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
