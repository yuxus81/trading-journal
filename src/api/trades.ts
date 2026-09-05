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
  return (data ?? []).map(normalizeTrade);
}

/** All trades across every account (RLS-scoped to the user). Used by CSV backup. */
export async function listAllTrades(): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('trade_date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalizeTrade);
}

export async function getTrade(id: string): Promise<Trade> {
  const { data, error } = await supabase.from('trades').select('*').eq('id', id).single();
  if (error) throw error;
  return normalizeTrade(data);
}

export async function createTrade(t: NewTrade): Promise<Trade> {
  let res = await supabase.from('trades').insert(t).select().single();
  if (res.error && isMissingWeekEvents(res.error)) {
    res = await supabase.from('trades').insert(stripWeekEvents(t)).select().single();
  }
  if (res.error) throw res.error;
  return normalizeTrade(res.data);
}

export async function updateTrade(id: string, patch: UpdateTrade): Promise<Trade> {
  let res = await supabase.from('trades').update(patch).eq('id', id).select().single();
  if (res.error && isMissingWeekEvents(res.error)) {
    res = await supabase.from('trades').update(stripWeekEvents(patch)).eq('id', id).select().single();
  }
  if (res.error) throw res.error;
  return normalizeTrade(res.data);
}

export async function deleteTrade(id: string): Promise<void> {
  const { error } = await supabase.from('trades').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Trades store setup / news / week-event tags as name strings, not tag ids, so
 * renaming a tag has to rewrite the history or old trades silently detach from
 * it. Deleting a tag deliberately does NOT touch trades — the label stays on
 * past entries (still filterable), it just leaves the picker.
 *
 * `news` / `week_events` are jsonb columns; PostgREST's `contains` filter turns
 * a JS array into a Postgres array literal (`cs.{…}`) that a jsonb column
 * rejects, so the match is done client-side rather than as a query.
 */
export async function renameSetupOnTrades(oldName: string, newName: string): Promise<void> {
  if (oldName === newName) return;
  const { error } = await supabase.from('trades').update({ setup: newName }).eq('setup', oldName);
  if (error) throw error;
}

export async function renameNewsOnTrades(oldName: string, newName: string): Promise<void> {
  await renameJsonbTag('news', oldName, newName);
}

export async function renameWeekEventOnTrades(oldName: string, newName: string): Promise<void> {
  await renameJsonbTag('week_events', oldName, newName);
}

async function renameJsonbTag(
  column: 'news' | 'week_events',
  oldName: string,
  newName: string,
): Promise<void> {
  if (oldName === newName) return;
  const affected = (await listAllTrades()).filter((t) => t[column].includes(oldName));
  for (const t of affected) {
    const next = Array.from(new Set(t[column].map((n) => (n === oldName ? newName : n))));
    const { error } = await supabase.from('trades').update({ [column]: next }).eq('id', t.id);
    if (error) throw error;
  }
}

/** jsonb array columns can be missing (pre-migration) or null — always hand the app an array. */
function normalizeTrade(row: unknown): Trade {
  const t = row as Trade;
  return { ...t, news: t.news ?? [], week_events: t.week_events ?? [] };
}

function stripWeekEvents<T extends object>(payload: T): T {
  const clone = { ...(payload as Record<string, unknown>) };
  delete clone.week_events;
  return clone as T;
}

function isMissingWeekEvents(err: { code?: string; message?: string }): boolean {
  const msg = err.message ?? '';
  return (err.code === 'PGRST204' || /week_events/i.test(msg)) && /column|schema cache/i.test(msg);
}
