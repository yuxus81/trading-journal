import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccounts } from '@/features/accounts/useAccounts';
import { useUiStore } from '@/store/uiStore';
import { ACCOUNT_TYPE_COLOR } from '@/features/accounts/accountMeta';
import { NAV_ITEMS } from './NavRail';
import { ExportIcon, PlusIcon, SearchIcon, swatchClass } from '@/components/ui';

interface Command {
  id: string;
  label: string;
  group: string;
  icon?: ReactNode;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
}

/**
 * ⌘K palette. In a journal you spend most of your time between four screens
 * and one account switch — keyboard access removes the mouse trip entirely,
 * and it is the one nav affordance a generic admin template never has.
 */
export function CommandPalette({ open, onClose, onExport }: CommandPaletteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: accounts } = useAccounts();
  const setActiveAccount = useUiStore((s) => s.setActiveAccount);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = NAV_ITEMS.map((n) => ({
      id: `nav-${n.to}`,
      label: n.label,
      group: 'Gehe zu',
      icon: <n.Icon width={16} height={16} />,
      run: () => navigate(n.to),
    }));

    const actions: Command[] = [
      {
        id: 'new-trade',
        label: 'Neuer Trade',
        group: 'Aktionen',
        icon: <PlusIcon width={16} height={16} />,
        run: () => navigate('/trades/new', { state: { backgroundLocation: location } }),
      },
      {
        id: 'export',
        label: 'Export (CSV)',
        group: 'Aktionen',
        icon: <ExportIcon width={16} height={16} />,
        run: onExport,
      },
    ];

    const accountCmds: Command[] = (accounts ?? []).map((a) => ({
      id: `acc-${a.id}`,
      label: a.name,
      group: 'Konto wechseln',
      icon: <span className={`h-2 w-2 rounded-full ${swatchClass(ACCOUNT_TYPE_COLOR[a.account_type])}`} />,
      run: () => setActiveAccount(a.id),
    }));

    return [...nav, ...actions, ...accountCmds];
  }, [accounts, location, navigate, onExport, setActiveAccount]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands;
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      // Autofocus after the portal mounts, otherwise the ref is still null.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setIndex(0), [query]);

  if (!open) return null;

  const runAt = (i: number) => {
    const cmd = results[i];
    if (!cmd) return;
    onClose();
    cmd.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => (i + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => (i - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runAt(index);
    }
  };

  let lastGroup = '';

  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-start justify-center p-4 pt-[12vh]">
      <div className="fixed inset-0 animate-fade-in bg-black/65 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Befehle"
        onKeyDown={onKeyDown}
        className="relative z-10 w-full max-w-lg animate-pop-in overflow-hidden rounded-card border border-border-strong bg-raised shadow-pop"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <SearchIcon width={17} height={17} className="shrink-0 text-text-dim" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Seite, Aktion oder Konto…"
            aria-label="Befehl suchen"
            className="h-12 flex-1 bg-transparent text-sm text-text placeholder:text-text-dim focus:outline-none"
          />
          <kbd className="num rounded border border-border px-1.5 py-0.5 text-[10px] text-text-dim">esc</kbd>
        </div>

        <ul className="max-h-[52vh] overflow-y-auto p-1.5">
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-text-dim">Kein Treffer.</li>
          )}
          {results.map((c, i) => {
            const showGroup = c.group !== lastGroup;
            lastGroup = c.group;
            return (
              <li key={c.id}>
                {showGroup && (
                  <div className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-dim">
                    {c.group}
                  </div>
                )}
                <button
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => runAt(i)}
                  className={`flex w-full items-center gap-3 rounded-[7px] px-2.5 py-2 text-left text-sm transition-colors ${
                    i === index ? 'bg-brand/15 text-text' : 'text-text-muted'
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center text-text-dim">{c.icon}</span>
                  {c.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
