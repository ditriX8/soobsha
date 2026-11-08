"use client";

import { useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { ArrowRightIcon, CloseIcon, InfoIcon } from "@/components/icons";
import { AvatarStack, Button, Chip, WeekBar } from "@/components/ui";
import { plural } from "@/lib/format";
import { useFeedback, Modal } from "./feedback";
import { currentWeek, formatDate, freeSeats, looksLikeContacts } from "./logic";
import { topicTone } from "./seed";
import { useStore } from "./store";
import type { Circle, ReportReason } from "./types";

/* ---------- Карточка круга ---------- */

export function CircleCard({ circle }: { circle: Circle }) {
  const { state, me } = useStore();
  const free = freeSeats(circle);
  const week = currentWeek(circle);
  const isMember = !!me && circle.members.includes(me.id);
  const people = circle.members.slice(0, 4).map((id) => {
    const p = state.people[id];
    return { letter: p?.nickname[0] ?? "?", tone: p?.tone ?? "surface" };
  });
  return (
    <article className="relative flex flex-col gap-4 rounded-[28px] border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-float" data-testid="circle-card">
      <div className="flex items-center justify-between gap-3">
        <Chip tone={topicTone(circle.topic)}>{circle.topic}</Chip>
        <span className="text-[13px] font-medium text-ink-3">
          {isMember ? "вы участник" : circle.joinMode === "approval" ? "по заявке" : "открытый"}
        </span>
      </div>
      <h3 className="font-display text-xl leading-[1.3] font-medium tracking-[-0.01em]">
        <a href={`#circle-${circle.id}`} className="after:absolute after:inset-0 after:rounded-[28px] focus-visible:outline-none">
          {circle.title}
        </a>
      </h3>
      <p className="line-clamp-3 text-[15px] leading-[1.55] text-ink-2">{circle.description || circle.goal}</p>
      <div className="flex items-center gap-3">
        <WeekBar total={circle.weeks} done={Math.max(0, week - 1)} current={week > 0 ? week - 1 : -1} className="w-20" />
        <span className="text-[13px] font-medium whitespace-nowrap text-ink-2">
          {week === 0 ? `${circle.weeks} нед. · старт ${formatDate(circle.startDate)}` : week > circle.weeks ? "завершён" : `неделя ${week} из ${circle.weeks}`}
        </span>
      </div>
      <div className="mt-auto flex items-center gap-3 border-t border-line pt-4">
        <AvatarStack people={people} size={36} />
        <span className="text-sm font-medium">
          {circle.members.length} из {circle.capacity}
          {free > 0 ? ` · ${free} ${plural(free, "место", "места", "мест")}` : " · мест нет"}
        </span>
        <span className="ml-auto flex size-10 items-center justify-center rounded-full bg-mint text-forest" aria-hidden="true">
          <ArrowRightIcon size={18} />
        </span>
      </div>
    </article>
  );
}

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
  onClose,
}: {
  title: string;
  subtitle: string;
  targetType: "step" | "comment" | "message" | "user";
  targetId: string;
  authorId: string;
  onClose: () => void;
}) {
  const { actions, state } = useStore();
  const { toast } = useFeedback();
  const [reason, setReason] = useState<ReportReason>("spam");
  const [alsoBlock, setAlsoBlock] = useState(targetType === "user");
  const author = state.people[authorId];

  const submit = () => {
    const r = actions.report(targetType, targetId, reason);
    if (!r.ok) {
      toast(r.error, "error");
      return;
    }
    if (alsoBlock) actions.block(authorId);
    toast(
      `Жалоба сохранена${alsoBlock ? `, @${author?.nickname} заблокирован` : ""}. ${targetType === "user" ? "" : "Публикация скрыта у вас. "}В демо нет модератора — жалоба хранится только в браузере.`,
      "success",
    );
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
            <span className="block font-semibold">Также заблокировать @{author?.nickname}</span>
            <span className="text-sm text-ink-3">Вы перестанете видеть его публикации, он не сможет вступить в ваши круги</span>
          </span>
        </label>
      )}
      <Button variant="danger" className="mt-5 w-full" onClick={submit}>
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
