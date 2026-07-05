import { useState, type FormEvent } from 'react';
import { Button, Input, Modal, Select, Textarea } from '@/components/ui';
import type { CashEvent, CashEventType, NewCashEvent } from '@/types/db';

export const cashTypeOptions: { value: CashEventType; label: string }[] = [
  { value: 'deposit', label: 'Einzahlung' },
  { value: 'withdrawal', label: 'Abhebung' },
  { value: 'payout', label: 'Payout' },
  { value: 'fee', label: 'Gebühr' },
  { value: 'reset', label: 'Reset' },
  { value: 'adjustment', label: 'Korrektur' },
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface CashEventFormProps {
  accountId: string;
  initial?: CashEvent;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: NewCashEvent) => void;
}

export function CashEventForm({ accountId, initial, busy, onClose, onSubmit }: CashEventFormProps) {
  const [type, setType] = useState<CashEventType>(initial?.type ?? 'deposit');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [eventDate, setEventDate] = useState(initial?.event_date ?? today());
  const [note, setNote] = useState(initial?.note ?? '');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      account_id: accountId,
      type,
      amount: Number(amount) || 0,
      event_date: eventDate,
      note: note.trim() || null,
    });
  };

  return (
    <Modal open onClose={onClose} title={initial ? 'Cash-Event bearbeiten' : 'Neues Cash-Event'}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Select label="Typ" value={type} onChange={(v) => setType(v as CashEventType)} options={cashTypeOptions} />
          <Input
            label="Betrag"
            type="number"
            inputMode="decimal"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <p className="-mt-1 text-xs text-text-dim">Negativ für Abhebung, Payout oder Gebühr (z. B. -500).</p>
        <Input label="Datum" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
        <Textarea label="Notiz (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Speichern…' : 'Speichern'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
