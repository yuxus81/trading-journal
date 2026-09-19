import { useMemo, useState } from 'react';
import { Tag, TAG_COLOR_LIST, swatchClass, type TagColor } from './Tag';
import { ConfirmDialog } from './ConfirmDialog';
import { IMPACT_LABEL, NEWS_IMPACTS, joinNews, splitNews, tagBaseColor, tagFolders, withFolders, type NewsImpact } from '@/lib/newsImpact';
import { ChevronDownIcon, PencilIcon, SearchIcon, TrashIcon } from './icons';

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
  /**
   * Splits options into two groups: those with a unique leading "HH:MM" in
   * their name (shown first, sorted by time) and everything else — no time,
   * or a time shared by several tags — collapsed under "Sonstiges" and
   * sorted alphabetically.
   */
  groupByTime?: boolean;
  /** Shows a small filter input above the tags once there are enough to search. */
  searchable?: boolean;
  /** Each tag can be picked as a red or an orange folder: hovering fans out both choices. */
  impactFolders?: boolean;
}

type Editor =
  | { kind: 'create' }
  | { kind: 'edit'; id: string; prevName: string };

function asTagColor(c: string): TagColor {
  const base = tagBaseColor(c);
  return (TAG_COLOR_LIST as string[]).includes(base) ? (base as TagColor) : 'gray';
}

const FOLDER_ON: Record<NewsImpact, string> = {
  red: 'bg-tag-red text-white',
  orange: 'bg-tag-orange text-white',
};
const FOLDER_OFF: Record<NewsImpact, string> = {
  red: 'bg-tag-red/15 text-tag-red hover:bg-tag-red/25',
  orange: 'bg-tag-orange/15 text-tag-orange hover:bg-tag-orange/25',
};

const NEWS_COLORS: TagColor[] = ['gray', 'orange', 'red'];

const TIME_RE = /\b([01]?\d|2[0-3]):([0-5]\d)\b/;
const NO_NEWS_RE = /no\s*news|keine\s*news/i;

