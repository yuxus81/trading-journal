import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSetup, deleteSetup, listSetups, updateSetup } from '@/api/setups';
import { renameSetupOnTrades } from '@/api/trades';

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

export function useUpdateSetup() {
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
      const setup = await updateSetup(id, { name, color });
      if (name !== prevName) await renameSetupOnTrades(prevName, name);
      return setup;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['setups'] });
      qc.invalidateQueries({ queryKey: ['trades'] });
      qc.invalidateQueries({ queryKey: ['trade'] });
    },
  });
}

export function useDeleteSetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSetup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['setups'] }),
  });
}
