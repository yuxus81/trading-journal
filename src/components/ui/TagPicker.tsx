import { useState } from 'react';
import { Tag, TAG_COLOR_LIST, swatchClass, type TagColor } from './Tag';
import { ConfirmDialog } from './ConfirmDialog';
import { PencilIcon, TrashIcon } from './icons';

interface TagOption {
  id?: string;
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
  /** Enables the per-tag edit (pencil) affordance. */
  onUpdate?: (id: string, patch: { name: string; color: string }, prevName: string) => void;
  /** Enables the delete button inside the editor. */
  onDelete?: (id: string, name: string) => void;
  placeholder?: string;
}

type Editor =
  | { kind: 'create' }
  | { kind: 'edit'; id: string; prevName: string };

function asTagColor(c: string): TagColor {
  return (TAG_COLOR_LIST as string[]).includes(c) ? (c as TagColor) : 'gray';
}

export function TagPicker({
  label,
  options,
  mode,
  value,
  onChange,
  onCreate,
  onUpdate,
  onDelete,
  placeholder,
}: TagPickerProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState<TagColor>('gray');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const toggle = (name: string) => {
    if (mode === 'single') {
      onChange(value[0] === name ? [] : [name]);
      return;
    }
    onChange(value.includes(name) ? value.filter((n) => n !== name) : [...value, name]);
  };

  const openCreate = () => {
    setDraftName('');
    setDraftColor('gray');
    setEditor({ kind: 'create' });
  };

  const openEdit = (o: TagOption) => {
    if (!o.id) return;
    setDraftName(o.name);
    setDraftColor(asTagColor(o.color));
    setEditor({ kind: 'edit', id: o.id, prevName: o.name });
  };

  const close = () => setEditor(null);

  const submit = () => {
    const name = draftName.trim();
    if (!name) return;
    if (editor?.kind === 'edit') {
      onUpdate?.(editor.id, { name, color: draftColor }, editor.prevName);
    } else {
      onCreate(name, draftColor);
      toggle(name);
    }
    close();
  };

  const editingId = editor?.kind === 'edit' ? editor.id : null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-text-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((o) => {
          const selected = value.includes(o.name);
          const canEdit = !!onUpdate && !!o.id;
          return (
            <span
              key={o.id ?? o.name}
              className={`group relative inline-flex items-center rounded-md ${
                editingId === o.id ? 'ring-1 ring-brand' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(o.name)}
                className={`rounded-md transition-opacity ${selected ? '' : 'opacity-50 hover:opacity-80'} ${
                  canEdit ? 'pr-5' : ''
                }`}
              >
                <Tag label={o.name} color={o.color} />
              </button>
              {canEdit && (
                <button
                  type="button"
                  aria-label={`${o.name} bearbeiten`}
                  onClick={() => openEdit(o)}
                  className="absolute right-0.5 grid h-4 w-4 place-items-center rounded text-text-dim opacity-0 transition-opacity hover:text-text focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <PencilIcon width={11} height={11} />
                </button>
              )}
            </span>
          );
        })}
        {!editor && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-text-dim hover:border-border-strong hover:text-text-muted"
          >
            + Neu
          </button>
        )}
      </div>

      {editor && (
        <div className="flex flex-wrap items-center gap-2 rounded-input border border-border bg-bg p-2">
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
              if (e.key === 'Escape') close();
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
          {editor.kind === 'edit' && onDelete && (
            <button
              type="button"
              aria-label="Löschen"
              onClick={() => setConfirmDelete({ id: editor.id, name: editor.prevName })}
              className="grid h-8 w-8 place-items-center rounded-md text-text-dim hover:bg-loss/10 hover:text-loss"
            >
              <TrashIcon width={15} height={15} />
            </button>
          )}
          <button type="button" onClick={close} className="text-xs text-text-dim hover:text-text-muted">
            Abbrechen
          </button>
          <button type="button" onClick={submit} className="text-xs font-medium text-text hover:text-accent">
            {editor.kind === 'edit' ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Tag löschen"
        message={
          confirmDelete
            ? `„${confirmDelete.name}" wird aus der Auswahl entfernt. Bereits erfasste Trades behalten die Bezeichnung.`
            : ''
        }
        confirmLabel="Löschen"
        danger
        onConfirm={() => {
          if (confirmDelete) {
            onDelete?.(confirmDelete.id, confirmDelete.name);
            if (value.includes(confirmDelete.name)) {
              onChange(value.filter((n) => n !== confirmDelete.name));
            }
          }
          setConfirmDelete(null);
          close();
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
