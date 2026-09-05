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

/** All trades across every account (RLS-scoped to the user). Used by CSV backup. */
export async function listAllTrades(): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('trade_date', { ascending: true });
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

/**
 * Trades store setup/news as name strings, not tag ids, so renaming a tag has
 * to rewrite the history or old trades silently detach from it. Deleting a tag
 * deliberately does NOT touch trades — the label stays on past entries (shown
 * uncoloured, still filterable), it just disappears from the picker.
 */
export async function renameSetupOnTrades(oldName: string, newName: string): Promise<void> {
  if (oldName === newName) return;
  const { error } = await supabase.from('trades').update({ setup: newName }).eq('setup', oldName);
  if (error) throw error;
}

export async function renameNewsOnTrades(oldName: string, newName: string): Promise<void> {
  if (oldName === newName) return;
  const { data, error } = await supabase
    .from('trades')
    .select('id, news')
    .contains('news', [oldName]);
  if (error) throw error;
  for (const row of (data as Pick<Trade, 'id' | 'news'>[]) ?? []) {
    const next = Array.from(new Set(row.news.map((n) => (n === oldName ? newName : n))));
    const { error: upErr } = await supabase.from('trades').update({ news: next }).eq('id', row.id);
    if (upErr) throw upErr;
  }
}
