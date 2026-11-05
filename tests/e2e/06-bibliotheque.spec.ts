import { expect, test } from "@playwright/test";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test("bibliothèque : offres et modèles avec variables + copier", async ({ page }) => {
  await page.goto("/bibliotheque");
  await expect(page.getByText("Standard téléphonique IA")).toBeVisible();
  await expect(page.getByText("Synchronisation PMS / outils internes")).toBeVisible();

  await page.getByRole("button", { name: "Nouvelle offre" }).click();
  await page.getByLabel("Nom").fill("Check-in en ligne");
  await page.getByLabel("Mise en place (€)").fill("1400");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Check-in en ligne")).toBeVisible();

  await page.getByRole("tab", { name: /Modèles de messages/ }).click();
  const carte = page.locator('[data-modele="Invitation LinkedIn"]');
  await expect(carte.locator("[data-contenu]")).toContainText("{prenom}");
  await page.getByRole("combobox", { name: "Hôtel pour les variables" }).click();
  await page.getByRole("option", { name: /Villa Mimosa/ }).click();
  await expect(carte.locator("[data-contenu]")).toContainText("Bonjour Isabelle");
  await expect(carte.locator("[data-contenu]")).toContainText("Villa Mimosa");

  await carte.getByRole("button", { name: "Copier" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Bonjour Isabelle");
});
