interface ToggleOption {
  value: string;
  label: string;
}

interface ToggleProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: [ToggleOption, ToggleOption];
}

/** A two-option segmented control (e.g. Long / Short). */
export function Toggle({ label, value, onChange, options }: ToggleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-sm text-text-muted">{label}</span>}
      <div className="inline-flex rounded-input border border-border bg-bg p-1">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`h-8 min-w-[5rem] rounded-[7px] px-4 text-sm font-medium transition-colors ${
                active ? 'bg-accent text-accent-ink' : 'text-text-muted hover:text-text'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
