import type { Trade } from '@/types/db';
import type { TradeFilters } from '@/store/uiStore';

/** Applies the shared trade filters (result, setup, asset, date range). */
export function filterTrades(trades: Trade[], f: TradeFilters): Trade[] {
  return trades.filter((t) => {
    if (f.result === 'wins' && !(t.pnl > 0)) return false;
    if (f.result === 'losses' && !(t.pnl < 0)) return false;
    if (f.setup && t.setup !== f.setup) return false;
    if (f.asset && t.asset !== f.asset) return false;
    if (f.dateFrom && t.trade_date < f.dateFrom) return false;
    if (f.dateTo && t.trade_date > f.dateTo) return false;
    return true;
  });
}
