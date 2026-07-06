import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ResultFilter = 'all' | 'wins' | 'losses';

export interface TradeFilters {
  result: ResultFilter;
  setup: string | null;
  asset: string | null;
}

const emptyFilters: TradeFilters = {
  result: 'all',
  setup: null,
  asset: null,
};

interface UiState {
  activeAccountId: string | null;
  setActiveAccount: (id: string | null) => void;
  tradeFilters: TradeFilters;
  setTradeFilters: (patch: Partial<TradeFilters>) => void;
  resetFilters: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeAccountId: null,
      setActiveAccount: (id) => set({ activeAccountId: id }),
      tradeFilters: emptyFilters,
      setTradeFilters: (patch) => set((s) => ({ tradeFilters: { ...s.tradeFilters, ...patch } })),
      resetFilters: () => set({ tradeFilters: emptyFilters }),
    }),
    {
      name: 'trading-journal.ui',
      // Only the active account survives reloads; filters reset per session.
      partialize: (s) => ({ activeAccountId: s.activeAccountId }),
    },
  ),
);
