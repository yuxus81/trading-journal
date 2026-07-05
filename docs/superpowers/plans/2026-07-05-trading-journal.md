# Trading Journal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal, single-user, Supabase-synced trading journal (dark, calm, desktop-first) that replaces a Notion setup.

**Architecture:** React 18 + Vite SPA on GitHub Pages. Supabase (Postgres + Auth + Storage) behind RLS. Server state via TanStack Query; UI state (active account, filters) via Zustand. All KPIs derived in a pure, unit-tested `computeMetrics` module — nothing computed is stored. Feature-folder layout mirroring the owner's AniTracker app.

**Tech Stack:** React 18, TypeScript (strict), Vite 5, Tailwind 3.4, React Router 6, TanStack Query 5, Zustand 4, Recharts, date-fns, browser-image-compression, @supabase/supabase-js, Vitest (metrics tests only).

## Global Constraints

- German UI copy, English code/identifiers.
- Dark theme only. Colors/radii come from Tailwind tokens — never hard-code hex in components.
- Palette (verbatim): bg `#17181C`, card `#212329`, border `#2A2C33` / border-strong `#31333B`, text `#ECEDEF` / text-muted `#8B8D96` / text-dim `#6E7079`, accent `#8B85EA` / on-accent `#12103A`, profit `#4ADE9E`, loss `#F98080`, star `#EAB94D`.
- Two font weights only: 400 (regular), 500 (medium). Large radii (cards 12–16px, inputs 9–11px). No gradients / no decorative shadows.
- Number formatting: sign before currency symbol (`-$85`), currency rounded to integers, R-multiple 2 decimals.
- Build gate: `npm run build` must pass (`tsc && vite build`). No unused locals/params allowed (strict tsconfig).
- Minimal dependencies — do not add anything beyond those in Tech Stack without a note.
- Every table access is RLS-scoped to `user_id = auth.uid()`; the client never sends `user_id` (DB defaults it via `auth.uid()`).
- Working directory for all paths below: `trading-journal/` (git repo, `main` branch, already initialized).

---

## Task 1: Project scaffold & config (boots + builds)

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `postcss.config.js`, `index.html`, `.gitignore`, `.env.example`, `.claude/launch.json`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`

**Interfaces:**
- Produces: a runnable Vite app; `@/*` alias → `src/*`; `import.meta.env.BASE_URL` used as router basename later.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "trading-journal",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "description": "Personal single-user trading journal (Supabase-synced, dark, desktop-first).",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "postbuild": "node scripts/spa-fallback.mjs",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.4",
    "@tanstack/react-query": "^5.59.0",
    "browser-image-compression": "^2.0.2",
    "date-fns": "^3.6.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "recharts": "^2.12.7",
    "zustand": "^4.5.5"
  },
  "devDependencies": {
    "@types/node": "^20.19.43",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.2",
    "vite": "^5.4.8",
    "vitest": "^2.1.2"
  }
}
```

- [ ] **Step 2: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// GitHub Pages project site base. Override with VITE_BASE ("/" for custom domain).
const base = process.env.VITE_BASE ?? '/trading-journal/';

export default defineConfig({
  base,
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
});
```

- [ ] **Step 3: Write `tsconfig.json` and `tsconfig.node.json`**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vite/client", "node"]
  },
  "include": ["src", "vitest.config.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```
`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "scripts/**/*.mjs"]
}
```

- [ ] **Step 4: Write `postcss.config.js`, `index.html`, `.gitignore`, `.env.example`, `.claude/launch.json`, `src/vite-env.d.ts`**

`postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```
`index.html`:
```html
<!doctype html>
<html lang="de" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <title>Trading Journal</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
`.gitignore`:
```
node_modules
dist
*.local
.DS_Store
```
`.env.example`:
```
# Supabase (public anon key — safe to commit, protected by RLS). Never commit service_role.
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
# GitHub Pages base, e.g. "/trading-journal/". Use "/" for a custom domain.
VITE_BASE=/trading-journal/
```
`.claude/launch.json`:
```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "trading-journal", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev", "--", "--port", "5200", "--strictPort"], "port": 5200 }
  ]
}
```
`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

- [ ] **Step 5: Write `src/index.css`, `src/App.tsx`, `src/main.tsx`**

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body, #root { height: 100%; }
  body { @apply bg-bg text-text font-sans antialiased; font-weight: 400; }
}
```
`src/App.tsx` (temporary placeholder, replaced in Task 11):
```tsx
export function App() {
  return <div className="p-8 text-text">Trading Journal</div>;
}
```
`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 6: Install and verify boot + build**

Run: `npm install`
Then create `src/index.css`'s token references will fail until Task 2 adds them — so temporarily this build works because `bg-bg`/`text-text`/`font-sans` are added in Task 2. Do Task 2 before running build. For now run: `npm install` and confirm it completes.
Expected: dependencies installed, no errors.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: scaffold Vite + React + TS project"
```

---

## Task 2: Design tokens (Tailwind) + font

**Files:**
- Create: `tailwind.config.ts`
- Modify: `index.html` (font link), `src/index.css` (already references tokens)

**Interfaces:**
- Produces: Tailwind tokens `bg`, `card`, `border`/`border-strong`, `text`/`text-muted`/`text-dim`, `accent`/`on-accent`, `profit`, `loss`, `star`; radii `card`, `input`; `font-sans`.

