import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("objectifs : progression, ajustement du mois, historique", async ({ page }) => {
  await page.goto("/objectifs");
  await expect(page.getByText("Historique par semaine")).toBeVisible();
  await expect(page.getByTestId("mois-signatures")).toContainText("/ 2");
  await page.getByRole("button", { name: "Ajuster ce mois" }).click();
  await page.getByLabel("Objectif Signatures").fill("3");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByTestId("mois-signatures")).toContainText("/ 3");
  await page.getByRole("button", { name: "+1 message envoyé" }).click();
});

test("paramètres : profil + logo, étape renommée, tag ajouté, objectifs par défaut", async ({ page }) => {
  await page.goto("/parametres");
  await page.getByLabel("Raison sociale / nom commercial").fill("Justin IA Conseil");
  await page.getByLabel("SIRET").fill("123 456 789 00012");
  await page.getByLabel("Téléverser un logo").setInputFiles("tests/e2e/fixtures/logo.png");
  await expect(page.getByText("Logo mis à jour")).toBeVisible();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Informations enregistrées")).toBeVisible();

  await page.getByRole("tab", { name: "Pipeline" }).click();
  await page.locator('[data-etape-param="Audit fait"]').getByLabel("Nom de l'étape").fill("Audit réalisé");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Pipeline enregistré")).toBeVisible();

  await page.getByRole("tab", { name: "Sources et tags" }).click();
  await page.getByLabel("Ajouter : Douleurs (tags)").fill("Pas de site mobile");
  await page.getByLabel("Ajouter : Douleurs (tags)").press("Enter");
  await expect(page.getByText("Pas de site mobile")).toBeVisible();

  await page.goto("/pipeline");
  await expect(page.locator('[data-etape="Audit réalisé"]')).toBeVisible();

  // Remise en état
  await page.goto("/parametres");
  await page.getByRole("tab", { name: "Pipeline" }).click();
  await page.locator('[data-etape-param="Audit réalisé"]').getByLabel("Nom de l'étape").fill("Audit fait");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Pipeline enregistré")).toBeVisible();
  await page.getByRole("tab", { name: "Sources et tags" }).click();
  await page.getByRole("button", { name: "Supprimer Pas de site mobile" }).click();
  await expect(page.getByText("Pas de site mobile")).toHaveCount(0);
});
