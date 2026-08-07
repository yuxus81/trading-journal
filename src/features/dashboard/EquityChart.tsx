import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS, BORDER_STRONG, BRAND, GRID, LOSS, PROFIT, SURFACE } from './breakdowns';
import { formatCurrency, formatDate } from '@/lib/format';
import type { EquityPoint } from '@/features/metrics/types';

interface EquityChartProps {
  data: EquityPoint[];
  currency: string;
}

interface TooltipPayload {
  active?: boolean;
  payload?: { payload: EquityPoint }[];
}

function EquityTooltip({ active, payload, currency, start }: TooltipPayload & { currency: string; start: number }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const diff = point.equity - start;
  return (
    <div className="rounded-input border border-border-strong bg-raised px-3 py-2 shadow-pop">
      <div className="text-[11px] text-text-dim">{point.date ? formatDate(point.date) : `Trade ${point.index}`}</div>
      <div className="num text-sm font-medium text-text">{formatCurrency(point.equity, currency)}</div>
      <div className={`num text-xs ${diff >= 0 ? 'text-profit' : 'text-loss'}`}>
        {diff >= 0 ? '+' : ''}
        {formatCurrency(diff, currency)} seit Start
      </div>
    </div>
  );
}

export function EquityChart({ data, currency }: EquityChartProps) {
  const start = data[0]?.equity ?? 0;
  const last = data[data.length - 1]?.equity ?? start;
  // The curve carries the outcome's colour, not a decorative brand colour.
  const color = last >= start ? PROFIT : last < start ? LOSS : BRAND;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.26} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="index" hide />
          <YAxis
            width={70}
            tick={{ fill: AXIS, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatCurrency(v, currency)}
            domain={['auto', 'auto']}
          />
          {/* Break-even line: every point above it is money made. */}
          <ReferenceLine y={start} stroke={BORDER_STRONG} strokeDasharray="4 4" />
          <Tooltip
            cursor={{ stroke: BORDER_STRONG, strokeWidth: 1 }}
            wrapperStyle={{ outline: 'none' }}
            contentStyle={{ background: SURFACE, border: 'none', padding: 0 }}
            content={<EquityTooltip currency={currency} start={start} />}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={color}
            strokeWidth={2}
            fill="url(#equityFill)"
            animationDuration={700}
            activeDot={{ r: 4, fill: color, stroke: SURFACE, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
