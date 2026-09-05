import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createWeekEvent, deleteWeekEvent, listWeekEvents, updateWeekEvent } from '@/api/weekEvents';
import { renameWeekEventOnTrades } from '@/api/trades';

/**
 * Recurring weekly-event tags (CPI week, NFP week, …). Same shape and lifecycle
 * as news tags — a separate table so the two lists stay independent.
 * The query tolerates the table being absent until the migration is applied.
 */
export function useWeekEvents() {
  return useQuery({
    queryKey: ['weekEvents'],
    queryFn: async () => {
      try {
        return await listWeekEvents();
      } catch {
        return [];
      }
    },
  });
}

export function useCreateWeekEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => createWeekEvent(name, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekEvents'] }),
  });
}

export function useUpdateWeekEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      color,
      prevName,
    }: {
      id: string;
      name: string;
      color: string;
      prevName: string;
    }) => {
      const ev = await updateWeekEvent(id, { name, color });
      if (name !== prevName) await renameWeekEventOnTrades(prevName, name);
      return ev;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['weekEvents'] });
      qc.invalidateQueries({ queryKey: ['trades'] });
      qc.invalidateQueries({ queryKey: ['trade'] });
    },
  });
}

export function useDeleteWeekEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWeekEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekEvents'] }),
  });
}
