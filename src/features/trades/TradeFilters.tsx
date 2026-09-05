import { useState } from 'react';
import { useUiStore, type ResultFilter } from '@/store/uiStore';
import { Button, ChevronDownIcon, FilterIcon, Input, InstrumentBadge, Segmented, Tag } from '@/components/ui';
import type { SegmentOption } from '@/components/ui';
import type { NewsTag, Setup, WeekEvent } from '@/types/db';

// The result filter is the one place where win/loss colour belongs in a
// control: the switch adopts the colour of the outcome it is showing.
const resultTabs: SegmentOption<ResultFilter>[] = [
  { value: 'all', label: 'Alle', tone: 'default' },
  { value: 'wins', label: 'Wins', tone: 'profit' },
  { value: 'losses', label: 'Losses', tone: 'loss' },
];

interface TradeFiltersProps {
  assets: string[];
  setups: Setup[];
  newsTags: NewsTag[];
  weekEventTags: WeekEvent[];
  compact?: boolean;
}

export function TradeFilters({
  assets,
  setups,
  newsTags,
  weekEventTags,
  compact = false,
}: TradeFiltersProps) {
  const filters = useUiStore((s) => s.tradeFilters);
  const setTradeFilters = useUiStore((s) => s.setTradeFilters);
  const resetFilters = useUiStore((s) => s.resetFilters);
  const [open, setOpen] = useState(false);

  const activeCount =
    (filters.setup ? 1 : 0) +
    (filters.asset ? 1 : 0) +
    filters.news.length +
    filters.weekEvents.length +
    (filters.timeFrom || filters.timeTo ? 1 : 0);

  const toggleNews = (name: string) => {
    setTradeFilters({
      news: filters.news.includes(name) ? filters.news.filter((n) => n !== name) : [...filters.news, name],
    });
  };

  const toggleWeekEvent = (name: string) => {
    setTradeFilters({
      weekEvents: filters.weekEvents.includes(name)
        ? filters.weekEvents.filter((n) => n !== name)
        : [...filters.weekEvents, name],
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={filters.result} onChange={(v) => setTradeFilters({ result: v })} options={resultTabs} />

        {!compact && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={`inline-flex h-9 items-center gap-2 rounded-input border px-3 text-sm font-medium transition-colors ${
              open || activeCount > 0
                ? 'border-brand/50 bg-brand/12 text-text'
                : 'border-border text-text-muted hover:border-border-strong hover:text-text'
            }`}
          >
            <FilterIcon width={15} height={15} />
            Filter
            {activeCount > 0 && (
              <span className="num flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-accent-ink">
                {activeCount}
              </span>
            )}
            <ChevronDownIcon
              width={14}
              height={14}
              className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </button>
        )}

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Zurücksetzen
          </Button>
        )}
      </div>

      {!compact && open && (
        <div className="flex animate-rise-in flex-col gap-4 rounded-card border border-border bg-card p-4">
          {setups.length > 0 && (
            <FilterRow title="Setup">
              {setups.map((s) => (
                <FilterChip
                  key={s.name}
                  selected={filters.setup === s.name}
                  onClick={() => setTradeFilters({ setup: filters.setup === s.name ? null : s.name })}
                >
                  <Tag label={s.name} color={s.color} />
                </FilterChip>
              ))}
            </FilterRow>
          )}

          {assets.length > 0 && (
            <FilterRow title="Asset">
              {assets.map((a) => (
                <FilterChip
                  key={a}
                  selected={filters.asset === a}
                  onClick={() => setTradeFilters({ asset: filters.asset === a ? null : a })}
                >
                  <InstrumentBadge asset={a} />
                </FilterChip>
              ))}
            </FilterRow>
          )}

          {newsTags.length > 0 && (
            <FilterRow title="News">
              {newsTags.map((n) => (
                <FilterChip
                  key={n.name}
                  selected={filters.news.includes(n.name)}
                  onClick={() => toggleNews(n.name)}
                >
                  <Tag label={n.name} color={n.color} />
                </FilterChip>
              ))}
            </FilterRow>
          )}

          {weekEventTags.length > 0 && (
            <FilterRow title="Wochen-Events">
              {weekEventTags.map((n) => (
                <FilterChip
                  key={n.name}
                  selected={filters.weekEvents.includes(n.name)}
                  onClick={() => toggleWeekEvent(n.name)}
                >
                  <Tag label={n.name} color={n.color} />
                </FilterChip>
              ))}
            </FilterRow>
          )}

          <FilterRow title="Zeitfenster">
            <div className="flex items-center gap-2">
              <Input
                type="time"
                aria-label="Von"
                value={filters.timeFrom ?? ''}
                onChange={(e) => setTradeFilters({ timeFrom: e.target.value || null })}
                className="num w-32"
              />
              <span className="text-text-dim">–</span>
              <Input
                type="time"
                aria-label="Bis"
                value={filters.timeTo ?? ''}
                onChange={(e) => setTradeFilters({ timeTo: e.target.value || null })}
                className="num w-32"
              />
            </div>
          </FilterRow>
        </div>
      )}
    </div>
  );
}

function FilterRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-dim">{title}</span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

/** Unselected chips dim rather than disappear, so the full set stays scannable. */
function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-md p-0.5 transition-all duration-200 ${
        selected ? 'ring-1 ring-brand/70' : 'opacity-45 hover:opacity-90'
      }`}
    >
      {children}
    </button>
  );
}
