"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AvatarTone } from "@/components/ui";
import { NICK_RE, currentWeek, freeSeats, looksLikeContacts, uid, type CircleDraft } from "./logic";
import { closedVisibility, createSeed } from "./seed";
import type { DemoState, NotificationType, Person, ProfileField, ReportReason, Topic, Visibility } from "./types";

export const STORAGE_KEY = "soobsha-demo-v1";

type Result = { ok: true; id?: string } | { ok: false; error: string };
const fail = (error: string): Result => ({ ok: false, error });

function load(): { state: DemoState; persistent: boolean } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed.version === 1) return { state: parsed, persistent: true };
    }
    window.localStorage.setItem("soobsha-probe", "1");
    window.localStorage.removeItem("soobsha-probe");
    return { state: createSeed(), persistent: true };
  } catch {
    return { state: createSeed(), persistent: false };
  }
}

function useDemoStore() {
  const [state, setState] = useState<DemoState | null>(null);
  const [persistent, setPersistent] = useState(true);
  const loaded = useRef(false);

  useEffect(() => {
    const l = load();
    // Данные из браузера можно прочитать только после загрузки страницы
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(l.state);
    setPersistent(l.persistent);
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!state || !loaded.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Браузер запретил запись (приватный режим или нет места) — честно сообщаем в полосе демо-режима
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPersistent(false);
    }
  }, [state]);

  /** Изменение состояния: копируем, меняем копию, сохраняем. */
  const mutate = useCallback((fn: (draft: DemoState) => void) => {
    setState((prev) => {
      if (!prev) return prev;
      const draft = structuredClone(prev);
      fn(draft);
      return draft;
    });
  }, []);

  const notify = (draft: DemoState, type: NotificationType, text: string, link: string) => {
    const s = draft.notificationSettings;
    if (s.allOff || !s.prefs[type].inApp) return;
    draft.notifications.unshift({ id: uid("n"), type, text, link, createdAt: new Date().toISOString(), read: false });
  };

  const actions = useMemo(() => {
    const need = (): Result | null => (state?.meId ? null : fail("Сначала войдите в демо-режим"));

    return {
      /* ---------- Вход и данные ---------- */
      enterDemo(nickname: string, ageOk: boolean): Result {
        if (!state) return fail("Данные ещё загружаются");
        const nick = nickname.trim();
        if (!NICK_RE.test(nick)) return fail("Никнейм: 3–20 символов — латиница, цифры или «_»");
        if (state.people[nick]) return fail("Этот никнейм уже занят — выберите другой");
        if (!ageOk) return fail("Подтвердите, что вам есть 16 лет");
        mutate((d) => {
          const me: Person = {
            id: nick,
            nickname: nick,
            tone: "lilac",
            about: "",
            city: "",
            interests: [],
            skills: [],
            visibility: closedVisibility(),
            finishedCircles: 0,
          };
          d.people[nick] = me;
          d.meId = nick;
          notify(d, "news", "Добро пожаловать! Это демо-режим: данные хранятся только в этом браузере.", "#about-demo");
        });
        return { ok: true };
      },

      resetDemo() {
        setState(createSeed());
      },

      /* ---------- Профиль ---------- */
      saveProfile(p: {
        about: string;
        city: string;
        interests: string[];
        skills: string[];
        tone: AvatarTone;
        visibility: Record<ProfileField, Visibility>;
      }): Result {
        const n = need();
        if (n) return n;
        if (p.about.length > 300) return fail("«О себе» — не больше 300 символов");
        if (p.city.length > 60) return fail("Город — не больше 60 символов");
        if (p.interests.length > 10 || p.skills.length > 10) return fail("Не больше 10 тегов в каждом списке");
        if (looksLikeContacts(p.about)) return fail("Уберите контакты из «О себе»: общение — только внутри круга");
        mutate((d) => {
          const me = d.people[d.meId!];
          Object.assign(me, { about: p.about.trim(), city: p.city.trim(), interests: p.interests, skills: p.skills, tone: p.tone, visibility: p.visibility });
        });
        return { ok: true };
      },

      /* ---------- Круги ---------- */
      createCircle(dr: CircleDraft): Result {
        const n = need();
        if (n) return n;
        const id = uid("c");
        mutate((d) => {
          d.circles.unshift({
            id,
            title: dr.title.trim(),
            goal: dr.goal.trim(),
            description: dr.description.trim(),
            topic: dr.topic as Topic,
            tags: dr.tags,
            capacity: dr.capacity,
            weeks: dr.weeks,
            startDate: dr.startDate,
            joinMode: dr.joinMode,
            ownerId: d.meId!,
            members: [d.meId!],
            status: "open",
            createdAt: new Date().toISOString(),
          });
        });
        return { ok: true, id };
      },

      joinCircle(circleId: string): Result {
        const n = need();
        if (n) return n;
        const c = state!.circles.find((x) => x.id === circleId);
        if (!c || c.status !== "open") return fail("Круг не найден или закрыт");
        if (c.members.includes(state!.meId!)) return fail("Вы уже в этом круге");
        if (freeSeats(c) === 0) return fail("Свободных мест нет");
        if (state!.blocks.includes(c.ownerId)) return fail("Вы заблокировали создателя этого круга");
        if (c.joinMode !== "open") return fail("В этот круг вступают по заявке");
        mutate((d) => {
          d.circles.find((x) => x.id === circleId)!.members.push(d.meId!);
          notify(d, "requests", `Вы вступили в круг «${c.title}»`, `#circle-${c.id}`);
        });
        return { ok: true };
      },

      requestJoin(circleId: string, message: string): Result {
        const n = need();
        if (n) return n;
        const c = state!.circles.find((x) => x.id === circleId);
        if (!c || c.status !== "open") return fail("Круг не найден или закрыт");
        if (freeSeats(c) === 0) return fail("Свободных мест нет");
        if (message.length > 300) return fail("Сообщение — не больше 300 символов");
        if (state!.requests.some((r) => r.circleId === circleId && r.userId === state!.meId && r.status === "pending"))
          return fail("Заявка уже отправлена");
        mutate((d) => {
          d.requests.unshift({ id: uid("r"), circleId, userId: d.meId!, message: message.trim(), status: "pending", createdAt: new Date().toISOString() });
        });
        return { ok: true };
      },

      withdrawRequest(requestId: string): Result {
        mutate((d) => {
          const r = d.requests.find((x) => x.id === requestId);
          if (r) r.status = "withdrawn";
        });
        return { ok: true };
      },

      /** Решение по заявке. Для чужих (вымышленных) кругов — это явная демо-кнопка. */
      decideRequest(requestId: string, approve: boolean): Result {
        const r = state!.requests.find((x) => x.id === requestId);
        if (!r || r.status !== "pending") return fail("Заявка уже рассмотрена");
        const c = state!.circles.find((x) => x.id === r.circleId)!;
        if (approve && freeSeats(c) === 0) return fail("Мест нет — сначала увеличьте размер круга или откажите");
        mutate((d) => {
          const rr = d.requests.find((x) => x.id === requestId)!;
          rr.status = approve ? "approved" : "rejected";
          const cc = d.circles.find((x) => x.id === rr.circleId)!;
          if (approve && !cc.members.includes(rr.userId)) cc.members.push(rr.userId);
          if (rr.userId === d.meId) {
            notify(d, "requests", approve ? `Заявка в круг «${cc.title}» одобрена` : `Заявку в круг «${cc.title}» отклонили`, `#circle-${cc.id}`);
          }
        });
        return { ok: true };
      },

      /** Демо: вымышленный человек подаёт заявку в мой круг — чтобы показать одобрение. */
      simulateRequest(circleId: string): Result {
        const c = state!.circles.find((x) => x.id === circleId)!;
        const candidate = Object.values(state!.people).find(
          (p) =>
            p.demo &&
            !c.members.includes(p.id) &&
            !state!.blocks.includes(p.id) &&
            !state!.requests.some((r) => r.circleId === circleId && r.userId === p.id),
        );
        if (!candidate) return fail("Демо-персонажи закончились");
        mutate((d) => {
          d.requests.unshift({
            id: uid("r"),
            circleId,
            userId: candidate.id,
            message: "Привет! Хочу присоединиться, готов делать шаг каждую неделю.",
            status: "pending",
            createdAt: new Date().toISOString(),
          });
          notify(d, "requests", `Новая заявка в ваш круг «${c.title}» (демо)`, `#circle-${c.id}`);
        });
        return { ok: true };
      },

      leaveCircle(circleId: string): Result & { closed?: boolean; newOwner?: string } {
        const n = need();
        if (n) return n;
        const c = state!.circles.find((x) => x.id === circleId);
        if (!c || !c.members.includes(state!.meId!)) return fail("Вы не участник этого круга");
        const rest = c.members.filter((m) => m !== state!.meId);
        const closed = rest.length === 0;
        const newOwner = c.ownerId === state!.meId && !closed ? rest[0] : undefined;
        mutate((d) => {
          const cc = d.circles.find((x) => x.id === circleId)!;
          cc.members = cc.members.filter((m) => m !== d.meId);
          if (cc.members.length === 0) cc.status = "closed";
          else if (cc.ownerId === d.meId) cc.ownerId = cc.members[0];
        });
        return { ok: true, closed, newOwner };
      },

      removeMember(circleId: string, userId: string): Result {
        const c = state!.circles.find((x) => x.id === circleId);
        if (!c || c.ownerId !== state!.meId) return fail("Удалять участников может только создатель");
        if (userId === c.ownerId) return fail("Нельзя удалить создателя");
        mutate((d) => {
          const cc = d.circles.find((x) => x.id === circleId)!;
          cc.members = cc.members.filter((m) => m !== userId);
        });
        return { ok: true };
      },

      toggleMute(circleId: string) {
        mutate((d) => {
          d.mutedCircles = d.mutedCircles.includes(circleId) ? d.mutedCircles.filter((x) => x !== circleId) : [...d.mutedCircles, circleId];
        });
      },

      /* ---------- Шаги, комментарии, чат ---------- */
      postStep(circleId: string, body: string): Result {
        const n = need();
        if (n) return n;
        const c = state!.circles.find((x) => x.id === circleId)!;
        if (!c.members.includes(state!.meId!)) return fail("Публиковать шаги могут только участники");
        const text = body.trim();
        if (text.length < 3) return fail("Напишите хотя бы пару слов");
        if (text.length > 2000) return fail("Шаг — не больше 2000 символов");
        const week = Math.max(1, Math.min(currentWeek(c), c.weeks));
        mutate((d) => {
          d.steps.unshift({ id: uid("s"), circleId, authorId: d.meId!, week, body: text, createdAt: new Date().toISOString(), support: [], useful: [], baseSupport: 0, baseUseful: 0 });
        });
        return { ok: true };
      },

      deleteStep(stepId: string) {
        mutate((d) => {
          d.steps = d.steps.filter((s) => s.id !== stepId);
          d.comments = d.comments.filter((c) => c.stepId !== stepId);
        });
      },

      toggleReaction(stepId: string, kind: "support" | "useful"): Result {
        const n = need();
        if (n) return n;
        mutate((d) => {
          const s = d.steps.find((x) => x.id === stepId)!;
          const list = s[kind];
          s[kind] = list.includes(d.meId!) ? list.filter((x) => x !== d.meId) : [...list, d.meId!];
        });
        return { ok: true };
      },

      addComment(stepId: string, body: string): Result {
        const n = need();
        if (n) return n;
        const s = state!.steps.find((x) => x.id === stepId)!;
        const c = state!.circles.find((x) => x.id === s.circleId)!;
        if (!c.members.includes(state!.meId!)) return fail("Комментировать могут только участники");
        const text = body.trim();
        if (!text) return fail("Комментарий пустой");
        if (text.length > 1000) return fail("Комментарий — не больше 1000 символов");
        mutate((d) => {
          d.comments.push({ id: uid("cm"), stepId, authorId: d.meId!, body: text, createdAt: new Date().toISOString() });
        });
        return { ok: true };
      },

      deleteComment(commentId: string) {
        mutate((d) => {
          d.comments = d.comments.filter((c) => c.id !== commentId);
        });
      },

      sendMessage(circleId: string, body: string): Result {
        const n = need();
        if (n) return n;
        const c = state!.circles.find((x) => x.id === circleId)!;
        if (!c.members.includes(state!.meId!)) return fail("Писать в чат могут только участники");
        const text = body.trim();
        if (!text) return fail("Сообщение пустое");
        if (text.length > 1000) return fail("Сообщение — не больше 1000 символов");
        const recent = state!.messages.filter((m) => m.authorId === state!.meId && Date.now() - new Date(m.createdAt).getTime() < 60_000);
        if (recent.length >= 10) return fail("Слишком часто: не больше 10 сообщений в минуту");
        mutate((d) => {
          d.messages.push({ id: uid("m"), circleId, authorId: d.meId!, body: text, createdAt: new Date().toISOString() });
        });
        return { ok: true };
      },

      deleteMessage(messageId: string) {
        mutate((d) => {
          d.messages = d.messages.filter((m) => m.id !== messageId);
        });
      },

      /* ---------- Безопасность ---------- */
      report(targetType: "step" | "comment" | "message" | "user", targetId: string, reason: ReportReason): Result {
        const n = need();
        if (n) return n;
        if (state!.reports.some((r) => r.targetType === targetType && r.targetId === targetId)) return fail("Вы уже жаловались на это");
        const today = state!.reports.filter((r) => Date.now() - new Date(r.createdAt).getTime() < 86_400_000);
        if (today.length >= 10) return fail("Не больше 10 жалоб в сутки");
        mutate((d) => {
          d.reports.push({ id: uid("rp"), targetType, targetId, reason, createdAt: new Date().toISOString() });
          d.revealed = d.revealed.filter((x) => x !== targetId);
        });
        return { ok: true };
      },

      reveal(targetId: string) {
        mutate((d) => {
          if (!d.revealed.includes(targetId)) d.revealed.push(targetId);
        });
      },

      block(personId: string): Result {
        const n = need();
        if (n) return n;
        if (personId === state!.meId) return fail("Нельзя заблокировать себя");
        mutate((d) => {
          if (!d.blocks.includes(personId)) d.blocks.push(personId);
          d.requests.forEach((r) => {
            const c = d.circles.find((x) => x.id === r.circleId);
            if (r.userId === personId && r.status === "pending" && c?.ownerId === d.meId) r.status = "rejected";
          });
        });
        return { ok: true };
      },

      unblock(personId: string) {
        mutate((d) => {
          d.blocks = d.blocks.filter((x) => x !== personId);
        });
      },

      /* ---------- Уведомления ---------- */
      markRead(id: string) {
        mutate((d) => {
          const n = d.notifications.find((x) => x.id === id);
          if (n) n.read = true;
        });
      },
      markAllRead() {
        mutate((d) => d.notifications.forEach((n) => (n.read = true)));
      },
      setNotificationPref(type: NotificationType, channel: "inApp" | "email", value: boolean) {
        mutate((d) => {
          d.notificationSettings.prefs[type][channel] = value;
        });
      },
      setNotificationFlag(flag: "quietHours" | "digest" | "allOff", value: boolean) {
        mutate((d) => {
          d.notificationSettings[flag] = value;
        });
      },
    };
  }, [state, mutate]);

  return { state, persistent, actions };
}

type Store = ReturnType<typeof useDemoStore>;
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useDemoStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const s = useContext(StoreContext);
  if (!s || !s.state) throw new Error("Store не готов");
  const state = s.state;
  const me = state.meId ? state.people[state.meId] : null;
  return { state, me, actions: s.actions, persistent: s.persistent };
}

export function useStoreReady() {
  return !!useContext(StoreContext)?.state;
}
