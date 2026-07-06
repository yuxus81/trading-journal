import { supabase } from '@/lib/supabase';
import type { NewsTag } from '@/types/db';

export async function listNewsTags(): Promise<NewsTag[]> {
  const { data, error } = await supabase.from('news_tags').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data as NewsTag[];
}

export async function createNewsTag(name: string, color: string): Promise<NewsTag> {
  const { data, error } = await supabase.from('news_tags').insert({ name, color }).select().single();
  if (error) throw error;
  return data as NewsTag;
}
