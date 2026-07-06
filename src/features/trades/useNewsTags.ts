import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createNewsTag, listNewsTags } from '@/api/newsTags';

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
