import { formatCurrency } from '@/lib/format';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// Fixed 4-step bands (darkest → richest) — no computed opacity, so small-PnL
// days stay clearly visible instead of fading into the card background.
const LOSS_BANDS = ['#3B1F22', '#5A242A', '#7A2C31', '#A6343B'];
const WIN_BANDS = ['#1F3B2E', '#245A3A', '#2C7A48', '#2FA65B'];

function bandFor(pnl: number, maxAbs: number): string | undefined {
  if (pnl === 0 || maxAbs === 0) return undefined;
  const bands = pnl > 0 ? WIN_BANDS : LOSS_BANDS;
  const ratio = Math.abs(pnl) / maxAbs;
  const idx = Math.min(bands.length - 1, Math.floor(ratio * bands.length));
  return bands[idx];
}

interface CalendarHeatmapProps {
  cells: (string | null)[];
  pnlMap: Map<string, number>;
  maxAbs: number;
  currency: string;
  selected: string | null;
  onSelect: (day: string) => void;
}

export function CalendarHeatmap({ cells, pnlMap, maxAbs, currency, selected, onSelect }: CalendarHeatmapProps) {
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-xs text-text-dim">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;
          const pnl = pnlMap.get(day);
          const dayNum = Number(day.slice(8, 10));
          const active = selected === day;
          const band = pnl !== undefined ? bandFor(pnl, maxAbs) : undefined;
          return (
            <button
              key={day}
              onClick={() => onSelect(day)}
              style={band ? { backgroundColor: band } : undefined}
              className={`flex aspect-square flex-col justify-between rounded-md border p-2 text-left transition-colors ${
                active ? 'border-accent' : 'border-border hover:border-border-strong'
              }`}
            >
              <span className="text-sm font-medium text-text">{dayNum}</span>
              {pnl !== undefined && <span className="text-xs font-semibold text-text">{formatCurrency(pnl, currency)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
