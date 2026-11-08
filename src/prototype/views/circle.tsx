"use client";

import { useEffect, useRef, useState } from "react";
import {
  BackIcon,
  BanIcon,
  BellIcon,
  BookIcon,
  DotsIcon,
  FlagIcon,
  HeartIcon,
  InfoIcon,
  LinkIcon,
  LockIcon,
  LogOutIcon,
  MessageIcon,
  SendIcon,
  SparkIcon,
  TrashIcon,
} from "@/components/icons";
import { Avatar, AvatarStack, Button, ButtonLink, Chip, EmptyState, IconButton, WeekBar } from "@/components/ui";
import { plural } from "@/lib/format";
import { Modal, useFeedback } from "../feedback";
import { currentWeek, formatDate, freeSeats, timeAgo } from "../logic";
import { ActionMenu, ContactWarning, ReportDialog, TextArea } from "../parts";
import { back, go, setReturnTo } from "../router";
import { useStore } from "../store";
import type { Circle, Comment, Step } from "../types";

const RULES = [
  "Уважайте друг друга: без оскорблений и давления.",
  "Не публикуйте контакты и чужие личные данные — общайтесь внутри круга.",
  "Шаг недели — честный короткий отчёт, а не идеальный результат.",
  "Реклама и спам запрещены.",
  "Если что-то не так — пожалуйтесь или заблокируйте, модератор разберётся.",
];

type Tab = "steps" | "members" | "chat" | "about";

export function CircleView({ id }: { id: string }) {
  const { state, me } = useStore();
  const circle = state.circles.find((c) => c.id === id);
  const [tab, setTab] = useState<Tab>("steps");

  if (!circle) {
    return (
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-10">
        <EmptyState title="Круг не найден" text="Возможно, его закрыли или ссылка неверная." icon={<InfoIcon />}>
          <ButtonLink href="#catalog">Перейти в каталог</ButtonLink>
        </EmptyState>
      </main>
    );
  }

  const isMember = !!me && circle.members.includes(me.id);
  const isOwner = !!me && circle.ownerId === me.id;
  const pendingCount = state.requests.filter((r) => r.circleId === circle.id && r.status === "pending").length;

  const tabs: { id: Tab; label: string }[] = [
    { id: "steps", label: "Шаги" },
    { id: "members", label: isOwner && pendingCount ? `Участники · ${pendingCount}` : "Участники" },
    { id: "chat", label: "Чат" },
    { id: "about", label: "О круге" },
  ];

  return (
    <main className="mx-auto w-full max-w-[880px] flex-1 px-4 pt-5 pb-28 sm:px-5 md:px-8 md:pt-8 md:pb-16">
      <CircleHeader circle={circle} isMember={isMember} isOwner={isOwner} />
      <JoinBar circle={circle} isMember={isMember} />

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
        {tab === "steps" && (isMember ? <StepsTab circle={circle} /> : <MembersOnly what="Шаги участников" />)}
        {tab === "members" && <MembersTab circle={circle} isMember={isMember} isOwner={isOwner} />}
        {tab === "chat" && (isMember ? <ChatTab circle={circle} /> : <MembersOnly what="Чат круга" />)}
        {tab === "about" && <AboutTab circle={circle} />}
      </div>
    </main>
  );
}

function MembersOnly({ what }: { what: string }) {
  return <EmptyState title={`${what} видят только участники`} text="Так участники могут честно делиться трудностями. Вступите в круг, чтобы читать и писать." icon={<LockIcon />} />;
}

/* ---------- Шапка круга ---------- */

