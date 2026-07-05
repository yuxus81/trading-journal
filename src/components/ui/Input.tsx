import type { InputHTMLAttributes } from 'react';
import { useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const fieldClass =
  'h-10 w-full rounded-input bg-bg border border-border px-3 text-sm text-text ' +
  'placeholder:text-text-dim transition-colors focus:outline-none focus:border-accent ' +
  'disabled:opacity-50';

export function Input({ label, error, className = '', id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm text-text-muted">
          {label}
        </label>
      )}
      <input id={inputId} className={`${fieldClass} ${error ? 'border-loss' : ''} ${className}`} {...rest} />
      {error && <span className="text-xs text-loss">{error}</span>}
    </div>
  );
}
