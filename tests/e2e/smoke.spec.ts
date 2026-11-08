import { test, expect } from "@playwright/test";

const pages = [
  { path: "/", heading: /Одному трудно/ },
  { path: "/circles", heading: /Найдите свой круг/ },
];

for (const { path, heading } of pages) {
  test(`страница ${path} открывается и показывает заголовок`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  });

  test(`страница ${path} без ошибок в консоли`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });

  test(`страница ${path} не шире экрана (320 px)`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("честно предупреждаем, что это прототип", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Прототип интерфейса")).toBeVisible();
});
