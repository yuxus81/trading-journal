import { useState } from 'react';
import { useTradeImages } from './useTrades';
import { useSignedUrls } from './useSignedUrls';
import { Lightbox, Spinner } from '@/components/ui';

export function TradeImageGallery({ tradeId }: { tradeId: string }) {
  const { data: images, isLoading } = useTradeImages(tradeId);
  const paths = (images ?? []).map((i) => i.storage_path);
  const urlMap = useSignedUrls(paths);
  const urls = paths.map((p) => urlMap[p]).filter((u): u is string => !!u);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    );
  }
  if (!images || images.length === 0) {
    return <p className="text-sm text-text-dim">Keine Screenshots.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {urls.map((u, i) => (
          <button
            key={u}
            onClick={() => setLightbox(i)}
            className="overflow-hidden rounded-md border border-border transition-colors hover:border-accent"
          >
            <img src={u} alt={`Screenshot ${i + 1}`} className="h-40 w-full object-cover" />
          </button>
        ))}
      </div>
      {lightbox !== null && (
        <Lightbox images={urls} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
      )}
    </>
  );
}
