"use client";

import { useEffect, useState } from "react";

export type Route =
  | { name: "home"; anchor?: string }
  | { name: "catalog" }
  | { name: "login" }
  | { name: "circle"; id: string }
  | { name: "new" }
  | { name: "my" }
  | { name: "notifications" }
  | { name: "profile" }
  | { name: "profile-edit" }
  | { name: "user"; id: string }
  | { name: "settings" }
  | { name: "settings-notifications" }
  | { name: "settings-privacy" }
  | { name: "rules" }
  | { name: "privacy" }
  | { name: "about-demo" };

const simple = [
  "catalog",
  "login",
  "new",
  "my",
  "notifications",
  "profile",
  "profile-edit",
  "settings",
  "settings-notifications",
  "settings-privacy",
  "rules",
  "privacy",
  "about-demo",
] as const;

export function parseHash(hash: string): Route {
  const h = decodeURIComponent(hash.replace(/^#/, ""));
  if (!h || h === "home") return { name: "home" };
  if (h === "how" || h === "safety") return { name: "home", anchor: h };
  if (h.startsWith("circle-")) return { name: "circle", id: h.slice(7) };
  if (h.startsWith("u-")) return { name: "user", id: h.slice(2) };
  if ((simple as readonly string[]).includes(h)) return { name: h as (typeof simple)[number] };
  return { name: "home" };
}

export function useRoute() {
  const [hash, setHash] = useState("");
  useEffect(() => {
    const update = () => setHash(window.location.hash);
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return { route: parseHash(hash), hash };
}

export function go(hash: string) {
  if (window.location.hash === hash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = hash;
  }
}

/** Список посещённых экранов — для кнопки «Назад». */
const visited: string[] = [];
let goingBack = false;
if (typeof window !== "undefined") {
  const record = () => {
    const h = window.location.hash || "#home";
    if (goingBack) {
      goingBack = false;
      return;
    }
    if (visited[visited.length - 1] !== h) visited.push(h);
  };
  record();
  window.addEventListener("hashchange", record);
}

/** Назад: на предыдущий экран внутри приложения, иначе — на запасной адрес. */
export function back(fallback = "#home") {
  visited.pop();
  const prev = visited[visited.length - 1];
  goingBack = true;
  go(prev ?? fallback);
  if (!prev) visited.push(fallback);
}

/** Куда вернуться после демо-входа (адрес не может хранить параметры — держим в памяти). */
let returnTo = "#my";
export function setReturnTo(h: string) {
  returnTo = h;
}
export function takeReturnTo() {
  const r = returnTo;
  returnTo = "#my";
  return r;
}
