import { Routes, Route, Navigate, useLocation, type Location } from 'react-router-dom';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { TradesPage } from '@/features/trades/TradesPage';
import { TradeDetailPage } from '@/features/trades/TradeDetailPage';
import { TradeFormModal } from '@/features/trades/TradeFormModal';
import { TradeFormRoute } from '@/features/trades/TradeFormRoute';
import { CalendarPage } from '@/features/calendar/CalendarPage';
import { AccountsPage } from '@/features/accounts/AccountsPage';

export function App() {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location } | null;
  const background = state?.backgroundLocation;

  return (
    <>
      <Routes location={background ?? location}>
        <Route path="/login" element={<LoginScreen />} />

        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/trades" element={<TradesPage />} />
          <Route path="/trades/:id" element={<TradeDetailPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
        </Route>

        {/* Full-screen form for direct navigation / mobile (no background page). */}
        <Route
          path="/trades/new"
          element={
            <RequireAuth>
              <TradeFormRoute />
            </RequireAuth>
          }
        />
        <Route
          path="/trades/:id/edit"
          element={
            <RequireAuth>
              <TradeFormRoute />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Desktop: render the form as a modal over the background page. */}
      {background && (
        <Routes>
          <Route
            path="/trades/new"
            element={
              <RequireAuth>
                <TradeFormModal />
              </RequireAuth>
            }
          />
          <Route
            path="/trades/:id/edit"
            element={
              <RequireAuth>
                <TradeFormModal />
              </RequireAuth>
            }
          />
        </Routes>
      )}
    </>
  );
}
