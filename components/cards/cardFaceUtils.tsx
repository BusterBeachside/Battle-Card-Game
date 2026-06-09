export function getCardFaceThemeClasses(activeCardFace: string, isSelected: boolean, isRed: boolean) {
  let borderClass = isSelected ? '' : 'border border-slate-300';
  let cardFaceBgClass = 'bg-white';
  let fontClass = 'font-title font-bold';
  let centerArtOpacity = 'opacity-20';
  let textThemeColor = isRed ? 'text-red-600' : 'text-slate-950';
  let badgeThemeClass = 'bg-black text-white';
  let textFilterClass = '';
  // Define highly distinct spectrum indicator variables
  let spectrumAccentClass = isRed 
    ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)] border-b border-red-400' 
    : 'bg-slate-700 shadow-[0_0_6px_rgba(100,116,139,0.5)] border-b border-slate-500';

  switch (activeCardFace) {
    case 'casino_style':
      borderClass = isSelected ? '' : 'border border-amber-500/60 shadow-md';
      cardFaceBgClass = 'bg-stone-50';
      fontClass = 'font-serif font-black text-sm tracking-tighter';
      textThemeColor = isRed ? 'text-red-700 font-extrabold' : 'text-stone-900 font-extrabold';
      badgeThemeClass = 'bg-rose-900 text-rose-100 border border-rose-700 font-sans text-[7px] uppercase tracking-wider rounded-sm px-1';
      spectrumAccentClass = isRed ? 'bg-red-700' : 'bg-stone-850';
      break;
    case 'retro_pixels':
      borderClass = isSelected ? '' : 'border-4 border-[#0f380f]';
      cardFaceBgClass = 'bg-[#8bac0f] relative overflow-hidden';
      fontClass = 'font-mono uppercase font-black tracking-tighter text-xs';
      textThemeColor = isRed ? 'text-red-800 [text-shadow:1px_1px_0px_rgba(255,255,255,0.4)]' : 'text-[#0f380f] [text-shadow:1px_1px_0px_rgba(0,0,0,0.15)]';
      badgeThemeClass = 'bg-[#0f380f] text-[#8bac0f] text-[7px] font-mono border-2 border-[#0f380f] rounded-none';
      spectrumAccentClass = isRed ? 'bg-red-600' : 'bg-[#0f380f]';
      break;
    case 'gothic_scroll':
      borderClass = isSelected ? '' : 'border border-amber-300';
      cardFaceBgClass = 'bg-amber-50';
      fontClass = 'font-serif italic font-extrabold';
      textThemeColor = isRed ? 'text-red-800 font-bold' : 'text-stone-950 font-bold';
      badgeThemeClass = 'bg-amber-800 text-amber-50 font-serif italic text-[8px]';
      spectrumAccentClass = isRed ? 'bg-red-800' : 'bg-stone-900';
      break;
    case 'japanese_calligraphy':
      borderClass = isSelected ? '' : 'border border-[#cbba9e] shadow-[0_4px_10px_rgba(40,30,10,0.1)]';
      cardFaceBgClass = 'bg-[#fcfaf2] relative';
      fontClass = 'font-serif font-black text-sm tracking-tighter';
      textThemeColor = isRed ? 'text-[#950000]' : 'text-[#1a1c20]';
      textFilterClass = '';
      badgeThemeClass = 'bg-[#990000] text-white border border-[#990000] font-serif font-bold rounded-none px-1.5 py-0.5 text-[7px] shadow-sm uppercase tracking-wider';
      centerArtOpacity = 'opacity-[0.45]';
      spectrumAccentClass = isRed ? 'bg-[#990000]' : 'bg-stone-900';
      break;
    case 'neon_matrix':
      borderClass = isSelected ? '' : 'border border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.35)]';
      cardFaceBgClass = 'bg-slate-950 relative';
      fontClass = 'font-mono text-xs font-black tracking-widest';
      textThemeColor = isRed ? 'text-rose-500 font-black drop-shadow-[0_0_5px_#f43f5e]' : 'text-emerald-400 font-extrabold drop-shadow-[0_0_5px_#10b981]';
      badgeThemeClass = 'bg-emerald-950/90 text-emerald-300 text-[8px] font-mono border border-emerald-500/40 rounded';
      spectrumAccentClass = isRed ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-emerald-400 shadow-[0_0_8px_#10b981]';
      break;
    case 'futuristic_tech':
      borderClass = isSelected ? '' : 'border border-slate-700';
      cardFaceBgClass = 'bg-slate-950';
      fontClass = 'font-mono uppercase text-xs tracking-widest';
      centerArtOpacity = 'opacity-[0.14]';
      textThemeColor = isRed ? 'text-rose-500 font-extrabold drop-shadow-[0_0_4px_#f43f5e]' : 'text-cyan-400 font-extrabold drop-shadow-[0_0_4px_#22d3ee]';
      badgeThemeClass = 'bg-slate-800 text-slate-100 text-[8px] border border-slate-600 font-mono scale-90';
      spectrumAccentClass = isRed ? 'bg-rose-600' : 'bg-cyan-500';
      break;
    case 'crimson_fire':
      borderClass = isSelected ? '' : 'border border-orange-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
      cardFaceBgClass = 'bg-gradient-to-br from-rose-950 via-red-950 to-slate-950';
      fontClass = 'font-sans font-black tracking-tighter italic';
      textThemeColor = isRed ? 'text-amber-400 font-black drop-shadow-[0_0_5px_#f59e0b]' : 'text-stone-300 font-black drop-shadow-[0_0_4px_rgba(255,255,255,0.25)]';
      badgeThemeClass = 'bg-rose-900 border border-orange-500 text-orange-200 text-[8px] rounded';
      spectrumAccentClass = isRed ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-stone-500 shadow-[0_0_6px_rgba(255,255,255,0.25)]';
      break;
    case 'cosmic_void':
      borderClass = isSelected ? '' : 'border border-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]';
      cardFaceBgClass = 'bg-slate-950 relative';
      fontClass = 'font-serif tracking-widest font-bold';
      textThemeColor = isRed ? 'text-fuchsia-400 font-bold drop-shadow-[0_0_4px_#e879f9]' : 'text-cyan-400 font-bold drop-shadow-[0_0_4px_#22d3ee]';
      badgeThemeClass = 'bg-purple-950 border border-purple-500/50 text-purple-200 text-[8px] rounded';
      spectrumAccentClass = isRed ? 'bg-fuchsia-400 shadow-[0_0_6px_#e879f9]' : 'bg-violet-400 shadow-[0_0_6px_#a78bfa]';
      break;
    case 'minimalist_charcoal':
      borderClass = isSelected ? '' : 'border border-[#292524] shadow-md';
      cardFaceBgClass = 'bg-[#1c1917]';
      fontClass = 'font-sans font-extralight tracking-widest text-xs';
      centerArtOpacity = 'opacity-[0.10]';
      textThemeColor = isRed ? 'text-red-400 font-normal font-sans' : 'text-stone-200 font-extralight font-sans';
      badgeThemeClass = 'bg-[#292524] text-stone-200 text-[8px] font-normal font-sans tracking-wide px-1.5 py-0.5 rounded-none border border-stone-800';
      spectrumAccentClass = isRed ? 'bg-red-500/50' : 'bg-stone-500/30';
      break;
    case 'glitch':
      borderClass = isSelected ? '' : 'border border-fuchsia-500/70 shadow-[0_0_12px_rgba(217,70,239,0.3)]';
      cardFaceBgClass = 'bg-transparent overflow-hidden';
      fontClass = 'font-mono uppercase font-black tracking-widest';
      textThemeColor = isRed ? 'text-fuchsia-400 font-extrabold drop-shadow-[0_0_4px_#d946ef]' : 'text-cyan-400 font-extrabold drop-shadow-[0_0_4px_#06b6d4]';
      badgeThemeClass = 'bg-indigo-950 text-[#00f0ff] text-[7.5px] font-mono border border-cyan-500/40 rounded';
      spectrumAccentClass = isRed ? 'bg-fuchsia-500 shadow-[0_0_8px_#d946ef] animate-[glitch-flicker_0.15s_infinite]' : 'bg-cyan-500 shadow-[0_0_8px_#06b6d4] animate-[glitch-flicker_0.15s_infinite]';
      break;
    case 'royal_gold':
      borderClass = isSelected ? '' : 'border-2 border-amber-300';
      cardFaceBgClass = 'bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-700 shadow-[inset_0_0_12px_rgba(251,191,36,0.8),_0_0_15px_rgba(245,158,11,0.2)]';
      fontClass = 'font-title font-black uppercase tracking-tight';
      textThemeColor = isRed ? 'text-[#7f1d1d] drop-shadow-[0_1px_0px_rgba(255,255,255,0.35)]' : 'text-indigo-950 drop-shadow-[0_1px_0px_rgba(255,255,255,0.35)]';
      badgeThemeClass = 'bg-amber-950 text-yellow-300 text-[8px] font-bold border border-amber-300 rounded';
      spectrumAccentClass = isRed ? 'bg-[#7e1d1d] border-b border-amber-300' : 'bg-indigo-950 border-b border-amber-300';
      break;
    case 'beach_breeze':
      borderClass = isSelected ? '' : 'border border-amber-400 shadow-md';
      cardFaceBgClass = 'bg-[#fcefbf] relative overflow-hidden';
      fontClass = 'font-title font-black text-sm tracking-tight';
      centerArtOpacity = 'opacity-[0.25]';
      textThemeColor = isRed 
        ? 'text-rose-600 font-extrabold [text-shadow:0_1.5px_2px_rgba(255,255,255,0.7)]' 
        : 'text-sky-900 font-extrabold [text-shadow:0_1.5px_2px_rgba(255,255,255,0.7)]';
      badgeThemeClass = 'bg-sky-600 border border-sky-450 text-sky-50 text-[8px] font-sans font-bold rounded px-1 py-0.5 uppercase tracking-wide';
      spectrumAccentClass = isRed ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-sky-500 shadow-[0_0_6px_#0ea5e9]';
      break;
    case 'classic':
    default:
      borderClass = isSelected ? '' : 'border border-slate-300';
      cardFaceBgClass = 'bg-white';
      fontClass = 'font-title font-bold';
      centerArtOpacity = 'opacity-20';
      textThemeColor = isRed ? 'text-red-600' : 'text-slate-900';
      badgeThemeClass = 'bg-black text-white';
      spectrumAccentClass = isRed ? 'bg-red-600' : 'bg-slate-900';
      break;
  }

  return { borderClass, cardFaceBgClass, fontClass, centerArtOpacity, textThemeColor, badgeThemeClass, textFilterClass, spectrumAccentClass };
}
