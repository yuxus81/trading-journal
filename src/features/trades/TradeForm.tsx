import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { useUiStore } from '@/store/uiStore';
import { useCreateTrade, useUpdateTrade, useTrades, useTradeImages } from './useTrades';
import { useSignedUrls } from './useSignedUrls';
import { useCreateSetup, useDeleteSetup, useSetups, useUpdateSetup } from './useSetups';
import { joinNews, splitNews } from '@/lib/newsImpact';
import { useCreateNewsTag, useDeleteNewsTag, useNewsTags, useUpdateNewsTag } from './useNewsTags';
import {
  useCreateWeekEvent,
  useDeleteWeekEvent,
  useUpdateWeekEvent,
  useWeekEvents,
} from './useWeekEvents';
import { ImageUploader } from './ImageUploader';
import { uploadImage, removeImages } from '@/api/storage';
import { addTradeImage, deleteTradeImage } from '@/api/tradeImages';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Button,
  CheckIcon,
  Combobox,
  Input,
  StarRating,
  Slider,
  TagPicker,
  Textarea,
  useToast,
} from '@/components/ui';
import type { Direction, NewTrade, Trade, UpdateTrade } from '@/types/db';

const DEFAULT_ASSETS = ['MNQ', 'MES'];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface TradeFormProps {
  initial?: Trade;
  onDone: () => void;
  onCancel: () => void;
}

