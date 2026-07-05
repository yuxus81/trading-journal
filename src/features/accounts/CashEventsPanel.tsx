import { useState } from 'react';
import { useCashEvents, useCreateCashEvent, useDeleteCashEvent, useUpdateCashEvent } from './useCashEvents';
import { CashEventForm, cashTypeOptions } from './CashEventForm';
import { Button, Card, ConfirmDialog, Spinner, useToast } from '@/components/ui';
import { formatSignedCurrency, formatDate } from '@/lib/format';
import type { CashEvent, CashEventType, NewCashEvent } from '@/types/db';

const typeLabel = (t: CashEventType) => cashTypeOptions.find((o) => o.value === t)?.label ?? t;

interface CashEventsPanelProps {
  accountId: string;
  currency: string;
}

export function CashEventsPanel({ accountId, currency }: CashEventsPanelProps) {
  const { data: events, isLoading } = useCashEvents(accountId);
  const create = useCreateCashEvent();
  const update = useUpdateCashEvent(accountId);
  const remove = useDeleteCashEvent(accountId);
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CashEvent | undefined>();
  const [deleting, setDeleting] = useState<CashEvent | undefined>();

  const openNew = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (e: CashEvent) => {
    setEditing(e);
    setFormOpen(true);
  };

  const submit = (values: NewCashEvent) => {
    const onDone = () => {
      setFormOpen(false);
      toast('Gespeichert.', 'success');
    };
    const onErr = () => toast('Speichern fehlgeschlagen.', 'error');
    if (editing) {
      update.mutate({ id: editing.id, patch: values }, { onSuccess: onDone, onError: onErr });
    } else {
      create.mutate(values, { onSuccess: onDone, onError: onErr });
    }
  };

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => {
        setDeleting(undefined);
        toast('Gelöscht.', 'success');
      },
      onError: () => toast('Löschen fehlgeschlagen.', 'error'),
    });
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-text">Cash-Events</h2>
        <Button size="sm" variant="ghost" onClick={openNew}>
          + Hinzufügen
        </Button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !events || events.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-dim">Noch keine Cash-Events.</p>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm text-text">
                    <span>{typeLabel(e.type)}</span>
                    <span className="text-text-dim">·</span>
                    <span className="text-text-muted">{formatDate(e.event_date)}</span>
                  </div>
                  {e.note && <p className="mt-0.5 truncate text-xs text-text-dim">{e.note}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${e.amount < 0 ? 'text-loss' : 'text-profit'}`}>
                    {formatSignedCurrency(e.amount, currency)}
                  </span>
                  <button onClick={() => openEdit(e)} className="text-xs text-text-dim hover:text-text">
                    Bearb.
                  </button>
                  <button onClick={() => setDeleting(e)} className="text-xs text-text-dim hover:text-loss">
                    Löschen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {formOpen && (
        <CashEventForm
          accountId={accountId}
          initial={editing}
          busy={create.isPending || update.isPending}
          onClose={() => setFormOpen(false)}
          onSubmit={submit}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Cash-Event löschen?"
        message="Dieser Eintrag wird dauerhaft entfernt."
        confirmLabel="Löschen"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(undefined)}
      />
    </Card>
  );
}
