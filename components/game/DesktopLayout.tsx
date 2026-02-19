
import React from 'react';
import { CardDisplay } from '../CardDisplay';
import { Color, Phase, Rank } from '../../types';
import { getEffectiveColor } from '../../utils/rules';
import { Settings, Heart, Trash2, LogOut, ArrowRight, ArrowUpCircle, RotateCcw, Sword, Play } from 'lucide-react';
import { LogEntry as LogEntryComponent } from '../ui/LogEntry';
import { LayoutProps } from './types';

export const DesktopLayout: React.FC<LayoutProps> = ({
    gameState,
    topPlayer,
    bottomPlayer,
    activeDecisionPlayerId,
    isInteractive,
    dragState,
    handlers,
    refs,
    uiState
}) => {
    const getPhaseName = () => {
        switch(gameState?.phase) {
            case Phase.INIT_SELECT: return "Setup";
            case Phase.RESOURCE_START: return "Resource Step";
            case Phase.RESOURCE_ADD_SELECT: return "Select Card";
            case Phase.RESOURCE_SWAP_SELECT_HAND: return "Select to Swap";
            case Phase.RESOURCE_SWAP_SELECT_PILE: return "Select Pile";
            case Phase.MAIN: return "Main Phase";
            case Phase.ATTACK_DECLARE: return "Attack Declare";
            case Phase.BLOCK_DECLARE: return "Block Declare";
            case Phase.DAMAGE: return "Combat";
            case Phase.UPKEEP: return "Upkeep";
            case Phase.DRAW: return "Draw Step";
            case Phase.END: return "End Phase";
            case Phase.GAME_OVER: return "Game Over";
            default: return gameState?.phase || "";
        }
    };

    const isSpectate = gameState.players[0].isCpu && gameState.players[1].isCpu;

    // Dynamic scale helper for crowded lanes
    const getLaneScaleClass = (count: number) => {
        return count > 8 ? 'scale-[0.65] -m-3' : '';
    };

    const isMainPhase = gameState.phase === Phase.MAIN;
    const player = gameState.players[gameState.turnPlayer];
    const availableRes = player.resources.filter(r => !r.isTapped).length;
    const canPlayCard = player.hand.some(c => c.cost <= availableRes);
    const canAttack = !player.hasAttackedThisTurn && player.field.some(c => !c.isTapped && !c.isSummoningSick);
    const canDoAnything = (canPlayCard || canAttack) && gameState.phase === Phase.MAIN;
    const isEndTurnPulse = canDoAnything && !gameState.isSandboxRun ? '' : 'ring-2 ring-indigo-400 animate-pulse';

    const topBlack = topPlayer.field.filter(c => getEffectiveColor(c) === Color.Black);
    const topRed = topPlayer.field.filter(c => getEffectiveColor(c) === Color.Red);
    const bottomBlack = bottomPlayer.field.filter(c => getEffectiveColor(c) === Color.Black);
    const bottomRed = bottomPlayer.field.filter(c => getEffectiveColor(c) === Color.Red);

    return (
        <div className="flex flex-col h-full bg-slate-950 select-none">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.8); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.6); }
            `}</style>
            <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800 shadow-lg z-20 flex-none h-14">
                <div className="flex items-center gap-4">
                    <span className="font-title font-bold text-xl">BATTLE</span>
                    <div className="text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700">{getPhaseName()}</div>
                    <div className="text-xs font-bold text-amber-500 border border-amber-900/50 px-2 py-1 rounded bg-amber-900/20">
                        Turn {gameState.turnCount}
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-red-400 font-bold" ref={refs.lifeIconRef}>
                        <Heart size={18} fill="currentColor" /> {topPlayer.life}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-500 font-bold" ref={refs.topDeckRef}>
                            Deck: <span className="text-slate-200">{gameState.mode === 'STREET' ? gameState.deck.length : topPlayer.library.length}</span>
                        </div>
                        {/* Top Discard Button (Only visible in Pro mode) */}
                        {gameState.mode === 'PRO' && (
                            <button 
                                ref={refs.topDiscardRef as React.RefObject<HTMLButtonElement>}
                                onClick={() => handlers.setViewingDiscard(topPlayer.id)}
                                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-[10px] text-slate-400 font-bold transition-colors border border-slate-700"
                                title="View Graveyard"
                            >
                                <Trash2 size={12} /> {topPlayer.discard.length}
                            </button>
                        )}
                        {/* Spacer Ref for SoulTrail if Street Mode */}
                        {gameState.mode !== 'PRO' && <div ref={refs.topDiscardRef as React.RefObject<HTMLDivElement>} className="w-1 h-1 opacity-0"/>}
                    </div>
                    <button onClick={() => handlers.setShowMenu(true)} className="p-2 hover:bg-slate-800 rounded-full transition">
                        <Settings size={20} className="text-slate-400" />
                    </button>
                </div>
            </div>

            <div id="field-area" className="flex-1 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                
                {/* TOP PLAYER ZONE */}
                <div className="flex-1 flex flex-col justify-center p-4 border-b border-slate-800/30 relative">
                    
                    <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 flex -space-x-4 scale-75 opacity-90 transition-all hover:-space-x-2" ref={refs.cpuHandRef}>
                        {topPlayer.hand.map(c => <CardDisplay key={c.id} domId={c.id} card={c} showBack={gameState.mode !== 'SANDBOX' && !isSpectate} size="sm" onClick={() => handlers.onCardClick(c, 'HAND', topPlayer.id)} />)}
                    </div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 bg-slate-900/80 px-2 py-1 rounded">
                        Cards: {topPlayer.hand.length}
                    </div>

                    <div className="relative w-full flex justify-center items-center h-full">
                        
                        {/* Lanes Container - Decoupled Heights */}
                        <div className="flex gap-8 items-start">
                            <div className="bg-slate-900/40 lane-physical p-4 rounded-xl border border-slate-700/50 flex flex-wrap gap-2 min-w-[100px] min-h-[120px] justify-center items-start content-start shadow-inner max-w-[200px] md:max-w-[300px] overflow-visible">
                                {topBlack.map(fc => (
                                    <div key={fc.instanceId} className={`${getLaneScaleClass(topBlack.length)} ${fc.isBeingSummoned ? 'opacity-0' : ''}`}>
                                        <CardDisplay 
                                            domId={fc.instanceId}
                                            data-instance-id={fc.instanceId}
                                            card={fc.card} 
                                            isTapped={fc.isTapped}
                                            isSummoningSick={fc.isSummoningSick}
                                            isLunging={gameState.activeCombatCardId === fc.instanceId}
                                            damageTaken={gameState.recentDamage[fc.instanceId]}
                                            attachedCards={fc.attachedCards}
                                            orientation="top"
                                            onClick={() => handlers.onCardClick(fc.card, 'FIELD', topPlayer.id, fc.instanceId)}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="bg-red-900/20 lane-magical p-4 rounded-xl border border-red-900/30 flex flex-wrap gap-2 min-w-[100px] min-h-[120px] justify-center items-start content-start shadow-inner max-w-[200px] md:max-w-[300px] overflow-visible">
                                {topRed.map(fc => (
                                    <div key={fc.instanceId} className={`${getLaneScaleClass(topRed.length)} ${fc.isBeingSummoned ? 'opacity-0' : ''}`}>
                                        <CardDisplay 
                                            domId={fc.instanceId}
                                            data-instance-id={fc.instanceId}
                                            card={fc.card} 
                                            isTapped={fc.isTapped}
                                            isSummoningSick={fc.isSummoningSick} 
                                            isLunging={gameState.activeCombatCardId === fc.instanceId}
                                            damageTaken={gameState.recentDamage[fc.instanceId]}
                                            attachedCards={fc.attachedCards}
                                            orientation="top"
                                            onClick={() => handlers.onCardClick(fc.card, 'FIELD', topPlayer.id, fc.instanceId)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resources - Right Aligned */}
                        <div className="absolute right-8 top-1/2 -translate-y-1/2">
                            <div id={`resource-container-${topPlayer.id}`} className="flex flex-col gap-2 items-center bg-black/20 p-2 rounded-lg border border-slate-700/30">
                                <div className="flex items-center gap-2">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase">Resources</div>
                                    <div className="text-xs font-bold text-slate-400">{topPlayer.resources.length}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 scale-90 origin-top">
                                    <div className="flex flex-col -space-y-20 relative z-10">
                                        {topPlayer.resources.slice(0, 5).map((r, i) => (
                                            <div key={r.instanceId} style={{ zIndex: i }} className="origin-top transition-transform hover:z-50 hover:scale-105" onClick={() => handlers.onCardClick(r.card, 'RESOURCE', topPlayer.id, r.instanceId)}>
                                                <CardDisplay card={r.card} isTapped={r.isTapped} size="md" isSummoningSick={false} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col -space-y-20 relative z-0">
                                        {topPlayer.resources.slice(5, 10).map((r, i) => (
                                            <div key={r.instanceId} style={{ zIndex: i }} className="origin-top transition-transform hover:z-50 hover:scale-105" onClick={() => handlers.onCardClick(r.card, 'RESOURCE', topPlayer.id, r.instanceId)}>
                                                <CardDisplay card={r.card} isTapped={r.isTapped} size="md" isSummoningSick={false} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* BOTTOM PLAYER ZONE */}
                <div className="flex-1 flex flex-col justify-center p-4 relative">
                    <div className="relative w-full flex justify-center items-center h-full">
                        
                        {/* Lanes Container - Decoupled Heights */}
                        <div className="flex gap-8 items-end">
                            <div id={`lane-black-${bottomPlayer.id}`} className="bg-slate-900/40 lane-physical p-4 rounded-xl border border-slate-700/50 flex flex-wrap gap-2 min-w-[100px] min-h-[120px] justify-center items-start content-start shadow-inner max-w-[200px] md:max-w-[300px] overflow-visible">
                                {bottomBlack.map(fc => (
                                    <div key={fc.instanceId} className={`${getLaneScaleClass(bottomBlack.length)} ${fc.isBeingSummoned ? 'opacity-0' : ''}`}>
                                        <CardDisplay 
                                            domId={fc.instanceId}
                                            data-instance-id={fc.instanceId}
                                            card={fc.card} 
                                            isTapped={fc.isTapped}
                                            isSummoningSick={fc.isSummoningSick} 
                                            isAttacking={gameState.pendingAttackers.includes(fc.instanceId)}
                                            isBlocking={!!gameState.pendingBlocks[fc.instanceId]}
                                            isLunging={gameState.activeCombatCardId === fc.instanceId}
                                            damageTaken={gameState.recentDamage[fc.instanceId]}
                                            attachedCards={fc.attachedCards}
                                            onClick={() => handlers.onCardClick(fc.card, 'FIELD', bottomPlayer.id, fc.instanceId)}
                                            onMouseDown={(e) => handlers.onDragStart(e, fc.card, 'FIELD', bottomPlayer.id, fc.instanceId)}
                                            onTouchStart={(e) => handlers.onDragStart(e, fc.card, 'FIELD', bottomPlayer.id, fc.instanceId)}
                                            isPlayable={gameState.phase === Phase.ATTACK_DECLARE && !fc.isTapped && !fc.isSummoningSick}
                                            orientation="bottom"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="bg-red-900/20 lane-magical p-4 rounded-xl border border-red-900/30 flex flex-wrap gap-2 min-w-[100px] min-h-[120px] justify-center items-start content-start shadow-inner max-w-[200px] md:max-w-[300px] overflow-visible">
                                {bottomRed.map(fc => (
                                    <div key={fc.instanceId} className={`${getLaneScaleClass(bottomRed.length)} ${fc.isBeingSummoned ? 'opacity-0' : ''}`}>
                                        <CardDisplay 
                                            domId={fc.instanceId}
                                            data-instance-id={fc.instanceId}
                                            card={fc.card} 
                                            isTapped={fc.isTapped}
                                            isSummoningSick={fc.isSummoningSick} 
                                            isAttacking={gameState.pendingAttackers.includes(fc.instanceId)}
                                            isBlocking={!!gameState.pendingBlocks[fc.instanceId]}
                                            isLunging={gameState.activeCombatCardId === fc.instanceId}
                                            damageTaken={gameState.recentDamage[fc.instanceId]}
                                            attachedCards={fc.attachedCards}
                                            onClick={() => handlers.onCardClick(fc.card, 'FIELD', bottomPlayer.id, fc.instanceId)}
                                            onMouseDown={(e) => handlers.onDragStart(e, fc.card, 'FIELD', bottomPlayer.id, fc.instanceId)}
                                            onTouchStart={(e) => handlers.onDragStart(e, fc.card, 'FIELD', bottomPlayer.id, fc.instanceId)}
                                            isPlayable={gameState.phase === Phase.ATTACK_DECLARE && !fc.isTapped && !fc.isSummoningSick}
                                            orientation="bottom"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resources - Right Aligned */}
                        <div className="absolute right-8 top-1/2 -translate-y-1/2">
                            <div id={`resource-container-${bottomPlayer.id}`} className="flex flex-col gap-2 items-center bg-black/20 p-2 rounded-lg border border-slate-700/30">
                                <div className="flex items-center gap-2">
                                    <div className="text-[10px] text-indigo-400 font-bold uppercase">Resources</div>
                                    <div className="text-xs font-bold text-indigo-400">
                                        {bottomPlayer.resources.filter(r => !r.isTapped).length}/{bottomPlayer.resources.length}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 scale-90 origin-top">
                                    <div className="flex flex-col -space-y-20 relative z-10">
                                        {bottomPlayer.resources.slice(0, 5).map((r, i) => (
                                            <div key={r.instanceId} id={r.instanceId} style={{ zIndex: i }} className="transition-all cursor-pointer hover:z-50 hover:scale-105 hover:-translate-y-2" onClick={() => handlers.onCardClick(r.card, 'RESOURCE', bottomPlayer.id, r.instanceId)}>
                                                <CardDisplay card={r.card} isTapped={r.isTapped} size="md" isSummoningSick={false} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col -space-y-20 relative z-0">
                                        {bottomPlayer.resources.slice(5, 10).map((r, i) => (
                                            <div key={r.instanceId} id={r.instanceId} style={{ zIndex: i }} className="transition-all cursor-pointer hover:z-50 hover:scale-105 hover:-translate-y-2" onClick={() => handlers.onCardClick(r.card, 'RESOURCE', bottomPlayer.id, r.instanceId)}>
                                                <CardDisplay card={r.card} isTapped={r.isTapped} size="md" isSummoningSick={false} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {dragState && dragState.sourceType === 'HAND' && (
                    <div 
                        className="fixed pointer-events-none z-[100]"
                        style={{ left: dragState.currentX, top: dragState.currentY, transform: 'translate(-50%, -50%) rotate(5deg)' }}
                    >
                        <CardDisplay card={dragState.cardObj!} size="md" isDragging />
                    </div>
                )}
            </div>

            <div className="h-56 bg-slate-900 border-t border-slate-800 flex shadow-2xl z-30 flex-none">
                <div className="w-56 p-4 border-r border-slate-800 bg-slate-900 flex flex-col justify-between shrink-0">
                    <div>
                        <h2 className="text-indigo-300 font-bold truncate">{bottomPlayer.name}</h2>
                        <div id="bottom-life-total" className="flex items-center gap-2 text-4xl font-black text-red-500 mt-2" ref={refs.bottomLifeRef}>
                            <Heart size={32} fill="currentColor" /> {bottomPlayer.life}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider" ref={refs.bottomDeckRef}>
                            Deck: <span className="text-white text-lg ml-1">{gameState.mode === 'STREET' ? gameState.deck.length : bottomPlayer.library.length}</span>
                        </div>
                        {/* Bottom Discard Button */}
                        <button 
                            ref={refs.bottomDiscardRef as React.RefObject<HTMLButtonElement>}
                            onClick={() => handlers.setViewingDiscard(gameState.mode === 'STREET' ? 'SHARED' : bottomPlayer.id)}
                            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 py-1.5 rounded text-xs text-slate-400 font-bold transition-colors border border-slate-700 w-full"
                        >
                            <Trash2 size={14} /> 
                            {gameState.mode === 'STREET' ? 'Shared Graveyard' : 'Graveyard'}
                            <span className="ml-auto bg-slate-900 px-1.5 rounded">
                                {gameState.mode === 'STREET' ? gameState.players[0].discard.length + gameState.players[1].discard.length : bottomPlayer.discard.length}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-4 bg-slate-800/50 flex flex-col items-center justify-center relative shadow-inner min-w-0" ref={refs.handRef}>
                    <div className="absolute top-2 text-[10px] uppercase font-bold text-slate-500 tracking-widest">Hand</div>
                    <div className="flex -space-x-4 pt-4 px-8 pb-2 overflow-visible">
                        {bottomPlayer.hand.map((c) => {
                            const isSelected = gameState.phase === Phase.INIT_SELECT && gameState.initSelectedIds.includes(c.id);
                            
                            let hasValidTarget = true;
                            if (c.rank === 'K') {
                                // King Validation: Needs enemy unit of same spectrum
                                hasValidTarget = topPlayer.field.some(f => getEffectiveColor(f) === c.baseColor);
                            }
                            if (c.rank === 'Q') {
                                // Queen Validation: Needs ANY unit on board
                                hasValidTarget = topPlayer.field.length > 0 || bottomPlayer.field.length > 0;
                            }

                            const isPlayable = isMainPhase && isInteractive && bottomPlayer.resources.filter(r => !r.isTapped).length >= c.cost && hasValidTarget;
                            
                            return (
                                <div key={c.id} id={c.id} className={`transition-all hover:-translate-y-4 hover:z-20 ${isSelected ? '-translate-y-4 z-10' : ''}`}>
                                    <CardDisplay 
                                        card={c} 
                                        onClick={() => handlers.onCardClick(c, 'HAND', bottomPlayer.id)}
                                        onMouseDown={(e) => handlers.onDragStart(e, c, 'HAND', bottomPlayer.id)}
                                        onTouchStart={(e) => handlers.onDragStart(e, c, 'HAND', bottomPlayer.id)}
                                        isPlayable={isPlayable}
                                        isSelected={isSelected}
                                        isDragging={dragState?.cardId === c.id}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="w-64 bg-slate-900 border-l border-slate-800 p-4 flex flex-col gap-3 shrink-0">
                    <div className="text-center text-xs font-bold text-slate-500 uppercase mb-2">Actions</div>
                    <div className={`flex-1 grid grid-cols-2 gap-2 content-start ${!isInteractive ? 'pointer-events-none opacity-50 grayscale' : ''}`}>
                        {gameState.phase === Phase.INIT_SELECT && (
                            <button 
                                id="btn-confirm-init"
                                disabled={gameState.initSelectedIds.length !== 3}
                                onClick={() => handlers.onPhaseAction('CONFIRM_INIT')} 
                                className="col-span-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded shadow-lg h-12"
                            >
                                Confirm ({gameState.initSelectedIds.length}/3)
                            </button>
                        )}
                        {/* ... (Rest of actions mostly same, slight rendering tweaks if needed) ... */}
                        {gameState.phase === Phase.RESOURCE_START && (
                            <>
                                <button id="btn-add-resource" onClick={() => handlers.onPhaseAction('ADD_RESOURCE')} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm flex flex-col items-center justify-center p-1 h-16 transition-transform active:scale-95">
                                    <ArrowUpCircle size={20} className="mb-1"/> Add & Draw
                                </button>
                                <button id="btn-swap-resource" onClick={() => handlers.onPhaseAction('SWAP_RESOURCE')} className="bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-sm flex flex-col items-center justify-center p-1 h-16 transition-transform active:scale-95">
                                    <RotateCcw size={20} className="mb-1"/> Swap Res
                                </button>
                            </>
                        )}
                        {(gameState.phase === Phase.RESOURCE_ADD_SELECT || gameState.phase === Phase.RESOURCE_SWAP_SELECT_HAND || gameState.phase === Phase.RESOURCE_SWAP_SELECT_PILE) && (
                            <>
                                <div className={`col-span-2 text-center text-xs font-bold flex items-center justify-center border rounded h-10 ${gameState.phase.includes('ADD') ? 'text-emerald-400 border-emerald-900 bg-emerald-900/20' : 'text-amber-400 border-amber-900 bg-amber-900/20'} animate-pulse`}>
                                    {gameState.phase === Phase.RESOURCE_ADD_SELECT ? 'Select card to Add' : 'Select card to Swap'}
                                </div>
                                <button onClick={() => handlers.onPhaseAction('CANCEL_RESOURCE')} className="col-span-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded h-10">
                                    Cancel
                                </button>
                            </>
                        )}
                        {gameState.phase === Phase.MAIN && (
                            <>
                                <button 
                                    id="btn-attack-phase"
                                    disabled={bottomPlayer.hasAttackedThisTurn}
                                    onClick={() => handlers.onPhaseAction('ATTACK_PHASE')}
                                    className="col-span-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded flex items-center justify-center gap-2 h-10 transition-transform active:scale-95"
                                >
                                    <Sword size={18} /> Attack Phase
                                </button>
                                <button 
                                    id="btn-end-turn"
                                    onClick={() => handlers.onPhaseAction('END_TURN')}
                                    className={`col-span-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded h-10 transition-transform active:scale-95 ${isEndTurnPulse}`}
                                >
                                    End Turn
                                </button>
                            </>
                        )}
                        {gameState.phase === Phase.ATTACK_DECLARE && (
                            <button id="btn-confirm-attackers" onClick={() => handlers.onPhaseAction('CONFIRM_ATTACK')} className="col-span-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded animate-pulse shadow-lg shadow-rose-900/50 h-12">
                                Confirm Attackers
                            </button>
                        )}
                        {gameState.phase === Phase.BLOCK_DECLARE && activeDecisionPlayerId === 0 && (
                            <button id="btn-confirm-blocks" onClick={() => handlers.onPhaseAction('CONFIRM_BLOCK')} className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg shadow-blue-900/50 h-12">
                                Confirm Blocks
                            </button>
                        )}
                        
                        {/* CPU Turn Indicator */}
                        {gameState.players[activeDecisionPlayerId].isCpu && gameState.phase !== Phase.INIT_SELECT && (
                            <div className="col-span-2 flex flex-col items-center justify-center h-full gap-2">
                                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs text-indigo-400 font-bold animate-pulse">CPU Thinking...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="absolute top-20 left-4 w-72 z-40 bottom-60 overflow-y-auto space-y-1 pointer-events-auto pr-2 custom-scrollbar flex flex-col-reverse">
                {gameState.logs.map((log) => (
                    <LogEntryComponent key={log.id} text={`${log.text}`} />
                ))}
            </div>
        </div>
    );
};
