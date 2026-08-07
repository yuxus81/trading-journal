import { useTrades } from '@/features/trades/useTrades';
import { currentCapital } from '@/features/metrics/calc';
import { ACCOUNT_TYPE_COLOR, ACCOUNT_TYPE_LABEL } from './accountMeta';
import { formatCurrency, formatSignedCurrency } from '@/lib/format';
import { Button, Card, StatusBadge, gradientBadgeClass, pnlToneClass, type TagColor } from '@/components/ui';
import type { Account } from '@/types/db';

// Faint full-card wash per type, layered under the card's own bg-card —
// a subtler cue than a colored border stripe.
const WASH_CLASS: Record<TagColor, string> = {
  gray: '',
  red: 'bg-gradient-to-br from-tag-red/[0.06] to-transparent',
  orange: 'bg-gradient-to-br from-tag-orange/[0.06] to-transparent',
  amber: 'bg-gradient-to-br from-tag-amber/[0.06] to-transparent',
  green: 'bg-gradient-to-br from-tag-green/[0.06] to-transparent',
  teal: 'bg-gradient-to-br from-tag-teal/[0.06] to-transparent',
  blue: 'bg-gradient-to-br from-tag-blue/[0.06] to-transparent',
  violet: 'bg-gradient-to-br from-tag-violet/[0.06] to-transparent',
  pink: 'bg-gradient-to-br from-tag-pink/[0.06] to-transparent',
};

interface AccountCardProps {
  account: Account;
  active: boolean;
  index?: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AccountCard({ account, active, index = 0, onSelect, onEdit, onDelete }: AccountCardProps) {
  const trades = useTrades(account.id);
  const capital = trades.data ? currentCapital(account, trades.data) : account.starting_capital;
  const delta = capital - account.starting_capital;
  const pct = account.starting_capital !== 0 ? delta / Math.abs(account.starting_capital) : 0;
  const color = ACCOUNT_TYPE_COLOR[account.account_type] ?? 'gray';
  const label = ACCOUNT_TYPE_LABEL[account.account_type] ?? account.account_type;

  // Growth bar: how far current capital sits above (green) or below (red) the
  // starting line, capped at ±100% so one blow-up doesn't flatten the rest.
  const barPct = Math.min(100, Math.abs(pct) * 100);

  return (
    <Card
      style={{ '--i': index } as React.CSSProperties}
      className={`animate-rise-in ${WASH_CLASS[color]} transition-[border-color,box-shadow] duration-200 ${
        active ? 'border-brand/60 shadow-[0_0_0_1px_rgba(139,133,234,0.25)]' : 'hover:border-border-strong'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-base font-semibold text-text">{account.name}</span>
            <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${gradientBadgeClass(color)}`}>
              {label}
            </span>
          </div>

          {/* The state the user asked about: green when this account is the one
              being journaled into, neutral grey when it is not. */}
          <div className="mt-2">
            {active ? (
              <StatusBadge tone="active" label="Aktiv" pulse />
            ) : (
              <StatusBadge tone="idle" label="Inaktiv" />
            )}
          </div>

          <div className="mt-4 text-[11px] uppercase tracking-[0.08em] text-text-dim">Aktuelles Kapital</div>
          <div className="num text-2xl font-semibold text-text">{formatCurrency(capital, account.currency)}</div>

          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className={`num font-medium ${pnlToneClass(delta)}`}>
              {formatSignedCurrency(delta, account.currency)}
            </span>
            <span className={`num ${pnlToneClass(delta)}`}>
              ({delta >= 0 ? '+' : ''}
              {(pct * 100).toFixed(1)}%)
            </span>
            <span className="num text-text-dim">
              Start {formatCurrency(account.starting_capital, account.currency)}
            </span>
          </div>

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-border/70">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                delta >= 0 ? 'bg-profit' : 'bg-loss'
              }`}
              style={{ width: `${Math.max(2, barPct)}%` }}
            />
          </div>
        </button>

        <div className="flex shrink-0 flex-col gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            Bearbeiten
          </Button>
          <Button size="sm" variant="danger" onClick={onDelete}>
            Löschen
          </Button>
        </div>
      </div>
    </Card>
  );
}
