import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarRating, Tag } from '@/components/ui';
import { useSetups } from './useSetups';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Trade } from '@/types/db';

type SortKey = 'trade_date' | 'asset' | 'direction' | 'pnl' | 'r_multiple' | 'rating' | 'setup';
type SortDir = 'asc' | 'desc';

interface Column {
  key: SortKey;
  label: string;
  align?: 'right';
}

const columns: Column[] = [
  { key: 'asset', label: 'Asset' },
  { key: 'trade_date', label: 'Datum' },
  { key: 'direction', label: 'Richtung' },
  { key: 'pnl', label: 'PnL', align: 'right' },
  { key: 'r_multiple', label: 'R', align: 'right' },
  { key: 'rating', label: 'Rating' },
  { key: 'setup', label: 'Setup' },
];

function value(t: Trade, key: SortKey): string | number {
  switch (key) {
    case 'trade_date':
      return `${t.trade_date} ${t.exec_time ?? ''}`;
    case 'pnl':
      return t.pnl;
    case 'r_multiple':
      return t.r_multiple ?? -Infinity;
    case 'rating':
      return t.rating ?? -Infinity;
    case 'asset':
      return t.asset;
    case 'direction':
      return t.direction ?? '';
    case 'setup':
      return t.setup ?? '';
  }
}

interface TradesTableProps {
  trades: Trade[];
  currency: string;
}

export function TradesTable({ trades, currency }: TradesTableProps) {
  const navigate = useNavigate();
  const { data: setups } = useSetups();
  const setupColor = (name: string) => setups?.find((s) => s.name === name)?.color;
  const [sortKey, setSortKey] = useState<SortKey>('trade_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const copy = [...trades];
    copy.sort((a, b) => {
      const va = value(a, sortKey);
      const vb = value(b, sortKey);
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [trades, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'trade_date' || key === 'pnl' ? 'desc' : 'asc');
    }
  };

  const pnlColor = (n: number) => (n > 0 ? 'text-profit' : n < 0 ? 'text-loss' : 'text-text-muted');

  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-text-muted">
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-3 font-medium ${c.align === 'right' ? 'text-right' : ''}`}>
                <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-text">
                  {c.label}
                  {sortKey === c.key && <span className="text-accent">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((t) => (
            <tr
              key={t.id}
              onClick={() => navigate(`/trades/${t.id}`)}
              className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-border/30"
            >
              <td className="px-4 py-3 font-medium text-text">{t.asset}</td>
              <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                {formatDate(t.trade_date)}
                {t.exec_time && <span className="text-text-dim"> · {t.exec_time.slice(0, 5)}</span>}
              </td>
              <td className="px-4 py-3 capitalize text-text-muted">
                {t.direction === 'long' ? 'Long' : t.direction === 'short' ? 'Short' : '—'}
              </td>
              <td className={`px-4 py-3 text-right font-medium ${pnlColor(t.pnl)}`}>
                {formatCurrency(t.pnl, currency)}
              </td>
              <td className="px-4 py-3 text-right text-text-muted">{t.r_multiple != null ? `${t.r_multiple}R` : '—'}</td>
              <td className="px-4 py-3">
                {t.rating ? <StarRating value={t.rating} readOnly size="sm" /> : <span className="text-text-dim">—</span>}
              </td>
              <td className="px-4 py-3">
                {t.setup ? <Tag label={t.setup} color={setupColor(t.setup)} /> : <span className="text-text-dim">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
