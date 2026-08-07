import { useEffect, useRef, useState } from 'react';
import { useAccounts } from './useAccounts';
import { useTrades } from '@/features/trades/useTrades';
import { useUiStore } from '@/store/uiStore';
import { currentCapital } from '@/features/metrics/calc';
import { ACCOUNT_TYPE_COLOR, ACCOUNT_TYPE_LABEL } from './accountMeta';
import { formatCurrency, formatSignedCurrency } from '@/lib/format';
import { CheckIcon, ChevronDownIcon, pnlToneClass, swatchClass } from '@/components/ui';

/** Topbar account switcher — custom popover, live capital and P&L readout. */
export function AccountSelector() {
  const { data: accounts } = useAccounts();
  const activeAccountId = useUiStore((s) => s.activeAccountId);
  const setActiveAccount = useUiStore((s) => s.setActiveAccount);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Keep the active account valid: auto-pick the first, or reset if it vanished.
  useEffect(() => {
    if (!accounts) return;
    const exists = activeAccountId && accounts.some((a) => a.id === activeAccountId);
    if (!exists) setActiveAccount(accounts[0]?.id ?? null);
  }, [accounts, activeAccountId, setActiveAccount]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = accounts?.find((a) => a.id === activeAccountId) ?? null;
  const trades = useTrades(activeAccountId);
  const capital = active && trades.data ? currentCapital(active, trades.data) : (active?.starting_capital ?? 0);
  const delta = active ? capital - active.starting_capital : 0;

  if (!accounts || accounts.length === 0) {
    return <span className="text-sm text-text-dim">Kein Konto — unter „Konten“ anlegen</span>;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-11 items-center gap-3 rounded-input border px-3 transition-colors ${
          open ? 'border-brand bg-raised' : 'border-border bg-card hover:border-border-strong'
        }`}
      >
        {active && <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${swatchClass(ACCOUNT_TYPE_COLOR[active.account_type])}`} />}
        <span className="flex flex-col items-start leading-tight">
          <span className="max-w-[9rem] truncate text-sm font-medium text-text">{active?.name ?? 'Konto wählen'}</span>
          {active && (
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="num text-text-dim">{formatCurrency(capital, active.currency)}</span>
              <span className={`num ${pnlToneClass(delta)}`}>{formatSignedCurrency(delta, active.currency)}</span>
            </span>
          )}
        </span>
        <ChevronDownIcon
          width={16}
          height={16}
          className={`shrink-0 text-text-dim transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-72 animate-pop-in rounded-input border border-border-strong bg-raised p-1 shadow-pop"
        >
          {accounts.map((a) => {
            const selected = a.id === activeAccountId;
            return (
              <li key={a.id}>
                <button
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setActiveAccount(a.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-left transition-colors hover:bg-brand/12"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${swatchClass(ACCOUNT_TYPE_COLOR[a.account_type])}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-text">{a.name}</span>
                    <span className="block text-[11px] text-text-dim">{ACCOUNT_TYPE_LABEL[a.account_type]}</span>
                  </span>
                  <span className="num shrink-0 text-xs text-text-muted">
                    {formatCurrency(a.starting_capital, a.currency)}
                  </span>
                  {selected && <CheckIcon width={15} height={15} className="shrink-0 text-brand" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
