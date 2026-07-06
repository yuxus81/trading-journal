import type { Account, Trade } from '@/types/db';
import type { EquityPoint, Metrics, RatingStat, SetupStat } from './types';

/**
 * Deterministic trade ordering: by trade_date, then exec_time (nulls last),
 * then created_at. Returns a new array (does not mutate the input).
 */
export function sortTrades(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => {
    if (a.trade_date !== b.trade_date) return a.trade_date < b.trade_date ? -1 : 1;
    if (a.exec_time !== b.exec_time) {
      if (a.exec_time === null) return 1; // nulls last
      if (b.exec_time === null) return -1;
      return a.exec_time < b.exec_time ? -1 : 1;
    }
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1;
    return 0;
  });
}

/** starting_capital + Σ trade pnl. Never stored. */
export function currentCapital(account: Account, trades: Trade[]): number {
  const pnl = trades.reduce((s, t) => s + t.pnl, 0);
  return account.starting_capital + pnl;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function computeMetrics(trades: Trade[], account: Account): Metrics {
  const sorted = sortTrades(trades);
  const pnls = sorted.map((t) => t.pnl);

  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);

  const netPnl = pnls.reduce((s, p) => s + p, 0);
  const grossProfit = wins.reduce((s, p) => s + p, 0);
  const grossLoss = Math.abs(losses.reduce((s, p) => s + p, 0));

  const avgWin = mean(wins);
  const avgLoss = mean(losses); // negative or 0

  const rMultiples = sorted
    .map((t) => t.r_multiple)
    .filter((r): r is number => r !== null && r !== undefined);

  // Equity curve: start at starting_capital, then accumulate pnl per sorted trade.
  const equityCurve: EquityPoint[] = [{ index: 0, date: 'start', equity: account.starting_capital }];
  let running = account.starting_capital;
  sorted.forEach((t, i) => {
    running += t.pnl;
    equityCurve.push({ index: i + 1, date: t.trade_date, equity: running });
  });

  // Max drawdown: largest peak-to-trough drop across the equity curve.
  let peak = equityCurve[0]!.equity;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    if (point.equity > peak) peak = point.equity;
    const drop = peak - point.equity;
    if (drop > maxDrawdown) maxDrawdown = drop;
  }

  // Streaks over sorted trades (pnl == 0 breaks both).
  let winRun = 0;
  let lossRun = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  for (const p of pnls) {
    if (p > 0) {
      winRun += 1;
      lossRun = 0;
    } else if (p < 0) {
      lossRun += 1;
      winRun = 0;
    } else {
      winRun = 0;
      lossRun = 0;
    }
    if (winRun > longestWinStreak) longestWinStreak = winRun;
    if (lossRun > longestLossStreak) longestLossStreak = lossRun;
  }

  // Breakdown by setup (non-null), sorted by net pnl desc.
  const setupMap = new Map<string, { netPnl: number; count: number }>();
  for (const t of sorted) {
    if (!t.setup) continue;
    const cur = setupMap.get(t.setup) ?? { netPnl: 0, count: 0 };
    cur.netPnl += t.pnl;
    cur.count += 1;
    setupMap.set(t.setup, cur);
  }
  const bySetup: SetupStat[] = [...setupMap.entries()]
    .map(([setup, v]) => ({ setup, netPnl: v.netPnl, count: v.count }))
    .sort((a, b) => b.netPnl - a.netPnl);

  // Breakdown by rating (1..5 that have trades), sorted ascending by rating.
  const ratingMap = new Map<number, number[]>();
  for (const t of sorted) {
    if (t.rating === null || t.rating === undefined) continue;
    const arr = ratingMap.get(t.rating) ?? [];
    arr.push(t.pnl);
    ratingMap.set(t.rating, arr);
  }
  const byRating: RatingStat[] = [...ratingMap.entries()]
    .map(([rating, arr]) => ({ rating, avgPnl: mean(arr), count: arr.length }))
    .sort((a, b) => a.rating - b.rating);

  return {
    tradeCount: sorted.length,
    netPnl,
    winrate: sorted.length > 0 ? wins.length / sorted.length : 0,
    avgWin,
    avgLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : null,
    payoffRatio: avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : null,
    avgPnlPerTrade: sorted.length > 0 ? netPnl / sorted.length : 0,
    avgR: rMultiples.length > 0 ? mean(rMultiples) : null,
    maxDrawdown,
    best: pnls.length > 0 ? Math.max(...pnls) : null,
    worst: pnls.length > 0 ? Math.min(...pnls) : null,
    longestWinStreak,
    longestLossStreak,
    equityCurve,
    bySetup,
    byRating,
  };
}
