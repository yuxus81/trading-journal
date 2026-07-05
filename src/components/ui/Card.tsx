import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div className={`bg-card rounded-card border border-border p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}
