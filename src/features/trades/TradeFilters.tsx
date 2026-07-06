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
  compact?: boolean;
}

export function TradeFilters({ assets, setups, compact = false }: TradeFiltersProps) {
  const filters = useUiStore((s) => s.tradeFilters);
  const setTradeFilters = useUiStore((s) => s.setTradeFilters);
  const resetFilters = useUiStore((s) => s.resetFilters);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="inline-flex rounded-input border border-border bg-bg p-1">
        {resultTabs.map((t) => {
          const active = filters.result === t.value;
          const activeClass =
            t.value === 'wins' ? 'bg-profit/15 text-profit' : t.value === 'losses' ? 'bg-loss/15 text-loss' : 'bg-accent text-accent-ink';
          return (
            <button
              key={t.value}
              onClick={() => setTradeFilters({ result: t.value })}
              className={`h-8 rounded-[7px] px-3 text-sm font-medium transition-colors ${active ? activeClass : 'text-text-muted hover:text-text'}`}
            >
              {t.label}
            </button>
          );
        })}
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

      <Button variant="ghost" size="sm" onClick={resetFilters}>
        Zurücksetzen
      </Button>
    </div>
  );
}
