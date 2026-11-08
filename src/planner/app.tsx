"use client";

import { useEffect, type ReactNode } from "react";
import { InfoIcon, LockIcon } from "@/components/icons";
import { ButtonLink, EmptyState } from "@/components/ui";
import { AccountProvider, useAccount } from "./auth";
import { FeedbackProvider } from "./feedback";
import { setReturnTo, useRoute, type Route } from "./router";
import { Footer, Header, OfflineBanner, Page, TabBar } from "./shell";
import { isConfigured } from "./supabase";
import { CircleView } from "./views/circle";
import { JoinView, LoginView, MyCirclesView, NewCircleView } from "./views/entry";
import { HomeView } from "./views/home";
import { AboutView, PrivacyView, RulesView } from "./views/info";
import { MyProfileView, ProfileEditView, UserProfileView } from "./views/profile";
import { NotificationSettingsView, NotificationsView, PrivacySettingsView, SettingsView } from "./views/settings";

const NEEDS_LOGIN: Route["name"][] = ["new", "my", "circle", "notifications", "profile", "profile-edit", "user", "settings", "settings-notifications", "settings-privacy"];

function NeedLogin({ hash }: { hash: string }) {
  return (
    <Page narrow>
      <EmptyState title="Нужно войти" text="Вход занимает 10 секунд: только никнейм, без почты и телефона." icon={<LockIcon />}>
        <ButtonLink href="#login" onClick={() => setReturnTo(hash || "#my")}>
          Войти
        </ButtonLink>
      </EmptyState>
    </Page>
  );
}

function Screen({ route, hash }: { route: Route; hash: string }): ReactNode {
  const { me, session } = useAccount();
  // Вошёл, но ещё не выбрал никнейм — сначала профиль
  if (session && !me && route.name !== "home" && !["rules", "privacy", "about"].includes(route.name)) return <LoginView />;
  if (!me && NEEDS_LOGIN.includes(route.name)) return <NeedLogin hash={hash} />;
  switch (route.name) {
    case "home":
      return <HomeView anchor={route.anchor} />;
    case "login":
      return <LoginView />;
    case "join":
      return <JoinView key={route.code ?? ""} code={route.code} />;
    case "circle":
      return <CircleView key={route.id} id={route.id} />;
    case "new":
      return <NewCircleView />;
    case "my":
      return <MyCirclesView />;
    case "notifications":
      return <NotificationsView />;
    case "profile":
      return <MyProfileView />;
    case "profile-edit":
      return <ProfileEditView />;
    case "user":
      return <UserProfileView key={route.id} id={route.id} />;
    case "settings":
      return <SettingsView />;
    case "settings-notifications":
      return <NotificationSettingsView />;
    case "settings-privacy":
      return <PrivacySettingsView />;
    case "rules":
      return <RulesView />;
    case "privacy":
      return <PrivacyView />;
    case "about":
      return <AboutView />;
  }
}

function Shell() {
  const { ready } = useAccount();
  const { route, hash } = useRoute();
  const anchor = route.name === "home" ? route.anchor : undefined;
  useEffect(() => {
    if (!anchor) window.scrollTo({ top: 0 });
  }, [hash, anchor]);

  if (!ready) return <div className="flex min-h-screen items-center justify-center text-ink-3">Загрузка…</div>;
  return (
    <div className="flex min-h-screen flex-col">
      <OfflineBanner />
      <Header route={route} />
      <Screen route={route} hash={hash} />
      <Footer />
      <TabBar route={route} />
    </div>
  );
}

export function PlannerApp() {
  if (!isConfigured) {
    return (
      <main className="mx-auto max-w-[640px] px-5 py-16">
        <EmptyState title="Сервер не настроен" text="Не заданы адрес и ключ Supabase (NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). См. .env.example." icon={<InfoIcon />} />
      </main>
    );
  }
  return (
    <AccountProvider>
      <FeedbackProvider>
        <Shell />
      </FeedbackProvider>
    </AccountProvider>
  );
}