export function TradeForm({ initial, onDone, onCancel }: TradeFormProps) {
  const { user } = useAuth();
  const activeAccountId = useUiStore((s) => s.activeAccountId);
  const create = useCreateTrade();
  const update = useUpdateTrade();
  const { data: setups } = useSetups();
  const createSetup = useCreateSetup();
  const updateSetup = useUpdateSetup();
  const deleteSetup = useDeleteSetup();
  const { data: newsTags } = useNewsTags();
  const createNewsTag = useCreateNewsTag();
  const updateNewsTag = useUpdateNewsTag();
  const deleteNewsTag = useDeleteNewsTag();
  const { data: weekEventTags } = useWeekEvents();
  const createWeekEvent = useCreateWeekEvent();
  const updateWeekEvent = useUpdateWeekEvent();
  const deleteWeekEvent = useDeleteWeekEvent();
  const { data: trades } = useTrades(activeAccountId);
  const toast = useToast();
  const queryClient = useQueryClient();

  const [asset, setAsset] = useState(initial?.asset ?? '');
  const [tradeDate, setTradeDate] = useState(initial?.trade_date ?? today());
  const [execTime, setExecTime] = useState(initial?.exec_time?.slice(0, 5) ?? '');
  const [pnl, setPnl] = useState(initial ? String(initial.pnl) : '');
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const [news, setNews] = useState<string[]>(initial?.news ?? []);
  const [weekEvents, setWeekEvents] = useState<string[]>(initial?.week_events ?? []);
  const [images, setImages] = useState<File[]>([]);

  const { data: existingImages } = useTradeImages(initial?.id);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const remainingImages = (existingImages ?? []).filter((img) => !removedImageIds.includes(img.id));
  const existingUrls = useSignedUrls(remainingImages.map((i) => i.storage_path));

  const [direction, setDirection] = useState<Direction | null>(initial?.direction ?? null);
  const [rMultiple, setRMultiple] = useState(initial?.r_multiple != null ? String(initial.r_multiple) : '');
  const [setup, setSetup] = useState(initial?.setup ?? '');
  const [smt, setSmt] = useState(initial?.smt ?? false);
  const [confidence, setConfidence] = useState(initial?.confidence ?? 5);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const [saving, setSaving] = useState(false);

  const assetSuggestions = useMemo(() => {
    const used = new Set(DEFAULT_ASSETS);
    trades?.forEach((t) => used.add(t.asset));
    return [...used];
  }, [trades]);

  const submit = async () => {
    if (!asset.trim()) return toast('Bitte ein Asset angeben.', 'error');
    if (!tradeDate) return toast('Bitte ein Datum angeben.', 'error');
    if (pnl.trim() === '' || Number.isNaN(Number(pnl))) return toast('Bitte einen gültigen PnL angeben.', 'error');
    if (!initial && !activeAccountId) return toast('Kein Konto gewählt.', 'error');

    const fields = {
      asset: asset.trim(),
      trade_date: tradeDate,
      exec_time: execTime ? execTime : null,
      pnl: Number(pnl),
      rating,
      news,
      week_events: weekEvents,
      direction,
      r_multiple: rMultiple.trim() === '' ? null : Number(rMultiple),
      setup: setup.trim() || null,
      smt,
      confidence,
      notes: notes.trim() || null,
    };

    setSaving(true);
    try {
      let tradeId = initial?.id;
      if (initial) {
        await update.mutateAsync({ id: initial.id, patch: fields as UpdateTrade });
      } else {
        const created = await create.mutateAsync({ account_id: activeAccountId as string, ...fields } as NewTrade);
        tradeId = created.id;
      }

      if (removedImageIds.length > 0 && existingImages && tradeId) {
        const toDelete = existingImages.filter((i) => removedImageIds.includes(i.id));
        await removeImages(toDelete.map((i) => i.storage_path));
        await Promise.all(toDelete.map((i) => deleteTradeImage(i.id)));
        queryClient.invalidateQueries({ queryKey: ['tradeImages'] });
      }

      if (images.length > 0 && user && tradeId) {
        for (const file of images) {
          const path = await uploadImage(user.id, tradeId, file);
          await addTradeImage(tradeId, path);
        }
        queryClient.invalidateQueries({ queryKey: ['tradeImages', tradeId] });
      }

      toast(initial ? 'Trade aktualisiert.' : 'Trade gespeichert.', 'success');
      onDone();
    } catch {
      toast('Speichern fehlgeschlagen.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-5"
    >
      <div className="grid grid-cols-2 gap-4">
        <Combobox
          label="Asset"
          value={asset}
          onChange={setAsset}
          suggestions={assetSuggestions}
          placeholder="MNQ"
          required
        />
        <Input label="PnL" type="number" inputMode="decimal" step="any" value={pnl} onChange={(e) => setPnl(e.target.value)} placeholder="z. B. 250 oder -85" required />
        <Input label="Datum" type="date" value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} required />
        <Input label="Uhrzeit (optional)" type="time" value={execTime} onChange={(e) => setExecTime(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-text-muted">Bewertung</span>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <TagPicker
        label="News"
        mode="multi"
        options={newsTags ?? []}
        value={news}
        onChange={setNews}
        onCreate={(name, color) => createNewsTag.mutate({ name, color })}
        onUpdate={(id, patch, prevName) => {
          updateNewsTag.mutate({ id, ...patch, prevName });
          setNews((cur) =>
            cur.map((n) => {
              const { name, impact } = splitNews(n);
              return name === prevName ? joinNews(patch.name, impact) : n;
            }),
          );
        }}
        onDelete={(id) => deleteNewsTag.mutate(id)}
        placeholder="z. B. CPI 14:30"
        impactFolders
        groupByTime
        searchable
      />

      <TagPicker
        label="Wochen-Events"
        mode="multi"
        options={weekEventTags ?? []}
        value={weekEvents}
        onChange={setWeekEvents}
        onCreate={(name, color) => createWeekEvent.mutate({ name, color })}
        onUpdate={(id, patch, prevName) => {
          updateWeekEvent.mutate({ id, ...patch, prevName });
          setWeekEvents((cur) => cur.map((n) => (n === prevName ? patch.name : n)));
        }}
        onDelete={(id) => deleteWeekEvent.mutate(id)}
        placeholder="z. B. CPI-Week"
      />

      {remainingImages.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-text-muted">Vorhandene Screenshots</span>
          <div className="flex flex-wrap gap-2">
            {remainingImages.map((img) => (
              <div
                key={img.id}
                className="relative h-20 w-20 overflow-hidden rounded-md border border-border"
              >
                {existingUrls[img.storage_path] ? (
                  <img
                    src={existingUrls[img.storage_path]}
                    alt="Screenshot"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full animate-pulse bg-border/40" />
                )}
                <button
                  type="button"
                  onClick={() => setRemovedImageIds((cur) => [...cur, img.id])}
                  aria-label="Bild entfernen"
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white hover:bg-black"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-dim">
            Entfernte Bilder werden erst beim Speichern endgültig gelöscht.
          </p>
        </div>
      )}

      <ImageUploader value={images} onChange={setImages} />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-text-muted">Richtung</span>
        {/* Not a Segmented control: this field is tri-state — clicking the
            selected side clears it back to "no direction recorded". */}
        <div className="inline-flex rounded-input border border-border bg-bg p-1">
          {(['long', 'short'] as Direction[]).map((d) => {
            const on = direction === d;
            const Icon = d === 'long' ? ArrowUpIcon : ArrowDownIcon;
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => setDirection((cur) => (cur === d ? null : d))}
                className={`flex h-8 min-w-[5.5rem] items-center justify-center gap-1.5 rounded-[7px] px-4 text-sm font-medium transition-all duration-200 ${
                  !on
                    ? 'text-text-muted hover:text-text'
                    : d === 'long'
                      ? 'bg-profit/15 text-profit ring-1 ring-inset ring-profit/40'
                      : 'bg-loss/15 text-loss ring-1 ring-inset ring-loss/40'
                }`}
              >
                <Icon width={14} height={14} />
                {d === 'long' ? 'Long' : 'Short'}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="R-Multiple" type="number" inputMode="decimal" step="any" value={rMultiple} onChange={(e) => setRMultiple(e.target.value)} placeholder="z. B. 2.5" />
        <div className="flex flex-col gap-2">
          <TagPicker
            label="Setup / Strategie"
            mode="single"
            options={setups ?? []}
            value={setup ? [setup] : []}
            onChange={(names) => setSetup(names[0] ?? '')}
            onCreate={(name, color) => createSetup.mutate({ name, color })}
            onUpdate={(id, patch, prevName) => {
              updateSetup.mutate({ id, ...patch, prevName });
              setSetup((cur) => (cur === prevName ? patch.name : cur));
            }}
            onDelete={(id) => deleteSetup.mutate(id)}
            placeholder="z. B. Breakout"
          />
          <button
            type="button"
            aria-pressed={smt}
            onClick={() => setSmt((v) => !v)}
            className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              smt
                ? 'border-brand/40 bg-brand/15 text-brand'
                : 'border-border text-text-dim hover:border-border-strong hover:text-text-muted'
            }`}
          >
            <span
              className={`grid h-3.5 w-3.5 place-items-center rounded-[3px] border ${
                smt ? 'border-brand bg-brand text-bg' : 'border-border-strong'
              }`}
            >
              {smt && <CheckIcon width={9} height={9} />}
            </span>
            SMT
          </button>
        </div>
      </div>

      <Slider label="Confidence (1–10)" min={1} max={10} value={confidence} onChange={setConfidence} />

      <Textarea label="Psychologie / Fehler-Notizen" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Speichern…' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
}
