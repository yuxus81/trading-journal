import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSetup, listSetups } from '@/api/setups';

export function useSetups() {
  return useQuery({ queryKey: ['setups'], queryFn: listSetups });
}

export function useCreateSetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => createSetup(name, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['setups'] }),
  });
}
