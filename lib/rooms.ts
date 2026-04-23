import { GameState } from './gameConstants';

export interface Room {
  code: string;
  state: GameState;
  players: [string | null, string | null];
  createdAt: number;
}

async function getKV() {
  const { createClient } = await import('@vercel/kv');
  return createClient({
    url: process.env.cardbattlekv_KV_REST_API_URL!,
    token: process.env.cardbattlekv_KV_REST_API_TOKEN!,
  });
}

export async function createRoom(code: string, state: GameState, hostId: string): Promise<Room> {
  const kv = await getKV();
  const room: Room = {
    code,
    state,
    players: [hostId, null],
    createdAt: Date.now(),
  };
  await kv.set(`room:${code}`, JSON.stringify(room), { ex: 60 * 60 * 4 });
  return room;
}

export async function getRoom(code: string): Promise<Room | null> {
  const kv = await getKV();
  const data = await kv.get<string>(`room:${code}`);
  if (!data) return null;
  return typeof data === 'string' ? JSON.parse(data) : data as Room;
}

export async function updateRoom(code: string, state: GameState): Promise<Room | null> {
  const kv = await getKV();
  const room = await getRoom(code);
  if (!room) return null;
  room.state = state;
  await kv.set(`room:${code}`, JSON.stringify(room), { ex: 60 * 60 * 4 });
  return room;
}

export async function joinRoom(code: string, guestId: string): Promise<Room | null> {
  const kv = await getKV();
  const room = await getRoom(code);
  if (!room) return null;
  if (room.players[1]) return null;
  room.players[1] = guestId;
  await kv.set(`room:${code}`, JSON.stringify(room), { ex: 60 * 60 * 4 });
  return room;
}
