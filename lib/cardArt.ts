// ─────────────────────────────────────────────────────────────────────────────
// Card art — edit the emoji or replace with an image URL per card name.
// To use an image instead of emoji, change `emoji` to `image: '/cards/dragon.png'`
// and update the CardArt component in components/CardArt.tsx to render <img> instead.
// ─────────────────────────────────────────────────────────────────────────────

export const CARD_ART: Record<string, string> = {
  // Legendary
  'Dragon':       '🐉',
  'Sphinx':       '🦁',
  'Ice Giant':    '🧊',
  // Rare
  'Sven':         '🪖',
  'Conan':        '⚔️',
  'Joe Battle':   '🛡️',
  // Common
  'Goblin':       '👺',
  'Beaver':       '🦫',
  'Battle Goat':  '🐐',
  'Orc':          '👹',
  'Zergling':     '🐛',
  'Holy Ravioli': '🍝',
  'Raven':        '🐦‍⬛',
  'Wasp':         '🐝',
  'Demon':        '😈',
  'Knight':       '♞',
  'Fighter':      '🥊',
  'Rat':          '🐀',
  'Hyena':        '🐾',
  'Cat':          '🐱',
};

export function getArt(name: string): string {
  return CARD_ART[name] ?? '❓';
}
