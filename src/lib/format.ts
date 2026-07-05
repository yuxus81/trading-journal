const SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

function symbol(currency = 'USD'): string {
  return SYMBOLS[currency] ?? '$';
}

function group(n: number): string {
  return Math.abs(Math.round(n)).toLocaleString('en-US');
}

/** Currency without a forced plus sign, e.g. `$1,250` / `-$85`. Rounded to whole units. */
export function formatCurrency(n: number, currency = 'USD'): string {
  const sign = Math.round(n) < 0 ? '-' : '';
  return `${sign}${symbol(currency)}${group(n)}`;
}

/** Signed currency with sign before the symbol, e.g. `+$1,250` / `-$85` / `$0`. */
export function formatSignedCurrency(n: number, currency = 'USD'): string {
  const r = Math.round(n);
  const sign = r > 0 ? '+' : r < 0 ? '-' : '';
  return `${sign}${symbol(currency)}${group(n)}`;
}

/** R-multiple with two decimals, e.g. `2.50R` / `-1.00R`. */
export function formatR(n: number): string {
  return `${n.toFixed(2)}R`;
}

/** Fraction (0..1) as a percentage with one decimal, e.g. `50.0%`. */
export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}

/** ISO date (YYYY-MM-DD) as DD.MM.YYYY. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
