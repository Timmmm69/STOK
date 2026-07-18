import { expect, test } from "@playwright/test";

import { prepareAuthenticatedOwner } from "../support/authenticated-owner";

test("an anonymous visitor cannot open the store setup", async ({ page }) => {
  await page.goto("/setup");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Вход владельца" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти через Google" })).toBeVisible();
  await expect(page.getByText("самостоятельная регистрация", { exact: false })).toHaveCount(0);
});

test("the invited owner configures Лучок once and sees it after reload", async ({
  context,
  page,
}) => {
  const owner = await prepareAuthenticatedOwner();

  try {
    await context.addCookies(owner.cookies);
    await page.goto("/setup");

    await expect(page.getByRole("heading", { name: "Настройка Лучка" })).toBeVisible();
    await expect(page.getByLabel("Название магазина")).toHaveValue("Лучок");
    await page.getByRole("button", { name: "Создать магазин" }).click();

    await expect(page.getByText("Магазин настроен и защищён входом владельца.")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Лучок" })).toBeVisible();
    await expect(page.getByText("Белорусский рубль", { exact: false })).toHaveCount(0);
    await expect(page.getByText("BYN", { exact: true })).toBeVisible();
  } finally {
    await owner.disconnect();
  }
});
