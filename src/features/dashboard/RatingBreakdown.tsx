import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatSignedCurrency } from '@/lib/format';
import { AXIS, LOSS, PROFIT } from './breakdowns';
import type { RatingStat } from '@/features/metrics/types';

interface RatingBreakdownProps {
  data: RatingStat[];
  currency: string;
}

export function RatingBreakdown({ data, currency }: RatingBreakdownProps) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-text-dim">Noch keine Bewertungen vergeben.</p>;
  }
  const chartData = data.map((d) => ({ ...d, label: '★'.repeat(d.rating) }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" tick={{ fill: '#EAB94D', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis
            width={64}
            tick={{ fill: AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatSignedCurrency(v, currency)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={{ background: '#212329', border: '1px solid #31333B', borderRadius: 10 }}
            itemStyle={{ color: '#ECEDEF' }}
            formatter={(v: number, _n, item) => [
              `${formatSignedCurrency(v, currency)} · ${item.payload.count} Trades`,
              'Ø PnL',
            ]}
          />
          <Bar dataKey="avgPnl" radius={[4, 4, 0, 0]}>
            {chartData.map((d) => (
              <Cell key={d.rating} fill={d.avgPnl >= 0 ? PROFIT : LOSS} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
