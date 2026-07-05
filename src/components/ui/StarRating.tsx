interface StarRatingProps {
  value: number | null;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md';
}

export function StarRating({ value, onChange, readOnly = false, size = 'md' }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];
  const textSize = size === 'sm' ? 'text-sm' : 'text-lg';
  return (
    <div className={`inline-flex items-center gap-0.5 ${textSize}`}>
      {stars.map((s) => {
        const filled = value !== null && s <= value;
        const star = (
          <span className={filled ? 'text-star' : 'text-border-strong'}>★</span>
        );
        if (readOnly || !onChange) {
          return <span key={s}>{star}</span>;
        }
        return (
          <button
            key={s}
            type="button"
            aria-label={`${s} Sterne`}
            onClick={() => onChange(s)}
            className="transition-transform hover:scale-110"
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}
