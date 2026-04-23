import { NextResponse } from 'next/server';
import Pusher from 'pusher';
import { getRoom, joinRoom } from '../../../lib/rooms';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(request: Request) {
  try {
    const { code, guestId } = await request.json();
    const room = await getRoom(code);

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    if (room.players[1]) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 });
    }

    const updated = await joinRoom(code, guestId);
    if (!updated) {
      return NextResponse.json({ error: 'Could not join room' }, { status: 400 });
    }

    await pusher.trigger(`game-${code}`, 'player-joined', {
      playerIndex: 1,
    });

    return NextResponse.json({
      code,
      playerIndex: 1,
      state: updated.state,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
