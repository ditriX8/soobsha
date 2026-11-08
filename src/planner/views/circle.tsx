"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BackIcon,
  CheckIcon,
  DotsIcon,
  FlagIcon,
  InfoIcon,
  LinkIcon,
  LockIcon,
  LogOutIcon,
  MessageIcon,
  PlusIcon,
  SendIcon,
  SettingsIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/icons";
import { Avatar, Button, Chip, EmptyState, IconButton, Toggle } from "@/components/ui";
import { plural } from "@/lib/format";
import { useAccount } from "../auth";
import { api, useCircle, type CircleData } from "../data";
import { Modal, useFeedback } from "../feedback";
import { circleProgress, dueInfo, formatCode, formatDate, inviteLink, personalProgress, taskRights, TELEGRAM_RE, timeAgo, todayISO } from "../logic";
import { ActionMenu, ContactWarning, Field, ReportDialog, TextArea, TextInput } from "../parts";
import { back, go } from "../router";
import type { PublicProfile, Task } from "../types";

type Tab = "plan" | "members" | "talk" | "about";

const unknown = (id: string | null): PublicProfile => ({ id: id ?? "", nickname: "бывший участник", tone: "surface", about: "", city: "", interests: [], skills: [], shares_circle: false });

export function CircleView({ id }: { id: string }) {
  const { me } = useAccount();
  const { data, status, error, online, live, reload, reloadPart, patchTask } = useCircle(id, me!.id);
  const [tab, setTab] = useState<Tab>("plan");

  if (status === "loading") {
    return (
      <main className="mx-auto w-full max-w-[880px] flex-1 px-4 pt-5 md:px-8" aria-busy="true" aria-label="Загрузка круга">
        <div className="mt-16 h-56 animate-pulse rounded-[28px] bg-forest/30" />
        <div className="mt-5 h-12 animate-pulse rounded-full bg-surface/70" />
        <div className="mt-5 h-64 animate-pulse rounded-3xl bg-surface/70" />
      </main>
    );
  }
  if (status !== "ok" || !data) {
    return (
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-10">
        <EmptyState
          title={status === "missing" ? "Круг недоступен" : "Не удалось загрузить круг"}
          text={status === "missing" ? "Его закрыли, вас удалили из него, или ссылка неверная." : (error ?? "")}
          icon={<InfoIcon />}
        >
          {status === "error" && <Button onClick={reload}>Повторить</Button>}
          <Button variant="secondary" onClick={() => go("#my")}>
            К моим кругам
          </Button>
        </EmptyState>
      </main>
    );
  }

  const isOwner = data.circle.owner_id === me!.id;
  const profile = (uid: string | null) => (uid && data.profiles[uid]) || unknown(uid);
  const tabs: { id: Tab; label: string }[] = [
    { id: "plan", label: "План" },
    { id: "members", label: `Участники · ${data.members.length}` },
    { id: "talk", label: "Обсуждение" },
    { id: "about", label: "О круге" },
  ];

  return (
    <main className="mx-auto w-full max-w-[880px] flex-1 px-4 pt-5 pb-28 sm:px-5 md:px-8 md:pt-8 md:pb-16">
      <Header data={data} isOwner={isOwner} online={online} live={live} profile={profile} onTab={setTab} />
      <div role="tablist" aria-label="Разделы круга" className="no-scrollbar mt-5 flex gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-11 flex-1 shrink-0 cursor-pointer rounded-full px-4 text-[15px] font-semibold whitespace-nowrap ${tab === t.id ? "bg-ink text-surface" : "text-ink-2 hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-5" role="tabpanel">
        {tab === "plan" && <PlanTab data={data} isOwner={isOwner} profile={profile} patchTask={patchTask} reloadTasks={() => reloadPart("tasks")} />}
        {tab === "members" && <MembersTab data={data} isOwner={isOwner} online={online} profile={profile} reloadInvites={() => reloadPart("invites")} />}
        {tab === "talk" && <TalkTab data={data} isOwner={isOwner} profile={profile} onSettings={() => setTab("about")} />}
        {tab === "about" && <AboutTab data={data} isOwner={isOwner} profile={profile} />}
      </div>
    </main>
  );
}

type ProfileFn = (uid: string | null) => PublicProfile;

/* ---------- Шапка ---------- */

