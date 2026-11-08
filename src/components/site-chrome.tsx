import Link from "next/link";
import { ButtonLink, Logo } from "./ui";

/** Полоса-предупреждение: честно говорим, что это прототип. Уберём, когда заработают вход и данные. */
export function PrototypeBanner() {
  return (
    <div className="bg-ink px-4 py-2 text-center text-[13px] text-surface">
      Прототип интерфейса: вход, создание и вступление в круги заработают на этапе разработки. Данные на страницах — демонстрационные.
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-4 py-3 sm:px-5 md:px-8 md:py-4">
        <Link href="/" aria-label="Сообща — на главную">
          <Logo />
        </Link>
        <nav aria-label="Основная навигация" className="hidden items-center gap-9 text-[15px] font-medium text-ink-2 lg:flex">
          <Link href="/circles" className="hover:text-ink">
            Круги
          </Link>
          <Link href="/#how" className="hover:text-ink">
            Как это работает
          </Link>
          <Link href="/#safety" className="hover:text-ink">
            Безопасность
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {/* Скрываем обёртку, а не саму кнопку: у кнопки свой display, и классы конфликтуют */}
          <span className="hidden gap-2 sm:flex">
            <ButtonLink href="#" variant="ghost">
              Войти
            </ButtonLink>
            <ButtonLink href="#">Создать аккаунт</ButtonLink>
          </span>
          {/* На узких экранах — одна короткая кнопка, чтобы шапка не вылезала за край */}
          <span className="sm:hidden">
            <ButtonLink href="#">Войти</ButtonLink>
          </span>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-5 py-8 text-sm text-ink-2 md:flex-row md:items-center md:justify-between md:px-8">
        <span className="text-ink-3">© 2026 Сообща</span>
        <nav aria-label="Служебные ссылки" className="flex flex-wrap gap-x-7 gap-y-2">
          <span>Правила сообщества</span>
          <span>Конфиденциальность</span>
          <span>Связаться с нами</span>
        </nav>
      </div>
    </footer>
  );
}
