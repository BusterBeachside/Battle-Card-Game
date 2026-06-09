import React from 'react';
import { CountUp } from '../ui/CountUp';
import { Confetti } from '../effects/VisualEffects';

interface GameOverScreenProps {
  gameState: any;
  endGameRewards: any;
  localPlayerId: number;
  handleQuitToTitle: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  gameState, 
  endGameRewards, 
  localPlayerId, 
  handleQuitToTitle 
}) => {
  return (
    <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-1000 overflow-y-auto py-10">
      <Confetti />
      <div className="text-center space-y-6 relative z-[130] w-full max-w-lg px-4">
        <h1 className="text-6xl md:text-7xl font-black font-title text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 drop-shadow-[0_0_25px_rgba(234,179,8,0.5)] animate-bounce mt-4">
            GAME OVER
        </h1>
        <h2 className="text-3xl font-bold text-white drop-shadow-md">
            {gameState.winner !== null ? `${gameState.players[gameState.winner].name} Wins!` : "It's a Draw!"}
        </h2>
        <div className="text-sm text-slate-400 font-title uppercase tracking-widest mt-1">
            Total Turns: {gameState.turnCount}
        </div>

        {endGameRewards && (
            <div className="max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-2xl text-left animate-in zoom-in-95 duration-500">
                <h3 className="text-sm font-semibold tracking-wider text-indigo-400 uppercase border-b border-slate-800 pb-2 flex justify-between items-center">
                    <span>Match Summary</span>
                    {!endGameRewards.isQualifying && <span className="text-[10px] text-slate-500 lowercase normal-case italic">Custom modes (vs CPU/P2P matches earn progress)</span>}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/55 p-3 rounded-lg border border-slate-800/40 text-center">
                        <div className="text-[10px] uppercase text-indigo-400/80 tracking-widest font-bold">XP Gained</div>
                        <div className="text-2xl font-black text-indigo-300 mt-1">
                            +<CountUp end={endGameRewards.xpGained} delay={400} suffix=" XP" />
                        </div>
                    </div>
                    <div className="bg-slate-950/55 p-3 rounded-lg border border-slate-800/40 text-center">
                        <div className="text-[10px] uppercase text-amber-400/80 tracking-widest font-bold">Gold Gained</div>
                        <div className="text-2xl font-black text-amber-400 mt-1">
                            {endGameRewards.goldGained > 0 ? (
                                <span>+<CountUp end={endGameRewards.goldGained} delay={700} suffix=" Gold" /></span>
                            ) : (
                                <span className="text-slate-500">0 Gold</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Campaign Completion Bonus Alert */}
                {endGameRewards.gotCompletionBonus && (
                    <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/40 p-4 rounded-xl text-center shadow-lg shadow-amber-500/5 animate-in zoom-in-95 duration-500">
                        <div className="text-sm text-amber-300 font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5">
                            🏆 Area Cleared!
                        </div>
                        <div className="text-xs text-slate-300 mt-1 leading-normal">
                            Completion Bonus: <span className="font-bold text-amber-300">1,000 XP</span> and <span className="font-bold text-amber-400">500 Gold</span>
                        </div>
                    </div>
                )}

                {/* Level Up Alerts */}
                {endGameRewards.levelUpGains.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-600/20 to-purple-600/20 border border-amber-500/30 p-3 rounded-lg text-center animate-pulse">
                        <div className="text-xs text-amber-300 font-bold uppercase tracking-widest">Level Up!</div>
                        {endGameRewards.levelUpGains.map((g: any) => (
                            <div key={g.level} className="text-sm text-yellow-105 mt-1">
                                Reached <span className="font-extrabold text-yellow-400">Level {g.level}</span>! Gained <span className="font-extrabold text-amber-400">+{g.gold} Gold</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Quest Progress Section */}
                {endGameRewards.isQualifying && endGameRewards.finalQuests && endGameRewards.finalQuests.length > 0 && (() => {
                    const progressedQuests = endGameRewards.finalQuests.map((q: any) => {
                        const initQ = endGameRewards.initialQuests?.find((iq: any) => iq.id === q.id);
                        const progressDiff = q.current - (initQ ? initQ.current : 0);
                        if (progressDiff <= 0 && !q.completed) return null;

                        const pct = (q.current / q.target) * 100;

                        return (
                            <div key={q.id} className="bg-slate-950/40 p-2.5 rounded border border-slate-800 text-xs space-y-1">
                                <div className="flex justify-between font-medium">
                                    <span className="text-slate-200">{q.description}</span>
                                    <span className="text-slate-400 font-mono font-bold">{q.current}/{q.target}</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${q.completed ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-indigo-505 to-purple-500'}`}
                                        style={{ width: `${pct}%` }}
                                    ></div>
                                </div>
                                {q.completed && (
                                    <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                                        ✓ Completed! (Head to menu to claim rewards)
                                    </div>
                                )}
                            </div>
                        );
                    }).filter(Boolean);

                    return (
                        <div className="space-y-2">
                            <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Quests Advanced:</h4>
                            <div className="space-y-2.5">
                                {progressedQuests.length > 0 ? (
                                    progressedQuests
                                ) : (
                                    <div className="text-slate-500 text-xs italic">No quests progressed in this match.</div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>
        )}

        <div className="flex gap-4 justify-center pt-2">
            <button onClick={handleQuitToTitle} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-xl shadow-lg shadow-indigo-500/30 transform transition-all hover:scale-105 active:scale-95">
                {(() => {
                    let isCampaignGame = false;
                    try {
                        isCampaignGame = sessionStorage.getItem('battle_is_campaign_game') === 'true';
                    } catch (e) {}
                    const isCampaignWin = isCampaignGame && gameState.winner === localPlayerId;
                    return isCampaignWin ? 'Next' : 'Rematch / Menu';
                })()}
            </button>
        </div>
      </div>
    </div>
  );
};
