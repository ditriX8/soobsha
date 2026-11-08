"use client";

import type { ReactNode } from "react";
import { BackIcon, BellIcon, CirclesIcon, PlusIcon, SearchIcon, UserIcon } from "@/components/icons";
import { Avatar, ButtonLink, IconButton, Logo } from "@/components/ui";
import { back, setReturnTo, type Route } from "./router";
import { useStore } from "./store";

export function DemoBanner() {
  const { persistent } = useStore();
  return (
    <div className="bg-ink px-4 py-2 text-center text-[13px] leading-snug text-surface">
      {persistent ? "Демо-режим: данные хранятся только в этом браузере, другие люди — вымышленные. " : "Браузер не даёт сохранять данные — после перезагрузки всё сбросится. "}
      <a href="#about-demo" className="font-semibold underline underline-offset-2">
        Что работает?
      </a>
    </div>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-4 py-2.5 text-[15px] font-semibold ${active ? "bg-mint text-forest-700" : "text-ink-2 hover:text-ink"}`}
    >
      {children}
    </a>
  );
}

export function Header({ route }: { route: Route }) {
  const { me, state } = useStore();
  const unread = state.notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-5 md:px-8 md:py-3.5">
        <a href="#home" aria-label="Сообща — на главную">
          <Logo />
        </a>

        {me ? (
          <nav aria-label="Основная навигация" className="hidden flex-1 items-center gap-1 pl-6 md:flex">
            <NavLink href="#my" active={route.name === "my"}>
              Мои круги
            </NavLink>
            <NavLink href="#catalog" active={route.name === "catalog"}>
              Найти круг
            </NavLink>
          </nav>
        ) : (
          <nav aria-label="Основная навигация" className="hidden items-center gap-8 text-[15px] font-medium text-ink-2 lg:flex">
            <a href="#catalog" className="hover:text-ink">
              Круги
            </a>
            <a href="#how" className="hover:text-ink">
              Как это работает
            </a>
            <a href="#safety" className="hover:text-ink">
              Безопасность
            </a>
          </nav>
        )}

        {me ? (
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex">
              <ButtonLink href="#new" size="sm">
                <PlusIcon size={18} /> Собрать круг
              </ButtonLink>
            </span>
            <a
              href="#notifications"
              aria-label={unread ? `Уведомления: ${unread} новых` : "Уведомления"}
              className="relative hidden size-11 items-center justify-center rounded-full border border-line bg-surface md:inline-flex"
            >
              <BellIcon />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-xs font-bold text-ink">
                  {unread}
                </span>
              )}
            </a>
            <a href="#profile" aria-label="Мой профиль" className="rounded-full">
              <Avatar letter={me.nickname[0]} tone={me.tone} size={42} ring="ring-paper" />
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="hidden gap-2 sm:flex">
              <ButtonLink href="#login" variant="ghost" onClick={() => setReturnTo("#my")}>
                Войти
              </ButtonLink>
              <ButtonLink href="#login" onClick={() => setReturnTo("#my")}>
                Создать аккаунт
              </ButtonLink>
            </span>
            <span className="sm:hidden">
              <ButtonLink href="#login" onClick={() => setReturnTo("#my")}>
                Войти
              </ButtonLink>
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

/** Нижняя панель вкладок — только на телефоне и только после входа. */
export function TabBar({ route }: { route: Route }) {
  const { me, state } = useStore();
  if (!me) return null;
  const unread = state.notifications.filter((n) => !n.read).length;
  const tabs = [
    { href: "#my", label: "Мои круги", icon: CirclesIcon, active: route.name === "my" || route.name === "circle" },
    { href: "#catalog", label: "Найти", icon: SearchIcon, active: route.name === "catalog" },
    { href: "#notifications", label: "Уведомления", icon: BellIcon, active: route.name === "notifications", badge: unread },
    { href: "#profile", label: "Профиль", icon: UserIcon, active: route.name.startsWith("profile") || route.name.startsWith("settings") },
  ];
  return (
    <nav
      aria-label="Вкладки"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-surface/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
    >
      {tabs.map((t) => (
        <a
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`relative flex flex-col items-center gap-1 pt-2.5 pb-1 text-[11px] ${t.active ? "font-semibold text-forest" : "font-medium text-ink-3"}`}
        >
          <t.icon size={24} />
          {t.label}
          {!!t.badge && (
            <span className="absolute top-1.5 left-1/2 ml-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-coral px-1 text-[11px] font-bold text-ink">
              {t.badge}
            </span>
          )}
        </a>
      ))}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line pb-20 md:pb-0">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-5 py-8 text-sm text-ink-2 md:flex-row md:items-center md:justify-between md:px-8">
        <span className="text-ink-3">© 2026 Сообща · прототип</span>
        <nav aria-label="Служебные ссылки" className="flex flex-wrap gap-x-7 gap-y-2">
          <a href="#rules" className="hover:text-ink">
            Правила сообщества
          </a>
          <a href="#privacy" className="hover:text-ink">
            Конфиденциальность
          </a>
          <a href="#about-demo" className="hover:text-ink">
            О демо-режиме
          </a>
        </nav>
      </div>
    </footer>
  );
}

/** Заголовок внутренней страницы с кнопкой «Назад». */
export function PageTitle({ title, fallback = "#home", action, sub }: { title: string; fallback?: string; action?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <IconButton label="Назад" onClick={() => back(fallback)}>
        <BackIcon />
      </IconButton>
      <div className="min-w-0 flex-1 pt-1">
        <h1 className="font-display text-[26px] leading-[1.15] font-medium tracking-[-0.04em] md:text-[34px]">{title}</h1>
        {sub && <div className="mt-1.5 text-[15px] text-ink-2">{sub}</div>}
      </div>
      {action}
    </div>
  );
}

export function Page({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return <main className={`mx-auto w-full flex-1 px-4 pt-6 pb-12 sm:px-5 md:px-8 md:pt-10 ${narrow ? "max-w-[760px]" : "max-w-[1280px]"}`}>{children}</main>;
}
