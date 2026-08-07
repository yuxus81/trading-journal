import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { useAuth } from '@/features/auth/useAuth';
import { AccountSelector } from '@/features/accounts/AccountSelector';
import { NavRail } from './NavRail';
import { Button, ExportIcon, LogoutIcon, PlusIcon, SearchIcon } from '@/components/ui';

interface TopBarProps {
  onExport: () => void;
  onOpenPalette: () => void;
}

export function TopBar({ onExport, onOpenPalette }: TopBarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const newTrade = () => navigate('/trades/new', { state: { backgroundLocation: location } });
  const initial = (user?.email ?? '?').slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-2.5">
          <img src={logo} alt="" className="h-8 w-8 rounded-lg ring-1 ring-border" />
          <span className="hidden text-sm font-semibold tracking-tight text-text sm:inline">YP Trades</span>
        </div>

        <div className="mx-1 hidden h-6 w-px bg-border md:block" />

        <nav aria-label="Hauptnavigation" className="hidden md:block">
          <NavRail />
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
          <button
            onClick={onOpenPalette}
            className="hidden h-9 items-center gap-2 rounded-input border border-border bg-card px-3 text-sm text-text-dim transition-colors hover:border-border-strong hover:text-text-muted lg:flex"
          >
            <SearchIcon width={15} height={15} />
            Springen zu…
            <kbd className="num ml-2 rounded border border-border bg-bg px-1.5 py-0.5 text-[10px] text-text-dim">
              ⌘K
            </kbd>
          </button>

          <div className="hidden sm:block">
            <AccountSelector />
          </div>

          <Button onClick={newTrade} className="shrink-0">
            <PlusIcon width={16} height={16} />
            <span className="hidden sm:inline">Neuer Trade</span>
          </Button>

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Konto-Menü"
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                menuOpen
                  ? 'border-brand bg-brand/15 text-brand-bright'
                  : 'border-border bg-card text-text-muted hover:text-text'
              }`}
            >
              {initial}
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 animate-pop-in rounded-input border border-border-strong bg-raised p-1 shadow-pop"
              >
                <div className="truncate px-3 py-2 text-xs text-text-dim">{user?.email}</div>
                <div className="my-1 h-px bg-border" />
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onExport();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[7px] px-3 py-2 text-left text-sm text-text-muted transition-colors hover:bg-border/60 hover:text-text"
                >
                  <ExportIcon width={16} height={16} />
                  Export (CSV)
                </button>
                {/* Sign-out sits below a rule: it is the one destructive item here. */}
                <div className="my-1 h-px bg-border" />
                <button
                  role="menuitem"
                  onClick={() => signOut()}
                  className="flex w-full items-center gap-2.5 rounded-[7px] px-3 py-2 text-left text-sm text-loss transition-colors hover:bg-loss/12"
                >
                  <LogoutIcon width={16} height={16} />
                  Abmelden
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Below `sm` the account switcher gets its own row instead of being cut off. */}
      <div className="border-t border-border px-4 py-2 sm:hidden">
        <AccountSelector />
      </div>
    </header>
  );
}
