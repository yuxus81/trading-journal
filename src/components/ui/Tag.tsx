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

function toColor(color?: string | null): TagColor {
  return (TAG_COLOR_LIST as string[]).includes(color ?? '') ? (color as TagColor) : 'gray';
}

export function tagPillClass(color?: string | null): string {
  return PILL_CLASS[toColor(color)];
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
