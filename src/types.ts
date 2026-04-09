export interface Character {
  id: string;
  name: string;
  gender: 'male' | 'female';
  ability: string;
  description: string;
  color: string;
  stats: {
    speed: number;
    jump: number;
    strength: number;
  };
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  selectedCharacterId: string;
  level: number;
  xp: number;
  coins: number;
  inventory: string[];
  unlockedOutfits: string[];
  unlockedSkills: string[];
  equippedOutfitId?: string;
  lastDailyChallenge?: string;
  gameLevel: number;
}

export interface GameState {
  score: number;
  lives: number;
  coins: number;
  level: number;
  currentLevel: number;
  isGameOver: boolean;
  isPaused: boolean;
}

export interface Item {
  id: string;
  name: string;
  type: 'outfit' | 'skill' | 'consumable';
  price: number;
  description: string;
}