- [ ] **Step 1: Write `tailwind.config.ts`**

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
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '14px', input: '10px' },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        pageFade: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
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

- [ ] **Step 2: Add Inter font to `index.html`** (inside `<head>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet" />
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS (tsc clean, vite build emits `dist/`). The placeholder App renders with `bg-bg`/`text-text` classes resolving.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add dark design tokens and Inter font"
```

---

## Task 3: Supabase schema + storage + README setup

**Files:**
- Create: `supabase/schema.sql`, `README.md`

**Interfaces:**
- Produces: the DB contract every `api/*` module targets. Tables `accounts`, `cash_events`, `trades`, `trade_images`, `setups`; private bucket `trade-images`.

- [ ] **Step 1: Write `supabase/schema.sql`** — copy the SQL from the design spec §5 verbatim (tables, RLS enable, policies, grants, storage bucket + object policies). Add a header comment: `-- Run once in the Supabase SQL editor. Adjust policy/grant names if the running version differs.`

(Source: `docs/superpowers/specs/2026-07-05-trading-journal-design.md` and the original build prompt §5. Include all five tables, `enable row level security`, the five `own …` policies, `grant usage on schema public to authenticated` + `grant all on … to authenticated`, the `trade-images` bucket insert, and the three storage.objects policies.)

- [ ] **Step 2: Write `README.md`** with: project summary; setup steps (create Supabase project → run `schema.sql` → verify private `trade-images` bucket → fill `.env` from `.env.example` → create the single user in Auth dashboard → `npm install` → `npm run dev`); deploy note (push to `main` → GitHub Pages); and a "Default decisions / tune here" section (compression constants location, default assets MNQ/MES, empty setup tags, base path).

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "docs: add Supabase schema and README setup guide"
```

---

## Task 4: lib foundations (env, supabase client, query client)

**Files:**
- Create: `src/lib/env.ts`, `src/lib/supabase.ts`, `src/lib/queryClient.ts`

**Interfaces:**
- Produces: `env.supabaseUrl`, `env.supabaseAnonKey`; `supabase` client; `setSessionPersistence(persist: boolean)`; `queryClient`.

- [ ] **Step 1: Write `src/lib/env.ts`**

```ts
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
};
```

- [ ] **Step 2: Write `src/lib/supabase.ts`** — port AniTracker's hybrid remember-me client (localStorage when persistent, sessionStorage otherwise, read fallback across both), key `trading-journal.persist`, exporting `supabase` and `setSessionPersistence`. (Reference: AniTracker `src/lib/supabase.ts`.)

- [ ] **Step 3: Write `src/lib/queryClient.ts`**

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});
```

- [ ] **Step 4: Verify + commit**

Run: `npm run build` → PASS.
```bash
git add -A && git commit -m "feat: add env, supabase client, and query client"
```

---

## Task 5: DB row types

**Files:**
- Create: `src/types/db.ts`

**Interfaces:**
- Produces: `Account`, `AccountType`, `CashEvent`, `CashEventType`, `Trade`, `Direction`, `TradeImage`, `Setup`, and `NewX`/`UpdateX` insert/update shapes used by `api/*`.

- [ ] **Step 1: Write `src/types/db.ts`** with exact field names from the schema:

```ts
export type AccountType = 'prop' | 'live' | 'demo';
export type CashEventType = 'payout' | 'reset' | 'deposit' | 'withdrawal' | 'fee' | 'adjustment';
export type Direction = 'long' | 'short';

export interface Account {
  id: string; user_id: string; name: string; account_type: AccountType;
  starting_capital: number; currency: string; created_at: string;
}
export interface CashEvent {
  id: string; account_id: string; user_id: string; type: CashEventType;
  amount: number; event_date: string; note: string | null; created_at: string;
}
export interface Trade {
  id: string; account_id: string; user_id: string; asset: string; trade_date: string;
  exec_time: string | null; pnl: number; rating: number | null; news: string[];
  direction: Direction | null; r_multiple: number | null; setup: string | null;
  confidence: number | null; notes: string | null; created_at: string;
}
export interface TradeImage { id: string; trade_id: string; user_id: string; storage_path: string; created_at: string; }
export interface Setup { id: string; user_id: string; name: string; }

export type NewAccount = Pick<Account, 'name' | 'account_type' | 'starting_capital' | 'currency'>;
export type NewCashEvent = Pick<CashEvent, 'account_id' | 'type' | 'amount' | 'event_date' | 'note'>;
export type NewTrade = Omit<Trade, 'id' | 'user_id' | 'created_at'>;
export type UpdateTrade = Partial<Omit<Trade, 'id' | 'user_id' | 'account_id' | 'created_at'>>;
```

- [ ] **Step 2: Verify + commit** — `npm run build` → PASS. `git commit -m "feat: add DB row types"`.

---

## Task 6: Number/date formatting (TDD)

**Files:**
- Create: `src/lib/format.ts`, `src/lib/format.test.ts`, `vitest.config.ts`

**Interfaces:**
- Produces: `formatCurrency(n, currency?)`, `formatSignedCurrency(n, currency?)`, `formatR(n)`, `formatPercent(n)`, `formatDate(iso)`.

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { environment: 'node' },
});
```

- [ ] **Step 2: Write failing tests `src/lib/format.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { formatSignedCurrency, formatCurrency, formatR, formatPercent } from '@/lib/format';

