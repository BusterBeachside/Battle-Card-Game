
import React from 'react';
import { Card, Suit, Color, Rank } from '../types';

interface CardDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  card: Card;
  domId?: string;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void; // Added Touch Handler
  isSelected?: boolean;
  isTapped?: boolean;
  isSummoningSick?: boolean; // New Prop
  isPlayable?: boolean;
  isTargetable?: boolean;
  isAttacking?: boolean;
  isLunging?: boolean;
  isDragging?: boolean;
  isBlocking?: boolean;
  attachedCards?: Card[];
  damageTaken?: number;
  size?: 'sm' | 'md' | 'lg';
  showBack?: boolean;
  orientation?: 'top' | 'bottom';
  cardBack?: string;
  cardFace?: string;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({
  card,
  domId,
  onClick,
  onMouseDown,
  onTouchStart,
  isSelected,
  isTapped,
  isSummoningSick,
  isPlayable,
  isTargetable,
  isAttacking,
  isLunging,
  isDragging,
  isBlocking,
  attachedCards,
  damageTaken,
  size = 'md',
  showBack = false,
  orientation = 'bottom',
  cardBack,
  cardFace,
  ...rest
}) => {
  // Determine effective color based on attached Queen
  const attachedQueen = attachedCards?.find(c => c.rank === Rank.Queen);
  const effectiveColor = attachedQueen ? attachedQueen.baseColor : card.baseColor;
  const isRed = effectiveColor === Color.Red;

  // Resolve user cosmetic selections from localStorage
  const progression = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('battle_card_progression_v1');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {}
    return null;
  }, []);

  // Check for session storage cosmetic preview overrides
  const previewBackOverride = React.useMemo(() => {
    try {
      if (sessionStorage.getItem('battle_is_preview_game') === 'true') {
        return sessionStorage.getItem('battle_preview_back') || undefined;
      }
    } catch (e) {}
    return undefined;
  }, []);

  const previewFaceOverride = React.useMemo(() => {
    try {
      if (sessionStorage.getItem('battle_is_preview_game') === 'true') {
        return sessionStorage.getItem('battle_preview_face') || undefined;
      }
    } catch (e) {}
    return undefined;
  }, []);

  const activeCardBack = cardBack || previewBackOverride || progression?.selectedCardBack || 'battle';
  const activeCardFace = cardFace || previewFaceOverride || progression?.selectedCardFace || 'classic';

  // Size classes
  const dimensions = {
    sm: 'w-12 h-16 text-xs rounded-sm',
    md: 'w-20 h-28 text-sm rounded',
    lg: 'w-32 h-44 text-lg rounded-md',
  };

  // Lunging animation logic
  const lungeClass = isLunging
    ? (orientation === 'bottom' ? '-translate-y-24 scale-125 z-50 shadow-2xl ring-4 ring-red-600' : 'translate-y-24 scale-125 z-50 shadow-2xl ring-4 ring-red-600')
    : '';

  // Tooltip Logic
  const showCostTooltip = [Rank.Ace, Rank.Jack, Rank.Queen, Rank.King].includes(card.rank);
  const cost = card.rank === Rank.Ace ? 1 : card.rank === Rank.Jack ? 2 : card.rank === Rank.Queen ? 3 : 4;

  if (showBack) {
    let backThemeClass = '';
    let backContent = null;

    switch (activeCardBack) {
      case 'casino_style':
        backThemeClass = 'bg-rose-800 border border-zinc-200 shadow-md text-zinc-100';
        backContent = (
          <div className="absolute inset-1 border border-zinc-200/40 rounded flex flex-col items-center justify-center p-1 overflow-hidden">
            {/* Fine lattice/scrollwork style representing a classic casino back */}
            <div className="absolute inset-0.5 border border-dashed border-zinc-200/20"></div>
            <div className="w-8 h-8 rounded-full border border-zinc-200/20 flex items-center justify-center relative bg-rose-950/10">
              <span className="text-sm select-none opacity-50">❦</span>
            </div>
            <span className="text-[5px] font-sans text-rose-200/50 uppercase tracking-[0.2em] mt-2 select-none whitespace-nowrap">CASINO STYLE</span>
          </div>
        );
        break;
      case 'retro_pixels':
        backThemeClass = 'bg-stone-800 border bg-stone-900 border-stone-700 text-stone-200';
        backContent = (
          <div className="absolute inset-1 border-2 border-dashed border-stone-700 flex flex-col items-center justify-center p-1 font-mono">
            {/* Pixel Grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.25)_1px,transparent_1px)] bg-[size:4px_4px] opacity-40"></div>
            <span className="text-base leading-none select-none drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">👾</span>
            <span className="text-[5px] text-stone-400 mt-2 font-black uppercase tracking-wider font-mono whitespace-nowrap">RETRO_SYS</span>
          </div>
        );
        break;
      case 'gothic_scroll':
        backThemeClass = 'bg-gradient-to-br from-amber-950 to-stone-950 border border-amber-800/60 text-amber-500/80 shadow-[0_0_12px_rgba(217,119,6,0.15)]';
        backContent = (
          <div className="absolute inset-1.5 border border-amber-900/30 rounded flex flex-col items-center justify-center">
            <span className="text-lg leading-none select-none opacity-70">🕇</span>
            <span className="text-[5px] uppercase tracking-[0.25em] font-serif font-extrabold text-amber-500/60 mt-2 whitespace-nowrap">GOTHICA</span>
          </div>
        );
        break;
      case 'futuristic_tech':
        backThemeClass = 'bg-slate-950 border border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)]';
        backContent = (
          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:8px_8px]"></div>
            {/* Circuit node connection */}
            <div className="w-5 h-5 rounded-full border border-cyan-500/40 flex items-center justify-center relative animate-pulse">
              <span className="text-[10px]">⚡</span>
              <div className="absolute -top-[1.5px] -left-[1.5px] w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
              <div className="absolute -bottom-[1.5px] -right-[1.5px] w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
            </div>
            <span className="text-[5px] text-cyan-500/60 mt-1.5 uppercase tracking-widest font-mono whitespace-nowrap">SYS_BACK_PT</span>
          </div>
        );
        break;
      case 'japanese_calligraphy':
        backThemeClass = 'bg-[#fcfaf2] border border-[#d5c3aa] text-[#1a1a1a] shadow-md';
        backContent = (
          <div className="absolute inset-1 border border-[#e8dfcf] rounded flex flex-col items-center justify-center p-1 overflow-hidden">
            {/* Zen Enso Circle brushed look */}
            <div className="w-10 h-10 rounded-full border-2 border-stone-800 border-t-transparent border-r-stone-700 relative flex items-center justify-center">
              {/* Inner red seal stamp */}
              <div className="absolute w-2 h-2 bg-[#990000] rotate-12 flex items-center justify-center">
                <span className="text-[4px] text-white select-none font-serif font-black">印</span>
              </div>
            </div>
            <span className="text-[5px] font-serif text-[#7e7465] uppercase tracking-[0.3em] mt-2.5 select-none font-bold whitespace-nowrap">侘寂 WASHI</span>
          </div>
        );
        break;
      case 'minimalist_charcoal':
        backThemeClass = 'bg-stone-900 border border-stone-700 text-stone-100 shadow-lg';
        backContent = (
          <div className="absolute inset-2 border border-stone-800 flex flex-col items-center justify-center p-1 font-sans">
            <div className="w-5 h-5 border border-stone-750 rotate-45 flex items-center justify-center p-0.5 opacity-60">
              <div className="w-full h-full border border-dashed border-stone-600 rotate-45"></div>
            </div>
            <span className="text-[5px] tracking-[0.25em] uppercase font-light text-stone-400 mt-2.5">MINIMA</span>
          </div>
        );
        break;
      case 'glitch':
        backThemeClass = 'bg-black border border-fuchsia-600 shadow-[0_0_15px_rgba(217,70,239,0.35)] text-cyan-400 font-mono overflow-hidden';
        backContent = (
          <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden font-mono select-none">
            {/* Animated scanlines and jitter panels */}
            <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-fuchsia-500 opacity-70 animate-[glitch_line_1.8s_infinite]"></div>
            <div className="absolute top-2/3 left-0 right-0 h-0.5 bg-cyan-500 opacity-70 animate-[glitch_line_1.2s_infinite_reverse]"></div>
            <div className="absolute inset-0 bg-fuchsia-500/5 mix-blend-color-dodge animate-[glitch_flicker_0.2s_infinite]"></div>
            {/* Hologram visual elements */}
            <div className="relative font-mono font-black tracking-widest text-[#f43f5e] uppercase animate-[glitch_text_0.7s_infinite] text-[10px]">
              <span className="absolute -left-[1.5px] text-cyan-400 mix-blend-screen">E_R_R</span>
              E_R_R
            </div>
            <div className="text-[5px] text-fuchsia-400 uppercase tracking-widest mt-1 opacity-80">[ DATA CONFLICT ]</div>
          </div>
        );
        break;
      case 'royal_gold':
        backThemeClass = 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-800 border-2 border-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.3)] text-yellow-105';
        backContent = (
          <div className="absolute inset-1 border border-amber-300/30 rounded flex flex-col items-center justify-center p-1">
            <div className="w-5 h-5 rounded-full bg-amber-300/20 border border-amber-400 flex items-center justify-center animate-pulse">
              <span className="text-[10px] leading-none mb-0.5">👑</span>
            </div>
            <span className="text-[5px] font-[900] tracking-widest text-amber-200 mt-1.5 font-mono whitespace-nowrap">ROYAL GOLD</span>
          </div>
        );
        break;
      case 'neon_matrix':
        backThemeClass = 'bg-slate-950 border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] text-emerald-400';
        backContent = (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 font-mono">
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(16,185,129,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.3)_1px,transparent_1px)] bg-[size:6px_6px]"></div>
            <div className="text-[8px] font-bold tracking-tighter text-emerald-400 z-10 select-none">NEO</div>
            <div className="text-[6px] text-emerald-500/80 mt-0.5 tracking-widest z-10">[ 0 1 ]</div>
          </div>
        );
        break;
      case 'crimson_fire':
        backThemeClass = 'bg-gradient-to-br from-red-700 via-rose-900 to-red-950 border-2 border-orange-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] text-rose-200';
        backContent = (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
            <span className={`animate-pulse ${
              size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
            }`}>🔥</span>
            <span className="text-[7px] font-black tracking-widest text-orange-400 uppercase font-mono mt-0.5 whitespace-nowrap">IGNITE</span>
          </div>
        );
        break;
      case 'cosmic_void':
        backThemeClass = 'bg-slate-950 border-2 border-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.3)] text-violet-300';
        backContent = (
          <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute w-16 h-16 bg-indigo-500/10 rounded-full blur-md -top-4 -left-4"></div>
            <div className="absolute w-16 h-16 bg-purple-500/10 rounded-full blur-md -bottom-4 -right-4"></div>
            <div className="absolute w-10 h-10 border border-violet-500/20 rounded-full animate-spin duration-10000"></div>
            <span className="text-xs z-10">✨</span>
            <span className="text-[7px] font-mono font-bold text-violet-400 uppercase tracking-widest mt-0.5 z-10 whitespace-nowrap">COSMO</span>
          </div>
        );
        break;
      case 'battle':
      default:
        backThemeClass = 'bg-indigo-900 border-2 border-slate-200 shadow-md text-indigo-300';
        backContent = (
          <>
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-700 to-indigo-950 opacity-80"></div>
            <div className={`absolute text-indigo-300 font-title font-bold opacity-30 select-none whitespace-nowrap ${
              size === 'sm'
                ? 'text-[7px] tracking-wide'
                : size === 'md'
                ? 'text-[10px] tracking-widest'
                : 'text-sm tracking-widest'
            }`}>BATTLE</div>
          </>
        );
        break;
    }

    return (
      <div
        id={domId}
        className={`${dimensions[size]} ${backThemeClass} relative overflow-hidden flex items-center justify-center`}
        {...rest}
      >
        {backContent}
      </div>
    );
  }

  // Card Face thematic overrides
  let borderClass = isSelected ? '' : 'border border-slate-300';
  let cardFaceBgClass = 'bg-white';
  let fontClass = 'font-title font-bold';
  let centerArtOpacity = 'opacity-20';
  let textThemeColor = isRed ? 'text-red-600' : 'text-slate-950';
  let badgeThemeClass = 'bg-black text-white';

  switch (activeCardFace) {
    case 'casino_style':
      borderClass = isSelected ? '' : 'border border-amber-500/60 shadow-md';
      cardFaceBgClass = 'bg-stone-50';
      fontClass = 'font-serif font-black text-sm tracking-tighter';
      textThemeColor = isRed ? 'text-red-700' : 'text-slate-900';
      badgeThemeClass = 'bg-rose-900 text-rose-100 border border-rose-700 font-sans text-[7px] uppercase tracking-wider rounded-sm px-1';
      break;
    case 'retro_pixels':
      borderClass = isSelected ? '' : 'border-4 border-[#0f380f]';
      cardFaceBgClass = 'bg-[#8bac0f] relative overflow-hidden';
      fontClass = 'font-mono uppercase font-black tracking-tighter text-xs [text-shadow:1px_1px_0px_#8bac0f]';
      textThemeColor = isRed ? 'text-[#306230]' : 'text-[#0f380f]';
      badgeThemeClass = 'bg-[#0f380f] text-[#8bac0f] text-[7px] font-mono border-2 border-[#0f380f] rounded-none';
      break;
    case 'gothic_scroll':
      borderClass = isSelected ? '' : 'border border-amber-300';
      cardFaceBgClass = 'bg-amber-50';
      fontClass = 'font-serif italic font-extrabold';
      textThemeColor = isRed ? 'text-red-800 font-bold' : 'text-stone-900 font-bold';
      badgeThemeClass = 'bg-amber-800 text-amber-50 font-serif italic text-[8px]';
      break;
    case 'japanese_calligraphy':
      borderClass = isSelected ? '' : 'border border-[#cbba9e] shadow-[0_4px_10px_rgba(40,30,10,0.1)]';
      cardFaceBgClass = 'bg-[#fcfaf2] relative';
      fontClass = 'font-serif font-extrabold text-sm tracking-tight';
      textThemeColor = isRed ? 'text-rose-800' : 'text-stone-900';
      badgeThemeClass = 'bg-[#990000] text-white border border-[#990000] font-serif font-bold rounded-none px-1.5 py-0.5 text-[7px] shadow-sm uppercase tracking-wider';
      centerArtOpacity = 'opacity-35';
      break;
    case 'neon_matrix':
      borderClass = isSelected ? '' : 'border border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.35)]';
      cardFaceBgClass = 'bg-slate-950 relative';
      fontClass = 'font-mono text-xs font-black tracking-widest';
      textThemeColor = isRed ? 'text-emerald-400 font-black' : 'text-emerald-300 font-extrabold';
      badgeThemeClass = 'bg-emerald-950/90 text-emerald-300 text-[8px] font-mono border border-emerald-500/40 rounded';
      break;
    case 'futuristic_tech':
      borderClass = isSelected ? '' : 'border border-slate-700';
      cardFaceBgClass = 'bg-slate-950';
      fontClass = 'font-mono uppercase text-xs tracking-widest';
      centerArtOpacity = 'opacity-[0.14]';
      textThemeColor = isRed ? 'text-rose-450 font-extrabold' : 'text-cyan-400 font-extrabold';
      badgeThemeClass = 'bg-slate-800 text-slate-100 text-[8px] border border-slate-600 font-mono scale-90';
      break;
    case 'crimson_fire':
      borderClass = isSelected ? '' : 'border border-orange-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
      cardFaceBgClass = 'bg-gradient-to-br from-rose-950 via-red-950 to-slate-950';
      fontClass = 'font-sans font-black tracking-tighter italic';
      textThemeColor = isRed ? 'text-rose-450 font-black' : 'text-orange-400 font-black';
      badgeThemeClass = 'bg-rose-900 border border-orange-500 text-orange-200 text-[8px] rounded';
      break;
    case 'cosmic_void':
      borderClass = isSelected ? '' : 'border border-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]';
      cardFaceBgClass = 'bg-slate-950 relative';
      fontClass = 'font-serif tracking-widest font-bold';
      textThemeColor = isRed ? 'text-pink-400 font-bold' : 'text-violet-300 font-bold';
      badgeThemeClass = 'bg-purple-950 border border-purple-500/50 text-purple-200 text-[8px] rounded';
      break;
    case 'minimalist_charcoal':
      borderClass = isSelected ? '' : 'border border-[#292524] shadow-md';
      cardFaceBgClass = 'bg-[#1c1917]';
      fontClass = 'font-sans font-extralight tracking-widest text-xs';
      centerArtOpacity = 'opacity-[0.10]';
      textThemeColor = isRed ? 'text-red-400 font-normal font-sans' : 'text-stone-300 font-extralight font-sans';
      badgeThemeClass = 'bg-[#292524] text-stone-200 text-[8px] font-normal font-sans tracking-wide px-1.5 py-0.5 rounded-none border border-stone-800';
      break;
    case 'glitch':
      borderClass = isSelected ? '' : 'border border-fuchsia-500/70 shadow-[0_0_12px_rgba(217,70,239,0.3)]';
      cardFaceBgClass = 'bg-transparent overflow-hidden';
      fontClass = 'font-mono uppercase font-black tracking-widest';
      textThemeColor = isRed ? 'text-fuchsia-400 font-extrabold' : 'text-cyan-400 font-extrabold';
      badgeThemeClass = 'bg-indigo-950 text-[#00f0ff] text-[7.5px] font-mono border border-cyan-500/40 rounded';
      break;
    case 'royal_gold':
      borderClass = isSelected ? '' : 'border-2 border-amber-300';
      cardFaceBgClass = 'bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-700 shadow-[inset_0_0_12px_rgba(251,191,36,0.8),_0_0_15px_rgba(245,158,11,0.2)]';
      fontClass = 'font-title font-black uppercase tracking-tight';
      textThemeColor = isRed ? 'text-red-900 drop-shadow-[0_1px_1px_rgba(251,191,36,0.5)]' : 'text-slate-950 drop-shadow-[0_1px_1px_rgba(251,191,36,0.5)]';
      badgeThemeClass = 'bg-amber-950 text-yellow-300 text-[8px] font-bold border border-amber-300 rounded';
      break;
    case 'classic':
    default:
      borderClass = isSelected ? '' : 'border border-slate-300';
      cardFaceBgClass = 'bg-white';
      fontClass = 'font-title font-bold';
      centerArtOpacity = 'opacity-20';
      textThemeColor = isRed ? 'text-red-600' : 'text-slate-950';
      badgeThemeClass = 'bg-black text-white';
      break;
  }

  return (
    <div className="relative group">
      {/* Attached Cards (Queens) - Rendered BEHIND the main card wrapper */}
      {attachedCards && attachedCards.length > 0 && (
          <div className="absolute inset-0 pointer-events-none z-0">
              {attachedCards.map((ac, idx) => {
                  const isQueenRed = ac.baseColor === Color.Red;
                  return (
                    <div 
                        key={ac.id} 
                        className={`absolute -top-3 left-1/2 -translate-x-1/2 w-[90%] h-8 rounded-t-lg border-x border-t shadow-sm flex items-start justify-center pt-0.5
                            ${isQueenRed ? 'bg-red-100 border-red-300' : 'bg-slate-200 border-slate-400'}
                        `}
                        style={{ transform: `translateX(-50%) translateY(${idx * -4}px) scale(0.95)` }}
                    >
                        <span className={`text-[0.6rem] font-bold ${isQueenRed ? 'text-red-700' : 'text-slate-800'}`}>
                            {ac.rank}{ac.suit}
                        </span>
                    </div>
                  );
              })}
          </div>
      )}

      {/* Main Card */}
      <div
        id={domId}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className={`
          ${dimensions[size]} 
          relative z-10
          ${cardFaceBgClass} shadow-md select-none transition-all duration-300 ease-out
          flex flex-col justify-between p-1
          ${textThemeColor}
          ${isSelected ? 'ring-4 ring-yellow-400 -translate-y-2 z-20' : borderClass}
          ${isPlayable ? 'ring-2 ring-green-400 cursor-grab active:cursor-grabbing hover:-translate-y-1' : ''}
          ${isTargetable ? 'ring-4 ring-red-500 cursor-crosshair animate-pulse' : ''}
          ${isTapped ? 'rotate-90 opacity-70' : ''}
          ${isAttacking && !isLunging ? 'ring-4 ring-red-600 -translate-y-6 shadow-xl z-20' : ''} 
          ${isBlocking ? 'ring-4 ring-blue-500 -translate-y-4 shadow-lg' : ''}
          ${isDragging ? 'opacity-50 grayscale' : ''}
          ${lungeClass}
          ${onClick || onMouseDown || onTouchStart ? 'cursor-pointer' : ''}
          ${onMouseDown || onTouchStart ? 'touch-none' : ''} 
        `}
        {...rest}
      >
        {/* Dynamic Background Layer for Face */}
        {activeCardFace === 'glitch' && (
          <div className="absolute inset-0 z-0 bg-black overflow-hidden pointer-events-none">
            <div className="absolute inset-0 opacity-45 bg-[linear-gradient(rgba(147,51,234,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.15)_1px,transparent_1px)] bg-[size:5px_5px]"></div>
            <div className="absolute top-1/2 left-0 right-0 h-8 bg-cyan-400/20 mix-blend-color-dodge blur-[2px] animate-[glitch_blur_1.2s_infinite]"></div>
            <div className="absolute top-1/4 left-0 right-0 h-4 bg-fuchsia-400/10 mix-blend-screen -rotate-3 animate-[glitch_blur_20s_infinite_reverse]"></div>
            <div className="absolute inset-0 border border-fuchsia-400/20 mix-blend-screen animate-[glitch_flicker_0.15s_infinite]"></div>
          </div>
        )}
        {activeCardFace === 'neon_matrix' && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-slate-950">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.12)_1px,transparent_1px)] bg-[size:6px_6px]"></div>
            <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent animate-pulse duration-1000"></div>
          </div>
        )}
        {activeCardFace === 'cosmic_void' && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-slate-950">
            <div className="absolute w-20 h-20 bg-indigo-500/15 rounded-full blur-xl -top-6 -left-6"></div>
            <div className="absolute w-20 h-20 bg-purple-500/15 rounded-full blur-xl -bottom-6 -right-6 animate-pulse"></div>
          </div>
        )}
        {activeCardFace === 'retro_pixels' && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#8bac0f] rounded">
            <div className="absolute inset-0 opacity-25 bg-[linear-gradient(rgba(15,56,15,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(15,56,15,0.25)_1px,transparent_1px)] bg-[size:3px_3px]"></div>
            <div className="absolute inset-1 border border-[#0f380f]/35"></div>
          </div>
        )}
        {activeCardFace === 'minimalist_charcoal' && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#1c1917] rounded">
            <div className="absolute inset-1.5 border border-[#292524] opacity-80"></div>
          </div>
        )}

        {/* Summoning Sickness Indicator */}
        {isSummoningSick && !isTapped && (
            <div className="absolute top-1 right-1 z-35 animate-pulse">
                <div className={`font-bold rounded-full px-1 text-[0.6rem] border shadow-sm leading-none pb-0.5 ${activeCardFace === 'futuristic_tech' ? 'bg-slate-900 border-slate-700 text-cyan-400' : 'bg-white/90 border-slate-350 text-slate-400'}`}>
                    zZ
                </div>
            </div>
        )}

        {/* Top Corner (Self Start) */}
        <div className="flex flex-col items-center leading-none z-10 self-start">
          <span className={`${fontClass}`}>{card.rank}</span>
          <span className="text-[0.8em]">{card.suit}</span>
        </div>

        {/* Center Art */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${centerArtOpacity} z-0`}>
          <span className="text-4xl">{card.suit}</span>
        </div>
        
        {/* Bottom Corner (Self End) */}
        <div className="flex flex-col items-center leading-none rotate-180 z-10 self-end">
          <span className={`${fontClass}`}>{card.rank}</span>
          <span className="text-[0.8em]">{card.suit}</span>
        </div>

        {/* Special Badges */}
        {card.rank === 'A' && (
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-1 rounded uppercase tracking-tighter text-[0.55rem] font-bold z-10 ${badgeThemeClass}`}>
            Wild
          </div>
        )}
        {['J', 'Q', 'K'].includes(card.rank) && (
          <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 text-[0.5rem] uppercase font-bold tracking-widest px-1 rounded shadow-sm opacity-90 z-10 ${badgeThemeClass === 'bg-black text-white' ? 'bg-slate-100 text-slate-800' : badgeThemeClass}`}>
            {card.rank === 'J' ? 'Draw 2' : card.rank === 'Q' ? 'Shift' : 'Kill'}
          </div>
        )}

        {/* Damage Popup */}
        {damageTaken !== undefined && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] pointer-events-none animate-bounce scale-150">
              <div className="text-4xl font-black text-white stroke-black drop-shadow-[0_4px_4px_rgba(0,0,0,1)]" style={{ WebkitTextStroke: '1px black' }}>
                  -{damageTaken}
              </div>
          </div>
        )}
      </div>

      {/* Cost Tooltip on Hover */}
      {showCostTooltip && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-[100] animate-in fade-in zoom-in duration-200 pointer-events-none">
              <div className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap border border-slate-700">
                  Cost: {cost}
              </div>
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-900"></div>
          </div>
      )}
    </div>
  );
};
