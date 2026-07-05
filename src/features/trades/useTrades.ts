import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTrade, deleteTrade, getTrade, listTrades, updateTrade } from '@/api/trades';
import { listTradeImages } from '@/api/tradeImages';
import type { NewTrade, UpdateTrade } from '@/types/db';

export function useTrades(accountId: string | null) {
  return useQuery({
    queryKey: ['trades', accountId],
    queryFn: () => listTrades(accountId as string),
    enabled: !!accountId,
  });
}

export function useTrade(id: string | undefined) {
  return useQuery({
    queryKey: ['trade', id],
    queryFn: () => getTrade(id as string),
    enabled: !!id,
  });
}

export function useTradeImages(tradeId: string | undefined) {
  return useQuery({
    queryKey: ['tradeImages', tradeId],
    queryFn: () => listTradeImages(tradeId as string),
    enabled: !!tradeId,
  });
}

export function useCreateTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: NewTrade) => createTrade(t),
    onSuccess: (created) => qc.invalidateQueries({ queryKey: ['trades', created.account_id] }),
  });
}

export function useUpdateTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateTrade }) => updateTrade(id, patch),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['trades', updated.account_id] });
      qc.invalidateQueries({ queryKey: ['trade', updated.id] });
    },
  });
}

export function useDeleteTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTrade(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trades'] }),
  });
}
