import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '@/store/uiStore';
import { useAccounts } from '@/features/accounts/useAccounts';
import { useTrades } from '@/features/trades/useTrades';
import { maxAbsPnl, monthGrid, pnlByDay, tradeCountByDay } from './calendarData';
import { CalendarHeatmap } from './CalendarHeatmap';
import { DayTradesPanel } from './DayTradesPanel';
import {
  Button,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EmptyState,
  Money,
  SectionCard,
  Spinner,
} from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';

const MONTHS_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export function CalendarPage() {
  const navigate = useNavigate();
  const activeAccountId = useUiStore((s) => s.activeAccountId);
  const { data: accounts } = useAccounts();
  const { data: trades, isLoading } = useTrades(activeAccountId);
  const account = accounts?.find((a) => a.id === activeAccountId) ?? null;
  const currency = account?.currency ?? 'USD';

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const pnlMap = useMemo(() => pnlByDay(trades ?? []), [trades]);
  const tradeCountMap = useMemo(() => tradeCountByDay(trades ?? []), [trades]);
  const cells = useMemo(() => monthGrid(year, month), [year, month]);
  const maxAbs = useMemo(() => maxAbsPnl(cells, pnlMap), [cells, pnlMap]);
  const monthTotal = cells.reduce((s, d) => (d ? s + (pnlMap.get(d) ?? 0) : s), 0);
  const dayTrades = selected ? (trades ?? []).filter((t) => t.trade_date === selected) : [];

  const prev = () => {
    setSelected(null);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const next = () => {
    setSelected(null);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  if (!activeAccountId || !account) {
    return (
      <EmptyState
        icon={<CalendarIcon />}
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kalender"
        subtitle="Farbe zeigt das Tagesergebnis, Punkte die Anzahl der Trades."
        actions={
          <div className="flex items-center gap-1 rounded-input border border-border bg-card p-1">
            <button
              onClick={prev}
              aria-label="Vorheriger Monat"
              className="flex h-8 w-8 items-center justify-center rounded-[7px] text-text-muted transition-colors hover:bg-border/60 hover:text-text"
            >
              <ChevronLeftIcon width={16} height={16} />
            </button>
            <span className="min-w-[9.5rem] text-center text-sm font-medium text-text">
              {MONTHS_DE[month]} <span className="num text-text-muted">{year}</span>
            </span>
            <button
              onClick={next}
              aria-label="Nächster Monat"
              className="flex h-8 w-8 items-center justify-center rounded-[7px] text-text-muted transition-colors hover:bg-border/60 hover:text-text"
            >
              <ChevronRightIcon width={16} height={16} />
            </button>
          </div>
        }
      />

      <SectionCard
        title={`${MONTHS_DE[month]} ${year}`}
        aside={
          <span className="flex items-center gap-2 text-sm">
            <span className="text-text-dim">Monat</span>
            <Money value={monthTotal} currency={currency} signed className="font-medium" />
          </span>
        }
      >
        <CalendarHeatmap
          cells={cells}
          pnlMap={pnlMap}
          tradeCountMap={tradeCountMap}
          maxAbs={maxAbs}
          currency={currency}
          selected={selected}
          onSelect={setSelected}
        />
      </SectionCard>

      {selected && (
        <DayTradesPanel day={selected} trades={dayTrades} currency={currency} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
