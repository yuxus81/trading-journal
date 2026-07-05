import { supabase } from '@/lib/supabase';
import type { Setup } from '@/types/db';

export async function listSetups(): Promise<Setup[]> {
  const { data, error } = await supabase.from('setups').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data as Setup[];
}

export async function createSetup(name: string): Promise<Setup> {
  const { data, error } = await supabase.from('setups').insert({ name }).select().single();
  if (error) throw error;
  return data as Setup;
}
