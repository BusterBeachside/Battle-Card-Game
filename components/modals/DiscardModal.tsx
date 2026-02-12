
import React from 'react';
import { Trash2, X } from 'lucide-react';
import { CardDisplay } from '../CardDisplay';
import { Card, PlayerState, GameMode } from '../../types';

interface DiscardModalProps {
    viewingDiscard: 'SHARED' | number | null;
    players: PlayerState[];
    onClose: () => void;
    mode: GameMode;
}

export const DiscardModal: React.FC<DiscardModalProps> = ({ viewingDiscard, players, onClose, mode }) => {
    if (viewingDiscard === null) return null;

    const discardCards = viewingDiscard === 'SHARED' 
        ? [...players[0].discard, ...players[1].discard] 
        : (typeof viewingDiscard === 'number' ? players[viewingDiscard].discard : []);

    const title = viewingDiscard === 'SHARED' ? 'Shared Graveyard' : `${players[viewingDiscard].name}'s Graveyard`;

    return (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md" onClick={onClose}>
            <div className="relative w-full max-w-4xl p-8 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold font-title text-white flex items-center gap-3">
                        <Trash2 className="text-slate-500" />
                        {title}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                    {discardCards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-600 italic">
                            No cards in graveyard.
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-4 justify-center">
                            {discardCards.map((c, i) => (
                                <div key={i} className="hover:scale-110 transition-transform">
                                    <CardDisplay card={c} size="md" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="mt-4 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                    {discardCards.length} Cards
                </div>
            </div>
        </div>
    );
};
