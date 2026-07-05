import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { TradesPage } from '@/features/trades/TradesPage';
import { TradeDetailPage } from '@/features/trades/TradeDetailPage';
import { CalendarPage } from '@/features/calendar/CalendarPage';
import { AccountsPage } from '@/features/accounts/AccountsPage';

export function App() {
  return (
    <Routes>
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
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
