import { useState } from 'react';
import { useUiStore, type ResultFilter } from '@/store/uiStore';
import { Button, Input, InstrumentBadge, Tag } from '@/components/ui';
import type { NewsTag, Setup } from '@/types/db';

const resultTabs: { value: ResultFilter; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'wins', label: 'Wins' },
  { value: 'losses', label: 'Losses' },
];

interface TradeFiltersProps {
  assets: string[];
  setups: Setup[];
  newsTags: NewsTag[];
  compact?: boolean;
}

export function TradeFilters({ assets, setups, newsTags, compact = false }: TradeFiltersProps) {
  const filters = useUiStore((s) => s.tradeFilters);
  const setTradeFilters = useUiStore((s) => s.setTradeFilters);
  const resetFilters = useUiStore((s) => s.resetFilters);
  const [open, setOpen] = useState(false);

  const activeCount =
    (filters.setup ? 1 : 0) +
    (filters.asset ? 1 : 0) +
    filters.news.length +
    (filters.timeFrom || filters.timeTo ? 1 : 0);

  const toggleNews = (name: string) => {
    setTradeFilters({
      news: filters.news.includes(name) ? filters.news.filter((n) => n !== name) : [...filters.news, name],
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
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
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-input border px-3 text-sm font-medium transition-colors ${
              open || activeCount > 0 ? 'border-accent/50 bg-accent/10 text-text' : 'border-border text-text-muted hover:text-text'
            }`}
          >
            Filter
            {activeCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-ink">
                {activeCount}
              </span>
            )}
          </button>
        )}

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Zurücksetzen
          </Button>
        )}
      </div>

      {!compact && open && (
        <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-4">
          {setups.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-dim">Setup</span>
              <div className="flex flex-wrap gap-1.5">
                {setups.map((s) => {
                  const selected = filters.setup === s.name;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setTradeFilters({ setup: selected ? null : s.name })}
                      className={`rounded-md transition-opacity ${selected ? '' : 'opacity-50 hover:opacity-80'}`}
                    >
                      <Tag label={s.name} color={s.color} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {assets.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-dim">Asset</span>
              <div className="flex flex-wrap gap-1.5">
                {assets.map((a) => {
                  const selected = filters.asset === a;
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setTradeFilters({ asset: selected ? null : a })}
                      className={`rounded-md transition-opacity ${selected ? '' : 'opacity-50 hover:opacity-80'}`}
                    >
                      <InstrumentBadge asset={a} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {newsTags.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-dim">News</span>
              <div className="flex flex-wrap gap-1.5">
                {newsTags.map((n) => {
                  const selected = filters.news.includes(n.name);
                  return (
                    <button
                      key={n.name}
                      type="button"
                      onClick={() => toggleNews(n.name)}
                      className={`rounded-md transition-opacity ${selected ? '' : 'opacity-50 hover:opacity-80'}`}
                    >
                      <Tag label={n.name} color={n.color} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-text-dim">Zeitfenster</span>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={filters.timeFrom ?? ''}
                onChange={(e) => setTradeFilters({ timeFrom: e.target.value || null })}
                className="w-32"
              />
              <span className="text-text-dim">–</span>
              <Input
                type="time"
                value={filters.timeTo ?? ''}
                onChange={(e) => setTradeFilters({ timeTo: e.target.value || null })}
                className="w-32"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
