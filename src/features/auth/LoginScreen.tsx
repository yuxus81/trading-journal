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
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      {/* Quiet brand glow behind the card — the only decoration in the app. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_50%_18%,rgba(139,133,234,0.13),transparent_70%)]"
      />
      <div className="relative w-full max-w-sm animate-rise-in">
        <div className="mb-8 text-center">
          <img src={logo} alt="" className="mx-auto mb-4 h-16 w-16 rounded-2xl ring-1 ring-border" />
          <h1 className="text-2xl font-semibold tracking-tight text-text">YP Trades</h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-brand-bright">Trading Journal</p>
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
