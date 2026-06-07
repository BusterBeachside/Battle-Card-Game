import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { GameMode } from '../../../types';
import { playSound } from '../../../utils/soundUtils';
import { ProgressionData } from '../../../utils/progression';
import { COSMETIC_ITEMS, CosmeticItem } from '../../../data/cosmetics';
import { CardDisplay } from '../../CardDisplay';
import { GoldCoin } from '../../ui/GoldCoin';

interface ShopMenuProps {
    progression: ProgressionData;
    setProgression: React.Dispatch<React.SetStateAction<ProgressionData>>;
    setMenuStep: (step: any) => void;
    handleModeSelect: (mode: GameMode) => void;
    handleStartGameClick: (isCpu: boolean, modeOverride?: GameMode) => void;
}

export const ShopMenu: React.FC<ShopMenuProps> = ({
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

    const handleBuyCosmetic = (item: CosmeticItem) => {
        if (progression.gold < item.cost) {
            playSound('error');
            return;
        }

        playSound('conscript_mag');
        
        // deduct gold
        const updatedProgression = { ...progression, gold: progression.gold - item.cost };
        
        // add to unlocks
        if (item.type === 'BACK') {
            updatedProgression.unlockedCardBacks = [...(progression.unlockedCardBacks || ['battle']), item.id];
        } else if (item.type === 'FACE') {
            updatedProgression.unlockedCardFaces = [...(progression.unlockedCardFaces || ['classic']), item.id];
        }

        setProgression(updatedProgression);
        try {
            localStorage.setItem('battle_card_progression_v1', JSON.stringify(updatedProgression));
        } catch(e) {}
    };

    const handlePreviewCosmetic = (item: CosmeticItem) => {
        playSound('menu_click');
        
        // Find if this item has a matching cosmetic of the counterpart type
        const counterpartType = item.type === 'BACK' ? 'FACE' : 'BACK';
        const counterpartItem = COSMETIC_ITEMS.find(it => it.id === item.id && it.type === counterpartType);
        
        const previewBack = item.type === 'BACK' ? item.id : (counterpartItem ? counterpartItem.id : 'battle');
        const previewFace = item.type === 'FACE' ? item.id : (counterpartItem ? counterpartItem.id : 'classic');

        sessionStorage.setItem('battle_preview_back', previewBack);
        sessionStorage.setItem('battle_preview_face', previewFace);
        sessionStorage.setItem('battle_is_preview_game', 'true');
        sessionStorage.setItem('battle_preview_name', item.name);
        
        handleModeSelect('STREET');
        handleStartGameClick(false, 'STREET');
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
                        <span className="text-lg md:text-xl font-bold font-title uppercase tracking-wider text-amber-500 block">The Cosmetic Card Shop</span>
                        <span className="text-xs text-slate-400 mt-0.5 block">Purchase special aesthetic card backs and thematic card face styles.</span>
                    </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 text-amber-400 font-extrabold text-sm shadow-md">
                    <GoldCoin size={16} />
                    <span>{progression.gold} Gold</span>
                </div>
            </div>

            {/* Shop Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                {/* Card Backs Block */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black tracking-widest text-[#a5b4fc] uppercase border-b border-indigo-950/50 pb-2">Premium Thematic Card Backs</h3>
                    <div className="grid gap-3.5">
                        {COSMETIC_ITEMS.filter(it => it.type === 'BACK').map(item => {
                            const isOwned = (progression.unlockedCardBacks || ['battle']).includes(item.id);
                            const canAfford = progression.gold >= item.cost;
                            
                            return (
                                <div key={item.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 transition-all hover:border-slate-700/80">
                                    <div className="flex items-center gap-4">
                                        {/* Mini card visual preview */}
                                        <div className="pointer-events-none scale-75 origin-left select-none">
                                            <CardDisplay 
                                                size="sm" 
                                                card={{ id: 'preview-shop-' + item.id, suit: '♠', rank: 'A', baseColor: 'BLACK' } as any} 
                                                showBack={true} 
                                                cardBack={item.id} 
                                            />
                                        </div>
                                        <div>
                                            <div className="font-extrabold text-sm text-slate-100">{item.name}</div>
                                            <div className="text-[11px] text-slate-400 leading-normal mt-0.5 max-w-[220px] sm:max-w-xs">{item.description}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleClick(() => handlePreviewCosmetic(item))}
                                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-indigo-400 border border-slate-700 hover:border-indigo-500/50 hover:text-indigo-300 transition-all font-bold cursor-pointer"
                                            title={`Preview ${item.name} in a Hotseat match`}
                                        >
                                            Preview
                                        </button>
                                        {isOwned ? (
                                            <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-3 py-1.5 rounded-lg whitespace-nowrap">Unlocked</span>
                                        ) : (
                                            <button
                                                onClick={() => handleClick(() => handleBuyCosmetic(item))}
                                                disabled={!canAfford}
                                                className={`px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 transition-all whitespace-nowrap
                                                    ${canAfford 
                                                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transform active:scale-95 cursor-pointer font-bold' 
                                                      : 'bg-slate-800/80 text-slate-500 border border-slate-750 cursor-not-allowed'
                                                    }
                                                `}
                                            >
                                                <GoldCoin size={12} />
                                                <span>{item.cost}g</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Card Faces Block */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black tracking-widest text-[#ddd6fe] uppercase border-b border-violet-950/50 pb-2">Thematic Custom Card Faces</h3>
                    <div className="grid gap-3.5">
                        {COSMETIC_ITEMS.filter(it => it.type === 'FACE').map(item => {
                            const isOwned = (progression.unlockedCardFaces || ['classic']).includes(item.id);
                            const canAfford = progression.gold >= item.cost;
                            
                            return (
                                <div key={item.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 transition-all hover:border-slate-700/80">
                                    <div className="flex items-center gap-4">
                                        {/* Mini card visual preview */}
                                        <div className="pointer-events-none scale-75 origin-left select-none">
                                            <CardDisplay 
                                                size="sm" 
                                                card={{ id: 'preview-shop-f-' + item.id, suit: '♥', rank: 'A', baseColor: 'RED' } as any} 
                                                showBack={false} 
                                                cardFace={item.id} 
                                            />
                                        </div>
                                        <div>
                                            <div className="font-extrabold text-sm text-slate-100">{item.name}</div>
                                            <div className="text-[11px] text-slate-400 leading-normal mt-0.5 max-w-[220px] sm:max-w-xs">{item.description}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleClick(() => handlePreviewCosmetic(item))}
                                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-violet-400 border border-slate-700 hover:border-violet-500/50 hover:text-violet-350 transition-all font-bold cursor-pointer"
                                            title={`Preview ${item.name} in a Hotseat match`}
                                        >
                                            Preview
                                        </button>
                                        {isOwned ? (
                                            <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-950/40 border border-violet-500/20 px-3 py-1.5 rounded-lg whitespace-nowrap">Unlocked</span>
                                        ) : (
                                            <button
                                                onClick={() => handleClick(() => handleBuyCosmetic(item))}
                                                disabled={!canAfford}
                                                className={`px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 transition-all whitespace-nowrap
                                                    ${canAfford 
                                                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transform active:scale-95 cursor-pointer font-bold' 
                                                      : 'bg-slate-800/80 text-slate-500 border border-slate-755 cursor-not-allowed'
                                                    }
                                                `}
                                            >
                                                <GoldCoin size={12} />
                                                <span>{item.cost}g</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
