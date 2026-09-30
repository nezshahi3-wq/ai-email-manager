import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, children, confirmLabel, danger, busy, onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-4 text-right"
          >
            <h2 className="text-lg font-black text-slate-900">{title}</h2>
            <div className="text-sm text-slate-600 leading-relaxed max-h-[50vh] overflow-y-auto">{children}</div>
            <div className="flex gap-3 justify-start pt-2">
              <button
                onClick={onConfirm}
                disabled={busy}
                className={
                  'px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-50 ' +
                  (danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700')
                }
              >
                {confirmLabel}
              </button>
              <button
                onClick={onCancel}
                disabled={busy}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
