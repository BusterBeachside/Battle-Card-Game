import React from 'react';
import { ChevronLeft, Settings, Cpu, CheckCircle, Lock } from 'lucide-react';
import { GameMode } from '../../../types';
import { playSound } from '../../../utils/soundUtils';
import { CampaignState } from '../../../utils/campaign';
import { CardDisplay } from '../../CardDisplay';
import { motion, AnimatePresence } from 'motion/react';

interface CampaignMenuProps {
    campaignState: CampaignState;
    setMenuStep: (step: any) => void;
    handleModeSelect: (mode: GameMode) => void;
    handleStartGameClick: (isCpu: boolean, modeOverride?: GameMode) => void;
    handleSwitchRulesFormat: (format: 'STREET' | 'PRO') => void;
}

export const CampaignMenu: React.FC<CampaignMenuProps> = ({
    campaignState,
    setMenuStep,
    handleModeSelect,
    handleStartGameClick,
    handleSwitchRulesFormat
}) => {
    const [bossIntro, setBossIntro] = React.useState<{
        active: boolean;
        aiName: string;
        challenge: string | null;
        onFinish: () => void;
    } | null>(null);

    React.useEffect(() => {
        if (bossIntro?.active) {
            playSound('turn_start');
            const t1 = setTimeout(() => playSound('damage_lg'), 450);
            const t2 = setTimeout(() => playSound('king'), 1000);
            const t3 = setTimeout(() => {
                setBossIntro(null);
                bossIntro.onFinish();
            }, 3200);

            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
            };
        }
    }, [bossIntro?.active]);

    const handleClick = (cb: () => void) => {
        playSound('menu_click');
        cb();
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl animate-in slide-in-from-right fade-in duration-350 px-4 pb-12">
            <div className="flex items-center justify-between text-slate-300 border-b border-slate-800 pb-4 w-full">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleClick(() => setMenuStep('MODE'))} 
                        className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <span className="text-lg md:text-xl font-bold font-title uppercase tracking-wider text-indigo-400 block">Campaign Mode</span>
                        <span className="text-xs text-slate-400 mt-0.5 block">Fight through a series of enemies to reach the end.</span>
                    </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-indigo-450 font-bold text-xs shadow-md">
                    <Settings size={14} className="text-indigo-400/80" />
                    <span>Ruleset Format: <span className="font-black text-white">{campaignState.rulesFormat}</span></span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
                
                {/* Threat dossier / status HUD (Left Pane) */}
                <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-6 h-fit text-left">
                    <div>
                        <h3 className="text-xs font-black tracking-widest text-[#a5b4fc] uppercase border-b border-slate-800/60 pb-2">Campaign Status</h3>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/40 text-center">
                                <div className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold">Cleared</div>
                                <div className="text-base font-black text-white mt-0.5">{campaignState.areasCleared}</div>
                            </div>
                            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/40 text-center">
                                <div className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">Streak</div>
                                <div className="text-base font-black text-amber-300 mt-0.5">{campaignState.currentWinStreak}</div>
                            </div>
                            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/40 text-center">
                                <div className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">Best</div>
                                <div className="text-base font-black text-emerald-300 mt-0.5">{campaignState.bestWinStreak}</div>
                            </div>
                        </div>
                    </div>

                    {/* Node Target Info Panel */}
                    {(() => {
                        const activeN = campaignState.nodes[campaignState.currentNodeIndex] || campaignState.nodes[0];
                        if (!activeN) return <div className="text-slate-400 text-xs">No active node. Please reset.</div>;

                        return (
                            <div className="space-y-4">
                                <div className="border border-indigo-500/20 bg-indigo-950/10 rounded-xl p-4 space-y-3.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black tracking-widest bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full uppercase">
                                            Target node {activeN.id}/10
                                        </span>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded
                                            ${activeN.difficulty === 'EASY' ? 'bg-emerald-500/20 text-emerald-400' :
                                              activeN.difficulty === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                                              'bg-red-500/20 text-red-400'
                                            }
                                        `}>
                                            {activeN.difficulty} AI
                                        </span>
                                    </div>

                                    <div className="text-left">
                                        <div className="text-[10px] uppercase font-bold text-slate-500">Next Battle:</div>
                                        <div className="text-base font-black text-white font-title mt-0.5 truncate flex items-center gap-2">
                                            <Cpu size={15} className="text-slate-400 shrink-0" />
                                            <span>{activeN.aiName}</span>
                                        </div>
                                    </div>

                                    {/* AI Cosmetics preview info */}
                                    <div className="flex gap-4 items-center justify-center p-2.5 bg-slate-950/70 border border-slate-800/60 rounded-xl select-none scale-90 origin-top">
                                        <div className="text-center space-y-1 scale-90 shrink-0">
                                            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Deck Front</span>
                                            <CardDisplay 
                                                card={{ id: 'preview-campaign-f', suit: '♣', rank: 'Q', baseColor: 'BLACK' } as any} 
                                                showBack={false} 
                                                size="sm"
                                                cardFace={activeN.cardFace}
                                            />
                                        </div>
                                        <div className="text-center space-y-1 scale-90 shrink-0">
                                            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Deck Back</span>
                                            <CardDisplay 
                                                card={{ id: 'preview-campaign-b' } as any} 
                                                showBack={true} 
                                                size="sm"
                                                cardBack={activeN.cardBack}
                                            />
                                        </div>
                                    </div>

                                    {activeN.challenge && (
                                        <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 text-left space-y-1">
                                            <div className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1">
                                                <span>⚠️</span> Boss Challenge
                                            </div>
                                            <div className="text-xs font-bold text-amber-300">
                                                {activeN.challenge === 'SUPPLY_CHAIN' && 'Supply Chain: Opponent starts with Ace of Spades & Ace of Hearts in Resources.'}
                                                {activeN.challenge === 'AMBUSH' && 'Ambush: Opponent starts with 4 of Spades & 4 of Hearts on the Field.'}
                                                {activeN.challenge === 'WEAK_SOLDIERS' && 'Weak Soldiers: Soldiers 6-10 drawn transform into Soldiers worth 5 less.'}
                                                {activeN.challenge === 'UNGA_BUNGA' && 'Unga Bunga: You cannot use Tactic cards (J, Q, K).'}
                                                {activeN.challenge === 'BIG_BOI' && 'Big Boi: Opponent starts with 30 Life.'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Launch Fight Button */}
                                    <button
                                        onClick={() => {
                                            const isBoss = activeN.id === 10;
                                            const startBattle = () => {
                                                sessionStorage.setItem('battle_is_campaign_game', 'true');
                                                sessionStorage.setItem('battle_campaign_ai_name', activeN.aiName);
                                                sessionStorage.setItem('battle_campaign_ai_difficulty', activeN.difficulty);
                                                sessionStorage.setItem('battle_campaign_ai_back', activeN.cardBack);
                                                sessionStorage.setItem('battle_campaign_ai_face', activeN.cardFace);
                                                if (activeN.challenge) {
                                                    sessionStorage.setItem('battle_campaign_challenge', activeN.challenge);
                                                } else {
                                                    sessionStorage.removeItem('battle_campaign_challenge');
                                                }
                                                
                                                handleModeSelect(campaignState.rulesFormat);
                                                handleStartGameClick(true, campaignState.rulesFormat);
                                            };

                                            if (isBoss) {
                                                playSound('menu_click');
                                                setBossIntro({
                                                    active: true,
                                                    aiName: activeN.aiName,
                                                    challenge: activeN.challenge || 'SUPPLY_CHAIN',
                                                    onFinish: startBattle
                                                });
                                            } else {
                                                handleClick(startBattle);
                                             }
                                        }}
                                        className="w-full py-3 bg-gradient-to-r from-red-600 via-indigo-600 to-indigo-700 hover:from-red-500 hover:via-indigo-500 hover:to-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer font-title block text-center"
                                    >
                                        Commence Battle!
                                    </button>
                                </div>

                                {/* Campaign Ruleset switcher */}
                                <div className="p-3 bg-slate-950/30 border border-slate-800/60 rounded-xl space-y-2">
                                    <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Switch Ruleset Format</div>
                                    <p className="text-[10px] text-slate-400 leading-normal">
                                        Switch freely between Street and Pro formats.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <button
                                            onClick={() => {
                                                playSound('menu_click');
                                                handleSwitchRulesFormat('STREET');
                                            }}
                                            className={`py-1.5 text-[10px] font-bold uppercase border rounded transition-all cursor-pointer text-center
                                                ${campaignState.rulesFormat === 'STREET'
                                                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/50 font-black'
                                                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                                                }
                                            `}
                                        >
                                            Street Rules
                                        </button>
                                        <button
                                            onClick={() => {
                                                playSound('menu_click');
                                                handleSwitchRulesFormat('PRO');
                                            }}
                                            className={`py-1.5 text-[10px] font-bold uppercase border rounded transition-all cursor-pointer text-center
                                                ${campaignState.rulesFormat === 'PRO'
                                                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/50 font-black'
                                                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                                                }
                                            `}
                                        >
                                            Pro Rules
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Interactive snaking map view (Right Pane) */}
                <div className={`lg:col-span-8 p-6 md:p-8 rounded-2xl flex flex-col justify-between shadow-2xl relative min-h-[500px] border transition-all duration-300 ${(() => {
                    const theme = campaignState.theme || 'GRASSLANDS';
                    if (theme === 'GRASSLANDS') {
                        return "bg-gradient-to-b from-[#1b8a4f] via-[#136137] to-[#0a3d21] border-emerald-400/60 shadow-[inset_0_1px_5px_rgba(255,255,255,0.35)]";
                    } else if (theme === 'DUNGEON') {
                        return "bg-gradient-to-b from-[#241738] via-[#100d1a] to-[#05040a] border-violet-800/40 shadow-[inset_0_1px_4px_rgba(255,255,255,0.12)]";
                    } else if (theme === 'DESERT') {
                        return "bg-gradient-to-b from-[#b88c50] via-[#8c602d] to-[#593b13] border-amber-600/50 shadow-[inset_0_1px_4px_rgba(255,255,255,0.15)]";
                    } else if (theme === 'GLACIER') {
                        return "bg-gradient-to-b from-[#0f2e42] via-[#1a4561] to-[#071622] border-sky-400/40 shadow-[inset_0_1px_4px_rgba(255,255,255,0.3)]";
                    } else if (theme === 'COAST') {
                        return "bg-gradient-to-br from-[#e8d2a7] via-[#2ba1b5] to-[#0b485c] border-amber-300/40 shadow-[inset_0_1px_5px_rgba(255,255,255,0.3)]";
                    } else { // MOUNTAIN
                        return "bg-gradient-to-b from-[#333d45] via-[#242b30] to-[#121618] border-stone-400/30 shadow-[inset_0_1px_4px_rgba(255,255,255,0.15)]";
                    }
                })()}`}>
                    
                    {/* Theme Badge */}
                    <div className="absolute top-4 left-4 z-10 text-[10px] font-bold tracking-widest text-slate-350 font-mono bg-black/60 px-2.5 py-1 rounded border border-white/5 shadow-md flex items-center gap-1">
                        {(() => {
                            const theme = campaignState.theme || 'GRASSLANDS';
                            if (theme === 'GRASSLANDS') return "🌲 Grasslands";
                            if (theme === 'DUNGEON') return "💀 Dungeon";
                            if (theme === 'DESERT') return "🏜️ Desert";
                            if (theme === 'GLACIER') return "❄️ Glacier";
                            if (theme === 'COAST') return "🌊 Coast";
                            if (theme === 'MOUNTAIN') return "⛰️ Mountain";
                            return "🌲 Grasslands";
                        })()}
                    </div>

                    <div className="absolute top-4 right-4 z-10 flex gap-1.5 text-[9px] uppercase font-mono tracking-wider text-slate-400 bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-white/5">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Beaten</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span> Target</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span> Locked</span>
                    </div>

                    {/* Decorative theme elements scatter layer */}
                    <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden rounded-2xl">
                        {campaignState.details?.map((detail) => (
                            <div
                                key={detail.id}
                                className="absolute -translate-x-1/2 -translate-y-1/2 select-none hover:scale-125 transition-all duration-300"
                                style={{
                                    left: `${detail.x}%`,
                                    top: `${detail.y}%`,
                                    transform: `translate(-50%, -50%) scale(${detail.scale})`,
                                    opacity: 0.85,
                                    fontSize: '1.4rem',
                                    filter: campaignState.theme === 'DUNGEON' ? 'brightness(0.7) contrast(1.1)' : 'none',
                                }}
                            >
                                {detail.emoji}
                            </div>
                        ))}
                    </div>

                    {/* Drawing the path lines with SVG */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {campaignState.nodes.slice(0, 9).map((n, idx) => {
                            const nextNode = campaignState.nodes[idx + 1];
                            const isBeaten = n.completed;
                            const isTargetNext = n.id <= campaignState.currentNodeIndex;
                            const theme = campaignState.theme || 'GRASSLANDS';
                            
                            let inactiveColor = '#1e293b';
                            let activeColor = '#3b82f6';
                            let pathColorBg = 'rgba(255,255,255,0.06)'; // fallback path backing

                            if (theme === 'GRASSLANDS') {
                                inactiveColor = '#3e2417'; // Rich soil contour
                                activeColor = '#4ade80'; // Lush lawn highlight
                                pathColorBg = 'rgba(78, 52, 38, 0.55)'; // Deep clay brown trail
                            } else if (theme === 'DUNGEON') {
                                inactiveColor = '#1e1b24'; // deep obsidian slate joint
                                activeColor = '#f87171'; // fiery indicator
                                pathColorBg = 'rgba(18, 15, 23, 0.75)'; // large charcoal stone slab lane
                            } else if (theme === 'DESERT') {
                                inactiveColor = '#664319'; // clay sand track border
                                activeColor = '#fbbf24'; // beautiful gold sun tracer
                                pathColorBg = 'rgba(120, 80, 30, 0.45)'; // worn sandstone caravan route
                            } else if (theme === 'GLACIER') {
                                inactiveColor = '#334155'; // icy blue grey boundary
                                activeColor = '#38bdf8'; // vivid freezing cyan
                                pathColorBg = 'rgba(14, 116, 144, 0.5)'; // packed sub-zero glacial track
                            } else if (theme === 'COAST') {
                                inactiveColor = '#a88151'; // warm wooden boardwalk brown
                                activeColor = '#0284c7'; // sapphire shore ocean blue tracer
                                pathColorBg = 'rgba(238, 213, 171, 0.95)'; // wide golden sandy beach path
                            } else if (theme === 'MOUNTAIN') {
                                inactiveColor = '#1c1917'; // hard stone slate edge
                                activeColor = '#f97316'; // crackling magma trail
                                pathColorBg = 'rgba(87, 83, 78, 0.6)'; // crushed dark slate roadbed
                            }

                            return (
                                <g key={`p-path-group-${idx}`}>
                                    {/* 1. Underlying physical dirt/stone/clay road (Wide Pronounced Path) */}
                                    <line 
                                        x1={`${n.x}%`} 
                                        y1={`${n.y}%`} 
                                        x2={`${nextNode.x}%`} 
                                        y2={`${nextNode.y}%`} 
                                        stroke={pathColorBg}
                                        strokeWidth="18"
                                        strokeLinecap="round"
                                        className="transition-all duration-500"
                                    />
                                    {/* 2. Highlighted Core Route Tracer */}
                                    <line 
                                        x1={`${n.x}%`} 
                                        y1={`${n.y}%`} 
                                        x2={`${nextNode.x}%`} 
                                        y2={`${nextNode.y}%`} 
                                        stroke={isBeaten && isTargetNext ? activeColor : inactiveColor}
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                        strokeDasharray={!(isBeaten && isTargetNext) ? '5,5' : undefined}
                                        className="transition-all duration-500"
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {/* Boss Cinematic Intro Overlay */}
                    <AnimatePresence>
                        {bossIntro?.active && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[999] bg-black/95 flex flex-col items-center justify-center overflow-hidden font-sans select-none"
                            >
                                {/* Red visual storm pulse background */}
                                <motion.div 
                                    animate={{ 
                                        opacity: [0.1, 0.35, 0.1, 0.75, 0.2, 0.1],
                                        scale: [1, 1.05, 1, 1.1, 0.98, 1],
                                    }}
                                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.22)_0%,transparent_70%)]"
                                />

                                {/* Screen Shake Visual Container */}
                                <motion.div
                                    animate={{
                                        x: [0, -12, 12, -9, 9, -6, 6, -3, 3, 0],
                                        y: [0, 9, -12, 7, -9, 5, -5, 3, -3, 0]
                                    }}
                                    transition={{
                                        delay: 0.3,
                                        duration: 1.1,
                                        ease: "easeInOut",
                                        times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1]
                                    }}
                                    className="relative flex flex-col items-center text-center px-6"
                                >
                                    {/* Giant crown/skull visual glow */}
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180, opacity: 0 }}
                                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 120, damping: 10, delay: 0.2 }}
                                        className="text-7xl md:text-8xl mb-8 relative"
                                    >
                                        <span className="relative z-10">👑</span>
                                        <motion.div 
                                            animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="absolute inset-0 bg-red-650/30 blur-2xl rounded-full z-0"
                                        />
                                    </motion.div>

                                    <motion.div
                                        initial={{ y: 50, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 80, damping: 12, delay: 0.5 }}
                                        className="space-y-4"
                                    >
                                        <span className="text-xs md:text-sm font-black tracking-[0.3em] text-red-500 uppercase bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20">
                                            Final Confrontation
                                        </span>
                                        
                                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold uppercase font-title text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-stone-105 to-red-600 tracking-tight leading-none drop-shadow-[0_5px_15px_rgba(220,38,38,0.5)]">
                                            {bossIntro.aiName}
                                        </h1>

                                        <p className="text-slate-400 font-mono text-xs md:text-sm tracking-widest max-w-sm mx-auto italic mt-2">
                                            {bossIntro.challenge ? `Boss Challenge: ${
                                                bossIntro.challenge === 'SUPPLY_CHAIN' ? '⚔️ SUPPLY CHAIN' :
                                                bossIntro.challenge === 'AMBUSH' ? '⚔️ AMBUSH' :
                                                bossIntro.challenge === 'WEAK_SOLDIERS' ? '☠️ WEAK SOLDIERS' :
                                                bossIntro.challenge === 'UNGA_BUNGA' ? '🔨 UNGA BUNGA' :
                                                '💪 BIG BOI'
                                            }` : 'The Overlord challenges your dominion!'}
                                        </p>
                                    </motion.div>

                                    {/* Slash flash effect across screen */}
                                    <motion.div 
                                        initial={{ left: "-100%", opacity: 0 }}
                                        animate={{ left: "150%", opacity: [0, 1, 1, 0] }}
                                        transition={{ duration: 1.2, delay: 0.8, ease: "easeInOut" }}
                                        className="absolute top-1/2 left-0 w-[80%] h-1 bg-gradient-to-r from-transparent via-white to-transparent -translate-y-1/2 rotate-12 pointer-events-none shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                                    />
                                </motion.div>

                                {/* Cinematic bars */}
                                <motion.div 
                                    initial={{ y: -50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute top-0 left-0 w-full h-[8vh] bg-neutral-950 border-b border-stone-850"
                                />
                                <motion.div 
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute bottom-0 left-0 w-full h-[8vh] bg-neutral-950 border-t border-stone-850"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Node triggers placed dynamically over the coordinate space */}
                    <div className="absolute inset-0 w-full h-full z-10">
                        {campaignState.nodes.map((node) => {
                            const isCompleted = node.completed;
                            const isActive = node.id === campaignState.currentNodeIndex + 1;
                            const isLocked = node.id > campaignState.currentNodeIndex + 1;

                            return (
                                <div 
                                    key={`node-coord-${node.id}`}
                                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                                >
                                    <button
                                        disabled={isLocked || isCompleted}
                                        className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center font-bold tracking-widest text-xs font-title border shadow-lg transition-all
                                            ${isCompleted 
                                                ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/60 ring-2 ring-emerald-500/10' 
                                                : isActive
                                                ? (node.id === 10) 
                                                    ? 'bg-red-950 hover:bg-red-800 text-red-100 border-red-500 shadow-[0_0_25px_rgba(220,38,38,0.9)] ring-4 ring-red-600/50 animate-pulse scale-125' 
                                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 ring-4 ring-indigo-500/30 animate-pulse scale-110' 
                                                : (node.id === 10)
                                                    ? 'bg-slate-900 border-red-950 text-slate-500 cursor-not-allowed opacity-90 shadow-[0_0_15px_rgba(220,38,38,0.25)]'
                                                    : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed opacity-80'
                                            }
                                        `}
                                        onClick={() => {
                                            playSound('menu_click');
                                        }}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle size={16} className="text-emerald-400" />
                                        ) : isLocked ? (
                                            <Lock size={12} className="text-slate-650" />
                                        ) : (
                                            node.id
                                        )}
                                    </button>

                                    {/* Simple hover tooltip explaining details of the node opponent */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-slate-950/95 border border-slate-800 rounded-lg text-center opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-2xl z-50 text-[10px] space-y-0.5 font-sans">
                                        <div className="font-extrabold text-white">{node.id === 10 ? '👑 BOSS CONFLICT' : `Node #${node.id}`} &bull; {node.aiName}</div>
                                        <div className="text-slate-400 font-medium">Difficulty: <span className="font-bold text-indigo-300">{node.difficulty}</span></div>
                                        <div className="text-[9px] text-[#818cf8] mt-0.5">
                                            {isCompleted ? '✓ CLEARED' : isActive ? '● ACTIVE TARGET' : '🔒 LOCKED'}
                                        </div>
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
