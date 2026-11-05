import { expect, test } from "@playwright/test";

test("agenda : liste groupée, création de RDV, calendrier", async ({ page }) => {
  await page.goto("/agenda");
  await expect(page.getByText("En retard").first()).toBeVisible();
  await expect(page.getByText("Séquence J+7").first()).toBeVisible();

  await page.getByRole("button", { name: "RDV", exact: true }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByRole("combobox", { name: "Hôtel" }).click();
  await page.getByRole("option", { name: /Villa Mimosa/ }).click();
  await dlg.getByLabel("Titre").fill("Démo standard IA");
  await dlg.getByRole("button", { name: "J+3" }).click();
  await dlg.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Démo standard IA")).toBeVisible();

  await page.getByRole("tab", { name: "Calendrier" }).click();
  await expect(page).toHaveURL(/vue=calendrier/);
  await expect(page.getByRole("button", { name: "Mois suivant" })).toBeVisible();
  await page.getByRole("button", { name: "Mois suivant" }).click();
  await expect(page).toHaveURL(/mois=\d{4}-\d{2}/);
});
