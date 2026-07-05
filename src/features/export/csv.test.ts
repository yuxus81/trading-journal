import { describe, it, expect } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('emits just the header row for no data', () => {
    expect(toCsv([], ['a', 'b'])).toBe('a,b');
  });

  it('escapes commas, quotes, and newlines', () => {
    const rows = [{ a: 'x,y', b: 'he said "hi"', c: 'line1\nline2' }];
    expect(toCsv(rows, ['a', 'b', 'c'])).toBe('a,b,c\n"x,y","he said ""hi""","line1\nline2"');
  });

  it('renders null/undefined as empty cells', () => {
    expect(toCsv([{ a: null, b: undefined }], ['a', 'b'])).toBe('a,b\n,');
  });

  it('only includes the requested columns in order', () => {
    expect(toCsv([{ a: 1, b: 2, c: 3 }], ['c', 'a'])).toBe('c,a\n3,1');
  });
});
