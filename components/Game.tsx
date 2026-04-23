'use client';

import { useEffect, useState, useCallback } from 'react';
import { GameState, Card } from '../lib/gameConstants';
import CardInHand from './CardInHand';
import GridCell from './GridCell';

interface Props {
  roomCode: string;
  playerIndex: 0 | 1;
}

export default function Game({ roomCode, playerIndex }: Props) {
  const [state, setState] = useState<GameState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 6));

  // Subscribe to Pusher
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    import('pusher-js').then(({ default: PusherJS }) => {
      const pusher = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });
      const channel = pusher.subscribe(`game-${roomCode}`);

      channel.bind('game-updated', (data: { state: GameState }) => {
        setState(data.state);
        addLog(data.state.turn === playerIndex ? 'Your turn!' : "Opponent's turn");
      });

      cleanup = () => pusher.unsubscribe(`game-${roomCode}`);
    });

    // Fetch initial state
    fetch(`/api/create-room`, { method: 'GET' }).catch(() => {});
    fetchState();

    return () => cleanup?.();
  }, [roomCode]);

  async function fetchState() {
    // We get state from pusher events; on first load fetch via join
    // State is already in memory from the join/create — Pusher will sync it
    // For initial load, re-join won't work so we just wait for first event
    // Instead, trigger a no-op to get current state broadcast
    const res = await fetch('/api/game-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: roomCode, action: 'get' }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.state) setState(data.state);
    }
  }

  async function sendAction(action: string, payload?: object) {
    setLoading(true);
    try {
      const res = await fetch('/api/game-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: roomCode, action, payload }),
      });
      const data = await res.json();
      if (data.state) setState(data.state);
    } finally {
      setLoading(false);
    }
  }

  function handleCardSelect(idx: number) {
    if (!state || state.turn !== playerIndex || state.phase !== 'place') return;
    setSelected(selected === idx ? null : idx);
  }

  function handleCellClick(cellIdx: number) {
    if (!state || state.turn !== playerIndex || state.phase !== 'place') return;
    if (selected === null) return;
    if (state.grid[cellIdx] !== null) return;
    sendAction('place', { cardIndex: selected, cellIndex: cellIdx });
    setSelected(null);
  }

  function handleBattle() {
    if (!state || state.turn !== playerIndex || state.phase !== 'battle') return;
    sendAction('battle');
  }

  function handleSkip() {
    if (!state || state.turn !== playerIndex || state.phase !== 'battle') return;
    sendAction('skip');
  }

  const isMyTurn = state?.turn === playerIndex;
  const myHand = state?.hands[playerIndex] ?? [];
  const opponentHandCount = state ? state.hands[playerIndex === 0 ? 1 : 0].length : 0;

  const playerColors = ['text-blue-400', 'text-red-400'];
  const playerNames = ['Player 1 (Blue)', 'Player 2 (Red)'];
  const playerBg = ['bg-blue-900/30', 'bg-red-900/30'];

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <div className="text-amber-400 text-2xl font-bold animate-pulse">Loading game...</div>
        <div className="text-gray-500 text-sm">Room: {roomCode}</div>
        <div className="text-gray-500 text-sm">You are {playerNames[playerIndex]}</div>
        <p className="text-gray-600 text-xs mt-4">Waiting for first move to sync state...</p>
      </div>
    );
  }

  if (state.over) {
    const winner = state.scores[0] > state.scores[1] ? 0 : state.scores[1] > state.scores[0] ? 1 : -1;
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-5xl font-black text-amber-400">Game Over!</h1>
        {winner === -1 ? (
          <p className="text-2xl text-gray-300">It's a tie!</p>
        ) : winner === playerIndex ? (
          <p className="text-3xl text-green-400 font-bold">🏆 You Win!</p>
        ) : (
          <p className="text-3xl text-red-400 font-bold">💀 You Lose</p>
        )}
        <div className="text-gray-400 text-lg">
          {state.scores[0]} – {state.scores[1]}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-black py-3 px-8 rounded-xl text-lg transition-colors"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-4 gap-4">

      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <div className="text-gray-500 text-sm">Room: <span className="text-amber-400 font-bold">{roomCode}</span></div>
        <h1 className="text-xl font-black text-amber-400">⚔️ Card Grid Battle</h1>
        <div className="text-gray-500 text-sm">
          You: <span className={`font-bold ${playerColors[playerIndex]}`}>{playerIndex === 0 ? 'P1' : 'P2'}</span>
        </div>
      </div>

      {/* Turn indicator */}
      <div className={`w-full max-w-2xl rounded-xl py-2 px-4 text-center text-sm font-bold ${isMyTurn ? 'bg-green-900/50 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
        {isMyTurn
          ? `Your turn — ${state.phase === 'place' ? 'Place a card on the grid' : 'Resolve battle!'}`
          : `Waiting for opponent...`}
      </div>

      {/* Scores */}
      <div className="w-full max-w-2xl flex justify-between text-lg font-bold">
        <span className="text-blue-400">P1: {state.scores[0]}</span>
        <span className="text-gray-500 text-sm self-center">SCORE</span>
        <span className="text-red-400">P2: {state.scores[1]}</span>
      </div>

      {/* Opponent hand count */}
      <div className="w-full max-w-2xl">
        <div className="text-gray-600 text-xs mb-1">Opponent's hand ({opponentHandCount} cards)</div>
        <div className="flex gap-1">
          {Array.from({ length: opponentHandCount }).map((_, i) => (
            <div key={i} className="w-10 h-14 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center text-gray-600 text-lg">?</div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-1 w-full max-w-2xl">
        {state.grid.map((cell, i) => (
          <GridCell
            key={i}
            card={cell}
            index={i}
            highlight={
              selected !== null && cell === null && isMyTurn && state.phase === 'place'
                ? 'target'
                : state.lastPlaced === i
                ? 'last'
                : state.battleTarget === i
                ? 'battle'
                : 'none'
            }
            onClick={() => handleCellClick(i)}
          />
        ))}
      </div>

      {/* Battle controls */}
      {isMyTurn && state.phase === 'battle' && (
        <div className="w-full max-w-2xl flex gap-3">
          <button
            onClick={handleBattle}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black py-3 rounded-xl text-lg transition-colors"
          >
            ⚔️ Battle!
          </button>
          <button
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Skip
          </button>
        </div>
      )}

      {/* My hand */}
      <div className="w-full max-w-2xl">
        <div className={`text-xs mb-1 font-bold ${playerColors[playerIndex]}`}>
          Your hand {isMyTurn && state.phase === 'place' ? '— tap a card, then tap the grid' : ''}
        </div>
        <div className="flex gap-1 flex-wrap">
          {myHand.map((card, i) => (
            <CardInHand
              key={i}
              card={card}
              selected={selected === i}
              disabled={!isMyTurn || state.phase !== 'place' || loading}
              onClick={() => handleCardSelect(i)}
            />
          ))}
          {myHand.length === 0 && (
            <div className="text-gray-600 text-sm py-4">No cards left</div>
          )}
        </div>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="w-full max-w-2xl bg-gray-900 rounded-xl p-3">
          {log.map((entry, i) => (
            <div key={i} className={`text-xs ${i === 0 ? 'text-gray-300' : 'text-gray-600'}`}>{entry}</div>
          ))}
        </div>
      )}
    </div>
  );
}
