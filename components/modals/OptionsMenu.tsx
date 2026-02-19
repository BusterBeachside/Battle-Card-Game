
import React from 'react';
import { X, Volume2, CheckSquare, Square, FastForward } from 'lucide-react';

interface OptionsMenuProps {
    onClose?: () => void;
    autoSort: boolean;
    toggleAutoSort: () => void;
    autoEndTurn: boolean;
    toggleAutoEndTurn: () => void;
    sfxVolume: number;
    setSfxVolume: (v: number) => void;
    embedded?: boolean;
}

export const OptionsMenu: React.FC<OptionsMenuProps> = ({ 
    onClose, 
    autoSort, 
    toggleAutoSort, 
    autoEndTurn,
    toggleAutoEndTurn,
    sfxVolume, 
    setSfxVolume, 
    embedded = false 
}) => {
    const containerClasses = embedded 
        ? "w-full bg-slate-800/50 rounded-lg p-4 border border-slate-700" 
        : "absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in";
    
    const innerClasses = embedded 
        ? "space-y-6" 
        : "bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-2xl w-80 space-y-6 animate-in zoom-in duration-200 relative";

    return (
        <div className={containerClasses} onClick={!embedded && onClose ? onClose : undefined}>
            <div className={innerClasses} onClick={e => e.stopPropagation()}>
                {!embedded && (
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-bold font-title text-white">Options</h3>
                        {onClose && (
                            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        )}
                    </div>
                )}
                
                {/* Auto Sort Toggle */}
                <div 
                    onClick={toggleAutoSort}
                    className="flex items-center justify-between cursor-pointer group bg-slate-950/50 p-3 rounded-lg border border-slate-800 hover:border-indigo-500/50 transition-colors"
                >
                    <span className="font-bold text-slate-300 group-hover:text-white transition-colors">Auto-Sort Hand</span>
                    {autoSort ? <CheckSquare className="text-emerald-500" size={20} /> : <Square className="text-slate-600" size={20} />}
                </div>

                {/* Auto End Turn Toggle */}
                <div 
                    onClick={toggleAutoEndTurn}
                    className="flex items-center justify-between cursor-pointer group bg-slate-950/50 p-3 rounded-lg border border-slate-800 hover:border-indigo-500/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <FastForward className="text-indigo-400" size={16} />
                        <span className="font-bold text-slate-300 group-hover:text-white transition-colors">Auto End Turn</span>
                    </div>
                    {autoEndTurn ? <CheckSquare className="text-emerald-500" size={20} /> : <Square className="text-slate-600" size={20} />}
                </div>

                {/* SFX Volume */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-slate-300 text-sm font-bold">
                        <div className="flex items-center gap-2">
                            <Volume2 size={16} /> SFX Volume
                        </div>
                        <span>{Math.round(sfxVolume * 100)}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="1" step="0.05" 
                        value={sfxVolume} 
                        onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>
            </div>
        </div>
    );
};
