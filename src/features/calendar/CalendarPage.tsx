import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '@/store/uiStore';
import { useAccounts } from '@/features/accounts/useAccounts';
import { useTrades } from '@/features/trades/useTrades';
import { maxAbsPnl, monthGrid, pnlByDay, tradeCountByDay } from './calendarData';
import { CalendarHeatmap } from './CalendarHeatmap';
import { DayTradesPanel } from './DayTradesPanel';
import { Button, Card, EmptyState, Spinner } from '@/components/ui';
import { formatSignedCurrency } from '@/lib/format';

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-text">Kalender</h1>
        <div className="flex items-center gap-2">
          <button onClick={prev} aria-label="Vorheriger Monat" className="px-2 text-lg text-text-muted hover:text-text">
            ‹
          </button>
          <span className="min-w-[9rem] text-center text-sm font-medium text-text">
            {MONTHS_DE[month]} {year}
          </span>
          <button onClick={next} aria-label="Nächster Monat" className="px-2 text-lg text-text-muted hover:text-text">
            ›
          </button>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex justify-end text-sm">
          <span className="text-text-muted">Monat:&nbsp;</span>
          <span className={monthTotal > 0 ? 'text-profit' : monthTotal < 0 ? 'text-loss' : 'text-text-muted'}>
            {formatSignedCurrency(monthTotal, currency)}
          </span>
        </div>
        <CalendarHeatmap
          cells={cells}
          pnlMap={pnlMap}
          tradeCountMap={tradeCountMap}
          maxAbs={maxAbs}
          currency={currency}
          selected={selected}
          onSelect={setSelected}
        />
      </Card>

      {selected && (
        <DayTradesPanel day={selected} trades={dayTrades} currency={currency} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
