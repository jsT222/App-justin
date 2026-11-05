import { expect, test } from "@playwright/test";

test("menu mobile", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.locator("aside")).toBeHidden();
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Pipeline" }).click();
  await expect(page).toHaveURL(/\/pipeline$/);
  await expect(page.getByRole("dialog")).toBeHidden();
});
