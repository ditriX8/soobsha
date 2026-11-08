import type { AvatarTone, Tone } from "@/components/ui";
import type { Circle, DemoState, NotificationSettings, Person, ProfileField, Topic, Visibility } from "./types";

export const TOPICS: { name: Topic; tone: Tone }[] = [
  { name: "Программирование", tone: "mint" },
  { name: "Языки", tone: "lilac" },
  { name: "Дизайн", tone: "coral" },
  { name: "Экзамены", tone: "sun" },
  { name: "Карьера", tone: "lilac" },
  { name: "Привычки", tone: "sun" },
  { name: "Локальные дела", tone: "mint" },
];

export const topicTone = (t: Topic): Tone => TOPICS.find((x) => x.name === t)?.tone ?? "mint";

export const closedVisibility = (): Record<ProfileField, Visibility> => ({
  avatar: "private",
  about: "private",
  city: "private",
  interests: "private",
  skills: "private",
});

function person(
  id: string,
  tone: AvatarTone,
  about: string,
  interests: string[],
  skills: string[],
  vis: Partial<Record<ProfileField, Visibility>>,
  city = "",
  finished = 0,
): Person {
  return {
    id,
    nickname: id,
    tone,
    about,
    city,
    interests,
    skills,
    visibility: { ...closedVisibility(), ...vis },
    finishedCircles: finished,
    demo: true,
  };
}

/** Даты считаем от «сегодня», чтобы недели кругов выглядели правдоподобно в любой день. */
function dayOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const defaultNotificationSettings = (): NotificationSettings => ({
  prefs: {
    requests: { inApp: true, email: true },
    replies: { inApp: true, email: false },
    newSteps: { inApp: false, email: false },
    reminders: { inApp: true, email: false },
    circleEnd: { inApp: true, email: false },
    news: { inApp: false, email: false },
  },
  quietHours: true,
  digest: true,
  allOff: false,
});

