import React from 'react';
import { RotateCcw, CheckCircle, Users, Sword } from 'lucide-react';
import { playSound } from '../../../utils/soundUtils';

interface MultiplayerSetupMenuProps {
    setMenuStep: (step: any) => void;
    selectedMode: string | null;
    multiplayer: {
        peerId: string;
        status: string;
        error: string | null;
        connect: (id: string) => void;
    };
    targetPeerId: string;
    setTargetPeerId: (id: string) => void;
}

export const MultiplayerSetupMenu: React.FC<MultiplayerSetupMenuProps> = ({
    setMenuStep,
    selectedMode,
    multiplayer,
    targetPeerId,
    setTargetPeerId
}) => {
    const handleClick = (cb: () => void) => {
        playSound('menu_click');
        cb();
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-lg animate-in slide-in-from-right fade-in duration-300 px-4 pb-8">
            <div className="flex items-center gap-3 text-slate-300">
                <button 
                    onClick={() => handleClick(() => setMenuStep('GAME_SETUP'))} 
                    className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <RotateCcw size={20} />
                </button>
                <span className="text-sm font-bold uppercase tracking-wider text-slate-500">{selectedMode} Multiplayer Lobby</span>
            </div>

            <div className="bg-slate-900/50 border border-slate-700 p-6 rounded-2xl space-y-6">
                {/* Your ID */}
                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Your Peer ID</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                        <span className="flex-1 font-mono text-sm tracking-wider text-indigo-300 break-all select-all">
                            {multiplayer.peerId || 'Initializing...'}
                        </span>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(multiplayer.peerId);
                                playSound('menu_click');
                            }}
                            className="p-2 hover:bg-indigo-500/10 rounded-lg text-indigo-400 transition-colors"
                            title="Copy ID"
                        >
                            <CheckCircle size={18} />
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500">Share this ID with your friend so they can join you.</p>
                </div>

                <div className="h-px bg-slate-800 w-full"></div>

                {/* Connect to Friend */}
                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Connect to Friend</label>
                    <div className="flex flex-col gap-3">
                        <input 
                            type="text"
                            placeholder="Enter Friend's Peer ID..."
                            value={targetPeerId}
                            onChange={(e) => setTargetPeerId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-sm tracking-wider text-white focus:border-indigo-500 outline-none transition-colors"
                        />
                        <button 
                            onClick={() => handleClick(() => multiplayer.connect(targetPeerId))}
                            disabled={!targetPeerId || multiplayer.status === 'CONNECTING' || multiplayer.status === 'CONNECTED'}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                                ${multiplayer.status === 'CONNECTED' ? 'bg-emerald-600 text-white' : 
                                  multiplayer.status === 'CONNECTING' ? 'bg-slate-700 text-slate-400 cursor-wait' : 
                                  'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95'}
                            `}
                        >
                            {multiplayer.status === 'CONNECTED' ? (
                                <><Users size={20} /> Connected</>
                            ) : multiplayer.status === 'CONNECTING' ? (
                                <div className="h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <><Sword size={20} /> Connect & Play</>
                            )}
                        </button>
                    </div>
                    {multiplayer.error && (
                        <p className="text-xs text-red-500 font-medium">Error: {multiplayer.error}</p>
                    )}
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-center gap-4 py-2">
                     <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${multiplayer.status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : multiplayer.status === 'CONNECTING' ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`}></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{multiplayer.status}</span>
                     </div>
                </div>
            </div>
        </div>
    );
};
