import { useEffect } from 'react';
import { useAccounts } from './useAccounts';
import { useTrades } from '@/features/trades/useTrades';
import { useUiStore } from '@/store/uiStore';
import { currentCapital } from '@/features/metrics/calc';
import { formatCurrency } from '@/lib/format';

/** Topbar account switcher + live current-capital readout. */
export function AccountSelector() {
  const { data: accounts } = useAccounts();
  const activeAccountId = useUiStore((s) => s.activeAccountId);
  const setActiveAccount = useUiStore((s) => s.setActiveAccount);

  // Keep the active account valid: auto-pick the first, or reset if it vanished.
  useEffect(() => {
    if (!accounts) return;
    const exists = activeAccountId && accounts.some((a) => a.id === activeAccountId);
    if (!exists) setActiveAccount(accounts[0]?.id ?? null);
  }, [accounts, activeAccountId, setActiveAccount]);

  const active = accounts?.find((a) => a.id === activeAccountId) ?? null;
  const trades = useTrades(activeAccountId);
  const capital = active && trades.data ? currentCapital(active, trades.data) : (active?.starting_capital ?? 0);

  if (!accounts || accounts.length === 0) {
    return <span className="text-sm text-text-dim">Kein Konto — unter „Konten" anlegen</span>;
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={activeAccountId ?? ''}
        onChange={(e) => setActiveAccount(e.target.value)}
        aria-label="Konto wählen"
        className="h-9 max-w-[10rem] rounded-input border border-border bg-card px-2 text-sm text-text focus:border-accent focus:outline-none"
      >
        {accounts.map((a) => (
          <option key={a.id} value={a.id} className="bg-card">
            {a.name}
          </option>
        ))}
      </select>
      {active && (
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-[11px] text-text-dim">Kapital</div>
          <div className="text-sm font-medium text-text">{formatCurrency(capital, active.currency)}</div>
        </div>
      )}
    </div>
  );
}