describe('formatSignedCurrency', () => {
  it('puts sign before the symbol', () => {
    expect(formatSignedCurrency(-85)).toBe('-$85');
    expect(formatSignedCurrency(1250)).toBe('+$1,250');
    expect(formatSignedCurrency(0)).toBe('$0');
  });
  it('rounds to whole numbers', () => {
    expect(formatSignedCurrency(-85.6)).toBe('-$86');
  });
});
describe('formatCurrency', () => {
  it('formats without a forced + sign', () => {
    expect(formatCurrency(1250)).toBe('$1,250');
    expect(formatCurrency(-85)).toBe('-$85');
  });
});
describe('formatR', () => {
  it('two decimals with sign', () => { expect(formatR(2.5)).toBe('2.50R'); expect(formatR(-1)).toBe('-1.00R'); });
});
describe('formatPercent', () => {
  it('one decimal', () => { expect(formatPercent(0.5)).toBe('50.0%'); });
});
```

- [ ] **Step 3: Run tests to confirm they fail** — `npm test` → FAIL (module not found).

- [ ] **Step 4: Implement `src/lib/format.ts`**

```ts
const SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

function symbol(currency = 'USD'): string { return SYMBOLS[currency] ?? '$'; }
function group(n: number): string { return Math.abs(Math.round(n)).toLocaleString('en-US'); }

export function formatCurrency(n: number, currency = 'USD'): string {
  const sign = Math.round(n) < 0 ? '-' : '';
  return `${sign}${symbol(currency)}${group(n)}`;
}
export function formatSignedCurrency(n: number, currency = 'USD'): string {
  const r = Math.round(n);
  const sign = r > 0 ? '+' : r < 0 ? '-' : '';
  return `${sign}${symbol(currency)}${group(n)}`;
}
export function formatR(n: number): string { return `${n.toFixed(2)}R`; }
export function formatPercent(fraction: number): string { return `${(fraction * 100).toFixed(1)}%`; }
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
```

- [ ] **Step 5: Run tests** — `npm test` → PASS.

- [ ] **Step 6: Commit** — `git commit -m "feat: add number/date formatting helpers (tested)"`.

---

## Task 7: Metrics engine `computeMetrics` (TDD) — the core

**Files:**
- Create: `src/features/metrics/types.ts`, `src/features/metrics/calc.ts`, `src/features/metrics/calc.test.ts`

**Interfaces:**
- Consumes: `Trade`, `CashEvent`, `Account` from `@/types/db`.
- Produces:
  - `sortTrades(trades: Trade[]): Trade[]` — by `trade_date`, then `exec_time` (null last), then `created_at`.
  - `currentCapital(account, trades, cashEvents): number`.
  - `computeMetrics(trades: Trade[], account: Account): Metrics`.
  - `Metrics` (see types below), `EquityPoint { index: number; date: string; equity: number }`, `SetupStat { setup: string; netPnl: number; count: number }`, `RatingStat { rating: number; avgPnl: number; count: number }`.

- [ ] **Step 1: Write `src/features/metrics/types.ts`**

```ts
export interface EquityPoint { index: number; date: string; equity: number; }
export interface SetupStat { setup: string; netPnl: number; count: number; }
export interface RatingStat { rating: number; avgPnl: number; count: number; }

export interface Metrics {
  tradeCount: number;
  netPnl: number;
  winrate: number;            // fraction 0..1; 0 when no trades
  avgWin: number;             // 0 when no wins
  avgLoss: number;            // negative; 0 when no losses
  profitFactor: number | null;// null when undefined (no losses or no trades)
  payoffRatio: number | null; // null when avgLoss == 0
  avgPnlPerTrade: number;
  avgR: number | null;        // null when no r_multiple set
  maxDrawdown: number;        // >= 0, in currency units
  best: number | null;        // best single-trade pnl
  worst: number | null;       // worst single-trade pnl
  longestWinStreak: number;
  longestLossStreak: number;
  equityCurve: EquityPoint[]; // starts at starting_capital
  bySetup: SetupStat[];       // sorted by netPnl desc
  byRating: RatingStat[];     // ratings 1..5 that have trades
}
```

- [ ] **Step 2: Write failing tests `src/features/metrics/calc.test.ts`** (cover: empty set; ordering; winrate; profit factor with zero losses → null; drawdown; streaks; equity start). Example core cases:

```ts
import { describe, it, expect } from 'vitest';
import { computeMetrics, currentCapital, sortTrades } from '@/features/metrics/calc';
import type { Account, Trade, CashEvent } from '@/types/db';

const acc: Account = { id: 'a', user_id: 'u', name: 'A', account_type: 'prop', starting_capital: 1000, currency: 'USD', created_at: '2026-01-01T00:00:00Z' };
function t(p: Partial<Trade>): Trade {
  return { id: Math.random().toString(), account_id: 'a', user_id: 'u', asset: 'MNQ', trade_date: '2026-01-01', exec_time: null, pnl: 0, rating: null, news: [], direction: null, r_multiple: null, setup: null, confidence: null, notes: null, created_at: '2026-01-01T00:00:00Z', ...p };
}

