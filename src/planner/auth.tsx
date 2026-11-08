"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { run, sb, type Result } from "./supabase";
import type { AppNotification, MyProfile, NotificationSettings, ReportReason, ReportTarget } from "./types";

type Account = {
  ready: boolean;
  session: Session | null;
  /** Профиль текущего пользователя (null — вошёл, но ещё не выбрал никнейм) */
  me: MyProfile | null;
  isAnonymous: boolean;
  settings: NotificationSettings | null;
  blocks: string[];
  reported: Set<string>;
  notifications: AppNotification[];
  unread: number;
  quickSignIn: (nickname: string) => Promise<Result>;
  createProfile: (nickname: string) => Promise<Result>;
  saveProfile: (p: Partial<MyProfile>) => Promise<Result>;
  saveSettings: (p: Partial<NotificationSettings>) => Promise<Result>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<Result>;
  block: (id: string) => Promise<Result>;
  unblock: (id: string) => Promise<Result>;
  report: (type: ReportTarget, id: string, reason: ReportReason) => Promise<Result>;
  markRead: (id?: number) => Promise<void>;
  reloadNotifications: () => Promise<void>;
};

const Ctx = createContext<Account | null>(null);

export function useAccount() {
  const a = useContext(Ctx);
  if (!a) throw new Error("AccountProvider отсутствует");
  return a;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<MyProfile | null>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [reported, setReported] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const uid = session?.user.id ?? null;

  useEffect(() => {
    const client = sb();
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setReady(true);
    });
    const { data: sub } = client.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!uid) return;
    const { data } = await sb().from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
    setNotifications((data as AppNotification[]) ?? []);
  }, [uid]);

  // Загрузка данных пользователя после входа
  useEffect(() => {
    if (!uid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- сброс при выходе
      setMe(null);
      setSettings(null);
      setBlocks([]);
      setReported(new Set());
      setNotifications([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const client = sb();
      await client.realtime.setAuth(session?.access_token ?? null);
      const [p, s, b, r] = await Promise.all([
        client.from("profiles").select("*").eq("id", uid).maybeSingle(),
        client.from("notification_settings").select("*").eq("user_id", uid).maybeSingle(),
        client.from("blocks").select("blocked_id"),
        client.from("reports").select("target_id"),
      ]);
      if (cancelled) return;
      // Профиль мог появиться, пока шёл запрос (быстрый вход создаёт его параллельно) — пустой ответ не затирает его
      setMe((prev) => (p.data as MyProfile) ?? (prev?.id === uid ? prev : null));
      setSettings((prev) => (s.data as NotificationSettings) ?? (prev?.user_id === uid ? prev : null));
      setBlocks(((b.data as { blocked_id: string }[]) ?? []).map((x) => x.blocked_id));
      setReported(new Set(((r.data as { target_id: string }[]) ?? []).map((x) => x.target_id)));
      await loadNotifications();
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, session?.access_token, loadNotifications]);

  // Уведомления приходят сразу
  useEffect(() => {
    if (!uid) return;
    const ch = sb()
      .channel(`notif-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` }, () => loadNotifications())
      .subscribe();
    return () => {
      sb().removeChannel(ch);
    };
  }, [uid, loadNotifications]);

  const createProfile = useCallback(async (nickname: string): Promise<Result> => {
    const { data } = await sb().auth.getUser();
    const id = data.user?.id;
    if (!id) return { ok: false, error: "Не удалось войти — попробуйте ещё раз" };
    const nick = nickname.trim();
    if (!/^[A-Za-z0-9_]{3,20}$/.test(nick)) return { ok: false, error: "Никнейм: 3–20 символов — латиница, цифры или «_»" };
    const r = await run(sb().from("profiles").insert({ id, nickname: nick }).select().single());
    if (!r.ok) return r;
    await sb().from("notification_settings").insert({ user_id: id });
    setMe(r.data as MyProfile);
    const s = await sb().from("notification_settings").select("*").eq("user_id", id).maybeSingle();
    setSettings((s.data as NotificationSettings) ?? null);
    return { ok: true, data: undefined };
  }, []);

  const value = useMemo<Account>(
    () => ({
      ready,
      session,
      me,
      isAnonymous: !!session?.user.is_anonymous,
      settings,
      blocks,
      reported,
      notifications,
      unread: notifications.filter((n) => !n.read_at).length,

      async quickSignIn(nickname) {
        const nick = nickname.trim();
        if (!/^[A-Za-z0-9_]{3,20}$/.test(nick)) return { ok: false, error: "Никнейм: 3–20 символов — латиница, цифры или «_»" };
        if (!session) {
          const r = await run(sb().auth.signInAnonymously());
          if (!r.ok) return r;
        }
        const res = await createProfile(nick);
        if (!res.ok && /занят/.test(res.error) && !session) {
          // Не оставляем «пустой» аккаунт, если никнейм занят — пользователь попробует другой
        }
        return res;
      },

      createProfile,

      async saveProfile(p) {
        if (!me) return { ok: false, error: "Нужно войти" };
        const r = await run(sb().from("profiles").update(p).eq("id", me.id).select().single());
        if (r.ok) setMe(r.data as MyProfile);
        return r.ok ? { ok: true, data: undefined } : r;
      },

      async saveSettings(p) {
        if (!uid) return { ok: false, error: "Нужно войти" };
        const prev = settings;
        if (settings) setSettings({ ...settings, ...p });
        const r = await run(sb().from("notification_settings").upsert({ user_id: uid, ...settings, ...p }).select().single());
        if (r.ok) setSettings(r.data as NotificationSettings);
        else setSettings(prev);
        return r.ok ? { ok: true, data: undefined } : r;
      },

      async signOut() {
        await sb().auth.signOut();
      },

      async deleteAccount() {
        const r = await run(sb().rpc("delete_my_account"));
        if (r.ok) await sb().auth.signOut();
        return r.ok ? { ok: true, data: undefined } : r;
      },

      async block(id) {
        const r = await run(sb().from("blocks").insert({ blocked_id: id }));
        if (r.ok || /duplicate/i.test(r.ok ? "" : r.error)) setBlocks((b) => (b.includes(id) ? b : [...b, id]));
        return r.ok ? { ok: true, data: undefined } : r;
      },

      async unblock(id) {
        const r = await run(sb().from("blocks").delete().eq("blocked_id", id));
        if (r.ok) setBlocks((b) => b.filter((x) => x !== id));
        return r.ok ? { ok: true, data: undefined } : r;
      },

      async report(type, id, reason) {
        const r = await run(sb().from("reports").insert({ target_type: type, target_id: id, reason }));
        if (r.ok) setReported((s) => new Set(s).add(id));
        return r.ok ? { ok: true, data: undefined } : r;
      },

      async markRead(id) {
        const now = new Date().toISOString();
        setNotifications((list) => list.map((n) => (id === undefined || n.id === id ? { ...n, read_at: n.read_at ?? now } : n)));
        const q = sb().from("notifications").update({ read_at: now }).is("read_at", null);
        await (id === undefined ? q : q.eq("id", id));
      },

      reloadNotifications: loadNotifications,
    }),
    [ready, session, me, settings, blocks, reported, notifications, uid, createProfile, loadNotifications],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
