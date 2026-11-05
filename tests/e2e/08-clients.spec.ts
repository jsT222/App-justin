import { expect, test } from "@playwright/test";

test("clients : MRR, upsell, automatisations", async ({ page }) => {
  await page.goto("/clients");
  await expect(page.getByText("590 €").first()).toBeVisible();
  await expect(page.getByText("À proposer", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Hôtel Le Jardin de la Darse" }).click();
  await expect(page.getByText("C'est le moment de proposer une nouvelle automatisation")).toBeVisible();
  await page.getByRole("button", { name: "Marquer traité" }).click();
  await expect(page.getByText("C'est le moment de proposer")).toHaveCount(0);

  await page.getByRole("button", { name: "Ajouter" }).first().click();
  await page.getByRole("combobox", { name: "Offre" }).click();
  await page.getByRole("option", { name: "Réponse automatique aux avis Google et Booking" }).click();
  await page.getByRole("combobox", { name: "Statut" }).click();
  await page.getByRole("option", { name: "En production" }).click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.locator('[data-automatisation="Réponse automatique aux avis Google et Booking"]')).toBeVisible();
  await expect(page.getByText("MRR").locator("..")).toContainText("380");
});
