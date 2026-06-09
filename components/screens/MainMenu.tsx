
import React from 'react';
import { GameMode } from '../../types';
import { TUTORIAL_LESSONS } from '../../data/tutorials';
import { Coins, Sword, Edit3, RotateCcw, RefreshCw, Cpu, Users, Tv, ArrowRight, GraduationCap, ChevronLeft, BookOpen, CheckCircle, Settings, Shield, Trophy, Calendar, Award, User, ShoppingBag, Palette, Play, Lock } from 'lucide-react';
import { playSound } from '../../utils/soundUtils';
import { ProgressionData, rerollQuest } from '../../utils/progression';
import { GoldCoin } from '../ui/GoldCoin';
import { CardDisplay } from '../CardDisplay';
import { loadCampaign, saveCampaign, generateCampaignMap, CampaignState } from '../../utils/campaign';

import { CosmeticItem, COSMETIC_ITEMS } from '../../data/cosmetics';
import { PlayerHQModal } from './main-menu/PlayerHQModal';
import { CustomizeMenu } from './main-menu/CustomizeMenu';
import { ShopMenu } from './main-menu/ShopMenu';
import { TutorialMenu } from './main-menu/TutorialMenu';
import { CampaignMenu } from './main-menu/CampaignMenu';
import { GameSetupMenu } from './main-menu/GameSetupMenu';
import { MultiplayerSetupMenu } from './main-menu/MultiplayerSetupMenu';
import { ModeMenu } from './main-menu/ModeMenu';

