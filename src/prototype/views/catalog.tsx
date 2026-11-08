"use client";

import { useMemo, useState } from "react";
import { ChevronDownIcon, PlusIcon, SearchIcon, SlidersIcon, SparkIcon } from "@/components/icons";
import { Button, ButtonLink, Chip, EmptyState } from "@/components/ui";
import { plural } from "@/lib/format";
import { Modal } from "../feedback";
import { freeSeats } from "../logic";
import { CircleCard } from "../parts";
import { setReturnTo } from "../router";
import { TOPICS } from "../seed";
import { useStore } from "../store";
import type { Topic } from "../types";

type Duration = "any" | "short" | "mid" | "long";
type Filters = { duration: Duration; freeOnly: boolean; mode: "any" | "open" | "approval" };
const defaultFilters: Filters = { duration: "any", freeOnly: false, mode: "any" };

const durationLabel: Record<Duration, string> = { any: "любой", short: "до 4 недель", mid: "5–8 недель", long: "9–12 недель" };

export function CatalogView() {
  const { state, me } = useStore();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [draft, setDraft] = useState<Filters>(defaultFilters);
  const [sheet, setSheet] = useState(false);
  const [forYou, setForYou] = useState(false);

  const myTags = useMemo(() => (me ? [...me.interests, ...me.skills].map((t) => t.toLowerCase()) : []), [me]);

  const matchesInterests = (tags: string[], t: string) => tags.some((x) => myTags.includes(x.toLowerCase())) || myTags.includes(t.toLowerCase());

  const visible = state.circles.filter((c) => {
    if (c.status !== "open") return false;
    if (state.blocks.includes(c.ownerId)) return false;
    if (topic !== "all" && c.topic !== topic) return false;
    const q = query.trim().toLowerCase();
    if (q && ![c.title, c.goal, c.description, c.topic, ...c.tags].some((f) => f.toLowerCase().includes(q))) return false;
    if (filters.duration === "short" && c.weeks > 4) return false;
    if (filters.duration === "mid" && (c.weeks < 5 || c.weeks > 8)) return false;
    if (filters.duration === "long" && c.weeks < 9) return false;
    if (filters.freeOnly && freeSeats(c) === 0) return false;
    if (filters.mode !== "any" && c.joinMode !== filters.mode) return false;
    if (forYou && !matchesInterests(c.tags, c.topic)) return false;
    return true;
  });

  const recommended = state.circles.filter((c) => c.status === "open" && myTags.length > 0 && matchesInterests(c.tags, c.topic) && !c.members.includes(me?.id ?? ""));
  const activeFilterCount = (filters.duration !== "any" ? 1 : 0) + (filters.freeOnly ? 1 : 0) + (filters.mode !== "any" ? 1 : 0);
  const anyFilter = activeFilterCount > 0 || topic !== "all" || query.trim() !== "" || forYou;

  const resetAll = () => {
    setQuery("");
    setTopic("all");
    setFilters(defaultFilters);
    setForYou(false);
  };

  const openSheet = () => {
    setDraft(filters);
    setSheet(true);
  };

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-8 pb-20 sm:px-5 md:px-8 md:pt-12">
      <h1 className="font-display text-[30px] leading-[1.1] font-medium tracking-[-0.045em] md:text-[44px]">Найдите свой круг</h1>
      <p className="mt-2.5 text-base text-ink-2 md:text-[17px]" data-testid="results-count">
        {anyFilter
          ? `Найдено: ${visible.length} ${plural(visible.length, "круг", "круга", "кругов")}`
          : `${visible.length} ${plural(visible.length, "круг", "круга", "кругов")} · выбирайте по теме, сроку и формату`}
      </p>

      <div className="mt-7 flex gap-2.5 md:gap-3">
        <label className="flex min-h-12 flex-1 items-center gap-3 rounded-full border-[1.5px] border-line bg-surface px-5 focus-within:border-forest">
          <SearchIcon className="shrink-0 text-ink-2" />
          <span className="sr-only">Поиск кругов</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Python, английский, портфолио…"
            className="w-full bg-transparent py-3.5 text-base outline-none placeholder:text-ink-3"
          />
        </label>
        <button
          type="button"
          onClick={openSheet}
          className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-full border-[1.5px] px-4 font-semibold md:px-5 ${activeFilterCount ? "border-forest bg-mint text-forest-700" : "border-line bg-surface"}`}
          aria-label={activeFilterCount ? `Фильтры: ${activeFilterCount}` : "Фильтры"}
        >
          <SlidersIcon />
          <span className="hidden md:inline">Фильтры{activeFilterCount ? ` · ${activeFilterCount}` : ""}</span>
          {activeFilterCount > 0 && <span className="md:hidden">{activeFilterCount}</span>}
        </button>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="no-scrollbar -mx-4 flex flex-1 gap-2 overflow-x-auto px-4 sm:-mx-5 sm:px-5 md:mx-0 md:flex-wrap md:px-0">
          {[{ name: "all" as const, label: "Все темы" }, ...TOPICS.map((t) => ({ name: t.name, label: t.name }))].map((t) => (
            <button key={t.name} type="button" className="shrink-0 cursor-pointer rounded-full" aria-pressed={topic === t.name} onClick={() => setTopic(t.name)}>
              <Chip tone={topic === t.name ? "ink" : "outline"}>{t.label}</Chip>
            </button>
          ))}
        </div>
        <div className="hidden shrink-0 gap-2 lg:flex">
          <button type="button" onClick={openSheet} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink-2">
            Срок: {durationLabel[filters.duration]} <ChevronDownIcon size={16} />
          </button>
          <button
            type="button"
            aria-pressed={filters.freeOnly}
            onClick={() => setFilters((f) => ({ ...f, freeOnly: !f.freeOnly }))}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium ${filters.freeOnly ? "border-forest bg-mint text-forest-700" : "border-line bg-surface text-ink-2"}`}
          >
            Есть места
          </button>
        </div>
      </div>

      {me && (
        <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-lilac-soft p-5 sm:flex-row sm:items-center md:p-6">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-lilac">
            <SparkIcon />
          </span>
          {myTags.length === 0 ? (
            <>
              <div className="flex-1">
                <p className="font-semibold">Добавьте интересы — подскажем подходящие круги</p>
                <p className="mt-1 text-sm text-ink-2">Подбор — простое совпадение тегов из профиля. Никаких скрытых алгоритмов.</p>
              </div>
              <ButtonLink href="#profile-edit" variant="secondary" className="w-fit">
                Добавить интересы
              </ButtonLink>
            </>
          ) : (
            <>
              <div className="flex-1">
                <p className="font-semibold">Подходит вашим интересам: {[...me.interests, ...me.skills].slice(0, 3).join(", ")}</p>
                <p className="mt-1 text-sm text-ink-2">Подбор — простое совпадение тегов из профиля. Никаких скрытых алгоритмов.</p>
              </div>
              <Button variant="secondary" className="w-fit" aria-pressed={forYou} onClick={() => setForYou((v) => !v)}>
                {forYou ? "Показать все круги" : `Показать ${recommended.length} ${plural(recommended.length, "круг", "круга", "кругов")}`}
              </Button>
            </>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={query ? `Ничего не нашли по «${query}»` : "Ничего не нашли"} text="Попробуйте другие слова или уберите фильтры. А может, пора собрать такой круг самим?" icon={<SearchIcon />}>
            <Button variant="secondary" onClick={resetAll}>
              Сбросить фильтры
            </Button>
            <ButtonLink href={me ? "#new" : "#login"} onClick={() => setReturnTo("#new")}>
              Собрать круг
            </ButtonLink>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {visible.map((c) => (
            <CircleCard key={c.id} circle={c} />
          ))}
          <div className="flex flex-col justify-center gap-3.5 rounded-[28px] border-[1.5px] border-dashed border-forest/60 p-7">
            <span className="flex size-[52px] items-center justify-center rounded-full bg-forest text-surface">
              <PlusIcon size={24} />
            </span>
            <h2 className="font-display text-xl font-medium tracking-[-0.01em]">Не нашли подходящий?</h2>
            <p className="text-[15px] leading-[1.55] text-ink-2">Соберите свой круг за 2 минуты: цель, срок и сколько человек нужно.</p>
            <ButtonLink href={me ? "#new" : "#login"} variant="ghost" className="-ml-5 w-fit" onClick={() => setReturnTo("#new")}>
              Собрать круг →
            </ButtonLink>
          </div>
        </div>
      )}

      {sheet && (
        <Modal onClose={() => setSheet(false)} label="Фильтры">
          <h2 className="font-display text-xl font-medium tracking-[-0.01em]">Фильтры</h2>
          <fieldset className="mt-5">
            <legend className="mb-2.5 text-[15px] font-semibold">Срок</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(durationLabel) as Duration[]).map((d) => (
                <button key={d} type="button" aria-pressed={draft.duration === d} className="cursor-pointer rounded-full" onClick={() => setDraft((x) => ({ ...x, duration: d }))}>
                  <Chip tone={draft.duration === d ? "ink" : "outline"}>{durationLabel[d]}</Chip>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-5">
            <legend className="mb-2.5 text-[15px] font-semibold">Формат вступления</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["any", "любой"],
                  ["open", "открытый"],
                  ["approval", "по заявке"],
                ] as const
              ).map(([v, l]) => (
                <button key={v} type="button" aria-pressed={draft.mode === v} className="cursor-pointer rounded-full" onClick={() => setDraft((x) => ({ ...x, mode: v }))}>
                  <Chip tone={draft.mode === v ? "ink" : "outline"}>{l}</Chip>
                </button>
              ))}
            </div>
          </fieldset>
          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl bg-paper px-4 py-3.5">
            <input type="checkbox" checked={draft.freeOnly} onChange={(e) => setDraft((x) => ({ ...x, freeOnly: e.target.checked }))} className="size-5 accent-[#1E5C4A]" />
            <span className="font-semibold">Только со свободными местами</span>
          </label>
          <div className="mt-6 flex gap-2.5">
            <Button variant="secondary" className="flex-1" onClick={() => setDraft(defaultFilters)}>
              Сбросить
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setFilters(draft);
                setSheet(false);
              }}
            >
              Применить
            </Button>
          </div>
        </Modal>
      )}
    </main>
  );
}
