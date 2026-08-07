import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  InstrumentBadge,
  Money,
  SortIcon,
  StarRating,
  Tag,
  pnlToneClass,
} from '@/components/ui';
import { useSetups } from './useSetups';
import { useTradeThumbnails } from './useTradeThumbnails';
import { formatDate } from '@/lib/format';
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

/** Long/Short as a coloured chip with a direction arrow, not a grey word. */
function DirectionChip({ direction }: { direction: Trade['direction'] }) {
  if (!direction) return <span className="text-text-dim">—</span>;
  const long = direction === 'long';
  const Icon = long ? ArrowUpIcon : ArrowDownIcon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${
        long ? 'bg-profit/12 text-profit' : 'bg-loss/12 text-loss'
      }`}
    >
      <Icon width={12} height={12} />
      {long ? 'Long' : 'Short'}
    </span>
  );
}

interface TradesTableProps {
  trades: Trade[];
  currency: string;
}

export function TradesTable({ trades, currency }: TradesTableProps) {
  const navigate = useNavigate();
  const { data: setups } = useSetups();
  const setupColor = (name: string) => setups?.find((s) => s.name === name)?.color;
  const thumbnails = useTradeThumbnails(trades.map((t) => t.id));
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

  // Every P&L cell also draws a bar scaled against the biggest move in view,
  // so size is readable without reading the digits.
  const maxAbs = useMemo(() => Math.max(...trades.map((t) => Math.abs(t.pnl)), 1), [trades]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'trade_date' || key === 'pnl' ? 'desc' : 'asc');
    }
  };

  return (
    <>
      {/* Desktop: table. */}
      <div className="hidden overflow-hidden rounded-card border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-raised/60 text-left text-xs text-text-dim">
              {columns.map((c) => {
                const active = sortKey === c.key;
                const Icon = active ? (sortDir === 'asc' ? ArrowUpIcon : ArrowDownIcon) : SortIcon;
                return (
                  <th
                    key={c.key}
                    aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className={`px-4 py-2.5 font-medium ${c.align === 'right' ? 'text-right' : ''}`}
                  >
                    <button
                      onClick={() => toggleSort(c.key)}
                      className={`inline-flex items-center gap-1 uppercase tracking-[0.06em] transition-colors hover:text-text ${
                        active ? 'text-text' : ''
                      }`}
                    >
                      {c.label}
                      <Icon
                        width={12}
                        height={12}
                        className={active ? 'text-brand-bright' : 'text-text-dim/50'}
                      />
                    </button>
                  </th>
                );
              })}
              <th className="w-14 px-2 py-2.5" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => (
              <tr
                key={t.id}
                onClick={() => navigate(`/trades/${t.id}`)}
                className="group cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-raised"
              >
                <td className="relative px-4 py-2.5">
                  {/* Hover marker on the row edge instead of a full-row tint. */}
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-0.5 scale-y-0 bg-brand transition-transform duration-200 group-hover:scale-y-100"
                  />
                  <InstrumentBadge asset={t.asset} />
                </td>
                <td className="num whitespace-nowrap px-4 py-2.5 text-text-muted">
                  {formatDate(t.trade_date)}
                  {t.exec_time && <span className="text-text-dim"> · {t.exec_time.slice(0, 5)}</span>}
                </td>
                <td className="px-4 py-2.5">
                  <DirectionChip direction={t.direction} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Money value={t.pnl} currency={currency} className="font-medium" />
                  <span className="mt-1 flex h-0.5 justify-end">
                    <span
                      className={`block h-full rounded-full ${t.pnl >= 0 ? 'bg-profit/60' : 'bg-loss/60'}`}
                      style={{ width: `${Math.max(6, (Math.abs(t.pnl) / maxAbs) * 100)}%` }}
                    />
                  </span>
                </td>
                <td className={`num px-4 py-2.5 text-right ${t.r_multiple != null ? pnlToneClass(t.r_multiple) : 'text-text-dim'}`}>
                  {t.r_multiple != null ? `${t.r_multiple}R` : '—'}
                </td>
                <td className="px-4 py-2.5">
                  {t.rating ? <StarRating value={t.rating} readOnly size="sm" /> : <span className="text-text-dim">—</span>}
                </td>
                <td className="px-4 py-2.5">
                  {t.setup ? <Tag label={t.setup} color={setupColor(t.setup)} /> : <span className="text-text-dim">—</span>}
                </td>
                <td className="px-2 py-2">
                  {thumbnails[t.id] ? (
                    <img
                      src={thumbnails[t.id]}
                      alt=""
                      className="h-9 w-9 rounded-md border border-border object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-md border border-dashed border-border/60" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards. A 7-column table on a phone means horizontal scrolling,
          which hides the P&L — the one column that must always be visible. */}
      <ul className="stagger flex flex-col gap-2 md:hidden">
        {sorted.map((t, i) => (
          <li key={t.id} style={{ '--i': i } as React.CSSProperties} className="animate-rise-in">
            <button
              onClick={() => navigate(`/trades/${t.id}`)}
              className="flex w-full items-center gap-3 rounded-card border border-border bg-card p-3 text-left transition-colors active:border-brand/60"
            >
              {thumbnails[t.id] ? (
                <img src={thumbnails[t.id]} alt="" className="h-11 w-11 shrink-0 rounded-md border border-border object-cover" />
              ) : (
                <div className="h-11 w-11 shrink-0 rounded-md border border-dashed border-border/60" />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <InstrumentBadge asset={t.asset} />
                  <DirectionChip direction={t.direction} />
                </div>
                <div className="num flex items-center gap-2 text-xs text-text-dim">
                  {formatDate(t.trade_date)}
                  {t.exec_time && <span>· {t.exec_time.slice(0, 5)}</span>}
                  {t.setup && <Tag label={t.setup} color={setupColor(t.setup)} />}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Money value={t.pnl} currency={currency} className="text-sm font-medium" />
                {t.rating && <StarRating value={t.rating} readOnly size="sm" />}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
