import { NavLink } from 'react-router-dom';
import type { ComponentType, SVGProps } from 'react';
import { DashboardIcon, TradesIcon, CalendarIcon, AccountsIcon, ExportIcon } from './navIcons';

interface NavItem {
  to: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const items: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { to: '/trades', label: 'Trades', Icon: TradesIcon },
  { to: '/calendar', label: 'Kalender', Icon: CalendarIcon },
  { to: '/accounts', label: 'Konten', Icon: AccountsIcon },
];

interface SidebarProps {
  onExport: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ onExport, onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full w-56 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        <span className="text-sm font-medium text-text">Trading Journal</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-input px-3 py-2 text-sm transition-colors ${
                isActive ? 'bg-accent/12 text-text' : 'text-text-muted hover:bg-border/50 hover:text-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={isActive ? 'text-accent' : ''} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-3">
        <button
          onClick={onExport}
          className="flex w-full items-center gap-3 rounded-input px-3 py-2 text-sm text-text-muted transition-colors hover:bg-border/50 hover:text-text"
        >
          <ExportIcon />
          Export (CSV)
        </button>
      </div>
    </div>
  );
}
