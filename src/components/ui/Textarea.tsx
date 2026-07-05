import type { TextareaHTMLAttributes } from 'react';
import { useId } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const fieldClass =
  'w-full rounded-input bg-bg border border-border px-3 py-2 text-sm text-text leading-relaxed ' +
  'placeholder:text-text-dim transition-colors focus:outline-none focus:border-accent resize-y';

export function Textarea({ label, className = '', id, rows = 4, ...rest }: TextareaProps) {
  const autoId = useId();
  const areaId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={areaId} className="text-sm text-text-muted">
          {label}
        </label>
      )}
      <textarea id={areaId} rows={rows} className={`${fieldClass} ${className}`} {...rest} />
    </div>
  );
}
