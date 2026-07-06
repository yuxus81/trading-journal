export type TagColor = 'gray' | 'red' | 'orange' | 'amber' | 'green' | 'teal' | 'blue' | 'violet' | 'pink';

export const TAG_COLOR_LIST: TagColor[] = ['gray', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'violet', 'pink'];

// Every class name below is a literal string so Tailwind's content scanner
// finds it — never build these via `${color}` string interpolation, that
// silently drops the class from the production build.
const PILL_CLASS: Record<TagColor, string> = {
  gray: 'bg-border/70 text-text-muted',
  red: 'bg-tag-red/15 text-tag-red',
  orange: 'bg-tag-orange/15 text-tag-orange',
  amber: 'bg-tag-amber/15 text-tag-amber',
  green: 'bg-tag-green/15 text-tag-green',
  teal: 'bg-tag-teal/15 text-tag-teal',
  blue: 'bg-tag-blue/15 text-tag-blue',
  violet: 'bg-tag-violet/15 text-tag-violet',
  pink: 'bg-tag-pink/15 text-tag-pink',
};

const SWATCH_CLASS: Record<TagColor, string> = {
  gray: 'bg-text-dim',
  red: 'bg-tag-red',
  orange: 'bg-tag-orange',
  amber: 'bg-tag-amber',
  green: 'bg-tag-green',
  teal: 'bg-tag-teal',
  blue: 'bg-tag-blue',
  violet: 'bg-tag-violet',
  pink: 'bg-tag-pink',
};

// Richer variant for badges that carry a fixed identity (asset, account type)
// rather than a user-chosen tag: gradient fill + colored border.
const GRADIENT_CLASS: Record<TagColor, string> = {
  gray: 'border-border bg-gradient-to-br from-border/60 to-transparent text-text-muted',
  red: 'border-tag-red/40 bg-gradient-to-br from-tag-red/20 to-tag-red/5 text-tag-red',
  orange: 'border-tag-orange/40 bg-gradient-to-br from-tag-orange/20 to-tag-orange/5 text-tag-orange',
  amber: 'border-tag-amber/40 bg-gradient-to-br from-tag-amber/20 to-tag-amber/5 text-tag-amber',
  green: 'border-tag-green/40 bg-gradient-to-br from-tag-green/20 to-tag-green/5 text-tag-green',
  teal: 'border-tag-teal/40 bg-gradient-to-br from-tag-teal/20 to-tag-teal/5 text-tag-teal',
  blue: 'border-tag-blue/40 bg-gradient-to-br from-tag-blue/20 to-tag-blue/5 text-tag-blue',
  violet: 'border-tag-violet/40 bg-gradient-to-br from-tag-violet/20 to-tag-violet/5 text-tag-violet',
  pink: 'border-tag-pink/40 bg-gradient-to-br from-tag-pink/20 to-tag-pink/5 text-tag-pink',
};

function toColor(color?: string | null): TagColor {
  return (TAG_COLOR_LIST as string[]).includes(color ?? '') ? (color as TagColor) : 'gray';
}

export function tagPillClass(color?: string | null): string {
  return PILL_CLASS[toColor(color)];
}

export function gradientBadgeClass(color?: string | null): string {
  return GRADIENT_CLASS[toColor(color)];
}

export function swatchClass(color: TagColor): string {
  return SWATCH_CLASS[color];
}

interface TagProps {
  label: string;
  color?: string | null;
}

export function Tag({ label, color }: TagProps) {
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tagPillClass(color)}`}>{label}</span>;
}
