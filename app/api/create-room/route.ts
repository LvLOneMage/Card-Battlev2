import { NextResponse } from 'next/server';
import Pusher from 'pusher';
import { initGame } from '../../../lib/gameLogic';
import { createRoom } from '../../../lib/rooms';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: Request) {
  try {
    const { hostId } = await request.json();
    const code = generateCode();
    const state = initGame();
    const room = await createRoom(code, state, hostId);

    return NextResponse.json({
      code: room.code,
      playerIndex: 0,
      state: room.state,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
