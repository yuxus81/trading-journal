# Trading Journal — UX/Branding Redesign Design Spec

**Date:** 2026-07-06
**Status:** Approved (design), pre-implementation
**Author:** Claude Code (brainstorming session with owner)

Follow-up redesign of the already-shipped Trading Journal app (see
`2026-07-05-trading-journal-design.md`). The owner used the live app and found it too
dense and visually generic. This spec covers: dashboard simplification, cash-events
removal, calendar contrast fix, filter/direction color-coding, a flattened trade form
with reusable colored tags for setups and news, and a full re-brand (owner's own logo +
a monochrome accent replacing the purple).

---

## 1. Goals & non-goals

**Goals**
- Cut dashboard information density: 4 always-visible KPIs, the rest behind a collapsed
  "Erweiterte Statistiken" section.
- Remove features the owner won't use (cash events, date-range filter).
- Fix a genuinely broken UI (calendar heatmap contrast).
- Make win/loss and long/short state legible at a glance via color.
- Replace ad-hoc free-text setup/news fields with reusable, colored, pickable tags.
- Re-brand: owner's own logo ("YP Trades"), monochrome accent instead of purple.

**Non-goals**
- No new statistics or metrics beyond what already exists in `computeMetrics`.
- No relational normalization of setups/news onto trades (still name-based strings,
  per existing schema) — only add a `color` column / a small new table, not a join table.
- No free-form hex color picker — fixed preset palette only (keeps it simple for a
  non-technical single user).
- Cash-events DB table is not dropped, only unused (owner chose the zero-effort option).

---

## 2. Dashboard: fewer KPIs, no date-range filter

`src/features/dashboard/KpiGrid.tsx` currently renders 13 cards in one grid. Split into:

