import { describe, it, expect } from 'vitest';
import { formatSignedCurrency, formatCurrency, formatR, formatPercent, formatDate } from '@/lib/format';

describe('formatSignedCurrency', () => {
  it('puts sign before the symbol', () => {
    expect(formatSignedCurrency(-85)).toBe('-$85');
    expect(formatSignedCurrency(1250)).toBe('+$1,250');
    expect(formatSignedCurrency(0)).toBe('$0');
  });
  it('rounds to whole numbers', () => {
    expect(formatSignedCurrency(-85.6)).toBe('-$86');
  });
  it('supports other currencies', () => {
    expect(formatSignedCurrency(-85, 'EUR')).toBe('-€85');
  });
});

describe('formatCurrency', () => {
  it('formats without a forced + sign', () => {
    expect(formatCurrency(1250)).toBe('$1,250');
    expect(formatCurrency(-85)).toBe('-$85');
    expect(formatCurrency(0)).toBe('$0');
  });
});

describe('formatR', () => {
  it('two decimals with R suffix', () => {
    expect(formatR(2.5)).toBe('2.50R');
    expect(formatR(-1)).toBe('-1.00R');
  });
});

describe('formatPercent', () => {
  it('one decimal', () => {
    expect(formatPercent(0.5)).toBe('50.0%');
  });
});

describe('formatDate', () => {
  it('renders ISO date as DD.MM.YYYY', () => {
    expect(formatDate('2026-07-05')).toBe('05.07.2026');
  });
});
