import { useEffect, useState } from 'react';
import { compressImage } from './imageCompression';
import { Spinner } from '@/components/ui';

interface ImageUploaderProps {
  value: File[];
  onChange: (files: File[]) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const next = value.map((f) => URL.createObjectURL(f));
    setUrls(next);
    return () => next.forEach((u) => URL.revokeObjectURL(u));
  }, [value]);

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const compressed = await Promise.all(Array.from(files).map((f) => compressImage(f)));
      onChange([...value, ...compressed]);
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-text-muted">Screenshots</span>
      <div className="flex flex-wrap gap-2">
        {value.map((file, i) => (
          <div key={i} className="relative h-20 w-20 overflow-hidden rounded-md border border-border">
            <img src={urls[i]} alt={file.name} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Bild entfernen"
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white hover:bg-black"
            >
              ✕
            </button>
          </div>
        ))}
        <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-text-dim transition-colors hover:border-accent hover:text-text">
          {busy ? <Spinner /> : <span className="text-xl leading-none">+</span>}
          <span className="text-[10px]">Hinzufügen</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      </div>
    </div>
  );
}
