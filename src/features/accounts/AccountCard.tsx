import { useTrades } from '@/features/trades/useTrades';
import { currentCapital } from '@/features/metrics/calc';
import { formatCurrency } from '@/lib/format';
import { Button, Card, gradientBadgeClass, type TagColor } from '@/components/ui';
import type { Account, AccountType } from '@/types/db';

const TYPE_LABEL: Record<AccountType, string> = {
  backtest: 'Backtest',
  demo: 'Demo',
  eval: 'Eval',
  funded: 'Funded',
  live: 'Live',
};

const TYPE_COLOR: Record<AccountType, TagColor> = {
  backtest: 'gray',
  demo: 'blue',
  eval: 'amber',
  funded: 'teal',
  live: 'green',
};

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
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AccountCard({ account, active, onSelect, onEdit, onDelete }: AccountCardProps) {
  const trades = useTrades(account.id);
  const capital = trades.data ? currentCapital(account, trades.data) : account.starting_capital;
  const color = TYPE_COLOR[account.account_type] ?? 'gray';
  const label = TYPE_LABEL[account.account_type] ?? account.account_type;

  return (
    <Card className={`${WASH_CLASS[color]} ${active ? 'border-accent/60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <button onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="truncate text-base font-medium text-text">{account.name}</span>
            <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${gradientBadgeClass(color)}`}>
              {label}
            </span>
            {active && <span className="text-[11px] text-accent">aktiv</span>}
          </div>
          <div className="mt-3 text-xs text-text-muted">Aktuelles Kapital</div>
          <div className="text-2xl font-medium text-text">{formatCurrency(capital, account.currency)}</div>
          <div className="mt-1 text-xs text-text-dim">
            Start: {formatCurrency(account.starting_capital, account.currency)}
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
