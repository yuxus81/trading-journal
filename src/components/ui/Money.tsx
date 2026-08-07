import { formatCurrency, formatSignedCurrency } from '@/lib/format';
import { TrendDownIcon, TrendUpIcon } from './icons';

/** Text colour for a money value — the only place P&L colour is decided. */
export function pnlToneClass(n: number): string {
  return n > 0 ? 'text-profit' : n < 0 ? 'text-loss' : 'text-text-muted';
}

interface MoneyProps {
  value: number;
  currency: string;
  /** Show an explicit + for gains. */
  signed?: boolean;
  /** Colour by sign. */
  tone?: boolean;
  /** Small trend arrow next to the number. */
  arrow?: boolean;
  className?: string;
}

export function Money({ value, currency, signed = false, tone = true, arrow = false, className = '' }: MoneyProps) {
  const text = signed ? formatSignedCurrency(value, currency) : formatCurrency(value, currency);
  const Icon = value >= 0 ? TrendUpIcon : TrendDownIcon;
  return (
    <span className={`num inline-flex items-center gap-1 ${tone ? pnlToneClass(value) : ''} ${className}`}>
      {arrow && value !== 0 && <Icon width={14} height={14} />}
      {text}
    </span>
  );
}
