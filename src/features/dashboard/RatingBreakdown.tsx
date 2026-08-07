import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatSignedCurrency } from '@/lib/format';
import { AXIS, GRID, LOSS, PROFIT } from './breakdowns';
import { ChartTooltip } from './ChartTooltip';
import type { RatingStat } from '@/features/metrics/types';

const STAR_PATH =
  'M6 0.9l1.6 3.3 3.6 0.5-2.6 2.5 0.6 3.6L6 9.1 2.8 10.8l0.6-3.6L0.8 4.7l3.6-0.5z';

interface TickProps {
  x?: number;
  y?: number;
  payload?: { value: number };
}

/** Axis ticks drawn as actual stars — a text ★ would inherit the body font. */
function StarTick({ x = 0, y = 0, payload }: TickProps) {
  const n = payload?.value ?? 0;
  const size = 11;
  const width = n * (size + 1);
  return (
    <g transform={`translate(${x - width / 2}, ${y + 6})`} fill="#EAB94D">
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`translate(${i * (size + 1)}, 0) scale(${size / 12})`}>
          <path d={STAR_PATH} />
        </g>
      ))}
    </g>
  );
}

interface RatingBreakdownProps {
  data: RatingStat[];
  currency: string;
}

export function RatingBreakdown({ data, currency }: RatingBreakdownProps) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-text-dim">Noch keine Bewertungen vergeben.</p>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="rating" tick={<StarTick />} tickLine={false} axisLine={false} interval={0} height={28} />
          <YAxis
            width={70}
            tick={{ fill: AXIS, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatSignedCurrency(v, currency)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.035)' }}
            wrapperStyle={{ outline: 'none' }}
            content={<ChartTooltip currency={currency} valueKey="avgPnl" label="Ø PnL" />}
          />
          <Bar dataKey="avgPnl" radius={[5, 5, 0, 0]} animationDuration={600} maxBarSize={56}>
            {data.map((d) => (
              <Cell key={d.rating} fill={d.avgPnl >= 0 ? PROFIT : LOSS} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
