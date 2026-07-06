import type { Trade } from '@/types/db';
import type { TradeFilters } from '@/store/uiStore';

/** Applies the shared trade filters (result, setup, asset, news, time-of-day). */
export function filterTrades(trades: Trade[], f: TradeFilters): Trade[] {
  return trades.filter((t) => {
    if (f.result === 'wins' && !(t.pnl > 0)) return false;
    if (f.result === 'losses' && !(t.pnl < 0)) return false;
    if (f.setup && t.setup !== f.setup) return false;
    if (f.asset && t.asset !== f.asset) return false;
    if (f.news.length > 0 && !f.news.some((n) => t.news.includes(n))) return false;
    const time = t.exec_time?.slice(0, 5);
    if (f.timeFrom && (!time || time < f.timeFrom)) return false;
    if (f.timeTo && (!time || time > f.timeTo)) return false;
    return true;
  });
}
