import { Card, Dir, DIR_ARROW } from '@/lib/gameConstants';

interface Props {
  card: Card;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function Arrow({ dir }: { dir: Dir }) {
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
    <span className={`absolute ${pos[dir]} text-[11px] leading-none text-[#185FA5] pointer-events-none z-10 drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]`}>
      {DIR_ARROW[dir]}
    </span>
  );
}

export default function CardInHand({ card, selected, disabled, onClick }: Props) {
  const tierBorder =
    card.tier === 'legendary' ? 'border-[#BA7517]' :
    card.tier === 'rare'      ? 'border-[#7F77DD]' :
    'border-[#ccc]';

  const selectedStyle = selected ? '!border-2 !border-[#378ADD] ring-2 ring-blue-300' : '';
  const disabledStyle = disabled ? 'opacity-50 cursor-default' : 'cursor-pointer hover:-translate-y-0.5';

  const tierLabel =
    card.tier === 'legendary' ? <span className="text-[8px] rounded px-1 py-px bg-[#FAEEDA] text-[#633806]">legendary</span> :
    card.tier === 'rare'      ? <span className="text-[8px] rounded px-1 py-px bg-[#EEEDFE] text-[#3C3489]">rare</span> :
    null;

  const imgSrc = `/cards/${encodeURIComponent(card.name)}.png`;

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`relative rounded-lg border bg-white w-[80px] transition-all ${tierBorder} ${selectedStyle} ${disabledStyle}`}
    >
      {card.dirs.map(dir => (
        <Arrow key={dir} dir={dir} />
      ))}
      <div className="mx-auto mt-4 mb-1 w-12 h-12 overflow-hidden rounded">
        <img src={imgSrc} alt={card.name} className="w-full h-full object-cover" />
      </div>
      <div className="px-1.5 pb-1.5 text-center">
        <div className="text-[10px] font-semibold text-[#111] leading-tight truncate">{card.name}</div>
        <div className="flex justify-center gap-2 mt-0.5">
          <span className="text-[9px] text-[#185FA5]">A{card.atk}</span>
          <span className="text-[9px] text-[#3B6D11]">D{card.def}</span>
        </div>
        {tierLabel && <div className="mt-0.5">{tierLabel}</div>}
      </div>
    </div>
  );
}
