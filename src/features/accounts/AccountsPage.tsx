import { useState } from 'react';
import { useAccounts, useCreateAccount, useDeleteAccount, useUpdateAccount } from './useAccounts';
import { useUiStore } from '@/store/uiStore';
import { AccountCard } from './AccountCard';
import { AccountForm } from './AccountForm';
import { Button, ConfirmDialog, EmptyState, Spinner, useToast } from '@/components/ui';
import type { Account, NewAccount } from '@/types/db';

export function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const remove = useDeleteAccount();
  const toast = useToast();

  const activeAccountId = useUiStore((s) => s.activeAccountId);
  const setActiveAccount = useUiStore((s) => s.setActiveAccount);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | undefined>();
  const [deleting, setDeleting] = useState<Account | undefined>();

  const openNew = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (a: Account) => {
    setEditing(a);
    setFormOpen(true);
  };

  const submit = (values: NewAccount) => {
    const onErr = () => toast('Speichern fehlgeschlagen.', 'error');
    if (editing) {
      update.mutate(
        { id: editing.id, patch: values },
        {
          onSuccess: () => {
            setFormOpen(false);
            toast('Konto aktualisiert.', 'success');
          },
          onError: onErr,
        },
      );
    } else {
      create.mutate(values, {
        onSuccess: (acc) => {
          setFormOpen(false);
          if (!activeAccountId) setActiveAccount(acc.id);
          toast('Konto angelegt.', 'success');
        },
        onError: onErr,
      });
    }
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const deletedId = deleting.id;
    remove.mutate(deletedId, {
      onSuccess: () => {
        if (activeAccountId === deletedId) {
          const next = accounts?.find((a) => a.id !== deletedId);
          setActiveAccount(next?.id ?? null);
        }
        setDeleting(undefined);
        toast('Konto gelöscht.', 'success');
      },
      onError: () => toast('Löschen fehlgeschlagen.', 'error'),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-text">Konten</h1>
        {accounts && accounts.length > 0 && <Button onClick={openNew}>+ Neues Konto</Button>}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : !accounts || accounts.length === 0 ? (
        <EmptyState
          title="Noch kein Konto"
          description="Lege dein erstes Konto an, um Trades und Kennzahlen zu erfassen."
          action={<Button onClick={openNew}>+ Konto anlegen</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              active={a.id === activeAccountId}
              onSelect={() => setActiveAccount(a.id)}
              onEdit={() => openEdit(a)}
              onDelete={() => setDeleting(a)}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <AccountForm
          initial={editing}
          busy={create.isPending || update.isPending}
          onClose={() => setFormOpen(false)}
          onSubmit={submit}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Konto löschen?"
        message={`„${deleting?.name}" und alle zugehörigen Trades werden dauerhaft gelöscht.`}
        confirmLabel="Löschen"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(undefined)}
      />
    </div>
  );
}
