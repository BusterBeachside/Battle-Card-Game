
export interface DailyQuest {
  id: string;
  type: 'PLAY_GAMES' | 'DEAL_DAMAGE' | 'CONSCRIPT_SOLDIERS' | 'PLAY_TACTICS' | 'KILL_SOLDIERS' | 'CLEAR_CAMPAIGN';
  description: string;
  target: number;
  current: number;
  goldReward: number;
  completed: boolean;
  claimed: boolean;
}

export interface ProgressionData {
  playerName: string;
  level: number;
  xp: number;
  gold: number;
  streakCount: number; // 0 to 7
  lastLoginDate: string; // "YYYY-MM-DD"
  claimedStreakToday: boolean;
  questsDate: string; // "YYYY-MM-DD"
  quests: DailyQuest[];
  freeRerollUsed?: boolean;
  claimedTutorialRewards?: string[];
  claimedAllTutorialsBonus?: boolean;
  unlockedCardBacks?: string[];
  selectedCardBack?: string;
  unlockedCardFaces?: string[];
  selectedCardFace?: string;
}

export interface SessionStats {
  damageDealt: number;
  conscriptedCount: number;
  tacticsPlayed: number;
  killsCount: number;
}

const LOCAL_STORAGE_KEY = 'battle_card_progression_v1';

export function getDefaultProgression(): ProgressionData {
  return {
    playerName: 'Player 1',
    level: 1,
    xp: 0,
    gold: 150, // Nice initial starting gold
    streakCount: 0,
    lastLoginDate: '',
    claimedStreakToday: false,
    questsDate: '',
    quests: getDefaultQuests(),
    freeRerollUsed: false,
    claimedTutorialRewards: [],
    claimedAllTutorialsBonus: false,
    unlockedCardBacks: ['battle'],
    selectedCardBack: 'battle',
    unlockedCardFaces: ['classic'],
    selectedCardFace: 'classic'
  };
}

export function getHarderQuestPool(): DailyQuest[] {
  return [
    {
      id: 'quest_play',
      type: 'PLAY_GAMES',
      description: 'Play 3 matches (vs CPU or Online)',
      target: 3,
      current: 0,
      goldReward: 150,
      completed: false,
      claimed: false
    },
    {
      id: 'quest_damage',
      type: 'DEAL_DAMAGE',
      description: 'Deal 50 combat damage',
      target: 50,
      current: 0,
      goldReward: 200,
      completed: false,
      claimed: false
    },
    {
      id: 'quest_conscript',
      type: 'CONSCRIPT_SOLDIERS',
      description: 'Conscript 8 Soldiers',
      target: 8,
      current: 0,
      goldReward: 150,
      completed: false,
      claimed: false
    },
    {
      id: 'quest_tactics',
      type: 'PLAY_TACTICS',
      description: 'Play 6 Tactics cards',
      target: 6,
      current: 0,
      goldReward: 180,
      completed: false,
      claimed: false
    },
    {
      id: 'quest_kills',
      type: 'KILL_SOLDIERS',
      description: 'Destroy 8 enemy Soldiers',
      target: 8,
      current: 0,
      goldReward: 205,
      completed: false,
      claimed: false
    },
    {
      id: 'quest_clear_campaign',
      type: 'CLEAR_CAMPAIGN',
      description: 'Clear a Campaign map (defeat Boss)',
      target: 1,
      current: 0,
      goldReward: 300,
      completed: false,
      claimed: false
    }
  ];
}

