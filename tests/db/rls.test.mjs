/**
 * Проверка серверной логики и прав доступа (RLS) на локальном Supabase.
 *   npx supabase start && node tests/db/rls.test.mjs
 */
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

const URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const sfx = Date.now().toString(36).slice(-5);
let passed = 0;
const ok = (name) => { passed++; console.log("  ✓", name); };
const expectError = async (p, re, name) => {
  const { error } = await p;
  assert.ok(error, `${name}: ожидалась ошибка`);
  if (re) assert.match(error.message, re, `${name}: ${error.message}`);
  ok(name);
};

async function user(nick) {
  const c = createClient(URL, KEY, opts);
  const { data, error } = await c.auth.signInAnonymously();
  if (error) throw error;
  const { error: e2 } = await c.from("profiles").insert({ id: data.user.id, nickname: nick });
  if (e2) throw e2;
  await c.from("notification_settings").insert({ user_id: data.user.id });
  return { c, id: data.user.id, nick };
}

const anya = await user("anya_" + sfx);
const boris = await user("boris_" + sfx);
const eve = await user("eve_" + sfx);
console.log("Пользователи созданы");

// Круг
const { data: circleId, error: ce } = await anya.c.rpc("create_circle", { p_title: "Переезд офиса", p_goal: "Переехать к 30 ноября", p_description: "", p_deadline: "2026-12-30", p_capacity: 5, p_telegram: "https://t.me/office_move" });
assert.ifError(ce); ok("создатель создаёт круг");

let r = await eve.c.from("circles").select("*").eq("id", circleId);
assert.equal(r.data.length, 0); ok("посторонний не видит чужой круг");
r = await eve.c.from("circle_private").select("*").eq("circle_id", circleId);
assert.equal(r.data.length, 0); ok("посторонний не видит ссылку на Telegram");

await expectError(boris.c.rpc("create_invite", { p_circle: circleId }), /создатель/, "участник/посторонний не может создать приглашение");
const { data: code, error: ie } = await anya.c.rpc("create_invite", { p_circle: circleId, p_days: 7 });
assert.ifError(ie); assert.match(code, /^[A-Z2-9]{8}$/); ok("создатель получает код приглашения " + code);

r = await boris.c.from("invites").select("*");
assert.equal(r.data.length, 0); ok("коды приглашений видит только создатель");

const prev = await boris.c.rpc("preview_invite", { p_code: code.slice(0, 4) + "-" + code.slice(4).toLowerCase() });
assert.equal(prev.data[0].title, "Переезд офиса"); assert.equal(prev.data[0].problem, null); ok("предпросмотр по коду (с дефисом и строчными)");

const j = await boris.c.rpc("join_by_code", { p_code: code });
assert.equal(j.data, circleId); ok("вступление по коду");
r = await boris.c.from("circle_private").select("telegram_url").eq("circle_id", circleId).single();
assert.equal(r.data.telegram_url, "https://t.me/office_move"); ok("участник видит Telegram-ссылку");

await expectError(eve.c.rpc("join_by_code", { p_code: "ZZZZZZZZ" }), /не найдено/, "неверный код");

// Профили
await anya.c.from("profiles").update({ about: "Люблю порядок", vis_about: "circles", interests: ["Логистика"], vis_interests: "private" }).eq("id", anya.id);
r = await boris.c.rpc("get_profiles", { ids: [anya.id, eve.id] });
assert.equal(r.data.length, 1, "Ева не должна быть видна (нет общего круга)");
assert.equal(r.data[0].about, "Люблю порядок"); assert.deepEqual(r.data[0].interests, []); ok("профиль: «Мои круги» видно, «Только я» скрыто, чужие без общего круга не видны");
r = await boris.c.from("profiles").select("*").eq("id", anya.id);
assert.equal(r.data.length, 0); ok("таблицу профилей напрямую не прочитать");

// Задачи
const t1 = await anya.c.from("tasks").insert({ circle_id: circleId, title: "Купить коробки", assignee_id: boris.id, due_date: "2026-11-20" }).select().single();
assert.ifError(t1.error); ok("задача с ответственным");
const t2 = await boris.c.from("tasks").insert({ circle_id: circleId, title: "Найти грузчиков" }).select().single();
assert.ifError(t2.error);
await expectError(eve.c.from("tasks").insert({ circle_id: circleId, title: "Спам" }), null, "посторонний не может добавить задачу");
await expectError(anya.c.from("tasks").insert({ circle_id: circleId, title: "x", assignee_id: eve.id }), /участником/, "ответственный — только участник");

