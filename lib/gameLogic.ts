import {
  ALL_CARDS, ALL_DIRS, DIR_LABEL, HAND_SIZE,
  Card, Dir, GameState, PlacedCard,
} from './gameConstants';

// ─── Utilities ───────────────────────────────────────────────────────────────

export function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function d6(): number { return Math.floor(Math.random() * 6) + 1; }
function d4(): number { return Math.floor(Math.random() * 4) + 1; }

function randDirs(): Dir[] {
  const count = Math.floor(Math.random() * 3) + 1; // 1–3
  return shuffle(ALL_DIRS).slice(0, count);
}

// Returns the grid index that dir points to from idx, or null if off-board
export function dirOffset(dir: Dir, idx: number): number | null {
  const r = Math.floor(idx / 4), c = idx % 4;
  const moves: Record<Dir, [number, number]> = {
    N:  [-1,  0], S:  [ 1,  0], E:  [ 0,  1], W:  [ 0, -1],
    NE: [-1,  1], SE: [ 1,  1], SW: [ 1, -1], NW: [-1, -1],
  };
  const [dr, dc] = moves[dir];
  const nr = r + dr, nc = c + dc;
  if (nr < 0 || nr > 3 || nc < 0 || nc > 3) return null;
  return nr * 4 + nc;
}

// ─── Deck / Game init ─────────────────────────────────────────────────────────

export function makeDeck(): Card[] {
  const legendary = shuffle(ALL_CARDS.filter(c => c.tier === 'legendary'));
  const rare      = shuffle(ALL_CARDS.filter(c => c.tier === 'rare'));
  const common    = shuffle(ALL_CARDS.filter(c => c.tier === 'common'));
  const picked = [
    ...legendary.slice(0, 1),
    ...rare.slice(0, 2),
    ...common.slice(0, 7),
  ];
  return shuffle(picked).map(c => ({ ...c, dirs: randDirs() }));
}

export function initGame(): GameState {
  const d1 = makeDeck(), d2 = makeDeck();
  return {
    grid: Array(16).fill(null),
    hands: [d1.slice(0, HAND_SIZE), d2.slice(0, HAND_SIZE)],
    decks: [d1.slice(HAND_SIZE),    d2.slice(HAND_SIZE)],
    selected: null,
    turn: 0,
    scores: [0, 0],
    over: false,
    phase: 'place',
    lastPlaced: null,
    battleTarget: null,
  };
}

export function checkGameOver(state: GameState): boolean {
  const allFilled = state.grid.every(c => c !== null);
  const noCards   =
    state.hands[0].length === 0 && state.hands[1].length === 0 &&
    state.decks[0].length === 0 && state.decks[1].length === 0;
  return allFilled || noCards;
}

// ─── Chain reaction after a tile changes owner ───────────────────────────────
// The newly-owned card fires its arrows at all adjacent enemies and resolves
// each battle immediately (no player interaction). Returns updated grid+scores
// and appended log lines.

function resolveChain(
  grid: (PlacedCard | null)[],
  scores: [number, number],
  originIdx: number,
  logs: string[],
  visited: Set<number> = new Set(),
): void {
  if (visited.has(originIdx)) return;
  visited.add(originIdx);

  const card = grid[originIdx];
  if (!card) return;

  for (const dir of card.dirs) {
    const targetIdx = dirOffset(dir, originIdx);
    if (targetIdx === null) continue;
    const target = grid[targetIdx];
    if (!target || target.owner === card.owner) continue;

    // Auto-battle
    const atkRoll = d6();
    const defRoll = d4();
    const totalAtk = card.atk + atkRoll;
    const totalDef = target.def + defRoll;
    const opp = (1 - card.owner) as 0 | 1;

    if (totalAtk > totalDef) {
      grid[targetIdx] = { ...target, owner: card.owner };
      scores[card.owner]++;
      scores[opp] = Math.max(0, scores[opp] - 1);
      logs.push(`  ↪ Chain: ${card.name} (${totalAtk}) captures ${target.name} (${totalDef})!`);
      // Recurse: the newly flipped card fires its own arrows
      resolveChain(grid, scores, targetIdx, logs, visited);
    } else {
      logs.push(`  ↪ Chain: ${card.name} (${totalAtk}) vs ${target.name} (${totalDef}) — holds.`);
    }
  }
}

// ─── Place ────────────────────────────────────────────────────────────────────

