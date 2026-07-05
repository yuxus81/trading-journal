import { KpiCard, type KpiTone } from './KpiCard';
import { formatCurrency, formatPercent, formatR, formatSignedCurrency } from '@/lib/format';
import type { Metrics } from '@/features/metrics/types';

const signTone = (n: number): KpiTone => (n > 0 ? 'profit' : n < 0 ? 'loss' : 'default');
const num = (n: number | null, digits = 2) => (n === null ? '—' : n.toFixed(digits));

interface KpiGridProps {
  metrics: Metrics;
  currency: string;
}

export function KpiGrid({ metrics: m, currency }: KpiGridProps) {
  const cards: { label: string; value: string; tone?: KpiTone; sub?: string }[] = [
    { label: 'Net PnL', value: formatSignedCurrency(m.netPnl, currency), tone: signTone(m.netPnl) },
    { label: 'Winrate', value: formatPercent(m.winrate) },
    { label: 'Trades', value: String(m.tradeCount) },
    { label: 'Ø Gewinn', value: formatCurrency(m.avgWin, currency), tone: m.avgWin > 0 ? 'profit' : 'default' },
    { label: 'Ø Verlust', value: formatCurrency(m.avgLoss, currency), tone: m.avgLoss < 0 ? 'loss' : 'default' },
    { label: 'Profit Factor', value: num(m.profitFactor) },
    { label: 'Ø PnL/Trade', value: formatSignedCurrency(m.avgPnlPerTrade, currency), tone: signTone(m.avgPnlPerTrade) },
    { label: 'Payoff Ratio', value: num(m.payoffRatio) },
    { label: 'Ø R-Multiple', value: m.avgR === null ? '—' : formatR(m.avgR) },
    { label: 'Max Drawdown', value: m.maxDrawdown > 0 ? formatCurrency(-m.maxDrawdown, currency) : formatCurrency(0, currency), tone: m.maxDrawdown > 0 ? 'loss' : 'default' },
    { label: 'Bester Trade', value: m.best === null ? '—' : formatSignedCurrency(m.best, currency), tone: m.best && m.best > 0 ? 'profit' : 'default' },
    { label: 'Schlechtester Trade', value: m.worst === null ? '—' : formatSignedCurrency(m.worst, currency), tone: m.worst && m.worst < 0 ? 'loss' : 'default' },
    { label: 'Längste Serie (W / L)', value: `${m.longestWinStreak} / ${m.longestLossStreak}` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((c) => (
        <KpiCard key={c.label} label={c.label} value={c.value} tone={c.tone} sub={c.sub} />
      ))}
    </div>
  );
}
