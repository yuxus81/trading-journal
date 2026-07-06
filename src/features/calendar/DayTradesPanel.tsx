import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { InstrumentBadge, Tag } from '@/components/ui';
import { useSetups } from '@/features/trades/useSetups';
import { useTradeImages } from '@/features/trades/useTrades';
import { useSignedUrls } from '@/features/trades/useSignedUrls';
import { formatCurrency, formatDate, formatSignedCurrency } from '@/lib/format';
import type { Trade } from '@/types/db';

function TradeThumb({ tradeId }: { tradeId: string }) {
  const { data: images } = useTradeImages(tradeId);
  const path = images?.[0]?.storage_path;
  const urlMap = useSignedUrls(path ? [path] : []);
  const url = path ? urlMap[path] : undefined;
  if (!url) return null;
  return <img src={url} alt="" className="h-10 w-10 shrink-0 rounded-md border border-border object-cover" />;
}

interface DayTradesPanelProps {
  day: string;
  trades: Trade[];
  currency: string;
  onClose: () => void;
}

export function DayTradesPanel({ day, trades, currency, onClose }: DayTradesPanelProps) {
  const navigate = useNavigate();
  const { data: setups } = useSetups();
  const setupColor = (name: string) => setups?.find((s) => s.name === name)?.color;
  const total = trades.reduce((s, t) => s + t.pnl, 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 animate-fade-in bg-black/60" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Trades am ${formatDate(day)}`}
        className="fixed inset-y-0 right-0 z-10 flex w-full max-w-md animate-slide-in-right flex-col border-l border-border-strong bg-card"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-medium text-text">{formatDate(day)}</h2>
            <span className={`text-sm font-medium ${total > 0 ? 'text-profit' : total < 0 ? 'text-loss' : 'text-text-muted'}`}>
              {formatSignedCurrency(total, currency)}
            </span>
          </div>
          <button onClick={onClose} aria-label="Schließen" className="text-text-dim transition-colors hover:text-text">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {trades.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-dim">Keine Trades an diesem Tag.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {trades.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/trades/${t.id}`)}
                  className="flex items-center gap-3 rounded-card border border-border p-3 text-left transition-colors hover:border-border-strong"
                >
                  <TradeThumb tradeId={t.id} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <InstrumentBadge asset={t.asset} />
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      {t.exec_time && <span>{t.exec_time.slice(0, 5)}</span>}
                      {t.direction && (
                        <span className={t.direction === 'long' ? 'text-profit' : 'text-loss'}>
                          {t.direction === 'long' ? 'Long' : 'Short'}
                        </span>
                      )}
                      {t.setup && <Tag label={t.setup} color={setupColor(t.setup)} />}
                    </div>
                  </div>
                  <span className={`shrink-0 text-sm font-medium ${t.pnl > 0 ? 'text-profit' : t.pnl < 0 ? 'text-loss' : 'text-text-muted'}`}>
                    {formatCurrency(t.pnl, currency)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
