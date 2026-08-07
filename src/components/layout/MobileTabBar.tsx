import { NavLink, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from './NavRail';

/**
 * Bottom tab bar under `md`. A drawer hides the app's structure behind a
 * hamburger; four thumb-reachable tabs show it permanently — and this app has
 * exactly four top-level places, which is inside the 5-item limit.
 */
export function MobileTabBar() {
  const location = useLocation();

  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {NAV_ITEMS.map(({ to, label, Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className="relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 px-1 py-2"
            >
              <span
                aria-hidden
                className={`absolute inset-x-5 top-0 h-0.5 rounded-full bg-brand transition-opacity duration-200 ${
                  active ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <Icon
                width={20}
                height={20}
                className={`transition-colors ${active ? 'text-brand-bright' : 'text-text-dim'}`}
              />
              <span className={`text-[10px] ${active ? 'font-medium text-text' : 'text-text-dim'}`}>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
