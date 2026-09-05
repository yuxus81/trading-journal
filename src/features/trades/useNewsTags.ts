import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createNewsTag, deleteNewsTag, listNewsTags, updateNewsTag } from '@/api/newsTags';
import { renameNewsOnTrades } from '@/api/trades';

export function useNewsTags() {
  return useQuery({ queryKey: ['newsTags'], queryFn: listNewsTags });
}

export function useCreateNewsTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => createNewsTag(name, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['newsTags'] }),
  });
}

export function useUpdateNewsTag() {
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
      const tag = await updateNewsTag(id, { name, color });
      if (name !== prevName) await renameNewsOnTrades(prevName, name);
      return tag;
    },
    // onSettled, not onSuccess: the tag row is written first, so the list must
    // refresh even if the trade-history rewrite that follows it throws.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['newsTags'] });
      qc.invalidateQueries({ queryKey: ['trades'] });
      qc.invalidateQueries({ queryKey: ['trade'] });
    },
  });
}

export function useDeleteNewsTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNewsTag(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['newsTags'] }),
  });
}
