import React, { useState } from 'react';
import { User, Users, Edit3, GraduationCap, Trophy, Cpu, Tv, ChevronLeft } from 'lucide-react';
import { GameMode } from '../../../types';
import { playSound } from '../../../utils/soundUtils';
import { loadCampaign, CampaignState } from '../../../utils/campaign';

interface ModeMenuProps {
    setMenuStep: (step: any) => void;
    handleModeSelect: (mode: GameMode) => void;
    handleStartGameClick: (isCpu: boolean, modeOverride?: GameMode) => void;
    setSelectedSubMode: (mode: 'CAMPAIGN' | 'VERSUS_AI' | 'SPECTATE' | 'HOTSEAT' | 'ONLINE_MULTIPLAYER' | null) => void;
    setCampaignState: (state: CampaignState | null) => void;
    setRulesFormatSelect: (format: 'STREET' | 'PRO') => void;
}

export const ModeMenu: React.FC<ModeMenuProps> = ({
    setMenuStep,
    handleModeSelect,
    handleStartGameClick,
    setSelectedSubMode,
    setCampaignState,
    setRulesFormatSelect
}) => {
    const [menuModeView, setMenuModeView] = useState<'MAIN' | 'SINGLE_PLAYER' | 'MULTIPLAYER'>('MAIN');

    const handleClick = (cb: () => void) => {
        playSound('menu_click');
        cb();
    };

    return (
        <>
            {menuModeView === 'MAIN' && (
                <div className="w-full max-w-5xl px-4 pb-12 space-y-10 animate-in fade-in zoom-in-95 duration-300">
                    
                    {/* Main Game Menu Launcher Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                        {/* Single Player Card */}
                        <button 
                            onClick={() => handleClick(() => setMenuModeView('SINGLE_PLAYER'))} 
                            className="group relative flex flex-col items-center text-center p-6 md:p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] cursor-pointer select-none"
                        >
                            <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="bg-slate-950 p-4 rounded-full mb-4 ring-1 ring-slate-800 group-hover:ring-indigo-500/30 transition-all shadow-lg group-hover:scale-110">
                                <User className="w-6 h-6 md:w-8 md:h-8 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                            </div>
                            <h3 className="font-extrabold text-lg md:text-xl text-white mb-1 md:mb-2 font-title tracking-wide">Single Player</h3>
                            <div className="h-px w-10 bg-slate-800 my-1 md:my-2 group-hover:bg-indigo-500/30 transition-colors"></div>
                            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-sm">
                                Fight against the AI.
                            </p>
                        </button>

                        {/* Multi Player Card */}
                        <button 
                            onClick={() => handleClick(() => setMenuModeView('MULTIPLAYER'))} 
                            className="group relative flex flex-col items-center text-center p-6 md:p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] cursor-pointer select-none"
                        >
                            <div className="absolute inset-0 bg-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="bg-slate-950 p-4 rounded-full mb-4 ring-1 ring-slate-800 group-hover:ring-blue-500/30 transition-all shadow-lg group-hover:scale-110">
                                <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-450 group-hover:text-blue-300 transition-colors" />
                            </div>
                            <h3 className="font-extrabold text-lg md:text-xl text-white mb-1 md:mb-2 font-title tracking-wide">Multi Player</h3>
                            <div className="h-px w-10 bg-slate-800 my-1 md:my-2 group-hover:bg-blue-500/30 transition-colors"></div>
                            <p className="text-slate-405 text-xs md:text-sm leading-relaxed max-w-sm">
                                Play offline Pass-and-Play hotseat games locally, or connect with friends worldwide.
                            </p>
                        </button>

                        {/* Sandbox Tool Card */}
                        <button 
                            onClick={() => handleClick(() => {
                                handleModeSelect('SANDBOX');
                            })}
                            className="group relative flex flex-col items-center text-center p-6 md:p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] cursor-pointer select-none"
                        >
                            <div className="absolute inset-0 bg-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="bg-slate-950 p-4 rounded-full mb-4 ring-1 ring-slate-800 group-hover:ring-amber-505/30 transition-all shadow-lg group-hover:scale-110">
                                <Edit3 className="w-6 h-6 md:w-8 md:h-8 text-amber-500 group-hover:text-amber-400 transition-colors" />
                            </div>
                            <h3 className="font-extrabold text-lg md:text-xl text-white mb-1 md:mb-2 font-title tracking-wide">Sandbox Tool</h3>
                            <div className="h-px w-10 bg-slate-800 my-1 md:my-2 group-hover:bg-amber-500/30 transition-colors"></div>
                            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-sm">
                                Freely setup the board to study different game states.
                            </p>
                        </button>

                        {/* Lessons Card */}
                        <button 
                            onClick={() => handleClick(() => handleModeSelect('TUTORIAL'))}
                            className="group relative flex flex-col items-center text-center p-6 md:p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] cursor-pointer select-none"
                        >
                            <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="bg-slate-950 p-4 rounded-full mb-4 ring-1 ring-slate-800 group-hover:ring-emerald-500/30 transition-all shadow-lg group-hover:scale-110">
                                <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-emerald-400 group-hover:text-emerald-355 transition-colors" />
                            </div>
                            <h3 className="font-extrabold text-lg md:text-xl text-white mb-1 md:mb-2 font-title tracking-wide">Lessons</h3>
                            <div className="h-px w-10 bg-slate-800 my-1 md:my-2 group-hover:bg-emerald-500/30 transition-colors"></div>
                            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-sm">
                                Learn how to play Battle.
                            </p>
                        </button>
                    </div>
                </div>
            )}

            {menuModeView === 'SINGLE_PLAYER' && (
                <div className="w-full max-w-5xl px-4 pb-12 space-y-6 animate-in fade-in slide-in-from-right duration-300">
                    {/* Header with Back trigger */}
                    <div className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer w-fit" onClick={() => handleClick(() => { setSelectedSubMode(null); setMenuModeView('MAIN'); })}>
                        <ChevronLeft size={20} />
                        <span className="text-xs font-black uppercase tracking-widest font-title">Back to Main Menu</span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                            <User size={18} className="text-indigo-400" />
                            <h2 className="text-sm font-black tracking-widest uppercase font-title text-slate-300">Single Player Games</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                            {/* Campaign */}
                            <button 
                                onClick={() => handleClick(() => {
                                    setSelectedSubMode('CAMPAIGN');
                                    const state = loadCampaign();
                                    setCampaignState(state);
                                    setRulesFormatSelect(state.rulesFormat);
                                    setMenuStep('CAMPAIGN_MAP');
                                })} 
                                className="group relative flex flex-col items-center text-center p-5 md:p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] cursor-pointer select-none"
                            >
                                <div className="bg-slate-950 p-3 rounded-full mb-3 ring-1 ring-slate-800 group-hover:ring-indigo-500/30 transition-all shadow-lg group-hover:scale-110">
                                    <Trophy className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                                </div>
                                <h3 className="font-extrabold text-base text-white mb-1 font-title tracking-wide">Campaign Mode</h3>
                                <div className="h-px w-8 bg-slate-800 my-1 group-hover:bg-indigo-500/30 transition-colors"></div>
                                <p className="text-slate-400 text-xs leading-normal">
                                    Fight your way through a series of opponents. Beat the boss at the end for a reward!
                                </p>
                            </button>

                            {/* Versus AI */}
                            <button 
                                onClick={() => handleClick(() => {
                                    setSelectedSubMode('VERSUS_AI');
                                    setMenuStep('GAME_SETUP');
                                })} 
                                className="group relative flex flex-col items-center text-center p-5 md:p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] cursor-pointer select-none"
                            >
                                <div className="bg-slate-950 p-3 rounded-full mb-3 ring-1 ring-slate-800 group-hover:ring-emerald-500/30 transition-all shadow-lg group-hover:scale-110">
                                    <Cpu className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                                </div>
                                <h3 className="font-extrabold text-base text-white mb-1 font-title tracking-wide">Versus AI</h3>
                                <div className="h-px w-8 bg-slate-800 my-1 group-hover:bg-emerald-500/30 transition-colors"></div>
                                <p className="text-slate-400 text-xs leading-normal">
                                    Choose a mode and AI difficulty and jump in!
                                </p>
                            </button>

                            {/* Spectate */}
                            <button 
                                onClick={() => handleClick(() => {
                                    setSelectedSubMode('SPECTATE');
                                    setMenuStep('GAME_SETUP');
                                })} 
                                className="group relative flex flex-col items-center text-center p-5 md:p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] cursor-pointer select-none"
                            >
                                <div className="bg-slate-950 p-3 rounded-full mb-3 ring-1 ring-slate-800 group-hover:ring-purple-500/30 transition-all shadow-lg group-hover:scale-110">
                                    <Tv className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                                </div>
                                <h3 className="font-extrabold text-base text-white mb-1 font-title tracking-wide">Spectate Mode</h3>
                                <div className="h-px w-8 bg-slate-800 my-1 group-hover:bg-purple-500/30 transition-colors"></div>
                                <p className="text-slate-400 text-xs leading-normal">
                                    Watch two AI players duke it out automatically.
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {menuModeView === 'MULTIPLAYER' && (
                <div className="w-full max-w-5xl px-4 pb-12 space-y-6 animate-in fade-in slide-in-from-right duration-300">
                    {/* Header with Back trigger */}
                    <div className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer w-fit" onClick={() => handleClick(() => { setSelectedSubMode(null); setMenuModeView('MAIN'); })}>
                        <ChevronLeft size={20} />
                        <span className="text-xs font-black uppercase tracking-widest font-title">Back to Main Menu</span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                            <Users size={18} className="text-blue-400" />
                            <h2 className="text-sm font-black tracking-widest uppercase font-title text-slate-300">Multi Player</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                            {/* Local Hotseat */}
                            <button 
                                onClick={() => handleClick(() => {
                                    setSelectedSubMode('HOTSEAT');
                                    setMenuStep('GAME_SETUP');
                                })} 
                                className="group relative flex flex-col items-center text-center p-5 md:p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] cursor-pointer select-none"
                            >
                                <div className="bg-slate-950 p-3 rounded-full mb-3 ring-1 ring-slate-800 group-hover:ring-amber-500/30 transition-all shadow-lg group-hover:scale-110">
                                    <Users className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors" />
                                </div>
                                <h3 className="font-extrabold text-base text-white mb-1 font-title tracking-wide">Local Hotseat</h3>
                                <div className="h-px w-10 bg-slate-800 my-1 group-hover:bg-amber-500/30 transition-colors"></div>
                                <p className="text-slate-400 text-xs leading-normal px-4">
                                    Battle with a friend using Pass-and-Play.
                                </p>
                            </button>

                            {/* Online Multiplayer */}
                            <button 
                                onClick={() => handleClick(() => {
                                    setSelectedSubMode('ONLINE_MULTIPLAYER');
                                    setMenuStep('GAME_SETUP');
                                })} 
                                className="group relative flex flex-col items-center text-center p-5 md:p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] cursor-pointer select-none"
                            >
                                <div className="bg-slate-950 p-3 rounded-full mb-3 ring-1 ring-slate-800 group-hover:ring-blue-500/30 transition-all shadow-lg group-hover:scale-110">
                                    <Users className="w-5 h-5 text-blue-450 group-hover:text-blue-300 transition-colors" />
                                </div>
                                <h3 className="font-extrabold text-base text-white mb-1 font-title tracking-wide">Online Matches</h3>
                                <div className="h-px w-10 bg-slate-800 my-1 group-hover:bg-blue-500/30 transition-colors"></div>
                                <p className="text-slate-400 text-xs leading-normal px-4">
                                    Connect with a friend and Battle online!
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
