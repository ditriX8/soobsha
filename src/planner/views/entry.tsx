"use client";

import { useEffect, useState } from "react";
import { CirclesIcon, InfoIcon, LockIcon, PlusIcon, SearchIcon, UsersIcon } from "@/components/icons";
import { Button, ButtonLink, EmptyState } from "@/components/ui";
import { plural } from "@/lib/format";
import { useAccount } from "../auth";
import { api, useMyCircles } from "../data";
import { useFeedback } from "../feedback";
import { addDays, circleProgress, formatDate, personalProgress, TELEGRAM_RE, todayISO } from "../logic";
import { ContactWarning, Field, TextArea, TextInput } from "../parts";
import { go, setReturnTo, takeReturnTo } from "../router";
import { Page, PageTitle } from "../shell";

/* ---------- Вход ---------- */

export function LoginView() {
  const { me, session, quickSignIn } = useAccount();
  const { toast } = useFeedback();
  const [nick, setNick] = useState("");
  const [age, setAge] = useState(false);
  const [error, setError] = useState<{ field: "nick" | "age"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (me) {
    return (
      <Page narrow>
        <PageTitle title="Вы уже вошли" fallback="#my" />
        <p className="text-ink-2">
          Вы вошли как <b>@{me.nickname}</b>.
        </p>
        <Button className="mt-5" onClick={() => go("#my")}>
          К моим кругам
        </Button>
      </Page>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!age) {
      setError({ field: "age", text: "Подтвердите, что вам есть 16 лет" });
      return;
    }
    setBusy(true);
    const r = await quickSignIn(nick);
    setBusy(false);
    if (!r.ok) {
      setError({ field: "nick", text: r.error });
      return;
    }
    toast(`Добро пожаловать, @${nick.trim()}!`, "success");
    go(takeReturnTo());
  };

  return (
    <Page narrow>
      <PageTitle title={session ? "Выберите никнейм" : "Вход"} />
      <form onSubmit={submit} className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-6 shadow-card" noValidate>
        <div>
          <h2 className="font-display text-lg font-medium">Быстрый вход</h2>
          <p className="mt-1 text-[15px] text-ink-2">Только никнейм — без почты, телефона и пароля.</p>
        </div>
        <Field id="nick" label="Никнейм" error={error?.field === "nick" ? error.text : undefined} hint="3–20 символов: латиница, цифры или «_». Его увидят участники ваших кругов.">
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
          />
          <span>Мне есть 16 лет. Дату рождения мы не спрашиваем.</span>
        </label>
        {error?.field === "age" && (
          <p className="-mt-3 text-sm font-medium text-danger" role="alert">
            {error.text}
          </p>
        )}
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Входим…" : "Войти"}
        </Button>
        <p className="flex items-start gap-2 rounded-2xl bg-sun-soft px-4 py-3 text-sm leading-[1.5]">
          <InfoIcon size={18} className="mt-0.5 shrink-0" />
          Аккаунт привязан к этому браузеру. Если очистить данные браузера или войти с другого устройства, доступ к нему пропадёт. Вход через Google, который работает везде, появится скоро.
        </p>
      </form>
    </Page>
  );
}

/* ---------- Вступление по приглашению ---------- */

type Preview = { circle_id: string | null; title: string | null; goal: string | null; owner_nickname: string | null; members: number; capacity: number; already_member: boolean; problem: string | null };

export function JoinView({ code: initial }: { code?: string }) {
  const { me } = useAccount();
  const { toast } = useFeedback();
  const [code, setCode] = useState(initial ?? "");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async (c: string) => {
    setBusy(true);
    setError(null);
    const r = await api.previewInvite(c);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    const p = r.data[0];
    if (!p?.circle_id) return setError(p?.problem ?? "Приглашение не найдено");
    setPreview(p);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- проверяем код из ссылки сразу
    if (me && initial) check(initial);
  }, [me, initial]);

  if (!me) {
    return (
      <Page narrow>
        <PageTitle title="Приглашение в круг" />
        <EmptyState title="Войдите, чтобы вступить" text="Это займёт 10 секунд: только никнейм, без почты и телефона." icon={<UsersIcon />}>
          <Button
            onClick={() => {
              setReturnTo(initial ? `#join-${initial}` : "#join");
              go("#login");
            }}
          >
            Войти и продолжить
          </Button>
        </EmptyState>
      </Page>
    );
  }

  const join = async () => {
    setBusy(true);
    const r = await api.joinByCode(code || initial || "");
    setBusy(false);
    if (!r.ok) return setError(r.error);
    toast(`Вы в круге «${preview?.title}»!`, "success");
    go(`#circle-${r.data}`);
  };

  return (
    <Page narrow>
      <PageTitle title="Вступить по приглашению" fallback="#my" />
      {!preview ? (
        <form
          className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-6 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            check(code);
          }}
        >
          <Field id="code" label="Код приглашения" error={error ?? undefined} hint="8 символов, например K7Q4-MX2A. Его даёт создатель круга.">
            <TextInput
              id="code"
              value={code}
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={12}
              invalid={!!error}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="XXXX-XXXX"
              className="font-display tracking-[0.12em]"
            />
          </Field>
          <Button type="submit" disabled={busy || code.replace(/[^A-Za-z0-9]/g, "").length < 8}>
            <SearchIcon size={18} /> {busy ? "Проверяем…" : "Найти круг"}
          </Button>
        </form>
      ) : (
        <section className="flex flex-col gap-4 rounded-[28px] bg-forest p-6 text-surface md:p-8">
          <p className="text-sm text-mint">Вас приглашает @{preview.owner_nickname}</p>
          <h2 className="font-display text-[26px] leading-[1.15] font-medium tracking-[-0.03em]">{preview.title}</h2>
          {preview.goal && <p className="text-mint">{preview.goal}</p>}
          <p className="text-sm">
            Участников: {preview.members} из {preview.capacity}
          </p>
          {preview.already_member ? (
            <Button variant="accent" onClick={() => go(`#circle-${preview.circle_id}`)}>
              Вы уже в этом круге — открыть
            </Button>
          ) : preview.problem ? (
            <p role="alert" className="rounded-2xl bg-forest-700 px-4 py-3 font-semibold">
              {preview.problem}
            </p>
          ) : (
            <Button variant="accent" onClick={join} disabled={busy}>
              {busy ? "Вступаем…" : "Вступить в круг"}
            </Button>
          )}
          {error && (
            <p role="alert" className="rounded-2xl bg-danger px-4 py-3 font-semibold">
              {error}
            </p>
          )}
          <p className="text-[13px] text-mint">Участники круга увидят ваш никнейм. Остальные поля профиля — только если вы их откроете.</p>
        </section>
      )}
    </Page>
  );
}

