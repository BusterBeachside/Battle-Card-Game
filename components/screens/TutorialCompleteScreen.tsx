import React from 'react';
import { Confetti } from '../effects/VisualEffects';
import { GraduationCap, RotateCcw } from 'lucide-react';
import { CountUp } from '../ui/CountUp';
import { GoldCoin } from '../ui/GoldCoin';

interface TutorialCompleteScreenProps {
  rewardClaimedThisSession: boolean;
  bonusClaimedThisSession: boolean;
  handleQuitToTitle: () => void;
}

export const TutorialCompleteScreen: React.FC<TutorialCompleteScreenProps> = ({
  rewardClaimedThisSession,
  bonusClaimedThisSession,
  handleQuitToTitle,
}) => {
  return (
    <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-1000 overflow-hidden">
      <Confetti />
      <div className="text-center space-y-6 relative z-[130] w-full max-w-md px-6">
        <GraduationCap className="w-20 h-20 mx-auto text-emerald-400 animate-bounce" />
        <h1 className="text-4xl md:text-5xl font-black font-title text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 drop-shadow-[0_0_25px_rgba(16,185,129,0.2)]">
          LESSON COMPLETE!
        </h1>

        {/* Gold claim animations */}
        {rewardClaimedThisSession ? (
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3.5 shadow-2xl animate-in zoom-in-95 delay-150 duration-500 text-center">
            <div className="text-xs uppercase font-extrabold tracking-widest text-amber-400">Reward Claimed</div>
            <div className="text-3xl font-black text-yellow-400 flex items-center justify-center gap-1.5">
              <span>+1,000</span> <GoldCoin size={24} />
            </div>
            <div className="text-xs text-slate-400 font-medium font-mono">One-time tutorial lesson completion reward.</div>
            
            {/* All-completed grand bonus block */}
            {bonusClaimedThisSession && (
              <div className="bg-gradient-to-br from-indigo-950/50 via-amber-950/30 to-slate-900 border border-amber-500/30 p-3 rounded-xl text-center mt-3 animate-pulse">
                <div className="text-[10px] text-amber-300 font-black uppercase tracking-widest flex items-center justify-center gap-1">🏆 Grandmaster Bonus Unlocked!</div>
                <div className="text-xl font-black text-amber-400 mt-1 flex items-center justify-center gap-1.5">
                  +5,000 <GoldCoin size={20} /> Gold Added!
                </div>
                <div className="text-[9px] text-yellow-250 italic">Completed all 4 master tutorials!</div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-2.5 shadow-xl animate-in zoom-in-95 delay-150 duration-500 text-center">
            <div className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Lesson Completed</div>
            <p className="text-sm text-slate-350 leading-relaxed">
              You've successfully cleared this lesson! You've already claimed this one-time 1,000 Gold reward on a previous run.
            </p>
          </div>
        )}

        <div className="flex gap-4 justify-center mt-8">
          <button onClick={handleQuitToTitle} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-xl shadow-lg shadow-emerald-500/30 transform transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
            <RotateCcw size={20} /> Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
};
