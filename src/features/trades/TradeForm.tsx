import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { useUiStore } from '@/store/uiStore';
import { useCreateTrade, useUpdateTrade, useTrades } from './useTrades';
import { useCreateSetup, useSetups } from './useSetups';
import { ImageUploader } from './ImageUploader';
import { uploadImage } from '@/api/storage';
import { addTradeImage } from '@/api/tradeImages';
import { Button, Input, StarRating, Slider, TagInput, Textarea, useToast } from '@/components/ui';
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
  const { data: trades } = useTrades(activeAccountId);
  const toast = useToast();
  const queryClient = useQueryClient();

  const [asset, setAsset] = useState(initial?.asset ?? '');
  const [tradeDate, setTradeDate] = useState(initial?.trade_date ?? today());
  const [execTime, setExecTime] = useState(initial?.exec_time?.slice(0, 5) ?? '');
  const [pnl, setPnl] = useState(initial ? String(initial.pnl) : '');
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const [news, setNews] = useState<string[]>(initial?.news ?? []);
  const [images, setImages] = useState<File[]>([]);

  const [direction, setDirection] = useState<Direction | null>(initial?.direction ?? null);
  const [rMultiple, setRMultiple] = useState(initial?.r_multiple != null ? String(initial.r_multiple) : '');
  const [setup, setSetup] = useState(initial?.setup ?? '');
  const [confidence, setConfidence] = useState(initial?.confidence ?? 5);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const [saving, setSaving] = useState(false);

  const assetSuggestions = useMemo(() => {
    const used = new Set(DEFAULT_ASSETS);
    trades?.forEach((t) => used.add(t.asset));
    return [...used];
  }, [trades]);

  const setupNames = setups?.map((s) => s.name) ?? [];

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
      direction,
      r_multiple: rMultiple.trim() === '' ? null : Number(rMultiple),
      setup: setup.trim() || null,
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

      if (images.length > 0 && user && tradeId) {
        for (const file of images) {
          const path = await uploadImage(user.id, tradeId, file);
          await addTradeImage(tradeId, path);
        }
        queryClient.invalidateQueries({ queryKey: ['tradeImages', tradeId] });
      }

      const name = setup.trim();
      if (name && !setupNames.includes(name)) {
        await createSetup.mutateAsync(name);
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
        <div className="flex flex-col gap-1.5">
          <Input label="Asset" list="asset-suggestions" value={asset} onChange={(e) => setAsset(e.target.value)} placeholder="MNQ" required />
          <datalist id="asset-suggestions">
            {assetSuggestions.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
        <Input label="PnL" type="number" inputMode="decimal" step="any" value={pnl} onChange={(e) => setPnl(e.target.value)} placeholder="z. B. 250 oder -85" required />
        <Input label="Datum" type="date" value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} required />
        <Input label="Uhrzeit (optional)" type="time" value={execTime} onChange={(e) => setExecTime(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-text-muted">Bewertung</span>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <TagInput label="News des Tages" value={news} onChange={setNews} placeholder="z. B. CPI 14:30" />

      <ImageUploader value={images} onChange={setImages} />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-text-muted">Richtung</span>
        <div className="inline-flex rounded-input border border-border bg-bg p-1">
          {(['long', 'short'] as Direction[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection((cur) => (cur === d ? null : d))}
              className={`h-8 min-w-[5rem] rounded-[7px] px-4 text-sm font-medium capitalize transition-colors ${
                direction === d ? 'bg-accent text-accent-ink' : 'text-text-muted hover:text-text'
              }`}
            >
              {d === 'long' ? 'Long' : 'Short'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="R-Multiple" type="number" inputMode="decimal" step="any" value={rMultiple} onChange={(e) => setRMultiple(e.target.value)} placeholder="z. B. 2.5" />
        <div className="flex flex-col gap-1.5">
          <Input label="Setup / Strategie" list="setup-suggestions" value={setup} onChange={(e) => setSetup(e.target.value)} placeholder="z. B. Breakout" />
          <datalist id="setup-suggestions">
            {setupNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
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
