"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { run, sb, type Result } from "./supabase";
import type { Activity, Circle, Invite, Member, Message, PublicProfile, Task, TaskComment } from "./types";

/* ---------- Мои круги ---------- */

export type CircleSummary = Circle & { members: Member[]; tasks: Pick<Task, "id" | "status" | "assignee_id">[] };

export function useMyCircles(uid: string | null) {
  const [circles, setCircles] = useState<CircleSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!uid) return;
    const r = await run(
      sb().from("circles").select("*, members:circle_members(*), tasks(id,status,assignee_id)").eq("status", "active").order("created_at", { ascending: false }),
    );
    if (r.ok) {
      // RLS отдаёт только круги, где я участник
      setCircles(r.data as unknown as CircleSummary[]);
      setError(null);
    } else setError(r.error);
  }, [uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- первичная загрузка с сервера
    load();
    if (!uid) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const soon = () => {
      clearTimeout(t);
      t = setTimeout(load, 250);
    };
    const ch = sb()
      .channel(`my-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "circle_members" }, soon)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, soon)
      .on("postgres_changes", { event: "*", schema: "public", table: "circles" }, soon)
      .subscribe();
    return () => {
      clearTimeout(t);
      sb().removeChannel(ch);
    };
  }, [uid, load]);

  return { circles, error, reload: load };
}

/* ---------- Один круг ---------- */

export type CircleData = {
  circle: Circle;
  telegram: string | null;
  members: Member[];
  profiles: Record<string, PublicProfile>;
  tasks: Task[];
  comments: TaskComment[];
  messages: Message[];
  activity: Activity[];
  invites: Invite[];
};

type Part = "circle" | "members" | "tasks" | "comments" | "messages" | "activity" | "invites";

export function useCircle(id: string, uid: string | null) {
  const [data, setData] = useState<CircleData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState<string[]>([]);
  const [live, setLive] = useState(false);
  const dataRef = useRef<CircleData | null>(null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const fetchProfiles = useCallback(async (ids: string[]) => {
    if (!ids.length) return {};
    const { data: rows } = await sb().rpc("get_profiles", { ids });
    return Object.fromEntries(((rows as PublicProfile[]) ?? []).map((p) => [p.id, p]));
  }, []);

  const loadAll = useCallback(async () => {
    const c = sb();
    const circle = await c.from("circles").select("*").eq("id", id).maybeSingle();
    if (circle.error) {
      setStatus("error");
      setError(circle.error.message);
      return;
    }
    if (!circle.data) {
      setStatus("missing");
      setData(null);
      return;
    }
    const isOwner = circle.data.owner_id === uid;
    const [priv, members, tasks, comments, messages, activity, invites] = await Promise.all([
      c.from("circle_private").select("telegram_url").eq("circle_id", id).maybeSingle(),
      c.from("circle_members").select("*").eq("circle_id", id).order("joined_at"),
      c.from("tasks").select("*").eq("circle_id", id).order("created_at"),
      c.from("task_comments").select("*").eq("circle_id", id).order("created_at"),
      c.from("messages").select("*").eq("circle_id", id).order("created_at", { ascending: false }).limit(200),
      c.from("activity").select("*").eq("circle_id", id).order("created_at", { ascending: false }).limit(30),
      isOwner ? c.from("invites").select("*").eq("circle_id", id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    ]);
    const mem = (members.data as Member[]) ?? [];
    const msgs = ((messages.data as Message[]) ?? []).reverse();
    const ids = Array.from(new Set([...mem.map((m) => m.user_id), ...msgs.map((m) => m.author_id), ...((comments.data as TaskComment[]) ?? []).map((x) => x.author_id)]));
    setData({
      circle: circle.data as Circle,
      telegram: (priv.data as { telegram_url: string | null } | null)?.telegram_url ?? null,
      members: mem,
      profiles: await fetchProfiles(ids),
      tasks: (tasks.data as Task[]) ?? [],
      comments: (comments.data as TaskComment[]) ?? [],
      messages: msgs,
      activity: (activity.data as Activity[]) ?? [],
      invites: (invites.data as Invite[]) ?? [],
    });
    setStatus("ok");
  }, [id, uid, fetchProfiles]);

  /** Точечная перезагрузка одной части данных — после события синхронизации. */
  const loadPart = useCallback(
    async (part: Part) => {
      const c = sb();
      const cur = dataRef.current;
      if (!cur) return loadAll();
      if (part === "circle" || part === "members") return loadAll(); // меняются права и список людей
      if (part === "tasks") {
        const { data: rows } = await c.from("tasks").select("*").eq("circle_id", id).order("created_at");
        setData((d) => (d ? { ...d, tasks: (rows as Task[]) ?? d.tasks } : d));
      } else if (part === "comments") {
        const { data: rows } = await c.from("task_comments").select("*").eq("circle_id", id).order("created_at");
        const list = (rows as TaskComment[]) ?? [];
        const missing = list.map((x) => x.author_id).filter((a) => !cur.profiles[a]);
        const extra = await fetchProfiles(Array.from(new Set(missing)));
        setData((d) => (d ? { ...d, comments: list, profiles: { ...d.profiles, ...extra } } : d));
      } else if (part === "messages") {
        const { data: rows } = await c.from("messages").select("*").eq("circle_id", id).order("created_at", { ascending: false }).limit(200);
        const list = ((rows as Message[]) ?? []).reverse();
        const missing = list.map((x) => x.author_id).filter((a) => !cur.profiles[a]);
        const extra = await fetchProfiles(Array.from(new Set(missing)));
        setData((d) => (d ? { ...d, messages: list, profiles: { ...d.profiles, ...extra } } : d));
      } else if (part === "activity") {
        const { data: rows } = await c.from("activity").select("*").eq("circle_id", id).order("created_at", { ascending: false }).limit(30);
        setData((d) => (d ? { ...d, activity: (rows as Activity[]) ?? [] } : d));
      } else if (part === "invites") {
        const { data: rows } = await c.from("invites").select("*").eq("circle_id", id).order("created_at", { ascending: false });
        setData((d) => (d ? { ...d, invites: (rows as Invite[]) ?? [] } : d));
      }
    },
    [id, loadAll, fetchProfiles],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- первичная загрузка с сервера
    loadAll();
    if (!uid) return;
    const timers: Partial<Record<Part, ReturnType<typeof setTimeout>>> = {};
    const soon = (p: Part) => () => {
      clearTimeout(timers[p]);
      timers[p] = setTimeout(() => loadPart(p), 120);
    };
    const f = `circle_id=eq.${id}`;
    const ch = sb()
      .channel(`circle-${id}`, { config: { presence: { key: uid } } })
      .on("postgres_changes", { event: "*", schema: "public", table: "circles", filter: `id=eq.${id}` }, soon("circle"))
      .on("postgres_changes", { event: "*", schema: "public", table: "circle_private", filter: f }, soon("circle"))
      .on("postgres_changes", { event: "*", schema: "public", table: "circle_members", filter: f }, soon("members"))
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: f }, soon("tasks"))
      .on("postgres_changes", { event: "*", schema: "public", table: "task_comments", filter: f }, soon("comments"))
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: f }, soon("messages"))
      .on("postgres_changes", { event: "*", schema: "public", table: "activity", filter: f }, soon("activity"))
      .on("presence", { event: "sync" }, () => {
        setOnline(Object.keys(ch.presenceState()));
      })
      .subscribe(async (s) => {
        setLive(s === "SUBSCRIBED");
        if (s === "SUBSCRIBED") await ch.track({ at: Date.now() });
      });
    // Если пропустили события (сон телефона, обрыв) — перечитываем всё при возвращении на вкладку
    const onVisible = () => document.visibilityState === "visible" && loadAll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      Object.values(timers).forEach(clearTimeout);
      document.removeEventListener("visibilitychange", onVisible);
      sb().removeChannel(ch);
    };
  }, [id, uid, loadAll, loadPart]);

  /** Мгновенно меняем задачу на экране (до ответа сервера). */
  const patchTask = useCallback((taskId: string, patch: Partial<Task>) => {
    setData((d) => (d ? { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) } : d));
  }, []);

  return { data, status, error, online, live, reload: loadAll, reloadPart: loadPart, patchTask };
}

/* ---------- Действия ---------- */

const ok = <T>(r: Result<T>): Result => (r.ok ? { ok: true, data: undefined } : r);

export const api = {
  async createCircle(p: { title: string; goal: string; description: string; deadline: string; capacity: number; telegram: string }) {
    return run<string>(
      sb().rpc("create_circle", { p_title: p.title, p_goal: p.goal, p_description: p.description, p_deadline: p.deadline, p_capacity: p.capacity, p_telegram: p.telegram }),
    );
  },
  async updateCircle(id: string, patch: Partial<Pick<Circle, "title" | "goal" | "description" | "deadline" | "capacity" | "chat_enabled">>) {
    return ok(await run(sb().from("circles").update(patch).eq("id", id)));
  },
  async setTelegram(id: string, url: string | null) {
    return ok(await run(sb().from("circle_private").update({ telegram_url: url }).eq("circle_id", id)));
  },
  async createInvite(circleId: string, days = 7) {
    return run<string>(sb().rpc("create_invite", { p_circle: circleId, p_days: days }));
  },
  async revokeInvite(inviteId: string) {
    return ok(await run(sb().rpc("revoke_invite", { p_invite: inviteId })));
  },
  async previewInvite(code: string) {
    return run<
      { circle_id: string | null; title: string | null; goal: string | null; owner_nickname: string | null; members: number; capacity: number; already_member: boolean; problem: string | null }[]
    >(sb().rpc("preview_invite", { p_code: code }));
  },
  async joinByCode(code: string) {
    return run<string>(sb().rpc("join_by_code", { p_code: code }));
  },
  async leave(circleId: string) {
    return run<string>(sb().rpc("leave_circle", { p_circle: circleId }));
  },
  async removeMember(circleId: string, userId: string) {
    return ok(await run(sb().rpc("remove_member", { p_circle: circleId, p_user: userId })));
  },
  async addTask(circleId: string, t: { title: string; due_date: string | null; assignee_id: string | null; notes?: string }) {
    const { data: u } = await sb().auth.getUser();
    return run<Task>(sb().from("tasks").insert({ circle_id: circleId, created_by: u.user?.id, ...t }).select().single());
  },
  async updateTask(taskId: string, patch: Partial<Pick<Task, "title" | "notes" | "due_date" | "assignee_id" | "status" | "pinned">>) {
    return ok(await run(sb().from("tasks").update(patch).eq("id", taskId).select().single()));
  },
  async deleteTask(taskId: string) {
    return ok(await run(sb().from("tasks").delete().eq("id", taskId)));
  },
  async addComment(task: Task, body: string) {
    const { data: u } = await sb().auth.getUser();
    return ok(await run(sb().from("task_comments").insert({ task_id: task.id, circle_id: task.circle_id, author_id: u.user?.id, body })));
  },
  async deleteComment(id: string) {
    return ok(await run(sb().from("task_comments").delete().eq("id", id)));
  },
  async sendMessage(circleId: string, body: string) {
    const { data: u } = await sb().auth.getUser();
    return ok(await run(sb().from("messages").insert({ circle_id: circleId, author_id: u.user?.id, body })));
  },
  async deleteMessage(id: string) {
    return ok(await run(sb().from("messages").delete().eq("id", id)));
  },
  async getProfile(id: string) {
    const r = await run<PublicProfile[]>(sb().rpc("get_profiles", { ids: [id] }));
    return r.ok ? { ok: true as const, data: r.data[0] ?? null } : r;
  },
};
