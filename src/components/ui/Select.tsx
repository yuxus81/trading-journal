import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, ChevronDownIcon } from './icons';

export interface SelectOption {
  value: string;
  label: string;
  /** Optional secondary line, e.g. a currency or a count. */
  hint?: string;
  /** Optional leading dot, e.g. `bg-tag-green`. */
  dotClass?: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  id?: string;
  className?: string;
  disabled?: boolean;
  /** Compact trigger for toolbars (h-9 instead of h-10). */
  compact?: boolean;
}

/**
 * Custom listbox instead of a native `<select>`.
 *
 * A native select renders in the OS' own chrome — light popup, system font,
 * no dot colours — which is the single most "unfinished" looking element in a
 * dark app. This keeps full keyboard semantics (roving focus, type-ahead-free
 * arrow navigation, Escape, Home/End) but paints the list ourselves.
 */
export function Select({
  label,
  value,
  onChange,
  options,
  id,
  className = '',
  disabled,
  compact = false,
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const selected = options.find((o) => o.value === value);

  // Measure after paint so the popover lands on the trigger, and re-measure
  // on scroll/resize instead of leaving it floating at a stale position.
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => setRect(triggerRef.current?.getBoundingClientRect() ?? null);
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
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    const onDocDown = (e: MouseEvent) => {
      if (
        !listRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [open, options, value]);

  const commit = (v: string) => {
    onChange(v);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt) commit(opt.value);
    }
  };

  const height = compact ? 'h-9' : 'h-10';

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm text-text-muted">
          {label}
        </label>
      )}
      <button
        id={selectId}
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? `${selectId}-list` : undefined}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`${height} flex w-full items-center gap-2 rounded-input border bg-bg px-3 text-left text-sm text-text transition-colors disabled:opacity-50 ${
          open ? 'border-brand' : 'border-border hover:border-border-strong'
        } ${className}`}
      >
        {selected?.dotClass && <span className={`h-2 w-2 shrink-0 rounded-full ${selected.dotClass}`} />}
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? '—'}</span>
        <ChevronDownIcon
          width={16}
          height={16}
          className={`shrink-0 text-text-dim transition-transform duration-200 ease-out ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open &&
        rect &&
        createPortal(
          <ul
            id={`${selectId}-list`}
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            onKeyDown={onKeyDown}
            style={{
              position: 'fixed',
              top: Math.min(rect.bottom + 6, window.innerHeight - 12),
              left: rect.left,
              width: Math.max(rect.width, 180),
              maxHeight: Math.max(160, window.innerHeight - rect.bottom - 24),
            }}
            className="z-[70] animate-pop-in overflow-y-auto rounded-input border border-border-strong bg-raised p-1 shadow-pop"
          >
            {options.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => commit(o.value)}
                    className={`flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-sm transition-colors ${
                      i === activeIndex ? 'bg-brand/15 text-text' : 'text-text-muted'
                    }`}
                  >
                    {o.dotClass && <span className={`h-2 w-2 shrink-0 rounded-full ${o.dotClass}`} />}
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {o.hint && <span className="num shrink-0 text-xs text-text-dim">{o.hint}</span>}
                    {isSelected && <CheckIcon width={15} height={15} className="shrink-0 text-brand" />}
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
