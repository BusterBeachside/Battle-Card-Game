import React from 'react';
import { ChevronLeft, Users, Coins, Sword } from 'lucide-react';
import { GameMode } from '../../../types';
import { playSound } from '../../../utils/soundUtils';

interface GameSetupMenuProps {
    selectedSubMode: 'CAMPAIGN' | 'VERSUS_AI' | 'SPECTATE' | 'HOTSEAT' | 'ONLINE_MULTIPLAYER' | null;
    rulesFormatSelect: 'STREET' | 'PRO';
    setRulesFormatSelect: (format: 'STREET' | 'PRO') => void;
    cpuDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
    setCpuDifficulty: (diff: 'EASY' | 'MEDIUM' | 'HARD') => void;
    cpu2Difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    setCpu2Difficulty: (diff: 'EASY' | 'MEDIUM' | 'HARD') => void;
    setMenuStep: (step: any) => void;
    handleModeSelect: (mode: GameMode) => void;
    handleStartGameClick: (isCpu: boolean, modeOverride?: GameMode) => void;
    handleSpectateClick: (modeOverride?: GameMode) => void;
}

export const GameSetupMenu: React.FC<GameSetupMenuProps> = ({
    selectedSubMode,
    rulesFormatSelect,
    setRulesFormatSelect,
    cpuDifficulty,
    setCpuDifficulty,
    cpu2Difficulty,
    setCpu2Difficulty,
    setMenuStep,
    handleModeSelect,
    handleStartGameClick,
    handleSpectateClick
}) => {
    const handleClick = (cb: () => void) => {
        playSound('menu_click');
        cb();
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-2xl animate-in slide-in-from-right fade-in duration-350 px-4 pb-8">
            <div className="flex items-center gap-3 text-slate-300">
                <button 
                    onClick={() => handleClick(() => setMenuStep('MODE'))} 
                    className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
                >
                    <ChevronLeft size={24} />
                </button>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Configure Game &bull; {
                        selectedSubMode === 'VERSUS_AI' ? 'Versus AI' :
                        selectedSubMode === 'SPECTATE' ? 'Spectate CPU Match' :
                        selectedSubMode === 'HOTSEAT' ? 'Local Hotseat' :
                        selectedSubMode === 'ONLINE_MULTIPLAYER' ? 'Online Multiplayer' : 'Setup'
                    }
                </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-850 p-6 md:p-8 rounded-2xl space-y-8 shadow-2xl">
                {/* Ruleset selector - Pro or Street */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black tracking-widest text-[#a5b4fc] uppercase block border-b border-slate-800 pb-1.5">1. Deck Ruleset Configuration</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => {
                                playSound('menu_click');
                                setRulesFormatSelect('STREET');
                            }}
                            className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer group active:scale-98 select-none
                                ${rulesFormatSelect === 'STREET'
                                    ? 'bg-indigo-950/30 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.15)] ring-1 ring-indigo-505/20'
                                    : 'bg-slate-950/20 border-slate-800 hover:border-slate-705'
                                }
                            `}
                        >
                            <div className="flex items-center gap-2">
                                <Coins size={16} className={rulesFormatSelect === 'STREET' ? 'text-indigo-400' : 'text-slate-400'} />
                                <span className="font-black text-sm text-white font-title">Street Ruleset</span>
                            </div>
                            <span className="text-[11px] text-slate-450 mt-1 lines-clamp-3 leading-normal">
                                Play with one shared 52-card deck. Pay attention to which cards your opponent has and play the odds!
                            </span>
                        </button>
                        
                        <button
                            onClick={() => {
                                playSound('menu_click');
                                setRulesFormatSelect('PRO');
                            }}
                            className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer group active:scale-98 select-none
                                ${rulesFormatSelect === 'PRO'
                                    ? 'bg-violet-950/30 border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.15)] ring-1 ring-violet-505/20'
                                    : 'bg-slate-950/20 border-slate-800 hover:border-slate-705'
                                }
                            `}
                        >
                            <div className="flex items-center gap-2">
                                <Sword size={16} className={rulesFormatSelect === 'PRO' ? 'text-violet-400' : 'text-slate-400'} />
                                <span className="font-black text-sm text-white font-title">Pro Ruleset</span>
                            </div>
                            <span className="text-[11px] text-slate-455 mt-1 lines-clamp-3 leading-normal">
                                Each player has their own 52-card deck. A more even playing field.
                            </span>
                        </button>
                    </div>
                </div>

                {/* Bot Intelligence selection if Versus AI */}
                {selectedSubMode === 'VERSUS_AI' && (
                    <div className="space-y-3">
                        <label className="text-[10px] font-black tracking-widest text-[#a5b4fc] uppercase block border-b border-slate-800 pb-1.5">2. Difficulty Profile</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                                <button
                                    key={diff}
                                    onClick={() => {
                                        playSound('menu_click');
                                        setCpuDifficulty(diff);
                                    }}
                                    className={`py-3 text-xs font-title font-black rounded-lg border transition-all uppercase cursor-pointer select-none
                                        ${cpuDifficulty === diff
                                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20'
                                            : 'bg-slate-950/30 text-slate-400 border-slate-805 hover:border-slate-750'
                                        }
                                    `}
                                >
                                    {diff}
                                </button>
                            ))}
                        </div>
                        <p className="text-[11px] text-slate-400 italic text-center mt-1">
                            {cpuDifficulty === 'EASY' && 'Easy Bot: Best for beginners.'}
                            {cpuDifficulty === 'MEDIUM' && 'Medium Bot: It`s medium. I don`t know what else to tell ya.'}
                            {cpuDifficulty === 'HARD' && 'Hard Bot: The AI without any arbitrary restrictions or limitations.'}
                        </p>
                    </div>
                )}

                {/* CPU 1 and CPU 2 intellect selection if Spectate */}
                {selectedSubMode === 'SPECTATE' && (
                    <div className="space-y-4 pt-1">
                        <label className="text-[10px] font-black tracking-widest text-[#a5b4fc] uppercase block border-b border-slate-800 pb-1.5">2. Difficulty Selection</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 bg-slate-950/30 p-4 border border-slate-800/60 rounded-xl">
                                <label className="text-[10px] font-extrabold tracking-widest text-indigo-400 uppercase text-center block">CPU 1 Difficulty</label>
                                <div className="flex flex-col gap-2">
                                    {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                                        <button
                                            key={'spe-cpu1-' + diff}
                                            onClick={() => {
                                                playSound('menu_click');
                                                setCpuDifficulty(diff);
                                            }}
                                            className={`py-2 text-xs font-black font-title uppercase rounded-lg border transition-all cursor-pointer select-none
                                                ${cpuDifficulty === diff
                                                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/50'
                                                    : 'bg-slate-950/40 text-slate-400 border-slate-850 hover:border-slate-755'
                                                }
                                            `}
                                        >
                                            {diff}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2 bg-slate-950/30 p-4 border border-slate-800/60 rounded-xl">
                                <label className="text-[10px] font-extrabold tracking-widest text-purple-400 uppercase text-center block">CPU 2 Difficulty</label>
                                <div className="flex flex-col gap-2">
                                    {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                                        <button
                                            key={'spe-cpu2-' + diff}
                                            onClick={() => {
                                                playSound('menu_click');
                                                setCpu2Difficulty(diff);
                                            }}
                                            className={`py-2 text-xs font-black font-title uppercase rounded-lg border transition-all cursor-pointer select-none
                                                ${cpu2Difficulty === diff
                                                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/50'
                                                    : 'bg-slate-950/40 text-slate-400 border-slate-850 hover:border-slate-755'
                                                }
                                            `}
                                        >
                                            {diff}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Commencing action button trigger */}
                <div className="pt-4 border-t border-slate-812">
                    <button
                        onClick={() => handleClick(() => {
                            handleModeSelect(rulesFormatSelect);
                            if (selectedSubMode === 'VERSUS_AI') {
                                handleStartGameClick(true, rulesFormatSelect);
                            } else if (selectedSubMode === 'SPECTATE') {
                                handleSpectateClick(rulesFormatSelect);
                            } else if (selectedSubMode === 'HOTSEAT') {
                                handleStartGameClick(false, rulesFormatSelect);
                            } else if (selectedSubMode === 'ONLINE_MULTIPLAYER') {
                                setMenuStep('MULTIPLAYER_SETUP');
                            }
                        })}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black rounded-xl transition-all shadow-xl hover:scale-[1.01] active:scale-[0.99] font-title uppercase tracking-wider text-sm cursor-pointer"
                    >
                        Commencing Duel ({rulesFormatSelect} Rules)
                    </button>
                </div>
            </div>
        </div>
    );
};
