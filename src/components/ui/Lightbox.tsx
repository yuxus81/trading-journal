import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface LightboxProps {
  images: string[];
  index: number;
  onClose: () => void;
  onIndex: (index: number) => void;
}

export function Lightbox({ images, index, onClose, onIndex }: LightboxProps) {
  const count = images.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && count > 1) onIndex((index + 1) % count);
      if (e.key === 'ArrowLeft' && count > 1) onIndex((index - 1 + count) % count);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, count, onClose, onIndex]);

  if (count === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button
        onClick={onClose}
        aria-label="Schließen"
        className="absolute right-4 top-4 text-2xl text-white/70 hover:text-white"
      >
        ✕
      </button>
      {count > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndex((index - 1 + count) % count);
          }}
          aria-label="Vorheriges Bild"
          className="absolute left-4 text-3xl text-white/70 hover:text-white"
        >
          ‹
        </button>
      )}
      <img
        src={images[index]}
        alt={`Screenshot ${index + 1} von ${count}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
      />
      {count > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndex((index + 1) % count);
          }}
          aria-label="Nächstes Bild"
          className="absolute right-4 text-3xl text-white/70 hover:text-white"
        >
          ›
        </button>
      )}
    </div>,
    document.body,
  );
}
