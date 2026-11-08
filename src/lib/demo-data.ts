import type { CircleSummary } from "@/components/circle-card";

/**
 * Демонстрационные данные для прототипа интерфейса.
 * Пока нет базы данных — это НЕ реальные круги и люди.
 * Будут заменены данными из Supabase на этапе разработки.
 */
export const demoCircles: CircleSummary[] = [
  {
    id: "python-6",
    title: "Python с нуля за 6 недель",
    description: "Разбираем основы, каждую неделю — маленький проект. Новичкам рады.",
    topic: "Программирование",
    topicTone: "mint",
    weeks: 6,
    startLabel: "18 ноября",
    joinMode: "approval",
    members: [
      { letter: "А", tone: "coral" },
      { letter: "М", tone: "sun" },
      { letter: "И", tone: "lilac" },
      { letter: "К", tone: "mint" },
    ],
    capacity: 6,
  },
  {
    id: "ielts-7",
    title: "IELTS 7.0 к марту",
    description: "Готовимся к экзамену: пробники по субботам, разбор эссе друг у друга.",
    topic: "Языки",
    topicTone: "lilac",
    weeks: 12,
    startLabel: "25 ноября",
    joinMode: "open",
    members: [
      { letter: "Д", tone: "mint" },
      { letter: "Л", tone: "coral" },
      { letter: "Т", tone: "sun" },
    ],
    capacity: 5,
  },
  {
    id: "design-portfolio",
    title: "Портфолио дизайнера",
    description: "Собираем 3 кейса для портфолио и даём честную обратную связь.",
    topic: "Дизайн",
    topicTone: "coral",
    weeks: 8,
    startLabel: "2 декабря",
    joinMode: "approval",
    members: [
      { letter: "С", tone: "lilac" },
      { letter: "Е", tone: "sun" },
      { letter: "Р", tone: "mint" },
      { letter: "О", tone: "coral" },
      { letter: "В", tone: "surface" },
    ],
    capacity: 8,
  },
  {
    id: "run-10k",
    title: "Бег: первые 10 км",
    description: "Тренируемся по плану, раз в неделю — отчёт и советы друг другу.",
    topic: "Привычки",
    topicTone: "sun",
    weeks: 10,
    startLabel: "20 ноября",
    joinMode: "open",
    members: [
      { letter: "Н", tone: "coral" },
      { letter: "Г", tone: "mint" },
      { letter: "Ю", tone: "lilac" },
      { letter: "П", tone: "sun" },
      { letter: "Ф", tone: "surface" },
      { letter: "Ш", tone: "mint" },
    ],
    capacity: 8,
  },
  {
    id: "clean-yard",
    title: "Двор без мусора",
    description: "Наводим порядок во дворах: субботники и переговоры с управляющей компанией.",
    topic: "Локальные дела",
    topicTone: "mint",
    weeks: 4,
    startLabel: "23 ноября",
    joinMode: "approval",
    members: [
      { letter: "З", tone: "sun" },
      { letter: "Х", tone: "coral" },
      { letter: "Ц", tone: "lilac" },
    ],
    capacity: 8,
  },
];

export const demoTopics = [
  "Все темы",
  "Программирование",
  "Языки",
  "Дизайн",
  "Экзамены",
  "Карьера",
  "Привычки",
  "Локальные дела",
];
