import { supabase } from '@/lib/supabase';
import type { Account, NewAccount } from '@/types/db';

export async function listAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Account[];
}

export async function createAccount(a: NewAccount): Promise<Account> {
  const { data, error } = await supabase.from('accounts').insert(a).select().single();
  if (error) throw error;
  return data as Account;
}

export async function updateAccount(id: string, patch: Partial<NewAccount>): Promise<Account> {
  const { data, error } = await supabase.from('accounts').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as Account;
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw error;
}
