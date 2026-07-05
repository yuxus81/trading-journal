import { useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { useTrade, useTradeImages, useDeleteTrade } from './useTrades';
import { TradeImageGallery } from './TradeImageGallery';
import { useAccounts } from '@/features/accounts/useAccounts';
import { removeImages } from '@/api/storage';
import { Button, Card, ConfirmDialog, EmptyState, Spinner, StarRating, useToast } from '@/components/ui';
import { formatSignedCurrency, formatDate } from '@/lib/format';
import type { ReactNode } from 'react';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-text-dim">{label}</div>
      <div className="mt-1 text-sm text-text">{children}</div>
    </div>
  );
}

export function TradeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { data: trade, isLoading } = useTrade(id);
  const { data: images } = useTradeImages(id);
  const { data: accounts } = useAccounts();
  const del = useDeleteTrade();
  const [confirm, setConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (!trade) {
    return (
      <EmptyState
        title="Trade nicht gefunden"
        action={<Button onClick={() => navigate('/trades')}>Zur Trade-Liste</Button>}
      />
    );
  }

  const account = accounts?.find((a) => a.id === trade.account_id);
  const currency = account?.currency ?? 'USD';
  const pnlColor = trade.pnl > 0 ? 'text-profit' : trade.pnl < 0 ? 'text-loss' : 'text-text-muted';

  const onEdit = () => navigate(`/trades/${trade.id}/edit`, { state: { backgroundLocation: location } });

  const onDelete = async () => {
    try {
      await removeImages((images ?? []).map((i) => i.storage_path));
      await del.mutateAsync(trade.id);
      toast('Trade gelöscht.', 'success');
      navigate('/trades');
    } catch {
      toast('Löschen fehlgeschlagen.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link to="/trades" className="text-sm text-text-dim hover:text-text">
            ← Trades
          </Link>
          <h1 className="mt-1 text-xl font-medium text-text">
            {trade.asset} · {formatDate(trade.trade_date)}
            {trade.exec_time && <span className="text-text-muted"> · {trade.exec_time.slice(0, 5)}</span>}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onEdit}>
            Bearbeiten
          </Button>
          <Button variant="danger" onClick={() => setConfirm(true)}>
            Löschen
          </Button>
        </div>
      </div>

      <Card>
        <div className="text-xs text-text-dim">PnL</div>
        <div className={`text-3xl font-medium ${pnlColor}`}>{formatSignedCurrency(trade.pnl, currency)}</div>
        <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Field label="Richtung">
            {trade.direction === 'long' ? 'Long' : trade.direction === 'short' ? 'Short' : '—'}
          </Field>
          <Field label="R-Multiple">{trade.r_multiple != null ? `${trade.r_multiple}R` : '—'}</Field>
          <Field label="Setup">{trade.setup ?? '—'}</Field>
          <Field label="Confidence">{trade.confidence != null ? `${trade.confidence}/10` : '—'}</Field>
          <Field label="Bewertung">
            {trade.rating ? <StarRating value={trade.rating} readOnly size="sm" /> : '—'}
          </Field>
          <Field label="News des Tages">
            {trade.news.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {trade.news.map((n) => (
                  <span key={n} className="rounded bg-border/70 px-1.5 py-0.5 text-xs text-text-muted">
                    {n}
                  </span>
                ))}
              </div>
            ) : (
              '—'
            )}
          </Field>
        </div>
      </Card>

      {trade.notes && (
        <Card>
          <div className="text-xs text-text-dim">Notizen</div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text">{trade.notes}</p>
        </Card>
      )}

      <Card>
        <div className="mb-3 text-xs text-text-dim">Screenshots</div>
        <TradeImageGallery tradeId={trade.id} />
      </Card>

      <ConfirmDialog
        open={confirm}
        title="Trade löschen?"
        message="Der Trade und seine Screenshots werden dauerhaft entfernt."
        confirmLabel="Löschen"
        danger
        onConfirm={onDelete}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
