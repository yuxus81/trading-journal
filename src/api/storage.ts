import { supabase } from '@/lib/supabase';

const BUCKET = 'trade-images';

/** Uploads a (compressed) image and returns its storage path. */
export async function uploadImage(userId: string, tradeId: string, file: File): Promise<string> {
  const path = `${userId}/${tradeId}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || 'image/webp', upsert: false });
  if (error) throw error;
  return path;
}

/** Creates a temporary signed URL for a private image (bucket is not public). */
export async function signedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

/** Removes storage objects. Call before deleting the DB rows (cascade won't clean storage). */
export async function removeImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw error;
}