function Header({ data, isOwner, online, live, profile, onTab }: { data: CircleData; isOwner: boolean; online: string[]; live: boolean; profile: ProfileFn; onTab: (t: Tab) => void }) {
  const { toast, confirm } = useFeedback();
  const [menu, setMenu] = useState(false);
  const c = data.circle;
  const pr = circleProgress(c, data.tasks);

  const leave = async () => {
    const heir = data.members.find((m) => m.user_id !== c.owner_id);
    const ok = await confirm({
      title: "Выйти из круга?",
      text: isOwner
        ? heir
          ? `Вы создатель. Роль перейдёт к @${profile(heir.user_id).nickname}. Ваши незавершённые задачи станут свободными.`
          : "Вы единственный участник — круг закроется."
        : "Ваши незавершённые задачи станут свободными. Вернуться можно по новому приглашению.",
      confirmLabel: "Выйти",
      cancelLabel: "Остаться",
      danger: true,
    });
    if (!ok) return;
    const r = await api.leave(c.id);
    if (!r.ok) return toast(r.error, "error");
    toast(r.data === "closed" ? "Вы вышли, круг закрыт" : "Вы вышли из круга", "success");
    go("#my");
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <IconButton label="Назад" onClick={() => back("#my")}>
          <BackIcon />
        </IconButton>
        <span className="flex items-center gap-2 text-[13px] text-ink-3" title={live ? "Изменения участников появляются сразу" : "Подключаемся…"}>
          <span className={`size-2 rounded-full ${live ? "bg-forest" : "bg-sun"}`} aria-hidden="true" />
          {live ? "синхронизировано" : "подключаемся…"}
        </span>
        <IconButton label="Меню круга" onClick={() => setMenu(true)}>
          <DotsIcon />
        </IconButton>
      </div>
      <section className="flex flex-col gap-4 rounded-[28px] bg-forest p-6 text-surface md:p-8">
        <div className="flex items-center justify-between gap-3 text-[13px] font-medium text-mint">
          <span>
            до {formatDate(c.deadline)} · {pr.daysLeft >= 0 ? `осталось ${pr.daysLeft} ${plural(pr.daysLeft, "день", "дня", "дней")}` : "срок прошёл"}
          </span>
          {isOwner && <span>вы создатель</span>}
        </div>
        <h1 className="font-display text-[26px] leading-[1.15] font-medium tracking-[-0.03em] md:text-[34px]">{c.title}</h1>
        {c.goal && <p className="text-mint">{c.goal}</p>}
        <div className="h-3 overflow-hidden rounded-full bg-forest-700" role="img" aria-label={`Общий прогресс ${pr.pct}%`}>
          <div className="h-full rounded-full bg-sun transition-[width] duration-500" style={{ width: `${pr.pct}%` }} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold" data-testid="circle-progress">
            {pr.total ? `Выполнено ${pr.done} из ${pr.total} · ${pr.pct}%` : "Задач пока нет"}
          </span>
          {pr.behind > 0 && pr.daysLeft >= 0 && <span className="text-mint">по времени отстаём на {pr.behind} {plural(pr.behind, "задачу", "задачи", "задач")}</span>}
        </div>
        <button type="button" onClick={() => onTab("members")} className="flex w-fit cursor-pointer items-center gap-3 rounded-full text-left">
          <span className="flex">
            {data.members.slice(0, 6).map((m, i) => (
              <span key={m.user_id} className={`relative ${i ? "-ml-2.5" : ""}`}>
                <Avatar letter={profile(m.user_id).nickname[0]} tone={profile(m.user_id).tone} size={32} ring="ring-forest" />
                {online.includes(m.user_id) && <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-sun ring-2 ring-forest" />}
              </span>
            ))}
          </span>
          <span className="text-sm font-medium">
            {data.members.length} из {c.capacity} · онлайн {online.length}
          </span>
        </button>
      </section>

      {menu && (
        <ActionMenu
          title={c.title}
          onClose={() => setMenu(false)}
          items={[
            ...(isOwner ? [{ label: "Пригласить участников", hint: "ссылка или код", icon: <LinkIcon size={20} />, onSelect: () => onTab("members") }] : []),
            ...(data.telegram ? [{ label: "Открыть Telegram-группу", icon: <MessageIcon size={20} />, onSelect: () => onTab("talk") }] : []),
            { label: isOwner ? "Настройки круга" : "О круге", icon: <SettingsIcon size={20} />, onSelect: () => onTab("about") },
            { label: "Выйти из круга", hint: "задачи останутся у участников", icon: <LogOutIcon size={20} />, danger: true, onSelect: leave },
          ]}
        />
      )}
    </>
  );
}

/* ---------- План ---------- */

type Filter = "all" | "mine" | "free" | "late" | "done";

function PlanTab({ data, isOwner, profile, patchTask, reloadTasks }: { data: CircleData; isOwner: boolean; profile: ProfileFn; patchTask: (id: string, p: Partial<Task>) => void; reloadTasks: () => void }) {
  const { me } = useAccount();
  const { toast } = useFeedback();
  const [filter, setFilter] = useState<Filter>("all");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [assignee, setAssignee] = useState<string>("");
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const uid = me!.id;
  const today = todayISO();

  const counts = useMemo(
    () => ({
      all: data.tasks.filter((t) => t.status === "todo").length,
      mine: data.tasks.filter((t) => t.status === "todo" && t.assignee_id === uid).length,
      free: data.tasks.filter((t) => t.status === "todo" && !t.assignee_id).length,
      late: data.tasks.filter((t) => t.status === "todo" && t.due_date && t.due_date < today).length,
      done: data.tasks.filter((t) => t.status === "done").length,
    }),
    [data.tasks, uid, today],
  );

  const byDue = (a: Task, b: Task) => (a.due_date ?? "9999") .localeCompare(b.due_date ?? "9999") || a.created_at.localeCompare(b.created_at);
  const match = (t: Task) =>
    filter === "all" ? true : filter === "mine" ? t.assignee_id === uid : filter === "free" ? !t.assignee_id : filter === "late" ? !!t.due_date && t.due_date < today && t.status === "todo" : t.status === "done";
  const open = data.tasks.filter((t) => t.status === "todo" && match(t));
  const pinned = open.filter((t) => t.pinned).sort(byDue);
  const rest = open.filter((t) => !t.pinned).sort(byDue);
  const done = data.tasks.filter((t) => t.status === "done" && (filter === "all" || filter === "done" || match(t))).sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    if (t.length > 120) return toast("Название задачи — не больше 120 символов", "error");
    setBusy(true);
    const r = await api.addTask(data.circle.id, { title: t, due_date: due || null, assignee_id: assignee || null });
    setBusy(false);
    if (!r.ok) return toast(r.error, "error");
    setTitle("");
    setDue("");
    setAssignee("");
    reloadTasks();
    toast("Задача добавлена", "success");
  };

  const toggle = async (t: Task) => {
    const next = t.status === "done" ? "todo" : "done";
    patchTask(t.id, { status: next, completed_by: next === "done" ? uid : null });
    const r = await api.updateTask(t.id, { status: next });
    if (!r.ok) {
      patchTask(t.id, { status: t.status, completed_by: t.completed_by });
      toast(r.error, "error");
    } else if (next === "done") toast(`Готово: «${t.title}»`, "success");
  };

  const openTask = data.tasks.find((t) => t.id === openId) ?? null;
  const filters: [Filter, string][] = [
    ["all", "Все"],
    ["mine", "Мои"],
    ["free", "Свободные"],
    ["late", "Просроченные"],
    ["done", "Готово"],
  ];

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={add} className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4 shadow-card">
        <div className="flex gap-2">
          <label htmlFor="new-task" className="sr-only">
            Новая задача
          </label>
          <input
            id="new-task"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setMore(true)}
            placeholder="Новая задача…"
            className="min-h-12 min-w-0 flex-1 rounded-2xl border-[1.5px] border-line bg-paper px-4 text-base outline-none focus:border-forest"
          />
          <Button type="submit" aria-label="Добавить задачу" disabled={busy || !title.trim()} className="!px-4">
            <PlusIcon size={20} /> <span className="hidden sm:inline">Добавить</span>
          </Button>
        </div>
        {more && (
          <div className="flex flex-wrap gap-2">
            <label className="flex min-h-11 items-center gap-2 rounded-full bg-paper px-3.5 text-sm text-ink-2">
              Срок
              <input type="date" value={due} min={today} onChange={(e) => setDue(e.target.value)} className="bg-transparent text-ink outline-none" aria-label="Срок задачи" />
            </label>
            <label className="flex min-h-11 items-center gap-2 rounded-full bg-paper px-3.5 text-sm text-ink-2">
              Кто
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="max-w-40 bg-transparent text-ink outline-none" aria-label="Ответственный">
                <option value="">никто</option>
                {data.members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user_id === uid ? "я" : "@" + profile(m.user_id).nickname}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </form>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Фильтр задач">
        {filters.map(([f, label]) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className="shrink-0 cursor-pointer rounded-full">
            <Chip tone={filter === f ? "ink" : "outline"}>
              {label} · {counts[f]}
            </Chip>
          </button>
        ))}
      </div>

      {data.tasks.length === 0 ? (
        <EmptyState title="План пока пустой" text="Разбейте цель на конкретные задачи: что сделать, кто отвечает, к какому сроку. Начните с первой — она уже наверху." icon={<CheckIcon />} />
      ) : (
        <>
          {filter !== "done" && pinned.length > 0 && (
            <section aria-label="Закреплённые">
              <h2 className="mb-2 text-xs font-semibold tracking-[0.06em] text-ink-3 uppercase">Закреплено</h2>
              <ul className="flex flex-col gap-2">
                {pinned.map((t) => (
                  <TaskRow key={t.id} t={t} data={data} profile={profile} onToggle={toggle} onOpen={setOpenId} />
                ))}
              </ul>
            </section>
          )}
          {filter !== "done" && (
            <section aria-label="Задачи">
              {pinned.length > 0 && rest.length > 0 && <h2 className="mb-2 text-xs font-semibold tracking-[0.06em] text-ink-3 uppercase">Остальные</h2>}
              {rest.length === 0 && pinned.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-line bg-surface/60 p-5 text-center text-[15px] text-ink-2">
                  {filter === "mine" ? "На вас пока ничего не назначено. Возьмите свободную задачу!" : filter === "late" ? "Просроченных задач нет — отлично!" : filter === "free" ? "Свободных задач нет." : "Все задачи выполнены 🎉"}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {rest.map((t) => (
                    <TaskRow key={t.id} t={t} data={data} profile={profile} onToggle={toggle} onOpen={setOpenId} />
                  ))}
                </ul>
              )}
            </section>
          )}
          {done.length > 0 && (filter === "all" || filter === "done") && (
            <section aria-label="Выполненные">
              {filter === "all" ? (
                <button type="button" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone} className="mb-2 cursor-pointer text-sm font-semibold text-forest">
                  {showDone ? "Скрыть выполненные" : `Показать выполненные · ${done.length}`}
                </button>
              ) : null}
              {(showDone || filter === "done") && (
                <ul className="flex flex-col gap-2">
                  {done.map((t) => (
                    <TaskRow key={t.id} t={t} data={data} profile={profile} onToggle={toggle} onOpen={setOpenId} />
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      {openTask && <TaskSheet t={openTask} data={data} isOwner={isOwner} profile={profile} onClose={() => setOpenId(null)} onToggle={toggle} patchTask={patchTask} reloadTasks={reloadTasks} />}
    </div>
  );
}

function TaskRow({ t, data, profile, onToggle, onOpen }: { t: Task; data: CircleData; profile: ProfileFn; onToggle: (t: Task) => void; onOpen: (id: string) => void }) {
  const { me } = useAccount();
  const rights = taskRights(t, me!.id, data.circle.owner_id);
  const due = dueInfo(t.due_date, t.status === "done");
  const comments = data.comments.filter((c) => c.task_id === t.id).length;
  const who = t.assignee_id ? profile(t.assignee_id) : null;
  const done = t.status === "done";
  return (
    <li className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${t.pinned && !done ? "border-sun bg-sun-soft" : "border-line bg-surface"}`} data-testid="task">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`${done ? "Вернуть в работу" : "Отметить выполненной"}: ${t.title}`}
        disabled={!rights.toggle}
        title={rights.toggle ? undefined : "Отметить может ответственный или создатель круга"}
        onClick={() => onToggle(t)}
        className={`flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed`}
      >
        <span className={`flex size-7 items-center justify-center rounded-full border-2 transition-colors ${done ? "border-forest bg-forest text-surface" : rights.toggle ? "border-ink-3 bg-surface" : "border-line bg-paper"}`}>
          {done && <CheckIcon size={16} />}
        </span>
      </button>
      <button type="button" onClick={() => onOpen(t.id)} className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-0.5 py-1 text-left">
        <span className={`w-full truncate text-[15px] font-medium ${done ? "text-ink-3 line-through" : ""}`}>{t.title}</span>
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[13px] text-ink-3">
          {t.pinned && <span className="font-semibold text-ink">закреплено</span>}
          {due && <span className={due.tone === "late" ? "font-semibold text-danger" : due.tone === "soon" ? "font-semibold text-ink" : ""}>{due.label}</span>}
          <span>{who ? (who.id === me!.id ? "вы" : "@" + who.nickname) : "свободна"}</span>
          {comments > 0 && (
            <span className="flex items-center gap-1">
              <MessageIcon size={13} /> {comments}
            </span>
          )}
        </span>
      </button>
      {who && <Avatar letter={who.nickname[0]} tone={who.tone} size={30} />}
    </li>
  );
}

function TaskSheet({
  t,
  data,
  isOwner,
  profile,
  onClose,
  onToggle,
  patchTask,
  reloadTasks,
}: {
  t: Task;
  data: CircleData;
  isOwner: boolean;
  profile: ProfileFn;
  onClose: () => void;
  onToggle: (t: Task) => void;
  patchTask: (id: string, p: Partial<Task>) => void;
  reloadTasks: () => void;
}) {
  const { me, blocks, reported } = useAccount();
  const { toast, confirm } = useFeedback();
  const uid = me!.id;
  const rights = taskRights(t, uid, data.circle.owner_id);
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(t.title);
  const [notes, setNotes] = useState(t.notes);
  const [due, setDue] = useState(t.due_date ?? "");
  const [comment, setComment] = useState("");
  const [report, setReport] = useState<{ id: string; author: string } | null>(null);
  const comments = data.comments.filter((c) => c.task_id === t.id && !blocks.includes(c.author_id) && !reported.has(c.id));

  const save = async (patch: Partial<Task>, msg = "Сохранено") => {
    const before = { ...t };
    patchTask(t.id, patch);
    const r = await api.updateTask(t.id, patch);
    if (!r.ok) {
      patchTask(t.id, before);
      toast(r.error, "error");
      return false;
    }
    toast(msg, "success");
    return true;
  };

  const sendComment = async () => {
    const body = comment.trim();
    if (!body) return;
    const r = await api.addComment(t, body);
    if (!r.ok) return toast(r.error, "error");
    setComment("");
  };

  return (
    <Modal onClose={onClose} label={t.title} wide>
      <div className="flex items-start gap-3 pr-8">
        <button
          type="button"
          role="checkbox"
          aria-checked={t.status === "done"}
          aria-label={t.status === "done" ? "Вернуть в работу" : "Отметить выполненной"}
          disabled={!rights.toggle}
          onClick={() => onToggle(t)}
          className="mt-0.5 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed"
        >
          <span className={`flex size-8 items-center justify-center rounded-full border-2 ${t.status === "done" ? "border-forest bg-forest text-surface" : "border-ink-3"}`}>{t.status === "done" && <CheckIcon size={18} />}</span>
        </button>
        {edit ? (
          <label className="flex-1">
            <span className="sr-only">Название</span>
            <TextInput value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          </label>
        ) : (
          <h2 className={`flex-1 font-display text-xl leading-[1.3] font-medium tracking-[-0.01em] ${t.status === "done" ? "text-ink-3 line-through" : ""}`}>{t.title}</h2>
        )}
      </div>

      <dl className="mt-5 grid gap-3 rounded-2xl bg-paper p-4 text-[15px] sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold text-ink-3 uppercase">Ответственный</dt>
          <dd className="mt-1">
            {rights.assign ? (
              <select
                aria-label="Ответственный"
                value={t.assignee_id ?? ""}
                onChange={(e) => save({ assignee_id: e.target.value || null }, e.target.value ? "Ответственный назначен" : "Задача стала свободной")}
                className="min-h-10 w-full rounded-xl border border-line bg-surface px-3"
              >
                <option value="">никто (свободна)</option>
                {data.members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user_id === uid ? "я" : "@" + profile(m.user_id).nickname}
                  </option>
                ))}
              </select>
            ) : t.assignee_id ? (
              "@" + profile(t.assignee_id).nickname
            ) : (
              <Button size="sm" variant="secondary" onClick={() => save({ assignee_id: uid }, "Задача ваша")}>
                Взять себе
              </Button>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-ink-3 uppercase">Срок</dt>
          <dd className="mt-1">
            {rights.edit ? (
              <input
                type="date"
                aria-label="Срок"
                value={due}
                onChange={(e) => {
                  setDue(e.target.value);
                  save({ due_date: e.target.value || null }, e.target.value ? "Срок обновлён" : "Срок убран");
                }}
                className="min-h-10 w-full rounded-xl border border-line bg-surface px-3"
              />
            ) : t.due_date ? (
              formatDate(t.due_date)
            ) : (
              "без срока"
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        {edit ? (
          <Field id="task-notes" label="Описание">
            <TextArea id="task-notes" max={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        ) : t.notes ? (
          <p className="text-[15px] leading-[1.6] whitespace-pre-wrap">{t.notes}</p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {rights.edit &&
          (edit ? (
            <>
              <Button
                size="sm"
                onClick={async () => {
                  if (!title.trim()) return toast("Название не может быть пустым", "error");
                  if (await save({ title: title.trim(), notes })) setEdit(false);
                }}
              >
                Сохранить
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEdit(false)}>
                Отмена
              </Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setEdit(true)}>
              Редактировать
            </Button>
          ))}
        {rights.pin && (
          <Button size="sm" variant="secondary" onClick={() => save({ pinned: !t.pinned }, t.pinned ? "Откреплено" : "Закреплено наверху")}>
            {t.pinned ? "Открепить" : "Закрепить"}
          </Button>
        )}
        {rights.remove && (
          <Button
            size="sm"
            variant="dangerSoft"
            onClick={async () => {
              if (!(await confirm({ title: "Удалить задачу?", text: "Вместе с комментариями. Отменить нельзя.", confirmLabel: "Удалить", danger: true }))) return;
              const r = await api.deleteTask(t.id);
              if (!r.ok) return toast(r.error, "error");
              reloadTasks();
              onClose();
              toast("Задача удалена", "info");
            }}
          >
            <TrashIcon size={16} /> Удалить
          </Button>
        )}
      </div>
      <p className="mt-3 text-xs text-ink-3">
        Создал(а) {t.created_by === uid ? "вы" : "@" + profile(t.created_by).nickname} · {timeAgo(t.created_at)}
        {t.status === "done" && t.completed_by && ` · выполнил(а) ${t.completed_by === uid ? "вы" : "@" + profile(t.completed_by).nickname}`}
        {!rights.edit && " · менять могут автор, ответственный и создатель круга"}
        {isOwner && ""}
      </p>

      <section className="mt-5 border-t border-line pt-4">
        <h3 className="mb-3 font-semibold">Обсуждение задачи · {comments.length}</h3>
        <ul className="flex flex-col gap-2.5">
          {comments.map((c) => {
            const a = profile(c.author_id);
            const mine = c.author_id === uid;
            return (
              <li key={c.id} className="flex gap-2.5" data-testid="comment">
                <Avatar letter={a.nickname[0]} tone={a.tone} size={30} />
                <div className="min-w-0 flex-1 rounded-2xl bg-paper px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold">{mine ? "Вы" : "@" + a.nickname}</span>
                    <span className="text-xs text-ink-3">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-[15px] leading-[1.5] whitespace-pre-wrap">{c.body}</p>
                  <button
                    type="button"
                    className="mt-1 cursor-pointer text-xs font-semibold text-ink-3 underline underline-offset-2"
                    onClick={async () => {
                      if (mine || isOwner) {
                        if (!(await confirm({ title: "Удалить комментарий?", confirmLabel: "Удалить", danger: true }))) return;
                        const r = await api.deleteComment(c.id);
                        if (!r.ok) toast(r.error, "error");
                      } else setReport({ id: c.id, author: c.author_id });
                    }}
                  >
                    {mine || isOwner ? "удалить" : "пожаловаться"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex items-end gap-2">
          <label htmlFor="comment" className="sr-only">
            Комментарий
          </label>
          <textarea
            id="comment"
            rows={1}
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Вопрос или уточнение по задаче…"
            className="min-h-11 min-w-0 flex-1 resize-none rounded-2xl border-[1.5px] border-line bg-paper px-4 py-2.5 text-[15px] outline-none focus:border-forest"
          />
          <Button size="sm" onClick={sendComment} disabled={!comment.trim()}>
            Отправить
          </Button>
        </div>
        <div className="mt-2">
          <ContactWarning text={comment} />
        </div>
      </section>
      {report && (
        <ReportDialog
          title="Пожаловаться на комментарий"
          subtitle={"@" + profile(report.author).nickname}
          targetType="comment"
          targetId={report.id}
          authorId={report.author}
          authorNick={profile(report.author).nickname}
          onClose={() => setReport(null)}
        />
      )}
    </Modal>
  );
}

/* ---------- Участники и приглашения ---------- */

function MembersTab({ data, isOwner, online, profile, reloadInvites }: { data: CircleData; isOwner: boolean; online: string[]; profile: ProfileFn; reloadInvites: () => void }) {
  const { me } = useAccount();
  const { toast, confirm } = useFeedback();
  const [busy, setBusy] = useState(false);
  const uid = me!.id;
  const active = data.invites.filter((i) => !i.revoked_at && new Date(i.expires_at) > new Date() && (i.max_uses === null || i.uses < i.max_uses));
  const full = data.members.length >= data.circle.capacity;

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${what} скопирован${what === "Ссылка" ? "а" : ""}`, "success");
    } catch {
      toast("Браузер не дал скопировать — выделите вручную", "error");
    }
  };

  const createInvite = async () => {
    setBusy(true);
    const r = await api.createInvite(data.circle.id, 7);
    setBusy(false);
    if (!r.ok) return toast(r.error, "error");
    reloadInvites();
    toast("Приглашение создано — отправьте ссылку или код", "success");
  };

  return (
    <div className="flex flex-col gap-5">
      {isOwner && (
        <section className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5 shadow-card" aria-label="Приглашения">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-medium">Пригласить участников</h2>
            <Button size="sm" onClick={createInvite} disabled={busy || full}>
              <LinkIcon size={16} /> {active.length ? "Новое приглашение" : "Создать приглашение"}
            </Button>
          </div>
          {full && <p className="text-sm text-ink-2">Все места заняты. Увеличьте размер круга в «О круге», чтобы пригласить ещё.</p>}
          {active.length === 0 ? (
            <p className="text-[15px] text-ink-2">Создайте приглашение и отправьте ссылку или код друзьям в любом мессенджере. Оно действует 7 дней.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {active.map((i) => (
                <li key={i.id} className="flex flex-col gap-3 rounded-2xl bg-paper p-4" data-testid="invite">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display text-2xl tracking-[0.1em]" data-testid="invite-code">
                      {formatCode(i.code)}
                    </span>
                    <span className="text-[13px] text-ink-3">
                      до {formatDate(i.expires_at)} · использовано {i.uses}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => copy(inviteLink(i.code), "Ссылка")}>
                      <LinkIcon size={16} /> Скопировать ссылку
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => copy(formatCode(i.code), "Код")}>
                      Скопировать код
                    </Button>
                    {typeof navigator !== "undefined" && "share" in navigator && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigator.share({ title: data.circle.title, text: `Присоединяйся к кругу «${data.circle.title}» в «Сообща». Код: ${formatCode(i.code)}`, url: inviteLink(i.code) }).catch(() => {})}
                      >
                        Поделиться
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="!text-danger"
                      onClick={async () => {
                        if (!(await confirm({ title: "Отозвать приглашение?", text: "Ссылка и код перестанут работать. Уже вступившие останутся.", confirmLabel: "Отозвать", danger: true }))) return;
                        const r = await api.revokeInvite(i.id);
                        if (!r.ok) return toast(r.error, "error");
                        reloadInvites();
                        toast("Приглашение отозвано", "info");
                      }}
                    >
                      Отозвать
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-medium">
          Участники · {data.members.length} из {data.circle.capacity}
        </h2>
        <ul className="overflow-hidden rounded-3xl border border-line bg-surface">
          {data.members.map((m) => {
            const p = profile(m.user_id);
            const isMe = m.user_id === uid;
            const pp = personalProgress(data.tasks, m.user_id);
            return (
              <li key={m.user_id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0" data-testid="member">
                <a href={isMe ? "#profile" : `#u-${m.user_id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="relative">
                    <Avatar letter={p.nickname[0]} tone={p.tone} size={42} />
                    {online.includes(m.user_id) && <span className="absolute right-0 bottom-0 size-3 rounded-full bg-forest ring-2 ring-surface" title="сейчас в круге" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{isMe ? `Вы (@${p.nickname})` : `@${p.nickname}`}</span>
                    <span className="text-[13px] text-ink-3">
                      {m.role === "owner" ? "создатель · " : ""}
                      {pp.total ? `задачи: ${pp.done} из ${pp.total}` : "задач пока нет"}
                    </span>
                    {pp.total > 0 && (
                      <span className="mt-1.5 block h-1.5 max-w-48 overflow-hidden rounded-full bg-line" aria-hidden="true">
                        <span className="block h-full rounded-full bg-forest" style={{ width: `${Math.round((pp.done / pp.total) * 100)}%` }} />
                      </span>
                    )}
                  </span>
                </a>
                {isOwner && !isMe && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!text-danger hover:!bg-coral-soft"
                    onClick={async () => {
                      if (!(await confirm({ title: `Удалить @${p.nickname} из круга?`, text: "Его незавершённые задачи станут свободными.", confirmLabel: "Удалить", danger: true }))) return;
                      const r = await api.removeMember(data.circle.id, m.user_id);
                      if (r.ok) toast(`@${p.nickname} удалён из круга`, "info");
                      else toast(r.error, "error");
                    }}
                  >
                    Удалить
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {data.members.length === 1 && <p className="mt-1 text-sm text-ink-3">Пока здесь только вы. {isOwner ? "Создайте приглашение выше." : ""}</p>}
      </section>
    </div>
  );
}

/* ---------- Обсуждение ---------- */

function TalkTab({ data, isOwner, profile, onSettings }: { data: CircleData; isOwner: boolean; profile: ProfileFn; onSettings: () => void }) {
  const { me, blocks, reported } = useAccount();
  const { toast, confirm } = useFeedback();
  const [text, setText] = useState("");
  const [report, setReport] = useState<{ id: string; author: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const uid = me!.id;
  const messages = data.messages.filter((m) => !blocks.includes(m.author_id) && !reported.has(m.id));

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    const r = await api.sendMessage(data.circle.id, body);
    if (!r.ok) {
      setText(body);
      toast(r.error, "error");
    }
  };

  const openTelegram = async () => {
    const ok = await confirm({
      title: "Перейти в Telegram?",
      text: "Там действуют правила Telegram: наши жалобы, блокировки и приватность профиля не работают.",
      confirmLabel: "Открыть",
    });
    if (ok && data.telegram) window.open(data.telegram, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col gap-3">
      {data.telegram && (
        <div className="flex flex-col gap-3 rounded-3xl bg-lilac-soft p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-semibold">Группа круга в Telegram</p>
            <p className="text-sm text-ink-2">Ссылка видна только участникам.</p>
          </div>
          <Button variant="secondary" onClick={openTelegram}>
            Открыть в Telegram
          </Button>
        </div>
      )}
      {!data.circle.chat_enabled ? (
        <EmptyState title="Чат выключен" text={data.telegram ? "Участники общаются в Telegram-группе. Вопросы по задачам — в комментариях к ним." : "Создатель выключил чат. Обсуждайте задачи в комментариях к ним."} icon={<MessageIcon />}>
          {isOwner && (
            <Button variant="secondary" onClick={onSettings}>
              Включить в настройках
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <p className="text-[13px] text-ink-3">Небольшой общий чат для договорённостей. Вопросы по конкретной задаче удобнее обсуждать в её комментариях.</p>
          <div className="flex max-h-[55vh] min-h-48 flex-col gap-3 overflow-y-auto rounded-3xl border border-line bg-surface p-4" aria-label="Сообщения" aria-live="polite">
            {messages.length === 0 && <p className="m-auto text-sm text-ink-3">Сообщений пока нет. Напишите первым!</p>}
            {messages.map((m) => {
              const a = profile(m.author_id);
              const mine = m.author_id === uid;
              return (
                <div key={m.id} className={`flex max-w-[85%] gap-2 ${mine ? "flex-row-reverse self-end" : ""}`} data-testid="chat-message">
                  {!mine && <Avatar letter={a.nickname[0]} tone={a.tone} size={30} />}
                  <div className={`rounded-2xl px-3.5 py-2.5 ${mine ? "bg-forest text-surface" : "bg-paper"}`}>
                    {!mine && <p className="text-xs font-semibold text-ink-2">@{a.nickname}</p>}
                    <p className="text-[15px] leading-[1.45] break-words whitespace-pre-wrap">{m.body}</p>
                    <div className={`mt-1 flex items-center gap-3 text-[11px] ${mine ? "text-mint" : "text-ink-3"}`}>
                      {timeAgo(m.created_at)}
                      <button
                        type="button"
                        className="cursor-pointer font-semibold underline underline-offset-2"
                        onClick={async () => {
                          if (mine || isOwner) {
                            if (!(await confirm({ title: "Удалить сообщение?", confirmLabel: "Удалить", danger: true }))) return;
                            const r = await api.deleteMessage(m.id);
                            if (!r.ok) toast(r.error, "error");
                          } else setReport({ id: m.id, author: m.author_id });
                        }}
                      >
                        {mine || isOwner ? "удалить" : "пожаловаться"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <label htmlFor="chat-input" className="sr-only">
              Сообщение
            </label>
            <textarea
              id="chat-input"
              value={text}
              rows={1}
              maxLength={1000}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Сообщение участникам"
              className="min-h-12 min-w-0 flex-1 resize-none rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-base outline-none focus:border-forest"
            />
            <button type="submit" aria-label="Отправить сообщение" disabled={!text.trim()} className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-forest text-surface disabled:cursor-not-allowed disabled:opacity-50">
              <SendIcon />
            </button>
          </form>
          <ContactWarning text={text} />
        </>
      )}
      {report && (
        <ReportDialog
          title="Пожаловаться на сообщение"
          subtitle={"@" + profile(report.author).nickname}
          targetType="message"
          targetId={report.id}
          authorId={report.author}
          authorNick={profile(report.author).nickname}
          onClose={() => setReport(null)}
        />
      )}
    </div>
  );
}

/* ---------- О круге и настройки ---------- */

const ACTIVITY: Record<string, string> = {
  circle_created: "создал(а) круг",
  task_created: "добавил(а) задачу",
  task_done: "выполнил(а) задачу",
  member_joined: "вступил(а) в круг",
  member_left: "вышел(вышла) из круга",
  member_removed: "удалил(а) участника",
};

function AboutTab({ data, isOwner, profile }: { data: CircleData; isOwner: boolean; profile: ProfileFn }) {
  const { me } = useAccount();
  const { toast } = useFeedback();
  const c = data.circle;
  const [f, setF] = useState({ title: c.title, goal: c.goal, description: c.description, deadline: c.deadline, capacity: c.capacity, telegram: data.telegram ?? "" });
  const [busy, setBusy] = useState(false);
  const owner = profile(c.owner_id);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.title.trim().length < 3) return toast("Название — минимум 3 символа", "error");
    if (f.deadline < c.start_date) return toast("Срок не может быть раньше старта круга", "error");
    if (f.capacity < data.members.length) return toast(`В круге уже ${data.members.length} участников — размер не может быть меньше`, "error");
    if (f.telegram.trim() && !TELEGRAM_RE.test(f.telegram.trim())) return toast("Ссылка на Telegram должна выглядеть как https://t.me/…", "error");
    setBusy(true);
    const r1 = await api.updateCircle(c.id, { title: f.title.trim(), goal: f.goal.trim(), description: f.description.trim(), deadline: f.deadline, capacity: f.capacity });
    const r2 = r1.ok ? await api.setTelegram(c.id, f.telegram.trim() || null) : r1;
    setBusy(false);
    if (!r2.ok) return toast(r2.error, "error");
    toast("Настройки круга сохранены", "success");
  };

  return (
    <div className="flex flex-col gap-4">
      {isOwner ? (
        <form onSubmit={save} className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 shadow-card">
          <h2 className="font-display text-lg font-medium">Настройки круга</h2>
          <Field id="c-title" label="Название">
            <TextInput id="c-title" value={f.title} maxLength={80} onChange={(e) => setF({ ...f, title: e.target.value })} />
          </Field>
          <Field id="c-goal" label="Цель">
            <TextInput id="c-goal" value={f.goal} maxLength={200} onChange={(e) => setF({ ...f, goal: e.target.value })} />
          </Field>
          <Field id="c-desc" label="Описание">
            <TextArea id="c-desc" max={1000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="c-deadline" label="Срок">
              <TextInput id="c-deadline" type="date" value={f.deadline} min={c.start_date} onChange={(e) => setF({ ...f, deadline: e.target.value })} />
            </Field>
            <Field id="c-cap" label={`Участников: до ${f.capacity}`}>
              <input id="c-cap" type="range" min={2} max={12} value={f.capacity} onChange={(e) => setF({ ...f, capacity: Number(e.target.value) })} className="h-12 w-full accent-[#1E5C4A]" />
            </Field>
          </div>
          <Field id="c-tg" label="Ссылка на Telegram-группу" hint="Видна только участникам. Оставьте пустым, если не нужна.">
            <TextInput id="c-tg" value={f.telegram} onChange={(e) => setF({ ...f, telegram: e.target.value })} placeholder="https://t.me/…" inputMode="url" />
          </Field>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3">
            <span>
              <span className="block font-semibold">Чат круга</span>
              <span className="text-[13px] text-ink-3">Выключите, если общаетесь в Telegram</span>
            </span>
            <Toggle
              label="Чат круга"
              checked={c.chat_enabled}
              onChange={async (v) => {
                const r = await api.updateCircle(c.id, { chat_enabled: v });
                if (r.ok) toast(v ? "Чат включён" : "Чат выключен", "success");
                else toast(r.error, "error");
              }}
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Сохраняем…" : "Сохранить"}
          </Button>
        </form>
      ) : (
        <dl className="overflow-hidden rounded-3xl border border-line bg-surface">
          {[
            ["Цель", c.goal || "—"],
            ["Срок", `${formatDate(c.start_date)} — ${formatDate(c.deadline)}`],
            ["Участников", `до ${c.capacity}`],
            ["Создатель", "@" + owner.nickname],
            ["Чат", c.chat_enabled ? "включён" : "выключен"],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 border-b border-line px-5 py-3.5 last:border-b-0 sm:flex-row sm:gap-4">
              <dt className="w-32 shrink-0 text-sm font-semibold text-ink-3">{k}</dt>
              <dd className="text-[15px]">{v}</dd>
            </div>
          ))}
          {c.description && <p className="border-t border-line px-5 py-4 text-[15px] leading-[1.6] whitespace-pre-wrap">{c.description}</p>}
        </dl>
      )}

      <section className="rounded-3xl border border-line bg-surface p-5">
        <h2 className="mb-3 font-display text-lg font-medium">Последние события</h2>
        {data.activity.length === 0 ? (
          <p className="text-[15px] text-ink-2">Пока ничего не происходило.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {data.activity.map((a) => (
              <li key={a.id} className="flex items-start gap-2.5 text-[15px]">
                <UsersIcon size={16} className="mt-1 shrink-0 text-ink-3" />
                <span>
                  <b>{a.actor_id === me!.id ? "Вы" : "@" + profile(a.actor_id).nickname}</b> {ACTIVITY[a.kind] ?? a.kind}
                  {a.title && ` «${a.title}»`} <span className="text-[13px] text-ink-3">· {timeAgo(a.created_at)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-start gap-2 text-[13px] text-ink-3">
        <LockIcon size={16} className="mt-0.5 shrink-0" /> Круг видят только участники. Нашли нарушение? Пожалуйтесь на комментарий или сообщение — <FlagIcon size={14} className="inline" /> решение примет модератор.
      </p>
    </div>
  );
}
