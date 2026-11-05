import { expect, test } from "@playwright/test";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test("bibliothèque : offres et modèles avec variables + copier", async ({ page }) => {
  await page.goto("/bibliotheque");
  await expect(page.getByText("Standard téléphonique IA")).toBeVisible();
  await expect(page.getByText("Synchronisation PMS / outils internes")).toBeVisible();

  await page.getByRole("button", { name: "Nouvelle offre" }).click();
  const offre = `Check-in en ligne ${Date.now().toString().slice(-5)}`;
  await page.getByLabel("Nom").fill(offre);
  await page.getByLabel("Mise en place (€)").fill("1400");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText(offre)).toBeVisible();
  await page.getByRole("button", { name: `Actions ${offre}` }).click();
  await page.getByRole("menuitem", { name: "Supprimer" }).click();
  await expect(page.getByText(offre)).toHaveCount(0);

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
