import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import logo from '@/assets/logo.png';
import { Button, Card, Input, useToast } from '@/components/ui';

export function LoginScreen() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname?: string } } };
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email.trim(), password, remember);
    setBusy(false);
    if (error) {
      toast('Login fehlgeschlagen. Bitte E-Mail und Passwort prüfen.', 'error');
      return;
    }
    navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src={logo} alt="YP Trades" className="mx-auto mb-4 h-16 w-16 rounded-2xl" />
          <h1 className="text-2xl font-medium text-text">YP Trades</h1>
          <p className="mt-1 text-xs uppercase tracking-wide text-text-dim">Trading Journal</p>
          <p className="mt-3 text-sm text-text-muted">Melde dich an, um fortzufahren.</p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              label="E-Mail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Passwort"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-bg accent-accent"
              />
              Angemeldet bleiben
            </label>
            <Button type="submit" disabled={busy} className="mt-1 w-full">
              {busy ? 'Anmelden…' : 'Anmelden'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