- **Core (always visible, 4 cards):** Net PnL, Winrate, Trades, Ø Gewinn.
- **Erweiterte Statistiken (collapsed by default):** Ø Verlust, Profit Factor,
  Ø PnL/Trade, Payoff Ratio, Ø R-Multiple, Max Drawdown, Bester Trade,
  Schlechtester Trade, Längste Serie (W/L). A single toggle button (text + chevron,
  same pattern as the trade form's old "Erweiterte Felder" toggle) expands/collapses
  this section. Collapsed is the default and persists only for the session (no need to
  remember across reloads — matches existing filter-reset behavior).

`TradeFilters` (`src/features/trades/TradeFilters.tsx`) and its backing state
(`src/store/uiStore.ts`, `src/features/trades/filterTrades.ts`) drop `dateFrom`/`dateTo`
entirely: remove the fields from `TradeFilters` type, `emptyFilters`, the filter
predicate, and the two `<input type="date">` blocks in the component. This affects both
the Trades page and the Dashboard's compact filter bar.

---

## 3. Cash-Events: remove from the app

Delete the feature end-to-end from the UI layer, leaving the `cash_events` table
unused in Supabase (owner's choice — no SQL migration needed):

- Delete `src/features/accounts/CashEventsPanel.tsx`, `CashEventForm.tsx`,
  `useCashEvents.ts`, and `src/api/cashEvents.ts`.
- `AccountsPage.tsx`: remove the `<CashEventsPanel>` render block and its import.
- `AccountCard.tsx`: remove the `useCashEvents` call; capital becomes
  `currentCapital(account, trades.data)` using only starting capital + trade PnL.
- `src/features/metrics/calc.ts`: `currentCapital(account, trades, cashEvents)` drops
  the `cashEvents` parameter (and the `CashEvent` import); update `calc.test.ts`
  accordingly.
- `src/features/export/ExportPanel.tsx`: remove the "Cash-Events" export row, the
  `cash` checkbox state, `CASH_COLUMNS`, and the `listAllCashEvents` import/call.
- `src/api/cashEvents.ts`'s `listAllCashEvents` export is deleted along with the file.
- `CashEventType` and `CashEvent`/`NewCashEvent` types in `src/types/db.ts` are removed
  (nothing else references them once the above is deleted).

---

## 4. Calendar heatmap: fix contrast

Root cause of the current bug (`src/features/calendar/CalendarHeatmap.tsx`): the cell
background uses a continuous `rgba(profit/loss, alpha)` overlay with `alpha` starting
at 0.15, so small-PnL days are nearly invisible against the dark card background, and
the PnL text uses the same green/red hue as the background tint, killing contrast.

Redesign:
- Replace the continuous alpha ramp with **4 fixed bands per side** (win/loss), each a
  concrete, pre-chosen hex (no computed opacity). Approximate dark-theme-appropriate
  scale, bucketed by PnL magnitude relative to the day's max absolute PnL in view
  (`maxAbs`, already computed upstream in `calendarData.ts`):
  - Loss bands (darkest → richest): `#3B1F22`, `#5A242A`, `#7A2C31`, `#A6343B`.
  - Win bands (darkest → richest): `#1F3B2E`, `#245A3A`, `#2C7A48`, `#2FA65B`.
  - No trades that day: no background fill (current card/border look).
- Day-of-month number: move to a clearly legible top-left position, `text-sm`
  font-medium, always rendered in the bright `text` token color (not `text-muted`),
  regardless of cell background.
- PnL amount: bottom-aligned, `text-xs font-semibold`, always rendered in `text`
  (bright white/off-white) — not the semantic profit/loss color — since it now always
  sits on a dark, saturated band where a light neutral reads clearly at every level.
- Selected-day ring stays the accent-colored border (accent color itself changes per
  §7, this component doesn't hardcode purple so no direct change needed there beyond
  the token swap).

---

## 5. Color-coded filters and direction toggle

- `TradeFilters.tsx` result tabs: keep the existing segmented-control look for "Alle",
  but when "Wins" is the active tab, use profit-tinted styling (`bg-profit/15
  text-profit`, or similar token pairing already used elsewhere for tone), and when
  "Losses" is active, use loss-tinted styling (`bg-loss/15 text-loss`). "Alle" keeps the
  neutral accent-selected look.
- `TradeForm.tsx` direction toggle ("Long"/"Short"): same treatment — Long selected =
  profit-tinted, Short selected = loss-tinted. This mirrors standard candlestick
  convention (green = long/bullish, red = short/bearish) and reuses the same two
  semantic tokens already in the design system; no new color tokens needed for this
  part.

---

## 6. Trade form: fully flat, colored reusable tags for Setup & News

### 6a. Remove progressive disclosure
Delete the `showAdvanced` state and the "Erweiterte Felder" toggle button/wrapper in
`TradeForm.tsx`. Richtung, R-Multiple, Setup, Confidence, Notizen render unconditionally
in the same order they appear today. The `confidenceOn` checkbox gate is also removed —
the Confidence slider is always visible (default value `5` if the owner never touches
it, same default already used for the slider's initial state); `confidence` is stored
whenever the form is submitted (no more null-unless-opted-in).

### 6b. New shared concept: colored tags
Both Setups and News become the same shape: a user-owned, named, colored, reusable
picklist item, created inline the first time it's used.

**Schema (`supabase/schema.sql` addendum, owner runs once in the SQL editor):**
```sql
alter table setups add column color text not null default 'gray';

create table news_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
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
`trades.setup` (string) and `trades.news` (string[]) columns are unchanged — a trade
still stores the tag *name(s)*, not a foreign key. Color is resolved by looking up the
name against the `setups`/`news_tags` list client-side. This avoids a data migration and
keeps the existing auto-create-on-submit behavior intact, just extended with a color.

**Fixed palette (8 presets):** gray, red, orange, amber/yellow, green, teal, blue,
violet, pink. Each gets a Tailwind token pair for pill rendering: a base color and a
soft background variant (e.g. `tag-blue` / `tag-blue/15`), added to `tailwind.config.ts`
alongside the existing `profit`/`loss`/`star` tokens. Stored value on the row is the
palette key (`'blue'`, `'green'`, …), not a hex, so the token mapping can change later
without a data migration.

**New shared UI component** `src/components/ui/TagPicker.tsx`:
- Renders existing tags as colored pills (`bg-tag-{color}/15 text-tag-{color}`).
- Single-select mode (Setup) or multi-select mode (News), controlled via a prop.
- An inline "+ Neu" affordance: typing a name and picking one of the 8 swatches creates
  the tag (via a passed-in `onCreate` callback) and immediately selects it.
- Used by `TradeForm.tsx` for both Setup (replaces the plain `Input` + `datalist`) and
  News (replaces `TagInput`).

**Backing changes:**
- `src/types/db.ts`: `Setup` gains `color: string`. New `NewsTag` type mirrors it
  (`id`, `user_id`, `name`, `color`, `created_at`).
- `src/api/setups.ts`: `createSetup(name)` becomes `createSetup(name, color)`;
  `listSetups` unchanged in shape (now returns `color` too).
- New `src/api/newsTags.ts`: `listNewsTags`, `createNewsTag(name, color)` — same shape
  as `setups.ts`.
- New `src/features/trades/useNewsTags.ts` hook, mirroring `useSetups.ts`.
- Anywhere a setup/news value is currently rendered as plain text — `TradesTable.tsx`,
  `TradeDetailPage.tsx`, `SetupBreakdown.tsx` — render the matching colored pill instead
  (small reusable `Pill`/`Tag` display component, separate from the interactive
  `TagPicker`, sharing the same color-token mapping).

---

## 7. Branding: owner's logo, "YP Trades", monochrome accent

- Logo source file `YP Trades Logo.png` (already dropped at the trading-journal project
  root) moves to `src/assets/logo.png`; also generate/copy a favicon
  (`public/favicon.png` or `.ico`) from the same source.
- App name becomes **"YP Trades"**, with "Trading Journal" kept as a small subtitle
  where there's room:
  - `index.html` `<title>`: `YP Trades`.
  - `Sidebar.tsx` header: logo image (~28px rounded) + "YP Trades" text, replacing the
    small accent-colored dot + "Trading Journal" text.
  - `LoginScreen`: logo image (larger, ~64px) above an "YP Trades" heading, with
    "Trading Journal" as a smaller subtitle line (existing "Melde dich an…" copy stays
    below that).
- **Color tokens** (`tailwind.config.ts`): replace the purple accent family with a
  monochrome pair — `accent` becomes a light neutral (near-white, e.g. `#E7E8EC`) and
  `accent-ink` (the "on-accent" text/icon color) becomes a near-black
  (e.g. `#14151A`), so primary buttons/active nav/selected states render as a bright
  light-on-dark chip (matching the logo's white wordmark on black). `profit` (#4ADE9E),
  `loss` (#F98080), and `star` (#EAB94D) are unchanged — they're functional/semantic,
  not part of the purple-design complaint. New `tag-*` tokens are additive (§6b).
- No other component-level changes are needed beyond the token swap — every place that
  currently uses `bg-accent`/`text-accent`/`accent-ink` picks up the new look
  automatically since the whole app is already token-driven.

---

## 8. Bugfix: duplicate "Neuer Trade" button

`TradesPage.tsx` currently renders its own header button (line ~43) in addition to the
always-visible global one in `Topbar.tsx`. Remove the page-header button; keep the
`Topbar` one (it's global, available from every page) and keep the `EmptyState`'s
contextual "+ Neuer Trade" call-to-action for the true zero-trades case (it no longer
co-exists with a second header button once the header button is gone).

---

## 9. File-level change summary

**Deleted:** `CashEventsPanel.tsx`, `CashEventForm.tsx`, `useCashEvents.ts`,
`api/cashEvents.ts`.

**New:** `components/ui/TagPicker.tsx`, `components/ui/Tag.tsx` (display-only pill),
`features/trades/useNewsTags.ts`, `api/newsTags.ts`, `src/assets/logo.png`,
`public/favicon.png`.

**Modified:** `KpiGrid.tsx` (core/advanced split + collapse toggle, inline — no new file),
`DashboardPage.tsx`, `TradeFilters.tsx`, `uiStore.ts`, `filterTrades.ts`,
`AccountsPage.tsx`, `AccountCard.tsx`, `metrics/calc.ts`, `calc.test.ts`,
`ExportPanel.tsx`, `CalendarHeatmap.tsx`, `TradeForm.tsx`, `TradesTable.tsx`,
`TradeDetailPage.tsx`, `SetupBreakdown.tsx`, `types/db.ts`, `api/setups.ts`,
`useSetups.ts`, `tailwind.config.ts`, `index.html`, `Sidebar.tsx`, `LoginScreen.tsx`,
`TradesPage.tsx`, `supabase/schema.sql` (append-only addendum for `setups.color` +
`news_tags`).

**Owner action required:** run the §6b SQL addendum once in the Supabase SQL editor
before the new tag features will work (same manual-migration pattern as the original
schema install).
