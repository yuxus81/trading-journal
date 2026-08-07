import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatSignedCurrency } from '@/lib/format';
import { AXIS, GRID, LOSS, PROFIT } from './breakdowns';
import { ChartTooltip } from './ChartTooltip';
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
          <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="setup"
            tick={{ fill: AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
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
            content={<ChartTooltip currency={currency} valueKey="netPnl" label="PnL" />}
          />
          <Bar dataKey="netPnl" radius={[5, 5, 0, 0]} animationDuration={600} maxBarSize={56}>
            {data.map((d) => (
              <Cell key={d.setup} fill={d.netPnl >= 0 ? PROFIT : LOSS} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
