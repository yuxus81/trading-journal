import { describe, it, expect } from 'vitest';
import { computeMetrics, currentCapital, sortTrades } from '@/features/metrics/calc';
import type { Account, Trade, CashEvent } from '@/types/db';

const acc: Account = {
  id: 'a',
  user_id: 'u',
  name: 'A',
  account_type: 'prop',
  starting_capital: 1000,
  currency: 'USD',
  created_at: '2026-01-01T00:00:00Z',
};

let seq = 0;
function t(p: Partial<Trade>): Trade {
  seq += 1;
  return {
    id: `t${seq}`,
    account_id: 'a',
    user_id: 'u',
    asset: 'MNQ',
    trade_date: '2026-01-01',
    exec_time: null,
    pnl: 0,
    rating: null,
    news: [],
    direction: null,
    r_multiple: null,
    setup: null,
    confidence: null,
    notes: null,
    created_at: `2026-01-01T00:00:0${seq % 10}Z`,
    ...p,
  };
}

describe('computeMetrics', () => {
  it('handles empty input', () => {
    const m = computeMetrics([], acc);
    expect(m.tradeCount).toBe(0);
    expect(m.netPnl).toBe(0);
    expect(m.winrate).toBe(0);
    expect(m.profitFactor).toBeNull();
    expect(m.payoffRatio).toBeNull();
    expect(m.avgR).toBeNull();
    expect(m.best).toBeNull();
    expect(m.worst).toBeNull();
    expect(m.equityCurve).toEqual([{ index: 0, date: 'start', equity: 1000 }]);
    expect(m.bySetup).toEqual([]);
    expect(m.byRating).toEqual([]);
  });

  it('computes winrate, net pnl, profit factor, averages', () => {
    const m = computeMetrics([t({ pnl: 100 }), t({ pnl: -50 }), t({ pnl: 200 }), t({ pnl: 0 })], acc);
    expect(m.tradeCount).toBe(4);
    expect(m.netPnl).toBe(250);
    expect(m.winrate).toBeCloseTo(2 / 4);
    expect(m.profitFactor).toBeCloseTo(300 / 50);
    expect(m.avgWin).toBeCloseTo(150);
    expect(m.avgLoss).toBeCloseTo(-50);
    expect(m.payoffRatio).toBeCloseTo(3);
    expect(m.avgPnlPerTrade).toBeCloseTo(250 / 4);
    expect(m.best).toBe(200);
    expect(m.worst).toBe(-50);
  });

  it('profit factor is null when there are no losses', () => {
    expect(computeMetrics([t({ pnl: 10 })], acc).profitFactor).toBeNull();
  });

  it('averages r_multiple only where set', () => {
    const m = computeMetrics([t({ pnl: 10, r_multiple: 2 }), t({ pnl: -5, r_multiple: -1 }), t({ pnl: 3 })], acc);
    expect(m.avgR).toBeCloseTo(0.5);
  });

  it('builds the equity curve starting at starting_capital', () => {
    const m = computeMetrics([t({ pnl: 100, exec_time: '09:00' }), t({ pnl: -40, exec_time: '10:00' })], acc);
    expect(m.equityCurve.map((p) => p.equity)).toEqual([1000, 1100, 1060]);
  });

  it('computes max drawdown on the equity curve', () => {
    // equity: 1000 -> 1100 -> 900 -> 1000. peak 1100, trough 900 => DD 200
    const m = computeMetrics(
      [t({ pnl: 100, exec_time: '09:00' }), t({ pnl: -200, exec_time: '10:00' }), t({ pnl: 100, exec_time: '11:00' })],
      acc,
    );
    expect(m.maxDrawdown).toBe(200);
  });

  it('computes longest win/loss streaks in date/time order', () => {
    const m = computeMetrics(
      [
        t({ pnl: 10, exec_time: '09:00' }),
        t({ pnl: 20, exec_time: '10:00' }),
        t({ pnl: -5, exec_time: '11:00' }),
        t({ pnl: -5, exec_time: '12:00' }),
        t({ pnl: -5, exec_time: '13:00' }),
      ],
      acc,
    );
    expect(m.longestWinStreak).toBe(2);
    expect(m.longestLossStreak).toBe(3);
  });

  it('groups by setup (sorted by net pnl desc) and by rating', () => {
    const m = computeMetrics(
      [
        t({ pnl: 100, setup: 'Breakout', rating: 5 }),
        t({ pnl: -20, setup: 'Reversal', rating: 2 }),
        t({ pnl: 50, setup: 'Breakout', rating: 4 }),
      ],
      acc,
    );
    expect(m.bySetup).toEqual([
      { setup: 'Breakout', netPnl: 150, count: 2 },
      { setup: 'Reversal', netPnl: -20, count: 1 },
    ]);
    expect(m.byRating.find((r) => r.rating === 5)?.avgPnl).toBe(100);
    expect(m.byRating.find((r) => r.rating === 2)?.avgPnl).toBe(-20);
  });
});

describe('currentCapital', () => {
  it('adds pnl and cash events to starting capital', () => {
    const ce: CashEvent[] = [
      { id: 'c', account_id: 'a', user_id: 'u', type: 'payout', amount: -100, event_date: '2026-01-02', note: null, created_at: 'x' },
    ];
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
