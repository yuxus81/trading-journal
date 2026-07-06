export type AssetAccent = 'blue' | 'red' | 'neutral';

// Only instruments the owner actually trades get a fixed identity color;
// anything else (custom assets typed into the free-text field) stays neutral.
const ASSET_ACCENTS: Record<string, AssetAccent> = {
  MNQ: 'blue',
  MES: 'red',
};

export function assetAccent(asset: string): AssetAccent {
  return ASSET_ACCENTS[asset.toUpperCase()] ?? 'neutral';
}

const DOT_CLASS: Record<AssetAccent, string> = {
  blue: 'bg-tag-blue',
  red: 'bg-tag-red',
  neutral: 'bg-text-dim',
};

export function assetDotClass(asset: string): string {
  return DOT_CLASS[assetAccent(asset)];
}
