"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckIcon, CloseIcon, InfoIcon } from "@/components/icons";
import { Button } from "@/components/ui";

/* ---------- Всплывающие сообщения ---------- */

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; text: string };

type ConfirmOptions = {
  title: string;
  text?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  children?: ReactNode;
};

type Feedback = {
  toast: (text: string, kind?: ToastKind) => void;
  confirm: (o: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<Feedback | null>(null);

export function useFeedback() {
  const f = useContext(FeedbackContext);
  if (!f) throw new Error("FeedbackProvider отсутствует");
  return f;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const counter = useRef(0);

  const toast = useCallback((text: string, kind: ToastKind = "success") => {
    const id = ++counter.current;
    setToasts((t) => [...t.slice(-1), { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 6000 : 4000);
  }, []);

  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ ...o, resolve })), []);

  const close = (v: boolean) => {
    dialog?.resolve(v);
    setDialog(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite" role="status">
        {toasts.map((t) => (
          <button
            type="button"
            key={t.id}
            data-testid="toast"
            title="Закрыть"
            onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
            className={`pointer-events-auto flex max-w-[520px] cursor-pointer items-start gap-2.5 rounded-2xl px-4 py-2.5 text-left text-sm font-medium shadow-float ${
              t.kind === "error" ? "bg-danger text-surface" : t.kind === "info" ? "bg-ink text-surface" : "bg-forest text-surface"
            }`}
          >
            <span className="mt-0.5 shrink-0">{t.kind === "success" ? <CheckIcon size={18} /> : <InfoIcon size={18} />}</span>
            <span>{t.text}</span>
          </button>
        ))}
      </div>
      {dialog && (
        <Modal onClose={() => close(false)} label={dialog.title}>
          <h2 className="font-display text-xl font-medium tracking-[-0.01em]">{dialog.title}</h2>
          {dialog.text && <p className="mt-2 text-[15px] leading-[1.55] text-ink-2">{dialog.text}</p>}
          {dialog.children}
          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => close(false)}>
              {dialog.cancelLabel ?? "Отмена"}
            </Button>
            <Button variant={dialog.danger ? "danger" : "primary"} onClick={() => close(true)} autoFocus>
              {dialog.confirmLabel}
            </Button>
          </div>
        </Modal>
      )}
    </FeedbackContext.Provider>
  );
}

/* ---------- Окно: на телефоне — шторка снизу, на компьютере — по центру ---------- */

export function Modal({ children, onClose, label, wide }: { children: ReactNode; onClose: () => void; label: string; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const first = ref.current?.querySelector<HTMLElement>("[autofocus], input, textarea, button");
    first?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 md:items-center md:p-6" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onMouseDown={(e) => e.stopPropagation()}
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-float md:rounded-[28px] ${
          wide ? "md:max-w-[640px]" : "md:max-w-[460px]"
        }`}
      >
        <span className="mx-auto mb-4 block h-1.5 w-10 rounded-full bg-line md:hidden" aria-hidden="true" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-4 right-4 hidden size-10 cursor-pointer items-center justify-center rounded-full text-ink-2 hover:bg-sand/60 md:flex"
        >
          <CloseIcon size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
