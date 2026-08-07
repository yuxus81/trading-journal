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
export const PROFIT = '#3ED598';
export const LOSS = '#F87171';
export const AXIS = '#82858D';
export const BRAND = '#8B85EA';
export const GRID = '#1F212880';
export const SURFACE = '#1B1E25';
export const BORDER_STRONG = '#343741';
