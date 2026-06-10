import React from 'react';
import { ChevronLeft, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';
import { playSound } from '../../../utils/soundUtils';
import { TUTORIAL_LESSONS } from '../../../data/tutorials';
import { GoldCoin } from '../../ui/GoldCoin';
import { ProgressionData } from '../../../utils/progression';

interface TutorialMenuProps {
    setMenuStep: (step: any) => void;
    startLesson: (lessonId: string) => void;
    progression?: ProgressionData;
}

export const TutorialMenu: React.FC<TutorialMenuProps> = ({
    setMenuStep,
    startLesson,
    progression
}) => {
    const handleClick = (cb: () => void) => {
        playSound('menu_click');
        cb();
    };

    const isLessonCompleted = (lessonId: string) => {
        if (progression?.claimedTutorialRewards?.includes(lessonId)) {
            return true;
        }
        return localStorage.getItem(`battle_lesson_complete_${lessonId}`) === 'true';
    };

    return (
        <div className="flex flex-col gap-4 w-full max-w-lg animate-in slide-in-from-right fade-in duration-300 px-4 pb-8">
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
                        className={`group relative flex items-center justify-between p-4 md:p-5 rounded-xl border transition-all hover:-translate-x-[-4px] hover:shadow-lg
                            ${isAvailable ? 'bg-slate-800 hover:bg-emerald-900/20 border-slate-700 hover:border-emerald-500/50' : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'}
                        `}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 md:p-3 rounded-lg ring-1 transition-colors ${isCompleted ? 'bg-emerald-600 text-white ring-emerald-500' : isAvailable ? 'bg-emerald-900/20 text-emerald-400 group-hover:text-emerald-300 ring-emerald-900/50' : 'bg-slate-800 text-slate-600 ring-slate-700'}`}>
                                {isCompleted ? <CheckCircle size={20} className="md:w-6 md:h-6" /> : <BookOpen size={20} className="md:w-6 md:h-6" />}
                            </div>
                            <div className="text-left space-y-1">
                                <div className={`font-bold text-base md:text-lg transition-colors ${isAvailable ? 'text-white group-hover:text-emerald-200' : 'text-slate-500'}`}>{lesson.title}</div>
                                <div className="text-xs text-slate-500 group-hover:text-emerald-400/70 transition-colors">{lesson.subtitle}</div>
                                {isAvailable && (
                                    <div className="pt-0.5">
                                        {isCompleted ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] md:text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold font-mono">
                                                <GoldCoin size={10} /> Claimed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] md:text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-bold font-mono animate-pulse">
                                                <GoldCoin size={10} /> +1,000g Reward
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        {isAvailable && <ArrowRight className="text-slate-600 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />}
                    </button>
                );
            })}
        </div>
    </div>
    );
};