/* ---------- Мои круги ---------- */

export function MyCirclesView() {
  const { me } = useAccount();
  const { circles, error, reload } = useMyCircles(me!.id);

  return (
    <Page>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[30px] leading-[1.1] font-medium tracking-[-0.045em] md:text-[40px]">Мои круги</h1>
          <p className="mt-2 text-ink-2">Привет, @{me!.nickname}!</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="#join" variant="secondary">
            Ввести код
          </ButtonLink>
          <ButtonLink href="#new">
            <PlusIcon size={18} /> Создать круг
          </ButtonLink>
        </div>
      </div>

      {error ? (
        <EmptyState title="Не удалось загрузить круги" text={error} icon={<InfoIcon />}>
          <Button onClick={reload}>Повторить</Button>
        </EmptyState>
      ) : circles === null ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Загрузка">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-[28px] bg-surface/70" />
          ))}
        </div>
      ) : circles.length === 0 ? (
        <EmptyState title="Пока ни одного круга" text="Создайте круг и пригласите друзей — или введите код, который вам прислали." icon={<CirclesIcon />}>
          <ButtonLink href="#new">Создать круг</ButtonLink>
          <ButtonLink href="#join" variant="secondary">
            Ввести код
          </ButtonLink>
        </EmptyState>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {circles.map((c) => {
            const pr = circleProgress(c, c.tasks);
            const mine = personalProgress(c.tasks, me!.id);
            return (
              <article key={c.id} className="relative flex flex-col gap-4 rounded-[28px] border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-float" data-testid="circle-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-forest-700">до {formatDate(c.deadline)}</span>
                  {c.owner_id === me!.id && <span className="text-[13px] font-medium text-ink-3">вы создатель</span>}
                </div>
                <h2 className="font-display text-xl leading-[1.3] font-medium tracking-[-0.01em]">
                  <a href={`#circle-${c.id}`} className="after:absolute after:inset-0 after:rounded-[28px]">
                    {c.title}
                  </a>
                </h2>
                {c.goal && <p className="line-clamp-2 text-[15px] text-ink-2">{c.goal}</p>}
                <div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`Выполнено ${pr.pct}%`}>
                    <div className="h-full rounded-full bg-forest" style={{ width: `${pr.pct}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-ink-2">
                    {pr.total ? `Выполнено ${pr.done} из ${pr.total}` : "Задач пока нет"}
                    {mine.total > 0 && ` · мои: ${mine.done} из ${mine.total}`}
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-3 border-t border-line pt-4 text-sm font-medium">
                  <UsersIcon size={18} className="text-ink-3" />
                  {c.members.length} {plural(c.members.length, "участник", "участника", "участников")}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Page>
  );
}

/* ---------- Создание круга ---------- */

export function NewCircleView() {
  const { toast } = useFeedback();
  const [f, setF] = useState({ title: "", goal: "", description: "", deadline: addDays(todayISO(), 30), capacity: 6, telegram: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string | number) => {
    setF((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (f.title.trim().length < 3) e.title = "Название — минимум 3 символа";
    if (f.title.trim().length > 80) e.title = "Название — не больше 80 символов";
    if (f.goal.length > 200) e.goal = "Цель — не больше 200 символов";
    if (f.description.length > 1000) e.description = "Описание — не больше 1000 символов";
    if (!f.deadline) e.deadline = "Укажите срок";
    else if (f.deadline < todayISO()) e.deadline = "Срок не может быть в прошлом";
    if (f.telegram.trim() && !TELEGRAM_RE.test(f.telegram.trim())) e.telegram = "Ссылка должна выглядеть как https://t.me/название_группы";
    return e;
  };

  const create = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.values(e).some(Boolean)) return toast("Проверьте поля, отмеченные красным", "error");
    setBusy(true);
    const r = await api.createCircle({ ...f, telegram: f.telegram.trim() });
    setBusy(false);
    if (!r.ok) return toast(r.error, "error");
    toast(`Круг «${f.title.trim()}» создан! Теперь пригласите участников.`, "success");
    go(`#circle-${r.data}`);
  };

  return (
    <Page narrow>
      <PageTitle title="Создать круг" fallback="#my" sub="Цель, срок и кого вы ждёте. Всё можно поменять позже." />
      <form onSubmit={create} noValidate className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 shadow-card md:p-7">
        <Field id="title" label="Название" error={errors.title} hint="Например: «Переезд в новый офис» или «Готовимся к IELTS»">
          <TextInput id="title" value={f.title} maxLength={80} invalid={!!errors.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field id="goal" label="Цель (необязательно)" error={errors.goal} hint="Чего хотите добиться к сроку">
          <TextInput id="goal" value={f.goal} maxLength={200} invalid={!!errors.goal} onChange={(e) => set("goal", e.target.value)} />
        </Field>
        <Field id="description" label="Описание (необязательно)" error={errors.description}>
          <TextArea id="description" max={1000} value={f.description} invalid={!!errors.description} onChange={(e) => set("description", e.target.value)} placeholder="Как будете работать, договорённости" />
        </Field>
        <ContactWarning text={f.description} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="deadline" label="Срок" error={errors.deadline}>
            <TextInput id="deadline" type="date" value={f.deadline} min={todayISO()} invalid={!!errors.deadline} onChange={(e) => set("deadline", e.target.value)} />
          </Field>
          <Field id="capacity" label={`Участников: до ${f.capacity}`} hint="От 2 до 12 человек">
            <input id="capacity" type="range" min={2} max={12} value={f.capacity} onChange={(e) => set("capacity", Number(e.target.value))} className="h-12 w-full accent-[#1E5C4A]" />
          </Field>
        </div>
        <Field id="telegram" label="Ссылка на Telegram-группу (необязательно)" error={errors.telegram} hint="Видна только участникам. Если общаетесь там, чат в круге можно выключить.">
          <TextInput id="telegram" value={f.telegram} invalid={!!errors.telegram} onChange={(e) => set("telegram", e.target.value)} placeholder="https://t.me/…" inputMode="url" />
        </Field>
        <p className="flex items-start gap-2 text-[13px] text-ink-3">
          <LockIcon size={16} className="mt-0.5 shrink-0" /> Круг видят только участники. Вступить можно только по вашему приглашению.
        </p>
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Создаём…" : "Создать круг"}
        </Button>
      </form>
    </Page>
  );
}
