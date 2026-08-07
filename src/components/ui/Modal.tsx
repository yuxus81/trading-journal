import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Max width utility, e.g. 'max-w-lg'. */
  size?: string;
}

export function Modal({ open, onClose, title, children, size = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      {/* The scrim blurs the page behind so the dialog reads as "in front of",
          not "pasted onto" — and makes clear the background is dismissible. */}
      <div
        className="fixed inset-0 animate-fade-in bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 my-8 w-full ${size} animate-pop-in rounded-card border border-border-strong bg-card shadow-pop`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-text">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Schließen"
              className="rounded-md p-1 text-text-dim transition-colors hover:bg-border/60 hover:text-text"
            >
              <CloseIcon width={18} height={18} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
