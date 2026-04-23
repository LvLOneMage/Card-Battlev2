'use client';

import { useState } from 'react';
import Game from '../components/Game';

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Home() {
  const [screen, setScreen] = useState<'lobby' | 'waiting' | 'game'>('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [playerIndex, setPlayerIndex] = useState<0 | 1>(0);
  const [error, setError] = useState('');
  const [playerId] = useState(() => generateId());

  async function handleCreate() {
    setError('');
    const res = await fetch('/api/create-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId: playerId }),
    });
    const data = await res.json();
    if (data.error) { setError(data.error); return; }
    setRoomCode(data.code);
    setPlayerIndex(0);
    setScreen('waiting');
  }

  async function handleJoin() {
    setError('');
    if (joinCode.length !== 4) { setError('Enter a 4-digit code'); return; }
    const res = await fetch('/api/join-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: joinCode, guestId: playerId }),
    });
    const data = await res.json();
    if (data.error) { setError(data.error); return; }
    setRoomCode(joinCode);
    setPlayerIndex(1);
    setScreen('game');
  }

  if (screen === 'game') {
    return <Game roomCode={roomCode} playerIndex={playerIndex} />;
  }

  if (screen === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-8 p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-amber-400 mb-2">⚔️ Card Grid Battle</h1>
          <p className="text-gray-400">Waiting for opponent to join...</p>
        </div>
        <div className="bg-gray-900 border-2 border-amber-500 rounded-2xl p-10 text-center">
          <p className="text-gray-400 text-sm mb-3 uppercase tracking-widest">Share this code</p>
          <div className="text-7xl font-black text-amber-400 tracking-[0.3em] mb-6">{roomCode}</div>
          <p className="text-gray-500 text-sm">Tell your opponent to enter this code</p>
        </div>
        <WaitingForPlayer roomCode={roomCode} onJoined={() => setScreen('game')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-10 p-6">
      <div className="text-center">
        <h1 className="text-5xl font-black text-amber-400 mb-3">⚔️ Card Grid Battle</h1>
        <p className="text-gray-400 text-lg">A two-player card strategy game</p>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-sm">
        {/* Create room */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-bold text-lg mb-1">Create a Room</h2>
          <p className="text-gray-500 text-sm mb-4">Start a game and invite a friend</p>
          <button
            onClick={handleCreate}
            className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-black py-3 rounded-xl text-lg transition-colors"
          >
            Create Room
          </button>
        </div>

        <div className="text-center text-gray-600 font-bold">— OR —</div>

        {/* Join room */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-bold text-lg mb-1">Join a Room</h2>
          <p className="text-gray-500 text-sm mb-4">Enter the 4-digit code from your friend</p>
          <input
            type="text"
            maxLength={4}
            placeholder="1234"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-gray-800 text-white text-center text-3xl font-black tracking-widest py-3 rounded-xl mb-4 border border-gray-700 focus:border-amber-500 outline-none"
          />
          <button
            onClick={handleJoin}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl text-lg transition-colors"
          >
            Join Game
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-xl p-3 text-center text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// Subscribes to Pusher and waits for the guest to join
function WaitingForPlayer({ roomCode, onJoined }: { roomCode: string; onJoined: () => void }) {
  const [status, setStatus] = useState('Waiting...');

  useState(() => {
    // Dynamically import pusher-js to avoid SSR issues
    import('pusher-js').then(({ default: PusherJS }) => {
      const pusher = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });
      const channel = pusher.subscribe(`game-${roomCode}`);
      channel.bind('player-joined', () => {
        setStatus('Opponent joined!');
        setTimeout(onJoined, 800);
      });
      return () => { pusher.unsubscribe(`game-${roomCode}`); };
    });
  });

  return (
    <div className="flex items-center gap-3 text-gray-400">
      <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
      <span>{status}</span>
    </div>
  );
}
