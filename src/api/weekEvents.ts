import { supabase } from '@/lib/supabase';
import type { WeekEvent } from '@/types/db';

export async function listWeekEvents(): Promise<WeekEvent[]> {
  const { data, error } = await supabase.from('week_events').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data as WeekEvent[];
}

export async function createWeekEvent(name: string, color: string): Promise<WeekEvent> {
  const { data, error } = await supabase.from('week_events').insert({ name, color }).select().single();
  if (error) throw error;
  return data as WeekEvent;
}

export async function updateWeekEvent(
  id: string,
  patch: { name?: string; color?: string },
): Promise<WeekEvent> {
  const { data, error } = await supabase.from('week_events').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as WeekEvent;
}

export async function deleteWeekEvent(id: string): Promise<void> {
  const { error } = await supabase.from('week_events').delete().eq('id', id);
  if (error) throw error;
}