const pinB = await boris.c.from("tasks").update({ pinned: true }).eq("id", t1.data.id);
assert.match(pinB.error?.message ?? "", /создатель круга/); ok("закрепить может только создатель");
const pinA = await anya.c.from("tasks").update({ pinned: true }).eq("id", t1.data.id).select().single();
assert.equal(pinA.data.pinned, true); ok("создатель закрепляет задачу");

const done = await boris.c.from("tasks").update({ status: "done" }).eq("id", t1.data.id).select().single();
assert.equal(done.data.status, "done"); assert.equal(done.data.completed_by, boris.id); ok("ответственный отмечает выполнение");

const t3 = await anya.c.from("tasks").insert({ circle_id: circleId, title: "Заказать пиццу", assignee_id: anya.id }).select().single();
const bad = await boris.c.from("tasks").update({ status: "done" }).eq("id", t3.data.id);
assert.match(bad.error?.message ?? "", /ответственный/); ok("чужую задачу отметить нельзя");
const take = await anya.c.from("tasks").update({ assignee_id: anya.id }).eq("id", t2.data.id).select().single();
assert.equal(take.data.assignee_id, anya.id); ok("создатель круга переназначает задачу");

// Комментарии и чат
const cm = await boris.c.from("task_comments").insert({ task_id: t3.data.id, circle_id: circleId, body: "Какую пиццу?" });
assert.ifError(cm.error); ok("комментарий к задаче");
const msg = await boris.c.from("messages").insert({ circle_id: circleId, body: "Привет всем" });
assert.ifError(msg.error); ok("сообщение в чат");
await anya.c.from("circles").update({ chat_enabled: false }).eq("id", circleId);
await expectError(boris.c.from("messages").insert({ circle_id: circleId, body: "ещё" }), null, "чат выключен — писать нельзя");
await anya.c.from("circles").update({ chat_enabled: true }).eq("id", circleId);
await expectError(eve.c.from("messages").insert({ circle_id: circleId, body: "спам" }), null, "посторонний не пишет в чат");

// Уведомления
r = await boris.c.from("notifications").select("*");
assert.ok(r.data.some((n) => n.kind === "assigned")); ok("уведомление «вам назначили задачу»");
r = await anya.c.from("notifications").select("*");
assert.ok(r.data.some((n) => n.kind === "join")); assert.ok(r.data.some((n) => n.kind === "comment")); ok("уведомления о вступлении и комментарии");

// Синхронизация в реальном времени (ключ доступа — до подписки)
await boris.c.realtime.setAuth((await boris.c.auth.getSession()).data.session.access_token);
await eve.c.realtime.setAuth((await eve.c.auth.getSession()).data.session.access_token);
// При холодном старте (например, в CI) сервису синхронизации нужно несколько секунд — повторяем изменение, пока не дойдёт
const got = new Promise((resolve, reject) => {
  let timer;
  const to = setTimeout(() => { clearInterval(timer); reject(new Error("Realtime: событие не пришло за 30 с")); }, 30000);
  const ch = boris.c.channel("t").on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `circle_id=eq.${circleId}` }, (p) => {
    if (p.new?.title?.startsWith("Синхронная задача")) { clearTimeout(to); clearInterval(timer); ch.unsubscribe(); resolve(p); }
  });
  ch.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      let k = 0;
      const fire = () => anya.c.from("tasks").insert({ circle_id: circleId, title: `Синхронная задача ${++k}` });
      setTimeout(fire, 500);
      timer = setInterval(fire, 3000);
    }
  });
});
await got; ok("изменение Ани приходит Борису в реальном времени");

const leak = new Promise((resolve) => {
  let seen = false;
  const ch = eve.c.channel("e").on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => { seen = true; });
  ch.subscribe(async (s) => {
    if (s === "SUBSCRIBED") {
      await new Promise((r2) => setTimeout(r2, 500));
      await anya.c.from("tasks").insert({ circle_id: circleId, title: "Секретная" });
      setTimeout(() => { ch.unsubscribe(); resolve(seen); }, 2500);
    }
  });
});
assert.equal(await leak, false); ok("посторонний не получает изменения чужого круга");

// Выход и передача роли
const lv = await anya.c.rpc("leave_circle", { p_circle: circleId });
assert.equal(lv.data, "transferred");
r = await boris.c.from("circles").select("owner_id").eq("id", circleId).single();
assert.equal(r.data.owner_id, boris.id); ok("создатель вышел — роль перешла участнику");
r = await anya.c.from("tasks").select("*").eq("circle_id", circleId);
assert.equal(r.data.length, 0); ok("вышедший больше не видит задачи");

// Удаление аккаунта
const del = await eve.c.rpc("delete_my_account");
assert.ifError(del.error); ok("удаление аккаунта");

console.log(`\nВсе проверки пройдены: ${passed}`);
process.exit(0);
