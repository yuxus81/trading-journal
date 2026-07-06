import { useState } from 'react';
import { Button, Modal, useToast } from '@/components/ui';
import { toCsv, downloadCsv } from './csv';
import { listAllTrades } from '@/api/trades';
import { listAccounts } from '@/api/accounts';
import type { Trade } from '@/types/db';

const TRADE_COLUMNS = [
  'id', 'account_id', 'asset', 'trade_date', 'exec_time', 'pnl', 'rating', 'direction',
  'r_multiple', 'setup', 'confidence', 'news', 'notes', 'created_at',
];
const ACCOUNT_COLUMNS = ['id', 'name', 'account_type', 'starting_capital', 'currency', 'created_at'];

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

interface ExportPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ExportPanel({ open, onClose }: ExportPanelProps) {
  const toast = useToast();
  const [trades, setTrades] = useState(true);
  const [accounts, setAccounts] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!trades && !accounts) {
      toast('Bitte mindestens einen Datensatz wählen.', 'error');
      return;
    }
    setBusy(true);
    try {
      if (trades) {
        const rows = await listAllTrades();
        const flat = rows.map((t: Trade) => ({ ...t, news: t.news.join('; ') }));
        downloadCsv(`trades-${stamp()}.csv`, toCsv(flat, TRADE_COLUMNS));
      }
      if (accounts) {
        const rows = await listAccounts();
        downloadCsv(`accounts-${stamp()}.csv`, toCsv(rows, ACCOUNT_COLUMNS));
      }
      toast('Export gestartet.', 'success');
      onClose();
    } catch {
      toast('Export fehlgeschlagen.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const Row = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center gap-3 rounded-input border border-border bg-bg px-3 py-2.5 text-sm text-text">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border bg-bg accent-accent"
      />
      {label}
    </label>
  );

  return (
    <Modal open={open} onClose={onClose} title="CSV-Export (Backup)" size="max-w-sm">
      <p className="text-sm text-text-muted">
        Wähle die Datensätze, die du als CSV sichern möchtest. Empfohlen als regelmäßiges Backup.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Row label="Trades (alle Konten)" checked={trades} onChange={setTrades} />
        <Row label="Konten" checked={accounts} onChange={setAccounts} />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Abbrechen
        </Button>
        <Button onClick={run} disabled={busy}>
          {busy ? 'Exportieren…' : 'Exportieren'}
        </Button>
      </div>
    </Modal>
  );
}
