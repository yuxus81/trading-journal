import { supabase } from '@/lib/supabase';
import type { NewTrade, Trade, UpdateTrade } from '@/types/db';

export async function listTrades(accountId: string): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('account_id', accountId)
    .order('trade_date', { ascending: false })
    .order('exec_time', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Trade[];
}

export async function getTrade(id: string): Promise<Trade> {
  const { data, error } = await supabase.from('trades').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Trade;
}

export async function createTrade(t: NewTrade): Promise<Trade> {
  const { data, error } = await supabase.from('trades').insert(t).select().single();
  if (error) throw error;
  return data as Trade;
}

export async function updateTrade(id: string, patch: UpdateTrade): Promise<Trade> {
  const { data, error } = await supabase.from('trades').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as Trade;
}

export async function deleteTrade(id: string): Promise<void> {
  const { error } = await supabase.from('trades').delete().eq('id', id);
  if (error) throw error;
}
