import { useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  id?: string;
  className?: string;
  disabled?: boolean;
}

const fieldClass =
  'h-10 w-full appearance-none rounded-input bg-bg border border-border px-3 pr-8 text-sm text-text ' +
  'transition-colors focus:outline-none focus:border-accent disabled:opacity-50';

export function Select({ label, value, onChange, options, id, className = '', disabled }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm text-text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${fieldClass} ${className}`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-card text-text">
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-dim">▾</span>
      </div>
    </div>
  );
}
