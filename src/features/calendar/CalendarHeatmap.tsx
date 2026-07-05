import { formatCurrency } from '@/lib/format';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// Profit/loss token RGB (for dynamic alpha backgrounds).
const PROFIT_RGB = '74,222,158';
const LOSS_RGB = '249,128,128';

function cellStyle(pnl: number | undefined, maxAbs: number): React.CSSProperties {
  if (pnl === undefined || pnl === 0 || maxAbs === 0) return {};
  const alpha = 0.15 + 0.75 * (Math.abs(pnl) / maxAbs);
  const rgb = pnl > 0 ? PROFIT_RGB : LOSS_RGB;
  return { backgroundColor: `rgba(${rgb},${alpha.toFixed(2)})` };
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
          return (
            <button
              key={day}
              onClick={() => onSelect(day)}
              style={cellStyle(pnl, maxAbs)}
              className={`flex aspect-square flex-col justify-between rounded-md border p-1.5 text-left transition-colors ${
                active ? 'border-accent' : 'border-border hover:border-border-strong'
              }`}
            >
              <span className="text-[11px] text-text-muted">{dayNum}</span>
              {pnl !== undefined && (
                <span className={`text-[10px] font-medium ${pnl > 0 ? 'text-profit' : pnl < 0 ? 'text-loss' : 'text-text-dim'}`}>
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
