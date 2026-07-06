import { useState, type FormEvent } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';
import type { Account, AccountType, NewAccount } from '@/types/db';

const typeOptions = [
  { value: 'backtest', label: 'Backtest' },
  { value: 'demo', label: 'Demo' },
  { value: 'eval', label: 'Eval' },
  { value: 'funded', label: 'Funded' },
  { value: 'live', label: 'Live' },
];

const currencyOptions = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
];

interface AccountFormProps {
  initial?: Account;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: NewAccount) => void;
}

/** Mounted only while open, so state always starts from `initial`. */
export function AccountForm({ initial, busy, onClose, onSubmit }: AccountFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<AccountType>(initial?.account_type ?? 'demo');
  const [capital, setCapital] = useState(initial ? String(initial.starting_capital) : '');
  const [currency, setCurrency] = useState(initial?.currency ?? 'USD');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      account_type: type,
      starting_capital: Number(capital) || 0,
      currency,
    });
  };

  return (
    <Modal open onClose={onClose} title={initial ? 'Konto bearbeiten' : 'Neues Konto'}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Art" value={type} onChange={(v) => setType(v as AccountType)} options={typeOptions} />
          <Select label="Währung" value={currency} onChange={setCurrency} options={currencyOptions} />
        </div>
        <Input
          label="Startkapital"
          type="number"
          inputMode="decimal"
          step="any"
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
          placeholder="0"
        />
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
