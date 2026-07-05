import { supabase } from '@/lib/supabase';
import type { CashEvent, NewCashEvent } from '@/types/db';

export async function listCashEvents(accountId: string): Promise<CashEvent[]> {
  const { data, error } = await supabase
    .from('cash_events')
    .select('*')
    .eq('account_id', accountId)
    .order('event_date', { ascending: false });
  if (error) throw error;
  return data as CashEvent[];
}

export async function createCashEvent(e: NewCashEvent): Promise<CashEvent> {
  const { data, error } = await supabase.from('cash_events').insert(e).select().single();
  if (error) throw error;
  return data as CashEvent;
}

export async function updateCashEvent(id: string, patch: Partial<NewCashEvent>): Promise<CashEvent> {
  const { data, error } = await supabase.from('cash_events').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as CashEvent;
}

export async function deleteCashEvent(id: string): Promise<void> {
  const { error } = await supabase.from('cash_events').delete().eq('id', id);
  if (error) throw error;
}
