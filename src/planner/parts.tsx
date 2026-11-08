"use client";

import { useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { CloseIcon, InfoIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { useAccount } from "./auth";
import { useFeedback, Modal } from "./feedback";
import { looksLikeContacts } from "./logic";
import type { ReportReason, ReportTarget } from "./types";

/* ---------- Поля форм ---------- */

export function Field({ label, error, hint, children, id }: { label: string; error?: string; hint?: ReactNode; children: ReactNode; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-[13px] text-ink-3">{hint}</p>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-base outline-none placeholder:text-ink-3 focus:border-forest aria-[invalid=true]:border-danger";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const { invalid, className = "", ...rest } = props;
  return <input aria-invalid={invalid || undefined} aria-describedby={invalid ? `${rest.id}-error` : undefined} className={`${inputClass} min-h-12 ${className}`} {...rest} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean; max: number }) {
  const { invalid, max, className = "", value, ...rest } = props;
  const len = String(value ?? "").length;
  return (
    <div className="relative">
      <textarea
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${rest.id}-error` : undefined}
        className={`${inputClass} min-h-28 resize-y pb-7 ${className}`}
        value={value}
        {...rest}
      />
      <span className={`pointer-events-none absolute right-4 bottom-2.5 text-xs ${len > max ? "font-semibold text-danger" : "text-ink-3"}`}>
        {len} / {max}
      </span>
    </div>
  );
}

/** Мягкое предупреждение, если в тексте похоже на контакты. */
export function ContactWarning({ text }: { text: string }) {
  if (!looksLikeContacts(text)) return null;
  return (
    <p className="flex items-start gap-2 rounded-2xl bg-sun-soft px-3.5 py-2.5 text-sm text-ink" role="note">
      <InfoIcon size={18} className="mt-0.5 shrink-0" />
      Похоже на контакты. Не публикуйте телефоны, почту и ссылки на мессенджеры — общайтесь внутри круга.
    </p>
  );
}

/* ---------- Ввод тегов ---------- */

export function TagInput({ id, value, onChange, max = 10, placeholder }: { id: string; value: string[]; onChange: (v: string[]) => void; max?: number; placeholder: string }) {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim().replace(/,$/, "");
    if (!t) return;
    if (t.length > 30) return;
    if (value.some((v) => v.toLowerCase() === t.toLowerCase()) || value.length >= max) {
      setText("");
      return;
    }
    onChange([...value, t]);
    setText("");
  };
  return (
    <div className="flex flex-col gap-2.5">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Добавленные">
          {value.map((t) => (
            <li key={t}>
              <span className="inline-flex items-center gap-1 rounded-full bg-mint py-1.5 pr-1.5 pl-3.5 text-sm font-medium text-forest-700">
                {t}
                <button type="button" aria-label={`Удалить «${t}»`} onClick={() => onChange(value.filter((x) => x !== t))} className="flex size-6 cursor-pointer items-center justify-center rounded-full hover:bg-forest/10">
                  <CloseIcon size={14} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <TextInput
          id={id}
          value={text}
          placeholder={value.length >= max ? `Не больше ${max}` : placeholder}
          disabled={value.length >= max}
          maxLength={30}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button variant="secondary" onClick={add} disabled={!text.trim() || value.length >= max}>
          Добавить
        </Button>
      </div>
    </div>
  );
}

/* ---------- Жалоба ---------- */

const REASONS: [ReportReason, string][] = [
  ["spam", "Спам или реклама"],
  ["abuse", "Оскорбления или травля"],
  ["fraud", "Мошенничество"],
  ["personal", "Чужие личные данные или контакты"],
  ["inappropriate", "Неприемлемый контент"],
  ["other", "Другое"],
];

export function ReportDialog({
  title,
  subtitle,
  targetType,
  targetId,
  authorId,
  authorNick,
  onClose,
}: {
  title: string;
  subtitle: string;
  targetType: ReportTarget;
  targetId: string;
  authorId: string;
  authorNick: string;
  onClose: () => void;
}) {
  const { report, block } = useAccount();
  const { toast } = useFeedback();
  const [reason, setReason] = useState<ReportReason>("spam");
  const [alsoBlock, setAlsoBlock] = useState(targetType === "user");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const r = await report(targetType, targetId, reason);
    if (!r.ok) {
      setBusy(false);
      toast(r.error, "error");
      return;
    }
    if (alsoBlock) await block(authorId);
    toast(`Жалоба отправлена модератору${alsoBlock ? `, @${authorNick} заблокирован` : ""}.${targetType === "user" ? "" : " У вас это скрыто."}`, "success");
    onClose();
  };

  return (
    <Modal onClose={onClose} label={title}>
      <h2 className="font-display text-xl font-medium tracking-[-0.01em]">{title}</h2>
      <p className="mt-1 text-sm text-ink-3">{subtitle}</p>
      <fieldset className="mt-5 flex flex-col gap-2">
        <legend className="sr-only">Причина</legend>
        {REASONS.map(([value, label]) => (
          <label
            key={value}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] px-4 py-3 font-medium ${reason === value ? "border-coral bg-coral-soft" : "border-transparent bg-paper"}`}
          >
            <input type="radio" name="reason" value={value} checked={reason === value} onChange={() => setReason(value)} className="size-5 accent-[#B23A26]" />
            {label}
          </label>
        ))}
      </fieldset>
      {targetType !== "user" && (
        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} className="mt-0.5 size-5 accent-[#1E5C4A]" />
          <span>
            <span className="block font-semibold">Также заблокировать @{authorNick}</span>
            <span className="text-sm text-ink-3">Вы перестанете видеть его комментарии и сообщения</span>
          </span>
        </label>
      )}
      <Button variant="danger" className="mt-5 w-full" onClick={submit} disabled={busy}>
        Отправить жалобу
      </Button>
      <p className="mt-3 text-center text-xs leading-[1.5] text-ink-3">
        Жалоба не удаляет контент для всех: решение принимает модератор. Автор не узнает, кто пожаловался.
      </p>
    </Modal>
  );
}

/** Меню действий (шторка): список пунктов. */
export function ActionMenu({ title, items, onClose }: { title: string; items: { label: string; hint?: string; icon?: ReactNode; danger?: boolean; onSelect: () => void }[]; onClose: () => void }) {
  return (
    <Modal onClose={onClose} label={title}>
      <h2 className="mb-4 pr-10 font-display text-lg font-medium tracking-[-0.01em]">{title}</h2>
      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <li key={it.label}>
            <button
              type="button"
              onClick={() => {
                onClose();
                it.onSelect();
              }}
              className={`flex w-full cursor-pointer items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left ${it.danger ? "bg-coral-soft text-danger" : "bg-paper hover:bg-sand/60"}`}
            >
              {it.icon && <span className={it.danger ? "text-danger" : "text-ink-2"}>{it.icon}</span>}
              <span className="flex flex-col">
                <span className="font-semibold">{it.label}</span>
                {it.hint && <span className={`text-[13px] ${it.danger ? "text-ink-2" : "text-ink-3"}`}>{it.hint}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
