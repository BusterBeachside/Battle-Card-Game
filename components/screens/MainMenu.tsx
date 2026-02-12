
import React from 'react';
import { GameMode } from '../../types';
import { TUTORIAL_LESSONS } from '../../data/tutorials';
import { Coins, Sword, Edit3, RotateCcw, Cpu, Users, Tv, ArrowRight, GraduationCap, ChevronLeft, BookOpen, CheckCircle } from 'lucide-react';
import { playSound } from '../../utils/soundUtils';

interface MainMenuProps {
    menuStep: 'MODE' | 'PLAYERS' | 'TUTORIAL_MENU';
    setMenuStep: (step: 'MODE' | 'PLAYERS' | 'TUTORIAL_MENU') => void;
    handleModeSelect: (mode: GameMode) => void;
    handleStartGameClick: (isCpu: boolean) => void;
    handleSpectateClick: () => void;
    startLesson: (lessonId: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ 
    menuStep, 
    setMenuStep, 
    handleModeSelect, 
    handleStartGameClick, 
    handleSpectateClick,
    startLesson
}) => {
    const isLessonCompleted = (lessonId: string) => {
        return localStorage.getItem(`battle_lesson_complete_${lessonId}`) === 'true';
    };

    const handleClick = (cb: () => void) => {
        playSound('menu_click');
        cb();
    };

    return (
        <div className="relative z-10 flex flex-col items-center space-y-8 md:space-y-12 animate-in fade-in zoom-in duration-700 w-full max-w-6xl px-4 md:px-6">
            
            {/* Title Section */}
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-4 opacity-60">
                        <div className="h-px w-16 md:w-32 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                        <span className="text-indigo-400 text-xs md:text-sm font-bold tracking-[0.4em] uppercase font-title text-shadow-sm">Tactical Card Warfare</span>
                        <div className="h-px w-16 md:w-32 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                </div>
                <h1 className="text-7xl md:text-9xl font-black font-title tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-100 via-slate-300 to-slate-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                    BATTLE
                </h1>
            </div>
            
            {menuStep === 'MODE' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-6xl px-2">
                
                {/* Street Mode Card */}
                <button 
                    onClick={() => handleClick(() => handleModeSelect('STREET'))} 
                    className="group relative flex flex-col items-center text-center p-4 md:p-8 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                >
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="bg-slate-950 p-3 md:p-4 rounded-full mb-3 md:mb-6 ring-1 ring-slate-700 group-hover:ring-indigo-500/50 transition-all shadow-xl group-hover:scale-110">
                        <Coins className="w-6 h-6 md:w-8 md:h-8 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2 font-title group-hover:text-indigo-300 transition-colors">Play Street</h3>
                    <div className="h-px w-12 bg-slate-700 my-2 md:my-3 group-hover:bg-indigo-500/50 transition-colors"></div>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                        One shared 52-card deck. Luck of the draw matters more.
                    </p>
                </button>

                {/* Pro Mode Card */}
                <button 
                    onClick={() => handleClick(() => handleModeSelect('PRO'))} 
                    className="group relative flex flex-col items-center text-center p-4 md:p-8 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 hover:border-red-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]"
                >
                    <div className="absolute inset-0 bg-red-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="bg-slate-950 p-3 md:p-4 rounded-full mb-3 md:mb-6 ring-1 ring-slate-700 group-hover:ring-red-500/50 transition-all shadow-xl group-hover:scale-110">
                        <Sword className="w-6 h-6 md:w-8 md:h-8 text-red-400 group-hover:text-red-300 transition-colors" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2 font-title group-hover:text-red-300 transition-colors">Play Pro</h3>
                    <div className="h-px w-12 bg-slate-700 my-2 md:my-3 group-hover:bg-red-500/50 transition-colors"></div>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                        Each player has their own deck. An even playing field.
                    </p>
                </button>

                {/* Sandbox Mode Card */}
                <button 
                    onClick={() => handleClick(() => handleModeSelect('SANDBOX'))} 
                    className="group relative flex flex-col items-center text-center p-4 md:p-8 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                >
                    <div className="absolute inset-0 bg-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="bg-slate-950 p-3 md:p-4 rounded-full mb-3 md:mb-6 ring-1 ring-slate-700 group-hover:ring-amber-500/50 transition-all shadow-xl group-hover:scale-110">
                        <Edit3 className="w-6 h-6 md:w-8 md:h-8 text-amber-400 group-hover:text-amber-300 transition-colors" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2 font-title group-hover:text-amber-300 transition-colors">Sandbox</h3>
                    <div className="h-px w-12 bg-slate-700 my-2 md:my-3 group-hover:bg-amber-500/50 transition-colors"></div>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                        Freely edit the game state, spawn cards, and test interactions.
                    </p>
                </button>

                {/* Tutorial Mode Card */}
                <button 
                    onClick={() => handleClick(() => handleModeSelect('TUTORIAL'))} 
                    className="group relative flex flex-col items-center text-center p-4 md:p-8 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                >
                    <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="bg-slate-950 p-3 md:p-4 rounded-full mb-3 md:mb-6 ring-1 ring-slate-700 group-hover:ring-emerald-500/50 transition-all shadow-xl group-hover:scale-110">
                        <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2 font-title group-hover:text-emerald-300 transition-colors">Tutorial</h3>
                    <div className="h-px w-12 bg-slate-700 my-2 md:my-3 group-hover:bg-emerald-500/50 transition-colors"></div>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                        Learn the basics of combat, resources, and face cards.
                    </p>
                </button>
                </div>
            )}

            {menuStep === 'TUTORIAL_MENU' && (
                <div className="flex flex-col gap-4 w-full max-w-lg animate-in slide-in-from-right fade-in duration-300 px-4">
                     <div className="flex items-center gap-3 mb-2 text-slate-300">
                        <button 
                        onClick={() => handleClick(() => setMenuStep('MODE'))} 
                        className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <span className="text-lg font-bold font-title uppercase tracking-wider text-emerald-500">Tutorial Lessons</span>
                    </div>

                    <div className="grid gap-3">
                        {TUTORIAL_LESSONS.map((lesson) => {
                            const isAvailable = lesson.steps.length > 0;
                            const isCompleted = isLessonCompleted(lesson.id);
                            
                            return (
                                <button 
                                    key={lesson.id} 
                                    onClick={() => isAvailable && handleClick(() => startLesson(lesson.id))}
                                    disabled={!isAvailable}
                                    className={`group relative flex items-center justify-between p-5 rounded-xl border transition-all hover:-translate-x-[-4px] hover:shadow-lg
                                        ${isAvailable ? 'bg-slate-800 hover:bg-emerald-900/20 border-slate-700 hover:border-emerald-500/50' : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ring-1 transition-colors ${isCompleted ? 'bg-emerald-600 text-white ring-emerald-500' : isAvailable ? 'bg-emerald-900/20 text-emerald-400 group-hover:text-emerald-300 ring-emerald-900/50' : 'bg-slate-800 text-slate-600 ring-slate-700'}`}>
                                            {isCompleted ? <CheckCircle size={24} /> : <BookOpen size={24} />}
                                        </div>
                                        <div className="text-left">
                                            <div className={`font-bold text-lg transition-colors ${isAvailable ? 'text-white group-hover:text-emerald-200' : 'text-slate-500'}`}>{lesson.title}</div>
                                            <div className="text-xs text-slate-500 group-hover:text-emerald-400/70 transition-colors">{lesson.subtitle}</div>
                                        </div>
                                    </div>
                                    {isAvailable && <ArrowRight className="text-slate-600 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {menuStep === 'PLAYERS' && (
                <div className="flex flex-col gap-4 w-full max-w-md animate-in slide-in-from-right fade-in duration-300 px-4">
                    <div className="flex items-center gap-3 mb-2 text-slate-300">
                        <button 
                        onClick={() => handleClick(() => setMenuStep('MODE'))} 
                        className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <RotateCcw size={20} />
                        </button>
                        <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Select Opponent</span>
                    </div>

                    <button onClick={() => handleClick(() => handleStartGameClick(true))} className="group relative flex items-center justify-between bg-slate-800 hover:bg-emerald-900/20 border border-slate-700 hover:border-emerald-500/50 p-5 rounded-xl transition-all hover:-translate-x-[-4px] hover:shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-900/20 p-3 rounded-lg text-emerald-400 group-hover:text-emerald-300 ring-1 ring-emerald-900/50 transition-colors">
                                <Cpu size={24} />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-lg text-white group-hover:text-emerald-200 transition-colors">Single Player</div>
                                <div className="text-xs text-slate-500 group-hover:text-emerald-400/70 transition-colors">Challenge the CPU</div>
                            </div>
                        </div>
                        <ArrowRight className="text-slate-600 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
                    </button>

                    <button onClick={() => handleClick(() => handleStartGameClick(false))} className="group relative flex items-center justify-between bg-slate-800 hover:bg-amber-900/20 border border-slate-700 hover:border-amber-500/50 p-5 rounded-xl transition-all hover:-translate-x-[-4px] hover:shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="bg-amber-900/20 p-3 rounded-lg text-amber-400 group-hover:text-amber-300 ring-1 ring-amber-900/50 transition-colors">
                                <Users size={24} />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-lg text-white group-hover:text-amber-200 transition-colors">Local Hotseat</div>
                                <div className="text-xs text-slate-500 group-hover:text-amber-400/70 transition-colors">Play vs Friend</div>
                            </div>
                        </div>
                        <ArrowRight className="text-slate-600 group-hover:text-amber-400 transition-transform group-hover:translate-x-1" />
                    </button>

                    <button onClick={() => handleClick(() => handleSpectateClick())} className="group relative flex items-center justify-between bg-slate-800 hover:bg-purple-900/20 border border-slate-700 hover:border-purple-500/50 p-5 rounded-xl transition-all hover:-translate-x-[-4px] hover:shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-900/20 p-3 rounded-lg text-purple-400 group-hover:text-purple-300 ring-1 ring-purple-900/50 transition-colors">
                                <Tv size={24} />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-lg text-white group-hover:text-purple-200 transition-colors">Spectate</div>
                                <div className="text-xs text-slate-500 group-hover:text-purple-400/70 transition-colors">CPU vs CPU</div>
                            </div>
                        </div>
                        <ArrowRight className="text-slate-600 group-hover:text-purple-400 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            )}
        </div>
    );
};
