// Registry of dashboard breakdowns. Adding a new breakdown (e.g. by weekday,
// long/short, asset) means: add a descriptor here, extend Metrics in the calc
// module, and render a small chart component — existing charts stay untouched.

export interface BreakdownDescriptor {
  key: string;
  label: string;
}

export const BREAKDOWNS: BreakdownDescriptor[] = [
  { key: 'setup', label: 'Nach Setup' },
  { key: 'rating', label: 'Nach Rating' },
];

// Palette hex mirrors the Tailwind profit/loss tokens (Recharts needs literals).
export const PROFIT = '#4ADE9E';
export const LOSS = '#F98080';
export const AXIS = '#6E7079';
