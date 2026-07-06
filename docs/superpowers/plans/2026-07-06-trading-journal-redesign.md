# Trading Journal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Declutter the dashboard/filters, remove the unused Cash-Events feature, fix the calendar heatmap's contrast bug, color-code win/loss and long/short state, flatten the trade form with a new reusable colored-tag system for setups and news, and re-brand the app around the owner's own logo with a monochrome accent.

**Architecture:** Every change is additive/subtractive within the existing feature-folder layout (`src/features/*`, `src/components/ui/*`, `src/api/*`) — no new architectural layers. The one new concept is a shared "colored tag" pattern (`Tag` display component + `TagPicker` interactive component, backed by a `color` column on `setups` and a new mirroring `news_tags` table) reused by both Setup and News fields.

**Tech Stack:** No new dependencies. Same stack as the shipped app: React 18 + TypeScript (strict) + Vite 5 + Tailwind 3.4 + Supabase + TanStack Query + Zustand + Recharts + date-fns.

## Global Constraints

- Build gate: `npm run build` (`tsc && vite build`) must pass after every task.
- Test gate: `npm test` (`vitest run`) covers only the pure metrics module (`src/features/metrics/calc.ts`) — this is the project's established testing scope, don't add a component test harness.
- All colors are Tailwind tokens defined in `tailwind.config.ts` — never inline raw hex in `.tsx` files (existing project rule, see the file's own header comment).
- Tag colors come from a **fixed 9-value preset palette** (`gray` + 8 vivid colors) — no free-form hex/color picker (keeps it simple for a non-technical single user). Never build a Tailwind class name via string interpolation (e.g. `` `bg-tag-${color}` ``) — Tailwind's content scanner only finds literal class-name substrings in source files, so any color-to-class mapping must be a lookup table with each full class name written out literally, or the class will be silently missing from the production CSS.
- German UI copy throughout (matches existing convention).
- The `cash_events` Supabase table is left untouched (owner's choice) — no DB migration for its removal, app-layer only.
- The new `news_tags` table / `setups.color` column requires the owner to run a SQL snippet once in the Supabase SQL editor (same manual-migration pattern the project already uses) — this only gates the tag *data layer* (Tasks 8–11); Tasks 1–7 and 12–13 don't depend on it and are independently testable via `npm run build` + the running dev preview.
- Repo is on `main` directly, no active feature branch (matches how the whole app was built). Continue committing directly to `main`, one commit per task.

---

### Task 1: Dashboard — core/advanced KPI split, remove date-range filter

**Files:**
- Modify: `src/store/uiStore.ts`
- Modify: `src/features/trades/filterTrades.ts`
- Modify: `src/features/trades/TradeFilters.tsx`
- Modify: `src/features/dashboard/KpiGrid.tsx`

**Interfaces:**
- Consumes: `Metrics` type from `src/features/metrics/types.ts` (unchanged).
- Produces: `TradeFilters` type in `uiStore.ts` drops `dateFrom`/`dateTo` — every other task that reads `useUiStore((s) => s.tradeFilters)` must not reference those fields anymore (none do after this task).

- [ ] **Step 1: Remove `dateFrom`/`dateTo` from the filter state**

Edit `src/store/uiStore.ts`:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ResultFilter = 'all' | 'wins' | 'losses';

export interface TradeFilters {
  result: ResultFilter;
  setup: string | null;
  asset: string | null;
}

const emptyFilters: TradeFilters = {
  result: 'all',
  setup: null,
  asset: null,
};

interface UiState {
  activeAccountId: string | null;
  setActiveAccount: (id: string | null) => void;
  tradeFilters: TradeFilters;
  setTradeFilters: (patch: Partial<TradeFilters>) => void;
  resetFilters: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeAccountId: null,
      setActiveAccount: (id) => set({ activeAccountId: id }),
      tradeFilters: emptyFilters,
      setTradeFilters: (patch) => set((s) => ({ tradeFilters: { ...s.tradeFilters, ...patch } })),
      resetFilters: () => set({ tradeFilters: emptyFilters }),
    }),
    {
      name: 'trading-journal.ui',
      partialize: (s) => ({ activeAccountId: s.activeAccountId }),
    },
  ),
);
```

- [ ] **Step 2: Drop the date checks from the filter predicate**

Edit `src/features/trades/filterTrades.ts`:

```ts
import type { Trade } from '@/types/db';
import type { TradeFilters } from '@/store/uiStore';

/** Applies the shared trade filters (result, setup, asset). */
export function filterTrades(trades: Trade[], f: TradeFilters): Trade[] {
  return trades.filter((t) => {
    if (f.result === 'wins' && !(t.pnl > 0)) return false;
    if (f.result === 'losses' && !(t.pnl < 0)) return false;
    if (f.setup && t.setup !== f.setup) return false;
    if (f.asset && t.asset !== f.asset) return false;
    return true;
  });
}
```

- [ ] **Step 3: Remove the Von/Bis inputs from the filter bar**

Edit `src/features/trades/TradeFilters.tsx` — delete the `<div className="flex items-end gap-2">...Von...Bis...</div>` block (the two `<label>` blocks with `type="date"` inputs) that currently sits between the Setup/Asset selects and the "Zurücksetzen" button. Resulting file:

```tsx
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

      <Button variant="ghost" size="sm" onClick={resetFilters}>
        Zurücksetzen
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Split `KpiGrid` into core (always visible) + collapsible advanced section**

Replace `src/features/dashboard/KpiGrid.tsx` entirely:

```tsx
import { useState } from 'react';
import { KpiCard, type KpiTone } from './KpiCard';
import { formatCurrency, formatPercent, formatR, formatSignedCurrency } from '@/lib/format';
import type { Metrics } from '@/features/metrics/types';

const signTone = (n: number): KpiTone => (n > 0 ? 'profit' : n < 0 ? 'loss' : 'default');
const num = (n: number | null, digits = 2) => (n === null ? '—' : n.toFixed(digits));

interface KpiEntry {
  label: string;
  value: string;
  tone?: KpiTone;
}

interface KpiGridProps {
  metrics: Metrics;
  currency: string;
}

export function KpiGrid({ metrics: m, currency }: KpiGridProps) {
  const [expanded, setExpanded] = useState(false);

  const core: KpiEntry[] = [
    { label: 'Net PnL', value: formatSignedCurrency(m.netPnl, currency), tone: signTone(m.netPnl) },
    { label: 'Winrate', value: formatPercent(m.winrate) },
    { label: 'Trades', value: String(m.tradeCount) },
    { label: 'Ø Gewinn', value: formatCurrency(m.avgWin, currency), tone: m.avgWin > 0 ? 'profit' : 'default' },
  ];

  const advanced: KpiEntry[] = [
    { label: 'Ø Verlust', value: formatCurrency(m.avgLoss, currency), tone: m.avgLoss < 0 ? 'loss' : 'default' },
    { label: 'Profit Factor', value: num(m.profitFactor) },
    { label: 'Ø PnL/Trade', value: formatSignedCurrency(m.avgPnlPerTrade, currency), tone: signTone(m.avgPnlPerTrade) },
    { label: 'Payoff Ratio', value: num(m.payoffRatio) },
    { label: 'Ø R-Multiple', value: m.avgR === null ? '—' : formatR(m.avgR) },
    {
      label: 'Max Drawdown',
      value: m.maxDrawdown > 0 ? formatCurrency(-m.maxDrawdown, currency) : formatCurrency(0, currency),
      tone: m.maxDrawdown > 0 ? 'loss' : 'default',
    },
    { label: 'Bester Trade', value: m.best === null ? '—' : formatSignedCurrency(m.best, currency), tone: m.best && m.best > 0 ? 'profit' : 'default' },
    {
      label: 'Schlechtester Trade',
      value: m.worst === null ? '—' : formatSignedCurrency(m.worst, currency),
      tone: m.worst && m.worst < 0 ? 'loss' : 'default',
    },
    { label: 'Längste Serie (W / L)', value: `${m.longestWinStreak} / ${m.longestLossStreak}` },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {core.map((c) => (
          <KpiCard key={c.label} label={c.label} value={c.value} tone={c.tone} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-fit items-center gap-1.5 text-sm text-text-muted hover:text-text"
      >
        <span>Erweiterte Statistiken</span>
        <span>{expanded ? '▴' : '▾'}</span>
      </button>

      {expanded && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {advanced.map((c) => (
            <KpiCard key={c.label} label={c.label} value={c.value} tone={c.tone} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify and commit**

Run: `npm run build`
Expected: no TypeScript errors, build succeeds.

Then check in the running dev preview: Dashboard shows exactly 4 KPI cards by default, with an "Erweiterte Statistiken ▾" toggle beneath that reveals the rest on click. Both the Dashboard's compact filter bar and the Trades page filter bar no longer show "Von"/"Bis" date inputs.

```bash
git add src/store/uiStore.ts src/features/trades/filterTrades.ts src/features/trades/TradeFilters.tsx src/features/dashboard/KpiGrid.tsx
git commit -m "feat: split dashboard KPIs into core/advanced, remove date-range filter"
```

---

### Task 2: Bugfix — remove duplicate "Neuer Trade" button

**Files:**
- Modify: `src/features/trades/TradesPage.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new; purely removes a redundant render.

