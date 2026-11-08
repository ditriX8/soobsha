import type { Circle, Member, Task } from "./types";

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function daysBetween(fromISO: string, toISO: string) {
  return Math.round((new Date(toISO + "T00:00:00").getTime() - new Date(fromISO + "T00:00:00").getTime()) / 86_400_000);
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
export function formatDate(iso: string) {
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function timeAgo(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} ч назад`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days} дн назад`;
  return formatDate(iso);
}

/** Подпись срока задачи и её «тон». */
export function dueInfo(due: string | null, done: boolean): { label: string; tone: "late" | "soon" | "normal" } | null {
  if (!due) return null;
  if (done) return { label: formatDate(due), tone: "normal" };
  const d = daysBetween(todayISO(), due);
  if (d < 0) return { label: `просрочено · ${formatDate(due)}`, tone: "late" };
  if (d === 0) return { label: "сегодня", tone: "soon" };
  if (d === 1) return { label: "завтра", tone: "soon" };
  return { label: formatDate(due), tone: "normal" };
}

/** Прогресс круга: выполнено/всего и темп относительно срока. */
export function circleProgress(c: Pick<Circle, "start_date" | "deadline">, tasks: Pick<Task, "status">[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const span = Math.max(1, daysBetween(c.start_date, c.deadline));
  const passed = Math.min(span, Math.max(0, daysBetween(c.start_date, todayISO())));
  const timePct = Math.round((passed / span) * 100);
  const expected = Math.floor((total * passed) / span);
  const behind = Math.max(0, expected - done);
  const daysLeft = daysBetween(todayISO(), c.deadline);
  return { total, done, pct, timePct, behind, daysLeft };
}

export function personalProgress(tasks: Pick<Task, "status" | "assignee_id">[], userId: string) {
  const mine = tasks.filter((t) => t.assignee_id === userId);
  return { total: mine.length, done: mine.filter((t) => t.status === "done").length };
}

/** Права — те же правила, что в базе (триггер tasks_guard). Нужны, чтобы не показывать недоступные кнопки. */
export function taskRights(t: Task, uid: string, ownerId: string) {
  const owner = uid === ownerId;
  const editor = owner || uid === t.created_by || uid === t.assignee_id;
  return {
    edit: editor,
    assign: editor,
    take: !t.assignee_id,
    toggle: owner || uid === t.assignee_id || !t.assignee_id,
    pin: owner,
    remove: owner || uid === t.created_by,
  };
}

export function isOwner(members: Member[], uid: string) {
  return members.some((m) => m.user_id === uid && m.role === "owner");
}

/** Похоже ли на контакты: телефон, email, ссылки на мессенджеры. */
export function looksLikeContacts(text: string) {
  return (
    /(\+?\d[\d\s\-()]{8,}\d)/.test(text) ||
    /[\w.+-]+@[\w-]+\.[\w.]+/.test(text) ||
    /(t\.me|telegram|wa\.me|whatsapp|vk\.com|instagram\.com|viber)/i.test(text)
  );
}

export const TELEGRAM_RE = /^https:\/\/t\.me\/[A-Za-z0-9_+/-]{3,64}$/;
export const NICK_RE = /^[A-Za-z0-9_]{3,20}$/;

/** «K7Q4MX2A» → «K7Q4-MX2A» */
export const formatCode = (c: string) => (c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c);
export const inviteLink = (code: string) => `${window.location.origin}${window.location.pathname}#join-${code}`;
