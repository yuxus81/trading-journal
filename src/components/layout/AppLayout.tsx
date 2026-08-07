import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TopBar } from './TopBar';
import { MobileTabBar } from './MobileTabBar';
import { CommandPalette } from './CommandPalette';
import { NAV_ITEMS } from './NavRail';
import { ExportPanel } from '@/features/export/ExportPanel';

export function AppLayout() {
  const [exportOpen, setExportOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ⌘K opens the palette; ⌘1–4 jump straight to a section. Both ignore
  // keystrokes while the user is typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const target = e.target as HTMLElement | null;
      const typing = target?.matches('input, textarea, [contenteditable="true"]');
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (typing) return;
      const item = NAV_ITEMS.find((n) => n.key === e.key);
      if (item) {
        e.preventDefault();
        navigate(item.to);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar onExport={() => setExportOpen(true)} onOpenPalette={() => setPaletteOpen(true)} />

      <main className="flex-1">
        {/* `key` restarts the entrance animation on every route change, so a
            page arrives instead of blinking into place. */}
        <div
          key={location.pathname}
          className="mx-auto max-w-[1400px] animate-page-fade px-4 pb-24 pt-6 sm:px-6 md:pb-10"
        >
          <Outlet />
        </div>
      </main>

      <MobileTabBar />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onExport={() => setExportOpen(true)}
      />
      <ExportPanel open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
