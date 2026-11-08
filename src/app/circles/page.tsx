import type { Metadata } from "next";
import { CircleCard } from "@/components/circle-card";
import { ChevronDownIcon, PlusIcon, SearchIcon, SlidersIcon, SparkIcon } from "@/components/icons";
import { PrototypeBanner, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ButtonLink, Chip } from "@/components/ui";
import { demoCircles, demoTopics } from "@/lib/demo-data";
import { plural } from "@/lib/format";

export const metadata: Metadata = { title: "Найти круг" };

export default function CirclesPage() {
  return (
    <>
      <PrototypeBanner />
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 pt-8 pb-20 md:px-8 md:pt-12">
        <h1 className="font-display text-[30px] leading-[1.1] font-medium tracking-[-0.045em] md:text-[44px]">Найдите свой круг</h1>
        <p className="mt-2.5 text-base text-ink-2 md:text-[17px]">
          {demoCircles.length} {plural(demoCircles.length, "круг набирает", "круга набирают", "кругов набирают")} участников · выбирайте по теме, сроку и формату
        </p>

        {/* Поиск: на телефоне поле и кнопка фильтров в одну строку, кнопка — только иконка */}
        <div className="mt-7 flex gap-2.5 md:gap-3">
          <label className="flex min-h-12 flex-1 items-center gap-3 rounded-full border-[1.5px] border-line bg-surface px-5 focus-within:border-forest">
            <SearchIcon className="shrink-0 text-ink-2" />
            <span className="sr-only">Поиск кругов</span>
            <input
              type="search"
              placeholder="Python, английский, портфолио…"
              className="w-full bg-transparent py-3.5 text-base outline-none placeholder:text-ink-3"
            />
          </label>
          <button
            type="button"
            className="flex min-h-12 items-center gap-2.5 rounded-full border-[1.5px] border-line bg-surface px-4 font-semibold md:px-5"
            aria-label="Фильтры"
          >
            <SlidersIcon />
            <span className="hidden md:inline">Фильтры</span>
          </button>
        </div>

        {/* Темы: на телефоне — горизонтальная прокрутка */}
        <div className="mt-5 flex items-center gap-3">
          <div className="no-scrollbar -mx-5 flex flex-1 gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
            {demoTopics.map((t, i) => (
              <button key={t} type="button" className="shrink-0 rounded-full" aria-pressed={i === 0}>
                <Chip tone={i === 0 ? "ink" : "outline"}>{t}</Chip>
              </button>
            ))}
          </div>
          <div className="hidden shrink-0 gap-2 lg:flex">
            {["Срок: любой", "Есть места"].map((l) => (
              <button
                key={l}
                type="button"
                className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink-2"
              >
                {l}
                <ChevronDownIcon size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Подбор по интересам */}
        <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-lilac-soft p-5 sm:flex-row sm:items-center md:p-6">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-lilac">
            <SparkIcon />
          </span>
          <div className="flex-1">
            <p className="font-semibold">Подходит вашим интересам: Python, 3D-печать</p>
            <p className="mt-1 text-sm text-ink-2">Подбор — простое совпадение тегов из профиля. Никаких скрытых алгоритмов.</p>
          </div>
          <ButtonLink href="#" variant="secondary" className="w-fit">
            Показать 2 круга
          </ButtonLink>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {demoCircles.map((c) => (
            <CircleCard key={c.id} circle={c} />
          ))}
          <div className="flex flex-col justify-center gap-3.5 rounded-[28px] border-[1.5px] border-dashed border-forest/60 p-7">
            <span className="flex size-[52px] items-center justify-center rounded-full bg-forest text-surface">
              <PlusIcon size={24} />
            </span>
            <h2 className="font-display text-xl font-medium tracking-[-0.01em]">Не нашли подходящий?</h2>
            <p className="text-[15px] leading-[1.55] text-ink-2">Соберите свой круг за 2 минуты: цель, срок и сколько человек нужно.</p>
            <ButtonLink href="#" variant="ghost" className="w-fit -ml-5">
              Собрать круг →
            </ButtonLink>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
