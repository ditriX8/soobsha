"use client";

import { useState } from "react";
import { CheckIcon, InfoIcon } from "@/components/icons";
import { Button, Chip } from "@/components/ui";
import { plural } from "@/lib/format";
import { useFeedback } from "../feedback";
import { formatDate, todayISO, validateDraftStep, type CircleDraft } from "../logic";
import { ContactWarning, Field, TagInput, TextArea, TextInput } from "../parts";
import { go, takeReturnTo } from "../router";
import { TOPICS } from "../seed";
import { Page, PageTitle } from "../shell";
import { useStore } from "../store";

/* ---------- Демо-вход ---------- */

export function LoginView() {
  const { actions, me } = useStore();
  const { toast } = useFeedback();
  const [nick, setNick] = useState("");
  const [age, setAge] = useState(false);
  const [error, setError] = useState<{ field: "nick" | "age"; text: string } | null>(null);

  if (me) {
    return (
      <Page narrow>
        <PageTitle title="Вы уже вошли" fallback="#my" />
        <p className="text-ink-2">
          Вы в демо-режиме как <b>@{me.nickname}</b>.
        </p>
        <Button className="mt-5" onClick={() => go("#my")}>
          К моим кругам
        </Button>
      </Page>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = actions.enterDemo(nick, age);
    if (!r.ok) {
      setError({ field: r.error.includes("16") ? "age" : "nick", text: r.error });
      return;
    }
    toast(`Добро пожаловать, @${nick.trim()}! Все поля профиля закрыты — откройте только то, что хотите.`, "success");
    go(takeReturnTo());
  };

  return (
    <Page narrow>
      <PageTitle title="Вход в демо-режим" />
      <div className="mb-6 flex items-start gap-3 rounded-3xl bg-sun-soft p-5 text-[15px] leading-[1.55]">
        <InfoIcon className="mt-0.5 shrink-0" />
        <p>
          <b>Это не настоящая регистрация.</b> Пароль и почта не нужны: профиль создаётся только в этом браузере, чтобы вы могли попробовать все функции. Настоящий вход появится вместе с сервером.
        </p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-6 shadow-card" noValidate>
        <Field id="nick" label="Никнейм" error={error?.field === "nick" ? error.text : undefined} hint="3–20 символов: латиница, цифры или «_». Его будут видеть участники ваших кругов.">
          <TextInput
            id="nick"
            value={nick}
            autoComplete="off"
            autoCapitalize="none"
            invalid={error?.field === "nick"}
            onChange={(e) => {
              setNick(e.target.value);
              setError(null);
            }}
            placeholder="например, dima_builds"
          />
        </Field>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={age}
            onChange={(e) => {
              setAge(e.target.checked);
              setError(null);
            }}
            className="mt-0.5 size-5 accent-[#1E5C4A]"
            aria-invalid={error?.field === "age" || undefined}
          />
          <span>Мне есть 16 лет. Дату рождения мы не спрашиваем.</span>
        </label>
        {error?.field === "age" && (
          <p className="-mt-3 text-sm font-medium text-danger" role="alert">
            {error.text}
          </p>
        )}
        <Button type="submit" size="lg">
          Войти в демо
        </Button>
      </form>
    </Page>
  );
}

/* ---------- Создание круга ---------- */

const emptyDraft = (): CircleDraft => ({
  title: "",
  goal: "",
  description: "",
  topic: "",
  tags: [],
  weeks: 6,
  capacity: 5,
  startDate: todayISO(),
  joinMode: "approval",
});

export function NewCircleView() {
  const { actions } = useStore();
  const { toast } = useFeedback();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [d, setD] = useState<CircleDraft>(emptyDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof CircleDraft, string>>>({});
  const set = <K extends keyof CircleDraft>(k: K, v: CircleDraft[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const next = () => {
    const e = validateDraftStep(d, step);
    setErrors(e);
    if (Object.keys(e).length) {
      toast("Проверьте поля, отмеченные красным", "error");
      return;
    }
    setStep((s) => (s < 3 ? ((s + 1) as 2 | 3) : s));
    window.scrollTo({ top: 0 });
  };

  const create = () => {
    const e = validateDraftStep(d, 3);
    if (Object.keys(e).length) {
      setErrors(e);
      setStep(e.title || e.goal || e.topic || e.description ? 1 : 2);
      toast("Проверьте поля, отмеченные красным", "error");
      return;
    }
    const r = actions.createCircle(d);
    if (!r.ok) return toast(r.error, "error");
    toast(`Круг «${d.title.trim()}» создан!`, "success");
    go(`#circle-${r.id}`);
  };

  return (
    <Page narrow>
      <PageTitle title="Собрать круг" fallback="#my" sub={`Шаг ${step} из 3 · ${["", "Цель", "Срок и размер", "Формат и проверка"][step]}`} />
      <ol className="mb-6 flex gap-2" aria-label="Шаги формы">
        {[1, 2, 3].map((n) => (
          <li key={n} className={`h-2 flex-1 rounded-full ${n <= step ? "bg-forest" : "bg-line"}`} aria-current={n === step ? "step" : undefined} />
        ))}
      </ol>

      <div className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 shadow-card md:p-7">
        {step === 1 && (
          <>
            <Field id="title" label="Название круга" error={errors.title} hint="Например: «Python с нуля за 6 недель»">
              <TextInput id="title" value={d.title} maxLength={80} invalid={!!errors.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field id="goal" label="Цель — чего хотите добиться к концу" error={errors.goal}>
              <TextInput id="goal" value={d.goal} maxLength={200} invalid={!!errors.goal} onChange={(e) => set("goal", e.target.value)} placeholder="Например: написать первый проект" />
            </Field>
            <Field id="description" label="Описание (необязательно)" error={errors.description}>
              <TextArea id="description" max={1000} value={d.description} invalid={!!errors.description} onChange={(e) => set("description", e.target.value)} placeholder="Как будете работать, кого ждёте, что нужно уметь" />
            </Field>
            <ContactWarning text={d.description} />
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 text-[15px] font-semibold">Тема</legend>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button key={t.name} type="button" aria-pressed={d.topic === t.name} className="cursor-pointer rounded-full" onClick={() => set("topic", t.name)}>
                    <Chip tone={d.topic === t.name ? "ink" : "outline"}>{t.name}</Chip>
                  </button>
                ))}
              </div>
              {errors.topic && (
                <p className="text-sm font-medium text-danger" role="alert">
                  {errors.topic}
                </p>
              )}
            </fieldset>
            <Field id="tags" label="Теги (необязательно)" hint="Помогают найти круг и подбирать его по интересам. До 5 тегов.">
              <TagInput id="tags" value={d.tags} max={5} onChange={(v) => set("tags", v)} placeholder="Например: Python" />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field id="weeks" label={`Срок: ${d.weeks} ${plural(d.weeks, "неделя", "недели", "недель")}`} error={errors.weeks} hint="От 2 до 12 недель. Каждую неделю участники делают шаг.">
              <input id="weeks" type="range" min={2} max={12} value={d.weeks} onChange={(e) => set("weeks", Number(e.target.value))} className="h-11 w-full accent-[#1E5C4A]" />
            </Field>
            <Field id="capacity" label={`Размер: до ${d.capacity} человек`} error={errors.capacity} hint="От 3 до 8 — чтобы все знали друг друга.">
              <input id="capacity" type="range" min={3} max={8} value={d.capacity} onChange={(e) => set("capacity", Number(e.target.value))} className="h-11 w-full accent-[#1E5C4A]" />
            </Field>
            <Field id="start" label="Дата старта" error={errors.startDate} hint="Не раньше сегодня и не позже чем через 60 дней.">
              <TextInput id="start" type="date" value={d.startDate} min={todayISO()} invalid={!!errors.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 text-[15px] font-semibold">Как вступать</legend>
              {(
                [
                  ["approval", "По заявке", "Вы одобряете каждого участника. Рекомендуем."],
                  ["open", "Открытый", "Люди вступают сразу, пока есть места."],
                ] as const
              ).map(([v, title, hint]) => (
                <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-2xl border-[1.5px] px-4 py-3.5 ${d.joinMode === v ? "border-forest bg-mint" : "border-line bg-paper"}`}>
                  <input type="radio" name="mode" checked={d.joinMode === v} onChange={() => set("joinMode", v)} className="mt-1 size-5 accent-[#1E5C4A]" />
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="text-sm text-ink-2">{hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <section className="rounded-2xl bg-paper p-4">
              <h2 className="mb-2 font-semibold">Проверьте</h2>
              <dl className="flex flex-col gap-1.5 text-[15px]">
                {[
                  ["Название", d.title],
                  ["Цель", d.goal],
                  ["Тема", d.topic],
                  ["Срок", `${d.weeks} ${plural(d.weeks, "неделя", "недели", "недель")}, старт ${d.startDate ? formatDate(d.startDate) : "—"}`],
                  ["Размер", `до ${d.capacity} человек`],
                  ["Теги", d.tags.join(", ") || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <dt className="w-24 shrink-0 text-ink-3">{k}</dt>
                    <dd className="min-w-0 break-words">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </>
        )}

        <div className="flex gap-2.5 pt-1">
          {step > 1 && (
            <Button variant="secondary" className="flex-1" onClick={() => setStep((s) => (s - 1) as 1 | 2)}>
              Назад
            </Button>
          )}
          {step < 3 ? (
            <Button className="flex-1" onClick={next}>
              Далее
            </Button>
          ) : (
            <Button className="flex-1" onClick={create}>
              <CheckIcon size={18} /> Создать круг
            </Button>
          )}
        </div>
      </div>
    </Page>
  );
}
