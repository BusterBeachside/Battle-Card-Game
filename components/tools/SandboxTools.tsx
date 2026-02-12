
import React from 'react';
import { CardDisplay } from '../CardDisplay';
import { Card, GameState } from '../../types';
import { getSortedDeck, sortHand } from '../../utils/cards';
import { generateId } from '../../utils/core';
import { createFieldCard } from '../../utils/rules';
import { Search, Edit3, X, Eye, Play, Minus, Plus } from 'lucide-react';

interface SandboxToolsProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    sandboxSearchTerm: string;
    setSandboxSearchTerm: (term: string) => void;
    sandboxTargetPlayer: 0 | 1;
    setSandboxTargetPlayer: (id: 0 | 1) => void;
    selectedSandboxCard: Card | null;
    setSelectedSandboxCard: (card: Card | null) => void;
    setSandboxToolsOpen: (open: boolean) => void;
    setShowPlaySetup: (show: boolean) => void;
}

export const SandboxTools: React.FC<SandboxToolsProps> = ({
    gameState,
    setGameState,
    sandboxSearchTerm,
    setSandboxSearchTerm,
    sandboxTargetPlayer,
    setSandboxTargetPlayer,
    selectedSandboxCard,
    setSelectedSandboxCard,
    setSandboxToolsOpen,
    setShowPlaySetup
}) => {
    const sortedDeck = getSortedDeck();
    const filtered = sortedDeck.filter(c => 
        c.rank.toLowerCase().includes(sandboxSearchTerm.toLowerCase()) || 
        c.suit.toLowerCase().includes(sandboxSearchTerm.toLowerCase()) ||
        `${c.rank}${c.suit}`.toLowerCase().includes(sandboxSearchTerm.toLowerCase())
    );

    const spawnCard = (card: Card, location: 'HAND' | 'FIELD' | 'RESOURCE', ownerId: number) => {
        setGameState(prev => {
            if(!prev) return null;
            const nextState = { ...prev, players: [...prev.players] };
            const p = nextState.players.find(pl => pl.id === ownerId)!;
            const newCard = { ...card, id: generateId() };
            if (location === 'HAND') { p.hand = sortHand([...p.hand, newCard]); } 
            else if (location === 'FIELD') { const fc = createFieldCard(newCard, ownerId); fc.isSummoningSick = false; p.field.push(fc); } 
            else if (location === 'RESOURCE') { const fc = createFieldCard(newCard, ownerId); fc.isSummoningSick = false; p.resources.push(fc); }
            return nextState;
        });
    };

    return (
        <div className="absolute top-16 right-4 z-[90] w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
             <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                 <h3 className="font-bold text-amber-500 flex items-center gap-2"><Edit3 size={16}/> Sandbox Tools</h3>
                 <button onClick={() => setSandboxToolsOpen(false)}><X size={16}/></button>
             </div>
             
             <div className="p-3 space-y-4 overflow-y-auto">
                 {/* Player Control */}
                 <div className="flex gap-2 bg-slate-950 p-2 rounded">
                     <button onClick={() => setGameState(prev => prev ? { ...prev, turnPlayer: prev.turnPlayer === 0 ? 1 : 0 } : null)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-1 rounded text-xs font-bold flex items-center justify-center gap-1">
                         <Eye size={12} /> Switch View
                     </button>
                     <button onClick={() => setShowPlaySetup(true)} className="flex-1 bg-emerald-700 hover:bg-emerald-600 py-1 rounded text-xs font-bold flex items-center justify-center gap-1">
                         <Play size={12} /> Play
                     </button>
                 </div>

                 {/* Life Editor */}
                 <div className="space-y-2">
                     <div className="text-xs text-slate-400 font-bold uppercase">Life Totals</div>
                     {gameState.players.map(p => (
                         <div key={p.id} className="flex justify-between items-center bg-slate-800 p-2 rounded">
                             <span className="text-xs font-bold w-20 truncate">{p.name}</span>
                             <div className="flex items-center gap-2">
                                 <button onClick={() => setGameState(prev => {
                                     if(!prev) return null;
                                     const ps = [...prev.players];
                                     ps[p.id].life = Math.max(0, ps[p.id].life - 1);
                                     return { ...prev, players: ps };
                                 })} className="p-1 hover:bg-slate-700 rounded"><Minus size={12}/></button>
                                 <span className="text-sm font-bold w-6 text-center">{p.life}</span>
                                 <button onClick={() => setGameState(prev => {
                                     if(!prev) return null;
                                     const ps = [...prev.players];
                                     ps[p.id].life += 1;
                                     return { ...prev, players: ps };
                                 })} className="p-1 hover:bg-slate-700 rounded"><Plus size={12}/></button>
                             </div>
                         </div>
                     ))}
                 </div>

                 {/* Card Spawner */}
                 <div className="space-y-2">
                     <div className="text-xs text-slate-400 font-bold uppercase">Spawn Card</div>
                     <div className="relative">
                         <Search className="absolute left-2 top-2 text-slate-500" size={14}/>
                         <input 
                              className="w-full bg-slate-950 border border-slate-700 rounded pl-8 py-1.5 text-xs focus:outline-none focus:border-amber-500" 
                              placeholder="Search (e.g. King, Hearts, A)"
                              value={sandboxSearchTerm}
                              onChange={e => setSandboxSearchTerm(e.target.value)}
                         />
                     </div>
                     
                     {/* Target Selector */}
                     <div className="flex gap-1 text-[10px] font-bold">
                         <button onClick={() => setSandboxTargetPlayer(0)} className={`flex-1 py-1 rounded ${sandboxTargetPlayer === 0 ? 'bg-indigo-600' : 'bg-slate-800'}`}>P1</button>
                         <button onClick={() => setSandboxTargetPlayer(1)} className={`flex-1 py-1 rounded ${sandboxTargetPlayer === 1 ? 'bg-rose-600' : 'bg-slate-800'}`}>P2</button>
                     </div>

                     <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-950 rounded border border-slate-800">
                         {filtered.map(c => (
                             <div key={c.id} onClick={() => setSelectedSandboxCard(c)} className={`cursor-pointer transition-transform hover:scale-105 ${selectedSandboxCard?.id === c.id ? 'ring-2 ring-amber-500 rounded' : ''}`}>
                                 <CardDisplay card={c} size="sm" />
                             </div>
                         ))}
                     </div>
                     
                     <div className="grid grid-cols-3 gap-1">
                         <button disabled={!selectedSandboxCard} onClick={() => spawnCard(selectedSandboxCard!, 'HAND', sandboxTargetPlayer)} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 py-1 rounded text-[10px] font-bold">Add Hand</button>
                         <button disabled={!selectedSandboxCard} onClick={() => spawnCard(selectedSandboxCard!, 'FIELD', sandboxTargetPlayer)} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 py-1 rounded text-[10px] font-bold">Add Field</button>
                         <button disabled={!selectedSandboxCard} onClick={() => spawnCard(selectedSandboxCard!, 'RESOURCE', sandboxTargetPlayer)} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 py-1 rounded text-[10px] font-bold">Add Res</button>
                     </div>
                 </div>
             </div>
        </div>
    );
};