export function getDefaultQuests(): DailyQuest[] {
  const pool = getHarderQuestPool();
  // Shuffle and pick 3
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export function getXpNeeded(level: number): number {
  return level * 500;
}

// Convert local date to standard date string YYYY-MM-DD
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateStr(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getStreakReward(day: number): number {
  const rewards = [50, 75, 100, 150, 200, 250, 500];
  const index = Math.max(0, Math.min(6, day - 1));
  return rewards[index];
}

export function loadProgression(): ProgressionData {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const todayStr = getTodayString();
    
    let data: ProgressionData;
    if (raw) {
      data = JSON.parse(raw);
    } else {
      data = getDefaultProgression();
    }

    // Daily Login Streak Progression Check
    if (!data.lastLoginDate) {
      data.streakCount = 1;
      data.claimedStreakToday = false;
      data.lastLoginDate = todayStr;
    } else if (data.lastLoginDate !== todayStr) {
      const dLast = parseDateStr(data.lastLoginDate);
      const dToday = parseDateStr(todayStr);
      // Calculate day difference
      const diffDays = Math.round((dToday.getTime() - dLast.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Yes, consecutive day! Progress streak
        data.claimedStreakToday = false;
        if (data.streakCount >= 7) {
          data.streakCount = 1; // Restart streak
        } else {
          data.streakCount += 1;
        }
      } else if (diffDays > 1) {
        // Missed login day, reset streak to 1
        data.streakCount = 1;
        data.claimedStreakToday = false;
      }
      data.lastLoginDate = todayStr;
    }

    // Daily Quests Rollover Check
    if (!data.questsDate) {
      data.quests = getDefaultQuests();
      data.questsDate = todayStr;
      data.freeRerollUsed = false;
    } else if (data.questsDate !== todayStr) {
      // Re-generate / reset quests for the new day
      data.quests = getDefaultQuests();
      data.questsDate = todayStr;
      data.freeRerollUsed = false;
    }

    // Backward compatibility for newly added properties
    if (!data.playerName) data.playerName = 'Player 1';
    if (!data.quests) data.quests = getDefaultQuests();
    if (data.freeRerollUsed === undefined) data.freeRerollUsed = false;
    if (!data.claimedTutorialRewards) data.claimedTutorialRewards = [];
    if (data.claimedAllTutorialsBonus === undefined) data.claimedAllTutorialsBonus = false;
    if (!data.unlockedCardBacks) data.unlockedCardBacks = ['battle'];
    if (!data.selectedCardBack) data.selectedCardBack = 'battle';
    if (!data.unlockedCardFaces) data.unlockedCardFaces = ['classic'];
    if (!data.selectedCardFace) data.selectedCardFace = 'classic';

    saveProgression(data);
    return data;
  } catch (e) {
    console.error("Failed to load progression:", e);
    return getDefaultProgression();
  }
}

export function saveProgression(data: ProgressionData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save progression:", e);
  }
}

export function updateQuestsProgress(
  data: ProgressionData, 
  stats: SessionStats, 
  isQualifying: boolean,
  isCampaignCleared: boolean = false
): ProgressionData {
  if (!isQualifying) return data;

  const updatedQuests = data.quests.map(q => {
    if (q.claimed) return q;

    let delta = 0;
    switch (q.type) {
      case 'PLAY_GAMES':
        delta = 1; // 1 game played
        break;
      case 'DEAL_DAMAGE':
        delta = stats.damageDealt;
        break;
      case 'CONSCRIPT_SOLDIERS':
        delta = stats.conscriptedCount;
        break;
      case 'PLAY_TACTICS':
        delta = stats.tacticsPlayed;
        break;
      case 'KILL_SOLDIERS':
        delta = stats.killsCount;
        break;
      case 'CLEAR_CAMPAIGN':
        delta = isCampaignCleared ? 1 : 0;
        break;
    }

    const current = Math.min(q.target, q.current + delta);
    const completed = current >= q.target;
    return {
      ...q,
      current,
      completed
    };
  });

  return {
    ...data,
    quests: updatedQuests
  };
}

export function addXpAndGold(
  data: ProgressionData, 
  xpGained: number, 
  goldGained: number
): { updatedData: ProgressionData; levelUpGains: { level: number; gold: number }[] } {
  let tempXp = data.xp + xpGained;
  let tempLevel = data.level;
  let tempGold = data.gold + goldGained;
  const gains: { level: number; gold: number }[] = [];

  while (tempXp >= getXpNeeded(tempLevel)) {
    tempXp -= getXpNeeded(tempLevel);
    tempLevel += 1;
    const levelUpReward = tempLevel * 100;
    tempGold += levelUpReward;
    gains.push({ level: tempLevel, gold: levelUpReward });
  }

  const updatedData: ProgressionData = {
    ...data,
    level: tempLevel,
    xp: tempXp,
    gold: tempGold
  };

  saveProgression(updatedData);

  return {
    updatedData,
    levelUpGains: gains
  };
}

export function rerollQuest(data: ProgressionData, questId: string): ProgressionData {
  if (data.freeRerollUsed) return data; // if already used, do nothing
  
  const pool = getHarderQuestPool();
  const currentIds = data.quests.map(q => q.id);
  // Filter pool to elements NOT in currentIds
  const availablePool = pool.filter(q => !currentIds.includes(q.id));
  
  if (availablePool.length === 0) return data; // fallback safety
  
  const randomNewQuest = availablePool[Math.floor(Math.random() * availablePool.length)];
  
  const updatedQuests = data.quests.map(q => {
    if (q.id === questId) {
      return { ...randomNewQuest };
    }
    return q;
  });
  
  const updatedData = {
    ...data,
    quests: updatedQuests,
    freeRerollUsed: true
  };
  
  saveProgression(updatedData);
  return updatedData;
}