export function doPlace(state: GameState, cell: number): { newState: GameState; log: string } {
  if (state.selected === null) return { newState: state, log: 'Pick a card from your hand first.' };
  if (state.grid[cell] !== null) return { newState: state, log: 'That square is occupied — place on an empty square.' };

  const t = state.turn;
  const opp = (1 - t) as 0 | 1;
  const card = state.hands[t][state.selected];
  const newGrid = [...state.grid] as (PlacedCard | null)[];
  newGrid[cell] = { ...card, owner: t as 0 | 1 };

  const newHands: [Card[], Card[]] = [[...state.hands[0]], [...state.hands[1]]];
  newHands[t].splice(state.selected, 1);

  const newDecks: [Card[], Card[]] = [[...state.decks[0]], [...state.decks[1]]];
  if (newDecks[t].length > 0) newHands[t].push(newDecks[t].shift()!);

  const newScores: [number, number] = [...state.scores] as [number, number];
  newScores[t]++;

  // Find first enemy adjacent to any of this card's dirs
  let battleTarget: number | null = null;
  for (const dir of card.dirs) {
    const targetIdx = dirOffset(dir, cell);
    if (targetIdx !== null && newGrid[targetIdx] && newGrid[targetIdx]!.owner === opp) {
      battleTarget = targetIdx;
      break;
    }
  }

  let log = '';
  let phase: GameState['phase'] = 'place';

  if (battleTarget !== null) {
    phase = 'battle';
    const defender = newGrid[battleTarget]!;
    const dirsStr = card.dirs.join(', ');
    log = `${card.name} placed [${dirsStr}] — can attack ${defender.name} (DEF ${defender.def})! Click the highlighted square to battle, or skip.`;
  } else {
    const dirsStr = card.dirs.join(', ');
    log = `${card.name} placed [${dirsStr}] — no adjacent enemies to battle.`;
  }

  const newState: GameState = {
    ...state,
    grid: newGrid,
    hands: newHands,
    decks: newDecks,
    scores: newScores,
    selected: null,
    lastPlaced: cell,
    phase,
    battleTarget,
    turn: phase === 'battle' ? t : opp,
  };

  if (phase !== 'battle') {
    const over = checkGameOver(newState);
    return { newState: { ...newState, over }, log };
  }

  return { newState, log };
}

// ─── Battle ───────────────────────────────────────────────────────────────────

export function doBattle(state: GameState): { newState: GameState; log: string } {
  const t = state.turn;
  const opp = (1 - t) as 0 | 1;
  const attacker = state.grid[state.lastPlaced!]!;
  const defender = state.grid[state.battleTarget!]!;

  const atkRoll = d6();
  const defRoll = d4();
  const totalAtk = attacker.atk + atkRoll;
  const totalDef = defender.def + defRoll;

  const newGrid = [...state.grid] as (PlacedCard | null)[];
  const newScores: [number, number] = [...state.scores] as [number, number];
  const logs: string[] = [];

  if (totalAtk > totalDef) {
    // Attacker wins — defender's square flips, card stays
    newGrid[state.battleTarget!] = { ...defender, owner: t as 0 | 1 };
    newScores[t]++;
    newScores[opp] = Math.max(0, newScores[opp] - 1);
    logs.push(`⚔️ ${attacker.name} ATK ${attacker.atk}+🎲${atkRoll}=${totalAtk} vs ${defender.name} DEF ${defender.def}+🎲${defRoll}=${totalDef} — captured!`);
    // Chain: the newly captured card fires its arrows
    resolveChain(newGrid, newScores, state.battleTarget!, logs, new Set([state.lastPlaced!]));
  } else {
    // Defender wins — attacker's square flips, card stays
    newGrid[state.lastPlaced!] = { ...attacker, owner: opp as 0 | 1 };
    newScores[opp]++;
    newScores[t] = Math.max(0, newScores[t] - 1);
    logs.push(`🛡️ ${defender.name} DEF ${defender.def}+🎲${defRoll}=${totalDef} holds vs ATK ${attacker.atk}+🎲${atkRoll}=${totalAtk} — ${attacker.name}'s square lost!`);
    // Chain: the newly taken card fires its arrows
    resolveChain(newGrid, newScores, state.lastPlaced!, logs, new Set([state.battleTarget!]));
  }

  const newState: GameState = {
    ...state,
    grid: newGrid,
    scores: newScores,
    phase: 'place',
    lastPlaced: null,
    battleTarget: null,
    turn: opp,
  };

  const over = checkGameOver(newState);
  return { newState: { ...newState, over }, log: logs.join('\n') };
}

// ─── Skip ─────────────────────────────────────────────────────────────────────

export function skipBattle(state: GameState): { newState: GameState; log: string } {
  const a = state.grid[state.lastPlaced!]!;
  const opp = (1 - state.turn) as 0 | 1;
  const newState: GameState = {
    ...state,
    phase: 'place',
    lastPlaced: null,
    battleTarget: null,
    turn: opp,
  };
  const over = checkGameOver(newState);
  return { newState: { ...newState, over }, log: `${a.name} placed — battle skipped. Turn ends.` };
}
