# Trading Journal — Design Spec

**Date:** 2026-07-05
**Status:** Approved (design), pre-implementation
**Author:** Claude Code (brainstorming session with owner)

A personal, single-user trading journal web app that replaces a Notion setup.
Cloud-synced via Supabase. Calm, dark, roomy design. Manual journaling — **not**
live trading. Desktop-first, usable in a pinch on mobile. German UI, English code
(mirrors the owner's existing AniTracker app).

---

## 1. Goals & non-goals

**Goals**
- Log trades manually with screenshots, ratings, notes, and metadata.
- Track multiple accounts (prop/live/demo), each with its own capital and cash events.
- Dashboard of computed KPIs, an equity curve, and breakdowns.
- Trade table, trade detail, calendar heatmap.
- CSV export as the backup mechanism (Free-tier has no automatic backup).

**Non-goals for v1 (keep structure open for later)**
- No broker auto-import (Tradovate/NinjaTrader/Rithmic). Data model stays
  import-friendly, but no importer is built now.
- No PWA / installable app. Responsive web is enough ("no separate mobile app").
- No public registration. The single user is created once in the Supabase dashboard.

---

## 2. Tech stack & conventions (mirrors AniTracker)

- React 18 + TypeScript (strict, incl. `noUnusedLocals/Parameters`, `noUncheckedIndexedAccess`).
- Vite 5, `@/*` path alias, feature-folder layout.
- Tailwind CSS 3.4 — dark theme only; all colors/radii as tokens in `tailwind.config.ts`.
- React Router 6.
- **TanStack Query** for server state (Supabase reads/writes, cache, invalidation).
- **Zustand** (with `persist`) for UI state: active account id + active filters.
- **Recharts** for charts. **date-fns** for dates. **browser-image-compression** for uploads.
- These four are the only new runtime dependencies vs. AniTracker. Keep deps minimal.

**Build gate:** `npm run build` (`tsc && vite build`). Unlike AniTracker, use a plain
`tsc --noEmit` (non-composite) for the `typecheck` script so it does not hit the TS6310
"may not disable emit" error. `npm run build` remains the authoritative gate.

**Testing:** Vitest, used narrowly for the pure metrics module (`features/metrics/calc.ts`).
Financial math (drawdown, profit factor, streaks, edge cases) warrants unit tests.
This is the only new dev dependency of note.

---

## 3. Repository & deployment

- Lives at `trading-journal/` next to `anitracker/` in the OneDrive working dir; its own git repo.
- **GitHub Pages** deploy, identical pattern to AniTracker:
  - `vite.config.ts` `base = process.env.VITE_BASE ?? '/trading-journal/'`.
  - Router `basename = import.meta.env.BASE_URL`.
  - `postbuild` script copies `dist/index.html → dist/404.html` (SPA deep-link fallback).
  - `.github/workflows/deploy.yml` — build + deploy on push to `main` (+ manual dispatch).
  - `.env` committed with the **public anon key** (safe: protected by RLS). Never commit `service_role`.
- Local dev via `.claude/launch.json` config named `trading-journal`, port `5200` (AniTracker uses 5199).
- Optional `.github/workflows/keep-alive.yml` shipped, documented as opt-in (prevents the
  Supabase Free 7-day pause via a light scheduled SELECT).

---

## 4. Data model (Supabase / Postgres)

Delivered verbatim from the owner's spec as `supabase/schema.sql`, run manually in the
SQL editor. Tables: `accounts`, `cash_events`, `trades`, `trade_images`, `setups`.
RLS on every table (`user_id = auth.uid()`), explicit `GRANT`s to `authenticated` (required
for projects created after 2026-05-30), and a private `trade-images` storage bucket with
owner-scoped read/insert/delete policies. If a policy/grant name must differ for the running
Supabase version, adapt and note it in the SQL comments.

**New, dedicated Supabase project** (separate from AniTracker) so RLS, storage, and quotas
are isolated.

Row types live in `src/types/db.ts`, kept in sync with the schema by hand.

---

## 5. Computed metrics — `features/metrics/calc.ts` (pure, tested)

A single pure entry point, e.g. `computeMetrics(trades, cashEvents, account, filters)`,
with no Supabase/React dependency. Everything the dashboard and charts need is derived here.

- **Current capital** = `starting_capital + Σ trades.pnl + Σ cash_events.amount` (never stored).
- **Win** = `pnl > 0`, **Loss** = `pnl < 0`, `pnl == 0` = break-even.
- **Winrate** = count(pnl > 0) / count(all).
- **Net PnL** = Σ pnl.
- **Avg win** = mean(pnl | pnl > 0); **Avg loss** = mean(pnl | pnl < 0).
- **Profit factor** = Σ(positive pnl) / |Σ(negative pnl)|. Guard division by zero
  (no losses → treat as ∞/"—"; no trades → "—").
- **Payoff ratio** = |avg win / avg loss|.
- **Avg PnL/trade** = mean(pnl).
- **Avg R-multiple** = mean(r_multiple where set).
- **Max drawdown** ($) = largest peak-to-trough drop of the cumulative equity curve.
- **Streaks** = longest consecutive win / loss run, ordered by date+time.
- **Equity curve** = running cumulative pnl, starting at `starting_capital`, ordered by date+time.
  (Cash events are **not** part of the equity curve per spec; they only affect current capital.)
- **Best / worst** trade, **trade count**.

**Deterministic ordering everywhere:** `trade_date`, then `exec_time` (null sorts last),
then `created_at`. All KPIs, charts, and breakdowns respect the active account and active filters.

**Breakdowns (extensible):** by Setup (bar: PnL & count per setup) and by Rating (avg PnL per
1–5 stars). Structure so new breakdowns (confidence, long/short, weekday/hour, asset) drop in
later without refactoring — a small registry of `{ key, label, groupBy, aggregate }` descriptors.

---

## 6. State & data-fetching architecture

- `src/lib/supabase.ts` — client with hybrid remember-me storage (localStorage vs. sessionStorage),
  copied from AniTracker's proven implementation.
- `src/lib/queryClient.ts` — shared TanStack Query client.
- `src/lib/env.ts` — typed env access.
- `src/lib/format.ts` — number/currency/date formatting (see §10).
- `src/api/*` — one module per table (`accounts`, `cashEvents`, `trades`, `tradeImages`, `setups`,
  `storage`), each exposing typed CRUD functions. React Query hooks wrap these per feature.
- `src/store/uiStore.ts` — Zustand (persisted): `activeAccountId`, dashboard/table filters
  (result set: All/Wins/Losses, date range, setup, asset).

---

## 7. Routing & navigation

Routes: `/login`, `/dashboard`, `/trades`, `/trades/:id`, `/calendar`, `/accounts`.

**Hybrid trade entry** (per owner's choice):
- `/trades/new` and `/trades/:id/edit` render as a **centered modal over the current page**
  on desktop (React Router "background location" pattern), and as a **full-screen route** on mobile.

**Export:** a prominent Topbar button opens an `ExportPanel` (CSV for trades, and optionally
accounts + cash events).

**Shell:** left **Sidebar** (Dashboard, Trades, Calendar, Accounts, Export) + **Topbar**
(account selector + computed current capital). On mobile the sidebar becomes a drawer.
Protected routes behind `AuthProvider`; unauthenticated users see `LoginScreen`.

---

## 8. Pages & features

- **Login** — Supabase email/password, then redirect into the app.
- **Accounts** — create/edit/delete (name, type prop/live/demo, starting capital, currency=USD);
  active-account selector; computed current capital; **Cash events** CRUD
  (payout/reset/deposit/withdrawal/fee/adjustment — amount, date, note; signed amounts).
- **Dashboard** — KPI cards (Net PnL, Winrate, Trades, Avg win, Avg loss, Profit factor,
  Avg PnL/trade, Payoff ratio, Avg R, Max drawdown, Best/Worst, longest W/L streak);
  Equity curve (area + line, accent color); Setup & Rating breakdown charts;
  filters (All/Wins/Losses + date range).
- **Trades table** — sortable/filterable (Asset, Date, Time, Direction, PnL, R, Rating, Setup);
  filters (Wins/Losses, Setup, Asset, date range); row click → detail.
- **Trade detail** — all fields; screenshots as large gallery/lightbox (multiple images);
  readable notes; edit/delete.
- **Trade entry** (hybrid modal/page) — **Basis (always visible):** Asset (MNQ/MES/custom),
  date, time, PnL (typed), rating (1–5 stars), news-of-day tags, screenshots (multi-upload with
  preview + client compression). **Advanced (collapsed by default):** direction toggle,
  R-multiple, setup tag (reusable from `setups`), confidence 1–10 slider, psychology/mistake notes.
- **Calendar** — month grid heatmap of PnL per day (green/red by result, intensity by amount);
  click a day → that day's trades.
- **CSV export** — prominent; export all trades (+ optional accounts/cash events).

**UX details:** dark theme only; empty states with clear CTA (no accounts / no trades);
delete always confirmed; loading states + simple error messages on Supabase failures;
advanced entry fields stay collapsed until expanded.

---

## 9. Image pipeline

1. Client compression via `browser-image-compression`: `maxWidthOrHeight: 1600`, target ~0.35 MB,
   WebP output, web worker on.
2. Upload to `trade-images/{userId}/{tradeId}/{uuid}.webp` (bucket is private; `owner` set to the
   authenticated user, matching the storage RLS policy).
3. Insert a `trade_images` row with the `storage_path`.
4. Display via **signed URLs** (`createSignedUrl`) since the bucket is private.
5. **On trade/image delete:** explicitly remove the storage object(s) first — the FK cascade only
   deletes `trade_images` rows, not the underlying storage files.

---

## 10. Design system (tokens in `tailwind.config.ts`)

Exact palette from spec:
- Page bg `#17181C`; cards/surfaces `#212329`; borders `#2A2C33` (subtle) / `#31333B` (stronger).
- Text: primary `#ECEDEF`, secondary `#8B8D96`, muted `#6E7079`.
- Accent (violet) `#8B85EA`; text-on-accent `#12103A`.
- Profit/positive `#4ADE9E`; loss/negative `#F98080`; rating stars `#EAB94D`.

Principles: lots of whitespace/air, large radii (cards 12–16px, inputs 9–11px), calm,
eye-friendly. Sans-serif. Only two weights (400 regular, 500 for emphasis). No gradients or
shadow gimmicks.

**Number formatting (`lib/format.ts`):** sign before the currency symbol (`-$85`, not `$-85`);
currency rounded to whole numbers; R-multiple to 2 decimals; percentages to whole/one decimal.

Component craft during implementation leans on the `ui-ux-pro-max` / `impeccable` skills; the
palette and principles above are the constraints.

---

## 11. Defaults chosen (owner-adjustable)

- Seeded asset options: **MNQ, MES** (custom additions allowed). Setup tags: start empty.
- Default currency: USD.
- Image compression: `maxWidthOrHeight: 1600`, target ~0.35 MB, WebP — all in one config constant.
- GitHub Pages base path: `/trading-journal/`.
- `keep-alive.yml` shipped but opt-in.
- App display name "Trading Journal" (renameable).

---

## 12. Setup steps (README)

1. Create a new Supabase project; run `supabase/schema.sql`; verify the private `trade-images` bucket.
2. Put project URL + anon key in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. Create the single user once in the Supabase Auth dashboard.
4. `npm install`, then `npm run dev`.
5. (Optional) Enable `keep-alive.yml`.

A closing README section lists the default decisions and where to tune values
(compression sizes, default assets, setup tags).
