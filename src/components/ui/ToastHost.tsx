import { useToastStore, type ToastType } from './toastStore';

const dot: Record<ToastType, string> = {
  info: 'bg-accent',
  success: 'bg-profit',
  error: 'bg-loss',
};

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="pointer-events-auto flex w-full max-w-sm animate-fade-in items-center gap-3 rounded-input border border-border-strong bg-card px-4 py-3 text-left text-sm text-text shadow-lg shadow-black/30"
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${dot[t.type]}`} />
          {t.message}
        </button>
      ))}
    </div>
  );
}