function CircleHeader({ circle, isMember, isOwner }: { circle: Circle; isMember: boolean; isOwner: boolean }) {
  const { state, me, actions } = useStore();
  const { toast, confirm } = useFeedback();
  const [menu, setMenu] = useState(false);
  const [rules, setRules] = useState(false);
  const [invite, setInvite] = useState(false);
  const [reportPick, setReportPick] = useState(false);
  const [reportUser, setReportUser] = useState<string | null>(null);
  const week = currentWeek(circle);
  const muted = state.mutedCircles.includes(circle.id);
  const people = circle.members.slice(0, 5).map((pid) => ({ letter: state.people[pid]?.nickname[0] ?? "?", tone: state.people[pid]?.tone ?? "surface" }));

  const leave = async () => {
    let reason = "";
    const ok = await confirm({
      title: "Выйти из круга?",
      text: isOwner
        ? circle.members.length > 1
          ? `Вы создатель. Роль перейдёт к @${state.people[circle.members.find((m) => m !== me!.id)!]?.nickname}. Ваши шаги останутся у участников.`
          : "Вы единственный участник — круг закроется."
        : "Ваши шаги останутся у участников. Вернуться можно, если будут свободные места.",
      confirmLabel: "Выйти",
      cancelLabel: "Остаться",
      danger: true,
      children: <LeaveReasons onPick={(r) => (reason = r)} />,
    });
    if (!ok) return;
    const r = actions.leaveCircle(circle.id);
    if (!r.ok) return toast(r.error, "error");
    toast(r.closed ? "Вы вышли, круг закрыт" : `Вы вышли из круга${reason ? ` (причина: ${reason.toLowerCase()})` : ""}`, "success");
    if (r.closed) go("#my");
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <IconButton label="Назад" onClick={() => back("#catalog")}>
          <BackIcon />
        </IconButton>
        {isMember && (
          <IconButton label="Меню круга" onClick={() => setMenu(true)}>
            <DotsIcon />
          </IconButton>
        )}
      </div>
      <section className="flex flex-col gap-4 rounded-[28px] bg-forest p-6 text-surface md:p-8">
        <div className="flex items-center justify-between gap-3">
          <Chip tone="ink" className="!bg-forest-700 !text-mint">
            {circle.topic}
          </Chip>
          <span className="text-[13px] font-medium text-mint">{circle.joinMode === "approval" ? "по заявке" : "открытый"}</span>
        </div>
        <h1 className="font-display text-[26px] leading-[1.15] font-medium tracking-[-0.03em] md:text-[34px]">{circle.title}</h1>
        <WeekBar total={circle.weeks} done={Math.max(0, week - 1)} current={week > 0 && week <= circle.weeks ? week - 1 : -1} className="w-full" tone="dark" />
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold">
            {week === 0 ? `Старт ${formatDate(circle.startDate)}` : week > circle.weeks ? "Круг завершён" : `Неделя ${week} из ${circle.weeks}`}
          </span>
          <span className="text-mint">{week === 0 ? `${circle.weeks} ${plural(circle.weeks, "неделя", "недели", "недель")}` : week <= circle.weeks ? "шаг — до воскресенья" : ""}</span>
        </div>
        <div className="flex items-center gap-3">
          <AvatarStack people={people} size={32} ring="ring-forest" />
          <span className="text-sm font-medium">
            {circle.members.length} из {circle.capacity} · {freeSeats(circle) ? `${freeSeats(circle)} ${plural(freeSeats(circle), "место", "места", "мест")}` : "мест нет"}
          </span>
        </div>
      </section>

      {menu && (
        <ActionMenu
          title={circle.title}
          onClose={() => setMenu(false)}
          items={[
            { label: "Пригласить", hint: "как работают приглашения", icon: <LinkIcon size={20} />, onSelect: () => setInvite(true) },
            {
              label: muted ? "Включить уведомления круга" : "Выключить уведомления круга",
              hint: muted ? "сейчас: выключены" : "сейчас: по вашим общим настройкам",
              icon: <BellIcon size={20} />,
              onSelect: () => {
                actions.toggleMute(circle.id);
                toast(muted ? "Уведомления круга включены" : "Уведомления круга выключены", "success");
              },
            },
            { label: "Правила круга", icon: <BookIcon size={20} />, onSelect: () => setRules(true) },
            { label: "Пожаловаться на участника", hint: "выберите человека и причину", icon: <FlagIcon size={20} />, onSelect: () => setReportPick(true) },
            { label: "Выйти из круга", hint: "шаги останутся у участников", icon: <LogOutIcon size={20} />, danger: true, onSelect: leave },
          ]}
        />
      )}
      {rules && (
        <Modal onClose={() => setRules(false)} label="Правила круга">
          <h2 className="font-display text-xl font-medium">Правила круга</h2>
          <ol className="mt-4 flex list-decimal flex-col gap-2.5 pl-5 text-[15px] leading-[1.55] text-ink-2">
            {RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          <Button className="mt-6 w-full" onClick={() => setRules(false)}>
            Понятно
          </Button>
        </Modal>
      )}
      {invite && (
        <Modal onClose={() => setInvite(false)} label="Пригласить">
          <h2 className="font-display text-xl font-medium">Приглашения по ссылке</h2>
          <p className="mt-3 text-[15px] leading-[1.55] text-ink-2">
            В демо-режиме нет сервера, поэтому ссылку-приглашение отправить некому: другие люди не увидят ваш браузер. В настоящей версии здесь будет ссылка, которая действует 7 дней.
          </p>
          <p className="mt-3 text-[15px] leading-[1.55] text-ink-2">Пока можно рассказать о круге: он виден в каталоге по названию «{circle.title}».</p>
          <Button className="mt-6 w-full" onClick={() => setInvite(false)}>
            Понятно
          </Button>
        </Modal>
      )}
      {reportPick && (
        <Modal onClose={() => setReportPick(false)} label="На кого пожаловаться">
          <h2 className="font-display text-xl font-medium">На кого пожаловаться?</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {circle.members
              .filter((m) => m !== me?.id)
              .map((m) => (
                <li key={m}>
                  <button
                    type="button"
                    onClick={() => {
                      setReportPick(false);
                      setReportUser(m);
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-paper px-4 py-3 text-left font-semibold hover:bg-sand/60"
                  >
                    <Avatar letter={state.people[m].nickname[0]} tone={state.people[m].tone} size={36} />@{state.people[m].nickname}
                  </button>
                </li>
              ))}
          </ul>
          {circle.members.length <= 1 && <p className="mt-3 text-ink-2">В круге пока никого, кроме вас.</p>}
        </Modal>
      )}
      {reportUser && (
        <ReportDialog title="Пожаловаться на участника" subtitle={`@${state.people[reportUser].nickname} · ${circle.title}`} targetType="user" targetId={reportUser} authorId={reportUser} onClose={() => setReportUser(null)} />
      )}
    </>
  );
}

function LeaveReasons({ onPick }: { onPick: (r: string) => void }) {
  const [picked, setPicked] = useState("");
  return (
    <fieldset className="mt-4">
      <legend className="mb-2 text-sm font-semibold text-ink-2">Причина (необязательно)</legend>
      <div className="flex flex-wrap gap-2">
        {["Нет времени", "Цель не подошла", "Неуютно в круге", "Другое"].map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={picked === r}
            className="cursor-pointer rounded-full"
            onClick={() => {
              const v = picked === r ? "" : r;
              setPicked(v);
              onPick(v);
            }}
          >
            <Chip tone={picked === r ? "ink" : "outline"}>{r}</Chip>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/* ---------- Вступление ---------- */

function JoinBar({ circle, isMember }: { circle: Circle; isMember: boolean }) {
  const { state, me, actions } = useStore();
  const { toast, confirm } = useFeedback();
  const [requestOpen, setRequestOpen] = useState(false);
  const [message, setMessage] = useState("");

  if (isMember) return null;

  const box = (children: React.ReactNode) => <div className="mt-4 flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5 shadow-card sm:flex-row sm:items-center">{children}</div>;

  if (!me) {
    return box(
      <>
        <p className="flex-1 text-[15px] text-ink-2">Чтобы вступить, войдите в демо-режим — это займёт 10 секунд.</p>
        <Button
          onClick={() => {
            setReturnTo(`#circle-${circle.id}`);
            go("#login");
          }}
        >
          Войти и вступить
        </Button>
      </>,
    );
  }

  const pending = state.requests.find((r) => r.circleId === circle.id && r.userId === me.id && r.status === "pending");
  if (pending) {
    const owner = state.people[circle.ownerId];
    return box(
      <>
        <div className="flex-1">
          <p className="font-semibold">Заявка на рассмотрении</p>
          <p className="mt-1 text-sm text-ink-2">
            Создатель @{owner?.nickname} — вымышленный демо-персонаж и сам не ответит. Чтобы посмотреть, что будет дальше, одобрите заявку за него.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              if (!(await confirm({ title: "Отозвать заявку?", confirmLabel: "Отозвать", danger: true }))) return;
              actions.withdrawRequest(pending.id);
              toast("Заявка отозвана", "info");
            }}
          >
            Отозвать
          </Button>
          <Button
            variant="accent"
            onClick={() => {
              const r = actions.decideRequest(pending.id, true);
              if (r.ok) toast(`Демо: заявку одобрили — вы в круге «${circle.title}»`, "success");
              else toast(r.error, "error");
            }}
          >
            Демо: одобрить за создателя
          </Button>
        </div>
      </>,
    );
  }

  const rejected = state.requests.find((r) => r.circleId === circle.id && r.userId === me.id && r.status === "rejected");
  if (state.blocks.includes(circle.ownerId)) return box(<p className="text-[15px] text-ink-2">Вы заблокировали создателя этого круга — вступить нельзя.</p>);
  if (freeSeats(circle) === 0)
    return box(
      <>
        <p className="flex-1 text-[15px] text-ink-2">Свободных мест нет. Загляните в каталог — там есть похожие круги.</p>
        <Button disabled>Мест нет</Button>
      </>,
    );

  const join = () => {
    const r = actions.joinCircle(circle.id);
    if (r.ok) toast(`Вы в круге «${circle.title}». Первый шаг — до воскресенья!`, "success");
    else toast(r.error, "error");
  };

  const sendRequest = () => {
    const r = actions.requestJoin(circle.id, message);
    if (!r.ok) return toast(r.error, "error");
    setRequestOpen(false);
    setMessage("");
    toast("Заявка отправлена создателю круга", "success");
  };

  return (
    <>
      {box(
        <>
          <p className="flex-1 text-[15px] text-ink-2">
            {rejected ? "Прошлую заявку отклонили. Можно отправить новую." : circle.joinMode === "open" ? "Открытый круг: вступайте сразу, пока есть места." : "Вступление по заявке: создатель посмотрит ваш никнейм, сообщение и открытые поля профиля."}
          </p>
          {circle.joinMode === "open" ? <Button onClick={join}>Вступить в круг</Button> : <Button onClick={() => setRequestOpen(true)}>Подать заявку</Button>}
        </>,
      )}
      {requestOpen && (
        <Modal onClose={() => setRequestOpen(false)} label="Заявка в круг">
          <h2 className="font-display text-xl font-medium">Заявка в круг</h2>
          <p className="mt-1 text-sm text-ink-3">{circle.title}</p>
          <label htmlFor="req-msg" className="mt-5 block text-[15px] font-semibold">
            Сообщение создателю (необязательно)
          </label>
          <div className="mt-2">
            <TextArea id="req-msg" max={300} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Например: готов делать шаг каждую неделю, уровень английского B2" />
          </div>
          <div className="mt-2">
            <ContactWarning text={message} />
          </div>
          <p className="mt-3 text-[13px] text-ink-3">Создатель увидит ваш никнейм, это сообщение и только те поля профиля, которые вы открыли для всех.</p>
          <Button className="mt-5 w-full" onClick={sendRequest}>
            Отправить заявку
          </Button>
        </Modal>
      )}
    </>
  );
}

/* ---------- Шаги ---------- */

function StepsTab({ circle }: { circle: Circle }) {
  const { state, me, actions } = useStore();
  const { toast } = useFeedback();
  const [text, setText] = useState("");
  const week = currentWeek(circle);
  const canPost = week >= 1 && week <= circle.weeks;
  const steps = state.steps.filter((s) => s.circleId === circle.id && !state.blocks.includes(s.authorId));
  const mineThisWeek = steps.some((s) => s.authorId === me!.id && s.week === week);

  const publish = () => {
    const r = actions.postStep(circle.id, text);
    if (!r.ok) return toast(r.error, "error");
    setText("");
    toast("Шаг опубликован. Так держать!", "success");
  };

  return (
    <div className="flex flex-col gap-4">
      {canPost ? (
        <section className="flex flex-col gap-3 rounded-3xl bg-sun-soft p-5">
          <div className="flex items-center gap-3">
            <Avatar letter={me!.nickname[0]} tone={me!.tone} size={40} />
            <div>
              <p className="font-semibold">{mineThisWeek ? `Ещё один шаг за неделю ${week}` : `Ваш шаг за неделю ${week}`}</p>
              <p className="text-sm text-ink-2">Что сделано, что мешает, что дальше?</p>
            </div>
          </div>
          <label htmlFor="step-text" className="sr-only">
            Текст шага
          </label>
          <TextArea id="step-text" max={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Например: прошёл 2 урока, застрял на функциях, завтра разберу примеры" className="bg-surface" />
          <ContactWarning text={text} />
          <Button className="self-end" onClick={publish} disabled={!text.trim()}>
            Опубликовать шаг
          </Button>
        </section>
      ) : (
        <p className="rounded-3xl bg-surface p-5 text-[15px] text-ink-2">
          {week === 0 ? `Круг стартует ${formatDate(circle.startDate)} — тогда можно будет публиковать шаги.` : "Круг завершён — новые шаги не публикуются."}
        </p>
      )}

      {steps.length === 0 ? (
        <EmptyState title="Шагов пока нет" text="Будьте первым — короткий честный отчёт задаёт ритм всему кругу." icon={<SparkIcon />} />
      ) : (
        steps.map((s) => <StepCard key={s.id} step={s} />)
      )}
    </div>
  );
}

function Hidden({ what, id }: { what: string; id: string }) {
  const { actions } = useStore();
  return (
    <div className="flex items-center justify-between gap-3 rounded-3xl border border-dashed border-line bg-surface/60 px-5 py-4 text-sm text-ink-2">
      <span>{what} скрыт(о) вами по жалобе</span>
      <button type="button" className="cursor-pointer font-semibold text-forest underline underline-offset-2" onClick={() => actions.reveal(id)}>
        Показать
      </button>
    </div>
  );
}

function StepCard({ step }: { step: Step }) {
  const { state, me, actions } = useStore();
  const { toast, confirm } = useFeedback();
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const author = state.people[step.authorId];
  const mine = step.authorId === me!.id;
  const reported = state.reports.some((r) => r.targetId === step.id) && !state.revealed.includes(step.id);
  const comments = state.comments.filter((c) => c.stepId === step.id && !state.blocks.includes(c.authorId));

  if (reported) return <Hidden what="Шаг" id={step.id} />;

  const supportOn = step.support.includes(me!.id);
  const usefulOn = step.useful.includes(me!.id);

  const sendReply = () => {
    const r = actions.addComment(step.id, reply);
    if (!r.ok) return toast(r.error, "error");
    setReply("");
    toast("Комментарий добавлен", "success");
  };

  const blockAuthor = async () => {
    if (!(await confirm({ title: `Заблокировать @${author.nickname}?`, text: "Вы перестанете видеть его шаги и комментарии, он не сможет вступить в ваши круги. Снять блокировку можно в настройках.", confirmLabel: "Заблокировать", danger: true }))) return;
    actions.block(author.id);
    toast(`@${author.nickname} заблокирован`, "success");
  };

  return (
    <article className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5 shadow-card" data-testid="step">
      <header className="flex items-center gap-3">
        <a href={mine ? "#profile" : `#u-${author.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar letter={author.nickname[0]} tone={author.tone} size={40} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{mine ? "Вы" : `@${author.nickname}`}</span>
            <span className="block text-[13px] text-ink-3">
              неделя {step.week} · {timeAgo(step.createdAt)}
            </span>
          </span>
        </a>
        <button type="button" aria-label="Действия с шагом" onClick={() => setMenu(true)} className="flex size-10 cursor-pointer items-center justify-center rounded-full text-ink-3 hover:bg-paper">
          <DotsIcon size={20} />
        </button>
      </header>
      <p className="text-[15px] leading-[1.6] whitespace-pre-wrap">{step.body}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={supportOn}
          onClick={() => actions.toggleReaction(step.id, "support")}
          className={`flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium ${supportOn ? "bg-coral-soft text-ink" : "bg-paper text-ink-2"}`}
        >
          <HeartIcon size={16} className={supportOn ? "text-coral" : ""} fill={supportOn ? "currentColor" : "none"} />
          Держись · {step.baseSupport + step.support.length}
        </button>
        <button
          type="button"
          aria-pressed={usefulOn}
          onClick={() => actions.toggleReaction(step.id, "useful")}
          className={`flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium ${usefulOn ? "bg-mint text-forest-700" : "bg-paper text-ink-2"}`}
        >
          <SparkIcon size={16} />
          Полезно · {step.baseUseful + step.useful.length}
        </button>
        <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="ml-auto flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-ink-2 hover:bg-paper">
          <MessageIcon size={16} />
          Комментарии · {comments.length}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t border-line pt-3">
          {comments.length === 0 && <p className="text-sm text-ink-3">Комментариев пока нет — поддержите словом.</p>}
          {comments.map((c) => (
            <CommentRow key={c.id} comment={c} />
          ))}
          <div className="flex items-end gap-2">
            <label htmlFor={`reply-${step.id}`} className="sr-only">
              Комментарий
            </label>
            <textarea
              id={`reply-${step.id}`}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Поддержать или подсказать…"
              rows={1}
              maxLength={1000}
              className="min-h-11 flex-1 resize-none rounded-2xl border-[1.5px] border-line bg-paper px-4 py-2.5 text-[15px] outline-none focus:border-forest"
            />
            <Button size="sm" onClick={sendReply} disabled={!reply.trim()}>
              Отправить
            </Button>
          </div>
          <ContactWarning text={reply} />
        </div>
      )}

      {menu && (
        <ActionMenu
          title="Шаг"
          onClose={() => setMenu(false)}
          items={
            mine
              ? [
                  {
                    label: "Удалить шаг",
                    hint: "вместе с комментариями",
                    icon: <TrashIcon size={20} />,
                    danger: true,
                    onSelect: async () => {
                      if (!(await confirm({ title: "Удалить шаг?", text: "Это нельзя отменить.", confirmLabel: "Удалить", danger: true }))) return;
                      actions.deleteStep(step.id);
                      toast("Шаг удалён", "info");
                    },
                  },
                ]
              : [
                  { label: "Пожаловаться", hint: "шаг скроется у вас", icon: <FlagIcon size={20} />, onSelect: () => setReport(true) },
                  { label: `Заблокировать @${author.nickname}`, icon: <BanIcon size={20} />, danger: true, onSelect: blockAuthor },
                ]
          }
        />
      )}
      {report && <ReportDialog title="Пожаловаться на шаг" subtitle={`@${author.nickname} · неделя ${step.week}`} targetType="step" targetId={step.id} authorId={author.id} onClose={() => setReport(false)} />}
    </article>
  );
}

function CommentRow({ comment }: { comment: Comment }) {
  const { state, me, actions } = useStore();
  const { toast, confirm } = useFeedback();
  const [report, setReport] = useState(false);
  const [menu, setMenu] = useState(false);
  const author = state.people[comment.authorId];
  const mine = comment.authorId === me!.id;
  if (state.reports.some((r) => r.targetId === comment.id) && !state.revealed.includes(comment.id)) return <Hidden what="Комментарий" id={comment.id} />;
  return (
    <div className="flex gap-2.5" data-testid="comment">
      <Avatar letter={author.nickname[0]} tone={author.tone} size={32} />
      <div className="min-w-0 flex-1 rounded-2xl bg-paper px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{mine ? "Вы" : `@${author.nickname}`}</span>
          <button type="button" aria-label="Действия с комментарием" onClick={() => setMenu(true)} className="flex size-8 cursor-pointer items-center justify-center rounded-full text-ink-3 hover:bg-sand/60">
            <DotsIcon size={16} />
          </button>
        </div>
        <p className="text-[15px] leading-[1.5] whitespace-pre-wrap">{comment.body}</p>
        <span className="text-xs text-ink-3">{timeAgo(comment.createdAt)}</span>
      </div>
      {menu && (
        <ActionMenu
          title="Комментарий"
          onClose={() => setMenu(false)}
          items={
            mine
              ? [
                  {
                    label: "Удалить комментарий",
                    icon: <TrashIcon size={20} />,
                    danger: true,
                    onSelect: async () => {
                      if (!(await confirm({ title: "Удалить комментарий?", confirmLabel: "Удалить", danger: true }))) return;
                      actions.deleteComment(comment.id);
                      toast("Комментарий удалён", "info");
                    },
                  },
                ]
              : [{ label: "Пожаловаться", hint: "комментарий скроется у вас", icon: <FlagIcon size={20} />, onSelect: () => setReport(true) }]
          }
        />
      )}
      {report && <ReportDialog title="Пожаловаться на комментарий" subtitle={`@${author.nickname}`} targetType="comment" targetId={comment.id} authorId={author.id} onClose={() => setReport(false)} />}
    </div>
  );
}

/* ---------- Участники и заявки ---------- */

function MembersTab({ circle, isMember, isOwner }: { circle: Circle; isMember: boolean; isOwner: boolean }) {
  const { state, me, actions } = useStore();
  const { toast, confirm } = useFeedback();
  const owner = state.people[circle.ownerId];
  const requests = state.requests.filter((r) => r.circleId === circle.id && r.status === "pending" && r.userId !== me?.id);

  if (!isMember) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-3xl border border-line bg-surface p-5">
          <p className="text-[15px]">
            Создатель: <span className="font-semibold">@{owner?.nickname}</span>
          </p>
          <p className="mt-1 text-[15px] text-ink-2">
            Участников: {circle.members.length} из {circle.capacity}
          </p>
        </div>
        <MembersOnly what="Список участников" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {isOwner && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-medium">Заявки</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const r = actions.simulateRequest(circle.id);
                if (r.ok) toast("Демо: вымышленный человек подал заявку", "info");
                else toast(r.error, "error");
              }}
            >
              Демо: смоделировать заявку
            </Button>
          </div>
          {requests.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-line bg-surface/60 p-5 text-[15px] text-ink-2">
              Новых заявок нет. {circle.joinMode === "open" ? "Круг открытый: люди вступают сразу." : "Когда кто-то подаст заявку, она появится здесь."}
            </p>
          ) : (
            requests.map((r) => {
              const p = state.people[r.userId];
              return (
                <div key={r.id} className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5 shadow-card" data-testid="request">
                  <div className="flex items-center gap-3">
                    <Avatar letter={p.nickname[0]} tone={p.visibility.avatar === "public" ? p.tone : "surface"} size={40} />
                    <div>
                      <a href={`#u-${p.id}`} className="font-semibold underline-offset-2 hover:underline">
                        @{p.nickname}
                      </a>
                      <p className="text-[13px] text-ink-3">
                        {p.finishedCircles} {plural(p.finishedCircles, "круг доведён", "круга доведено", "кругов доведено")} до конца · {timeAgo(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  {r.message && <p className="rounded-2xl bg-paper px-4 py-3 text-[15px]">{r.message}</p>}
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        actions.decideRequest(r.id, false);
                        toast(`Заявка @${p.nickname} отклонена`, "info");
                      }}
                    >
                      Отклонить
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        const res = actions.decideRequest(r.id, true);
                        if (res.ok) toast(`@${p.nickname} теперь в круге`, "success");
                        else toast(res.error, "error");
                      }}
                    >
                      Принять
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-medium">
          Участники · {circle.members.length} из {circle.capacity}
        </h2>
        <ul className="overflow-hidden rounded-3xl border border-line bg-surface">
          {circle.members.map((m) => {
            const p = state.people[m];
            const isMe = m === me!.id;
            const blocked = state.blocks.includes(m);
            return (
              <li key={m} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0" data-testid="member">
                <a href={isMe ? "#profile" : `#u-${m}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar letter={p.nickname[0]} tone={p.tone} size={40} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{isMe ? `Вы (@${p.nickname})` : `@${p.nickname}`}</span>
                    <span className="text-[13px] text-ink-3">{m === circle.ownerId ? "создатель" : blocked ? "заблокирован вами" : "участник"}</span>
                  </span>
                </a>
                {isOwner && !isMe && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!text-danger hover:!bg-coral-soft"
                    onClick={async () => {
                      if (!(await confirm({ title: `Удалить @${p.nickname} из круга?`, text: "Его шаги останутся. Он сможет подать заявку снова.", confirmLabel: "Удалить", danger: true }))) return;
                      const r = actions.removeMember(circle.id, m);
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
      </section>
    </div>
  );
}

/* ---------- Чат ---------- */

function ChatTab({ circle }: { circle: Circle }) {
  const { state, me, actions } = useStore();
  const { toast, confirm } = useFeedback();
  const [text, setText] = useState("");
  const [report, setReport] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messages = state.messages.filter((m) => m.circleId === circle.id && !state.blocks.includes(m.authorId));

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const send = () => {
    const r = actions.sendMessage(circle.id, text);
    if (!r.ok) return toast(r.error, "error");
    setText("");
  };

  const reportedMsg = report ? state.messages.find((m) => m.id === report) : null;

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-start gap-2 rounded-2xl bg-lilac-soft px-4 py-3 text-sm text-ink">
        <InfoIcon size={18} className="mt-0.5 shrink-0" />
        Демо-режим: сообщения сохраняются только в вашем браузере. Участники вымышленные — они их не увидят и не ответят.
      </p>
      <div className="flex max-h-[55vh] min-h-48 flex-col gap-3 overflow-y-auto rounded-3xl border border-line bg-surface p-4" aria-label="Сообщения" aria-live="polite">
        {messages.length === 0 && <p className="m-auto text-sm text-ink-3">Сообщений пока нет. Напишите первым!</p>}
        {messages.map((m) => {
          const a = state.people[m.authorId];
          const mine = m.authorId === me!.id;
          if (state.reports.some((r) => r.targetId === m.id) && !state.revealed.includes(m.id)) return <Hidden key={m.id} what="Сообщение" id={m.id} />;
          return (
            <div key={m.id} className={`group flex max-w-[85%] gap-2 ${mine ? "flex-row-reverse self-end" : ""}`} data-testid="chat-message">
              {!mine && <Avatar letter={a.nickname[0]} tone={a.tone} size={30} />}
              <div className={`rounded-2xl px-3.5 py-2.5 ${mine ? "bg-forest text-surface" : "bg-paper"}`}>
                {!mine && <p className="text-xs font-semibold text-ink-2">@{a.nickname}</p>}
                <p className="text-[15px] leading-[1.45] whitespace-pre-wrap">{m.body}</p>
                <div className={`mt-1 flex items-center gap-3 text-[11px] ${mine ? "text-mint" : "text-ink-3"}`}>
                  {timeAgo(m.createdAt)}
                  <button
                    type="button"
                    className="cursor-pointer font-semibold underline underline-offset-2"
                    onClick={async () => {
                      if (mine) {
                        if (!(await confirm({ title: "Удалить сообщение?", confirmLabel: "Удалить", danger: true }))) return;
                        actions.deleteMessage(m.id);
                        toast("Сообщение удалено", "info");
                      } else setReport(m.id);
                    }}
                  >
                    {mine ? "удалить" : "пожаловаться"}
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
          placeholder="Сообщение в чат круга"
          className="min-h-12 flex-1 resize-none rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-base outline-none focus:border-forest"
        />
        <button type="submit" aria-label="Отправить сообщение" disabled={!text.trim()} className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-forest text-surface disabled:cursor-not-allowed disabled:opacity-50">
          <SendIcon />
        </button>
      </form>
      <ContactWarning text={text} />
      {reportedMsg && (
        <ReportDialog title="Пожаловаться на сообщение" subtitle={`@${state.people[reportedMsg.authorId].nickname}`} targetType="message" targetId={reportedMsg.id} authorId={reportedMsg.authorId} onClose={() => setReport(null)} />
      )}
    </div>
  );
}

/* ---------- О круге ---------- */

function AboutTab({ circle }: { circle: Circle }) {
  const { state } = useStore();
  const owner = state.people[circle.ownerId];
  const end = new Date(circle.startDate + "T00:00:00");
  end.setDate(end.getDate() + circle.weeks * 7 - 1);
  const rows = [
    ["Цель", circle.goal],
    ["Тема", circle.topic],
    ["Срок", `${circle.weeks} ${plural(circle.weeks, "неделя", "недели", "недель")}: ${formatDate(circle.startDate)} — ${formatDate(end.toISOString())}`],
    ["Размер", `до ${circle.capacity} человек`],
    ["Вступление", circle.joinMode === "approval" ? "по заявке — создатель одобряет участников" : "открытое — сразу, пока есть места"],
    ["Создатель", `@${owner?.nickname}`],
  ];
  return (
    <div className="flex flex-col gap-4">
      {circle.description && <p className="rounded-3xl border border-line bg-surface p-5 text-[15px] leading-[1.6] whitespace-pre-wrap">{circle.description}</p>}
      <dl className="overflow-hidden rounded-3xl border border-line bg-surface">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5 border-b border-line px-5 py-3.5 last:border-b-0 sm:flex-row sm:gap-4">
            <dt className="w-32 shrink-0 text-sm font-semibold text-ink-3">{k}</dt>
            <dd className="text-[15px]">{v}</dd>
          </div>
        ))}
      </dl>
      {circle.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {circle.tags.map((t) => (
            <Chip key={t} tone="outline">
              #{t}
            </Chip>
          ))}
        </div>
      )}
      <section className="rounded-3xl bg-mint p-5">
        <h2 className="font-semibold text-forest-700">Правила круга</h2>
        <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-[15px] leading-[1.5] text-forest-700">
          {RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
