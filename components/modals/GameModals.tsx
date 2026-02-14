
import React from 'react';
import { Play, LogOut, ArrowRight } from 'lucide-react';
import { playSound } from '../../utils/soundUtils';
import { OptionsMenu } from './OptionsMenu';

interface GameModalProps {
    show: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export const EndTurnModal: React.FC<GameModalProps> = ({ show, onCancel, onConfirm }) => {
    if (!show) return null;
    return (
        <div className="absolute inset-0 z-[170] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-2xl max-w-sm w-full animate-in zoom-in duration-200">
                <h3 className="text-xl font-bold font-title text-amber-500 mb-2">End Turn?</h3>
                <p className="text-slate-400 mb-6">Are you sure you want to pass the turn?</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={() => { playSound('menu_click'); onCancel(); }} className="px-4 py-2 bg-slate-800 rounded font-bold hover:bg-slate-700">Cancel</button>
                    <button id="btn-end-turn-modal-confirm" onClick={() => { playSound('menu_click'); onConfirm(); }} className="px-4 py-2 bg-indigo-600 rounded font-bold hover:bg-indigo-500">Confirm</button>
                </div>
            </div>
        </div>
    );
};

export const ResignModal: React.FC<GameModalProps> = ({ show, onCancel, onConfirm }) => {
    if (!show) return null;
    return (
        <div className="absolute inset-0 z-[170] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-2xl max-w-sm w-full animate-in zoom-in duration-200 border-red-900/50">
                <h3 className="text-xl font-bold font-title text-red-500 mb-2">Resign Game?</h3>
                <p className="text-slate-400 mb-6">You will forfeit the match. Are you sure?</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={() => { playSound('menu_click'); onCancel(); }} className="px-4 py-2 bg-slate-800 rounded font-bold hover:bg-slate-700">Cancel</button>
                    <button onClick={() => { playSound('menu_click'); onConfirm(); }} className="px-4 py-2 bg-red-600 rounded font-bold hover:bg-red-500">Resign</button>
                </div>
            </div>
        </div>
    );
};

export const QuitModal: React.FC<GameModalProps> = ({ show, onCancel, onConfirm }) => {
    if (!show) return null;
    return (
        <div className="absolute inset-0 z-[170] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-2xl max-w-sm w-full animate-in zoom-in duration-200">
                <h3 className="text-xl font-bold font-title text-amber-500 mb-2">Quit to Title?</h3>
                <p className="text-slate-400 mb-6">Current game progress will be lost.</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={() => { playSound('menu_click'); onCancel(); }} className="px-4 py-2 bg-slate-800 rounded font-bold hover:bg-slate-700">Cancel</button>
                    <button onClick={() => { playSound('menu_click'); onConfirm(); }} className="px-4 py-2 bg-red-600 rounded font-bold hover:bg-red-500">Quit</button>
                </div>
            </div>
        </div>
    );
};

interface PauseMenuProps {
    show: boolean;
    onResume: () => void;
    onResign: () => void;
    onQuit: () => void;
    autoSort: boolean;
    onToggleSort: () => void;
    sfxVolume: number;
    setSfxVolume: (v: number) => void;
    musicVolume: number;
    setMusicVolume: (v: number) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ 
    show, 
    onResume, 
    onResign, 
    onQuit, 
    autoSort, 
    onToggleSort,
    sfxVolume,
    setSfxVolume,
    musicVolume,
    setMusicVolume
}) => {
    if (!show) return null;
    return (
        <div className="absolute inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 shadow-2xl w-96 text-center animate-in zoom-in duration-200 space-y-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold font-title text-white mb-2">PAUSED</h2>
                
                <button onClick={() => { playSound('menu_click'); onResume(); }} className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 rounded-lg font-bold flex items-center justify-center gap-2 text-white shadow-lg">
                    <Play size={18} /> Resume
                </button>

                <div className="py-2">
                    <OptionsMenu 
                        embedded 
                        autoSort={autoSort} 
                        toggleAutoSort={onToggleSort}
                        sfxVolume={sfxVolume}
                        setSfxVolume={setSfxVolume}
                        musicVolume={musicVolume}
                        setMusicVolume={setMusicVolume}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { playSound('menu_click'); onResign(); }} className="py-3 bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded-lg font-bold flex items-center justify-center gap-2 border border-red-900/50">
                        <LogOut size={18} /> Resign
                    </button>
                    <button onClick={() => { playSound('menu_click'); onQuit(); }} className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg font-bold flex items-center justify-center gap-2 border border-slate-700">
                        <ArrowRight size={18} /> Quit
                    </button>
                </div>
            </div>
        </div>
    );
};
