"use client";

import { BanIcon, BellIcon, EditIcon, LogOutIcon, TrashIcon } from "@/components/icons";
import { Button, EmptyState, Toggle } from "@/components/ui";
import { useAccount } from "../auth";
import { useFeedback } from "../feedback";
import { go } from "../router";
import { Page, PageTitle } from "../shell";
import { timeAgo } from "../logic";
import type { NotificationSettings } from "../types";
import { ButtonLink } from "@/components/ui";

export function SettingsView() {
  const { me, isAnonymous, blocks, signOut, deleteAccount } = useAccount();
  const { toast, confirm } = useFeedback();
  const rows = [
    { href: "#profile-edit", icon: EditIcon, title: "Профиль и видимость", hint: "что и кому показывать" },
    { href: "#settings-notifications", icon: BellIcon, title: "Уведомления", hint: "о чём сообщать" },
    { href: "#settings-privacy", icon: BanIcon, title: "Заблокированные", hint: `${blocks.length} чел.` },
  ];
  return (
    <Page narrow>
      <PageTitle title="Настройки" fallback="#profile" sub={`Вы вошли как @${me!.nickname}`} />
      <ul className="overflow-hidden rounded-3xl border border-line bg-surface">
        {rows.map((r) => (
          <li key={r.href} className="border-b border-line last:border-b-0">
            <a href={r.href} className="flex items-center gap-3.5 px-5 py-4 hover:bg-paper">
              <r.icon size={20} className="text-ink-2" />
              <span className="flex-1">
                <span className="block font-semibold">{r.title}</span>
                <span className="text-[13px] text-ink-3">{r.hint}</span>
              </span>
              <span aria-hidden="true" className="text-ink-3">
                →
              </span>
            </a>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 mb-3 font-display text-lg font-medium">Аккаунт</h2>
      {isAnonymous && (
        <p className="mb-3 rounded-2xl bg-sun-soft px-4 py-3 text-sm leading-[1.5]">
          Вы вошли быстрым входом: аккаунт хранится в этом браузере. Если выйти или очистить браузер, вернуться в него не получится.
        </p>
      )}
      <div className="flex flex-col gap-2.5">
        <Button
          variant="secondary"
          className="justify-start"
          onClick={async () => {
            const ok = await confirm({
              title: "Выйти из аккаунта?",
              text: isAnonymous ? "Это аккаунт быстрого входа: после выхода войти в него снова будет нельзя, и вы потеряете доступ к своим кругам." : "Вы сможете войти снова.",
              confirmLabel: "Выйти",
              danger: isAnonymous,
            });
            if (!ok) return;
            await signOut();
            toast("Вы вышли из аккаунта", "info");
            go("#home");
          }}
        >
          <LogOutIcon size={18} /> Выйти
        </Button>
        <Button
          variant="dangerSoft"
          className="justify-start"
          onClick={async () => {
            const ok = await confirm({
              title: "Удалить аккаунт навсегда?",
              text: "Профиль, ваши комментарии и сообщения удалятся. Из кругов вы выйдете (роль создателя перейдёт участникам). Отменить нельзя.",
              confirmLabel: "Удалить навсегда",
              danger: true,
            });
            if (!ok) return;
            const r = await deleteAccount();
            if (!r.ok) return toast(r.error, "error");
            toast("Аккаунт удалён", "info");
            go("#home");
          }}
        >
          <TrashIcon size={18} /> Удалить аккаунт
        </Button>
      </div>
    </Page>
  );
}

const TYPES: { key: keyof NotificationSettings; title: string; hint: string }[] = [
  { key: "assigned", title: "Мне назначили задачу", hint: "кто-то сделал вас ответственным" },
  { key: "comments", title: "Комментарии к моим задачам", hint: "где я автор или ответственный" },
  { key: "joins", title: "Новые участники", hint: "в кругах, которые я создал" },
  { key: "done", title: "Мою задачу выполнили", hint: "задачи, которые я создал" },
];

export function NotificationSettingsView() {
  const { settings, saveSettings } = useAccount();
  const { toast } = useFeedback();
  if (!settings) return null;
  const set = async (k: keyof NotificationSettings, v: boolean, label: string) => {
    const r = await saveSettings({ [k]: v });
    toast(r.ok ? `${label}: ${v ? "вкл" : "выкл"}` : r.error, r.ok ? "success" : "error");
  };
  return (
    <Page narrow>
      <PageTitle title="Уведомления" fallback="#settings" sub="Только внутри приложения. Мы никогда не пишем «вы давно не заходили»." />
      <div className="overflow-hidden rounded-3xl border border-line bg-surface">
        {TYPES.map((t) => (
          <div key={t.key} className="flex items-center gap-3 border-b border-line px-5 py-3.5 last:border-b-0">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{t.title}</span>
              <span className="text-[13px] text-ink-3">{t.hint}</span>
            </span>
            <Toggle label={t.title} checked={settings[t.key] as boolean} disabled={settings.all_off} onChange={(v) => set(t.key, v, t.title)} />
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-3xl border border-line bg-surface px-5 py-3.5">
        <span className="flex-1 font-semibold text-danger">Выключить все уведомления</span>
        <Toggle label="Выключить все уведомления" checked={settings.all_off} onChange={(v) => set("all_off", v, "Все уведомления выключены")} />
      </div>
    </Page>
  );
}

export function PrivacySettingsView() {
  const { blocks, unblock } = useAccount();
  const { toast } = useFeedback();
  return (
    <Page narrow>
      <PageTitle title="Заблокированные" fallback="#settings" sub="Их комментарии и сообщения скрыты от вас, они не видят ваш профиль и не могут вступить в ваши круги." />
      {blocks.length === 0 ? (
        <EmptyState title="Вы никого не блокировали" text="Заблокировать можно из профиля участника или при жалобе." icon={<BanIcon />} />
      ) : (
        <ul className="overflow-hidden rounded-3xl border border-line bg-surface">
          {blocks.map((id) => (
            <li key={id} className="flex items-center gap-3 border-b border-line px-5 py-3.5 last:border-b-0" data-testid="blocked">
              <span className="flex-1 font-semibold">Пользователь {id.slice(0, 6)}…</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await unblock(id);
                  toast("Разблокирован", "info");
                }}
              >
                Разблокировать
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}

export function NotificationsView() {
  const { notifications, markRead } = useAccount();
  const unread = notifications.filter((n) => !n.read_at).length;
  return (
    <Page narrow>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-[30px] leading-[1.1] font-medium tracking-[-0.045em] md:text-[40px]">Уведомления</h1>
        <div className="flex gap-2">
          {unread > 0 && (
            <Button variant="secondary" size="sm" onClick={() => markRead()}>
              Прочитать все
            </Button>
          )}
          <ButtonLink href="#settings-notifications" variant="ghost" size="sm">
            Настройки
          </ButtonLink>
        </div>
      </div>
      {notifications.length === 0 ? (
        <EmptyState title="Тихо — и это нормально" text="Мы сообщаем только о важном: вам назначили задачу, прокомментировали, в круг вступил новый участник." icon={<BellIcon />} />
      ) : (
        <ul className="overflow-hidden rounded-3xl border border-line bg-surface">
          {notifications.map((n) => (
            <li key={n.id} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => {
                  markRead(n.id);
                  if (n.circle_id) go(`#circle-${n.circle_id}`);
                }}
                className={`flex w-full cursor-pointer items-start gap-3 px-5 py-4 text-left hover:bg-paper ${n.read_at ? "" : "bg-mint/40"}`}
                data-testid="notification"
              >
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-coral"}`} aria-hidden="true" />
                <span className="flex-1">
                  <span className={`block text-[15px] ${n.read_at ? "" : "font-semibold"}`}>{n.text}</span>
                  <span className="text-[13px] text-ink-3">{timeAgo(n.created_at)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
