import { supabase } from '@/lib/supabase';
import type { Setup } from '@/types/db';

export async function listSetups(): Promise<Setup[]> {
  const { data, error } = await supabase.from('setups').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data as Setup[];
}

export async function createSetup(name: string, color: string): Promise<Setup> {
  const { data, error } = await supabase.from('setups').insert({ name, color }).select().single();
  if (error) throw error;
  return data as Setup;
}

export async function updateSetup(
  id: string,
  patch: { name?: string; color?: string },
): Promise<Setup> {
  const { data, error } = await supabase.from('setups').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as Setup;
}

export async function deleteSetup(id: string): Promise<void> {
  const { error } = await supabase.from('setups').delete().eq('id', id);
  if (error) throw error;
}
