import { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AccountsIcon, CalendarIcon, DashboardIcon, TradesIcon } from '@/components/ui';

export interface NavItem {
  to: string;
  label: string;
  Icon: typeof DashboardIcon;
  /** Digit shown as the ⌘-shortcut hint. */
  key: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', Icon: DashboardIcon, key: '1' },
  { to: '/trades', label: 'Trades', Icon: TradesIcon, key: '2' },
  { to: '/calendar', label: 'Kalender', Icon: CalendarIcon, key: '3' },
  { to: '/accounts', label: 'Konten', Icon: AccountsIcon, key: '4' },
];

/**
 * Horizontal primary navigation with a single indicator that physically slides
 * between items.
 *
 * Deliberately not a left sidebar: this is a data app where tables, the
 * calendar grid and the equity chart all want horizontal room, and the boxed
 * icon-list sidebar is the most over-used shell on the web. One moving pill
 * also makes "where am I" a motion cue, not just a colour change.
 */
export function NavRail() {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);

  // Measure the active item after every route change and on resize; the
  // indicator is positioned from real geometry, so labels may differ in width.
  useLayoutEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const active = container?.querySelector<HTMLElement>('[data-active="true"]');
      if (!container || !active) return setBox(null);
      setBox({ left: active.offsetLeft, width: active.offsetWidth });
    };
    measure();
    window.addEventListener('resize', measure);
    // Fonts land after first paint and change label widths.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener('resize', measure);
  }, [location.pathname]);

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      {box && (
        <span
          aria-hidden
          className="absolute inset-y-1 rounded-input bg-brand/15 ring-1 ring-inset ring-brand/35 transition-[transform,width] duration-300 ease-out"
          style={{ width: box.width, transform: `translateX(${box.left}px)` }}
        />
      )}
      {NAV_ITEMS.map(({ to, label, Icon }) => {
        const active = location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            data-active={active}
            aria-current={active ? 'page' : undefined}
            className={`relative z-10 flex items-center gap-2 rounded-input px-3 py-2 text-sm transition-colors duration-200 ${
              active ? 'font-medium text-text' : 'text-text-muted hover:text-text'
            }`}
          >
            <Icon width={17} height={17} className={active ? 'text-brand-bright' : ''} />
            <span className="hidden lg:inline">{label}</span>
          </NavLink>
        );
      })}
    </div>
  );
}
