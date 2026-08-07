interface SliderProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export function Slider({ label, value, min, max, step = 1, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">{label}</span>
          <span className="num rounded-md bg-brand/15 px-2 py-0.5 font-medium text-brand-bright">{value}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        // The filled part of the track is painted with a gradient stop at the
        // current value, so the control shows its level, not just its handle.
        style={{
          background: `linear-gradient(to right, #8B85EA 0%, #ABA4FF ${pct}%, #24262E ${pct}%, #24262E 100%)`,
        }}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full
          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-bg [&::-webkit-slider-thumb]:bg-brand-bright
          [&::-webkit-slider-thumb]:shadow-lift [&::-webkit-slider-thumb]:transition-transform
          hover:[&::-webkit-slider-thumb]:scale-110
          [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-bg [&::-moz-range-thumb]:bg-brand-bright"
      />
    </div>
  );
}