function extractTime(name: string): string | null {
  const m = name.match(TIME_RE);
  if (!m) return null;
  return `${m[1]!.padStart(2, '0')}:${m[2]}`;
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
  groupByTime,
  searchable,
  impactFolders,
}: TagPickerProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState<TagColor>('gray');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState('');
  const [othersOpen, setOthersOpen] = useState(false);
  const [draftFolders, setDraftFolders] = useState<NewsImpact[]>([]);
  const [fanOpen, setFanOpen] = useState<string | null>(null);
  const baseOf = (entry: string) => (impactFolders ? splitNews(entry).name : entry);

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
    setDraftFolders([]);
    setEditor({ kind: 'create' });
  };

  const openEdit = (o: TagOption) => {
    if (!o.id) return;
    setDraftName(o.name);
    setDraftColor(asTagColor(o.color));
    setDraftFolders(tagFolders(o.color));
    setEditor({ kind: 'edit', id: o.id, prevName: o.name });
  };

  const close = () => setEditor(null);

  const submit = () => {
    const name = draftName.trim();
    if (!name) return;
    const color = impactFolders ? withFolders(draftColor, draftFolders) : draftColor;
    if (editor?.kind === 'edit') {
      onUpdate?.(editor.id, { name, color }, editor.prevName);
    } else {
      onCreate(name, color);
      toggle(name);
    }
    close();
  };

  const editingId = editor?.kind === 'edit' ? editor.id : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options;
  }, [options, search]);

  const { clusters, noNews, others } = useMemo(() => {
    if (!groupByTime) return { clusters: [] as { time: string; options: TagOption[] }[], noNews: [] as TagOption[], others: filtered };

    const noNewsTags = filtered.filter((o) => NO_NEWS_RE.test(o.name)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const rest = filtered.filter((o) => !NO_NEWS_RE.test(o.name));

    const timeCounts = new Map<string, number>();
    rest.forEach((o) => {
      const t = extractTime(o.name);
      if (t) timeCounts.set(t, (timeCounts.get(t) ?? 0) + 1);
    });

    const clusterTimes = [...timeCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([t]) => t)
      .sort();
    const clusteredTags = clusterTimes.map((time) => ({
      time,
      options: rest
        .filter((o) => extractTime(o.name) === time)
        .sort((a, b) => a.name.localeCompare(b.name, 'de')),
    }));

    const rest2 = rest
      .filter((o) => {
        const t = extractTime(o.name);
        return t === null || timeCounts.get(t) === 1;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));

    return { clusters: clusteredTags, noNews: noNewsTags, others: rest2 };
  }, [filtered, groupByTime]);

  const othersHasSelected = others.some((o) => value.some((v) => baseOf(v) === o.name));

  const toggleEntry = (entry: string) =>
    onChange(value.includes(entry) ? value.filter((v) => v !== entry) : [...value, entry]);

  const renderImpactTag = (o: TagOption) => {
    const entries = value.filter((v) => splitNews(v).name === o.name);
    const impacts = entries.map((e) => splitNews(e).impact);
    const active = NEWS_IMPACTS.filter((i) => impacts.includes(i));
    const hasPlain = impacts.includes(null);
    const selected = entries.length > 0;
    const open = fanOpen === o.name;
    const canEdit = !!onUpdate && !!o.id;
    const folders = tagFolders(o.color);
    const fanFolders = NEWS_IMPACTS.filter((i) => folders.includes(i) || active.includes(i));
    const shownColor = active[0] ?? tagBaseColor(o.color);
    return (
      <span
        key={o.id ?? o.name}
        data-open={open}
        onMouseLeave={() => setFanOpen((c) => (c === o.name ? null : c))}
        className={`group relative inline-flex items-center rounded-md ${editingId === o.id ? 'ring-1 ring-brand' : ''}`}
      >
        <button
          type="button"
          onClick={() => {
            if (fanFolders.length === 0) {
              onChange(selected ? value.filter((v) => splitNews(v).name !== o.name) : [...value, o.name]);
              return;
            }
            if (hasPlain) onChange(value.filter((v) => v !== o.name));
            setFanOpen(open ? null : o.name);
          }}
          className={`inline-flex items-center gap-1 rounded-md transition-opacity ${selected ? '' : 'opacity-50 hover:opacity-80'} ${canEdit ? 'pr-5' : ''}`}
        >
          <Tag label={o.name} color={shownColor} />
          {fanFolders.length > 0 && (
            <span className="absolute -right-1 -top-1 flex gap-px">
              {fanFolders.map((i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${swatchClass(i)} ${active.includes(i) ? '' : 'opacity-60'}`}
                />
              ))}
            </span>
          )}
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
        {fanFolders.length > 0 && (
        <span className="absolute left-0 top-full z-20 hidden pt-1 group-hover:block group-focus-within:block group-data-[open=true]:block">
          <span className="flex gap-1.5 rounded-lg border border-border bg-bg p-1.5 shadow-lg">
            {fanFolders.map((imp, idx) => {
              const on = active.includes(imp);
              return (
                <button
                  key={imp}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleEntry(joinNews(o.name, imp))}
                  style={{ animationDelay: `${idx * 70}ms` }}
                  className={`animate-folder-fan inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium transition-transform hover:-translate-y-0.5 active:scale-95 ${on ? FOLDER_ON[imp] : FOLDER_OFF[imp]}`}
                >
                  <span className={`h-2 w-2 rounded-full ${on ? 'bg-white' : swatchClass(imp)}`} />
                  {IMPACT_LABEL[imp]}
                </button>
              );
            })}
          </span>
        </span>
        )}
      </span>
    );
  };

  const renderTag = (o: TagOption) => {
    if (impactFolders) return renderImpactTag(o);
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
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-text-muted">{label}</span>

      {searchable && options.length > 6 && (
        <div className="relative w-40">
          <SearchIcon
            width={12}
            height={12}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-text-dim"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen…"
            className="h-7 w-full rounded-md border border-border bg-bg pl-6 pr-2 text-xs text-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      )}

      {!groupByTime && (
        <div className="flex flex-wrap items-center gap-1.5">
          {others.map(renderTag)}
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
      )}

      {groupByTime && (
        <div className="flex flex-col gap-2.5">
          {clusters.map((c) => (
            <div key={c.time} className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-text-dim">{c.time} Uhr</span>
              <div className="flex flex-wrap items-center gap-1.5">{c.options.map(renderTag)}</div>
            </div>
          ))}

          {noNews.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-text-dim">Keine News-Tage</span>
              <div className="flex flex-wrap items-center gap-1.5">{noNews.map(renderTag)}</div>
            </div>
          )}

          {others.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setOthersOpen((o) => !o)}
                className="inline-flex w-fit items-center gap-1 text-xs text-text-dim hover:text-text-muted"
              >
                <ChevronDownIcon
                  width={11}
                  height={11}
                  className={`transition-transform ${othersOpen ? 'rotate-180' : ''}`}
                />
                Sonstiges ({others.length})
                {othersHasSelected && !othersOpen && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
              </button>
              {othersOpen && <div className="flex flex-wrap items-center gap-1.5">{others.map(renderTag)}</div>}
            </div>
          )}

          {!editor && (
            <button
              type="button"
              onClick={openCreate}
              className="w-fit rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-text-dim hover:border-border-strong hover:text-text-muted"
            >
              + Neu
            </button>
          )}
        </div>
      )}

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
            {(impactFolders ? NEWS_COLORS : TAG_COLOR_LIST).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDraftColor(c)}
                aria-label={c}
                className={`h-5 w-5 rounded-full ${swatchClass(c)} ${draftColor === c ? 'ring-2 ring-text ring-offset-2 ring-offset-bg' : ''}`}
              />
            ))}
          </div>
          {impactFolders && (
            <div className="flex items-center gap-1">
              {NEWS_IMPACTS.map((imp) => {
                const on = draftFolders.includes(imp);
                return (
                  <button
                    key={imp}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setDraftFolders((cur) => (cur.includes(imp) ? cur.filter((f) => f !== imp) : [...cur, imp]))
                    }
                    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${on ? FOLDER_ON[imp] : 'border border-dashed border-border text-text-dim hover:text-text-muted'}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${on ? 'bg-white' : swatchClass(imp)}`} />
                    {on ? '' : '+ '}
                    {IMPACT_LABEL[imp]}-Folder
                  </button>
                );
              })}
            </div>
          )}
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
            if (value.some((v) => baseOf(v) === confirmDelete.name)) {
              onChange(value.filter((v) => baseOf(v) !== confirmDelete.name));
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
