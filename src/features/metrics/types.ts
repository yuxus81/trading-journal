export interface EquityPoint {
  index: number;
  date: string;
  equity: number;
}

export interface SetupStat {
  setup: string;
  netPnl: number;
  count: number;
}

export interface RatingStat {
  rating: number;
  avgPnl: number;
  count: number;
}

export interface Metrics {
  tradeCount: number;
  netPnl: number;
  winrate: number; // fraction 0..1; 0 when no trades
  avgWin: number; // 0 when no wins
  avgLoss: number; // negative; 0 when no losses
  profitFactor: number | null; // null when undefined (no losses or no trades)
  payoffRatio: number | null; // null when avgLoss == 0
  avgPnlPerTrade: number;
  avgR: number | null; // null when no r_multiple set
  maxDrawdown: number; // >= 0, in currency units
  best: number | null; // best single-trade pnl
  worst: number | null; // worst single-trade pnl
  longestWinStreak: number;
  longestLossStreak: number;
  equityCurve: EquityPoint[]; // starts at starting_capital
  bySetup: SetupStat[]; // sorted by netPnl desc
  byRating: RatingStat[]; // ratings 1..5 that have trades
}
