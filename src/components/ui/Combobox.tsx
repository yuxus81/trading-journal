import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, ChevronDownIcon } from './icons';

interface ComboboxProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Known values offered as you type; free text outside the list is still allowed. */
  suggestions: string[];
  id?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Editable field with a painted suggestion list — the free-text sibling of
 * `Select`.
 *
 * A native `<input list>` + `<datalist>` renders the popup in the OS' own
 * chrome (light panel, system font, no rounded corners), which is the single
 * most "unfinished" looking element in this dark journal. This keeps the field
 * free-text (type any new instrument) but paints the dropdown ourselves so it
 * matches every other surface: raised panel, brand highlight, check on the
 * current value, same pop-in motion.
 */
export function Combobox({
  label,
  value,
  onChange,
  suggestions,
  id,
  className = '',
  placeholder,
  required,
  disabled,
}: ComboboxProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Filter as the user types, but keep the full list one keystroke away: an
  // exact match still shows every sibling so a wrong pick is one arrow key to fix.
  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    const exact = suggestions.some((s) => s.toLowerCase() === q);
    if (!q || exact) return suggestions;
    return suggestions.filter((s) => s.toLowerCase().includes(q));
  }, [suggestions, value]);

  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => setRect(wrapRef.current?.getBoundingClientRect() ?? null);
    measure();
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (
        !listRef.current?.contains(e.target as Node) &&
        !wrapRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [open]);

  // Keep the highlight on a valid row as the filtered set changes.
  useEffect(() => {
    setActiveIndex((i) => (i >= matches.length ? matches.length - 1 : i));
  }, [matches.length]);

  const commit = (v: string) => {
    onChange(v);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) => (matches.length ? (i + 1) % matches.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return;
      setActiveIndex((i) => (matches.length ? (i - 1 + matches.length) % matches.length : -1));
    } else if (e.key === 'Enter') {
      if (open && activeIndex >= 0 && matches[activeIndex]) {
        e.preventDefault();
        commit(matches[activeIndex]);
      } else {
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm text-text-muted">
          {label}
        </label>
      )}
      <div ref={wrapRef} className="relative">
        <input
          id={fieldId}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={open ? `${fieldId}-list` : undefined}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`h-10 w-full rounded-input border bg-bg pl-3 pr-9 text-sm text-text placeholder:text-text-dim transition-colors focus:outline-none disabled:opacity-50 ${
            open ? 'border-brand' : 'border-border hover:border-border-strong'
          } ${className}`}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Vorschläge schließen' : 'Vorschläge öffnen'}
          disabled={disabled}
          onMouseDown={(e) => {
            // Keep focus on the input; just toggle the list.
            e.preventDefault();
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
          className="absolute inset-y-0 right-0 grid w-9 place-items-center text-text-dim transition-colors hover:text-text-muted disabled:opacity-50"
        >
          <ChevronDownIcon
            width={16}
            height={16}
            className={`transition-transform duration-200 ease-out ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {open &&
        rect &&
        matches.length > 0 &&
        createPortal(
          <ul
            id={`${fieldId}-list`}
            ref={listRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: Math.min(rect.bottom + 6, window.innerHeight - 12),
              left: rect.left,
              width: Math.max(rect.width, 180),
              maxHeight: Math.max(160, window.innerHeight - rect.bottom - 24),
            }}
            className="z-[70] animate-pop-in overflow-y-auto rounded-input border border-border-strong bg-raised p-1 shadow-pop"
          >
            {matches.map((s, i) => {
              const isCurrent = s.toLowerCase() === value.trim().toLowerCase();
              return (
                <li key={s}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isCurrent}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commit(s);
                    }}
                    className={`flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-sm transition-colors ${
                      i === activeIndex ? 'bg-brand/15 text-text' : 'text-text-muted'
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{s}</span>
                    {isCurrent && <CheckIcon width={15} height={15} className="shrink-0 text-brand" />}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
}
