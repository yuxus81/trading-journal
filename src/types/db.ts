export type AccountType = 'backtest' | 'demo' | 'eval' | 'funded' | 'live';
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
  color: string;
}

export interface NewsTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export type NewAccount = Pick<Account, 'name' | 'account_type' | 'starting_capital' | 'currency'>;
export type NewTrade = Omit<Trade, 'id' | 'user_id' | 'created_at'>;
export type UpdateTrade = Partial<Omit<Trade, 'id' | 'user_id' | 'account_id' | 'created_at'>>;
