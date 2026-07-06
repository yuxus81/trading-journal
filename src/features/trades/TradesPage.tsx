import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTrades } from './useTrades';
import { useSetups } from './useSetups';
import { filterTrades } from './filterTrades';
import { TradeFilters } from './TradeFilters';
import { TradesTable } from './TradesTable';
import { useAccounts } from '@/features/accounts/useAccounts';
import { useUiStore } from '@/store/uiStore';
import { Button, EmptyState, Spinner } from '@/components/ui';

export function TradesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeAccountId = useUiStore((s) => s.activeAccountId);
  const filters = useUiStore((s) => s.tradeFilters);
  const { data: accounts } = useAccounts();
  const { data: trades, isLoading } = useTrades(activeAccountId);
  const { data: setups } = useSetups();

  const account = accounts?.find((a) => a.id === activeAccountId) ?? null;
  const currency = account?.currency ?? 'USD';

  const assets = useMemo(() => [...new Set((trades ?? []).map((t) => t.asset))], [trades]);
  const filtered = useMemo(() => filterTrades(trades ?? [], filters), [trades, filters]);

  const newTrade = () => navigate('/trades/new', { state: { backgroundLocation: location } });

  if (!activeAccountId) {
    return (
      <EmptyState
        title="Kein Konto gewählt"
        description="Wähle oben ein Konto oder lege unter Konten ein neues an."
        action={<Button onClick={() => navigate('/accounts')}>Zu den Konten</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-text">Trades</h1>
      </div>

      <TradeFilters assets={assets} setups={(setups ?? []).map((s) => s.name)} />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={trades && trades.length > 0 ? 'Keine Treffer' : 'Noch keine Trades'}
          description={
            trades && trades.length > 0
              ? 'Passe die Filter an, um Trades zu sehen.'
              : 'Trage deinen ersten Trade ein, um Kennzahlen zu sammeln.'
          }
          action={<Button onClick={newTrade}>+ Neuer Trade</Button>}
        />
      ) : (
        <TradesTable trades={filtered} currency={currency} />
      )}
    </div>
  );
}
