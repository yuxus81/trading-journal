import { Link } from 'react-router-dom';
import { Card } from '@/components/ui';
import { formatCurrency, formatDate, formatSignedCurrency } from '@/lib/format';
import type { Trade } from '@/types/db';

interface DayTradesPanelProps {
  day: string;
  trades: Trade[];
  currency: string;
}

export function DayTradesPanel({ day, trades, currency }: DayTradesPanelProps) {
  const total = trades.reduce((s, t) => s + t.pnl, 0);
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-text">{formatDate(day)}</h2>
        <span className={`text-sm font-medium ${total > 0 ? 'text-profit' : total < 0 ? 'text-loss' : 'text-text-muted'}`}>
          {formatSignedCurrency(total, currency)}
        </span>
      </div>
      {trades.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-dim">Keine Trades an diesem Tag.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {trades.map((t) => (
            <li key={t.id}>
              <Link to={`/trades/${t.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-text">
                <span className="flex items-center gap-2 text-sm text-text">
                  <span className="font-medium">{t.asset}</span>
                  {t.exec_time && <span className="text-text-dim">{t.exec_time.slice(0, 5)}</span>}
                  {t.setup && <span className="text-text-muted">· {t.setup}</span>}
                </span>
                <span className={`text-sm font-medium ${t.pnl > 0 ? 'text-profit' : t.pnl < 0 ? 'text-loss' : 'text-text-muted'}`}>
                  {formatCurrency(t.pnl, currency)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
