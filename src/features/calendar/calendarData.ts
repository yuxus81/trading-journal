import type { Trade } from '@/types/db';

/** Sums PnL per calendar day (YYYY-MM-DD). */
export function pnlByDay(trades: Trade[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of trades) map.set(t.trade_date, (map.get(t.trade_date) ?? 0) + t.pnl);
  return map;
}

/** Builds a Monday-first month grid; null cells pad the leading/trailing week. */
export function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = (first.getDay() + 6) % 7; // Monday = 0

  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Largest absolute daily PnL among the given days (for heatmap scaling). */
export function maxAbsPnl(days: (string | null)[], pnlMap: Map<string, number>): number {
  let max = 0;
  for (const day of days) {
    if (!day) continue;
    const v = Math.abs(pnlMap.get(day) ?? 0);
    if (v > max) max = v;
  }
  return max;
}
