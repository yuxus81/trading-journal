import { useState } from 'react';
import { StarIcon } from './icons';

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md';
}

export function StarRating({ value, onChange, readOnly = false, size = 'md' }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const stars = [1, 2, 3, 4, 5];
  const px = size === 'sm' ? 14 : 20;
  // While hovering, the row previews the rating you are about to pick.
  const shown = hover ?? value ?? 0;

  if (readOnly || !onChange) {
    return (
      <div className="inline-flex items-center gap-0.5" aria-label={`${value ?? 0} von 5`}>
        {stars.map((s) => (
          <StarIcon
            key={s}
            width={px}
            height={px}
            filled={s <= shown}
            className={s <= shown ? 'text-star' : 'text-border-strong'}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1" onMouseLeave={() => setHover(null)}>
      {stars.map((s) => {
        const on = s <= shown;
        return (
          <button
            key={s}
            type="button"
            aria-label={`${s} Sterne`}
            aria-pressed={value === s}
            onMouseEnter={() => setHover(s)}
            onClick={() => onChange(s)}
            className="rounded-md p-0.5 transition-transform duration-150 ease-out hover:scale-[1.18] active:scale-95"
          >
            <StarIcon
              width={px}
              height={px}
              filled={on}
              className={`transition-colors duration-150 ${on ? 'text-star' : 'text-border-strong'}`}
            />
          </button>
        );
      })}
      <span className="num ml-2 text-xs text-text-dim">{value ?? '—'}/5</span>
    </div>
  );
}
