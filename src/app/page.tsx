import { PlannerApp } from "@/planner/app";

/** «Сообща» — совместный планер для маленьких групп. Всё приложение — клиентское, данные в Supabase. */
export default function HomePage() {
  return <PlannerApp />;
}
