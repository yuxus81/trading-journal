import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Lifts on hover — only for cards that are themselves clickable. */
  interactive?: boolean;
  /** Removes the default padding for cards that own their own layout. */
  bare?: boolean;
}

export function Card({ className = '', children, interactive = false, bare = false, ...rest }: CardProps) {
  return (
    <div
      className={`relative rounded-card border border-border bg-card ${bare ? '' : 'p-5'} ${
        interactive
          ? 'cursor-pointer transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lift'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

interface SectionCardProps {
  title: string;
  /** Right-aligned slot in the header, e.g. a total or a control. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Card with a titled header rule — the standard container for a chart or list. */
export function SectionCard({ title, aside, children, className = '' }: SectionCardProps) {
  return (
    <Card bare className={className}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-muted">{title}</h2>
        {aside}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}
