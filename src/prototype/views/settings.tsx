"use client";

import { useState } from "react";
import { BanIcon, BellIcon, EditIcon, InfoIcon, LogOutIcon, MailIcon, MoonIcon, TrashIcon } from "@/components/icons";
import { Avatar, Button, EmptyState, Toggle } from "@/components/ui";
import { Modal, useFeedback } from "../feedback";
import { go } from "../router";
import { Page, PageTitle } from "../shell";
import { STORAGE_KEY, useStore } from "../store";
import type { NotificationType } from "../types";

export function SettingsView() {
  const { state, me, actions } = useStore();
  const { toast, confirm } = useFeedback();
  const [dataOpen, setDataOpen] = useState(false);

  const myData = {
    профиль: me,
    круги: state.circles.filter((c) => c.members.includes(me!.id)).map((c) => ({ id: c.id, название: c.title, роль: c.ownerId === me!.id ? "создатель" : "участник" })),
    шаги: state.steps.filter((s) => s.authorId === me!.id),
    комментарии: state.comments.filter((c) => c.authorId === me!.id),
    сообщения: state.messages.filter((m) => m.authorId === me!.id),
    заявки: state.requests.filter((r) => r.userId === me!.id),
    жалобы: state.reports,
    заблокированные: state.blocks,
    настройкиУведомлений: state.notificationSettings,
  };
  const json = JSON.stringify(myData, null, 2);

  const rows = [
    { href: "#profile-edit", icon: EditIcon, title: "Профиль и видимость", hint: "что и кому показывать" },
    { href: "#settings-notifications", icon: BellIcon, title: "Уведомления", hint: "о чём и как сообщать" },
    { href: "#settings-privacy", icon: BanIcon, title: "Заблокированные", hint: `${state.blocks.length} чел.` },
  ];

  return (
    <Page narrow>
      <PageTitle title="Настройки" fallback="#profile" />
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

      <h2 className="mt-8 mb-3 font-display text-lg font-medium">Данные</h2>
      <div className="flex flex-col gap-2.5">
        <Button variant="secondary" className="justify-start" onClick={() => setDataOpen(true)}>
          <InfoIcon size={18} /> Показать мои данные
        </Button>
        <Button
          variant="secondary"
          className="justify-start"
          onClick={async () => {
            if (!(await confirm({ title: "Сбросить демо-данные?", text: "Всё вернётся к исходному состоянию: ваши круги, шаги, сообщения и профиль удалятся. Отменить нельзя.", confirmLabel: "Сбросить", danger: true }))) return;
            actions.resetDemo();
            toast("Демо-данные сброшены", "info");
            go("#home");
          }}
        >
          <TrashIcon size={18} /> Сбросить демо-данные
        </Button>
        <Button
          variant="dangerSoft"
          className="justify-start"
          onClick={async () => {
            if (!(await confirm({ title: "Выйти из демо-режима?", text: "В демо нет сервера, поэтому выход удаляет все данные этого браузера. В настоящей версии здесь будут «Выйти» и отдельно «Удалить аккаунт».", confirmLabel: "Выйти и удалить", danger: true }))) return;
            try {
              window.localStorage.removeItem(STORAGE_KEY);
            } catch {}
            actions.resetDemo();
            toast("Вы вышли из демо-режима", "info");
            go("#home");
          }}
        >
          <LogOutIcon size={18} /> Выйти из демо
        </Button>
      </div>

      {dataOpen && (
        <Modal onClose={() => setDataOpen(false)} label="Мои данные" wide>
          <h2 className="font-display text-xl font-medium">Мои данные</h2>
          <p className="mt-1 text-sm text-ink-2">Всё, что прототип хранит о вас в этом браузере. В настоящей версии — выгрузка файлом.</p>
          <pre className="mt-4 max-h-[50vh] overflow-auto rounded-2xl bg-paper p-4 text-xs leading-[1.5]">{json}</pre>
          <Button
            className="mt-4 w-full"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(json);
                toast("Скопировано", "success");
              } catch {
                toast("Браузер не дал скопировать — выделите текст вручную", "error");
              }
            }}
          >
            Скопировать
          </Button>
        </Modal>
      )}
    </Page>
  );
}

const TYPES: { type: NotificationType; title: string; hint: string }[] = [
  { type: "requests", title: "Заявки и вступления", hint: "заявки в мои круги, ответы на мои заявки" },
  { type: "replies", title: "Ответы мне", hint: "комментарии к моим шагам" },
  { type: "newSteps", title: "Новые шаги в круге", hint: "от любого участника" },
  { type: "reminders", title: "Напоминание о шаге", hint: "за день до конца недели" },
  { type: "circleEnd", title: "Круг завершается", hint: "и пора подвести итог" },
  { type: "news", title: "Новости «Сообща»", hint: "не чаще раза в месяц" },
];

