import { useCashEvents } from './useCashEvents';
import { useTrades } from '@/features/trades/useTrades';
import { currentCapital } from '@/features/metrics/calc';
import { formatCurrency } from '@/lib/format';
import { Button, Card } from '@/components/ui';
import type { Account } from '@/types/db';

const typeLabels: Record<Account['account_type'], string> = {
  prop: 'Prop',
  live: 'Live',
  demo: 'Demo',
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
  const cash = useCashEvents(account.id);

  const capital =
    trades.data && cash.data
      ? currentCapital(account, trades.data, cash.data)
      : account.starting_capital;

  return (
    <Card className={active ? 'border-accent/60' : ''}>
      <div className="flex items-start justify-between gap-3">
        <button onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-text">{account.name}</span>
            <span className="rounded bg-border/70 px-1.5 py-0.5 text-[11px] text-text-muted">
              {typeLabels[account.account_type]}
            </span>
            {active && <span className="text-[11px] text-accent">aktiv</span>}
          </div>
          <div className="mt-3 text-xs text-text-muted">Aktuelles Kapital</div>
          <div className="text-lg font-medium text-text">{formatCurrency(capital, account.currency)}</div>
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
