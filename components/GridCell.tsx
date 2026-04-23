import { PlacedCard, Dir, DIR_ARROW } from '@/lib/gameConstants';

interface Props {
  card: PlacedCard | null;
  index: number;
  highlight: 'target' | 'last' | 'battle' | 'none';
  onClick: () => void;
}

function Arrow({ dir, color }: { dir: Dir; color: string }) {
  const pos: Record<Dir, string> = {
    N:  'top-0    left-1/2  -translate-x-1/2',
    S:  'bottom-0 left-1/2  -translate-x-1/2',
    E:  'right-0  top-1/2   -translate-y-1/2',
    W:  'left-0   top-1/2   -translate-y-1/2',
    NE: 'top-0    right-0',
    NW: 'top-0    left-0',
    SE: 'bottom-0 right-0',
    SW: 'bottom-0 left-0',
  };
  return (
    <span className={`absolute ${pos[dir]} text-[10px] leading-none ${color} pointer-events-none z-10 drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]`}>
      {DIR_ARROW[dir]}
    </span>
  );
}

export default function GridCell({ card, highlight, onClick }: Props) {
  const isTarget  = highlight === 'target';
  const isPlaced  = highlight === 'last';
  const isBattle  = highlight === 'battle';

  let cls = 'aspect-square rounded-lg border-[0.5px] border-[#ccc] bg-[#f4f4f4] flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden';

  if (isPlaced) {
    cls += ' border-2 border-[#639922] bg-[#EAF3DE]';
  } else if (isBattle) {
    cls += ' border-2 border-[#CC3333] bg-[#FAEBEB]';
  } else if (isTarget) {
    cls += ' border-2 border-[#EF9F27] bg-[#FAEEDA]';
  } else if (card) {
    cls += card.owner === 0
      ? ' bg-[#E6F1FB] border-[#378ADD]'
      : ' bg-[#FAECE7] border-[#D85A30]';
  } else {
    cls += ' hover:border-[#999] hover:bg-white';
  }

  const arrowColor =
    isPlaced        ? 'text-[#3B6D11]' :
    isBattle        ? 'text-[#993333]' :
    isTarget        ? 'text-[#854F0B]' :
    card?.owner === 0 ? 'text-[#185FA5]' :
    card?.owner === 1 ? 'text-[#993C1D]' : '';

  const nameColor =
    isPlaced        ? 'text-[#27500A]' :
    isBattle        ? 'text-[#712B13]' :
    isTarget        ? 'text-[#633806]' :
    card?.owner === 0 ? 'text-[#0C447C]' :
    card?.owner === 1 ? 'text-[#712B13]' : '';

  const imgSrc = card ? `/cards/${encodeURIComponent(card.name)}.png` : '';

  return (
    <div className={cls} onClick={onClick}>
      {card && (
        <>
          {(card.tier === 'legendary' || card.tier === 'rare') && (
            <div className={`w-[5px] h-[5px] rounded-full absolute top-[3px] right-[3px] z-10 ${
              card.tier === 'legendary' ? 'bg-[#BA7517]' : 'bg-[#7F77DD]'
            }`} />
          )}
          {card.dirs.map(dir => (
            <Arrow key={dir} dir={dir} color={arrowColor} />
          ))}
          <div className="w-8 h-8 overflow-hidden rounded mb-px">
            <img src={imgSrc} alt={card.name} className="w-full h-full object-cover" />
          </div>
          <div className={`text-[8px] font-semibold leading-tight text-center px-0.5 ${nameColor}`}>
            {card.name}
          </div>
          <div className="text-[7px] text-[#666]">A{card.atk} D{card.def}</div>
        </>
      )}
    </div>
  );
}
