import { formatCurrency } from '@/lib/format';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// Gradient endpoints per outcome — a fixed dark corner (always present, so
// every traded day reads as "alive") fading into a brighter corner that
// scales with the day's magnitude. Ratio is floored so small-PnL days still
// get a clearly visible gradient instead of fading into the card background.
const WIN_BASE = '#123527';
const WIN_PEAK = '#2FA65B';
const LOSS_BASE = '#361A1D';
const LOSS_PEAK = '#C23A44';
const BREAKEVEN_GRADIENT = 'linear-gradient(135deg, #1A1C21 0%, #2C2E35 100%)';
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

function gradientFor(pnl: number, maxAbs: number): string {
  if (pnl === 0) return BREAKEVEN_GRADIENT;
  const win = pnl > 0;
  const base = win ? WIN_BASE : LOSS_BASE;
  const peak = win ? WIN_PEAK : LOSS_PEAK;
  const ratio = maxAbs === 0 ? MIN_RATIO : Math.max(MIN_RATIO, Math.min(1, Math.abs(pnl) / maxAbs));
  return `linear-gradient(135deg, ${base} 0%, ${mix(base, peak, ratio)} 100%)`;
}

const TODAY = new Date().toISOString().slice(0, 10);

interface CalendarHeatmapProps {
  cells: (string | null)[];
  pnlMap: Map<string, number>;
  tradeCountMap: Map<string, number>;
  maxAbs: number;
  currency: string;
  selected: string | null;
  onSelect: (day: string) => void;
}

export function CalendarHeatmap({
  cells,
  pnlMap,
  tradeCountMap,
  maxAbs,
  currency,
  selected,
  onSelect,
}: CalendarHeatmapProps) {
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-text-dim">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={i > 4 ? 'text-text-dim/50' : ''}>
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;
          const pnl = pnlMap.get(day);
          const count = tradeCountMap.get(day) ?? 0;
          const dayNum = Number(day.slice(8, 10));
          const active = selected === day;
          const isToday = day === TODAY;
          const gradient = pnl !== undefined ? gradientFor(pnl, maxAbs) : undefined;
          return (
            <button
              key={day}
              onClick={() => onSelect(day)}
              aria-label={`${dayNum}. — ${count} Trades`}
              aria-pressed={active}
              style={gradient ? { backgroundImage: gradient } : undefined}
              className={`group relative flex aspect-square flex-col justify-between overflow-hidden rounded-lg border p-2 text-left transition-[transform,border-color] duration-200 ease-out hover:z-10 hover:-translate-y-0.5 ${
                active ? 'border-brand ring-1 ring-brand/50' : 'border-border hover:border-border-strong'
              }`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`num text-sm font-medium ${
                    isToday
                      ? 'flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] text-accent-ink'
                      : pnl !== undefined
                        ? 'text-text'
                        : 'text-text-dim'
                  }`}
                >
                  {dayNum}
                </span>
                {/* One dot per trade (capped) — the day's activity at a glance,
                    independent of how big the P&L was. */}
                {count > 0 && (
                  <span className="flex gap-0.5 pt-1.5">
                    {Array.from({ length: Math.min(count, 4) }, (_, d) => (
                      <span key={d} className="h-1 w-1 rounded-full bg-white/55" />
                    ))}
                    {count > 4 && <span className="num text-[9px] leading-none text-white/55">+</span>}
                  </span>
                )}
              </div>
              {pnl !== undefined && (
                <span className="num truncate text-[13px] font-semibold text-text">
                  {formatCurrency(pnl, currency)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
