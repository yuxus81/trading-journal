import { useId } from 'react';

interface SparklineProps {
  values: number[];
  /** Line colour — defaults to the P&L colour of the last value's direction. */
  tone?: 'profit' | 'loss' | 'brand';
  className?: string;
  height?: number;
}

const STROKE = { profit: '#3ED598', loss: '#F87171', brand: '#8B85EA' };

/**
 * Tiny inline trend line for a KPI tile. Deliberately axis-free: it shows the
 * shape of the number's history, and the exact values live in the big chart.
 */
export function Sparkline({ values, tone, className = '', height = 36 }: SparklineProps) {
  const gradientId = useId();
  if (values.length < 2) return null;

  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? first;
  const color = STROKE[tone ?? (last >= first ? 'profit' : 'loss')];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 100;
  const h = height;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={`w-full ${className}`}
      style={{ height }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
