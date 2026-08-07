import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="relative flex animate-rise-in flex-col items-center justify-center gap-3 overflow-hidden rounded-card border border-dashed border-border px-6 py-16 text-center">
      {/* A faint brand glow behind the message so an empty screen still looks
          designed rather than unfinished. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(139,133,234,0.10),transparent_70%)]"
      />
      {icon && (
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-border bg-raised text-text-dim">
          {icon}
        </div>
      )}
      <h3 className="relative text-base font-semibold text-text">{title}</h3>
      {description && <p className="relative max-w-sm text-sm leading-relaxed text-text-muted">{description}</p>}
      {action && <div className="relative mt-2">{action}</div>}
    </div>
  );
}
