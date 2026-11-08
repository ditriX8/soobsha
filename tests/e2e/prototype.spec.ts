import { test, expect, type Page } from "@playwright/test";

/* Каждый тест начинается с чистого браузера: localStorage пустой, демо-данные исходные. */

async function login(page: Page, nick = "tester_1") {
  await page.goto("/#login");
  await page.getByLabel("Никнейм").fill(nick);
  await page.getByLabel(/Мне есть 16 лет/).check();
  await page.getByRole("button", { name: "Войти в демо" }).click();
  await expect(page.getByRole("heading", { name: "Мои круги" })).toBeVisible();
}

const toast = (page: Page) => page.getByTestId("toast").last();

test.describe("навигация и главная", () => {
  test("главная → каталог по кнопке, без ошибок в консоли", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Одному трудно/);
    await page.getByRole("link", { name: "Найти свой круг" }).click();
    await expect(page).toHaveURL(/#catalog$/);
    await expect(page.getByRole("heading", { name: "Найдите свой круг" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("карточка круга открывает его страницу, «Назад» возвращает", async ({ page }) => {
    await page.goto("/#catalog");
    await page.getByRole("link", { name: "IELTS 7.0 к марту" }).click();
    await expect(page).toHaveURL(/#circle-ielts-7$/);
    await expect(page.getByRole("heading", { level: 1, name: "IELTS 7.0 к марту" })).toBeVisible();
    await page.getByRole("button", { name: "Назад" }).click();
    await expect(page).toHaveURL(/#catalog$/);
  });

  test("ссылки подвала и демо-полосы ведут на свои страницы", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Правила сообщества" }).click();
    await expect(page.getByRole("heading", { name: "Правила сообщества" })).toBeVisible();
    await page.getByRole("link", { name: "Конфиденциальность" }).click();
    await expect(page.getByRole("heading", { name: "Конфиденциальность" })).toBeVisible();
    await page.getByRole("link", { name: "Что работает?" }).click();
    await expect(page.getByRole("heading", { name: "О демо-режиме" })).toBeVisible();
  });

  test("закрытые разделы просят войти", async ({ page }) => {
    await page.goto("/#my");
    await expect(page.getByRole("heading", { name: "Нужно войти" })).toBeVisible();
    await page.getByRole("link", { name: "Войти в демо" }).click();
    await expect(page).toHaveURL(/#login$/);
  });
});

test.describe("демо-вход", () => {
  test("проверяет никнейм и возраст", async ({ page }) => {
    await page.goto("/#login");
    await page.getByRole("button", { name: "Войти в демо" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("Никнейм");
    await page.getByLabel("Никнейм").fill("masha_reads");
    await page.getByLabel(/Мне есть 16 лет/).check();
    await page.getByRole("button", { name: "Войти в демо" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("занят");
    await page.getByLabel("Никнейм").fill("new_user");
    await page.getByLabel(/Мне есть 16 лет/).uncheck();
    await page.getByRole("button", { name: "Войти в демо" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("16");
  });

  test("после входа — пустое состояние «Мои круги», данные переживают перезагрузку", async ({ page }) => {
    await login(page);
    await expect(page.getByText("Вы пока ни в одном круге")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Мои круги" })).toBeVisible();
  });
});

test.describe("каталог", () => {
  test("поиск фильтрует и показывает пустое состояние со сбросом", async ({ page }) => {
    await page.goto("/#catalog");
    const cards = page.getByTestId("circle-card");
    await expect(cards).toHaveCount(6);
    await page.getByLabel("Поиск кругов").fill("python");
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("Python с нуля");
    await page.getByLabel("Поиск кругов").fill("кулинария");
    await expect(page.getByText("Ничего не нашли по «кулинария»")).toBeVisible();
    await page.getByRole("button", { name: "Сбросить фильтры" }).click();
    await expect(cards).toHaveCount(6);
  });

  test("тема и шторка фильтров работают", async ({ page }) => {
    await page.goto("/#catalog");
    const cards = page.getByTestId("circle-card");
    await page.getByRole("button", { name: "Языки", exact: true }).click();
    await expect(cards).toHaveCount(2);
    await page.getByRole("button", { name: "Все темы" }).click();
    await page.getByRole("button", { name: /^Фильтры/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "до 4 недель" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Применить" }).click();
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("Двор без мусора");
    await page.getByRole("button", { name: /^Фильтры/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Сбросить" }).click();
    await page.getByRole("dialog").getByLabel("Только со свободными местами").check();
    await page.getByRole("dialog").getByRole("button", { name: "Применить" }).click();
    await expect(cards).toHaveCount(5); // один круг полностью набран
  });
});

test.describe("создание круга", () => {
  test("проверка полей, 3 шага, круг появляется в «Моих кругах» и каталоге", async ({ page }) => {
    await login(page);
    await page.goto("/#new");
    await page.getByRole("button", { name: "Далее" }).click();
    await expect(page.getByText("Название — минимум 5 символов")).toBeVisible();
    await expect(page.getByText("Выберите тему")).toBeVisible();

    await page.getByLabel("Название круга").fill("Читаем по-английски");
    await page.getByLabel(/Цель/).fill("Прочитать одну книгу в оригинале");
    await page.getByRole("button", { name: "Языки", exact: true }).click();
    await page.getByLabel(/Теги/).fill("Английский");
    await page.getByRole("button", { name: "Добавить" }).click();
    await page.getByRole("button", { name: "Далее" }).click();

    await expect(page.getByText("Шаг 2 из 3")).toBeVisible();
    await page.getByRole("button", { name: "Далее" }).click();
    await expect(page.getByText("Шаг 3 из 3")).toBeVisible();
    await expect(page.getByText("Прочитать одну книгу в оригинале")).toBeVisible();
    await page.getByRole("button", { name: "Создать круг" }).click();

    await expect(toast(page)).toContainText("создан");
    await expect(page.getByRole("heading", { level: 1, name: "Читаем по-английски" })).toBeVisible();

    await page.goto("/#my");
    await expect(page.getByText("вы создатель")).toBeVisible();
    await page.reload();
    await page.goto("/#catalog");
    await expect(page.getByRole("link", { name: "Читаем по-английски" })).toBeVisible();
  });
});

test.describe("страница круга", () => {
  test("гость видит предложение войти, шаги скрыты", async ({ page }) => {
    await page.goto("/#circle-ielts-7");
    await expect(page.getByText("Шаги участников видят только участники")).toBeVisible();
    await page.getByRole("button", { name: "Войти и вступить" }).click();
    await page.getByLabel("Никнейм").fill("guest_joiner");
    await page.getByLabel(/Мне есть 16 лет/).check();
    await page.getByRole("button", { name: "Войти в демо" }).click();
    await expect(page).toHaveURL(/#circle-ielts-7$/);
  });

  test("вступить, опубликовать шаг, реакция, комментарий, чат — и всё сохраняется", async ({ page }) => {
    await login(page);
    await page.goto("/#circle-ielts-7");
    await page.getByRole("button", { name: "Вступить в круг" }).click();
    await expect(toast(page)).toContainText("Вы в круге");

    await page.getByLabel("Текст шага").fill("Прошёл пробный Listening на 6.5");
    await page.getByRole("button", { name: "Опубликовать шаг" }).click();
    await expect(page.getByTestId("step").first()).toContainText("Прошёл пробный Listening");

    const myStep = page.getByTestId("step").first();
    await myStep.getByRole("button", { name: /Держись/ }).click();
    await expect(myStep.getByRole("button", { name: /Держись · 1/ })).toHaveAttribute("aria-pressed", "true");

    await myStep.getByRole("button", { name: /Комментарии/ }).click();
    await myStep.getByLabel("Комментарий").fill("Напоминание себе: повторить слова");
    await myStep.getByRole("button", { name: "Отправить" }).click();
    await expect(myStep.getByTestId("comment")).toContainText("повторить слова");

    await page.getByRole("tab", { name: "Чат" }).click();
    await expect(page.getByText("сообщения сохраняются только в вашем браузере")).toBeVisible();
    await page.getByLabel("Сообщение", { exact: true }).fill("Всем привет!");
    await page.getByRole("button", { name: "Отправить сообщение" }).click();
    await expect(page.getByTestId("chat-message").last()).toContainText("Всем привет!");

    await page.reload();
    await expect(page.getByTestId("step").first()).toContainText("Прошёл пробный Listening");
    await page.getByRole("tab", { name: "Чат" }).click();
    await expect(page.getByTestId("chat-message").last()).toContainText("Всем привет!");
  });

  test("предупреждение о контактах в шаге", async ({ page }) => {
    await login(page);
    await page.goto("/#circle-ielts-7");
    await page.getByRole("button", { name: "Вступить в круг" }).click();
    await page.getByLabel("Текст шага").fill("пишите мне в t.me/someone");
    await expect(page.getByText("Похоже на контакты")).toBeVisible();
  });

  test("заявка → демо-одобрение → выход с подтверждением", async ({ page }) => {
    await login(page);
    await page.goto("/#circle-python-6");
    await page.getByRole("button", { name: "Подать заявку" }).click();
    await page.getByLabel(/Сообщение создателю/).fill("Хочу учиться вместе");
    await page.getByRole("button", { name: "Отправить заявку" }).click();
    await expect(page.getByText("Заявка на рассмотрении")).toBeVisible();

    await page.goto("/#my");
    await expect(page.getByTestId("my-request")).toContainText("Python с нуля");
    await page.getByTestId("my-request").getByRole("link").click();

    await page.getByRole("button", { name: "Демо: одобрить за создателя" }).click();
    await expect(toast(page)).toContainText("вы в круге");
    await expect(page.getByLabel("Текст шага")).toBeVisible();

    await page.getByRole("button", { name: "Меню круга" }).click();
    await page.getByRole("button", { name: /Выйти из круга/ }).click();
    await page.getByRole("button", { name: "Остаться" }).click();
    await expect(page.getByLabel("Текст шага")).toBeVisible();

    await page.getByRole("button", { name: "Меню круга" }).click();
    await page.getByRole("button", { name: /Выйти из круга/ }).click();
    await page.getByRole("button", { name: "Нет времени" }).click();
    await page.getByRole("button", { name: "Выйти", exact: true }).click();
    await expect(toast(page)).toContainText("Вы вышли");
    await expect(page.getByRole("button", { name: "Подать заявку" })).toBeVisible();
  });

  test("полностью набранный круг не даёт вступить", async ({ page }) => {
    await login(page);
    await page.goto("/#circle-ielts-full");
    await expect(page.getByRole("button", { name: "Мест нет" })).toBeDisabled();
  });

  test("создатель: смоделированная заявка, одобрение, удаление участника", async ({ page }) => {
    await login(page, "owner_1");
    await page.goto("/#new");
    await page.getByLabel("Название круга").fill("Утренние пробежки");
    await page.getByLabel(/Цель/).fill("Бегать три раза в неделю");
    await page.getByRole("button", { name: "Привычки", exact: true }).click();
    await page.getByRole("button", { name: "Далее" }).click();
    await page.getByRole("button", { name: "Далее" }).click();
    await page.getByRole("button", { name: "Создать круг" }).click();

    await page.getByRole("tab", { name: "Участники" }).click();
    await expect(page.getByText("Новых заявок нет")).toBeVisible();
    await page.getByRole("button", { name: "Демо: смоделировать заявку" }).click();
    await expect(page.getByTestId("request")).toHaveCount(1);
    await page.getByTestId("request").getByRole("button", { name: "Принять" }).click();
    await expect(page.getByTestId("member")).toHaveCount(2);

    await page.getByTestId("member").nth(1).getByRole("button", { name: "Удалить" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Удалить" }).click();
    await expect(page.getByTestId("member")).toHaveCount(1);
  });
});

test.describe("безопасность", () => {
  test("жалоба скрывает шаг только у меня, блокировка и разблокировка", async ({ page }) => {
    await login(page);
    await page.goto("/#circle-ielts-7");
    await page.getByRole("button", { name: "Вступить в круг" }).click();

    const igorStep = page.getByTestId("step").filter({ hasText: "120 слов" });
    await igorStep.getByRole("button", { name: "Действия с шагом" }).click();
    await page.getByRole("button", { name: /Пожаловаться/ }).click();
    await page.getByRole("dialog").getByText("Спам или реклама").click();
    await page.getByRole("dialog").getByRole("button", { name: "Отправить жалобу" }).click();
    await expect(toast(page)).toContainText("Жалоба сохранена");
    await expect(page.getByText("Шаг скрыт(о) вами по жалобе")).toBeVisible();
    await page.getByRole("button", { name: "Показать" }).click();
    await expect(igorStep).toBeVisible();

    const mashaStep = page.getByTestId("step").filter({ hasText: "пробных теста" });
    await mashaStep.getByRole("button", { name: "Действия с шагом" }).click();
    await page.getByRole("button", { name: /Заблокировать @masha_reads/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Заблокировать" }).click();
    await expect(mashaStep).toHaveCount(0);

    await page.goto("/#settings-privacy");
    await expect(page.getByTestId("blocked")).toContainText("masha_reads");
    await page.getByRole("button", { name: "Разблокировать" }).click();
    await expect(page.getByText("Вы никого не блокировали")).toBeVisible();
  });

  test("чужой профиль показывает только разрешённые поля", async ({ page }) => {
    await login(page);
    await page.goto("/#u-masha_reads");
    // Интересы открыты всем, «о себе» — только участникам её кругов
    await expect(page.getByText("Аналитика")).toBeVisible();
    await expect(page.getByText("короткие конспекты")).toHaveCount(0);
    await page.goto("/#circle-ielts-7");
    await page.getByRole("button", { name: "Вступить в круг" }).click();
    await page.goto("/#u-masha_reads");
    await expect(page.getByText("короткие конспекты")).toBeVisible();
  });
});

test.describe("профиль и настройки", () => {
  test("редактирование профиля и видимость полей сохраняются", async ({ page }) => {
    await login(page);
    await page.goto("/#profile");
    await expect(page.getByText("Профиль пока пустой")).toBeVisible();
    await page.getByRole("link", { name: "Заполнить профиль" }).click();

    await page.getByRole("textbox", { name: "О себе" }).fill("Учусь программировать по вечерам");
    await page.getByRole("textbox", { name: "Интересы" }).fill("Python");
    await page.getByRole("textbox", { name: "Интересы" }).press("Enter");
    await page.getByTestId("block-interests").getByRole("radio", { name: "Все" }).click();
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(toast(page)).toContainText("Профиль сохранён");

    await page.reload();
    await expect(page.getByText("Учусь программировать по вечерам")).toBeVisible();
    // Как видит любой пользователь: интересы открыты, «о себе» — нет
    await page.getByRole("button", { name: "Любой пользователь" }).click();
    await expect(page.getByText("Python")).toBeVisible();
    await expect(page.getByText("Учусь программировать по вечерам")).toHaveCount(0);
  });

  test("контакты в «О себе» не сохраняются", async ({ page }) => {
    await login(page);
    await page.goto("/#profile-edit");
    await page.getByRole("textbox", { name: "О себе" }).fill("Звоните +7 900 123-45-67");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("Уберите контакты");
  });

  test("переключатели уведомлений меняют состояние и сохраняются", async ({ page }) => {
    await login(page);
    await page.goto("/#settings-notifications");
    const sw = page.getByRole("switch", { name: "Новые шаги в круге: в приложении" });
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await sw.click();
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await page.getByRole("switch", { name: "Выключить все уведомления" }).click();
    await expect(sw).toBeDisabled();
    await page.reload();
    await expect(page.getByRole("switch", { name: "Новые шаги в круге: в приложении" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("switch", { name: "Выключить все уведомления" })).toHaveAttribute("aria-checked", "true");
  });

  test("уведомления: список, прочитать все, переход", async ({ page }) => {
    await login(page);
    await page.goto("/#notifications");
    // «Новости» по умолчанию выключены, поэтому приветствие не приходит — список пуст
    await expect(page.getByText("Тихо — и это нормально")).toBeVisible();
    await page.goto("/#circle-ielts-7");
    await page.getByRole("button", { name: "Вступить в круг" }).click();
    await page.goto("/#notifications");
    await expect(page.getByTestId("notification")).toHaveCount(1);
    await page.getByRole("button", { name: "Прочитать все" }).click();
    await expect(page.getByRole("button", { name: "Прочитать все" })).toHaveCount(0);
    await page.getByTestId("notification").click();
    await expect(page).toHaveURL(/#circle-ielts-7$/);
  });

  test("сброс демо-данных с подтверждением", async ({ page }) => {
    await login(page);
    await page.goto("/#settings");
    await page.getByRole("button", { name: "Сбросить демо-данные" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Сбросить" }).click();
    await expect(page).toHaveURL(/#home$/);
    await page.goto("/#my");
    await expect(page.getByRole("heading", { name: "Нужно войти" })).toBeVisible();
  });
});

test.describe("телефон и маленькие экраны", () => {
  test("нижняя панель вкладок переключает разделы", async ({ page, isMobile }) => {
    test.skip(!isMobile, "только для телефона");
    await login(page);
    const tabs = page.getByRole("navigation", { name: "Вкладки" });
    await tabs.getByRole("link", { name: "Найти" }).click();
    await expect(page.getByRole("heading", { name: "Найдите свой круг" })).toBeVisible();
    await tabs.getByRole("link", { name: /Уведомления/ }).click();
    await expect(page.getByRole("heading", { name: "Уведомления" })).toBeVisible();
    await tabs.getByRole("link", { name: "Профиль" }).click();
    await expect(page.getByRole("heading", { name: "Мой профиль" })).toBeVisible();
  });

  test("основные экраны не шире 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await login(page, "small_screen");
    for (const h of ["#home", "#catalog", "#circle-ielts-7", "#new", "#profile-edit", "#settings-notifications", "#notifications"]) {
      await page.goto("/" + h);
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `горизонтальная прокрутка на ${h}`).toBeLessThanOrEqual(0);
    }
  });
});
