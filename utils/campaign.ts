export type CampaignThemeType = 'GRASSLANDS' | 'DUNGEON' | 'DESERT' | 'GLACIER' | 'COAST' | 'MOUNTAIN';

export interface CampaignDetail {
  id: string;
  type: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
}

export interface CampaignNode {
  id: number; // 1 to 10
  x: number; // percentage coordinate 10-90
  y: number; // percentage coordinate 10-90
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  completed: boolean;
  cardBack: string;
  cardFace: string;
  aiName: string;
  challenge?: 'SUPPLY_CHAIN' | 'AMBUSH' | 'WEAK_SOLDIERS' | 'UNGA_BUNGA' | 'BIG_BOI' | null;
}

export interface CampaignState {
  nodes: CampaignNode[];
  currentNodeIndex: number; // 0 to 9
  areasCleared: number;
  currentWinStreak: number;
  bestWinStreak: number;
  rulesFormat: 'STREET' | 'PRO';
  theme?: CampaignThemeType;
  details?: CampaignDetail[];
}

const LOCAL_STORAGE_KEY = 'battle_card_campaign_v2';

const BOSS_NAMES = [
  'The Dark Lord',
  'Temporal Wizard',
  'Matt',
  'The King of Hearts',
  'Void Knight',
  'Oracle of Doom',
  'The Leviathan'
];

const EASY_AI_COSMETICS = {
  backs: ['battle', 'casino_style', 'retro_pixels', 'gothic_scroll'],
  faces: ['classic', 'casino_style', 'retro_pixels', 'gothic_scroll'],
  names: ['Squire', 'Peasant', 'Joe', 'Fire Spirit', 'Trainee', 'Novice Mage', 'Intern Isaac'],
};

const MEDIUM_AI_COSMETICS = {
  backs: ['neon_matrix', 'futuristic_tech', 'crimson_fire', 'japanese_calligraphy', 'beach_breeze'],
  faces: ['neon_matrix', 'futuristic_tech', 'crimson_fire', 'japanese_calligraphy', 'beach_breeze'],
  names: ['Jester', 'Guard', 'Knight', 'Scholar', 'Thief', 'Magician', 'Priest'],
};

const HARD_AI_COSMETICS = {
  backs: ['cosmic_void', 'minimalist_charcoal', 'glitch', 'royal_gold', 'beach_breeze'],
  faces: ['cosmic_void', 'minimalist_charcoal', 'glitch', 'royal_gold', 'beach_breeze'],
  names: ['Jester', 'Royal Tactician', 'Prince of Aces', 'Captain Clubs', 'Anime Protagonist', 'Mysterious Wanderer', 'Joker Paladin'],
};

export function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function distanceToSegment(x: number, y: number, x1: number, y1: number, x2: number, y2: number): number {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.hypot(dx, dy);
}

export function generateDetailsForTheme(theme: CampaignThemeType, nodes: CampaignNode[]): CampaignDetail[] {
  const details: CampaignDetail[] = [];
  const emojis: Record<CampaignThemeType, string[]> = {
    GRASSLANDS: ['🌲', '🌳', '🌸', '🌷', '🌼', '🍀', '🌿', '🌱'],
    DUNGEON: ['💀', '🦴', '🩸', '🕸️', '🕯️', '🦇'],
    DESERT: ['🐫', '🦂', '🦎', '🐍', '💀', '🏺', '🦅'],
    GLACIER: ['❄️', '🧊', '🏔️', '🐧', '⛄', '🧤', '🏂'],
    COAST: ['🌴', '🏖️', '🐚', '🦀', '🌊', '🌊', '⛵', '🐙'],
    MOUNTAIN: ['⛰️', '🗻', '🪵', '🦅', '🐐', '⛺', '🌲']
  };

  const pool = emojis[theme];
  let idCounter = 0;

  for (let i = 0; i < 80; i++) {
    const x = 5 + Math.random() * 90;
    const y = 8 + Math.random() * 80;

    let tooClose = false;
    for (const node of nodes) {
      if (Math.hypot(x - node.x, y - node.y) < 14) {
        tooClose = true;
        break;
      }
    }

    if (tooClose) {
      continue;
    }

    // Ensure the detail does not overlap with the visual path segments between nodes
    for (let j = 0; j < nodes.length - 1; j++) {
      const n1 = nodes[j];
      const n2 = nodes[j + 1];
      if (distanceToSegment(x, y, n1.x, n1.y, n2.x, n2.y) < 11.5) {
        tooClose = true;
        break;
      }
    }

    // Ensure details do not overlap with other already placed details
    if (!tooClose) {
      for (const existing of details) {
        if (Math.hypot(x - existing.x, y - existing.y) < 12) {
          tooClose = true;
          break;
        }
      }
    }

    if (!tooClose) {
      details.push({
        id: `detail-${theme}-${idCounter++}`,
        type: theme,
        emoji: pool[Math.floor(Math.random() * pool.length)],
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        scale: 0.8 + Math.random() * 0.5
      });
    }
  }

  return details.slice(0, 18);
}

