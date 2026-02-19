
import React from 'react';
import { CardDisplay } from '../CardDisplay';
import { Color, Phase } from '../../types';
import { getEffectiveColor } from '../../utils/rules';
import { Menu, Heart, X, ArrowRight, ArrowUpCircle, RotateCcw, Sword, Trash2 } from 'lucide-react';
import { LogRenderer } from '../ui/LogRenderer';
import { LayoutProps } from './types';

export const MobileLayout: React.FC<LayoutProps> = ({
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
    // Shrink cards as count increases to fit them in
    const getLaneScaleClass = (count: number) => {
        if (count > 8) return 'scale-[0.60] -m-3';
        if (count > 6) return 'scale-[0.70] -m-2';
        if (count > 4) return 'scale-[0.80] -m-1';
        return 'scale-90';
    };

    const isMainPhase = gameState.phase === Phase.MAIN;
    // Calculate pulse for end turn button
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
        <div className="flex flex-col h-full bg-slate-950 select-none overflow-hidden">
            {/* Mobile Top Bar: CPU Info */}
            <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 shadow-md z-30 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => handlers.setShowMenu(true)} className="p-1.5 bg-slate-800 rounded text-slate-400">
                        <Menu size={18} />
                    </button>
                    <div className="flex flex-col leading-tight">
                        <span className="text-xs font-bold text-indigo-300">{topPlayer.name}</span>
                        <div className="flex items-center gap-2 text-xs text-slate-500" ref={refs.topDeckRef}>
                            <span>Deck: {gameState.mode === 'STREET' ? gameState.deck.length : topPlayer.library.length}</span>
                        </div>
                    </div>
                </div>
                
                {/* Center Turn Info */}
                <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <span className="font-title font-bold text-amber-500 text-sm">TURN {gameState.turnCount}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{getPhaseName()}</span>
                </div>

                <div className="flex items-center gap-3" ref={refs.lifeIconRef}>
                    <div className="flex items-center gap-1 text-red-400 font-black text-xl">
                        <Heart size={20} fill="currentColor" /> {topPlayer.life}
                    </div>
                    {gameState.mode === 'PRO' && (
                        <button 
                            ref={refs.topDiscardRef as React.RefObject<HTMLButtonElement>}
                            onClick={() => handlers.setViewingDiscard(topPlayer.id)} 
                            className="text-slate-500"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    {gameState.mode !== 'PRO' && <div ref={refs.topDiscardRef as React.RefObject<HTMLDivElement>} className="w-1 h-1 opacity-0"/>}
                </div>
            </div>

            {/* Mobile Field Area */}
            <div id="field-area" className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] overflow-hidden flex flex-col">
                
                {/* Log Toggle Button */}
                <button 
                    onClick={handlers.toggleLog} 
                    className={`absolute top-2 left-2 z-40 p-2 rounded-full border shadow-lg transition-colors ${uiState.showMobileLog ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900/80 border-slate-700 text-slate-400'}`}
                >
                    {uiState.showMobileLog ? <X size={16} /> : <div className="text-[10px] font-bold">LOG</div>}
                </button>
                
                {/* Mobile Log Overlay */}
                {uiState.showMobileLog && (
                    <div className="absolute top-12 left-2 right-2 bottom-auto max-h-48 z-40 bg-black/80 backdrop-blur-md border border-slate-700 rounded-lg overflow-y-auto p-2 flex flex-col-reverse gap-1 shadow-2xl">
                        {gameState.logs.map((log) => (
                            <div key={log.id} className="text-xs text-slate-300 border-l-2 border-indigo-500 pl-2">
                                <LogRenderer text={`${log.text}`} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Top Player Zone - Flex layout to prevent overlap */}
                <div className="flex-1 flex flex-col items-center justify-start py-2 w-full min-h-0">
                    {/* CPU Hand */}
                    <div className="flex -space-x-6 scale-75 opacity-90 h-12 shrink-0" ref={refs.cpuHandRef}>
                        {topPlayer.hand.map(c => <CardDisplay key={c.id} domId={c.id} card={c} showBack={gameState.mode !== 'SANDBOX' && !isSpectate} size="sm" onClick={() => handlers.onCardClick(c, 'HAND', topPlayer.id)} />)}
                    </div>

                    {/* CPU Field & Resources */}
                    <div className="flex w-full items-start justify-between px-2 mt-2 flex-1 min-h-0">
                        
                        {/* Field Lanes (Center/Left) */}
                        <div className="flex-1 flex justify-center gap-2 min-w-0 pr-2">
                            {/* Black Lane */}
                            <div className="bg-slate-900/40 lane-physical p-1 rounded border border-slate-700/50 flex flex-wrap gap-1 min-w-[40px] items-start content-start justify-center">
                                {topBlack.map(fc => (
                                    <div key={fc.instanceId} className={`${getLaneScaleClass(topBlack.length)} origin-top ${fc.isBeingSummoned ? 'opacity-0' : ''}`}>
                                        <CardDisplay 
                                            domId={fc.instanceId}
                                            data-instance-id={fc.instanceId}
                                            card={fc.card} 
                                            isTapped={fc.isTapped}
                                            isSummoningSick={fc.isSummoningSick}
                                            size="sm"
                                            isLunging={gameState.activeCombatCardId === fc.instanceId}
                                            damageTaken={gameState.recentDamage[fc.instanceId]}
                                            attachedCards={fc.attachedCards}
                                            orientation="top"
                                            onClick={() => handlers.onCardClick(fc.card, 'FIELD', topPlayer.id, fc.instanceId)}
                                        />
                                    </div>
                                ))}
                            </div>
                            {/* Red Lane */}
                            <div className="bg-red-900/20 lane-magical p-1 rounded border border-red-900/30 flex flex-wrap gap-1 min-w-[40px] items-start content-start justify-center">
                                {topRed.map(fc => (
                                    <div key={fc.instanceId} className={`${getLaneScaleClass(topRed.length)} origin-top ${fc.isBeingSummoned ? 'opacity-0' : ''}`}>
                                        <CardDisplay 
                                            domId={fc.instanceId}
                                            data-instance-id={fc.instanceId}
                                            card={fc.card} 
                                            isTapped={fc.isTapped}
                                            isSummoningSick={fc.isSummoningSick} 
                                            size="sm"
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

                        {/* Resources (Right) - Static, no overlap */}
                        <div className="flex-none flex flex-col items-center gap-1 scale-90 origin-top-right z-20">
                            <div className="text-[10px] font-bold text-slate-500 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                                {topPlayer.resources.length}
                            </div>
                            <div id={`resource-container-${topPlayer.id}`} className="flex flex-col items-center -space-y-12">
                                {topPlayer.resources.map((r, i) => (
                                    <div key={r.instanceId} style={{ zIndex: i }} className="transition-all" onClick={() => handlers.onCardClick(r.card, 'RESOURCE', topPlayer.id, r.instanceId)}>
                                        <CardDisplay card={r.card} isTapped={r.isTapped} size="sm" isSummoningSick={false} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Player Zone - Flex layout to prevent overlap */}
                <div className="flex-1 flex flex-col justify-end py-2 w-full min-h-0 border-t border-slate-800/30">
                    
                    {/* Bottom Field & Resources */}
                    <div className="flex w-full items-end justify-between px-2 mb-2 flex-1 min-h-0">
                        
                        {/* Resources (Left) - Single Row/Column Stack with Hover Effect Restored */}
                        <div className="flex-none flex flex-col items-center gap-1 scale-90 origin-bottom-left z-20">
                            <div id={`resource-container-${bottomPlayer.id}`} className="flex flex-col-reverse items-center -space-y-12 space-y-reverse pb-8 pointer-events-auto">
                                {bottomPlayer.resources.map((r, i) => (
                                    <div 
                                        key={r.instanceId} 
                                        id={r.instanceId} 
                                        style={{ zIndex: i }} 
                                        className="transition-all duration-200 hover:scale-110 hover:z-50 hover:mb-4" 
                                        onClick={() => handlers.onCardClick(r.card, 'RESOURCE', bottomPlayer.id, r.instanceId)}
                                    >
                                        <CardDisplay card={r.card} isTapped={r.isTapped} size="sm" isSummoningSick={false} />
                                    </div>
                                ))}
                            </div>
                            <div className="text-[10px] font-bold text-indigo-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700 h-fit">
                                {bottomPlayer.resources.filter(r => !r.isTapped).length}/{bottomPlayer.resources.length}
                            </div>
                        </div>

                        {/* Field Lanes (Center/Right) - Flex-1 to take remaining space */}
                        <div className="flex-1 flex justify-center gap-2 min-w-0 pl-2">
                            {/* Black Lane */}
                            <div id={`lane-black-${bottomPlayer.id}`} className="bg-slate-900/40 lane-physical p-1 rounded border border-slate-700/50 flex flex-wrap gap-1 min-w-[40px] items-end content-end justify-center">
                                {bottomBlack.map(fc => (
                                    <div key={fc.instanceId} className={`${getLaneScaleClass(bottomBlack.length)} origin-bottom ${fc.isBeingSummoned ? 'opacity-0' : ''}`}>
                                        <CardDisplay 
                                            domId={fc.instanceId}
                                            data-instance-id={fc.instanceId}
                                            card={fc.card} 
                                            isTapped={fc.isTapped}
                                            isSummoningSick={fc.isSummoningSick} 
                                            size="sm"
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
                            {/* Red Lane */}
                            <div className="bg-red-900/20 lane-magical p-1 rounded border border-red-900/30 flex flex-wrap gap-1 min-w-[40px] items-end content-end justify-center">
                                {bottomRed.map(fc => (
                                    <div key={fc.instanceId} className={`${getLaneScaleClass(bottomRed.length)} origin-bottom ${fc.isBeingSummoned ? 'opacity-0' : ''}`}>
                                        <CardDisplay 
                                            domId={fc.instanceId}
                                            data-instance-id={fc.instanceId}
                                            card={fc.card} 
                                            isTapped={fc.isTapped}
                                            isSummoningSick={fc.isSummoningSick} 
                                            size="sm"
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
                    </div>
                </div>

                {/* Floating Action Buttons (Mobile) - Moved to Center Right */}
                <div className="absolute top-1/2 right-2 -translate-y-1/2 flex flex-col gap-2 z-50">
                    {/* Contextual Actions */}
                    {gameState.phase === Phase.INIT_SELECT && isInteractive && (
                        <button 
                            id="btn-confirm-init"
                            disabled={gameState.initSelectedIds.length !== 3}
                            onClick={() => handlers.onPhaseAction('CONFIRM_INIT')} 
                            className="bg-indigo-600 p-3 rounded-full text-white shadow-lg disabled:opacity-50 animate-bounce"
                        >
                            <ArrowRight size={24} />
                        </button>
                    )}
                    {gameState.phase === Phase.RESOURCE_START && isInteractive && (
                        <>
                            <button id="btn-add-resource" onClick={() => handlers.onPhaseAction('ADD_RESOURCE')} className="bg-emerald-600 p-3 rounded-full text-white shadow-lg">
                                <ArrowUpCircle size={24} />
                            </button>
                            <button id="btn-swap-resource" onClick={() => handlers.onPhaseAction('SWAP_RESOURCE')} className="bg-amber-600 p-3 rounded-full text-white shadow-lg">
                                <RotateCcw size={24} />
                            </button>
                        </>
                    )}
                    {(gameState.phase === Phase.RESOURCE_ADD_SELECT || gameState.phase === Phase.RESOURCE_SWAP_SELECT_HAND || gameState.phase === Phase.RESOURCE_SWAP_SELECT_PILE) && isInteractive && (
                        <button onClick={() => handlers.onPhaseAction('CANCEL_RESOURCE')} className="bg-slate-700 p-3 rounded-full text-white shadow-lg">
                            <X size={24} />
                        </button>
                    )}
                    {gameState.phase === Phase.MAIN && isInteractive && (
                        <>
                            {!bottomPlayer.hasAttackedThisTurn && (
                                <button id="btn-attack-phase" onClick={() => handlers.onPhaseAction('ATTACK_PHASE')} className="bg-rose-600 p-3 rounded-full text-white shadow-lg">
                                    <Sword size={24} />
                                </button>
                            )}
                            <button id="btn-end-turn" onClick={() => handlers.onPhaseAction('END_TURN')} className={`bg-slate-700 p-3 rounded-full text-white shadow-lg ${isEndTurnPulse}`}>
                                <ArrowRight size={24} />
                            </button>
                        </>
                    )}
                    {gameState.phase === Phase.ATTACK_DECLARE && isInteractive && (
                        <button id="btn-confirm-attackers" onClick={() => handlers.onPhaseAction('CONFIRM_ATTACK')} className="bg-rose-600 px-4 py-2 rounded-full text-white font-bold shadow-lg animate-pulse">
                            CONFIRM
                        </button>
                    )}
                    {gameState.phase === Phase.BLOCK_DECLARE && activeDecisionPlayerId === bottomPlayer.id && isInteractive && (
                        <button id="btn-confirm-blocks" onClick={() => handlers.onPhaseAction('CONFIRM_BLOCK')} className="bg-blue-600 px-4 py-2 rounded-full text-white font-bold shadow-lg">
                            BLOCK
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Bottom Bar: Player Info & Hand */}
            <div className="bg-slate-900 border-t border-slate-800 shrink-0 z-30">
                {/* Info Strip */}
                <div className="h-10 flex items-center justify-between px-3 bg-slate-950 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-indigo-300">{bottomPlayer.name}</span>
                        <div id="bottom-life-total" className="flex items-center gap-1 text-red-500 font-black text-xl" ref={refs.bottomLifeRef}>
                            <Heart size={20} fill="currentColor" /> {bottomPlayer.life}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="text-xs text-slate-500" ref={refs.bottomDeckRef}>Deck: {gameState.mode === 'STREET' ? gameState.deck.length : bottomPlayer.library.length}</div>
                        <button 
                            ref={refs.bottomDiscardRef as React.RefObject<HTMLButtonElement>}
                            onClick={() => handlers.setViewingDiscard(gameState.mode === 'STREET' ? 'SHARED' : bottomPlayer.id)} 
                            className="text-slate-400 flex items-center gap-1 text-xs bg-slate-800 px-2 py-1 rounded"
                        >
                            <Trash2 size={14} /> {gameState.mode === 'STREET' ? gameState.players[0].discard.length + gameState.players[1].discard.length : bottomPlayer.discard.length}
                        </button>
                    </div>
                </div>

                {/* Hand Scroll */}
                <div 
                    className={`h-28 w-full flex items-center justify-center bg-slate-900/50 pb-2 overflow-hidden transition-all ${
                        bottomPlayer.hand.length > 8 ? '-space-x-[3.5rem]' : 
                        bottomPlayer.hand.length > 5 ? '-space-x-10' : 
                        bottomPlayer.hand.length > 3 ? '-space-x-6' : 
                        '-space-x-2'
                    }`} 
                    ref={refs.handRef}
                >
                    {bottomPlayer.hand.map((c, i) => {
                        const isSelected = gameState.phase === Phase.INIT_SELECT && gameState.initSelectedIds.includes(c.id);
                        
                        let hasValidTarget = true;
                        if (c.rank === 'K') hasValidTarget = topPlayer.field.some(f => getEffectiveColor(f) === c.baseColor);
                        if (c.rank === 'Q') hasValidTarget = topPlayer.field.length > 0 || bottomPlayer.field.length > 0;

                        const isPlayable = isMainPhase && isInteractive && bottomPlayer.resources.filter(r => !r.isTapped).length >= c.cost && hasValidTarget;
                        
                        return (
                            <div 
                                key={c.id} 
                                id={c.id} 
                                style={{ zIndex: i }}
                                className={`
                                    shrink-0 scale-90 origin-bottom transition-all duration-300
                                    ${isSelected ? '-translate-y-8 z-30' : 'active:-translate-y-8 active:scale-100 active:z-40 hover:-translate-y-8 hover:scale-100 hover:z-40'}
                                    ${dragState?.cardId === c.id ? 'opacity-0' : ''}
                                `}
                            >
                                <CardDisplay 
                                    card={c} 
                                    onClick={gameState.phase === Phase.MAIN ? undefined : () => handlers.onCardClick(c, 'HAND', bottomPlayer.id)}
                                    onMouseDown={(e) => handlers.onDragStart(e, c, 'HAND', bottomPlayer.id)}
                                    onTouchStart={(e) => handlers.onDragStart(e, c, 'HAND', bottomPlayer.id)}
                                    isPlayable={isPlayable}
                                    isSelected={isSelected}
                                    isDragging={dragState?.cardId === c.id}
                                    size="md"
                                />
                            </div>
                        );
                    })}
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
    );
};
