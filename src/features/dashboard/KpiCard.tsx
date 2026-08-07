export type KpiTone = 'default' | 'profit' | 'loss';

interface KpiCardProps {
  label: string;
  value: string;
  tone?: KpiTone;
  sub?: string;
  /** 0..1 — draws a thin magnitude bar under the value. */
  fill?: number;
  index?: number;
}

const VALUE: Record<KpiTone, string> = {
  default: 'text-text',
  profit: 'text-profit',
  loss: 'text-loss',
};

const BAR: Record<KpiTone, string> = {
  default: 'bg-text-dim',
  profit: 'bg-profit',
  loss: 'bg-loss',
};

// A hairline of colour on the top edge instead of a full coloured card: the
// tile stays monochrome, the sign is still readable from across the room.
const EDGE: Record<KpiTone, string> = {
  default: 'before:bg-border-strong',
  profit: 'before:bg-profit/70',
  loss: 'before:bg-loss/70',
};

export function KpiCard({ label, value, tone = 'default', sub, fill, index = 0 }: KpiCardProps) {
  return (
    <div
      style={{ '--i': index } as React.CSSProperties}
      className={`relative animate-rise-in overflow-hidden rounded-card border border-border bg-card p-4 transition-colors duration-200 hover:border-border-strong
        before:absolute before:inset-x-0 before:top-0 before:h-px before:content-[''] ${EDGE[tone]}`}
    >
      <div className="text-[11px] uppercase tracking-[0.08em] text-text-dim">{label}</div>
      <div className={`num mt-1.5 text-lg font-medium ${VALUE[tone]}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-text-dim">{sub}</div>}
      {fill !== undefined && (
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-border/70">
          <div
            className={`h-full rounded-full transition-[width] duration-700 ease-out ${BAR[tone]}`}
            style={{ width: `${Math.max(2, Math.min(100, fill * 100))}%` }}
          />
        </div>
      )}
    </div>
  );
}