export function generateCampaignMap(
  rulesFormat: 'STREET' | 'PRO', 
  areasCleared: number = 0, 
  bestWinStreak: number = 0,
  currentWinStreak: number = 0
): CampaignState {
  const nodes: CampaignNode[] = [];
  const themes: CampaignThemeType[] = ['GRASSLANDS', 'DUNGEON', 'DESERT', 'GLACIER', 'COAST', 'MOUNTAIN'];
  
  let lastTheme: CampaignThemeType | undefined;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.theme) {
        lastTheme = parsed.theme;
      }
    }
  } catch (e) {}

  const filteredThemes = lastTheme ? themes.filter(t => t !== lastTheme) : themes;
  const theme = getRandomElement(filteredThemes.length > 0 ? filteredThemes : themes);
  
  for (let i = 0; i < 10; i++) {
    const baseVal = i / 9; // 0 to 1
    const yNoise = (Math.random() - 0.5) * 5;
    const y = Math.max(10, Math.min(90, 88 - baseVal * 74 + yNoise));
    
    let x = 50;
    if (i === 0) {
      x = 20 + Math.random() * 60;
    } else {
      const prevNode = nodes[i - 1];
      let attempts = 0;
      while (attempts < 30) {
        const candidateX = 15 + Math.random() * 70;
        const dist = Math.hypot(candidateX - prevNode.x, y - prevNode.y);
        if (dist > 14 && Math.abs(candidateX - prevNode.x) > 10) {
          x = candidateX;
          break;
        }
        attempts++;
        x = candidateX;
      }
    }
    
    let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'EASY';
    let cardBack = 'battle';
    let cardFace = 'classic';
    let aiName = 'CPU';
    
    if (i < 3) {
      difficulty = 'EASY';
      cardBack = getRandomElement(EASY_AI_COSMETICS.backs);
      cardFace = getRandomElement(EASY_AI_COSMETICS.faces);
      aiName = getRandomElement(EASY_AI_COSMETICS.names);
    } else if (i < 7) {
      difficulty = 'MEDIUM';
      cardBack = getRandomElement(MEDIUM_AI_COSMETICS.backs);
      cardFace = getRandomElement(MEDIUM_AI_COSMETICS.faces);
      aiName = getRandomElement(MEDIUM_AI_COSMETICS.names);
    } else {
      difficulty = 'HARD';
      cardBack = getRandomElement(HARD_AI_COSMETICS.backs);
      cardFace = getRandomElement(HARD_AI_COSMETICS.faces);
      if (i === 9) {
        aiName = getRandomElement(BOSS_NAMES);
      } else {
        aiName = getRandomElement(HARD_AI_COSMETICS.names);
      }
    }

    let challenge: CampaignNode['challenge'] = null;
    if (i === 9) {
      const challenges: CampaignNode['challenge'][] = ['SUPPLY_CHAIN', 'AMBUSH', 'WEAK_SOLDIERS', 'UNGA_BUNGA', 'BIG_BOI'];
      challenge = getRandomElement(challenges);
    }

    nodes.push({
      id: i + 1,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      difficulty,
      completed: false,
      cardBack,
      cardFace,
      aiName,
      challenge
    });
  }

  const details = generateDetailsForTheme(theme, nodes);

  return {
    nodes,
    currentNodeIndex: 0,
    areasCleared,
    currentWinStreak,
    bestWinStreak,
    rulesFormat,
    theme,
    details
  };
}

