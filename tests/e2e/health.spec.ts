import { expect, test } from "@playwright/test";

test("health page reports the application and database", async ({ page }) => {
  await page.goto("/health");

  await expect(page.getByRole("heading", { name: "Состояние системы" })).toBeVisible();
  await expect(page.getByTestId("health-page")).toHaveAttribute("data-status", "ok");
  await expect(page.getByText("Приложение")).toBeVisible();
  await expect(page.getByText("База данных")).toBeVisible();
  await expect(page.getByText("Доступна", { exact: true })).toBeVisible();
});
