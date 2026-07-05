import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatSignedCurrency } from '@/lib/format';
import { AXIS, LOSS, PROFIT } from './breakdowns';
import type { SetupStat } from '@/features/metrics/types';

interface SetupBreakdownProps {
  data: SetupStat[];
  currency: string;
}

export function SetupBreakdown({ data, currency }: SetupBreakdownProps) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-text-dim">Noch keine Setups getaggt.</p>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="setup" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
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
              'PnL',
            ]}
          />
          <Bar dataKey="netPnl" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.setup} fill={d.netPnl >= 0 ? PROFIT : LOSS} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
