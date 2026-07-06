import { assetDotClass } from '@/lib/assetStyle';
import { formatCurrency } from '@/lib/format';
import type { Trade } from '@/types/db';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// Gradient endpoints per direction — a fixed dark corner (always present, so
// every traded day reads as "alive") fading into a brighter corner that
// scales with the day's magnitude. Ratio is floored so small-PnL days still
// get a clearly visible gradient instead of fading into the card background.
const WIN_BASE = '#1B3A2A';
const WIN_PEAK = '#2FA65B';
const LOSS_BASE = '#3B1F22';
const LOSS_PEAK = '#C23A44';
const MIN_RATIO = 0.35;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function gradientFor(pnl: number, maxAbs: number): string | undefined {
  if (pnl === 0 || maxAbs === 0) return undefined;
  const win = pnl > 0;
  const base = win ? WIN_BASE : LOSS_BASE;
  const peak = win ? WIN_PEAK : LOSS_PEAK;
  const ratio = Math.max(MIN_RATIO, Math.min(1, Math.abs(pnl) / maxAbs));
  return `linear-gradient(135deg, ${base} 0%, ${mix(base, peak, ratio)} 100%)`;
}

const MAX_DOTS = 6;

function DayIndicators({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) return null;
  if (trades.length > MAX_DOTS) {
    return <span className="text-[10px] font-medium text-text-muted">{trades.length} Trades</span>;
  }
  return (
    <div className="flex flex-wrap gap-0.5">
      {trades.map((t) => (
        <span key={t.id} className={`h-1.5 w-1.5 rounded-full ${assetDotClass(t.asset)}`} />
      ))}
    </div>
  );
}

interface CalendarHeatmapProps {
  cells: (string | null)[];
  pnlMap: Map<string, number>;
  tradesMap: Map<string, Trade[]>;
  maxAbs: number;
  currency: string;
  selected: string | null;
  onSelect: (day: string) => void;
}

export function CalendarHeatmap({ cells, pnlMap, tradesMap, maxAbs, currency, selected, onSelect }: CalendarHeatmapProps) {
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
          const gradient = pnl !== undefined ? gradientFor(pnl, maxAbs) : undefined;
          return (
            <button
              key={day}
              onClick={() => onSelect(day)}
              style={gradient ? { backgroundImage: gradient } : undefined}
              className={`flex aspect-square flex-col justify-between rounded-md border p-2 text-left transition-colors ${
                active ? 'border-accent' : 'border-border hover:border-border-strong'
              }`}
            >
              <span className="text-sm font-medium text-text">{dayNum}</span>
              <div className="flex flex-col gap-1">
                <DayIndicators trades={tradesMap.get(day) ?? []} />
                {pnl !== undefined && <span className="text-xs font-semibold text-text">{formatCurrency(pnl, currency)}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
