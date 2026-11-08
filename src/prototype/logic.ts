import type { Circle, DemoState, Person, ProfileField } from "./types";

export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function daysBetween(fromISO: string, toISO: string) {
  return Math.round((new Date(toISO + "T00:00:00").getTime() - new Date(fromISO + "T00:00:00").getTime()) / 86_400_000);
}

/** Номер текущей недели круга: 0 — ещё не начался, weeks+1 — закончился. */
export function currentWeek(c: Circle) {
  const d = daysBetween(c.startDate, todayISO());
  if (d < 0) return 0;
  return Math.min(Math.floor(d / 7) + 1, c.weeks + 1);
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

export function freeSeats(c: Circle) {
  return Math.max(0, c.capacity - c.members.length);
}

/** Есть ли у двух людей общий круг */
export function shareCircle(state: DemoState, a: string, b: string) {
  return state.circles.some((c) => c.status === "open" && c.members.includes(a) && c.members.includes(b));
}

/** Можно ли мне видеть поле чужого профиля — та же логика будет в базе (RLS). */
export function canSeeField(state: DemoState, viewerId: string | null, person: Person, field: ProfileField) {
  if (viewerId === person.id) return true;
  if (!viewerId) return false; // гостям профили не показываем
  if (state.blocks.includes(person.id)) return false;
  const v = person.visibility[field];
  if (v === "public") return true;
  if (v === "circles") return shareCircle(state, viewerId, person.id);
  return false;
}

/** Похоже ли на контакты: телефон, email, ссылки на мессенджеры. */
export function looksLikeContacts(text: string) {
  return (
    /(\+?\d[\d\s\-()]{8,}\d)/.test(text) ||
    /[\w.+-]+@[\w-]+\.[\w.]+/.test(text) ||
    /(t\.me|telegram|wa\.me|whatsapp|vk\.com|instagram\.com|viber)/i.test(text) ||
    /(^|\s)@[a-z0-9_]{4,}/i.test(text)
  );
}

export const NICK_RE = /^[a-zA-Z0-9_]{3,20}$/;

export type CircleDraft = {
  title: string;
  goal: string;
  description: string;
  topic: string;
  tags: string[];
  weeks: number;
  capacity: number;
  startDate: string;
  joinMode: "open" | "approval";
};

export function validateDraftStep(d: CircleDraft, step: 1 | 2 | 3) {
  const e: Partial<Record<keyof CircleDraft, string>> = {};
  if (step >= 1) {
    if (d.title.trim().length < 5) e.title = "Название — минимум 5 символов";
    else if (d.title.trim().length > 80) e.title = "Название — не больше 80 символов";
    if (d.goal.trim().length < 10) e.goal = "Опишите цель хотя бы в 10 символах";
    else if (d.goal.trim().length > 200) e.goal = "Цель — не больше 200 символов";
    if (d.description.length > 1000) e.description = "Описание — не больше 1000 символов";
    if (!d.topic) e.topic = "Выберите тему";
  }
  if (step >= 2) {
    if (!(d.weeks >= 2 && d.weeks <= 12)) e.weeks = "Срок — от 2 до 12 недель";
    if (!(d.capacity >= 3 && d.capacity <= 8)) e.capacity = "Размер — от 3 до 8 человек";
    if (!d.startDate) e.startDate = "Укажите дату старта";
    else {
      const diff = daysBetween(todayISO(), d.startDate);
      if (diff < 0) e.startDate = "Дата старта не может быть в прошлом";
      else if (diff > 60) e.startDate = "Старт — не позже чем через 60 дней";
    }
  }
  return e;
}
