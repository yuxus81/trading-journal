export type KpiTone = 'default' | 'profit' | 'loss';

interface KpiCardProps {
  label: string;
  value: string;
  tone?: KpiTone;
  sub?: string;
}

const toneClass: Record<KpiTone, string> = {
  default: 'text-text',
  profit: 'text-profit',
  loss: 'text-loss',
};

export function KpiCard({ label, value, tone = 'default', sub }: KpiCardProps) {
  return (
    <div className="rounded-card border border-border bg-card p-4">
      <div className="text-xs text-text-muted">{label}</div>
      <div className={`mt-1.5 text-lg font-medium ${toneClass[tone]}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-text-dim">{sub}</div>}
    </div>
  );
}
