import imageCompression from 'browser-image-compression';

/**
 * Client-side compression config. Tune here (documented in README):
 * long edge <= 1600px, target ~0.35 MB, WebP output.
 */
export const COMPRESSION = {
  maxWidthOrHeight: 1600,
  maxSizeMB: 0.35,
  useWebWorker: true,
  fileType: 'image/webp' as const,
};

/** Compresses/resizes an image file before upload. Falls back to the original on failure. */
export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, COMPRESSION);
}