- [ ] **Step 1: Remove the page-header button, keep the Topbar's global one and the EmptyState's contextual one**

In `src/features/trades/TradesPage.tsx`, change the header block from:

```tsx
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-text">Trades</h1>
        <Button onClick={newTrade}>+ Neuer Trade</Button>
      </div>
```

to:

```tsx
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-text">Trades</h1>
      </div>
```

`newTrade` and the `Button` import stay — both are still used by the `EmptyState`'s `action={<Button onClick={newTrade}>+ Neuer Trade</Button>}` a few lines below.

- [ ] **Step 2: Verify and commit**

Run: `npm run build`
Expected: no TypeScript errors (in particular no "unused variable" error for `newTrade`, since it's still referenced by the `EmptyState` action).

Check in the preview: on the Trades page, "+ Neuer Trade" now appears only once — in the topbar (top-right, next to the account email). With trades present, the page header shows only the "Trades" title.

```bash
git add src/features/trades/TradesPage.tsx
git commit -m "fix: remove duplicate Neuer Trade button on Trades page"
```

---

### Task 3: Remove the Cash-Events feature (app layer only)

**Files:**
- Delete: `src/features/accounts/CashEventsPanel.tsx`
- Delete: `src/features/accounts/CashEventForm.tsx`
- Delete: `src/features/accounts/useCashEvents.ts`
- Delete: `src/api/cashEvents.ts`
- Modify: `src/features/accounts/AccountsPage.tsx`
- Modify: `src/features/accounts/AccountCard.tsx`
- Modify: `src/features/accounts/AccountSelector.tsx`
- Modify: `src/features/metrics/calc.ts`
- Modify: `src/features/metrics/calc.test.ts`
- Modify: `src/features/export/ExportPanel.tsx`
- Modify: `src/types/db.ts`

**Interfaces:**
- Produces: `currentCapital(account: Account, trades: Trade[]): number` — the `cashEvents` parameter is removed. Every caller (`AccountCard.tsx`, `AccountSelector.tsx`) is updated in this same task.

- [ ] **Step 1: Update the `currentCapital` test first (TDD)**

Edit `src/features/metrics/calc.test.ts` — remove the `CashEvent` import and replace the `currentCapital` describe block:

```ts
import { describe, it, expect } from 'vitest';
import { computeMetrics, currentCapital, sortTrades } from '@/features/metrics/calc';
import type { Account, Trade } from '@/types/db';
```

(only the import line changes; keep everything else in the file as-is up to the `currentCapital` block, then replace that block:)

```ts
describe('currentCapital', () => {
  it('adds trade pnl to starting capital', () => {
    expect(currentCapital(acc, [t({ pnl: 300 }), t({ pnl: -50 })])).toBe(1250);
  });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npm test`
Expected: FAIL — `currentCapital(acc, [...])` is called with 2 arguments but the current implementation does `cashEvents.reduce(...)` on an `undefined` third argument, throwing a TypeError at runtime.

- [ ] **Step 3: Update `currentCapital` to drop the `cashEvents` parameter**

Edit `src/features/metrics/calc.ts` — change the import and the function:

```ts
import type { Account, Trade } from '@/types/db';
import type { EquityPoint, Metrics, RatingStat, SetupStat } from './types';
```

```ts
/** starting_capital + Σ trade pnl. Never stored. */
export function currentCapital(account: Account, trades: Trade[]): number {
  const pnl = trades.reduce((s, t) => s + t.pnl, 0);
  return account.starting_capital + pnl;
}
```

- [ ] **Step 4: Run the test to see it pass**

Run: `npm test`
Expected: PASS (all `calc.test.ts` tests green).

- [ ] **Step 5: Delete the cash-events files**

```bash
rm src/features/accounts/CashEventsPanel.tsx
rm src/features/accounts/CashEventForm.tsx
rm src/features/accounts/useCashEvents.ts
rm src/api/cashEvents.ts
```

- [ ] **Step 6: Update `AccountCard.tsx` to drop `useCashEvents`**

```tsx
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
  const capital = trades.data ? currentCapital(account, trades.data) : account.starting_capital;

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
```

- [ ] **Step 7: Update `AccountSelector.tsx` to drop `useCashEvents`**

```tsx
import { useEffect } from 'react';
import { useAccounts } from './useAccounts';
import { useTrades } from '@/features/trades/useTrades';
import { useUiStore } from '@/store/uiStore';
import { currentCapital } from '@/features/metrics/calc';
import { formatCurrency } from '@/lib/format';

/** Topbar account switcher + live current-capital readout. */
export function AccountSelector() {
  const { data: accounts } = useAccounts();
  const activeAccountId = useUiStore((s) => s.activeAccountId);
  const setActiveAccount = useUiStore((s) => s.setActiveAccount);

  useEffect(() => {
    if (!accounts) return;
    const exists = activeAccountId && accounts.some((a) => a.id === activeAccountId);
    if (!exists) setActiveAccount(accounts[0]?.id ?? null);
  }, [accounts, activeAccountId, setActiveAccount]);

  const active = accounts?.find((a) => a.id === activeAccountId) ?? null;
  const trades = useTrades(activeAccountId);
  const capital = active && trades.data ? currentCapital(active, trades.data) : (active?.starting_capital ?? 0);

  if (!accounts || accounts.length === 0) {
    return <span className="text-sm text-text-dim">Kein Konto — unter „Konten" anlegen</span>;
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={activeAccountId ?? ''}
        onChange={(e) => setActiveAccount(e.target.value)}
        aria-label="Konto wählen"
        className="h-9 max-w-[10rem] rounded-input border border-border bg-card px-2 text-sm text-text focus:border-accent focus:outline-none"
      >
        {accounts.map((a) => (
          <option key={a.id} value={a.id} className="bg-card">
            {a.name}
          </option>
        ))}
      </select>
      {active && (
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-[11px] text-text-dim">Kapital</div>
          <div className="text-sm font-medium text-text">{formatCurrency(capital, active.currency)}</div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Remove the Cash-Events panel from `AccountsPage.tsx`**

Remove the `import { CashEventsPanel } from './CashEventsPanel';` line and the `const activeAccount = accounts?.find((a) => a.id === activeAccountId) ?? null;` line (both now unused). Then change:

```tsx
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((a) => (
              <AccountCard
                key={a.id}
                account={a}
                active={a.id === activeAccountId}
                onSelect={() => setActiveAccount(a.id)}
                onEdit={() => openEdit(a)}
                onDelete={() => setDeleting(a)}
              />
            ))}
          </div>

          {activeAccount && (
            <div className="max-w-2xl">
              <CashEventsPanel accountId={activeAccount.id} currency={activeAccount.currency} />
            </div>
          )}
        </>
      )}
