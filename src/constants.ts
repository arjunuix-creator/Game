import { Character, Item } from "./types";

export const CHARACTERS: Character[] = [
  {
    id: 'ankur',
    name: 'Ankur',
    gender: 'male',
    ability: 'High Jump',
    description: 'Can reach platforms others cannot.',
    color: '#3b82f6',
    stats: { speed: 5, jump: 16, strength: 5 }
  },
  {
    id: 'arjun',
    name: 'Arjun',
    gender: 'male',
    ability: 'Fast Sprint',
    description: 'The fastest runner in the pioneers.',
    color: '#ef4444',
    stats: { speed: 10, jump: 12, strength: 4 }
  },
  {
    id: 'vishnu',
    name: 'Vishnu',
    gender: 'male',
    ability: 'Double Jump',
    description: 'Can jump again while in mid-air.',
    color: '#10b981',
    stats: { speed: 6, jump: 13, strength: 5 }
  },
  {
    id: 'suprya',
    name: 'Suprya',
    gender: 'female',
    ability: 'Float',
    description: 'Can glide through the air slowly.',
    color: '#f59e0b',
    stats: { speed: 5, jump: 12, strength: 4 }
  },
  {
    id: 'manisha',
    name: 'Manisha',
    gender: 'female',
    ability: 'Shield',
    description: 'Can take one extra hit without dying.',
    color: '#8b5cf6',
    stats: { speed: 5, jump: 12, strength: 7 }
  },
  {
    id: 'kiron',
    name: 'Kiron',
    gender: 'male',
    ability: 'Wall Climb',
    description: 'Can stick to and climb up walls.',
    color: '#ec4899',
    stats: { speed: 6, jump: 12, strength: 6 }
  },
  {
    id: 'praveen',
    name: 'Praveen',
    gender: 'male',
    ability: 'Dash',
    description: 'Can perform a quick forward burst.',
    color: '#06b6d4',
    stats: { speed: 7, jump: 12, strength: 5 }
  },
  {
    id: 'rayan',
    name: 'Rayan',
    gender: 'male',
    ability: 'Strength',
    description: 'Can break special blocks by jumping into them.',
    color: '#78350f',
    stats: { speed: 4, jump: 11, strength: 10 }
  },
  {
    id: 'sonali',
    name: 'Sonali',
    gender: 'female',
    ability: 'Magnet',
    description: 'Attracts nearby coins automatically.',
    color: '#eab308',
    stats: { speed: 6, jump: 12, strength: 4 }
  },
  {
    id: 'juhi',
    name: 'Juhi',
    gender: 'female',
    ability: 'Small',
    description: 'Can fit through narrow gaps.',
    color: '#f43f5e',
    stats: { speed: 7, jump: 11, strength: 3 }
  }
];

export const ITEMS: Item[] = [
  { id: 'outfit_ninja', name: 'Ninja Suit', type: 'outfit', price: 500, description: 'A sleek black ninja outfit.' },
  { id: 'outfit_gold', name: 'Golden Armor', type: 'outfit', price: 2000, description: 'Shiny armor made of pure gold.' },
  { id: 'skill_triple_jump', name: 'Triple Jump', type: 'skill', price: 1000, description: 'Unlock the ability to jump three times.' },
  { id: 'skill_fireball', name: 'Fireball', type: 'skill', price: 1500, description: 'Shoot fireballs at enemies.' }
];

export const GAME_CONSTANTS = {
  GRAVITY: 0.5,
  FRICTION: 0.8,
  TILE_SIZE: 32,
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  FPS: 60
};
