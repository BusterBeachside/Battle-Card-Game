export interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  type: 'BACK' | 'FACE';
  cost: number;
}

export const COSMETIC_ITEMS: CosmeticItem[] = [
  // Card Backs
  { id: 'casino_style', name: 'Casino Style Back', description: 'Classic symmetrical vintage scrollwork in deep crimson red borders.', type: 'BACK', cost: 800 },
  { id: 'retro_pixels', name: 'Retro Pixel Back', description: 'Blocky 8-bit retro grid with a glowing pixelated double-heart emblem.', type: 'BACK', cost: 1200 },
  { id: 'gothic_scroll', name: 'Gothic Scroll Back', description: 'Aged antique parchment featuring a gothic wax seal and royal filigree.', type: 'BACK', cost: 1800 },
  { id: 'neon_matrix', name: 'Neon Matrix Back', description: 'Teal/emerald matrix lines with grid scanner aesthetics.', type: 'BACK', cost: 2500 },
  { id: 'futuristic_tech', name: 'Futuristic Tech Back', description: 'Advanced holographic circuitry blueprint back with glowing cyan nodes.', type: 'BACK', cost: 2500 },
  { id: 'crimson_fire', name: 'Crimson Fire Back', description: 'Deep red backing with flames and animated outline accents.', type: 'BACK', cost: 3000 },
  { id: 'japanese_calligraphy', name: 'Sumi-e Calligraphy Back', description: 'Hand-brushed black ink Enso circle on authentic textured parchment.', type: 'BACK', cost: 3500 },
  { id: 'cosmic_void', name: 'Cosmic Void Back', description: 'Deep space purple back with swirling galactic stardust.', type: 'BACK', cost: 4000 },
  { id: 'minimalist_charcoal', name: 'Minimalist Charcoal Back', description: 'Sleek ultra-thin matte black casing with fine geometric hair-lines.', type: 'BACK', cost: 4500 },
  { id: 'glitch', name: 'Glitch Back', description: 'An animated reality-distorting cybernetic back that glitches continuously.', type: 'BACK', cost: 5000 },
  { id: 'beach_breeze', name: 'Beach Breeze Back', description: 'Tropical paradise animated card back featuring a palm tree swaying over an active tide.', type: 'BACK', cost: 3800 },
  { id: 'royal_gold', name: 'Royal Gold Back', description: 'Premium gilded solid gold back with intricate crowns and gold leaf detailing.', type: 'BACK', cost: 8000 },

  // Card Faces
  { id: 'casino_style', name: 'Casino Style Face', description: 'Traditional clean casino markings with bold ranks and deep crimson borders.', type: 'FACE', cost: 800 },
  { id: 'retro_pixels', name: 'Retro Pixel Face', description: 'Blocky low-res retro character cards with pixelated text overlays.', type: 'FACE', cost: 1200 },
  { id: 'gothic_scroll', name: 'Gothic Scroll Face', description: 'Fancy old-world calligraphy typeface styling.', type: 'FACE', cost: 1800 },
  { id: 'neon_matrix', name: 'Neon Matrix Face', description: 'Digital streams of green data cascade behind glowing neon card symbols.', type: 'FACE', cost: 2500 },
  { id: 'futuristic_tech', name: 'Futuristic Tech Face', description: 'Tech readouts, glowing digits, and cyan/magical borders.', type: 'FACE', cost: 2500 },
  { id: 'crimson_fire', name: 'Crimson Fire Face', description: 'Blazing active embers and glowing solar flares framing your suite cards.', type: 'FACE', cost: 3000 },
  { id: 'japanese_calligraphy', name: 'Sumi-e Calligraphy Face', description: 'Sumi-e style hand-painted characters with traditional red artist seal stamps.', type: 'FACE', cost: 3500 },
  { id: 'cosmic_void', name: 'Cosmic Void Face', description: 'Swirling nebulae of purple and deep violet cascading across the face card.', type: 'FACE', cost: 4000 },
  { id: 'minimalist_charcoal', name: 'Minimalist Charcoal Face', description: 'Ultra-thin elegant fonts, spacious margins and neat suites.', type: 'FACE', cost: 4500 },
  { id: 'glitch', name: 'Glitch Face', description: 'Cybernetic static and hologram distortion face backgrounds that twitch.', type: 'FACE', cost: 5000 },
  { id: 'beach_breeze', name: 'Beach Breeze Face', description: 'Top-down animated shoreline with realistic ocean swell rolling over glistening sands.', type: 'FACE', cost: 3800 },
  { id: 'royal_gold', name: 'Royal Gold Face', description: 'Ultimate prestige solid gold plated card face with metallic reflections.', type: 'FACE', cost: 8000 }
];
