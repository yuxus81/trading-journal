interface SpinnerProps {
  className?: string;
}

export function Spinner({ className = '' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Lädt"
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent ${className}`}
    />
  );
}
