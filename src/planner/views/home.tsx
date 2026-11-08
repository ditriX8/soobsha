"use client";

import { useEffect } from "react";
import { CheckIcon } from "@/components/icons";
import { Avatar, AvatarStack, ButtonLink, type AvatarTone } from "@/components/ui";
import { useAccount } from "../auth";
import { setReturnTo } from "../router";

const steps = [
  { n: "01", title: "Соберите круг", text: "Назовите цель и срок, пригласите друзей ссылкой или коротким кодом вида K7Q4-MX2A.", tone: "bg-mint", numTone: "text-forest-700" },
  { n: "02", title: "Разложите на задачи", text: "Общий план: задачи, сроки, ответственные. Главное — закрепите наверху.", tone: "bg-sun-soft", numTone: "text-ink" },
  { n: "03", title: "Двигайтесь вместе", text: "Каждый отмечает свои задачи — прогресс обновляется у всех сразу.", tone: "bg-coral-soft", numTone: "text-ink" },
];

const safety = [
  ["Только по приглашению", "Круг видят только его участники. Никакой публичной ленты."],
  ["Закрыто по умолчанию", "Каждое поле профиля видите только вы, пока сами не откроете."],
  ["Без личных сообщений от незнакомцев", "Общение — внутри общего круга: комментарии к задачам и небольшой чат."],
  ["Жалоба и блокировка", "Если что-то не так — один тап. Решение принимает модератор."],
];

const tasks: { title: string; who: string; tone: AvatarTone; done: boolean; due: string; pin?: boolean }[] = [
  { title: "Заказать грузчиков", who: "А", tone: "coral", done: true, due: "пн", pin: true },
  { title: "Купить коробки", who: "М", tone: "sun", done: true, due: "вт" },
  { title: "Упаковать технику", who: "И", tone: "lilac", done: false, due: "завтра" },
  { title: "Повесить схему рассадки", who: "Д", tone: "mint", done: false, due: "пт" },
];

export function HomeView({ anchor }: { anchor?: string }) {
  const { me } = useAccount();
  useEffect(() => {
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
  }, [anchor]);

  return (
    <main className="flex-1 overflow-x-clip">
      <section className="mx-auto grid max-w-[1280px] items-center gap-12 px-5 pt-10 pb-16 md:px-8 md:pt-16 lg:grid-cols-[1.15fr_1fr] lg:pb-24">
        <div className="flex flex-col gap-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink-2">
            <span className="size-2 rounded-full bg-coral" aria-hidden="true" />
            Совместный планер для маленьких групп
          </span>
          <h1 className="font-display text-[40px] leading-[1.05] font-medium tracking-[-0.045em] sm:text-[52px] lg:text-[56px] xl:text-[64px]">
            Одному трудно.
            <br />
            Вместе — получится.
          </h1>
          <p className="max-w-[560px] text-lg leading-[1.6] text-ink-2 md:text-xl">
            Соберите друзей, коллег или одногруппников вокруг общей цели. Общий план, задачи с ответственными и сроками, прогресс, который видят все — без шумной соцсети.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={me ? "#new" : "#login"} size="lg" onClick={() => setReturnTo("#new")}>
              Создать круг
            </ButtonLink>
            <ButtonLink href="#join" variant="secondary" size="lg">
              У меня есть код
            </ButtonLink>
          </div>
          <div className="flex items-center gap-3.5">
            <AvatarStack size={34} ring="ring-paper" people={[{ letter: "А", tone: "coral" }, { letter: "М", tone: "sun" }, { letter: "И", tone: "lilac" }, { letter: "Д", tone: "mint" }]} />
            <span className="text-sm font-medium text-ink-3">Бесплатно · без телефона и адреса · вход за 10 секунд</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[500px]" aria-hidden="true">
          <div className="absolute -top-6 -left-6 size-56 rounded-full bg-mint" />
          <div className="absolute -right-4 -bottom-8 size-64 rounded-full bg-coral-soft" />
          <div className="relative flex flex-col gap-4 rounded-[28px] bg-surface p-6 shadow-float">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-medium tracking-[-0.01em]">Переезд в новый офис</span>
              <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-forest-700">до 30 ноября</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-line">
              <div className="h-full w-1/2 rounded-full bg-forest" />
            </div>
            <span className="text-sm font-medium text-ink-2">Выполнено 2 из 4 · все в курсе</span>
            <ul className="flex flex-col gap-2">
              {tasks.map((t) => (
                <li key={t.title} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${t.pin ? "bg-sun-soft" : "bg-paper"}`}>
                  <span className={`flex size-6 items-center justify-center rounded-full border-2 ${t.done ? "border-forest bg-forest text-surface" : "border-line bg-surface"}`}>
                    {t.done && <CheckIcon size={14} />}
                  </span>
                  <span className={`flex-1 text-sm font-medium ${t.done ? "text-ink-3 line-through" : ""}`}>{t.title}</span>
                  <span className="text-xs text-ink-3">{t.due}</span>
                  <Avatar letter={t.who} tone={t.tone} size={26} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 border-y border-line bg-surface/60">
        <div className="mx-auto max-w-[1280px] px-5 py-16 md:px-8 md:py-24">
          <p className="text-[13px] font-semibold tracking-[0.08em] text-forest uppercase">Как это работает</p>
          <h2 className="mt-3 font-display text-[30px] leading-[1.15] font-medium tracking-[-0.04em] md:text-[44px]">Три шага до результата</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
            {steps.map((s) => (
              <div key={s.n} className={`flex flex-col gap-4 rounded-[28px] p-7 md:p-8 ${s.tone}`}>
                <span className={`font-display text-5xl font-medium tracking-[-0.04em] ${s.numTone}`}>{s.n}</span>
                <h3 className="font-display text-[22px] font-medium tracking-[-0.01em]">{s.title}</h3>
                <p className="leading-[1.6] text-ink-2">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="mx-auto max-w-[1280px] scroll-mt-20 px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-10 rounded-[32px] bg-forest p-7 md:rounded-[40px] md:p-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:p-[72px]">
          <div className="flex flex-col gap-4">
            <p className="text-[13px] font-semibold tracking-[0.08em] text-sun uppercase">Спокойно и приватно</p>
            <h2 className="font-display text-[30px] leading-[1.15] font-medium tracking-[-0.04em] text-surface md:text-[40px]">Планер, а не соцсеть</h2>
            <p className="max-w-[480px] text-lg leading-[1.6] text-mint">Никаких лент, лайков и подписчиков. Мы не спрашиваем телефон, адрес и дату рождения — только никнейм.</p>
            <a href="#privacy" className="w-fit font-semibold text-surface underline underline-offset-4">
              Подробнее о приватности
            </a>
          </div>
          <ul className="flex flex-col gap-3">
            {safety.map(([title, text]) => (
              <li key={title} className="flex items-start gap-4 rounded-[20px] bg-forest-700 p-4 md:p-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mint text-forest">
                  <CheckIcon size={18} />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="font-semibold text-surface">{title}</span>
                  <span className="text-sm leading-[1.5] text-mint">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
