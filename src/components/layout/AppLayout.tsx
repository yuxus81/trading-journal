import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AccountSelector } from '@/features/accounts/AccountSelector';
import { useToast } from '@/components/ui';

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toast = useToast();
  // Replaced by the real ExportPanel in the export task.
  const onExport = () => toast('CSV-Export folgt in Kürze.', 'info');

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:block">
        <Sidebar onExport={onExport} />
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 animate-fade-in">
            <Sidebar
              onExport={() => {
                onExport();
                setDrawerOpen(false);
              }}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenu={() => setDrawerOpen(true)} accountSlot={<AccountSelector />} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl animate-page-fade px-4 py-6 sm:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