export function loadCampaign(): CampaignState {
  try {
    const progressionRaw = localStorage.getItem('battle_card_progression_v1');
    let progressionCampaign: CampaignState | null = null;
    if (progressionRaw) {
      try {
        const prog = JSON.parse(progressionRaw);
        if (prog && prog.campaignState) {
          progressionCampaign = prog.campaignState;
        }
      } catch (err) {}
    }

    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    let state: any = null;
    if (raw) {
      state = JSON.parse(raw);
    }

    if (progressionCampaign) {
      let chooseProgression = false;
      if (!state) {
        chooseProgression = true;
      } else {
        const localCleared = state.areasCleared || 0;
        const progCleared = progressionCampaign.areasCleared || 0;
        if (progCleared > localCleared) {
          chooseProgression = true;
        } else if (progCleared === localCleared) {
          const localNodeIdx = state.currentNodeIndex || 0;
          const progNodeIdx = progressionCampaign.currentNodeIndex || 0;
          if (progNodeIdx > localNodeIdx) {
            chooseProgression = true;
          } else if (progNodeIdx === localNodeIdx) {
            const localCompletedCount = state.nodes?.filter((n: any) => n.completed).length || 0;
            const progCompletedCount = progressionCampaign.nodes?.filter((n: any) => n.completed).length || 0;
            if (progCompletedCount > localCompletedCount) {
              chooseProgression = true;
            }
          }
        }
      }

      if (chooseProgression) {
        state = progressionCampaign;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
      }
    }

    if (state && Array.isArray(state.nodes) && state.nodes.length === 10) {
      // Ensure defaults are present if any fields are missing
      if (state.areasCleared === undefined) state.areasCleared = 0;
      if (state.currentWinStreak === undefined) state.currentWinStreak = 0;
      if (state.bestWinStreak === undefined) state.bestWinStreak = 0;
      if (state.rulesFormat === undefined) state.rulesFormat = 'STREET';
      // Patch missing challenge for final node
      if (!state.nodes[9].challenge) {
          const challenges: CampaignNode['challenge'][] = ['SUPPLY_CHAIN', 'AMBUSH', 'WEAK_SOLDIERS', 'UNGA_BUNGA', 'BIG_BOI'];
          state.nodes[9].challenge = getRandomElement(challenges);
          saveCampaign(state);
      }
      if (!state.theme) {
          const themes: CampaignThemeType[] = ['GRASSLANDS', 'DUNGEON', 'DESERT', 'GLACIER', 'COAST', 'MOUNTAIN'];
          state.theme = getRandomElement(themes);
          state.details = generateDetailsForTheme(state.theme, state.nodes);
          saveCampaign(state);
      }
      return state;
    }
  } catch (e) {
    console.error('Failed to load campaign state:', e);
  }
  // If not found or invalid, generate a default STREET campaign
  const defaultState = generateCampaignMap('STREET');
  saveCampaign(defaultState);
  return defaultState;
}

export function saveCampaign(state: CampaignState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    
    // Write into the modern progression JSON so cloud-sync can immediately capture it
    const progressionRaw = localStorage.getItem('battle_card_progression_v1');
    if (progressionRaw) {
      try {
        const prog = JSON.parse(progressionRaw);
        if (prog) {
          prog.campaignState = state;
          localStorage.setItem('battle_card_progression_v1', JSON.stringify(prog));
        }
      } catch (err) {
        console.error('Failed to update campaign state inside progression storage:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('campaign-updated'));
    }
  } catch (e) {
    console.error('Failed to save campaign state:', e);
  }
}
