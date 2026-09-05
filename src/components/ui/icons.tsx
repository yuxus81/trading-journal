import type { SVGProps } from 'react';

// One icon family for the whole app: 24-grid, 1.6 stroke, round caps.
// Never use a unicode glyph (▾ ✕ ★ ‹ ›) as an icon — they inherit the text
// font, sit off the baseline and cannot be sized or animated consistently.
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

type Props = SVGProps<SVGSVGElement>;

/* ── Navigation ─────────────────────────────────────────────── */

export function DashboardIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function TradesIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 18h16" />
      <path d="M4 14l4-4 3 3 6-7" />
      <path d="M17 6h3v3" />
    </svg>
  );
}

export function CalendarIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  );
}

export function AccountsIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 7h18v12H3z" />
      <path d="M3 11h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

export function ExportIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

export function MenuIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

/* ── Actions & controls ─────────────────────────────────────── */

export function PlusIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CloseIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function CheckIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

export function ChevronDownIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9.5l6 6 6-6" />
    </svg>
  );
}

export function ChevronLeftIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M14.5 5l-7 7 7 7" />
    </svg>
  );
}

export function ChevronRightIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 5l7 7-7 7" />
    </svg>
  );
}

export function SortIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M8 4v16M8 20l-3.5-3.5M8 20l3.5-3.5" />
      <path d="M16 20V4M16 4l-3.5 3.5M16 4l3.5 3.5" />
    </svg>
  );
}

export function ArrowUpIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 19V5M12 5l-6 6M12 5l6 6" />
    </svg>
  );
}

export function ArrowDownIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M12 19l-6-6M12 19l6-6" />
    </svg>
  );
}

export function FilterIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

export function SearchIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  );
}

export function LogoutIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 8l-4 4 4 4M6 12h11" />
    </svg>
  );
}

export function StarIcon({ filled, ...props }: Props & { filled?: boolean }) {
  return (
    <svg {...base} fill={filled ? 'currentColor' : 'none'} {...props}>
      <path d="M12 3.6l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.99l-5.25 2.76 1-5.85L3.5 9.75l5.9-.85z" />
    </svg>
  );
}

export function TrendUpIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 16l5.5-5.5 3.5 3.5L20 7" />
      <path d="M16 7h4v4" />
    </svg>
  );
}

export function TrendDownIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8l5.5 5.5L13 10l7 7" />
      <path d="M16 17h4v-4" />
    </svg>
  );
}

export function PencilIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.83l-1.17-1.17a2 2 0 0 0-2.83 0L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

export function TrashIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
      <path d="M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
