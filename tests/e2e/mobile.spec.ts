import { expect, test } from "@playwright/test";

test("menu mobile", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.locator("aside")).toBeHidden();
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Pipeline" }).click();
  await expect(page).toHaveURL(/\/pipeline$/);
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("barre d'actions mobile : noter un appel après coup", async ({ page }) => {
  await page.goto("/prospects");
  await page.getByRole("row", { name: /Villa Mimosa/ }).click();
  await expect(page.getByRole("heading", { name: "Villa Mimosa" })).toBeVisible();
  const barre = page.getByRole("navigation", { name: "Actions rapides" });
  await barre.getByRole("button", { name: "Noter l'appel" }).click();
  const dlg = page.getByRole("dialog");
  await expect(dlg.getByRole("radio", { name: "Appel" })).toHaveAttribute("aria-checked", "true");
  await dlg.getByLabel("Contenu de l'échange").fill("Appel mobile : intéressée, rappeler lundi");
  await dlg.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Appel mobile : intéressée, rappeler lundi")).toBeVisible();
});
