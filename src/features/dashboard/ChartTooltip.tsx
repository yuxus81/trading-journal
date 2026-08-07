import { formatSignedCurrency } from '@/lib/format';

interface Row {
  count: number;
  setup?: string;
  rating?: number;
  [key: string]: unknown;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { payload: Row }[];
  currency: string;
  valueKey: string;
  label: string;
}

/** Shared tooltip for the breakdown bars — app surface, tabular numbers. */
export function ChartTooltip({ active, payload, currency, valueKey, label }: ChartTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const value = Number(row[valueKey] ?? 0);
  const title = row.setup ?? (row.rating !== undefined ? `${row.rating} Sterne` : '');

  return (
    <div className="rounded-input border border-border-strong bg-raised px-3 py-2 shadow-pop">
      {title && <div className="text-[11px] text-text-dim">{title}</div>}
      <div className={`num text-sm font-medium ${value >= 0 ? 'text-profit' : 'text-loss'}`}>
        {label}: {formatSignedCurrency(value, currency)}
      </div>
      <div className="num text-xs text-text-dim">{row.count} Trades</div>
    </div>
  );
}
