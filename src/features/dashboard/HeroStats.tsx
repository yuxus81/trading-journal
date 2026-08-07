import { Sparkline } from '@/components/ui';
import { formatPercent, formatSignedCurrency } from '@/lib/format';
import type { Metrics } from '@/features/metrics/types';

interface RingProps {
  fraction: number;
}

/** Winrate as a ring: a share is easier to judge as an arc than as digits. */
function Ring({ fraction }: RingProps) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, fraction)) * c;
  return (
    <svg viewBox="0 0 72 72" className="h-[72px] w-[72px] -rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#24262E" strokeWidth="7" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#3ED598"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        className="transition-[stroke-dasharray] duration-700 ease-out"
      />
    </svg>
  );
}

interface HeroStatsProps {
  metrics: Metrics;
  currency: string;
}

/**
 * The one thing a trader opens the journal for — net result, its shape over
 * time, and how often it works — gets a single wide card at full weight.
 * Everything else on this page is deliberately smaller than this.
 */
export function HeroStats({ metrics: m, currency }: HeroStatsProps) {
  const positive = m.netPnl >= 0;
  const equity = m.equityCurve.map((p) => p.equity);
  const start = equity[0] ?? 0;
  const pctChange = start !== 0 ? m.netPnl / Math.abs(start) : 0;

  return (
    <div className="relative animate-rise-in overflow-hidden rounded-card border border-border bg-card">
      {/* Result-tinted glow: the card itself tells you win or loss before you
          have read a single digit. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${
          positive
            ? 'bg-[radial-gradient(120%_100%_at_0%_0%,rgba(62,213,152,0.10),transparent_60%)]'
            : 'bg-[radial-gradient(120%_100%_at_0%_0%,rgba(248,113,113,0.10),transparent_60%)]'
        }`}
      />
      <div className="relative grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.12em] text-text-dim">Netto-Ergebnis</div>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <span
              className={`num text-[2.6rem] font-semibold leading-none ${positive ? 'text-profit' : 'text-loss'}`}
            >
              {formatSignedCurrency(m.netPnl, currency)}
            </span>
            <span
              className={`num rounded-full px-2 py-0.5 text-xs font-medium ${
                positive ? 'bg-profit/12 text-profit' : 'bg-loss/12 text-loss'
              }`}
            >
              {positive ? '+' : ''}
              {(pctChange * 100).toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 text-xs text-text-dim">
            <span className="num">{m.tradeCount}</span> Trades · Ø{' '}
            <span className="num">{formatSignedCurrency(m.avgPnlPerTrade, currency)}</span> pro Trade
          </div>
          <div className="mt-4 -mb-1">
            <Sparkline values={equity} tone={positive ? 'profit' : 'loss'} height={52} />
          </div>
        </div>

        <div className="flex items-center gap-5 border-t border-border pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <div className="relative flex items-center justify-center">
            <Ring fraction={m.winrate} />
            <span className="num absolute text-sm font-semibold text-text">{formatPercent(m.winrate)}</span>
          </div>
          <div className="flex flex-col gap-2 text-xs">
            <div>
              <div className="text-text-dim">Winrate</div>
              <div className="num text-sm font-medium text-text">{formatPercent(m.winrate)}</div>
            </div>
            <div>
              <div className="text-text-dim">Serie W / L</div>
              <div className="num text-sm font-medium">
                <span className="text-profit">{m.longestWinStreak}</span>
                <span className="text-text-dim"> / </span>
                <span className="text-loss">{m.longestLossStreak}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
