# Сообща

Совместный планер для маленьких групп: общая цель, задачи со сроками и ответственными, прогресс, который видят все участники.

## Как устроено
- **Next.js + TypeScript + Tailwind** — интерфейс (папка `src/planner`).
- **Supabase** — база данных Postgres с правилами доступа (RLS), вход и синхронизация в реальном времени (папка `supabase/migrations`).

## Запуск локально

```bash
npm install
npx supabase start          # локальная база, вход и синхронизация (нужен Docker)
cp .env.example .env.local  # и впишите API_URL и PUBLISHABLE_KEY из вывода supabase start
npm run dev
```

Откройте http://localhost:3000.

## Проверки

```bash
npm run lint        # стиль кода
npm run typecheck   # типы TypeScript
npm run build       # сборка
npm run test:db     # права доступа и синхронизация (RLS) на локальном Supabase
npm run test:e2e    # сквозные тесты Playwright: два пользователя, телефон, 320 px
```

Правила работы над проектом — в [CLAUDE.md](CLAUDE.md). Концепция — [docs/planner-v2.md](docs/planner-v2.md).
