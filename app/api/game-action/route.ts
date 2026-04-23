import { NextResponse } from 'next/server';
import Pusher from 'pusher';
import { GameState } from '../../../lib/gameConstants';
import { getRoom, updateRoom } from '../../../lib/rooms';
import { doPlace, doBattle, skipBattle } from '../../../lib/gameLogic';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(request: Request) {
  try {
    const { code, action, payload } = await request.json();
    const room = await getRoom(code);

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (action === 'get') {
      return NextResponse.json({ state: room.state });
    }

    let newState: GameState = room.state;

    if (action === 'place') {
      const stateWithSelected: GameState = { ...room.state, selected: payload.cardIndex };
      const result = doPlace(stateWithSelected, payload.cellIndex);
      newState = result.newState;
    } else if (action === 'battle') {
      const result = doBattle(room.state);
      newState = result.newState;
    } else if (action === 'skip') {
      const result = skipBattle(room.state);
      newState = result.newState;
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    await updateRoom(code, newState);
    await pusher.trigger(`game-${code}`, 'game-updated', { state: newState });

    return NextResponse.json({ state: newState });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
