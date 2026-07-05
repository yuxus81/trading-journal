import { describe, it, expect, vi } from 'vitest';

vi.mock('browser-image-compression', () => ({ default: vi.fn(async (f: File) => f) }));

import imageCompression from 'browser-image-compression';
import { COMPRESSION, compressImage } from './imageCompression';

describe('COMPRESSION config', () => {
  it('targets a 1600px long edge, ~0.35 MB, and WebP', () => {
    expect(COMPRESSION.maxWidthOrHeight).toBe(1600);
    expect(COMPRESSION.maxSizeMB).toBeCloseTo(0.35);
    expect(COMPRESSION.fileType).toBe('image/webp');
    expect(COMPRESSION.useWebWorker).toBe(true);
  });
});

describe('compressImage', () => {
  it('delegates to browser-image-compression with the config', async () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    await compressImage(file);
    expect(imageCompression).toHaveBeenCalledWith(file, COMPRESSION);
  });
});
