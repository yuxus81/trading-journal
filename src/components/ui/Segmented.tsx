import type { ReactNode } from 'react';

export type SegmentTone = 'default' | 'profit' | 'loss' | 'brand';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: ReactNode;
  tone?: SegmentTone;
}

interface SegmentedProps<T extends string> {
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  className?: string;
  size?: 'sm' | 'md';
}

// The indicator is one element that slides between slots, so the control reads
// as a single physical switch instead of three buttons repainting themselves.
const INDICATOR: Record<SegmentTone, string> = {
  default: 'bg-accent',
  brand: 'bg-brand',
  profit: 'bg-profit',
  loss: 'bg-loss',
};

const ACTIVE_TEXT: Record<SegmentTone, string> = {
  default: 'text-accent-ink',
  brand: 'text-accent-ink',
  profit: 'text-accent-ink',
  loss: 'text-accent-ink',
};

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  className = '',
  size = 'md',
}: SegmentedProps<T>) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const tone = options[index]?.tone ?? 'default';
  const h = size === 'sm' ? 'h-8' : 'h-9';

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-sm text-text-muted">{label}</span>}
      <div
        className={`relative inline-flex rounded-input border border-border bg-bg p-1 ${className}`}
        role="tablist"
      >
        <span
          aria-hidden
          className={`absolute inset-y-1 left-1 rounded-[7px] transition-transform duration-300 ease-out ${INDICATOR[tone]}`}
          style={{
            width: `calc((100% - 0.5rem) / ${options.length})`,
            transform: `translateX(${index * 100}%)`,
          }}
        />
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(o.value)}
              className={`${h} relative z-10 flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] px-4 text-sm font-medium transition-colors duration-200 ${
                active ? ACTIVE_TEXT[o.tone ?? 'default'] : 'text-text-muted hover:text-text'
              }`}
            >
              {o.icon}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
