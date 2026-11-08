import { CircleCard } from "@/components/circle-card";
import { CheckIcon, HeartIcon } from "@/components/icons";
import { PrototypeBanner, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Avatar, AvatarStack, ButtonLink, WeekBar, type AvatarTone } from "@/components/ui";
import { demoCircles } from "@/lib/demo-data";

const steps = [
  {
    n: "01",
    title: "Выберите цель",
    text: "Найдите круг по теме или соберите свой: цель, срок от 2 до 12 недель, до 8 человек.",
    tone: "bg-mint",
    numTone: "text-forest-700",
  },
  {
    n: "02",
    title: "Делайте шаги",
    text: "Раз в неделю — короткий отчёт: что сделано, что мешает, что дальше. Это занимает 5 минут.",
    tone: "bg-sun-soft",
    numTone: "text-ink",
  },
  {
    n: "03",
    title: "Доведите до конца",
    text: "Поддерживайте друг друга, а в конце круга соберите итог — что получилось у каждого.",
    tone: "bg-coral-soft",
    numTone: "text-ink",
  },
];

const safety = [
  ["Без личных сообщений от незнакомцев", "Общение — только внутри общего круга."],
  ["Закрыто по умолчанию", "Каждое поле профиля видите только вы, пока сами не откроете."],
  ["Жалоба и блокировка в один тап", "Контент сразу скрывается у вас, решение принимает модератор."],
  ["Свои уведомления", "Вы выбираете, о чём и как сообщать. Никаких «вы давно не заходили»."],
];

const ring: { letter: string; tone: AvatarTone; pos: string }[] = [
  { letter: "А", tone: "coral", pos: "left-[16%] top-[14%]" },
  { letter: "М", tone: "sun", pos: "left-[64%] top-[8%]" },
  { letter: "И", tone: "lilac", pos: "left-[86%] top-[42%]" },
  { letter: "К", tone: "surface", pos: "left-[10%] top-[58%]" },
  { letter: "Д", tone: "mint", pos: "left-[44%] top-[88%]" },
];

