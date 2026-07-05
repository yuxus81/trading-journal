import { useUiStore, type ResultFilter } from '@/store/uiStore';
import { Button, Select } from '@/components/ui';

const resultTabs: { value: ResultFilter; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'wins', label: 'Wins' },
  { value: 'losses', label: 'Losses' },
];

interface TradeFiltersProps {
  assets: string[];
  setups: string[];
  /** Hide the setup/asset selects (e.g. on the dashboard). */
  compact?: boolean;
}

export function TradeFilters({ assets, setups, compact = false }: TradeFiltersProps) {
  const filters = useUiStore((s) => s.tradeFilters);
  const setTradeFilters = useUiStore((s) => s.setTradeFilters);
  const resetFilters = useUiStore((s) => s.resetFilters);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="inline-flex rounded-input border border-border bg-bg p-1">
        {resultTabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTradeFilters({ result: t.value })}
            className={`h-8 rounded-[7px] px-3 text-sm font-medium transition-colors ${
              filters.result === t.value ? 'bg-accent text-accent-ink' : 'text-text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!compact && (
        <>
          <div className="w-40">
            <Select
              value={filters.setup ?? ''}
              onChange={(v) => setTradeFilters({ setup: v || null })}
              options={[{ value: '', label: 'Alle Setups' }, ...setups.map((s) => ({ value: s, label: s }))]}
            />
          </div>
          <div className="w-32">
            <Select
              value={filters.asset ?? ''}
              onChange={(v) => setTradeFilters({ asset: v || null })}
              options={[{ value: '', label: 'Alle Assets' }, ...assets.map((a) => ({ value: a, label: a }))]}
            />
          </div>
        </>
      )}

      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1.5 text-sm text-text-muted">
          Von
          <input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) => setTradeFilters({ dateFrom: e.target.value || null })}
            className="h-10 rounded-input border border-border bg-bg px-2 text-sm text-text focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-text-muted">
          Bis
          <input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) => setTradeFilters({ dateTo: e.target.value || null })}
            className="h-10 rounded-input border border-border bg-bg px-2 text-sm text-text focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      <Button variant="ghost" size="sm" onClick={resetFilters}>
        Zurücksetzen
      </Button>
    </div>
  );
}
