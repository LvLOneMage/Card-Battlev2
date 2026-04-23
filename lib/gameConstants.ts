export type Dir = 'N' | 'S' | 'E' | 'W' | 'NE' | 'SE' | 'SW' | 'NW';
export type Tier = 'common' | 'rare' | 'legendary';

export interface CardTemplate {
  name: string;
  atk: number;
  def: number;
  tier: Tier;
}

export interface Card extends CardTemplate {
  dirs: Dir[];  // 1–3 directions
}

export interface PlacedCard extends Card {
  owner: 0 | 1;
}

export type Phase = 'place' | 'battle';

export interface GameState {
  grid: (PlacedCard | null)[];
  hands: [Card[], Card[]];
  decks: [Card[], Card[]];
  selected: number | null;
  turn: 0 | 1;
  scores: [number, number];
  over: boolean;
  phase: Phase;
  lastPlaced: number | null;
  battleTarget: number | null;
}

export const ALL_DIRS: Dir[] = ['N', 'S', 'E', 'W', 'NE', 'SE', 'SW', 'NW'];

export const DIR_ARROW: Record<Dir, string> = {
  N: '↑', S: '↓', E: '→', W: '←',
  NE: '↗', SE: '↘', SW: '↙', NW: '↖',
};

export const DIR_LABEL: Record<Dir, string> = {
  N: 'North', S: 'South', E: 'East', W: 'West',
  NE: 'Northeast', SE: 'Southeast', SW: 'Southwest', NW: 'Northwest',
};

export const DECK_SIZE = 10;
export const HAND_SIZE = 5;

export const ALL_CARDS: CardTemplate[] = [
  // Legendary
  { name: 'Dragon',       atk: 10, def: 10, tier: 'legendary' },
  { name: 'Sphinx',       atk: 9,  def: 10, tier: 'legendary' },
  { name: 'Ice Giant',    atk: 8,  def: 10, tier: 'legendary' },
  // Rare
  { name: 'Sven',         atk: 7,  def: 7,  tier: 'rare' },
  { name: 'Conan',        atk: 10, def: 4,  tier: 'rare' },
  { name: 'Joe Battle',   atk: 9,  def: 15, tier: 'rare' },
  // Common
  { name: 'Goblin',       atk: 2,  def: 1,  tier: 'common' },
  { name: 'Beaver',       atk: 1,  def: 1,  tier: 'common' },
  { name: 'Battle Goat',  atk: 2,  def: 2,  tier: 'common' },
  { name: 'Orc',          atk: 3,  def: 3,  tier: 'common' },
  { name: 'Zergling',     atk: 1,  def: 3,  tier: 'common' },
  { name: 'Holy Ravioli', atk: 1,  def: 3,  tier: 'common' },
  { name: 'Raven',        atk: 1,  def: 3,  tier: 'common' },
  { name: 'Wasp',         atk: 2,  def: 1,  tier: 'common' },
  { name: 'Demon',        atk: 3,  def: 3,  tier: 'common' },
  { name: 'Knight',       atk: 2,  def: 2,  tier: 'common' },
  { name: 'Fighter',      atk: 2,  def: 1,  tier: 'common' },
  { name: 'Rat',          atk: 1,  def: 1,  tier: 'common' },
  { name: 'Hyena',        atk: 3,  def: 1,  tier: 'common' },
  { name: 'Cat',          atk: 2,  def: 9,  tier: 'common' },
];