export default function HomePage() {
  return (
    <>
      <PrototypeBanner />
      <SiteHeader />
      <main className="flex-1 overflow-x-clip">
        {/* HERO */}
        <section className="mx-auto grid max-w-[1280px] items-center gap-12 px-5 pt-10 pb-16 md:px-8 md:pt-16 lg:grid-cols-[1.2fr_1fr] lg:pb-24">
          <div className="flex flex-col gap-7">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink-2">
              <span className="size-2 rounded-full bg-coral" aria-hidden="true" />
              Маленькие группы · большая цель
            </span>
            <h1 className="font-display text-[40px] leading-[1.05] font-medium tracking-[-0.045em] sm:text-[52px] lg:text-[56px] xl:text-[64px]">
              Одному трудно.
              <br />
              Вместе — получится.
            </h1>
            <p className="max-w-[560px] text-lg leading-[1.6] text-ink-2 md:text-xl">
              Соберитесь в круг из 3–8 человек вокруг одной цели и срока. Каждую неделю — короткий шаг и поддержка тех, кто идёт
              рядом. Без бесконечной ленты и гонки за лайками.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/circles" size="lg">
                Найти свой круг
              </ButtonLink>
              <ButtonLink href="#" variant="secondary" size="lg">
                Собрать свой круг
              </ButtonLink>
            </div>
            <div className="flex items-center gap-3.5">
              <AvatarStack
                size={34}
                ring="ring-paper"
                people={[
                  { letter: "А", tone: "coral" },
                  { letter: "Д", tone: "sun" },
                  { letter: "Л", tone: "lilac" },
                  { letter: "Т", tone: "mint" },
                ]}
              />
              <span className="text-sm font-medium text-ink-3">Бесплатно · без телефона и адреса · закрыто по умолчанию</span>
            </div>
          </div>

          {/* Визуал: пересекающиеся круги и «живая» карточка прогресса */}
          <div className="relative mx-auto aspect-square w-full max-w-[520px]" aria-hidden="true">
            <div className="absolute top-[6%] left-[4%] size-[72%] rounded-full bg-mint" />
            <div className="absolute top-[24%] left-[36%] size-[62%] rounded-full bg-coral-soft" />
            <div className="absolute top-[58%] left-[22%] size-[36%] rounded-full bg-sun-soft" />
            {ring.map((p) => (
              <span key={p.letter} className={`absolute ${p.pos} -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_10px_18px_rgb(23_32_28/0.16)]`}>
                <Avatar letter={p.letter} tone={p.tone} size={60} />
              </span>
            ))}
            <div className="absolute top-[34%] left-1/2 flex -translate-x-1/2 flex-col gap-3 rounded-3xl bg-surface p-5 whitespace-nowrap shadow-float sm:top-[30%] sm:left-[26%] sm:translate-x-0">
              <span className="font-display text-lg font-medium tracking-[-0.01em]">IELTS 7.0 к марту</span>
              <WeekBar total={6} done={2} className="w-40" />
              <span className="text-sm font-medium text-ink-2">Неделя 3 из 6 · 5 участников</span>
            </div>
            <div className="absolute top-[62%] left-[42%] hidden items-center gap-3 whitespace-nowrap sm:flex rounded-[20px] bg-forest px-4 py-3.5 shadow-float">
              <Avatar letter="М" tone="sun" size={32} ring="ring-forest" />
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-surface">Мария сделала шаг</span>
                <span className="text-[13px] text-mint">Прошла 2 пробных теста</span>
              </span>
            </div>
            <div className="absolute top-[78%] left-[70%] hidden items-center gap-2 whitespace-nowrap sm:flex rounded-full bg-surface px-3.5 py-2.5 text-sm font-medium shadow-float">
              <HeartIcon size={16} className="text-coral" fill="currentColor" stroke="none" />
              Держись! · 3
            </div>
          </div>
        </section>

        {/* HOW IT WORKS — отдельная полоса более светлого тона, чтобы секции различались */}
        <section id="how" className="border-y border-line bg-surface/60">
          <div className="mx-auto max-w-[1280px] px-5 py-16 md:px-8 md:py-24">
            <p className="text-[13px] font-semibold tracking-[0.08em] text-forest uppercase">Как это работает</p>
            <h2 className="mt-3 font-display text-[30px] leading-[1.15] font-medium tracking-[-0.04em] md:text-[44px]">
              Три шага до результата
            </h2>
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

        {/* POPULAR CIRCLES */}
        <section className="mx-auto max-w-[1280px] px-5 py-16 md:px-8 md:py-24">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[13px] font-semibold tracking-[0.08em] text-forest uppercase">Набирают участников</p>
              <h2 className="mt-3 font-display text-[30px] leading-[1.15] font-medium tracking-[-0.04em] md:text-[44px]">
                Круги, которые стартуют скоро
              </h2>
            </div>
            <ButtonLink href="/circles" variant="secondary" className="w-fit">
              Все круги →
            </ButtonLink>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {demoCircles.slice(0, 3).map((c) => (
              <CircleCard key={c.id} circle={c} />
            ))}
          </div>
        </section>

        {/* SAFETY */}
        <section id="safety" className="mx-auto max-w-[1280px] px-5 pb-16 md:px-8 md:pb-24">
          <div className="grid gap-10 rounded-[32px] bg-forest p-7 md:rounded-[40px] md:p-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:p-[72px]">
            <div className="flex flex-col gap-4">
              <p className="text-[13px] font-semibold tracking-[0.08em] text-sun uppercase">Безопасно по умолчанию</p>
              <h2 className="font-display text-[30px] leading-[1.15] font-medium tracking-[-0.04em] text-surface md:text-[40px]">
                Ваши данные — только ваши
              </h2>
              <p className="max-w-[480px] text-lg leading-[1.6] text-mint">
                Мы не спрашиваем телефон, адрес и дату рождения. Вы сами решаете, что показывать в профиле, а незнакомцы не
                могут написать вам в личку.
              </p>
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
      <SiteFooter />
    </>
  );
}
