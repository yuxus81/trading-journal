import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '@/store/uiStore';
import { useAccounts } from '@/features/accounts/useAccounts';
import { useTrades } from '@/features/trades/useTrades';
import { filterTrades } from '@/features/trades/filterTrades';
import { TradeFilters } from '@/features/trades/TradeFilters';
import { computeMetrics } from '@/features/metrics/calc';
import { ACCOUNT_TYPE_LABEL } from '@/features/accounts/accountMeta';
import { PageHeader } from '@/components/layout/PageHeader';
import { HeroStats } from './HeroStats';
import { KpiGrid } from './KpiGrid';
import { EquityChart } from './EquityChart';
import { SetupBreakdown } from './SetupBreakdown';
import { RatingBreakdown } from './RatingBreakdown';
import { Button, DashboardIcon, EmptyState, Money, SectionCard, Spinner } from '@/components/ui';

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
        icon={<DashboardIcon />}
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
      <PageHeader
        title="Dashboard"
        subtitle={
          <>
            {account.name} · {ACCOUNT_TYPE_LABEL[account.account_type]} ·{' '}
            <span className="num">{filtered.length}</span> von <span className="num">{trades?.length ?? 0}</span>{' '}
            Trades
          </>
        }
      />

      {hasTrades && <TradeFilters assets={[]} setups={[]} newsTags={[]} weekEventTags={[]} compact />}

      {!hasTrades ? (
        <EmptyState
          icon={<DashboardIcon />}
          title="Noch keine Trades"
          description="Trage deinen ersten Trade ein, um Kennzahlen und Charts zu sehen."
          action={<Button onClick={() => navigate('/trades')}>Zu den Trades</Button>}
        />
      ) : filtered.length === 0 || !metrics ? (
        <EmptyState title="Keine Treffer" description="Passe die Filter an, um Kennzahlen zu sehen." />
      ) : (
        <>
          <HeroStats metrics={metrics} currency={currency} />
          <KpiGrid metrics={metrics} currency={currency} />

          <SectionCard
            title="Equity-Kurve"
            aside={<Money value={metrics.netPnl} currency={currency} signed className="text-sm font-medium" />}
          >
            <EquityChart data={metrics.equityCurve} currency={currency} />
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Nach Setup">
              <SetupBreakdown data={metrics.bySetup} currency={currency} />
            </SectionCard>
            <SectionCard title="Nach Rating">
              <RatingBreakdown data={metrics.byRating} currency={currency} />
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
