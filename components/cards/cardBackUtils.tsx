import React from 'react';

const GOLD_SPARKLES_BACK = [
  { size: 'w-1 h-1', delay: '0s', pos: 'top-2 left-2' },
  { size: 'w-1.5 h-1.5', delay: '1s', pos: 'bottom-4 right-3' },
  { size: 'w-0.5 h-0.5', delay: '0.5s', pos: 'top-10 right-2' },
  { size: 'w-1 h-1', delay: '2s', pos: 'bottom-2 left-4' },
  { size: 'w-2 h-2', delay: '1.5s', pos: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' }
];

const MATRIX_COLS_BACK = [
  { chars: ['ヌ', 'フ', 'ア', 'ウ', '0', '1', 'カ', 'キ'], offset: 0, left: '8%', dur: '3.5s' },
  { chars: ['エ', 'オ', 'テ', 'シ', '1', '0', 'ユ', 'ル'], offset: 1.2, left: '26%', dur: '4.2s' },
  { chars: ['メ', 'ル', '0', '1', 'ラ', 'キ', 'ナ', 'ハ'], offset: 0.4, left: '48%', dur: '2.8s' },
  { chars: ['ミ', 'ツ', 'フ', 'イ', '1', '1', 'エ', 'ヒ'], offset: 1.8, left: '70%', dur: '3.8s' },
  { chars: ['コ', 'モ', '0', 'ワ', 'ヌ', '1', 'ア', 'ロ'], offset: 0.8, left: '88%', dur: '3.2s' }
];

const CRIMSON_FIRE_BACK = [
  { bg: 'bg-gradient-to-t from-red-600 to-amber-400', size: 'w-14 h-14', delay: '0s', left: '10%', scale: 'scale-90', blur: 'blur-[2px]' },
  { bg: 'bg-gradient-to-t from-amber-600 to-yellow-300', size: 'w-16 h-16', delay: '0.8s', left: '20%', scale: 'scale-100', blur: 'blur-[4px]' },
  { bg: 'bg-gradient-to-t from-rose-600 via-red-500 to-transparent', size: 'w-12 h-12', delay: '0.4s', left: '-15%', scale: 'scale-110', blur: 'blur-[3px]' },
  { bg: 'bg-gradient-to-t from-yellow-500 to-amber-300', size: 'w-10 h-10', delay: '1.2s', left: '5%', scale: 'scale-70', blur: 'blur-[1px]' }
];

const COSMIC_STARS_BACK = [
  { t: 'top-[20%] left-[15%]', d: '0s' },
  { t: 'top-[35%] left-[80%]', d: '0.4s' },
  { t: 'top-[75%] left-[25%]', d: '0.8s' },
  { t: 'top-[65%] left-[70%]', d: '1.2s' },
  { t: 'top-[10%] left-[60%]', d: '0.2s' },
  { t: 'top-[85%] left-[85%]', d: '1.6s' }
];

const WATER_SPARKLES_BACK = [
  { top: '15%', left: '48%', size: 'w-2 h-2', delay: '0.1s' },
  { top: '25%', left: '42%', size: 'w-1.5 h-1.5', delay: '1.1s' },
  { top: '35%', left: '50%', size: 'w-1 h-1', delay: '0.3s' },
  { top: '30%', left: '68%', size: 'w-1.5 h-1.5', delay: '0.6s' }
];

export function getCardBackConfig(activeCardBack: string, size: 'sm' | 'md' | 'lg') {
  let backThemeClass = '';
  let backContent = null;

  switch (activeCardBack) {
    case 'casino_style':
      backThemeClass = 'bg-[#7f1d1d] border border-amber-500/75 shadow-md';
      backContent = (
        <div className="absolute inset-1 border border-amber-500/40 rounded flex items-center justify-center p-1 overflow-hidden">
          <div 
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: 'linear-gradient(45deg, #f59e0b 25%, transparent 25%), linear-gradient(-45deg, #f59e0b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f59e0b 75%), linear-gradient(-45deg, transparent 75%, #f59e0b 75%)',
              backgroundSize: '10px 10px'
            }}
          ></div>
          <div className="absolute inset-1 border border-dashed border-amber-500/35 rounded-sm"></div>
          <div className="w-7 h-7 rotate-45 border-2 border-amber-500/50 flex items-center justify-center bg-rose-900/90 shadow-lg" style={{ willChange: 'transform' }}>
            <div className="w-4 h-4 border border-amber-500/60 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" style={{ willChange: 'opacity' }}></div>
            </div>
          </div>
        </div>
      );
      break;
    case 'retro_pixels':
      backThemeClass = 'bg-[#1e293b] border border-slate-600 shadow-md';
      backContent = (
        <div className="absolute inset-1 border-2 border-[#38bdf8] bg-[#0f172a] flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'linear-gradient(rgba(56,189,248,0.3) 2px, transparent 2px), linear-gradient(90deg, rgba(56,189,248,0.3) 2px, transparent 2px)',
              backgroundSize: '6px 6px'
            }}
          ></div>
          <div className="relative w-8 h-8 flex items-center justify-center scale-110">
            <div className="absolute inset-0 border border-dotted border-[#38bdf8]/60 rotate-45" style={{ willChange: 'transform' }}></div>
            <div className="w-4 h-4 bg-[#0ea5e9] shadow-[0_0_8px_#38bdf8] flex items-center justify-center" style={{ willChange: 'transform, box-shadow' }}>
              <div className="w-2 h-2 bg-white"></div>
            </div>
          </div>
          <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-[#38bdf8]/55"></div>
          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#38bdf8]/55"></div>
          <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-[#38bdf8]/55"></div>
          <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-[#38bdf8]/55"></div>
        </div>
      );
      break;
    case 'gothic_scroll':
      backThemeClass = 'bg-gradient-to-br from-amber-950 to-stone-950 border border-amber-700/65 shadow-[0_0_12px_rgba(217,119,6,0.25)]';
      backContent = (
        <div className="absolute inset-1.5 border border-amber-900/45 rounded flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, #b45309 1px, transparent 1px), linear-gradient(0deg, transparent 49%, #b45309 50%, transparent 51%)',
              backgroundSize: '12px 12px, 100% 6px'
            }}
          ></div>
          <div className="absolute inset-1 border border-dashed border-amber-700/25"></div>
          <div className="w-8 h-8 rounded-full border border-amber-600/40 flex items-center justify-center p-0.5">
            <div className="w-full h-full rounded-full border border-amber-500/50 border-dashed bg-stone-950/80 rotate-45 flex items-center justify-center" style={{ willChange: 'transform' }}>
              <div className="w-2.5 h-2.5 bg-amber-500/80 rotate-45 shadow-[0_0_4px_#f59e0b]"></div>
            </div>
          </div>
        </div>
      );
      break;
    case 'futuristic_tech':
      backThemeClass = 'bg-slate-950 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]';
      backContent = (
        <div className="absolute inset-1 border border-cyan-500/20 bg-slate-950 flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: 'linear-gradient(rgba(6,182,212,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.25) 1px, transparent 1px)',
              backgroundSize: '10px 10px'
            }}
          ></div>
          <div className="absolute left-1/2 top-2 bottom-2 w-[1px] bg-cyan-500/20 -translate-x-1/2"></div>
          <div className="absolute top-1/2 left-2 right-2 h-[1px] bg-cyan-500/20 -translate-y-1/2"></div>
          <div 
            className="w-6 h-6 border-2 border-cyan-400 flex items-center justify-center rounded-sm bg-slate-900 relative shadow-[0_0_6px_rgba(6,182,212,0.4)] animate-[circuit-pulse-anim_2.5s_infinite]"
            style={{ willChange: 'opacity, transform', transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden' }}
          >
            <div className="w-2.5 h-2.5 bg-cyan-400 rounded-sm"></div>
            <div className="absolute -top-1 -left-1 w-1 h-1 bg-cyan-300"></div>
            <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-cyan-300"></div>
          </div>
        </div>
      );
      break;
    case 'japanese_calligraphy':
      backThemeClass = 'bg-[#faf6eb] border border-[#cbba9e] shadow-md';
      backContent = (
        <div className="absolute inset-1.5 border border-[#e5dcd0] bg-[#fdfbf7] rounded flex items-center justify-center p-1 overflow-hidden">
          <div 
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(circle at 100% 150%, transparent 24%, #888 24%, #888 28%, transparent 28%, transparent), radial-gradient(circle at 0% 150%, transparent 24%, #888 24%, #888 28%, transparent 28%, transparent)',
              backgroundSize: '12px 12px'
            }}
          ></div>
          <div className="w-12 h-12 rounded-full border-2 border-[#2c2a29] border-t-transparent border-r-[#2c2a29]/45 border-b-[#2c2a29]/80 relative flex items-center justify-center" style={{ willChange: 'transform' }}>
            <span className="text-3xl text-[#2c2a29] font-serif font-black opacity-[0.85] select-none" style={{ transform: 'scaleY(1.1)' }}>運</span>
            <div className="absolute bottom-0 -right-1 w-3.5 h-3.5 bg-[#900] border border-[#a20]/80 shadow-[1px_1px_2px_rgba(0,0,0,0.15)] flex items-center justify-center rotate-6" style={{ willChange: 'transform' }}>
              <span className="text-[5px] text-white font-serif font-black" style={{ WebkitFontSmoothing: 'none' }}>吉</span>
            </div>
          </div>
        </div>
      );
      break;
    case 'minimalist_charcoal':
      backThemeClass = 'bg-[#121110] border border-stone-850 shadow-lg';
      backContent = (
        <div className="absolute inset-1 border border-stone-800 bg-[#1c1917] flex items-center justify-center">
          <div className="absolute inset-2 border border-stone-750 rotate-45 opacity-30" style={{ willChange: 'transform' }}></div>
          <div className="w-[1.25rem] h-[1.25rem] border border-stone-700 bg-[#121110] flex items-center justify-center rotate-45" style={{ willChange: 'transform' }}>
            <div className="w-1 h-1 bg-stone-500 rotate-45" style={{ willChange: 'transform' }}></div>
          </div>
        </div>
      );
      break;
    case 'glitch':
      backThemeClass = 'bg-black border border-fuchsia-600 shadow-[0_0_15px_rgba(217,70,239,0.35)] overflow-hidden';
      backContent = (
        <div 
          className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden select-none animate-[glitch-pop-anim_0.6s_infinite]"
          style={{ willChange: 'transform, opacity, clip-path', transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden' }}
        >
          <div className="absolute top-[15%] left-1 right-2 h-[2px] bg-cyan-400 opacity-60"></div>
          <div className="absolute top-[65%] left-2 right-1 h-[3px] bg-fuchsia-500 opacity-70"></div>
          <div className="absolute top-[40%] left-0 right-0 h-[1.5px] bg-white opacity-85"></div>
          <div className="w-8 h-8 border border-fuchsia-500 bg-black/60 relative flex items-center justify-center shadow-[0_0_8px_#f43f5e]" style={{ willChange: 'transform' }}>
            <div className="absolute inset-0 border border-cyan-400 mix-blend-screen scale-110 translate-x-[2px] translate-y-[-1px] opacity-70" style={{ willChange: 'transform' }}></div>
            <div className="w-2 h-2 bg-white animate-ping" style={{ willChange: 'transform, opacity' }}></div>
          </div>
          <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-base scanlines-bg overlay animate-[glitch-blur_1.5s_infinite]" style={{ willChange: 'transform' }}></div>
        </div>
      );
      break;
    case 'royal_gold':
      backThemeClass = 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-800 border bg-amber-500 border-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.35)]';
      backContent = (
        <>
          <div 
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none mix-blend-overlay rounded-md"
            style={{ willChange: 'transform', transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden' }}
          >
            <div 
              className="absolute inset-0 bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.4)_25%,transparent_30%)] bg-[size:200%_100%] animate-[gold-shimmer-anim_4s_infinite_linear]"
              style={{ willChange: 'transform, background-position' }}
            ></div>
            {GOLD_SPARKLES_BACK.map((sparkle, i) => (
              <div 
                key={i} 
                className={`absolute ${sparkle.pos} ${sparkle.size} bg-white rounded-full mix-blend-screen animate-[star-twinkle-anim_2s_infinite_ease-in-out] opacity-0`}
                style={{ animationDelay: sparkle.delay, willChange: 'transform, opacity' }}
              >
                <div className="absolute top-1/2 left-[-100%] right-[-100%] h-[1px] bg-white opacity-60 -translate-y-1/2 blur-[0.2px]" style={{ willChange: 'transform' }}></div>
                <div className="absolute left-1/2 top-[-100%] bottom-[-100%] w-[1px] bg-white opacity-60 -translate-x-1/2 blur-[0.2px]" style={{ willChange: 'transform' }}></div>
              </div>
            ))}
          </div>
          <div className="absolute inset-1 border border-amber-300/30 rounded flex items-center justify-center p-1 overflow-hidden">
            <div 
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage: 'linear-gradient(45deg, rgba(251,191,36,0.2) 25%, transparent 25%, transparent 75%, rgba(251,191,36,0.2) 75%), linear-gradient(-45deg, rgba(251,191,36,0.2) 25%, transparent 25%, transparent 75%, rgba(251,191,36,0.2) 75%)',
                backgroundSize: '12px 12px'
              }}
            ></div>
            <div className="w-7 h-7 rounded-full border border-amber-200 bg-amber-500/10 flex items-center justify-center relative shadow-[inset_0_0_6px_rgba(217,119,6,0.3)]">
              <div 
                className="w-4.5 h-4.5 rounded bg-yellow-300 border border-amber-600 rotate-45 flex items-center justify-center relative shadow-md animate-pulse"
                style={{ willChange: 'transform, opacity' }}
              >
                <div className="w-1.5 h-1.5 rounded bg-amber-950"></div>
              </div>
            </div>
          </div>
        </>
      );
      break;
    case 'neon_matrix':
      backThemeClass = 'bg-[#030712] border-2 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
      backContent = (
        <div 
          className="absolute inset-0 flex items-center justify-between p-0.5 font-mono overflow-hidden"
          style={{ willChange: 'transform', transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden' }}
        >
          {MATRIX_COLS_BACK.map((col, i) => (
            <div 
              key={i} 
              className="absolute top-1 bottom-1 flex flex-col select-none text-[8.5px] font-bold tracking-widest leading-none text-center"
              style={{ 
                left: col.left,
                width: '10px',
                filter: 'drop-shadow(0 0 2px rgba(16,185,129,0.85))',
                willChange: 'transform'
              }}
            >
              {col.chars.map((char, charIdx) => (
                <span 
                  key={charIdx} 
                  className="opacity-0"
                  style={{ 
                    animationName: 'matrix-char-print',
                    animationDuration: col.dur,
                    animationIterationCount: 'infinite',
                    animationTimingFunction: 'linear',
                    animationDelay: `${col.offset + charIdx * 0.15}s`,
                    willChange: 'opacity'
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
          ))}
        </div>
      );
      break;
    case 'crimson_fire':
      backThemeClass = 'bg-[#1a0505] border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] overflow-hidden';
      backContent = (
        <div 
          className="absolute inset-0 flex items-center justify-center p-1 bg-[#120101]"
          style={{ willChange: 'transform', transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden' }}
        >
          {CRIMSON_FIRE_BACK.map((fire, i) => (
            <div 
              key={i} 
              className="absolute bottom-[-10%] rounded-full opacity-60 mix-blend-screen animate-[fire-rise-anim_2s_infinite_ease-out]"
              style={{
                left: `calc(50% - 24px + ${fire.left})`,
                animationDelay: fire.delay,
                willChange: 'transform, opacity'
              }}
            >
              <div 
                className={`rounded-full ${fire.bg} ${fire.size} ${fire.scale} ${fire.blur} animate-[fire-sway-anim_2.8s_infinite_ease-in-out]`}
                style={{ willChange: 'transform' }}
              ></div>
            </div>
          ))}
          <div className="z-10 w-6 h-6 border border-red-500 bg-red-950/75 rotate-45 flex items-center justify-center shadow-[0_0_10px_#ef4444]" style={{ willChange: 'transform' }}>
            <div className="w-2.5 h-2.5 bg-amber-400 rotate-45 animate-pulse" style={{ willChange: 'opacity' }}></div>
          </div>
        </div>
      );
      break;
    case 'cosmic_void':
      backThemeClass = 'bg-slate-950 border-2 border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.35)]';
      backContent = (
        <div 
          className="absolute inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#100b26] to-[#04010f]"
          style={{ willChange: 'transform', transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden' }}
        >
          {COSMIC_STARS_BACK.map((star, id) => (
            <div 
              key={id} 
              className={`absolute w-1 h-1 bg-white rounded-full animate-[star-twinkle-anim_2s_infinite_ease-in-out] ${star.t}`}
              style={{ animationDelay: star.d, willChange: 'transform, opacity' }}
            ></div>
          ))}

          <div className="absolute w-20 h-10 border border-violet-500/25 rounded-full animate-[cosmic-swirl-anim_8s_infinite_linear] opacity-35" style={{ willChange: 'transform' }}></div>
          <div className="absolute w-14 h-14 bg-gradient-to-tr from-fuchsia-500/10 via-indigo-500/10 to-transparent rounded-full blur-md animate-[cosmic-swirl-anim_12s_infinite_linear]" style={{ willChange: 'transform' }}></div>
          
          <div className="w-5 h-5 rounded-full bg-violet-950 border border-violet-400/50 flex items-center justify-center shadow-[0_0_8px_#8b5cf6]">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      );
      break;
    case 'beach_breeze':
      backThemeClass = 'bg-gradient-to-b from-sky-300 via-sky-100 to-amber-100 border border-amber-300 shadow-md overflow-hidden relative';
      backContent = (
        <div className="absolute inset-0 flex flex-col justify-end overflow-hidden">
          {/* Animated Sky / Cloud */}
          <div 
            className="absolute top-[8%] left-2 w-6 h-1.5 bg-white/60 rounded-full blur-[0.2px] animate-[beach-cloud-move_12s_infinite_linear]"
            style={{ willChange: 'transform' }}
          ></div>
          <div 
            className="absolute top-[16%] right-2 w-4 h-1 bg-white/45 rounded-full blur-[0.1px] animate-[beach-cloud-move_8s_infinite_linear_reverse]"
            style={{ willChange: 'transform' }}
          ></div>
 
          {/* Sun */}
          <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[22%] h-[15%] rounded-full bg-gradient-to-b from-amber-300 to-rose-400 opacity-80 blur-[0.5px]"></div>
          {/* Sun Glow Ring */}
          <div className="absolute top-[9%] left-1/2 -translate-x-1/2 w-[34%] h-[22%] rounded-full bg-amber-200/20 opacity-60 blur-md animate-pulse" style={{ willChange: 'opacity' }}></div>
 
          {/* Floating Island Centerpiece */}
          <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-[68%] h-[12%] bg-gradient-to-t from-amber-300 via-amber-200 to-amber-100 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.12),inset_0_-1.5px_2px_rgba(0,0,0,0.06)] z-10"></div>
          
          {/* Palm Tree Centerpiece - starts nicely on the island and rises up */}
          <div 
            className="absolute bottom-[23%] left-[50%] -translate-x-[50%] w-[32%] h-[35%] origin-bottom animate-[beach-palm-sway_4s_infinite_ease-in-out] z-15"
            style={{ willChange: 'transform' }}
          >
            <svg viewBox="0 0 50 50" fill="none" className="overflow-visible w-full h-full">
              {/* Textured Curved Trunk */}
              <path d="M25,50 C23.5,38 23.5,23 27,11" stroke="#78350f" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <path d="M25,50 C23.5,38 23.5,23 27,11" stroke="#92400e" strokeWidth="1.2" strokeDasharray="1,4" strokeLinecap="round" fill="none" />
              
              {/* Leaves & Coconuts Group */}
              <g transform="translate(27, 11)">
                {/* Back Leaves */}
                <path d="M0,0 C-4,-10 -11,-12 -16,-9" stroke="#16a34a" strokeWidth="2.0" strokeLinecap="round" fill="none" />
                <path d="M0,0 C4,-8 11,-10 15,-8" stroke="#15803d" strokeWidth="2.0" strokeLinecap="round" fill="none" />
                
                {/* Front Leaves */}
                <path d="M0,0 C-8,-4 -16,3 -20,8" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                <path d="M0,0 C8,-5 16,1 20,4" stroke="#15803d" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                
                {/* Little Coconuts */}
                <circle cx="-1.5" cy="1.5" r="1.6" fill="#451a03" />
                <circle cx="2" cy="1" r="1.3" fill="#451a03" stroke="#78350f" strokeWidth="0.5" />
              </g>
            </svg>
          </div>
 
          {/* Animated Waves (overlays at the bottom) with glittering sun spots */}
          <div className="absolute bottom-0 left-0 right-0 h-[28%] bg-gradient-to-t from-cyan-600 via-cyan-500/90 to-teal-400/80 z-5 overflow-hidden shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)]">
            {/* Wave layer 1 */}
            <div 
              className="absolute inset-x-[-20%] -top-2.5 h-4.5 bg-cyan-300/45 animate-[beach-wave-one_3s_infinite_ease-in-out]" 
              style={{ borderRadius: '40% 40% 0 0', willChange: 'transform' }}
            ></div>
            {/* Wave layer 2 (offset) */}
            <div 
              className="absolute inset-x-[-20%] -top-1.5 h-4.5 bg-teal-300/45 animate-[beach-wave-two_4s_infinite_ease-in-out_1s]" 
              style={{ borderRadius: '45% 45% 0 0', willChange: 'transform' }}
            ></div>
            {/* Wave foam edge */}
            <div 
              className="absolute inset-x-0 -top-2 h-1 bg-white/80 blur-[0.2px] animate-[beach-wave-foam_3s_infinite_ease-in-out]"
              style={{ willChange: 'transform, opacity' }}
            ></div>
 
            {/* Glittering Sun Sparkles on Water */}
            <div className="absolute inset-0 pointer-events-none">
              {WATER_SPARKLES_BACK.map((spark, i) => (
                <div 
                  key={i}
                  className={`absolute ${spark.size} bg-white mix-blend-screen rounded-full animate-[water-glitter-anim_2.5s_infinite_ease-in-out] opacity-0`}
                  style={{
                    top: spark.top,
                    left: spark.left,
                    animationDelay: spark.delay,
                    willChange: 'transform, opacity'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      );
      break;
    case 'battle':
    default: {
      const scaling = {
        sm: {
          tactical: 'text-[5px] tracking-[0.1em] mb-[3px]',
          battle: 'text-[9.5px] tracking-[0.02em] font-black',
          warfare: 'text-[4.5px] tracking-[0.1em] mt-[3px]',
          padding: 'py-0.5',
        },
        md: {
          tactical: 'text-[7px] tracking-[0.18em] mb-[6px]',
          battle: 'text-[15px] tracking-[0.04em] font-black',
          warfare: 'text-[6px] tracking-[0.18em] mt-[6px]',
          padding: 'py-1.5',
        },
        lg: {
          tactical: 'text-[10px] tracking-[0.25em] mb-[10px]',
          battle: 'text-[24px] tracking-[0.06em] font-black',
          warfare: 'text-[9px] tracking-[0.25em] mt-[10px]',
          padding: 'py-2.5',
        },
      };
      const sSize = scaling[size] || scaling.md;

      backThemeClass = 'bg-indigo-950 border-2 border-slate-300 shadow-md text-indigo-300';
      backContent = (
        <div className="absolute inset-0 flex flex-col items-center justify-between p-1.5 select-none overflow-hidden bg-gradient-to-b from-indigo-900 to-slate-950">
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)',
              backgroundSize: '10px 10px'
            }}
          ></div>
          
          <div className="absolute inset-1 border border-indigo-500/40 rounded flex flex-col items-center justify-center">
            <div className="absolute inset-0.5 border border-dashed border-indigo-400/25 rounded"></div>
            
            <div className={`${sSize.tactical} font-mono text-indigo-400/40 uppercase select-none`}>TACTICAL</div>
            
            <div className={`w-full ${sSize.padding} bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-y border-indigo-500/30 relative flex items-center justify-center shadow-inner`}>
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"></div>
              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"></div>
              
              <span className={`${sSize.battle} text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-500 uppercase font-title leading-none text-center select-none drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]`}>
                BATTLE
              </span>
            </div>
            
            <div className={`${sSize.warfare} font-mono text-indigo-400/30 uppercase select-none`}>WARFARE</div>
          </div>
        </div>
      );
      break;
    }
  }

  return { backThemeClass, backContent };
}
