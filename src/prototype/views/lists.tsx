"use client";

import { BellIcon, CirclesIcon, SettingsIcon } from "@/components/icons";
import { Button, ButtonLink, EmptyState } from "@/components/ui";
import { useFeedback } from "../feedback";
import { timeAgo } from "../logic";
import { CircleCard } from "../parts";
import { go } from "../router";
import { Page } from "../shell";
import { useStore } from "../store";

export function MyCirclesView() {
  const { state, me, actions } = useStore();
  const { toast, confirm } = useFeedback();
  const mine = state.circles.filter((c) => c.status === "open" && c.members.includes(me!.id));
  const requests = state.requests.filter((r) => r.userId === me!.id && r.status === "pending");

  return (
    <Page>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[30px] leading-[1.1] font-medium tracking-[-0.045em] md:text-[40px]">Мои круги</h1>
          <p className="mt-2 text-ink-2">Привет, @{me!.nickname}! Здесь круги, в которых вы участвуете.</p>
        </div>
        <ButtonLink href="#new">Собрать круг</ButtonLink>
      </div>

      {mine.length === 0 ? (
        <EmptyState title="Вы пока ни в одном круге" text="Найдите круг по интересам или соберите свой — это займёт пару минут." icon={<CirclesIcon />}>
          <ButtonLink href="#catalog">Найти круг</ButtonLink>
          <ButtonLink href="#new" variant="secondary">
            Собрать свой
          </ButtonLink>
        </EmptyState>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {mine.map((c) => (
            <div key={c.id} className="relative">
              {c.ownerId === me!.id && <span className="absolute -top-2.5 left-5 z-10 rounded-full bg-sun px-3 py-1 text-xs font-bold text-ink">вы создатель</span>}
              <CircleCard circle={c} />
            </div>
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-3 font-display text-xl font-medium">Мои заявки</h2>
        {requests.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line bg-surface/60 p-5 text-[15px] text-ink-2">Заявок на рассмотрении нет.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {requests.map((r) => {
              const c = state.circles.find((x) => x.id === r.circleId)!;
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-surface p-4" data-testid="my-request">
                  <a href={`#circle-${c.id}`} className="min-w-0 flex-1">
                    <span className="block font-semibold">{c.title}</span>
                    <span className="text-[13px] text-ink-3">на рассмотрении · {timeAgo(r.createdAt)}</span>
                  </a>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      if (!(await confirm({ title: "Отозвать заявку?", text: c.title, confirmLabel: "Отозвать", danger: true }))) return;
                      actions.withdrawRequest(r.id);
                      toast("Заявка отозвана", "info");
                    }}
                  >
                    Отозвать
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Page>
  );
}

export function NotificationsView() {
  const { state, actions } = useStore();
  const { toast } = useFeedback();
  const list = state.notifications;
  const unread = list.filter((n) => !n.read).length;
  return (
    <Page narrow>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-[30px] leading-[1.1] font-medium tracking-[-0.045em] md:text-[40px]">Уведомления</h1>
        <div className="flex gap-2">
          {unread > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                actions.markAllRead();
                toast("Все уведомления прочитаны", "success");
              }}
            >
              Прочитать все
            </Button>
          )}
          <ButtonLink href="#settings-notifications" variant="ghost" size="sm">
            <SettingsIcon size={18} /> Настройки
          </ButtonLink>
        </div>
      </div>
      {list.length === 0 ? (
        <EmptyState title="Тихо — и это нормально" text="Мы пишем только о важном: заявки, ответы на ваши шаги, напоминания. Выбрать, о чём сообщать, можно в настройках." icon={<BellIcon />}>
          <ButtonLink href="#settings-notifications" variant="secondary">
            Настроить уведомления
          </ButtonLink>
        </EmptyState>
      ) : (
        <ul className="overflow-hidden rounded-3xl border border-line bg-surface">
          {list.map((n) => (
            <li key={n.id} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => {
                  actions.markRead(n.id);
                  go(n.link);
                }}
                className={`flex w-full cursor-pointer items-start gap-3 px-5 py-4 text-left hover:bg-paper ${n.read ? "" : "bg-mint/40"}`}
                data-testid="notification"
              >
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-coral"}`} aria-hidden="true" />
                <span className="flex-1">
                  <span className={`block text-[15px] ${n.read ? "" : "font-semibold"}`}>{n.text}</span>
                  <span className="text-[13px] text-ink-3">
                    {timeAgo(n.createdAt)}
                    {!n.read && <span className="sr-only"> · не прочитано</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
