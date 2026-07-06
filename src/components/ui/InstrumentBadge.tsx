import { assetAccent, type AssetAccent } from '@/lib/assetStyle';

// Every class name below is a literal string so Tailwind's content scanner
// finds it — never build these via `${accent}` string interpolation.
const BADGE_CLASS: Record<AssetAccent, string> = {
  blue: 'border-tag-blue/40 bg-gradient-to-br from-tag-blue/20 to-tag-blue/5 text-tag-blue',
  red: 'border-tag-red/40 bg-gradient-to-br from-tag-red/20 to-tag-red/5 text-tag-red',
  neutral: 'border-border bg-gradient-to-br from-border/60 to-transparent text-text-muted',
};

interface InstrumentBadgeProps {
  asset: string;
}

export function InstrumentBadge({ asset }: InstrumentBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${BADGE_CLASS[assetAccent(asset)]}`}
    >
      {asset}
    </span>
  );
}
