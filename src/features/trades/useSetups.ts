import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSetup, listSetups } from '@/api/setups';

export function useSetups() {
  return useQuery({ queryKey: ['setups'], queryFn: listSetups });
}

export function useCreateSetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createSetup(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['setups'] }),
  });
}