```

to:

```tsx
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              active={a.id === activeAccountId}
              onSelect={() => setActiveAccount(a.id)}
              onEdit={() => openEdit(a)}
              onDelete={() => setDeleting(a)}
            />
          ))}
        </div>
      )}
```

- [ ] **Step 9: Remove the Cash-Events export option from `ExportPanel.tsx`**

Replace `src/features/export/ExportPanel.tsx` entirely:

```tsx
import { useState } from 'react';
import { Button, Modal, useToast } from '@/components/ui';
import { toCsv, downloadCsv } from './csv';
import { listAllTrades } from '@/api/trades';
import { listAccounts } from '@/api/accounts';
import type { Trade } from '@/types/db';

const TRADE_COLUMNS = [
  'id', 'account_id', 'asset', 'trade_date', 'exec_time', 'pnl', 'rating', 'direction',
  'r_multiple', 'setup', 'confidence', 'news', 'notes', 'created_at',
];
const ACCOUNT_COLUMNS = ['id', 'name', 'account_type', 'starting_capital', 'currency', 'created_at'];

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

interface ExportPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ExportPanel({ open, onClose }: ExportPanelProps) {
  const toast = useToast();
  const [trades, setTrades] = useState(true);
  const [accounts, setAccounts] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!trades && !accounts) {
      toast('Bitte mindestens einen Datensatz wählen.', 'error');
      return;
    }
    setBusy(true);
    try {
      if (trades) {
        const rows = await listAllTrades();
        const flat = rows.map((t: Trade) => ({ ...t, news: t.news.join('; ') }));
        downloadCsv(`trades-${stamp()}.csv`, toCsv(flat, TRADE_COLUMNS));
      }
      if (accounts) {
        const rows = await listAccounts();
        downloadCsv(`accounts-${stamp()}.csv`, toCsv(rows, ACCOUNT_COLUMNS));
      }
      toast('Export gestartet.', 'success');
      onClose();
    } catch {
      toast('Export fehlgeschlagen.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const Row = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center gap-3 rounded-input border border-border bg-bg px-3 py-2.5 text-sm text-text">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border bg-bg accent-accent"
      />
      {label}
    </label>
  );

  return (
    <Modal open={open} onClose={onClose} title="CSV-Export (Backup)" size="max-w-sm">
      <p className="text-sm text-text-muted">
        Wähle die Datensätze, die du als CSV sichern möchtest. Empfohlen als regelmäßiges Backup.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Row label="Trades (alle Konten)" checked={trades} onChange={setTrades} />
        <Row label="Konten" checked={accounts} onChange={setAccounts} />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Abbrechen
        </Button>
        <Button onClick={run} disabled={busy}>
          {busy ? 'Exportieren…' : 'Exportieren'}
        </Button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 10: Remove the cash-event types**

Edit `src/types/db.ts` — remove `CashEventType`, the `CashEvent` interface, and `NewCashEvent`. Resulting file:

```ts
export type AccountType = 'prop' | 'live' | 'demo';
export type Direction = 'long' | 'short';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  starting_capital: number;
  currency: string;
  created_at: string;
}

export interface Trade {
  id: string;
  account_id: string;
  user_id: string;
  asset: string;
  trade_date: string;
  exec_time: string | null;
  pnl: number;
  rating: number | null;
  news: string[];
  direction: Direction | null;
  r_multiple: number | null;
  setup: string | null;
  confidence: number | null;
  notes: string | null;
  created_at: string;
}

export interface TradeImage {
  id: string;
  trade_id: string;
  user_id: string;
  storage_path: string;
  created_at: string;
}

export interface Setup {
  id: string;
  user_id: string;
  name: string;
}

export type NewAccount = Pick<Account, 'name' | 'account_type' | 'starting_capital' | 'currency'>;
export type NewTrade = Omit<Trade, 'id' | 'user_id' | 'created_at'>;
export type UpdateTrade = Partial<Omit<Trade, 'id' | 'user_id' | 'account_id' | 'created_at'>>;
```

- [ ] **Step 11: Verify and commit**

Run: `npm test`
Expected: PASS.

Run: `npm run build`
Expected: no TypeScript errors (confirms no dangling `CashEvent`/`useCashEvents` references anywhere).

Check in the preview: Accounts page no longer shows a "Cash-Events" card. The account cards' "Aktuelles Kapital" figure still shows (now purely starting capital + trade PnL). The topbar's account selector still shows a capital readout. The export drawer only offers "Trades" and "Konten".

```bash
git add -A
git commit -m "feat: remove Cash-Events feature from the app (DB table left untouched)"
```

---

### Task 4: Calendar heatmap — fixed-band contrast redesign

**Files:**
- Modify: `src/features/calendar/CalendarHeatmap.tsx`

**Interfaces:**
- Consumes: same props as before (`cells`, `pnlMap`, `maxAbs`, `currency`, `selected`, `onSelect`) — no change to `calendarData.ts` or `CalendarPage.tsx`.

- [ ] **Step 1: Replace the continuous alpha ramp with fixed hex bands, and fix text contrast/sizing**

Replace `src/features/calendar/CalendarHeatmap.tsx` entirely:

```tsx
import { formatCurrency } from '@/lib/format';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// Fixed 4-step bands (darkest → richest) — no computed opacity, so small-PnL
// days stay clearly visible instead of fading into the card background.
const LOSS_BANDS = ['#3B1F22', '#5A242A', '#7A2C31', '#A6343B'];
const WIN_BANDS = ['#1F3B2E', '#245A3A', '#2C7A48', '#2FA65B'];

function bandFor(pnl: number, maxAbs: number): string | undefined {
  if (pnl === 0 || maxAbs === 0) return undefined;
  const bands = pnl > 0 ? WIN_BANDS : LOSS_BANDS;
  const ratio = Math.abs(pnl) / maxAbs;
  const idx = Math.min(bands.length - 1, Math.floor(ratio * bands.length));
  return bands[idx];
}

interface CalendarHeatmapProps {
  cells: (string | null)[];
  pnlMap: Map<string, number>;
  maxAbs: number;
  currency: string;
  selected: string | null;
  onSelect: (day: string) => void;
}

export function CalendarHeatmap({ cells, pnlMap, maxAbs, currency, selected, onSelect }: CalendarHeatmapProps) {
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-xs text-text-dim">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;
          const pnl = pnlMap.get(day);
          const dayNum = Number(day.slice(8, 10));
          const active = selected === day;
          const band = pnl !== undefined ? bandFor(pnl, maxAbs) : undefined;
          return (
            <button
              key={day}
              onClick={() => onSelect(day)}
              style={band ? { backgroundColor: band } : undefined}
              className={`flex aspect-square flex-col justify-between rounded-md border p-2 text-left transition-colors ${
                active ? 'border-accent' : 'border-border hover:border-border-strong'
              }`}
            >
              <span className="text-sm font-medium text-text">{dayNum}</span>
              {pnl !== undefined && <span className="text-xs font-semibold text-text">{formatCurrency(pnl, currency)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify and commit**

Run: `npm run build`
Expected: no TypeScript errors.

Check in the preview (Calendar page, on a month with trades): the day number is clearly legible (bright, top-left, larger than before). Win days render in one of 4 distinct dark-to-medium green shades depending on size, loss days in one of 4 dark-to-medium red shades — no pale/washed-out tint. The PnL amount is always bright white text, readable on every band.

```bash
git add src/features/calendar/CalendarHeatmap.tsx
git commit -m "fix: calendar heatmap contrast (fixed bands, legible day number and pnl text)"
```

---

### Task 5: Trade form — remove progressive disclosure

**Files:**
- Modify: `src/features/trades/TradeForm.tsx`

**Interfaces:**
- Produces: `TradeForm` no longer has a `showAdvanced`/`confidenceOn` gate — all fields render unconditionally. Task 6 (color-coding) and Task 10 (tag picker wiring) both edit this same file next, on top of this flattened structure.

- [ ] **Step 1: Remove the `showAdvanced` state and wrapper, and the `confidenceOn` gate**

Replace `src/features/trades/TradeForm.tsx` entirely:

```tsx
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { useUiStore } from '@/store/uiStore';
import { useCreateTrade, useUpdateTrade, useTrades } from './useTrades';
import { useCreateSetup, useSetups } from './useSetups';
import { ImageUploader } from './ImageUploader';
import { uploadImage } from '@/api/storage';
import { addTradeImage } from '@/api/tradeImages';
import { Button, Input, StarRating, Slider, TagInput, Textarea, useToast } from '@/components/ui';
import type { Direction, NewTrade, Trade, UpdateTrade } from '@/types/db';

const DEFAULT_ASSETS = ['MNQ', 'MES'];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface TradeFormProps {
  initial?: Trade;
  onDone: () => void;
  onCancel: () => void;
}

export function TradeForm({ initial, onDone, onCancel }: TradeFormProps) {
  const { user } = useAuth();
  const activeAccountId = useUiStore((s) => s.activeAccountId);
  const create = useCreateTrade();
  const update = useUpdateTrade();
  const { data: setups } = useSetups();
  const createSetup = useCreateSetup();
  const { data: trades } = useTrades(activeAccountId);
  const toast = useToast();
  const queryClient = useQueryClient();

  const [asset, setAsset] = useState(initial?.asset ?? '');
  const [tradeDate, setTradeDate] = useState(initial?.trade_date ?? today());
  const [execTime, setExecTime] = useState(initial?.exec_time?.slice(0, 5) ?? '');
  const [pnl, setPnl] = useState(initial ? String(initial.pnl) : '');
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const [news, setNews] = useState<string[]>(initial?.news ?? []);
  const [images, setImages] = useState<File[]>([]);

  const [direction, setDirection] = useState<Direction | null>(initial?.direction ?? null);
  const [rMultiple, setRMultiple] = useState(initial?.r_multiple != null ? String(initial.r_multiple) : '');
  const [setup, setSetup] = useState(initial?.setup ?? '');
  const [confidence, setConfidence] = useState(initial?.confidence ?? 5);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const [saving, setSaving] = useState(false);

  const assetSuggestions = useMemo(() => {
    const used = new Set(DEFAULT_ASSETS);
    trades?.forEach((t) => used.add(t.asset));
    return [...used];
  }, [trades]);

  const setupNames = setups?.map((s) => s.name) ?? [];

  const submit = async () => {
    if (!asset.trim()) return toast('Bitte ein Asset angeben.', 'error');
    if (!tradeDate) return toast('Bitte ein Datum angeben.', 'error');
    if (pnl.trim() === '' || Number.isNaN(Number(pnl))) return toast('Bitte einen gültigen PnL angeben.', 'error');
    if (!initial && !activeAccountId) return toast('Kein Konto gewählt.', 'error');

    const fields = {
      asset: asset.trim(),
      trade_date: tradeDate,
      exec_time: execTime ? execTime : null,
      pnl: Number(pnl),
      rating,
      news,
      direction,
      r_multiple: rMultiple.trim() === '' ? null : Number(rMultiple),
      setup: setup.trim() || null,
      confidence,
      notes: notes.trim() || null,
    };

    setSaving(true);
    try {
      let tradeId = initial?.id;
      if (initial) {
        await update.mutateAsync({ id: initial.id, patch: fields as UpdateTrade });
      } else {
        const created = await create.mutateAsync({ account_id: activeAccountId as string, ...fields } as NewTrade);
        tradeId = created.id;
      }

      if (images.length > 0 && user && tradeId) {
        for (const file of images) {
          const path = await uploadImage(user.id, tradeId, file);
          await addTradeImage(tradeId, path);
        }
        queryClient.invalidateQueries({ queryKey: ['tradeImages', tradeId] });
      }

      const name = setup.trim();
      if (name && !setupNames.includes(name)) {
        await createSetup.mutateAsync(name);
      }

      toast(initial ? 'Trade aktualisiert.' : 'Trade gespeichert.', 'success');
      onDone();
    } catch {
      toast('Speichern fehlgeschlagen.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-5"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Input label="Asset" list="asset-suggestions" value={asset} onChange={(e) => setAsset(e.target.value)} placeholder="MNQ" required />
          <datalist id="asset-suggestions">
            {assetSuggestions.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
        <Input label="PnL" type="number" inputMode="decimal" step="any" value={pnl} onChange={(e) => setPnl(e.target.value)} placeholder="z. B. 250 oder -85" required />
        <Input label="Datum" type="date" value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} required />
        <Input label="Uhrzeit (optional)" type="time" value={execTime} onChange={(e) => setExecTime(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-text-muted">Bewertung</span>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <TagInput label="News des Tages" value={news} onChange={setNews} placeholder="z. B. CPI 14:30" />

      <ImageUploader value={images} onChange={setImages} />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-text-muted">Richtung</span>
        <div className="inline-flex rounded-input border border-border bg-bg p-1">
          {(['long', 'short'] as Direction[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection((cur) => (cur === d ? null : d))}
              className={`h-8 min-w-[5rem] rounded-[7px] px-4 text-sm font-medium capitalize transition-colors ${
                direction === d ? 'bg-accent text-accent-ink' : 'text-text-muted hover:text-text'
              }`}
            >
              {d === 'long' ? 'Long' : 'Short'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="R-Multiple" type="number" inputMode="decimal" step="any" value={rMultiple} onChange={(e) => setRMultiple(e.target.value)} placeholder="z. B. 2.5" />
        <div className="flex flex-col gap-1.5">
          <Input label="Setup / Strategie" list="setup-suggestions" value={setup} onChange={(e) => setSetup(e.target.value)} placeholder="z. B. Breakout" />
          <datalist id="setup-suggestions">
            {setupNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
      </div>

      <Slider label="Confidence (1–10)" min={1} max={10} value={confidence} onChange={setConfidence} />

      <Textarea label="Psychologie / Fehler-Notizen" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Speichern…' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verify and commit**

Run: `npm run build`
Expected: no TypeScript errors.

Check in the preview: opening "Neuer Trade" shows every field (Richtung, R-Multiple, Setup, Confidence-Slider, Notizen) immediately, with no "Erweiterte Felder" toggle.

```bash
git add src/features/trades/TradeForm.tsx
git commit -m "feat: flatten trade form (remove progressive disclosure)"
```

---

### Task 6: Color-code result tabs and the Long/Short toggle

**Files:**
- Modify: `src/features/trades/TradeFilters.tsx`
- Modify: `src/features/trades/TradeForm.tsx`

**Interfaces:**
- Consumes: existing `profit`/`loss` Tailwind tokens — no new tokens needed for this task.

- [ ] **Step 1: Color the result tabs (Wins = profit-tinted, Losses = loss-tinted)**

In `src/features/trades/TradeFilters.tsx`, replace the result-tabs block:

```tsx
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
```

with:

```tsx
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
```

- [ ] **Step 2: Color the Long/Short toggle (Long = profit-tinted, Short = loss-tinted)**

In `src/features/trades/TradeForm.tsx`, replace the direction toggle button's `className`:

```tsx
              className={`h-8 min-w-[5rem] rounded-[7px] px-4 text-sm font-medium capitalize transition-colors ${
                direction === d ? 'bg-accent text-accent-ink' : 'text-text-muted hover:text-text'
              }`}
```

with:

```tsx
              className={`h-8 min-w-[5rem] rounded-[7px] px-4 text-sm font-medium capitalize transition-colors ${
                direction !== d
                  ? 'text-text-muted hover:text-text'
                  : d === 'long'
                    ? 'bg-profit/15 text-profit'
                    : 'bg-loss/15 text-loss'
              }`}
```

- [ ] **Step 3: Verify and commit**

Run: `npm run build`
Expected: no TypeScript errors.

Check in the preview: on the Trades page, clicking "Wins" turns that tab green, "Losses" turns it red, "Alle" stays the neutral accent style. In the trade form, selecting "Long" turns it green, "Short" turns it red.

```bash
git add src/features/trades/TradeFilters.tsx src/features/trades/TradeForm.tsx
git commit -m "feat: color-code win/loss filter tabs and long/short toggle"
```

---

### Task 7: Tailwind — add the tag color palette

**Files:**
- Modify: `tailwind.config.ts`

**Interfaces:**
- Produces: 8 new color tokens under `theme.extend.colors.tag` (`tag-red`, `tag-orange`, `tag-amber`, `tag-green`, `tag-teal`, `tag-blue`, `tag-violet`, `tag-pink` as Tailwind utility names). `gray` is handled separately in Task 9 via existing `border`/`text-muted` tokens (no new hex needed for it). Tasks 9–11 consume these tokens as literal class-name strings.

- [ ] **Step 1: Add the `tag` color group**

Edit `tailwind.config.ts` — add a `tag` key inside `theme.extend.colors`:

```ts
import type { Config } from 'tailwindcss';

// Central design system. Components must reference these tokens, never raw hex.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#17181C',
        card: '#212329',
        border: { DEFAULT: '#2A2C33', strong: '#31333B' },
        text: { DEFAULT: '#ECEDEF', muted: '#8B8D96', dim: '#6E7079' },
        accent: { DEFAULT: '#8B85EA', ink: '#12103A' },
        profit: '#4ADE9E',
        loss: '#F98080',
        star: '#EAB94D',
        tag: {
          red: '#F87171',
          orange: '#FB923C',
          amber: '#FBBF24',
          green: '#4ADE9E',
          teal: '#2DD4BF',
          blue: '#60A5FA',
          violet: '#A78BFA',
          pink: '#F472B6',
        },
      },
      fontFamily: { sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '14px', input: '10px' },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        pageFade: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out both',
        'page-fade': 'pageFade 0.4s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 2: Verify and commit**

Run: `npm run build`
Expected: no errors (these tokens aren't referenced by any component yet, so this step alone changes nothing visible — it's a pure foundation for Tasks 9–11).

```bash
git add tailwind.config.ts
git commit -m "feat: add tag color palette tokens"
```

---

### Task 8: Tag data layer — schema, types, API, hooks

**Files:**
- Modify: `supabase/schema.sql`
- Create: `supabase/migrations/2026-07-06-tag-colors.sql`
- Modify: `src/types/db.ts`
- Modify: `src/api/setups.ts`
- Modify: `src/features/trades/useSetups.ts`
- Create: `src/api/newsTags.ts`
- Create: `src/features/trades/useNewsTags.ts`
- Modify: `src/features/trades/TradeForm.tsx` (temporary one-line compatibility fix, replaced properly in Task 10)

**Interfaces:**
- Produces: `Setup` type gains `color: string`. New `NewsTag` type: `{ id, user_id, name, color, created_at }`. `createSetup(name: string, color: string): Promise<Setup>`. New `listNewsTags(): Promise<NewsTag[]>`, `createNewsTag(name: string, color: string): Promise<NewsTag>`. New hooks `useNewsTags()` (query) and `useCreateNewsTag()` (mutation, variables `{ name, color }`). `useCreateSetup()`'s mutation variables become `{ name, color }` (was a bare `string`).
- Consumes (Task 9/10): the above hooks and types.

**Owner action required before this slice works end-to-end:** run `supabase/migrations/2026-07-06-tag-colors.sql` once in the Supabase SQL editor. The app still builds and runs without it, but creating a new setup/news tag will fail until the columns/table exist.

- [ ] **Step 1: Update `supabase/schema.sql` (fresh-install version)**

Edit the `setups` table definition and add `news_tags` right after it:

```sql
-- SETUPS (reusable, colored tags for the setup field)
create table setups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  color text not null default 'gray'
);

-- NEWS TAGS (reusable, colored tags for the trade's "news of the day" field)
create table news_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  color text not null default 'gray',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
```

Add `news_tags` to the RLS/policy/grant lines:

```sql
alter table accounts     enable row level security;
alter table cash_events  enable row level security;
alter table trades       enable row level security;
alter table trade_images enable row level security;
alter table setups       enable row level security;
alter table news_tags    enable row level security;

create policy "own accounts"     on accounts     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own cash_events"  on cash_events  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own trades"       on trades       for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own trade_images" on trade_images for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own setups"       on setups       for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own news_tags"    on news_tags    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant usage on schema public to authenticated;
grant all on accounts, cash_events, trades, trade_images, setups, news_tags to authenticated;
```

- [ ] **Step 2: Create the standalone migration for the owner's existing database**

Create `supabase/migrations/2026-07-06-tag-colors.sql`:

```sql
-- Trading Journal — migration: colored setup/news tags (2026-07-06)
-- Run once in the Supabase SQL editor against the existing database.
-- (Fresh installs get this via the updated supabase/schema.sql instead.)

alter table setups add column if not exists color text not null default 'gray';

create table if not exists news_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  color text not null default 'gray',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table news_tags enable row level security;

create policy "own news_tags" on news_tags for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant all on news_tags to authenticated;
```

- [ ] **Step 3: Add the `color` field to `Setup` and a new `NewsTag` type**

Edit `src/types/db.ts` — change the `Setup` interface and add `NewsTag` right after it:

```ts
export interface Setup {
  id: string;
  user_id: string;
  name: string;
  color: string;
}

export interface NewsTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}
```

- [ ] **Step 4: Update `api/setups.ts` to accept a color**

```ts
import { supabase } from '@/lib/supabase';
import type { Setup } from '@/types/db';

export async function listSetups(): Promise<Setup[]> {
  const { data, error } = await supabase.from('setups').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data as Setup[];
}

export async function createSetup(name: string, color: string): Promise<Setup> {
  const { data, error } = await supabase.from('setups').insert({ name, color }).select().single();
  if (error) throw error;
  return data as Setup;
}
```

- [ ] **Step 5: Update `useSetups.ts`'s create mutation to take `{ name, color }`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSetup, listSetups } from '@/api/setups';

export function useSetups() {
  return useQuery({ queryKey: ['setups'], queryFn: listSetups });
}

export function useCreateSetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => createSetup(name, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['setups'] }),
  });
}
```

- [ ] **Step 6: Create the `news_tags` API module**

Create `src/api/newsTags.ts`:

```ts
import { supabase } from '@/lib/supabase';
import type { NewsTag } from '@/types/db';

export async function listNewsTags(): Promise<NewsTag[]> {
  const { data, error } = await supabase.from('news_tags').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data as NewsTag[];
}

export async function createNewsTag(name: string, color: string): Promise<NewsTag> {
  const { data, error } = await supabase.from('news_tags').insert({ name, color }).select().single();
  if (error) throw error;
  return data as NewsTag;
}
```

- [ ] **Step 7: Create the `useNewsTags` hook**

Create `src/features/trades/useNewsTags.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createNewsTag, listNewsTags } from '@/api/newsTags';

export function useNewsTags() {
  return useQuery({ queryKey: ['newsTags'], queryFn: listNewsTags });
}

export function useCreateNewsTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => createNewsTag(name, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['newsTags'] }),
  });
}
```

- [ ] **Step 8: Fix the one remaining `createSetup.mutateAsync` call site so the build stays green**

`src/features/trades/TradeForm.tsx` still calls `createSetup.mutateAsync(name)` with a bare string (from Task 5) — that no longer matches the new `{ name, color }` variables shape. Task 10 will replace this whole block properly; for now, apply the minimal fix so types check:

Change:

```ts
      const name = setup.trim();
      if (name && !setupNames.includes(name)) {
        await createSetup.mutateAsync(name);
      }
```

to:

```ts
      const name = setup.trim();
      if (name && !setupNames.includes(name)) {
        await createSetup.mutateAsync({ name, color: 'gray' });
      }
```

- [ ] **Step 9: Verify and commit**

Run: `npm run build`
Expected: no TypeScript errors.

```bash
git add supabase/schema.sql supabase/migrations/2026-07-06-tag-colors.sql src/types/db.ts src/api/setups.ts src/features/trades/useSetups.ts src/api/newsTags.ts src/features/trades/useNewsTags.ts src/features/trades/TradeForm.tsx
git commit -m "feat: add colored tag data layer (setups.color + news_tags table)"
```

---

### Task 9: Tag UI components — `Tag` display pill and `TagPicker`

**Files:**
- Create: `src/components/ui/Tag.tsx`
- Create: `src/components/ui/TagPicker.tsx`
- Modify: `src/components/ui/index.ts`

**Interfaces:**
- Produces: `Tag({ label: string, color?: string | null })` — display-only colored pill. `TagColor` type and `TAG_COLOR_LIST: TagColor[]` (9 entries: `'gray'` + 8 vivid colors). `TagPicker({ label, options: { name: string; color: string }[], mode: 'single' | 'multi', value: string[], onChange: (names: string[]) => void, onCreate: (name: string, color: string) => void, placeholder? })`.
- Consumes: `tag-*` Tailwind tokens from Task 7.

- [ ] **Step 1: Create the `Tag` display component with a literal (non-interpolated) color lookup**

Create `src/components/ui/Tag.tsx`:

```tsx
export type TagColor = 'gray' | 'red' | 'orange' | 'amber' | 'green' | 'teal' | 'blue' | 'violet' | 'pink';

export const TAG_COLOR_LIST: TagColor[] = ['gray', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'violet', 'pink'];

// Every class name below is a literal string so Tailwind's content scanner
// finds it — never build these via `${color}` string interpolation, that
// silently drops the class from the production build.
const PILL_CLASS: Record<TagColor, string> = {
  gray: 'bg-border/70 text-text-muted',
  red: 'bg-tag-red/15 text-tag-red',
  orange: 'bg-tag-orange/15 text-tag-orange',
  amber: 'bg-tag-amber/15 text-tag-amber',
  green: 'bg-tag-green/15 text-tag-green',
  teal: 'bg-tag-teal/15 text-tag-teal',
  blue: 'bg-tag-blue/15 text-tag-blue',
  violet: 'bg-tag-violet/15 text-tag-violet',
  pink: 'bg-tag-pink/15 text-tag-pink',
};

const SWATCH_CLASS: Record<TagColor, string> = {
  gray: 'bg-text-dim',
  red: 'bg-tag-red',
  orange: 'bg-tag-orange',
  amber: 'bg-tag-amber',
  green: 'bg-tag-green',
  teal: 'bg-tag-teal',
  blue: 'bg-tag-blue',
  violet: 'bg-tag-violet',
  pink: 'bg-tag-pink',
};

function toColor(color?: string | null): TagColor {
  return (TAG_COLOR_LIST as string[]).includes(color ?? '') ? (color as TagColor) : 'gray';
}

export function tagPillClass(color?: string | null): string {
  return PILL_CLASS[toColor(color)];
}

export function swatchClass(color: TagColor): string {
  return SWATCH_CLASS[color];
}

interface TagProps {
  label: string;
  color?: string | null;
}

export function Tag({ label, color }: TagProps) {
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tagPillClass(color)}`}>{label}</span>;
}
```

- [ ] **Step 2: Create `TagPicker`**

Create `src/components/ui/TagPicker.tsx`:

```tsx
import { useState } from 'react';
import { Tag, TAG_COLOR_LIST, swatchClass, type TagColor } from './Tag';

interface TagOption {
  name: string;
  color: string;
}

interface TagPickerProps {
  label: string;
  options: TagOption[];
  mode: 'single' | 'multi';
  value: string[];
  onChange: (names: string[]) => void;
  onCreate: (name: string, color: string) => void;
  placeholder?: string;
}

export function TagPicker({ label, options, mode, value, onChange, onCreate, placeholder }: TagPickerProps) {
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState<TagColor>('gray');

  const toggle = (name: string) => {
    if (mode === 'single') {
      onChange(value[0] === name ? [] : [name]);
      return;
    }
    onChange(value.includes(name) ? value.filter((n) => n !== name) : [...value, name]);
  };

  const submitCreate = () => {
    const name = draftName.trim();
    if (!name) return;
    onCreate(name, draftColor);
    toggle(name);
    setDraftName('');
    setDraftColor('gray');
    setCreating(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-text-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((o) => {
          const selected = value.includes(o.name);
          return (
            <button
              key={o.name}
              type="button"
              onClick={() => toggle(o.name)}
              className={`rounded-md transition-opacity ${selected ? '' : 'opacity-50 hover:opacity-80'}`}
            >
              <Tag label={o.name} color={o.color} />
            </button>
          );
        })}
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-text-dim hover:border-border-strong hover:text-text-muted"
          >
            + Neu
          </button>
        )}
      </div>

      {creating && (
        <div className="flex flex-wrap items-center gap-2 rounded-input border border-border bg-bg p-2">
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitCreate();
              }
              if (e.key === 'Escape') setCreating(false);
            }}
            placeholder={placeholder ?? 'Name'}
            className="h-8 min-w-[8rem] flex-1 bg-transparent px-1 text-sm text-text placeholder:text-text-dim focus:outline-none"
          />
          <div className="flex items-center gap-1">
            {TAG_COLOR_LIST.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDraftColor(c)}
                aria-label={c}
                className={`h-5 w-5 rounded-full ${swatchClass(c)} ${draftColor === c ? 'ring-2 ring-text ring-offset-2 ring-offset-bg' : ''}`}
              />
            ))}
          </div>
          <button type="button" onClick={submitCreate} className="text-xs font-medium text-text hover:text-accent">
            Erstellen
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Export both from the UI barrel**

Edit `src/components/ui/index.ts` — add:

```ts
export { Tag, TAG_COLOR_LIST, tagPillClass, swatchClass } from './Tag';
export type { TagColor } from './Tag';
export { TagPicker } from './TagPicker';
```

(append these lines; keep every existing export as-is.)

- [ ] **Step 4: Verify and commit**

Run: `npm run build`
Expected: no TypeScript errors. (Nothing imports `Tag`/`TagPicker` yet, so there's no visible change — this task only adds the building blocks Task 10 and 11 wire in.)

```bash
git add src/components/ui/Tag.tsx src/components/ui/TagPicker.tsx src/components/ui/index.ts
git commit -m "feat: add Tag display pill and TagPicker components"
```

---

### Task 10: Wire `TagPicker` into the trade form (Setup + News)

**Files:**
- Modify: `src/features/trades/TradeForm.tsx`

**Interfaces:**
- Consumes: `TagPicker` from `@/components/ui` (Task 9), `useSetups`/`useCreateSetup` (Task 8), `useNewsTags`/`useCreateNewsTag` (Task 8).

- [ ] **Step 1: Replace the plain Setup input and the News `TagInput` with `TagPicker`**

Replace `src/features/trades/TradeForm.tsx` entirely:

```tsx
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { useUiStore } from '@/store/uiStore';
import { useCreateTrade, useUpdateTrade, useTrades } from './useTrades';
import { useCreateSetup, useSetups } from './useSetups';
import { useCreateNewsTag, useNewsTags } from './useNewsTags';
import { ImageUploader } from './ImageUploader';
import { uploadImage } from '@/api/storage';
import { addTradeImage } from '@/api/tradeImages';
import { Button, Input, StarRating, Slider, TagPicker, Textarea, useToast } from '@/components/ui';
import type { Direction, NewTrade, Trade, UpdateTrade } from '@/types/db';

const DEFAULT_ASSETS = ['MNQ', 'MES'];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface TradeFormProps {
  initial?: Trade;
  onDone: () => void;
  onCancel: () => void;
}

export function TradeForm({ initial, onDone, onCancel }: TradeFormProps) {
  const { user } = useAuth();
  const activeAccountId = useUiStore((s) => s.activeAccountId);
  const create = useCreateTrade();
  const update = useUpdateTrade();
  const { data: setups } = useSetups();
  const createSetup = useCreateSetup();
  const { data: newsTags } = useNewsTags();
  const createNewsTag = useCreateNewsTag();
  const { data: trades } = useTrades(activeAccountId);
  const toast = useToast();
  const queryClient = useQueryClient();

  const [asset, setAsset] = useState(initial?.asset ?? '');
  const [tradeDate, setTradeDate] = useState(initial?.trade_date ?? today());
  const [execTime, setExecTime] = useState(initial?.exec_time?.slice(0, 5) ?? '');
  const [pnl, setPnl] = useState(initial ? String(initial.pnl) : '');
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const [news, setNews] = useState<string[]>(initial?.news ?? []);
  const [images, setImages] = useState<File[]>([]);

  const [direction, setDirection] = useState<Direction | null>(initial?.direction ?? null);
  const [rMultiple, setRMultiple] = useState(initial?.r_multiple != null ? String(initial.r_multiple) : '');
  const [setup, setSetup] = useState(initial?.setup ?? '');
  const [confidence, setConfidence] = useState(initial?.confidence ?? 5);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const [saving, setSaving] = useState(false);

  const assetSuggestions = useMemo(() => {
    const used = new Set(DEFAULT_ASSETS);
    trades?.forEach((t) => used.add(t.asset));
    return [...used];
  }, [trades]);

  const submit = async () => {
    if (!asset.trim()) return toast('Bitte ein Asset angeben.', 'error');
    if (!tradeDate) return toast('Bitte ein Datum angeben.', 'error');
    if (pnl.trim() === '' || Number.isNaN(Number(pnl))) return toast('Bitte einen gültigen PnL angeben.', 'error');
    if (!initial && !activeAccountId) return toast('Kein Konto gewählt.', 'error');

    const fields = {
      asset: asset.trim(),
      trade_date: tradeDate,
      exec_time: execTime ? execTime : null,
      pnl: Number(pnl),
      rating,
      news,
      direction,
      r_multiple: rMultiple.trim() === '' ? null : Number(rMultiple),
      setup: setup.trim() || null,
      confidence,
      notes: notes.trim() || null,
    };

    setSaving(true);
    try {
      let tradeId = initial?.id;
      if (initial) {
        await update.mutateAsync({ id: initial.id, patch: fields as UpdateTrade });
      } else {
        const created = await create.mutateAsync({ account_id: activeAccountId as string, ...fields } as NewTrade);
        tradeId = created.id;
      }

      if (images.length > 0 && user && tradeId) {
        for (const file of images) {
          const path = await uploadImage(user.id, tradeId, file);
          await addTradeImage(tradeId, path);
        }
        queryClient.invalidateQueries({ queryKey: ['tradeImages', tradeId] });
      }

      toast(initial ? 'Trade aktualisiert.' : 'Trade gespeichert.', 'success');
      onDone();
    } catch {
      toast('Speichern fehlgeschlagen.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-5"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Input label="Asset" list="asset-suggestions" value={asset} onChange={(e) => setAsset(e.target.value)} placeholder="MNQ" required />
          <datalist id="asset-suggestions">
            {assetSuggestions.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
        <Input label="PnL" type="number" inputMode="decimal" step="any" value={pnl} onChange={(e) => setPnl(e.target.value)} placeholder="z. B. 250 oder -85" required />
        <Input label="Datum" type="date" value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} required />
        <Input label="Uhrzeit (optional)" type="time" value={execTime} onChange={(e) => setExecTime(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-text-muted">Bewertung</span>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <TagPicker
        label="News des Tages"
        mode="multi"
        options={newsTags ?? []}
        value={news}
        onChange={setNews}
        onCreate={(name, color) => createNewsTag.mutate({ name, color })}
        placeholder="z. B. CPI 14:30"
      />

      <ImageUploader value={images} onChange={setImages} />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-text-muted">Richtung</span>
        <div className="inline-flex rounded-input border border-border bg-bg p-1">
          {(['long', 'short'] as Direction[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection((cur) => (cur === d ? null : d))}
              className={`h-8 min-w-[5rem] rounded-[7px] px-4 text-sm font-medium capitalize transition-colors ${
                direction !== d
                  ? 'text-text-muted hover:text-text'
                  : d === 'long'
                    ? 'bg-profit/15 text-profit'
                    : 'bg-loss/15 text-loss'
              }`}
            >
              {d === 'long' ? 'Long' : 'Short'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="R-Multiple" type="number" inputMode="decimal" step="any" value={rMultiple} onChange={(e) => setRMultiple(e.target.value)} placeholder="z. B. 2.5" />
        <TagPicker
          label="Setup / Strategie"
          mode="single"
          options={setups ?? []}
          value={setup ? [setup] : []}
          onChange={(names) => setSetup(names[0] ?? '')}
          onCreate={(name, color) => createSetup.mutate({ name, color })}
          placeholder="z. B. Breakout"
        />
      </div>

      <Slider label="Confidence (1–10)" min={1} max={10} value={confidence} onChange={setConfidence} />

      <Textarea label="Psychologie / Fehler-Notizen" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Speichern…' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verify and commit**

Run: `npm run build`
Expected: no TypeScript errors.

Check in the preview (**requires the owner to have already run the Task 8 migration SQL** — otherwise "+ Neu" will show an error toast on save): opening "Neuer Trade" shows Setup and News as colored pill pickers with a "+ Neu" affordance that opens a name field + 9 color swatches. Picking or creating a setup/news tag shows it as a colored pill.

```bash
git add src/features/trades/TradeForm.tsx
git commit -m "feat: wire TagPicker into the trade form for setup and news"
```

---

### Task 11: Render colored tag pills in the trades table and detail page

**Files:**
- Modify: `src/features/trades/TradesTable.tsx`
- Modify: `src/features/trades/TradeDetailPage.tsx`

**Interfaces:**
- Consumes: `Tag` from `@/components/ui`, `useSetups` (Task 8), `useNewsTags` (Task 8).

Note: `SetupBreakdown.tsx`'s bar chart intentionally keeps its existing profit/loss bar coloring (it answers "which setups make/lose money", not "what color did I assign this setup") — no change there.

- [ ] **Step 1: Render a colored pill for the Setup column in `TradesTable.tsx`**

In `src/features/trades/TradesTable.tsx`, add the import and hook, and change the Setup cell:

```tsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarRating, Tag } from '@/components/ui';
import { useSetups } from './useSetups';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Trade } from '@/types/db';
```

(this keeps the existing `StarRating` import — used by the Rating column — and adds `Tag` alongside it, plus the new `useSetups` import)

Inside the component, add the lookup:

```tsx
export function TradesTable({ trades, currency }: TradesTableProps) {
  const navigate = useNavigate();
  const { data: setups } = useSetups();
  const setupColor = (name: string) => setups?.find((s) => s.name === name)?.color;
  const [sortKey, setSortKey] = useState<SortKey>('trade_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
```

Change the Setup `<td>`:

```tsx
              <td className="px-4 py-3">
                {t.setup ? <Tag label={t.setup} color={setupColor(t.setup)} /> : <span className="text-text-dim">—</span>}
              </td>
```

- [ ] **Step 2: Render colored pills for Setup and News in `TradeDetailPage.tsx`**

In `src/features/trades/TradeDetailPage.tsx`, add imports and hooks:

```tsx
import { useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { useTrade, useTradeImages, useDeleteTrade } from './useTrades';
import { useSetups } from './useSetups';
import { useNewsTags } from './useNewsTags';
import { TradeImageGallery } from './TradeImageGallery';
import { useAccounts } from '@/features/accounts/useAccounts';
import { removeImages } from '@/api/storage';
import { Button, Card, ConfirmDialog, EmptyState, Spinner, StarRating, Tag, useToast } from '@/components/ui';
import { formatSignedCurrency, formatDate } from '@/lib/format';
import type { ReactNode } from 'react';
```

Inside the component body, add the two lookups after `const { data: accounts } = useAccounts();`:

```tsx
  const { data: accounts } = useAccounts();
  const { data: setups } = useSetups();
  const { data: newsTags } = useNewsTags();
  const del = useDeleteTrade();
```

Change the Setup and News fields:

```tsx
          <Field label="Setup">
            {trade.setup ? <Tag label={trade.setup} color={setups?.find((s) => s.name === trade.setup)?.color} /> : '—'}
          </Field>
          <Field label="Confidence">{trade.confidence != null ? `${trade.confidence}/10` : '—'}</Field>
          <Field label="Bewertung">
            {trade.rating ? <StarRating value={trade.rating} readOnly size="sm" /> : '—'}
          </Field>
          <Field label="News des Tages">
            {trade.news.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {trade.news.map((n) => (
                  <Tag key={n} label={n} color={newsTags?.find((x) => x.name === n)?.color} />
                ))}
              </div>
            ) : (
              '—'
            )}
          </Field>
```

- [ ] **Step 3: Verify and commit**

Run: `npm run build`
Expected: no TypeScript errors.

Check in the preview: the Trades table's Setup column and the Trade detail page's Setup/News fields show colored pills matching the colors chosen in the trade form.

```bash
git add src/features/trades/TradesTable.tsx src/features/trades/TradeDetailPage.tsx
git commit -m "feat: render colored tag pills in trades table and detail page"
```

---

### Task 12: Rebranding — logo, favicon, "YP Trades" naming

**Files:**
- Create: `src/assets/logo.png` (moved from the project root)
- Create: `public/favicon.png` (copy of the same file)
- Modify: `index.html`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/features/auth/LoginScreen.tsx`

**Interfaces:**
- Produces: nothing consumed by other tasks — purely presentational.

- [ ] **Step 1: Move the logo into the source tree and add a favicon copy**

```bash
mkdir -p src/assets public
mv "YP Trades Logo.png" src/assets/logo.png
cp src/assets/logo.png public/favicon.png
```

- [ ] **Step 2: Update `index.html` — title and favicon**

Edit `index.html`:

```html
<!doctype html>
<html lang="de" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <link rel="icon" type="image/png" href="%BASE_URL%favicon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <title>YP Trades</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

(`%BASE_URL%` is a Vite build-time placeholder resolved to the configured `base` — required because the app deploys under `/trading-journal/` on GitHub Pages, so a plain `/favicon.png` would 404 in production.)

- [ ] **Step 3: Update the Sidebar header**

Edit `src/components/layout/Sidebar.tsx` — add the logo import and replace the header block:

```tsx
import { NavLink } from 'react-router-dom';
import type { ComponentType, SVGProps } from 'react';
import logo from '@/assets/logo.png';
import { DashboardIcon, TradesIcon, CalendarIcon, AccountsIcon, ExportIcon } from './navIcons';
```

```tsx
      <div className="flex h-16 items-center gap-2 px-5">
        <img src={logo} alt="YP Trades" className="h-7 w-7 rounded-md" />
        <span className="text-sm font-medium text-text">YP Trades</span>
      </div>
```

(this replaces the old `<span className="h-2.5 w-2.5 rounded-full bg-accent" />` dot + "Trading Journal" text)

- [ ] **Step 4: Update the Login screen header**

Edit `src/features/auth/LoginScreen.tsx` — add the logo import:

```tsx
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import logo from '@/assets/logo.png';
import { Button, Card, Input, useToast } from '@/components/ui';
```

Replace the heading block:

```tsx
        <div className="mb-8 text-center">
          <img src={logo} alt="YP Trades" className="mx-auto mb-4 h-16 w-16 rounded-2xl" />
          <h1 className="text-2xl font-medium text-text">YP Trades</h1>
          <p className="mt-1 text-xs uppercase tracking-wide text-text-dim">Trading Journal</p>
          <p className="mt-3 text-sm text-text-muted">Melde dich an, um fortzufahren.</p>
        </div>
```

- [ ] **Step 5: Verify and commit**

Run: `npm run build`
Expected: no TypeScript errors (Vite's built-in asset typing handles the `.png` import; no config change needed).

Check in the preview: the browser tab shows the logo as favicon and "YP Trades" as the title. The sidebar header shows the logo + "YP Trades". The login screen shows the logo, "YP Trades" heading, and "Trading Journal" as a small subtitle above "Melde dich an, um fortzufahren."

```bash
git add src/assets/logo.png public/favicon.png index.html src/components/layout/Sidebar.tsx src/features/auth/LoginScreen.tsx
git commit -m "feat: rebrand as YP Trades with owner's logo and favicon"
```

---

### Task 13: Swap the purple accent for a monochrome pair

**Files:**
- Modify: `tailwind.config.ts`

**Interfaces:**
- Produces: nothing new consumed elsewhere — every component already reads `accent`/`accent-ink` via Tailwind classes, so this token change propagates automatically.

- [ ] **Step 1: Replace the accent color values**

Edit `tailwind.config.ts` — change only the `accent` line inside `colors`:

```ts
        accent: { DEFAULT: '#E7E8EC', ink: '#14151A' },
```

(`profit`, `loss`, `star`, and the `tag` group from Task 7 are untouched.)

- [ ] **Step 2: Verify and commit**

Run: `npm run build`
Expected: no TypeScript errors.

Check in the preview: primary buttons, the active sidebar nav item, the selected "Alle" filter tab, focus rings, and the active account card border now render in a light neutral (near-white) with dark text on filled buttons, instead of purple. Green (profit) and red (loss) are unchanged.

```bash
git add tailwind.config.ts
git commit -m "feat: replace purple accent with a monochrome accent to match the YP Trades logo"
```

---

## Final verification (after all 13 tasks)

Run: `npm run build && npm test`
Expected: build succeeds, all vitest tests pass.

In the running preview, walk through: Dashboard (4 KPIs + expandable advanced section, no date filter), Trades page (single "Neuer Trade" button, colored Win/Loss tabs, colored tag pills in the table), Calendar (legible, contrast-fixed heatmap), a new trade entry (flat form, colored Long/Short toggle, tag pickers for Setup/News), Accounts page (no Cash-Events card), the login screen and sidebar (YP Trades branding, monochrome accent), and the browser tab (favicon + title).

Remind the owner, if not already done: run `supabase/migrations/2026-07-06-tag-colors.sql` once in the Supabase SQL editor — without it, creating a new setup or news tag will fail.
