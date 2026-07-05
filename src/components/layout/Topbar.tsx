import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui';
import { MenuIcon, PlusIcon } from './navIcons';

interface TopbarProps {
  onMenu: () => void;
  /** Slot for the account selector (filled once accounts are wired). */
  accountSlot?: React.ReactNode;
}

export function Topbar({ onMenu, accountSlot }: TopbarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const newTrade = () => navigate('/trades/new', { state: { backgroundLocation: location } });

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-bg px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          aria-label="Menü"
          className="text-text-muted hover:text-text md:hidden"
        >
          <MenuIcon />
        </button>
        {accountSlot ?? <span className="text-sm text-text-dim">Kein Konto gewählt</span>}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={newTrade} size="sm">
          <PlusIcon width={16} height={16} />
          <span className="hidden sm:inline">Neuer Trade</span>
        </Button>
        <div className="hidden items-center gap-3 sm:flex">
          <span className="max-w-[12rem] truncate text-sm text-text-muted">{user?.email}</span>
          <button onClick={() => signOut()} className="text-sm text-text-dim hover:text-text">
            Abmelden
          </button>
        </div>
      </div>
    </header>
  );
}
