import { supabase } from '@/lib/supabase';
import type { TradeImage } from '@/types/db';

export async function listTradeImages(tradeId: string): Promise<TradeImage[]> {
  const { data, error } = await supabase
    .from('trade_images')
    .select('*')
    .eq('trade_id', tradeId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as TradeImage[];
}

/** First image's storage path per trade — for lightweight table thumbnails. */
export async function listFirstImagePaths(tradeIds: string[]): Promise<Record<string, string>> {
  if (tradeIds.length === 0) return {};
  const { data, error } = await supabase
    .from('trade_images')
    .select('trade_id, storage_path')
    .in('trade_id', tradeIds)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data as { trade_id: string; storage_path: string }[]) {
    if (!map[row.trade_id]) map[row.trade_id] = row.storage_path;
  }
  return map;
}

export async function addTradeImage(tradeId: string, storagePath: string): Promise<TradeImage> {
  const { data, error } = await supabase
    .from('trade_images')
    .insert({ trade_id: tradeId, storage_path: storagePath })
    .select()
    .single();
  if (error) throw error;
  return data as TradeImage;
}

export async function deleteTradeImage(id: string): Promise<void> {
  const { error } = await supabase.from('trade_images').delete().eq('id', id);
  if (error) throw error;
}
