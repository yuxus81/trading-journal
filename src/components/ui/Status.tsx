export type StatusTone = 'active' | 'idle' | 'profit' | 'loss' | 'neutral';

const DOT: Record<StatusTone, string> = {
  active: 'bg-profit',
  idle: 'bg-text-dim',
  profit: 'bg-profit',
  loss: 'bg-loss',
  neutral: 'bg-text-dim',
};

const PILL: Record<StatusTone, string> = {
  active: 'border-profit/35 bg-profit/12 text-profit',
  idle: 'border-border bg-border/40 text-text-dim',
  profit: 'border-profit/35 bg-profit/12 text-profit',
  loss: 'border-loss/35 bg-loss/12 text-loss',
  neutral: 'border-border bg-border/40 text-text-muted',
};

interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
  /** Breathing dot — only for a state that is genuinely live right now. */
  pulse?: boolean;
}

/**
 * State that the user must read at a glance (account active / paused, trade
 * won / lost) gets colour AND a word — never colour alone, so it survives
 * colour-blindness and greyscale printing.
 */
export function StatusBadge({ tone, label, pulse = false }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${PILL[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[tone]} ${pulse ? 'animate-pulse-dot' : ''}`} />
      {label}
    </span>
  );
}

export function StatusDot({ tone, pulse = false }: { tone: StatusTone; pulse?: boolean }) {
  return <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[tone]} ${pulse ? 'animate-pulse-dot' : ''}`} />;
}
