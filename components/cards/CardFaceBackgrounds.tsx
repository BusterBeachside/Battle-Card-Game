import React from 'react';

export const CardFaceBackgrounds: React.FC<{ activeCardFace: string }> = ({ activeCardFace }) => {
  return (
    <>
      {activeCardFace === 'japanese_calligraphy' && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.06]">
          {/* Some ink splotch blob SVG overlay */}
            <svg viewBox="0 0 100 100" className="absolute w-full h-full text-black mix-blend-multiply">
              <path d="M 15 80 Q 25 70 30 75 T 45 90 Q 30 95 15 80" fill="currentColor" />
              <path d="M 80 15 Q 70 25 75 30 Q 85 35 90 25 T 80 15" fill="currentColor"/>
              <circle cx="20" cy="65" r="1.5" fill="currentColor" />
              <circle cx="35" cy="88" r="1.2" fill="currentColor" />
              <circle cx="10" cy="85" r="0.8" fill="currentColor" />
              <circle cx="72" cy="18" r="0.9" fill="currentColor" />
              <circle cx="85" cy="40" r="1.5" fill="currentColor" />
              <circle cx="92" cy="30" r="1" fill="currentColor" />
              <path d="M 40 40 Q 50 30 60 50 T 40 60 Q 30 50 40 40" fill="currentColor" opacity="0.5" />
            </svg>
        </div>
      )}

      {activeCardFace === 'glitch' && (
        <div className="absolute inset-0 z-0 bg-black overflow-hidden pointer-events-none animate-[glitch-pop-anim_0.8s_infinite]">
          <div className="absolute inset-0 opacity-45 bg-[linear-gradient(rgba(147,51,234,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.15)_1px,transparent_1px)] bg-[size:5px_5px]"></div>
          <div className="absolute top-1/2 left-0 right-0 h-8 bg-cyan-400/20 mix-blend-color-dodge blur-[2px] animate-[glitch-blur_1.2s_infinite]"></div>
          <div className="absolute top-1/4 left-0 right-0 h-4 bg-fuchsia-400/10 mix-blend-screen -rotate-3 animate-[glitch-blur_20s_infinite_reverse]"></div>
          <div className="absolute inset-0 border border-fuchsia-400/20 mix-blend-screen animate-[glitch-flicker_0.15s_infinite]"></div>
        </div>
      )}
      {activeCardFace === 'neon_matrix' && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-slate-950">
          {/* Matrix rain columns on face too! */}
          {[
            { chars: ['ヌ', '0', 'カ', '1'], offset: 0, left: '15%', dur: '4s' },
            { chars: ['シ', '1', 'ユ', 'フ'], offset: 1.5, left: '50%', dur: '3.5s' },
            { chars: ['ア', '0', 'ヌ', 'コ'], offset: 0.5, left: '80%', dur: '4.8s' }
          ].map((col, i) => (
            <div 
              key={i} 
              className="absolute top-2 bottom-2 flex flex-col text-transparent select-none text-[6px] tracking-widest leading-none"
              style={{ left: col.left }}
            >
              {col.chars.map((char, charIdx) => (
                <span 
                  key={charIdx}
                  className="opacity-0"
                  style={{
                    animationName: 'matrix-char-print-dim',
                    animationDuration: col.dur,
                    animationIterationCount: 'infinite',
                    animationTimingFunction: 'linear',
                    animationDelay: `${col.offset + charIdx * 0.15}s`
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.06)_1px,transparent_1px)] bg-[size:6px_6px]"></div>
        </div>
      )}
      {activeCardFace === 'cosmic_void' && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-slate-950">
          <div className="absolute w-20 h-20 bg-indigo-500/15 rounded-full blur-xl -top-6 -left-6"></div>
          <div className="absolute w-20 h-20 bg-purple-500/15 rounded-full blur-xl -bottom-6 -right-6 animate-pulse"></div>
        </div>
      )}
      {activeCardFace === 'crimson_fire' && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-b from-[#1a0505] to-[#040000]">
          {/* Mathematical burning frames on face */}
          {[
            { bg: 'from-amber-600/30 to-yellow-500/0', size: 'w-12 h-12', delay: '0s', left: '-10%' },
            { bg: 'from-red-650/35 to-rose-500/0', size: 'w-14 h-14', delay: '0.5s', left: '15%' }
          ].map((fire, i) => (
            <div 
              key={i} 
              className="absolute bottom-[-15%] rounded-full opacity-40 mix-blend-screen animate-[fire-rise-anim_2.2s_infinite_ease-out]"
              style={{
                left: `calc(50% - 24px + ${fire.left})`,
                animationDelay: fire.delay
              }}
            >
              <div className={`rounded-full bg-gradient-to-t ${fire.bg} ${fire.size} blur-[3px] animate-[fire-sway-anim_3s_infinite_ease-in-out]`}></div>
            </div>
          ))}
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
      {activeCardFace === 'royal_gold' && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-sm mix-blend-overlay">
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.4)_25%,transparent_30%)] bg-[size:200%_100%] animate-[gold-shimmer-anim_4s_infinite_linear]"></div>
          
          {/* Glitters */}
          {[
            { size: 'w-1 h-1', delay: '0s', pos: 'top-2 left-2' },
            { size: 'w-1.5 h-1.5', delay: '1s', pos: 'bottom-4 right-3' },
            { size: 'w-0.5 h-0.5', delay: '0.5s', pos: 'top-10 right-2' },
            { size: 'w-1 h-1', delay: '2s', pos: 'bottom-2 left-4' },
            { size: 'w-2 h-2', delay: '1.5s', pos: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' }
          ].map((sparkle, i) => (
            <div 
              key={i} 
              className={`absolute ${sparkle.pos} ${sparkle.size} bg-white rounded-full mix-blend-screen animate-[star-twinkle-anim_2s_infinite_ease-in-out] opacity-0`}
              style={{ animationDelay: sparkle.delay }}
            >
              {/* Cross flare */}
              <div className="absolute top-1/2 left-[-100%] right-[-100%] h-[1px] bg-white opacity-60 -translate-y-1/2 blur-[0.2px]"></div>
              <div className="absolute left-1/2 top-[-100%] bottom-[-100%] w-[1px] bg-white opacity-60 -translate-x-1/2 blur-[0.2px]"></div>
            </div>
          ))}
        </div>
      )}
      {activeCardFace === 'beach_breeze' && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-sm">
          {/* Sandy Beach background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#fef08a] via-[#fde047] to-[#f59e0b] opacity-90"></div>
          
          {/* Waves and Tide rolling in from the top down */}
          <div className="absolute inset-x-[-30%] -top-[35%] h-[115%] origin-top animate-[tide-animation_6s_infinite_ease-in-out]">
            {/* The ocean layer */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-600/90 via-cyan-500/80 to-teal-400/70" style={{ borderRadius: '0 0 50% 50% / 0 0 20% 20%' }}></div>
            
            {/* Foam lines (Tide Edge) */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-white/70 blur-[0.5px] animate-pulse" style={{ borderRadius: '0 0 50% 50% / 0 0 35% 35%' }}></div>
            <div className="absolute bottom-1.5 left-0 right-0 h-2 bg-cyan-200/50" style={{ borderRadius: '0 0 50% 50% / 0 0 30% 30%' }}></div>
          </div>

          {/* Stationary Glowing sun glitter sparkles relative to the water area */}
          <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
            {[
              { top: '8%', left: '32%', size: 'w-1 h-1', delay: '0s' },
              { top: '22%', left: '48%', size: 'w-1.5 h-1.5', delay: '0.4s' },
              { top: '5%', left: '68%', size: 'w-0.5 h-0.5', delay: '0.8s' },
              { top: '30%', left: '38%', size: 'w-1.5 h-1.5', delay: '1.2s' },
              { top: '15%', left: '60%', size: 'w-1 h-1', delay: '1.6s' },
              { top: '25%', left: '72%', size: 'w-1 h-1', delay: '0.2s' },
              { top: '12%', left: '44%', size: 'w-1.5 h-1.5', delay: '0.6s' },
              { top: '35%', left: '50%', size: 'w-2 h-2', delay: '1s' }
            ].map((sparkle, idx) => (
              <div 
                key={`water-sparkle-${idx}`} 
                className={`absolute ${sparkle.size} bg-white rounded-full mix-blend-screen animate-[water-glitter-anim_2s_infinite_ease-in-out] opacity-0`}
                style={{
                  top: sparkle.top,
                  left: sparkle.left,
                  animationDelay: sparkle.delay,
                }}
              >
                <div className="absolute inset-[-100%] bg-white/40 rounded-full blur-[0.3px]"></div>
              </div>
            ))}
          </div>
          
          {/* Subtle glistening sand sparkles on the dry sand at the bottom */}
          {[
            { top: '80%', left: '15%', delay: '0s' },
            { top: '82%', left: '55%', delay: '1.2s' },
            { top: '75%', left: '78%', delay: '1.8s' },
            { top: '88%', left: '32%', delay: '0.6s' }
          ].map((sparkle, idx) => (
            <div 
              key={idx} 
              className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse opacity-40 animate-[star-twinkle-anim_2s_infinite]"
              style={{
                top: sparkle.top,
                left: sparkle.left,
                animationDelay: sparkle.delay,
              }}
            ></div>
          ))}
        </div>
      )}
    </>
  );
};
