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
