
import React from 'react';
import { Card, Suit, Color, Rank } from '../types';
import { getCardBackConfig } from './cards/cardBackUtils';
import { getCardFaceThemeClasses } from './cards/cardFaceUtils';
import { CardFaceBackgrounds } from './cards/CardFaceBackgrounds';

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
    const { backThemeClass, backContent } = getCardBackConfig(activeCardBack, size);

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
  const { borderClass, cardFaceBgClass, fontClass, centerArtOpacity, textThemeColor, badgeThemeClass, textFilterClass, spectrumAccentClass } = getCardFaceThemeClasses(activeCardFace, isSelected, isRed);

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
        {/* Physical / Magical Top Accent Bar removed for cleaner look */}

        {/* Dynamic Background Layer for Face */}
        <CardFaceBackgrounds activeCardFace={activeCardFace} />

        {/* Summoning Sickness Indicator */}
        {isSummoningSick && !isTapped && (
            <div className="absolute top-1 right-1 z-35 animate-pulse">
                <div className={`font-bold rounded-full px-1 text-[0.6rem] border shadow-sm leading-none pb-0.5 ${activeCardFace === 'futuristic_tech' ? 'bg-slate-900 border-slate-700 text-cyan-400' : 'bg-white/90 border-slate-300 text-slate-400'}`}>
                    zZ
                </div>
            </div>
        )}

        {/* Top Corner (Self Start) */}
        <div className={`flex flex-col items-center leading-none z-10 self-start ${textFilterClass}`}>
          <span className={`${fontClass}`}>{card.rank}</span>
          <span className="text-[0.8em]">{card.suit}</span>
        </div>

        {/* Center Art */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${centerArtOpacity} z-0 ${textFilterClass}`}>
          <span className="text-4xl">{card.suit}</span>
        </div>
        
        {/* Bottom Corner (Self End) */}
        <div className={`flex flex-col items-center leading-none rotate-180 z-10 self-end ${textFilterClass}`}>
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