interface MainMenuProps {
    menuStep: 'MODE' | 'TUTORIAL_MENU' | 'MULTIPLAYER_SETUP' | 'SHOP' | 'CUSTOMIZE' | 'CAMPAIGN_MAP' | 'GAME_SETUP';
    setMenuStep: (step: 'MODE' | 'TUTORIAL_MENU' | 'MULTIPLAYER_SETUP' | 'SHOP' | 'CUSTOMIZE' | 'CAMPAIGN_MAP' | 'GAME_SETUP' | string) => void;
    handleModeSelect: (mode: GameMode) => void;
    handleStartGameClick: (isCpu: boolean, modeOverride?: GameMode) => void;
    handleSpectateClick: (modeOverride?: GameMode) => void;
    startLesson: (lessonId: string) => void;
    onOpenOptions: () => void;
    enableMultiBlocking: boolean;
    setEnableMultiBlocking: (val: boolean) => void;
    multiplayer: {
        peerId: string;
        status: 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
        error: string | null;
        connect: (id: string) => void;
    };
    selectedMode: GameMode | null;
    progression: ProgressionData;
    setProgression: React.Dispatch<React.SetStateAction<ProgressionData>>;
    cpuDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
    setCpuDifficulty: (v: 'EASY' | 'MEDIUM' | 'HARD') => void;
    cpu2Difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    setCpu2Difficulty: (v: 'EASY' | 'MEDIUM' | 'HARD') => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ 
    menuStep, 
    setMenuStep, 
    handleModeSelect, 
    handleStartGameClick, 
    handleSpectateClick,
    startLesson,
    onOpenOptions,
    enableMultiBlocking,
    setEnableMultiBlocking,
    multiplayer,
    selectedMode,
    progression,
    setProgression,
    cpuDifficulty,
    setCpuDifficulty,
    cpu2Difficulty,
    setCpu2Difficulty
}) => {
    const [targetPeerId, setTargetPeerId] = React.useState('');
    const [showHQModal, setShowHQModal] = React.useState(false);

    const [selectedSubMode, setSelectedSubMode] = React.useState<'CAMPAIGN' | 'VERSUS_AI' | 'SPECTATE' | 'HOTSEAT' | 'ONLINE_MULTIPLAYER' | null>(null);
    const [rulesFormatSelect, setRulesFormatSelect] = React.useState<'STREET' | 'PRO'>('STREET');
    const [campaignState, setCampaignState] = React.useState<CampaignState | null>(null);

    const handleSwitchRulesFormat = (format: 'STREET' | 'PRO') => {
        if (!campaignState) return;
        const updated = { ...campaignState, rulesFormat: format };
        setCampaignState(updated);
        saveCampaign(updated);
    };

    React.useEffect(() => {
        const handleUpdate = () => {
            try {
                setCampaignState(loadCampaign());
            } catch (e) {}
        };
        handleUpdate();
        window.addEventListener('campaign-updated', handleUpdate);
        return () => window.removeEventListener('campaign-updated', handleUpdate);
    }, [menuStep]);

    React.useEffect(() => {
        if (!campaignState && menuStep === 'CAMPAIGN_MAP') {
            try {
                setCampaignState(loadCampaign());
            } catch (e) {}
        }
    }, [menuStep, campaignState]);











    const handleClick = (cb: () => void) => {
        playSound('menu_click');
        cb();
    };

    const hasUnclaimedQuests = progression.quests.some(q => q.completed && !q.claimed);
    const hasDailyLogin = !progression.claimedStreakToday;
    const needsAttention = hasUnclaimedQuests || hasDailyLogin;
    let attentionText = "Attention Needed!";
    if (hasDailyLogin) attentionText = "Claim Login Reward!";
    if (hasUnclaimedQuests) attentionText = "Quest Complete!";
    if (hasDailyLogin && hasUnclaimedQuests) attentionText = "Rewards Ready!";

    return (
        <div className="relative z-10 w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {/* Top Left Deck Style & Card Shop Button Pill */}
            <div className="absolute top-4 left-4 flex items-center gap-2 md:gap-3 z-40 bg-slate-900/80 p-1 md:p-1.5 px-3 md:px-4 rounded-full border border-slate-700 backdrop-blur-md shadow-lg">
                <button 
                    onClick={() => handleClick(() => setMenuStep('CUSTOMIZE'))}
                    className="flex items-center gap-1.5 md:gap-2 transition-colors hover:text-indigo-300 text-slate-300 cursor-pointer group text-xs font-bold font-title uppercase tracking-wider"
                    title="Open Deck Style Customization"
                >
                    <Palette size={14} className="text-violet-400 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Deck Style</span>
                </button>
                
                <div className="h-6 w-px bg-slate-700/80"></div>
                
                <button 
                    onClick={() => handleClick(() => setMenuStep('SHOP'))}
                    className="flex items-center gap-1.5 md:gap-2 transition-colors hover:text-amber-350 text-slate-300 cursor-pointer group text-xs font-bold font-title uppercase tracking-wider"
                    title="Open the Card Shop"
                >
                    <ShoppingBag size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Card Shop</span>
                </button>
            </div>

            {/* Top Right Settings & Player HUD Button Pill */}
            <div className={`absolute top-4 right-4 flex items-center gap-2 md:gap-3 z-40 bg-slate-900/80 p-1 md:p-1.5 pl-3 md:pl-4 rounded-full border backdrop-blur-md shadow-lg ${needsAttention ? 'border-amber-400 animate-pulse' : 'border-slate-700'}`}>
                {/* Attention Popup Message */}
                {needsAttention && (
                    <div className="absolute -bottom-8 right-6 bg-amber-400 text-amber-950 font-bold text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap animate-bounce pointer-events-none after:content-[''] after:absolute after:top-[-4px] after:right-4 after:border-l-[4px] after:border-l-transparent after:border-r-[4px] after:border-r-transparent after:border-b-[4px] after:border-b-amber-400">
                        {attentionText}
                    </div>
                )}
                {/* HUD Profile Button */}
                <button 
                    onClick={() => handleClick(() => setShowHQModal(true))}
                    className="flex items-center gap-1.5 md:gap-3 transition-colors hover:text-indigo-400 text-left cursor-pointer group relative"
                    title="Click for Player details and quests"
                >
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-100 text-[11px] md:text-xs line-clamp-1 truncate max-w-[50px] sm:max-w-[70px] md:max-w-[120px] group-hover:text-indigo-300 transition-colors">
                            {progression.playerName}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold font-mono tracking-tighter">
                            Level {progression.level}
                        </span>
                    </div>
                    
                    <div className="hidden sm:block h-6 w-px bg-slate-700/80"></div>
                    
                    <div className="hidden sm:flex flex-col items-end pr-1 text-xs font-bold text-amber-400">
                        <span className="flex items-center gap-1">
                            <GoldCoin size={14} /> {progression.gold}
                        </span>
                        <div className="w-12 bg-slate-800 h-1 rounded-full overflow-hidden mt-0.5" title={`${progression.xp} / ${progression.level * 500} XP`}>
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full" style={{ width: `${(progression.xp / (progression.level * 500)) * 100}%` }}></div>
                        </div>
                    </div>
                    
                    <div className={`bg-indigo-600/10 p-2 rounded-full border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-all flex items-center justify-center relative`}>
                        <Trophy size={14} className="md:w-[16px] md:h-[16px]" fill="currentColor" />
                        {needsAttention && (
                            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-slate-900 animate-ping"></div>
                        )}
                        {needsAttention && (
                            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-slate-900"></div>
                        )}
                    </div>
                </button>

                <div className="h-6 w-px bg-slate-700/80"></div>

                {/* Top Right Options Button */}
                <button 
                    onClick={() => handleClick(onOpenOptions)}
                    className="p-2 bg-slate-850/60 hover:bg-slate-700 rounded-full border border-slate-700 hover:border-indigo-500 transition-all text-slate-400 hover:text-white cursor-pointer"
                    title="Game Options"
                >
                    <Settings size={14} className="md:w-[16px] md:h-[16px]" />
                </button>
            </div>

            <div className="flex flex-col items-center space-y-6 md:space-y-12 animate-in fade-in zoom-in duration-700 w-full max-w-6xl mx-auto px-4 md:px-6 py-8">

            {/* Title Section */}
            <div className="text-center space-y-4 pt-20 md:pt-8 shrink-0">
                <div className="flex items-center justify-center gap-4 opacity-60">
                        <div className="h-px w-16 md:w-32 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                        <span className="text-indigo-400 text-xs md:text-sm font-bold tracking-[0.4em] uppercase font-title text-shadow-sm">Tactical Card Warfare</span>
                        <div className="h-px w-16 md:w-32 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                </div>
                <h1 className="text-6xl md:text-9xl font-black font-title tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-100 via-slate-300 to-slate-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                    BATTLE
                </h1>
            </div>
            
            {menuStep === 'MODE' && (
                <ModeMenu
                    setMenuStep={setMenuStep}
                    handleModeSelect={handleModeSelect}
                    handleStartGameClick={handleStartGameClick}
                    setSelectedSubMode={setSelectedSubMode}
                    setCampaignState={setCampaignState}
                    setRulesFormatSelect={setRulesFormatSelect}
                />
            )}

            {menuStep === 'GAME_SETUP' && (
                <GameSetupMenu
                    selectedSubMode={selectedSubMode}
                    rulesFormatSelect={rulesFormatSelect}
                    setRulesFormatSelect={setRulesFormatSelect}
                    cpuDifficulty={cpuDifficulty}
                    setCpuDifficulty={setCpuDifficulty}
                    cpu2Difficulty={cpu2Difficulty}
                    setCpu2Difficulty={setCpu2Difficulty}
                    setMenuStep={setMenuStep}
                    handleModeSelect={handleModeSelect}
                    handleStartGameClick={handleStartGameClick}
                    handleSpectateClick={handleSpectateClick}
                />
            )}

            {menuStep === 'CAMPAIGN_MAP' && campaignState && (
                <CampaignMenu
                    campaignState={campaignState}
                    setMenuStep={setMenuStep}
                    handleModeSelect={handleModeSelect}
                    handleStartGameClick={handleStartGameClick}
                    handleSwitchRulesFormat={handleSwitchRulesFormat}
                />
            )}

            {menuStep === 'SHOP' && (
                <ShopMenu
                    progression={progression}
                    setProgression={setProgression}
                    setMenuStep={setMenuStep}
                    handleModeSelect={handleModeSelect}
                    handleStartGameClick={handleStartGameClick}
                />
            )}

            {menuStep === 'CUSTOMIZE' && (
                <CustomizeMenu 
                    progression={progression}
                    setProgression={setProgression}
                    setMenuStep={setMenuStep}
                    handleModeSelect={handleModeSelect}
                    handleStartGameClick={handleStartGameClick}
                />
            )}

            {menuStep === 'TUTORIAL_MENU' && (
                <TutorialMenu
                    setMenuStep={setMenuStep}
                    startLesson={startLesson}
                />
            )}

            {menuStep === 'MULTIPLAYER_SETUP' && (
                <MultiplayerSetupMenu
                    setMenuStep={setMenuStep}
                    selectedMode={selectedMode}
                    multiplayer={multiplayer}
                    targetPeerId={targetPeerId}
                    setTargetPeerId={setTargetPeerId}
                />
            )}
            </div>

            {/* PLAYER PROGRESSION & LOGINS / QUESTS HQ MODAL */}
            {showHQModal && (
                <PlayerHQModal 
                    progression={progression} 
                    setProgression={setProgression} 
                    onClose={() => setShowHQModal(false)}
                />
            )}
        </div>
    );
};
