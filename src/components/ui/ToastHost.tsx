import { useToastStore, type ToastType } from './toastStore';
import { CheckIcon, CloseIcon } from './icons';

const STYLE: Record<ToastType, { ring: string; icon: string }> = {
  info: { ring: 'border-brand/40', icon: 'text-brand-bright' },
  success: { ring: 'border-profit/40', icon: 'text-profit' },
  error: { ring: 'border-loss/40', icon: 'text-loss' },
};

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => {
        const s = STYLE[t.type];
        const Icon = t.type === 'error' ? CloseIcon : CheckIcon;
        return (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto flex w-full max-w-sm animate-pop-in items-center gap-3 rounded-input border ${s.ring} bg-raised px-4 py-3 text-left text-sm text-text shadow-pop`}
          >
            <span className={`shrink-0 ${s.icon}`}>
              <Icon width={16} height={16} />
            </span>
            {t.message}
          </button>
        );
      })}
    </div>
  );
}
