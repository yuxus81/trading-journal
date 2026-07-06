import { useState } from 'react';
import { Tag, TAG_COLOR_LIST, swatchClass, type TagColor } from './Tag';

interface TagOption {
  name: string;
  color: string;
}

interface TagPickerProps {
  label: string;
  options: TagOption[];
  mode: 'single' | 'multi';
  value: string[];
  onChange: (names: string[]) => void;
  onCreate: (name: string, color: string) => void;
  placeholder?: string;
}

export function TagPicker({ label, options, mode, value, onChange, onCreate, placeholder }: TagPickerProps) {
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState<TagColor>('gray');

  const toggle = (name: string) => {
    if (mode === 'single') {
      onChange(value[0] === name ? [] : [name]);
      return;
    }
    onChange(value.includes(name) ? value.filter((n) => n !== name) : [...value, name]);
  };

  const submitCreate = () => {
    const name = draftName.trim();
    if (!name) return;
    onCreate(name, draftColor);
    toggle(name);
    setDraftName('');
    setDraftColor('gray');
    setCreating(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-text-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((o) => {
          const selected = value.includes(o.name);
          return (
            <button
              key={o.name}
              type="button"
              onClick={() => toggle(o.name)}
              className={`rounded-md transition-opacity ${selected ? '' : 'opacity-50 hover:opacity-80'}`}
            >
              <Tag label={o.name} color={o.color} />
            </button>
          );
        })}
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-text-dim hover:border-border-strong hover:text-text-muted"
          >
            + Neu
          </button>
        )}
      </div>

      {creating && (
        <div className="flex flex-wrap items-center gap-2 rounded-input border border-border bg-bg p-2">
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitCreate();
              }
              if (e.key === 'Escape') setCreating(false);
            }}
            placeholder={placeholder ?? 'Name'}
            className="h-8 min-w-[8rem] flex-1 bg-transparent px-1 text-sm text-text placeholder:text-text-dim focus:outline-none"
          />
          <div className="flex items-center gap-1">
            {TAG_COLOR_LIST.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDraftColor(c)}
                aria-label={c}
                className={`h-5 w-5 rounded-full ${swatchClass(c)} ${draftColor === c ? 'ring-2 ring-text ring-offset-2 ring-offset-bg' : ''}`}
              />
            ))}
          </div>
          <button type="button" onClick={submitCreate} className="text-xs font-medium text-text hover:text-accent">
            Erstellen
          </button>
        </div>
      )}
    </div>
  );
}
