import { useState, type KeyboardEvent } from 'react';

interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

export function TagInput({ label, value, onChange, placeholder, suggestions = [] }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) {
      setDraft('');
      return;
    }
    onChange([...value, tag]);
    setDraft('');
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      remove(value[value.length - 1]!);
    }
  };

  const openSuggestions = suggestions.filter((s) => !value.includes(s));

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-sm text-text-muted">{label}</span>}
      <div className="flex flex-wrap items-center gap-1.5 rounded-input border border-border bg-bg px-2 py-2 focus-within:border-accent">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-border/70 px-2 py-1 text-xs text-text"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              aria-label={`${tag} entfernen`}
              className="text-text-dim hover:text-text"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[6rem] flex-1 bg-transparent px-1 text-sm text-text placeholder:text-text-dim focus:outline-none"
        />
      </div>
      {openSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {openSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-md border border-border px-2 py-1 text-xs text-text-muted transition-colors hover:border-accent hover:text-text"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
