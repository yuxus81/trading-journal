import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '@/store/uiStore';
import { useAccounts } from '@/features/accounts/useAccounts';
import { useTrades } from '@/features/trades/useTrades';
import { filterTrades } from '@/features/trades/filterTrades';
import { TradeFilters } from '@/features/trades/TradeFilters';
import { computeMetrics } from '@/features/metrics/calc';
import { KpiGrid } from './KpiGrid';
import { EquityChart } from './EquityChart';
import { SetupBreakdown } from './SetupBreakdown';
import { RatingBreakdown } from './RatingBreakdown';
import { Button, Card, EmptyState, Spinner } from '@/components/ui';

export function DashboardPage() {
  const navigate = useNavigate();
  const activeAccountId = useUiStore((s) => s.activeAccountId);
  const filters = useUiStore((s) => s.tradeFilters);
  const { data: accounts } = useAccounts();
  const { data: trades, isLoading } = useTrades(activeAccountId);

  const account = accounts?.find((a) => a.id === activeAccountId) ?? null;
  const currency = account?.currency ?? 'USD';

  const filtered = useMemo(() => filterTrades(trades ?? [], filters), [trades, filters]);
  const metrics = useMemo(() => (account ? computeMetrics(filtered, account) : null), [filtered, account]);

  if (!activeAccountId || !account) {
    return (
      <EmptyState
        title="Kein Konto gewählt"
        description="Wähle oben ein Konto oder lege unter Konten ein neues an."
        action={<Button onClick={() => navigate('/accounts')}>Zu den Konten</Button>}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const hasTrades = (trades ?? []).length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-text">Dashboard</h1>
      </div>

      {hasTrades && <TradeFilters assets={[]} setups={[]} newsTags={[]} compact />}

      {!hasTrades ? (
        <EmptyState
          title="Noch keine Trades"
          description="Trage deinen ersten Trade ein, um Kennzahlen und Charts zu sehen."
          action={<Button onClick={() => navigate('/trades')}>Zu den Trades</Button>}
        />
      ) : filtered.length === 0 || !metrics ? (
        <EmptyState title="Keine Treffer" description="Passe die Filter an, um Kennzahlen zu sehen." />
      ) : (
        <>
          <KpiGrid metrics={metrics} currency={currency} />

          <Card>
            <h2 className="mb-4 font-medium text-text">Equity-Kurve</h2>
            <EquityChart data={metrics.equityCurve} currency={currency} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 font-medium text-text">Nach Setup</h2>
              <SetupBreakdown data={metrics.bySetup} currency={currency} />
            </Card>
            <Card>
              <h2 className="mb-4 font-medium text-text">Nach Rating</h2>
              <RatingBreakdown data={metrics.byRating} currency={currency} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
