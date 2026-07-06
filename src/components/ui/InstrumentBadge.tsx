import { assetAccent, type AssetAccent } from '@/lib/assetStyle';
import { gradientBadgeClass, type TagColor } from './Tag';

const ACCENT_TO_TAG_COLOR: Record<AssetAccent, TagColor> = {
  blue: 'blue',
  red: 'red',
  neutral: 'gray',
};

interface InstrumentBadgeProps {
  asset: string;
}

export function InstrumentBadge({ asset }: InstrumentBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${gradientBadgeClass(ACCENT_TO_TAG_COLOR[assetAccent(asset)])}`}
    >
      {asset}
    </span>
  );
}