describe('computeMetrics', () => {
  it('handles empty input', () => {
    const m = computeMetrics([], acc);
    expect(m.tradeCount).toBe(0);
    expect(m.netPnl).toBe(0);
    expect(m.winrate).toBe(0);
    expect(m.profitFactor).toBeNull();
    expect(m.equityCurve).toEqual([{ index: 0, date: 'start', equity: 1000 }]);
  });

  it('computes winrate, net pnl, profit factor', () => {
    const m = computeMetrics([t({ pnl: 100 }), t({ pnl: -50 }), t({ pnl: 200 }), t({ pnl: 0 })], acc);
    expect(m.tradeCount).toBe(4);
    expect(m.netPnl).toBe(250);
    expect(m.winrate).toBeCloseTo(2 / 4);
    expect(m.profitFactor).toBeCloseTo(300 / 50);
    expect(m.avgWin).toBeCloseTo(150);
    expect(m.avgLoss).toBeCloseTo(-50);
  });

  it('profit factor is null when there are no losses', () => {
    expect(computeMetrics([t({ pnl: 10 })], acc).profitFactor).toBeNull();
  });

  it('computes max drawdown on the equity curve', () => {
    // equity: 1000 -> 1100 -> 900 -> 1000. peak 1100, trough 900 => DD 200
    const m = computeMetrics([t({ pnl: 100, exec_time: '09:00' }), t({ pnl: -200, exec_time: '10:00' }), t({ pnl: 100, exec_time: '11:00' })], acc);
    expect(m.maxDrawdown).toBe(200);
  });

  it('computes longest streaks in date/time order', () => {
    const m = computeMetrics([
      t({ pnl: 10, exec_time: '09:00' }), t({ pnl: 20, exec_time: '10:00' }),
      t({ pnl: -5, exec_time: '11:00' }), t({ pnl: -5, exec_time: '12:00' }), t({ pnl: -5, exec_time: '13:00' }),
    ], acc);
    expect(m.longestWinStreak).toBe(2);
    expect(m.longestLossStreak).toBe(3);
  });
});

describe('currentCapital', () => {
  it('adds pnl and cash events to starting capital', () => {
    const ce: CashEvent[] = [{ id: 'c', account_id: 'a', user_id: 'u', type: 'payout', amount: -100, event_date: '2026-01-02', note: null, created_at: 'x' }];
    expect(currentCapital(acc, [t({ pnl: 300 })], ce)).toBe(1200);
  });
});

