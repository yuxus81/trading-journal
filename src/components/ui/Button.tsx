import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'brand' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-input font-medium ' +
  'transition-[background-color,color,border-color,transform,box-shadow] duration-150 ease-out ' +
  'active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-white shadow-lift',
  brand: 'bg-brand text-accent-ink hover:bg-brand-bright',
  ghost: 'bg-transparent text-text-muted hover:bg-border/60 hover:text-text',
  outline: 'border border-border bg-transparent text-text-muted hover:border-border-strong hover:text-text',
  danger: 'bg-transparent text-loss hover:bg-loss/12',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
