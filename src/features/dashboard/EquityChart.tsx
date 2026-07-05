import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '@/lib/format';
import type { EquityPoint } from '@/features/metrics/types';

// Palette hex mirrors the Tailwind tokens (Recharts needs literal SVG colors).
const ACCENT = '#8B85EA';
const AXIS = '#6E7079';

interface EquityChartProps {
  data: EquityPoint[];
  currency: string;
}

export function EquityChart({ data, currency }: EquityChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.22} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="index" hide />
          <YAxis
            width={64}
            tick={{ fill: AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatCurrency(v, currency)}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{ background: '#212329', border: '1px solid #31333B', borderRadius: 10 }}
            labelStyle={{ display: 'none' }}
            itemStyle={{ color: '#ECEDEF' }}
            formatter={(v: number) => [formatCurrency(v, currency), 'Equity']}
          />
          <Area type="monotone" dataKey="equity" stroke={ACCENT} strokeWidth={2} fill="url(#equityFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