export function createSeed(): DemoState {
  const people: Person[] = [
    person("masha_reads", "coral", "Учусь на аналитика данных, люблю длинные прогулки и короткие конспекты.", ["Английский", "Аналитика", "Книги"], ["Excel", "Разбор эссе"], { avatar: "public", about: "circles", interests: "public", skills: "circles" }, "Казань", 3),
    person("igor_k", "sun", "Работаю допоздна, учу английский по утрам.", ["Английский", "Бег"], ["Логистика"], { avatar: "public", interests: "circles" }, "", 1),
    person("anna_codes", "lilac", "Фронтенд-разработчица, помогаю новичкам.", ["Python", "JavaScript"], ["Код-ревью", "Git"], { avatar: "public", about: "public", interests: "public", skills: "public" }, "", 4),
    person("kirill_dev", "mint", "Перехожу в разработку из продаж.", ["Python", "Карьера"], [], { avatar: "circles" }),
    person("lev_t", "coral", "", ["IELTS"], [], {}),
    person("tanya_w", "sun", "Пишу эссе каждое утро.", ["Английский", "Писательство"], ["Редактура"], { about: "circles", interests: "circles" }),
    person("dasha_l", "mint", "", ["Английский"], [], { avatar: "public" }),
    person("sveta_ux", "lilac", "UX-дизайнер, собираю портфолио для переезда в продукт.", ["Дизайн", "UX"], ["Figma", "Исследования"], { avatar: "public", about: "public", skills: "public" }, "", 2),
    person("egor_ui", "sun", "", ["Дизайн"], ["Иллюстрация"], { avatar: "public" }),
    person("roma_p", "mint", "", ["Дизайн", "3D"], [], {}),
    person("olya_art", "coral", "Иллюстратор.", ["Дизайн"], [], { about: "circles" }),
    person("vika_m", "surface", "", [], [], {}),
    person("nina_run", "coral", "Бегаю третий год, люблю длинные дистанции.", ["Бег", "Здоровье"], ["Планы тренировок"], { avatar: "public", about: "public", interests: "public" }, "", 5),
    person("gleb_s", "mint", "", ["Бег"], [], {}),
    person("yulia_f", "lilac", "", ["Бег", "Йога"], [], { avatar: "public" }),
    person("pasha_b", "sun", "", ["Бег"], [], {}),
    person("fedya", "surface", "", [], [], {}),
    person("shura_k", "mint", "", [], [], {}),
    person("zoya_eco", "sun", "Наводим порядок во дворе уже второй год.", ["Экология", "Город"], ["Переговоры"], { avatar: "public", about: "public", interests: "public" }, "Казань", 2),
    person("khasan", "coral", "", ["Город"], [], {}),
    person("tsveta", "lilac", "", ["Экология"], [], {}),
  ];

  const circles: Circle[] = [
    {
      id: "python-6",
      title: "Python с нуля за 6 недель",
      goal: "Написать свой первый небольшой проект на Python",
      description: "Разбираем основы, каждую неделю — маленький проект. Новичкам рады. Созвоны не обязательны, главное — еженедельный шаг.",
      topic: "Программирование",
      tags: ["Python", "Программирование"],
      capacity: 6,
      weeks: 6,
      startDate: dayOffset(-8),
      joinMode: "approval",
      ownerId: "anna_codes",
      members: ["anna_codes", "masha_reads", "kirill_dev"],
      status: "open",
      createdAt: ago(60 * 24 * 12),
    },
    {
      id: "ielts-7",
      title: "IELTS 7.0 к марту",
      goal: "Сдать IELTS Academic на 7.0",
      description: "Готовимся к экзамену: пробники по субботам, разбор эссе друг у друга. Нужен уровень B2.",
      topic: "Языки",
      tags: ["Английский", "IELTS", "Экзамены"],
      capacity: 5,
      weeks: 12,
      startDate: dayOffset(-15),
      joinMode: "open",
      ownerId: "masha_reads",
      members: ["masha_reads", "igor_k", "tanya_w"],
      status: "open",
      createdAt: ago(60 * 24 * 20),
    },
    {
      id: "design-portfolio",
      title: "Портфолио дизайнера",
      goal: "Собрать 3 сильных кейса для портфолио",
      description: "Собираем 3 кейса для портфолио и даём честную обратную связь. Раз в две недели — общий разбор.",
      topic: "Дизайн",
      tags: ["Дизайн", "UX", "Карьера"],
      capacity: 8,
      weeks: 8,
      startDate: dayOffset(6),
      joinMode: "approval",
      ownerId: "sveta_ux",
      members: ["sveta_ux", "egor_ui", "roma_p", "olya_art", "vika_m"],
      status: "open",
      createdAt: ago(60 * 24 * 5),
    },
    {
      id: "run-10k",
      title: "Бег: первые 10 км",
      goal: "Пробежать 10 км без остановки",
      description: "Тренируемся по плану, раз в неделю — отчёт и советы друг другу. Подходит тем, кто уже бегает 3–5 км.",
      topic: "Привычки",
      tags: ["Бег", "Здоровье"],
      capacity: 8,
      weeks: 10,
      startDate: dayOffset(3),
      joinMode: "open",
      ownerId: "nina_run",
      members: ["nina_run", "gleb_s", "yulia_f", "pasha_b", "fedya", "shura_k"],
      status: "open",
      createdAt: ago(60 * 24 * 3),
    },
    {
      id: "clean-yard",
      title: "Двор без мусора",
      goal: "Навести порядок в трёх дворах района",
      description: "Субботники и переговоры с управляющей компанией. Встречи — только во дворах, адреса обсуждаем внутри круга.",
      topic: "Локальные дела",
      tags: ["Экология", "Город"],
      capacity: 8,
      weeks: 4,
      startDate: dayOffset(5),
      joinMode: "approval",
      ownerId: "zoya_eco",
      members: ["zoya_eco", "khasan", "tsveta"],
      status: "open",
      createdAt: ago(60 * 24 * 2),
    },
    {
      id: "ielts-full",
      title: "Разговорный английский по вечерам",
      goal: "Свободно говорить 10 минут на любую тему",
      description: "Короткие ежедневные голосовые задания и еженедельный отчёт. Круг уже собран.",
      topic: "Языки",
      tags: ["Английский"],
      capacity: 3,
      weeks: 6,
      startDate: dayOffset(-3),
      joinMode: "open",
      ownerId: "dasha_l",
      members: ["dasha_l", "lev_t", "igor_k"],
      status: "open",
      createdAt: ago(60 * 24 * 7),
    },
  ];

  return {
    version: 1,
    meId: null,
    people: Object.fromEntries(people.map((p) => [p.id, p])),
    circles,
    requests: [],
    steps: [
      {
        id: "s-ielts-1",
        circleId: "ielts-7",
        authorId: "masha_reads",
        week: 3,
        body: "Прошла 2 пробных теста: Reading 7.5, Listening 7.0. Writing пока проседает — буду писать по эссе каждые два дня. Кто готов проверить моё эссе в четверг?",
        createdAt: ago(180),
        support: [],
        useful: [],
        baseSupport: 3,
        baseUseful: 1,
      },
      {
        id: "s-ielts-2",
        circleId: "ielts-7",
        authorId: "igor_k",
        week: 3,
        body: "Выучил 120 слов из списка Academic. Мешает время — работаю допоздна, поэтому перенёс занятия на утро.",
        createdAt: ago(60 * 20),
        support: [],
        useful: [],
        baseSupport: 2,
        baseUseful: 0,
      },
      {
        id: "s-py-1",
        circleId: "python-6",
        authorId: "kirill_dev",
        week: 2,
        body: "Разобрался со списками и словарями, сделал консольный список покупок. Застрял на чтении файлов — завтра попробую ещё раз.",
        createdAt: ago(60 * 30),
        support: [],
        useful: [],
        baseSupport: 2,
        baseUseful: 2,
      },
    ],
    comments: [
      { id: "c-1", stepId: "s-ielts-1", authorId: "tanya_w", body: "Могу проверить в четверг вечером, присылай в чат круга.", createdAt: ago(150) },
      { id: "c-2", stepId: "s-py-1", authorId: "anna_codes", body: "Попробуй конструкцию with open(...) — покажу пример на следующей неделе.", createdAt: ago(60 * 26) },
    ],
    messages: [
      { id: "m-1", circleId: "ielts-7", authorId: "masha_reads", body: "Всем привет! Пробник в субботу в 11:00, кто с нами?", createdAt: ago(60 * 26) },
      { id: "m-2", circleId: "ielts-7", authorId: "igor_k", body: "Я буду, но начну на полчаса позже.", createdAt: ago(60 * 25) },
      { id: "m-3", circleId: "python-6", authorId: "anna_codes", body: "Напоминаю: шаг недели — до воскресенья. Не обязательно идеально, главное — честно.", createdAt: ago(60 * 40) },
    ],
    reports: [],
    blocks: [],
    revealed: [],
    mutedCircles: [],
    notifications: [],
    notificationSettings: defaultNotificationSettings(),
  };
}
