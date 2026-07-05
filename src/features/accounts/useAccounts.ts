import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAccount, deleteAccount, listAccounts, updateAccount } from '@/api/accounts';
import type { NewAccount } from '@/types/db';

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: listAccounts });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: NewAccount) => createAccount(a),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewAccount> }) => updateAccount(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}