describe('sortTrades', () => {
  it('orders by date, then time (null last), then created_at', () => {
    const a = t({ trade_date: '2026-01-02', exec_time: '09:00' });
    const b = t({ trade_date: '2026-01-01', exec_time: null });
    const c = t({ trade_date: '2026-01-01', exec_time: '08:00' });
    expect(sortTrades([a, b, c]).map((x) => x.id)).toEqual([c.id, b.id, a.id]);
  });
});
```

- [ ] **Step 3: Run tests to confirm they fail** — `npm test` → FAIL.

- [ ] **Step 4: Implement `src/features/metrics/calc.ts`** implementing every field in `Metrics` per the formulas in spec §5 and the interface above. Key rules: `sortTrades` comparator (date string compare, null `exec_time` sorts after non-null, then `created_at`); `equityCurve` begins with `{ index: 0, date: 'start', equity: starting_capital }` then one point per sorted trade accumulating pnl; `maxDrawdown` = max(peak − equity) over the curve (≥ 0); streaks computed over sorted trades (pnl>0 win, pnl<0 loss, pnl==0 breaks both); `profitFactor` null when negatives sum to 0; `payoffRatio` null when avgLoss==0; `bySetup` groups non-null `setup` sorted by netPnl desc; `byRating` groups ratings 1..5 present. `currentCapital` = starting + Σpnl + Σamount.

- [ ] **Step 5: Run tests** — `npm test` → PASS (all cases).

- [ ] **Step 6: Commit** — `git commit -m "feat: add tested metrics engine (computeMetrics)"`.

---

## Task 8: UI kit — inputs & surfaces

**Files:**
- Create: `src/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx`, `Select.tsx`, `Textarea.tsx`, `Toggle.tsx`, `Spinner.tsx`, `EmptyState.tsx`, `index.ts` (barrel)

**Interfaces:**
- Produces (used everywhere later):
  - `Button` props: `variant?: 'primary' | 'ghost' | 'danger'; size?: 'sm' | 'md'` + native button props.
  - `Card`: `<div>` wrapper `className="bg-card rounded-card border border-border p-5"`.
  - `Input`, `Textarea`: labeled native controls; props include `label?: string; error?: string`.
  - `Select`: `options: { value: string; label: string }[]` + `label?`, `value`, `onChange`.
  - `Toggle`: `checked: boolean; onChange: (v: boolean) => void; leftLabel?; rightLabel?`.
  - `Spinner`: small inline loading indicator.
  - `EmptyState`: `title: string; description?: string; action?: ReactNode`.

- [ ] **Step 1: Implement each component** using only design tokens (accent for primary buttons with `text-accent-ink`, `rounded-input` on inputs, `border-border` focus→`border-border-strong`, `bg-card`). Keep two font weights (medium for button/label). No shadows/gradients. Export all via `index.ts`.

- [ ] **Step 2: Verify + commit** — `npm run build` → PASS. `git commit -m "feat: add core UI kit (inputs, surfaces)"`.

---

## Task 9: UI kit — overlays & specialized inputs

**Files:**
- Create: `src/components/ui/Modal.tsx`, `ConfirmDialog.tsx`, `StarRating.tsx`, `TagInput.tsx`, `Slider.tsx`, `Lightbox.tsx`, `Toast.tsx` (+ `ToastHost.tsx` and `toastStore.ts`)
- Modify: `src/components/ui/index.ts`

**Interfaces:**
- Produces:
  - `Modal`: `open: boolean; onClose: () => void; title?: string; children` — centered, `bg-card rounded-card`, backdrop click + Esc close, focus trap, body scroll lock.
  - `ConfirmDialog`: `open; title; message; confirmLabel?; danger?; onConfirm; onCancel`.
  - `StarRating`: `value: number | null; onChange?: (v: number) => void; readOnly?: boolean` — 1..5, `text-star` filled.
  - `TagInput`: `value: string[]; onChange: (tags: string[]) => void; placeholder?; suggestions?: string[]` — add on Enter/comma, remove chips.
  - `Slider`: `value: number; min; max; onChange: (v: number) => void; label?`.
  - `Lightbox`: `images: string[]; index: number; onClose; onIndex: (i: number) => void` — full-screen image viewer with prev/next.
  - `useToast()` → `{ show(message, type?) }`; `<ToastHost />` renders queued toasts; `toastStore` is a Zustand store.

- [ ] **Step 1: Implement components** with tokens + `animate-fade-in`. Modal/Lightbox use a portal to `document.body`. Toasts auto-dismiss (~3s).

- [ ] **Step 2: Verify + commit** — `npm run build` → PASS. `git commit -m "feat: add overlay and specialized UI components"`.

---

## Task 10: Auth (provider, login screen, guard)

**Files:**
- Create: `src/features/auth/AuthProvider.tsx`, `src/features/auth/useAuth.ts`, `src/features/auth/LoginScreen.tsx`, `src/features/auth/RequireAuth.tsx`

**Interfaces:**
- Consumes: `supabase`, `setSessionPersistence`.
- Produces: `AuthProvider` (context with `{ session, user, loading, signIn(email,password,remember), signOut() }`); `useAuth()`; `RequireAuth` wrapper that renders children only when authenticated, else `<Navigate to="/login" />`; `LoginScreen` (email/password + "Angemeldet bleiben" checkbox, German copy, error handling via `useToast`).

- [ ] **Step 1: Implement** — `AuthProvider` subscribes to `supabase.auth.onAuthStateChange`, seeds from `getSession()`, exposes actions. `signIn` calls `setSessionPersistence(remember)` then `signInWithPassword`. `LoginScreen` uses `Card`, `Input`, `Button`, redirects to `/dashboard` on success.

- [ ] **Step 2: Verify + commit** — `npm run build` → PASS. `git commit -m "feat: add Supabase email/password auth"`.

---

## Task 11: App shell + routing

**Files:**
- Create: `src/components/layout/AppLayout.tsx`, `Sidebar.tsx`, `Topbar.tsx`, `src/store/uiStore.ts`
- Rewrite: `src/App.tsx`, `src/main.tsx`

**Interfaces:**
- Consumes: `RequireAuth`, `AuthProvider`, `queryClient`, `ToastHost`, account hooks (from Task 12 — until then Topbar can show a placeholder selector).
- Produces:
  - `uiStore` (Zustand + persist): `activeAccountId: string | null; setActiveAccount(id)`, `tradeFilters` + setters (result: `'all'|'wins'|'losses'`, `dateFrom?`, `dateTo?`, `setup?`, `asset?`), `resetFilters()`.
  - `AppLayout`: sidebar + topbar + `<Outlet />`, `animate-page-fade` on route content.
  - Router with routes: `/login`; and under `RequireAuth` + `AppLayout`: `/dashboard`, `/trades`, `/trades/:id`, `/calendar`, `/accounts`; index redirect `/` → `/dashboard`. Reserve `/trades/new` and `/trades/:id/edit` for the background-location modal pattern (Task 16).

- [ ] **Step 1: Implement `uiStore`, `Sidebar` (nav links + active state), `Topbar` (account selector placeholder + capital placeholder + Export button placeholder), `AppLayout`.**

- [ ] **Step 2: Rewrite `main.tsx`** to wrap `QueryClientProvider` → `BrowserRouter basename={import.meta.env.BASE_URL}` → `AuthProvider` → `App` + `ToastHost`. Rewrite `App.tsx` to define the `<Routes>`.

- [ ] **Step 3: Verify + commit** — `npm run build` → PASS; `npm run dev` renders the shell (Login when logged out). `git commit -m "feat: add app shell, routing, and UI store"`.

---

## Task 12: API layer + query hooks

**Files:**
- Create: `src/api/accounts.ts`, `cashEvents.ts`, `trades.ts`, `tradeImages.ts`, `setups.ts`, `storage.ts`
- Create: `src/features/accounts/useAccounts.ts`, `src/features/accounts/useCashEvents.ts`, `src/features/trades/useTrades.ts`, `src/features/trades/useSetups.ts`

**Interfaces:**
- Produces (exact signatures):
  - `accounts.ts`: `listAccounts(): Promise<Account[]>`, `createAccount(a: NewAccount)`, `updateAccount(id, patch: Partial<NewAccount>)`, `deleteAccount(id)`.
  - `cashEvents.ts`: `listCashEvents(accountId): Promise<CashEvent[]>`, `createCashEvent(e: NewCashEvent)`, `updateCashEvent(id, patch)`, `deleteCashEvent(id)`.
  - `trades.ts`: `listTrades(accountId): Promise<Trade[]>`, `getTrade(id): Promise<Trade>`, `createTrade(t: NewTrade)`, `updateTrade(id, patch: UpdateTrade)`, `deleteTrade(id)`.
  - `tradeImages.ts`: `listTradeImages(tradeId): Promise<TradeImage[]>`, `addTradeImage(tradeId, storagePath)`, `deleteTradeImage(id)`.
  - `setups.ts`: `listSetups(): Promise<Setup[]>`, `createSetup(name): Promise<Setup>`.
  - `storage.ts`: `uploadImage(userId, tradeId, file): Promise<string>` (returns storage_path), `signedUrl(path): Promise<string>`, `removeImages(paths: string[]): Promise<void>`.
  - hooks: `useAccounts()`, `useCashEvents(accountId)`, `useTrades(accountId)`, `useTrade(id)`, `useSetups()` (React Query) + mutation hooks (`useCreateTrade`, etc.) that invalidate the right query keys.

- [ ] **Step 1: Implement `api/*`** as thin typed Supabase calls (`.select()`, `.insert().select().single()`, `.update().eq('id',id)`, `.delete().eq('id',id)`), throwing on `error`. Query keys: `['accounts']`, `['cashEvents', accountId]`, `['trades', accountId]`, `['trade', id]`, `['setups']`.

- [ ] **Step 2: Implement hooks** wrapping the api calls; mutations call `queryClient.invalidateQueries` on the affected keys.

- [ ] **Step 3: Wire Topbar** to `useAccounts` + `uiStore` (real account selector; compute capital later once trades hook is used on dashboard — Topbar shows account name + starting/current capital via `currentCapital` using that account's trades + cash events).

- [ ] **Step 4: Verify + commit** — `npm run build` → PASS. `git commit -m "feat: add Supabase API layer and query hooks"`.

---

## Task 13: Accounts feature (management + capital)

**Files:**
- Create: `src/features/accounts/AccountsPage.tsx`, `AccountForm.tsx`, `AccountCard.tsx`

**Interfaces:**
- Consumes: `useAccounts` + mutations, `uiStore`, `currentCapital`, `useTrades`, `useCashEvents`, UI kit.
- Produces: `/accounts` page: list of accounts with computed current capital, create/edit (Modal + `AccountForm`: name, type select, starting capital, currency), delete with `ConfirmDialog`. Empty state with CTA when no accounts. Selecting an account sets `activeAccountId`.

- [ ] **Step 1: Implement** the page, form, and card. Guard: deleting the active account clears/reassigns `activeAccountId`.

- [ ] **Step 2: Verify + commit** — `npm run build` → PASS; visually check in dev. `git commit -m "feat: add account management page"`.

---

## Task 14: Cash events

**Files:**
- Create: `src/features/accounts/CashEventsPanel.tsx`, `CashEventForm.tsx`
- Modify: `AccountsPage.tsx` (embed panel for the active account)

**Interfaces:**
- Consumes: `useCashEvents(accountId)` + mutations, UI kit, `formatSignedCurrency`.
- Produces: list of cash events for the active account (type, amount signed-colored, date, note), add/edit (`CashEventForm`: type select of the six types, amount, date, note), delete with confirm.

- [ ] **Step 1: Implement** panel + form; amounts render with profit/loss color via sign.

- [ ] **Step 2: Verify + commit** — `npm run build` → PASS. `git commit -m "feat: add cash events management"`.

---

## Task 15: Image pipeline (compression + upload + display + delete)

**Files:**
- Create: `src/features/trades/imageCompression.ts`, `src/features/trades/ImageUploader.tsx`, `src/features/trades/useSignedUrls.ts`
- Create: `src/features/trades/imageCompression.test.ts` (unit test the config selection only — pure parts)

**Interfaces:**
- Consumes: `browser-image-compression`, `storage.ts` (`uploadImage`, `signedUrl`, `removeImages`).
- Produces:
  - `COMPRESSION = { maxWidthOrHeight: 1600, maxSizeMB: 0.35, useWebWorker: true, fileType: 'image/webp' as const }` (single tunable constant, documented in README).
  - `compressImage(file: File): Promise<File>`.
  - `ImageUploader`: `value: File[]; onChange: (files: File[]) => void` — multi-select, thumbnail previews (object URLs), remove, compresses on add.
  - `useSignedUrls(paths: string[]): Record<string, string>` — resolves signed URLs for stored images.

- [ ] **Step 1: Implement** `imageCompression.ts` (export `COMPRESSION` and `compressImage`), `ImageUploader` (previews + remove), `useSignedUrls` (batch `signedUrl` via React Query). Storage path from `storage.uploadImage`: `${userId}/${tradeId}/${crypto.randomUUID()}.webp`.

- [ ] **Step 2: Test + verify** — a small test asserting `COMPRESSION.maxWidthOrHeight === 1600` and that `compressImage` calls through (mock the lib). `npm test` + `npm run build` → PASS.

- [ ] **Step 3: Commit** — `git commit -m "feat: add client image compression and uploader"`.

---

## Task 16: Trade entry (hybrid modal / full-screen)

**Files:**
- Create: `src/features/trades/TradeForm.tsx`, `src/features/trades/TradeFormFields.tsx`, `src/features/trades/TradeFormRoute.tsx`
- Modify: `src/App.tsx` (background-location modal pattern + mobile full-screen route), `Topbar.tsx`/`Sidebar.tsx` ("Neuer Trade" button)

**Interfaces:**
- Consumes: `useCreateTrade`/`useUpdateTrade`/`useTrade`, `useSetups`/`createSetup`, `ImageUploader`, `compressImage`, `storage.uploadImage`, `addTradeImage`, UI kit, `uiStore.activeAccountId`.
- Produces: `TradeForm` (controlled): **Basis** — asset (select MNQ/MES + add custom), date, time, PnL, `StarRating`, news `TagInput`, screenshots `ImageUploader`; **Erweitert (collapsed)** — direction `Toggle`, R-multiple, setup `TagInput`/select from setups, confidence `Slider` (1–10), notes `Textarea`. On save: create/update trade, then upload each image → `addTradeImage`. `TradeFormRoute` renders the form full-screen (mobile) or the App wires it as a `Modal` over the background location (desktop) via `useLocation().state.backgroundLocation`.

- [ ] **Step 1: Implement** fields, validation (asset/date/pnl required), save flow with image uploads, and the responsive open behavior (desktop modal via background location; mobile route). Advanced section collapsed by default.

- [ ] **Step 2: Verify + commit** — `npm run build` → PASS; add a trade in dev and confirm it persists + images upload. `git commit -m "feat: add hybrid trade entry form"`.

---

## Task 17: Trades table + filters

**Files:**
- Create: `src/features/trades/TradesPage.tsx`, `TradesTable.tsx`, `TradeFilters.tsx`

**Interfaces:**
- Consumes: `useTrades(activeAccountId)`, `uiStore.tradeFilters`, `sortTrades`, `useSetups`, UI kit, formatters.
- Produces: `/trades` — filterable (result all/wins/losses, setup, asset, date range) + sortable table (Asset, Datum, Zeit, Richtung, PnL colored, R, Rating stars, Setup). Row click → `/trades/:id`. Empty state with "Neuer Trade" CTA.

- [ ] **Step 1: Implement** filtering (derive filtered list from `tradeFilters`), column sorting (local state), and the row→detail navigation.

- [ ] **Step 2: Verify + commit** — `npm run build` → PASS. `git commit -m "feat: add trades table with filters"`.

---

## Task 18: Trade detail (gallery + edit/delete)

**Files:**
- Create: `src/features/trades/TradeDetailPage.tsx`, `TradeImageGallery.tsx`

**Interfaces:**
- Consumes: `useTrade(id)`, `useTradeImages(tradeId)` (add to `useTrades.ts`), `useSignedUrls`, `Lightbox`, `useDeleteTrade`, `storage.removeImages`, UI kit.
- Produces: `/trades/:id` — all fields laid out readably; screenshot gallery opening `Lightbox`; "Bearbeiten" → `/trades/:id/edit`; "Löschen" → `ConfirmDialog` → on confirm remove storage objects (`removeImages`) then `deleteTrade`, navigate back to `/trades`.

- [ ] **Step 1: Implement** the detail layout, gallery/lightbox, and delete flow (storage cleanup first).

- [ ] **Step 2: Verify + commit** — `npm run build` → PASS. `git commit -m "feat: add trade detail page with gallery"`.

---

## Task 19: Dashboard KPIs

**Files:**
- Create: `src/features/dashboard/DashboardPage.tsx`, `KpiGrid.tsx`, `KpiCard.tsx`, `DashboardFilters.tsx`

**Interfaces:**
- Consumes: `useTrades`, `useAccounts`/active account, `computeMetrics`, formatters, UI kit.
- Produces: `/dashboard` — applies result + date-range filters to trades, runs `computeMetrics`, renders KPI cards: Net PnL, Winrate, Trades, Ø Gewinn, Ø Verlust, Profit Factor, Ø PnL/Trade, Payoff Ratio, Ø R, Max Drawdown, Best/Worst, längste Serie (W/L). `KpiCard`: label + value (profit/loss colored where signed), `null` metrics render as "—". Empty state when no trades.

- [ ] **Step 1: Implement** filters, metrics wiring, and the KPI grid.

- [ ] **Step 2: Verify + commit** — `npm run build` → PASS. `git commit -m "feat: add dashboard KPI cards"`.

---

## Task 20: Equity curve chart

**Files:**
- Create: `src/features/dashboard/EquityChart.tsx`
- Modify: `DashboardPage.tsx`

**Interfaces:**
- Consumes: `Metrics.equityCurve`, Recharts, tokens.
- Produces: `EquityChart` — Recharts `AreaChart` + line in accent color over `equityCurve`, tooltip formatted via `formatCurrency`, muted axes, no gridline clutter.

- [ ] **Step 1: Implement** the chart with accent fill (low opacity) + accent stroke; responsive container.

- [ ] **Step 2: Verify + commit** — `npm run build` → PASS. `git commit -m "feat: add equity curve chart"`.

---

## Task 21: Breakdown charts

**Files:**
- Create: `src/features/dashboard/SetupBreakdown.tsx`, `RatingBreakdown.tsx`, `src/features/dashboard/breakdowns.ts`
- Modify: `DashboardPage.tsx`

**Interfaces:**
- Consumes: `Metrics.bySetup`, `Metrics.byRating`, Recharts.
- Produces: `breakdowns.ts` — a small registry `BreakdownDescriptor { key; label; }` + selectors, structured so new breakdowns (confidence, long/short, weekday, asset) can be added later without touching charts. `SetupBreakdown` (bar: net PnL per setup, profit/loss colored, count label), `RatingBreakdown` (bar: avg PnL per 1..5 stars).

- [ ] **Step 1: Implement** both bar charts + the extensible descriptor registry.

- [ ] **Step 2: Verify + commit** — `npm run build` → PASS. `git commit -m "feat: add setup and rating breakdown charts"`.

---

## Task 22: Calendar heatmap

**Files:**
- Create: `src/features/calendar/CalendarPage.tsx`, `CalendarHeatmap.tsx`, `DayTradesPanel.tsx`, `src/features/calendar/calendarData.ts`

**Interfaces:**
- Consumes: `useTrades(activeAccountId)`, date-fns, UI kit, formatters.
- Produces: `calendarData.ts` — `pnlByDay(trades): Map<string, number>` and month-grid builder. `/calendar` — month navigation (prev/next), day cells colored green/red with intensity scaled to |PnL| relative to the month's max; click a day → `DayTradesPanel` listing that day's trades (link to detail). Empty state.

- [ ] **Step 1: Implement** the grid, intensity scaling (bucket opacity by magnitude), and day drill-in.

- [ ] **Step 2: Verify + commit** — `npm run build` → PASS. `git commit -m "feat: add calendar heatmap view"`.

---

## Task 23: CSV export

**Files:**
- Create: `src/features/export/csv.ts`, `src/features/export/csv.test.ts`, `src/features/export/ExportPanel.tsx`
- Modify: `Topbar.tsx` (Export button opens the panel)

**Interfaces:**
- Consumes: `useTrades`, `useAccounts`, `useCashEvents`, UI kit.
- Produces:
  - `csv.ts`: `toCsv(rows: Record<string, unknown>[], columns: string[]): string` (quotes/escapes correctly) and `downloadCsv(filename, content)`.
  - `ExportPanel` (Modal): choose Trades (+ optional Accounts, Cash-Events), download each as CSV. Trades export includes all journaling columns.

- [ ] **Step 1: Write failing test** for `toCsv` (header row, comma/quote/newline escaping). `npm test` → FAIL.

- [ ] **Step 2: Implement** `csv.ts` + panel; `npm test` → PASS.

- [ ] **Step 3: Verify + commit** — `npm run build` → PASS. `git commit -m "feat: add CSV export"`.

---

## Task 24: Deploy pipeline + keep-alive + README finalize

**Files:**
- Create: `scripts/spa-fallback.mjs`, `.github/workflows/deploy.yml`, `.github/workflows/keep-alive.yml`
- Modify: `README.md` (deploy + keep-alive + defaults sections), `.env` (create from example with real values — committed anon key)

**Interfaces:**
- Produces: `postbuild` copies `dist/index.html` → `dist/404.html`; GitHub Actions deploy on push to `main`; opt-in keep-alive cron.

- [ ] **Step 1: Write `scripts/spa-fallback.mjs`**

```js
import { copyFileSync } from 'node:fs';
copyFileSync('dist/index.html', 'dist/404.html');
console.log('SPA fallback: dist/404.html written');
```

- [ ] **Step 2: Write `deploy.yml`** — mirror AniTracker's (checkout → setup-node 20 + npm cache → `npm ci` → `npm run build` → `upload-pages-artifact` path `dist` → `deploy-pages`), permissions `contents:read/pages:write/id-token:write`, concurrency group `pages`.

- [ ] **Step 3: Write `keep-alive.yml`** — scheduled cron (~every 5 days) doing a light authenticated `SELECT` (documented as opt-in; requires a repo secret for a service key OR a public anon read; note in README it's optional and how to enable).

- [ ] **Step 4: Finalize `README.md`** — the "Default decisions / tune here" list (compression constant location `imageCompression.ts`, default assets MNQ/MES in the asset select, empty setups, base path `/trading-journal/`).

- [ ] **Step 5: Verify + commit** — `npm run build` → PASS; confirm `dist/404.html` exists. `git commit -m "chore: add GitHub Pages deploy, keep-alive, and README"`.

---

## Self-Review

**Spec coverage:** Auth (T10), accounts + cash events + computed capital (T13/T14/T12), dashboard KPIs + equity + breakdowns + filters (T19–T21), trades table (T17), trade detail (T18), hybrid trade entry incl. all basis+advanced fields + multi-image compression (T15/T16), calendar heatmap (T22), CSV export (T23), design tokens (T2), schema/RLS/storage (T3), GH Pages deploy + keep-alive (T24), metrics formulas (T7), number formatting rules (T6). All spec sections map to a task.

**Placeholders:** Config, schema, formatting, and metrics carry full code. UI tasks carry exact files, prop/return interfaces, token constraints, and verify commands — buildable without further decisions. No "TBD/handle edge cases" left.

**Type consistency:** `Trade`/`Account`/`CashEvent` fields match the schema across T5→T7→T12→T16. `computeMetrics`/`currentCapital`/`sortTrades` signatures identical in T7 tests, T7 interface, and T19 consumer. `storage.uploadImage/signedUrl/removeImages` names consistent across T12/T15/T18. `tradeFilters` shape defined in T11 and consumed in T17/T19.
