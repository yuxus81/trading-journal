import { useState } from 'react';
import { KpiCard, type KpiTone } from './KpiCard';
import { ChevronDownIcon } from '@/components/ui';
import { formatCurrency, formatPercent, formatR, formatSignedCurrency } from '@/lib/format';
import type { Metrics } from '@/features/metrics/types';

const signTone = (n: number): KpiTone => (n > 0 ? 'profit' : n < 0 ? 'loss' : 'default');
const num = (n: number | null, digits = 2) => (n === null ? '—' : n.toFixed(digits));

interface KpiEntry {
  label: string;
  value: string;
  tone?: KpiTone;
  sub?: string;
  fill?: number;
}

interface KpiGridProps {
  metrics: Metrics;
  currency: string;
}

export function KpiGrid({ metrics: m, currency }: KpiGridProps) {
  const [expanded, setExpanded] = useState(false);

  // Win and loss sizes share one scale, so the two bars can be compared
  // against each other instead of each filling its own tile.
  const extreme = Math.max(m.avgWin, Math.abs(m.avgLoss)) || 1;

  const core: KpiEntry[] = [
    { label: 'Winrate', value: formatPercent(m.winrate), fill: m.winrate },
    {
      label: 'Profit Factor',
      value: num(m.profitFactor),
      tone: m.profitFactor !== null ? (m.profitFactor >= 1 ? 'profit' : 'loss') : 'default',
      sub: 'Gewinne / Verluste',
    },
    {
      label: 'Ø Gewinn',
      value: formatCurrency(m.avgWin, currency),
      tone: m.avgWin > 0 ? 'profit' : 'default',
      fill: m.avgWin / extreme,
    },
    {
      label: 'Ø Verlust',
      value: formatCurrency(m.avgLoss, currency),
      tone: m.avgLoss < 0 ? 'loss' : 'default',
      fill: Math.abs(m.avgLoss) / extreme,
    },
  ];

  const advanced: KpiEntry[] = [
    { label: 'Ø PnL/Trade', value: formatSignedCurrency(m.avgPnlPerTrade, currency), tone: signTone(m.avgPnlPerTrade) },
    { label: 'Payoff Ratio', value: num(m.payoffRatio) },
    { label: 'Ø R-Multiple', value: m.avgR === null ? '—' : formatR(m.avgR), tone: m.avgR ? signTone(m.avgR) : 'default' },
    {
      label: 'Max Drawdown',
      value: m.maxDrawdown > 0 ? formatCurrency(-m.maxDrawdown, currency) : formatCurrency(0, currency),
      tone: m.maxDrawdown > 0 ? 'loss' : 'default',
    },
    {
      label: 'Bester Trade',
      value: m.best === null ? '—' : formatSignedCurrency(m.best, currency),
      tone: m.best && m.best > 0 ? 'profit' : 'default',
    },
    {
      label: 'Schlechtester Trade',
      value: m.worst === null ? '—' : formatSignedCurrency(m.worst, currency),
      tone: m.worst && m.worst < 0 ? 'loss' : 'default',
    },
    { label: 'Trades', value: String(m.tradeCount) },
    { label: 'Serie W / L', value: `${m.longestWinStreak} / ${m.longestLossStreak}` },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        {core.map((c, i) => (
          <KpiCard key={c.label} {...c} index={i} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-fit items-center gap-1.5 rounded-md py-1 text-sm text-text-muted transition-colors hover:text-text"
      >
        <span>Erweiterte Statistiken</span>
        <ChevronDownIcon
          width={15}
          height={15}
          className={`transition-transform duration-200 ease-out ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {advanced.map((c, i) => (
            <KpiCard key={c.label} {...c} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
