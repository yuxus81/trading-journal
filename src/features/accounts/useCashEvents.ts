import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCashEvent,
  deleteCashEvent,
  listCashEvents,
  updateCashEvent,
} from '@/api/cashEvents';
import type { NewCashEvent } from '@/types/db';

export function useCashEvents(accountId: string | null) {
  return useQuery({
    queryKey: ['cashEvents', accountId],
    queryFn: () => listCashEvents(accountId as string),
    enabled: !!accountId,
  });
}

export function useCreateCashEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (e: NewCashEvent) => createCashEvent(e),
    onSuccess: (created) => qc.invalidateQueries({ queryKey: ['cashEvents', created.account_id] }),
  });
}

export function useUpdateCashEvent(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewCashEvent> }) => updateCashEvent(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashEvents', accountId] }),
  });
}

export function useDeleteCashEvent(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCashEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashEvents', accountId] }),
  });
}
