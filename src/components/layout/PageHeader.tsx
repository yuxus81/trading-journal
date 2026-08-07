import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** One short line of context, e.g. the active account or the filter result. */
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-text-dim">{subtitle}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