export function NotificationSettingsView() {
  const { state, actions } = useStore();
  const { toast } = useFeedback();
  const s = state.notificationSettings;
  const changed = (text: string) => toast(text, "success");

  return (
    <Page narrow>
      <PageTitle title="Уведомления" fallback="#settings" sub="Выберите, о чём и как сообщать. Мы никогда не пишем «вы давно не заходили»." />
      <p className="mb-4 flex items-start gap-2 rounded-2xl bg-lilac-soft px-4 py-3 text-sm">
        <MailIcon size={18} className="mt-0.5 shrink-0" />
        В демо-режиме письма не отправляются: переключатели «Почта» сохраняются, но писем не будет.
      </p>

      <div className="overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="flex items-center gap-3 border-b border-line bg-paper/60 px-5 py-2.5 text-xs font-semibold text-ink-3">
          <span className="flex-1 tracking-[0.06em] uppercase">События</span>
          <span className="w-[46px] text-center">В прил.</span>
          <span className="w-[46px] text-center">Почта</span>
        </div>
        {TYPES.map((t) => (
          <div key={t.type} className="flex items-center gap-3 border-b border-line px-5 py-3.5 last:border-b-0">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{t.title}</span>
              <span className="text-[13px] text-ink-3">{t.hint}</span>
            </span>
            <Toggle
              label={`${t.title}: в приложении`}
              checked={s.prefs[t.type].inApp}
              disabled={s.allOff}
              onChange={(v) => {
                actions.setNotificationPref(t.type, "inApp", v);
                changed(`«${t.title}» в приложении: ${v ? "вкл" : "выкл"}`);
              }}
            />
            <Toggle
              label={`${t.title}: на почту`}
              checked={s.prefs[t.type].email}
              disabled={s.allOff}
              onChange={(v) => {
                actions.setNotificationPref(t.type, "email", v);
                changed(`«${t.title}» на почту: ${v ? "вкл" : "выкл"}`);
              }}
            />
          </div>
        ))}
      </div>

      <h2 className="mt-7 mb-3 font-display text-lg font-medium">Режим</h2>
      <div className="overflow-hidden rounded-3xl border border-line bg-surface">
        {(
          [
            ["quietHours", MoonIcon, "Тихие часы", "22:00 – 09:00 без уведомлений"],
            ["digest", MailIcon, "Сводка раз в день", "вместо отдельных писем"],
          ] as const
        ).map(([flag, Icon, title, hint]) => (
          <div key={flag} className="flex items-center gap-3 border-b border-line px-5 py-3.5">
            <Icon size={20} className="text-ink-2" />
            <span className="flex-1">
              <span className="block font-semibold">{title}</span>
              <span className="text-[13px] text-ink-3">{hint}</span>
            </span>
            <Toggle
              label={title}
              checked={s[flag]}
              disabled={s.allOff}
              onChange={(v) => {
                actions.setNotificationFlag(flag, v);
                changed(`${title}: ${v ? "вкл" : "выкл"}`);
              }}
            />
          </div>
        ))}
        <div className="flex items-center gap-3 px-5 py-3.5">
          <span className="flex-1 font-semibold text-danger">Выключить все уведомления</span>
          <Toggle
            label="Выключить все уведомления"
            checked={s.allOff}
            onChange={(v) => {
              actions.setNotificationFlag("allOff", v);
              changed(v ? "Все уведомления выключены" : "Уведомления снова включены");
            }}
          />
        </div>
      </div>
    </Page>
  );
}

export function PrivacySettingsView() {
  const { state, actions } = useStore();
  const { toast } = useFeedback();
  return (
    <Page narrow>
      <PageTitle title="Заблокированные" fallback="#settings" sub="Они не видят ваш профиль и публикации и не могут вступить в ваши круги." />
      {state.blocks.length === 0 ? (
        <EmptyState title="Вы никого не блокировали" text="Заблокировать можно из меню шага, комментария или профиля." icon={<BanIcon />} />
      ) : (
        <ul className="overflow-hidden rounded-3xl border border-line bg-surface">
          {state.blocks.map((id) => {
            const p = state.people[id];
            return (
              <li key={id} className="flex items-center gap-3 border-b border-line px-5 py-3.5 last:border-b-0" data-testid="blocked">
                <Avatar letter={p.nickname[0]} tone="surface" size={40} />
                <span className="flex-1 font-semibold">@{p.nickname}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    actions.unblock(id);
                    toast(`@${p.nickname} разблокирован`, "info");
                  }}
                >
                  Разблокировать
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
