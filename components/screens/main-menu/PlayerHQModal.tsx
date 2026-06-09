import React, { useState, useEffect } from 'react';
import { User, Edit3, Shield, Calendar, Award, RefreshCw, Trophy } from 'lucide-react';
import { ProgressionData, rerollQuest, getDefaultQuests, saveProgression } from '../../../utils/progression';
import { GoldCoin } from '../../ui/GoldCoin';
import { playSound } from '../../../utils/soundUtils';

interface PlayerHQModalProps {
    progression: ProgressionData;
    setProgression: React.Dispatch<React.SetStateAction<ProgressionData>>;
    onClose: () => void;
    supabaseUser?: any;
    onSignOut?: () => void;
    onOpenSignIn?: () => void;
}

export const PlayerHQModal: React.FC<PlayerHQModalProps> = ({ 
    progression, 
    setProgression, 
    onClose,
    supabaseUser,
    onSignOut,
    onOpenSignIn
}) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(progression.playerName);

    useEffect(() => {
        setTempName(progression.playerName);
    }, [progression.playerName]);

    // Shift+3 Debug rollover listener inside HQ modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && e.code === 'Digit3') {
                if (progression.playerName === 'Bluster') {
                    e.preventDefault();
                    const newQuests = getDefaultQuests();
                    setProgression(prev => {
                        const updated = {
                            ...prev,
                            quests: newQuests
                        };
                        saveProgression(updated);
                        return updated;
                    });
                    playSound('conscript_mag');
                    console.log("DEBUG: Resetting and generating all 3 new quests for Bluster.");
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [progression.playerName, setProgression]);

    const handleSaveName = () => {
        if (!tempName.trim()) return;
        const updated = { ...progression, playerName: tempName.trim() };
        setProgression(updated);
        try {
            localStorage.setItem('battle_card_progression_v1', JSON.stringify(updated));
        } catch(e) {}
        setIsEditingName(false);
    };

    const getStreakReward = (day: number): number => {
        const rewards = [50, 75, 100, 150, 200, 250, 500];
        const index = Math.max(0, Math.min(6, day - 1));
        return rewards[index];
    };

    const handleClaimStreak = () => {
        if (progression.claimedStreakToday) return;
        
        playSound('conscript_mag'); 
        const reward = getStreakReward(progression.streakCount);
        const updated = {
            ...progression,
            gold: progression.gold + reward,
            claimedStreakToday: true
        };
        setProgression(updated);
        try {
            localStorage.setItem('battle_card_progression_v1', JSON.stringify(updated));
        } catch (e) {}
    };

    const handleClaimQuest = (questId: string) => {
        const qIndex = progression.quests.findIndex(q => q.id === questId);
        if (qIndex === -1) return;
        const quest = progression.quests[qIndex];
        if (!quest.completed || quest.claimed) return;

        playSound('conscript_mag'); 
        const updatedQuests = [...progression.quests];
        updatedQuests[qIndex] = { ...quest, claimed: true };

        const updated = {
            ...progression,
            gold: progression.gold + quest.goldReward,
            quests: updatedQuests
        };
        setProgression(updated);
        try {
            localStorage.setItem('battle_card_progression_v1', JSON.stringify(updated));
        } catch (e) {}
    };

    const handleRerollQuest = (questId: string) => {
        playSound('menu_click');
        const updated = rerollQuest(progression, questId);
        setProgression(updated);
    };

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => { playSound('menu_click'); onClose(); }}></div>
            
            <div className="relative bg-slate-900 border border-slate-700 p-6 md:p-8 rounded-3xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Close button icon */}
                <button 
                    onClick={() => { playSound('menu_click'); onClose(); }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors font-bold text-sm h-8 w-8 flex items-center justify-center cursor-pointer"
                    title="Close Modal"
                >
                    ✕
                </button>

                {/* Modal Title / Header */}
                <div className="border-b border-slate-800/85 pb-4 pr-10">
                    <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 font-title uppercase tracking-wider">
                            Player HQ & Progression
                        </h2>
                    </div>
                    <p className="text-xs text-slate-400">
                        Change your display name, claim your daily login bonus, and track your daily quests!
                    </p>
                </div>

                {/* Modal Body / Scrollable Layout GRID (2-Column Dashboard style) */}
                <div className="overflow-y-auto pr-1 max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-805 scrollbar-track-transparent">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-2">
                        
                        {/* LEFT SIDEBAR: PROFILE & GENERAL PROGRESSION (Spans 4/12 width) */}
                        <div className="md:col-span-4 bg-slate-950/60 border border-slate-850 p-5 rounded-2xl h-fit space-y-6">
                            {/* Mini Header / Identity Label */}
                            <div className="border-b border-slate-805 pb-3 text-center">
                                <div className="inline-flex bg-indigo-600/10 p-3 rounded-full text-indigo-400 border border-indigo-500/20 mb-2">
                                    <User size={28} />
                                </div>
                                
                                {/* Name input/display block */}
                                <div className="mt-1">
                                    {isEditingName ? (
                                        <form onSubmit={(e) => { e.preventDefault(); handleSaveName(); }} className="flex flex-col items-center gap-2 bg-slate-950 p-3 rounded-lg border border-indigo-500/80">
                                            <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-extrabold">Rename User</span>
                                            <input 
                                                type="text" 
                                                value={tempName} 
                                                onChange={e => setTempName(e.target.value)} 
                                                maxLength={15}
                                                className="bg-slate-900 border border-slate-700 text-slate-100 font-bold px-3 py-1.5 text-sm rounded w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                                                placeholder="Player Name"
                                                autoFocus
                                            />
                                            <div className="flex gap-2 w-full mt-1">
                                                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] py-1 rounded transition-colors">Save</button>
                                                <button type="button" onClick={() => { setIsEditingName(false); setTempName(progression.playerName); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] py-1 rounded transition-colors">Cancel</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="font-extrabold text-lg text-slate-100">{progression.playerName}</span>
                                            <button onClick={() => setIsEditingName(true)} className="text-slate-400 hover:text-indigo-400 transition-colors" title="Change Name">
                                                <Edit3 size={15} className="opacity-80 hover:opacity-100 cursor-pointer" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Underdog ID Connected Status At Key Top-Of-Sidebar Position */}
                            {supabaseUser ? (
                                <div className="bg-indigo-950/25 border border-indigo-500/25 p-3 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest font-title">Underdog ID Status</span>
                                        <span className="flex items-center gap-1">
                                            <span className="text-[9px] text-emerald-400 font-bold uppercase">Online</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-300 font-mono truncate" title={supabaseUser.email}>
                                        {supabaseUser.email}
                                    </p>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (onSignOut) {
                                                onSignOut();
                                                onClose();
                                            }
                                        }}
                                        className="w-full mt-1 bg-red-950/50 hover:bg-red-900/60 text-red-200 border border-red-900/40 font-bold text-[10px] py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center"
                                    >
                                        Sign Out Account
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-slate-950/50 border border-dashed border-indigo-500/25 p-3 rounded-xl space-y-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                        <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-widest font-title">Guest Space (Offline)</span>
                                    </div>
                                    <p className="text-[9.5px] text-slate-400 leading-normal">
                                        Save levels, coins, and battle quests to the Cloud!
                                    </p>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (onOpenSignIn) {
                                                onOpenSignIn();
                                            }
                                        }}
                                        className="w-full mt-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-extrabold text-[10px] py-1.5 px-2 rounded-lg transition-all shadow-md hover:shadow-indigo-500/15 cursor-pointer text-center uppercase tracking-wider"
                                    >
                                        Sign In / Link ID
                                    </button>
                                </div>
                            )}

                            {/* Total Wealth Row */}
                            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-400">Total Gold Saved</span>
                                <div className="flex items-center gap-1.5 font-black text-amber-400 md:text-base">
                                    <GoldCoin size={16} />
                                    <span>{progression.gold}g</span>
                                </div>
                            </div>

                            {/* Level Stats Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-baseline text-xs">
                                    <span className="text-indigo-400 font-extrabold tracking-wider uppercase">Level {progression.level}</span>
                                    <span className="text-slate-400 font-mono text-[11px] font-bold">{progression.xp} / {progression.level * 500} XP</span>
                                </div>
                                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-805">
                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300" style={{ width: `${(progression.xp / (progression.level * 500)) * 100}%` }}></div>
                                </div>
                                <p className="text-[10px] text-slate-500 italic text-center">
                                    Earn {progression.level * 500 - progression.xp} XP to Level {progression.level + 1}
                                </p>
                            </div>

                            {/* Rules Brief */}
                            <div className="bg-slate-900/40 border border-slate-800/60 p-3.5 rounded-xl text-xs space-y-1.5">
                                <h4 className="font-extrabold text-slate-300 uppercase tracking-widest text-[10px] flex items-center gap-1">
                                    <Shield size={11} className="text-indigo-400" />
                                    Match Yield Rules
                                </h4>
                                <ul className="list-disc pl-4 text-slate-500 text-[11px] space-y-1 leading-relaxed">
                                    <li>Wins grant <b className="text-slate-450">+200 XP</b> & <b className="text-slate-450">100g</b>.</li>
                                    <li>Losses grant <b className="text-slate-450">+80 XP</b> but <b className="text-slate-450">0g</b>.</li>
                                    <li>Leveling up gives <b className="text-amber-400">lvl * 100 Gold</b>!</li>
                                </ul>
                            </div>
                        </div>

                        {/* RIGHT CORES: LOGINS & CHALLENGES (Spans 8/12 width) */}
                        <div className="md:col-span-8 flex flex-col gap-6">
                            
                            {/* 1. Daily Streak Module */}
                            <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl flex flex-col space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-805 pb-2">
                                    <Calendar className="w-4 h-4 text-indigo-400 animate-pulse" />
                                    <h3 className="font-bold text-slate-200 font-title uppercase tracking-wide text-xs">
                                        Consecutive Login Bonus Progress
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-400 leading-normal">
                                    Log in daily for free gold. The longer your streak, the higher your rewards!
                                </p>

                                {/* Daily nodes row */}
                                <div className="grid grid-cols-7 gap-1.5 py-2">
                                    {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                                        const isClaimedDay = day < progression.streakCount || (day === progression.streakCount && progression.claimedStreakToday);
                                        const isActiveUnclaimed = day === progression.streakCount && !progression.claimedStreakToday;
                                        const rew = day === 1 ? 50 : day === 2 ? 75 : day === 3 ? 100 : day === 4 ? 150 : day === 5 ? 200 : day === 6 ? 250 : 500;

                                        return (
                                            <div 
                                                key={day} 
                                                className={`relative flex flex-col items-center justify-between py-2.5 rounded-xl border text-center transition-all
                                                    ${isClaimedDay ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300' :
                                                      isActiveUnclaimed ? 'bg-amber-500/15 border-amber-500/70 text-amber-200 scale-105 shadow-md shadow-amber-500/10' :
                                                      'bg-slate-900/60 border-slate-800/80 text-slate-500'}
                                                `}
                                            >
                                                <span className="text-[10px] font-bold block opacity-60">Day {day}</span>
                                                <span className="text-[11px] font-extrabold font-mono mt-1.5 block">
                                                    {isClaimedDay ? '✓' : `+${rew}`}
                                                </span>
                                                {isActiveUnclaimed && (
                                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Claim streak button */}
                                {!progression.claimedStreakToday ? (
                                    <button 
                                        onClick={() => handleClaimStreak()}
                                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transform hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <GoldCoin size={14} />
                                        <span>Claim Day {progression.streakCount} Streak Reward (+{getStreakReward(progression.streakCount)}g)</span>
                                    </button>
                                ) : (
                                    <div className="w-full bg-slate-900/80 border border-slate-800 py-2.5 rounded-xl text-center text-slate-500 font-bold text-xs">
                                        ✓ Daily Streak Reward Claimed! Next reward unlocks tomorrow.
                                    </div>
                                )}
                            </div>

                            {/* 2. Active Combat Quests Module */}
                            <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl flex flex-col space-y-4 flex-1">
                                <div className="flex items-center justify-between border-b border-slate-805 pb-2">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-4 h-4 text-emerald-400 animate-pulse" />
                                        <h3 className="font-bold text-slate-200 font-title uppercase tracking-wide text-xs">
                                            Active Combat Directives (Quests)
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                        {progression.freeRerollUsed ? (
                                            <span className="text-slate-500">Free Reroll Used</span>
                                        ) : (
                                            <span className="text-emerald-400">1 Free Reroll Available</span>
                                        )}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {progression.quests.map((q) => {
                                        const pct = (q.current / q.target) * 100;

                                        return (
                                            <div key={q.id} className="bg-slate-900/50 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between space-y-3.5 transition-all hover:border-slate-700">
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-start gap-1">
                                                        <span className={`font-semibold text-xs leading-tight ${q.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                                                            {q.description}
                                                        </span>
                                                        <span className="text-slate-300 font-mono text-[10px] font-extrabold whitespace-nowrap bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/60">
                                                            {q.current}/{q.target}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                                                        <div 
                                                            className={`h-full transition-all duration-300 ${q.completed ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                                                            style={{ width: `${pct}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-[10px] pt-1">
                                                    <span className="text-amber-400 font-bold flex items-center gap-1">
                                                        <GoldCoin size={11} />
                                                        <span>+{q.goldReward}g</span>
                                                    </span>
                                                    {q.claimed ? (
                                                        <span className="text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px]">Claimed</span>
                                                    ) : q.completed ? (
                                                        <button 
                                                            onClick={() => handleClaimQuest(q.id)}
                                                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-md shadow transition-all border border-amber-605/30 cursor-pointer text-[10px]"
                                                        >
                                                            CLAIM GOLD
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-slate-500 font-bold italic">In Progress</span>
                                                            {!progression.freeRerollUsed && (
                                                                <button 
                                                                    onClick={() => handleRerollQuest(q.id)}
                                                                    className="p-1 min-w-[20px] bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-400 rounded transition-all cursor-pointer flex items-center justify-center gap-1"
                                                                    title="Reroll this instruction for free"
                                                                >
                                                                    <RefreshCw size={10} />
                                                                    <span className="text-[9px] font-bold">Reroll</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-4 border-t border-slate-850 pb-1">
                    <button 
                        onClick={() => { playSound('menu_click'); onClose(); }}
                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-705 text-slate-100 rounded-xl font-extrabold transition-all text-xs cursor-pointer border border-slate-700/80 uppercase tracking-widest hover:border-slate-600/80"
                    >
                        Return to Menu
                    </button>
                </div>
            </div>
        </div>
    );
};
