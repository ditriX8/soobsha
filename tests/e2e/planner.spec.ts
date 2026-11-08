import { test, expect, type Browser, type Page } from "@playwright/test";

/*
 * Сквозные тесты планера на настоящем (локальном) Supabase.
 * Перед запуском: npx supabase start
 * Каждый тест создаёт новых пользователей с уникальными никнеймами.
 */

let n = 0;
const nick = (p: string) => `${p}_${Date.now().toString(36).slice(-5)}${n++}`;

async function signIn(page: Page, name: string) {
  await page.goto("/#login");
  await page.getByLabel("Никнейм").fill(name);
  await page.getByLabel(/Мне есть 16 лет/).check();
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: "Мои круги" })).toBeVisible();
}

async function newUser(browser: Browser, prefix: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const name = nick(prefix);
  await signIn(page, name);
  return { page, name, ctx };
}

async function createCircle(page: Page, title: string, telegram = "") {
  await page.goto("/#new");
  await page.getByLabel("Название").fill(title);
  await page.getByLabel(/Цель/).fill("Довести дело до конца");
  if (telegram) await page.getByLabel(/Telegram/).fill(telegram);
  await page.getByRole("button", { name: "Создать круг" }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
}

async function addTask(page: Page, title: string) {
  await page.getByLabel("Новая задача").fill(title);
  await page.getByRole("button", { name: "Добавить задачу" }).click();
  await expect(page.getByTestId("task").filter({ hasText: title })).toBeVisible();
}

async function inviteCode(page: Page) {
  await page.getByRole("tab", { name: /Участники/ }).click();
  await page.getByRole("button", { name: /приглашение/i }).click();
  const code = (await page.getByTestId("invite-code").first().innerText()).trim();
  expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  return code;
}

const toast = (page: Page) => page.getByTestId("toast").last();

test.describe("вход и главная", () => {
  test("главная без ошибок, «Создать круг» ведёт ко входу", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Одному трудно/);
    await page.getByRole("link", { name: "Создать круг" }).click();
    await expect(page.getByRole("heading", { name: "Вход", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("проверка никнейма и возраста", async ({ page }) => {
    await page.goto("/#login");
    await page.getByLabel("Никнейм").fill("ab");
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("16");
    await page.getByLabel(/Мне есть 16 лет/).check();
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("3–20");
  });

  test("закрытые разделы просят войти; после входа — пустое состояние", async ({ page }) => {
    await page.goto("/#my");
    await expect(page.getByRole("heading", { name: "Нужно войти" })).toBeVisible();
    await signIn(page, nick("solo"));
    await expect(page.getByText("Пока ни одного круга")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Мои круги" })).toBeVisible();
  });
});

test.describe("совместная работа двух пользователей", () => {
  test("приглашение по коду, задачи, отметки, комментарии и чат синхронизируются без перезагрузки", async ({ browser }) => {
    const anya = await newUser(browser, "anya");
    const boris = await newUser(browser, "boris");
    const A = anya.page;
    const B = boris.page;

    await createCircle(A, "Переезд офиса", "https://t.me/office_move_test");
    await addTask(A, "Купить коробки");
    await addTask(A, "Заказать грузчиков");
    const code = await inviteCode(A);

    // Борис вступает по ссылке с кодом
    await B.goto(`/#join-${code.replace("-", "")}`);
    await expect(B.getByRole("heading", { name: "Переезд офиса" })).toBeVisible();
    await B.getByRole("button", { name: "Вступить в круг" }).click();
    await expect(B.getByRole("heading", { level: 1, name: "Переезд офиса" })).toBeVisible();
    await expect(B.getByTestId("task")).toHaveCount(2);

    // Аня видит нового участника без перезагрузки
    await expect(A.getByTestId("member")).toHaveCount(2);

    // Аня назначает Бориса — у Бориса задача становится «его»
    await A.getByRole("tab", { name: "План" }).click();
    await A.getByTestId("task").filter({ hasText: "Купить коробки" }).getByRole("button", { name: /Купить коробки/ }).last().click();
    await A.getByRole("dialog").getByLabel("Ответственный").selectOption({ label: `@${boris.name}` });
    await expect(toast(A)).toContainText("Ответственный назначен");
    await A.keyboard.press("Escape");
    const borisTask = B.getByTestId("task").filter({ hasText: "Купить коробки" });
    await expect(borisTask).toContainText("вы");

    // Борис не может отметить задачу, назначенную Ане
    await A.getByTestId("task").filter({ hasText: "Заказать грузчиков" }).getByRole("button", { name: /Заказать грузчиков/ }).last().click();
    await A.getByRole("dialog").getByLabel("Ответственный").selectOption({ label: "я" });
    await A.keyboard.press("Escape");
    await expect(B.getByRole("checkbox", { name: /Заказать грузчиков/ })).toBeDisabled();

    // Борис отмечает свою — прогресс у Ани меняется сам
    await B.getByRole("checkbox", { name: /Купить коробки/ }).click();
    await expect(toast(B)).toContainText("Готово");
    await expect(A.getByTestId("circle-progress")).toContainText("Выполнено 1 из 2");

    // Закрепить может только создатель
    await A.getByTestId("task").filter({ hasText: "Заказать грузчиков" }).getByRole("button", { name: /Заказать грузчиков/ }).last().click();
    await A.getByRole("dialog").getByRole("button", { name: "Закрепить" }).click();
    await expect(toast(A)).toContainText("Закреплено");
    await A.keyboard.press("Escape");
    await expect(B.getByText("закреплено", { exact: true })).toBeVisible();
    await B.getByTestId("task").filter({ hasText: "Заказать грузчиков" }).getByRole("button", { name: /Заказать грузчиков/ }).last().click();
    await expect(B.getByRole("dialog").getByRole("button", { name: "Закрепить" })).toHaveCount(0);

    // Комментарий Бориса появляется у Ани
    await B.getByRole("dialog").getByLabel("Комментарий").fill("Во сколько приедут грузчики?");
    await B.getByRole("dialog").getByRole("button", { name: "Отправить" }).click();
    await expect(B.getByRole("dialog").getByTestId("comment")).toContainText("Во сколько");
    await B.keyboard.press("Escape");
    await A.getByTestId("task").filter({ hasText: "Заказать грузчиков" }).getByRole("button", { name: /Заказать грузчиков/ }).last().click();
    await expect(A.getByRole("dialog").getByTestId("comment")).toContainText("Во сколько");
    await A.keyboard.press("Escape");

    // Чат и Telegram
    await A.getByRole("tab", { name: "Обсуждение" }).click();
    await B.getByRole("tab", { name: "Обсуждение" }).click();
    await expect(B.getByRole("button", { name: "Открыть в Telegram" })).toBeVisible();
    await A.getByLabel("Сообщение", { exact: true }).fill("Всем привет! Встречаемся в 10.");
    await A.getByRole("button", { name: "Отправить сообщение" }).click();
    await expect(B.getByTestId("chat-message").last()).toContainText("Встречаемся в 10");

    // Уведомление Ане о комментарии и вступлении
    await A.goto("/#notifications");
    await expect(A.getByTestId("notification").first()).toBeVisible();
    await expect(A.getByText(/прокомментировал/)).toBeVisible();

    // Борис выходит — у Ани остаётся один участник
    await B.getByRole("button", { name: "Меню круга" }).click();
    await B.getByRole("button", { name: /Выйти из круга/ }).click();
    await B.getByRole("dialog").getByRole("button", { name: "Выйти" }).click();
    await expect(B.getByRole("heading", { name: "Мои круги" })).toBeVisible();
    await A.goBack();
    await A.getByRole("tab", { name: /Участники/ }).click();
    await expect(A.getByTestId("member")).toHaveCount(1);

    await anya.ctx.close();
    await boris.ctx.close();
  });

  test("посторонний не может открыть чужой круг, отозванный код не работает", async ({ browser }) => {
    const owner = await newUser(browser, "own");
    const eve = await newUser(browser, "eve");
    await createCircle(owner.page, "Секретный круг");
    const url = owner.page.url();
    const code = await inviteCode(owner.page);

    await eve.page.goto(url.slice(url.indexOf("#")).replace(/^/, "/"));
    await expect(eve.page.getByRole("heading", { name: "Круг недоступен" })).toBeVisible();

    await owner.page.getByRole("button", { name: "Отозвать" }).click();
    await owner.page.getByRole("dialog").getByRole("button", { name: "Отозвать" }).click();
    await expect(toast(owner.page)).toContainText("отозвано");

    await eve.page.goto("/#join");
    await eve.page.getByLabel("Код приглашения").fill(code);
    await eve.page.getByRole("button", { name: /Найти круг/ }).click();
    await expect(eve.page.getByRole("alert").filter({ hasText: "отозвано" })).toBeVisible();
    await owner.ctx.close();
    await eve.ctx.close();
  });
});

test.describe("профиль и настройки", () => {
  test("видимость полей: закрытое не видно участнику, открытое — видно", async ({ browser }) => {
    const a = await newUser(browser, "pa");
    const b = await newUser(browser, "pb");
    await a.page.goto("/#profile-edit");
    await a.page.getByRole("textbox", { name: "О себе" }).fill("Люблю порядок и списки");
    await a.page.getByRole("textbox", { name: "Интересы" }).fill("Логистика");
    await a.page.getByRole("textbox", { name: "Интересы" }).press("Enter");
    await a.page.getByTestId("block-interests").getByRole("radio", { name: "Участники моих кругов" }).click();
    await a.page.getByRole("button", { name: "Сохранить" }).click();
    await expect(toast(a.page)).toContainText("Профиль сохранён");

    await createCircle(a.page, "Профильный круг");
    const code = await inviteCode(a.page);
    await b.page.goto(`/#join-${code.replace("-", "")}`);
    await b.page.getByRole("button", { name: "Вступить в круг" }).click();
    await b.page.getByRole("tab", { name: /Участники/ }).click();
    await b.page.getByRole("link", { name: new RegExp(a.name) }).click();
    await expect(b.page.getByText("Логистика")).toBeVisible();
    await expect(b.page.getByText("Люблю порядок")).toHaveCount(0);
    await a.ctx.close();
    await b.ctx.close();
  });

  test("контакты в «О себе» не сохраняются", async ({ page }) => {
    await signIn(page, nick("ct"));
    await page.goto("/#profile-edit");
    await page.getByRole("textbox", { name: "О себе" }).fill("Пишите +7 900 123-45-67");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("Уберите контакты");
  });

  test("настройки уведомлений сохраняются на сервере", async ({ page }) => {
    await signIn(page, nick("ns"));
    await page.goto("/#settings-notifications");
    const sw = page.getByRole("switch", { name: "Мою задачу выполнили" });
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await sw.click();
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await page.reload();
    await expect(page.getByRole("switch", { name: "Мою задачу выполнили" })).toHaveAttribute("aria-checked", "true");
  });

  test("удаление аккаунта", async ({ page }) => {
    await signIn(page, nick("del"));
    await page.goto("/#settings");
    await page.getByRole("button", { name: "Удалить аккаунт" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Удалить навсегда" }).click();
    await expect(toast(page)).toContainText("Аккаунт удалён");
    await page.goto("/#my");
    await expect(page.getByRole("heading", { name: "Нужно войти" })).toBeVisible();
  });
});

test.describe("телефон и маленькие экраны", () => {
  test("нижняя панель вкладок", async ({ page, isMobile }) => {
    test.skip(!isMobile, "только для телефона");
    await signIn(page, nick("tab"));
    const tabs = page.getByRole("navigation", { name: "Вкладки" });
    await tabs.getByRole("link", { name: "По коду" }).click();
    await expect(page.getByRole("heading", { name: "Вступить по приглашению" })).toBeVisible();
    await tabs.getByRole("link", { name: /Уведомления/ }).click();
    await expect(page.getByRole("heading", { name: "Уведомления" })).toBeVisible();
    await tabs.getByRole("link", { name: "Профиль" }).click();
    await expect(page.getByRole("heading", { name: "Мой профиль" })).toBeVisible();
  });

  test("экраны не шире 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await signIn(page, nick("sm"));
    await createCircle(page, "Узкий экран");
    await addTask(page, "Очень длинное название задачи, которое должно аккуратно обрезаться");
    const circle = page.url().slice(page.url().indexOf("#"));
    for (const h of ["#home", "#my", circle, "#new", "#join", "#profile-edit", "#settings-notifications", "#notifications"]) {
      await page.goto("/" + h);
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `горизонтальная прокрутка на ${h}`).toBeLessThanOrEqual(0);
    }
  });
});
