import { useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { useTrade, useTradeImages, useDeleteTrade } from './useTrades';
import { useSetups } from './useSetups';
import { useNewsTags } from './useNewsTags';
import { useWeekEvents } from './useWeekEvents';
import { TradeImageGallery } from './TradeImageGallery';
import { useAccounts } from '@/features/accounts/useAccounts';
import { removeImages } from '@/api/storage';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Button,
  ChevronLeftIcon,
  ConfirmDialog,
  EmptyState,
  InstrumentBadge,
  SectionCard,
  Spinner,
  StarRating,
  Tag,
  useToast,
} from '@/components/ui';
import { formatSignedCurrency, formatDate } from '@/lib/format';
import type { ReactNode } from 'react';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-dim">{label}</div>
      <div className="mt-1.5 text-sm text-text">{children}</div>
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
  const { data: setups } = useSetups();
  const { data: newsTags } = useNewsTags();
  const { data: weekEventTags } = useWeekEvents();
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
  const win = trade.pnl > 0;
  const flat = trade.pnl === 0;

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/trades"
            className="inline-flex items-center gap-1 text-sm text-text-dim transition-colors hover:text-text"
          >
            <ChevronLeftIcon width={15} height={15} />
            Trades
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <InstrumentBadge asset={trade.asset} />
            <h1 className="num text-xl font-semibold text-text">
              {formatDate(trade.trade_date)}
              {trade.exec_time && <span className="text-text-muted"> · {trade.exec_time.slice(0, 5)}</span>}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            Bearbeiten
          </Button>
          <Button variant="danger" onClick={() => setConfirm(true)}>
            Löschen
          </Button>
        </div>
      </div>

      {/* The outcome banner: the trade's result is the headline, not a field. */}
      <div className="relative animate-rise-in overflow-hidden rounded-card border border-border bg-card p-5">
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${
            flat
              ? ''
              : win
                ? 'bg-[radial-gradient(120%_100%_at_0%_0%,rgba(62,213,152,0.10),transparent_60%)]'
                : 'bg-[radial-gradient(120%_100%_at_0%_0%,rgba(248,113,113,0.10),transparent_60%)]'
          }`}
        />
        <div className="relative">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-dim">Ergebnis</div>
          <div
            className={`num mt-1 text-[2.2rem] font-semibold leading-none ${
              flat ? 'text-text-muted' : win ? 'text-profit' : 'text-loss'
            }`}
          >
            {formatSignedCurrency(trade.pnl, currency)}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            <Field label="Richtung">
              {trade.direction ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${
                    trade.direction === 'long' ? 'bg-profit/12 text-profit' : 'bg-loss/12 text-loss'
                  }`}
                >
                  {trade.direction === 'long' ? (
                    <ArrowUpIcon width={12} height={12} />
                  ) : (
                    <ArrowDownIcon width={12} height={12} />
                  )}
                  {trade.direction === 'long' ? 'Long' : 'Short'}
                </span>
              ) : (
                '—'
              )}
            </Field>
            <Field label="R-Multiple">
              <span className="num">{trade.r_multiple != null ? `${trade.r_multiple}R` : '—'}</span>
            </Field>
            <Field label="Setup">
              {trade.setup ? (
                <Tag label={trade.setup} color={setups?.find((s) => s.name === trade.setup)?.color} />
              ) : (
                '—'
              )}
            </Field>
            <Field label="Confidence">
              <span className="num">{trade.confidence != null ? `${trade.confidence}/10` : '—'}</span>
            </Field>
            <Field label="Bewertung">
              {trade.rating ? <StarRating value={trade.rating} readOnly size="sm" /> : '—'}
            </Field>
            <Field label="News">
              {trade.news.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {trade.news.map((n) => (
                    <Tag key={n} label={n} color={newsTags?.find((x) => x.name === n)?.color} />
                  ))}
                </div>
              ) : (
                '—'
              )}
            </Field>
            <Field label="Wochen-Events">
              {trade.week_events.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {trade.week_events.map((n) => (
                    <Tag key={n} label={n} color={weekEventTags?.find((x) => x.name === n)?.color} />
                  ))}
                </div>
              ) : (
                '—'
              )}
            </Field>
          </div>
        </div>
      </div>

      {trade.notes && (
        <SectionCard title="Notizen">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">{trade.notes}</p>
        </SectionCard>
      )}

      <SectionCard title="Screenshots">
        <TradeImageGallery tradeId={trade.id} />
      </SectionCard>

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
