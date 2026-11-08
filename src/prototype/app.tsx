"use client";

import { useEffect, type ReactNode } from "react";
import { LockIcon } from "@/components/icons";
import { ButtonLink, EmptyState } from "@/components/ui";
import { FeedbackProvider } from "./feedback";
import { setReturnTo, useRoute, type Route } from "./router";
import { DemoBanner, Footer, Header, Page, TabBar } from "./shell";
import { StoreProvider, useStore, useStoreReady } from "./store";
import { CatalogView } from "./views/catalog";
import { CircleView } from "./views/circle";
import { LoginView, NewCircleView } from "./views/forms";
import { HomeView } from "./views/home";
import { AboutDemoView, PrivacyView, RulesView } from "./views/info";
import { MyCirclesView, NotificationsView } from "./views/lists";
import { MyProfileView, ProfileEditView, UserProfileView } from "./views/profile";
import { NotificationSettingsView, PrivacySettingsView, SettingsView } from "./views/settings";

const NEEDS_LOGIN: Route["name"][] = ["new", "my", "notifications", "profile", "profile-edit", "settings", "settings-notifications", "settings-privacy"];

function NeedLogin({ hash }: { hash: string }) {
  return (
    <Page narrow>
      <EmptyState title="Нужно войти" text="Этот раздел доступен после входа в демо-режим." icon={<LockIcon />}>
        <ButtonLink href="#login" onClick={() => setReturnTo(hash || "#my")}>
          Войти в демо
        </ButtonLink>
      </EmptyState>
    </Page>
  );
}

function Screen({ route, hash }: { route: Route; hash: string }): ReactNode {
  const { me } = useStore();
  if (!me && NEEDS_LOGIN.includes(route.name)) return <NeedLogin hash={hash} />;
  switch (route.name) {
    case "home":
      return <HomeView anchor={route.anchor} />;
    case "catalog":
      return <CatalogView />;
    case "login":
      return <LoginView />;
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
    case "about-demo":
      return <AboutDemoView />;
  }
}

function Shell() {
  const ready = useStoreReady();
  const { route, hash } = useRoute();

  const anchor = route.name === "home" ? route.anchor : undefined;
  useEffect(() => {
    if (!anchor) window.scrollTo({ top: 0 });
  }, [hash, anchor]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-ink-3">Загрузка…</div>;
  }
  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <Header route={route} />
      <Screen route={route} hash={hash} />
      <Footer />
      <TabBar route={route} />
    </div>
  );
}

export function PrototypeApp() {
  return (
    <StoreProvider>
      <FeedbackProvider>
        <Shell />
      </FeedbackProvider>
    </StoreProvider>
  );
}
