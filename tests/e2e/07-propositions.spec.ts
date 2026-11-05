import { rechargerDemo } from "./helpers";
import { expect, test } from "@playwright/test";

test.beforeAll(rechargerDemo);

test.describe.configure({ mode: "serial" });

test("créer une proposition depuis une fiche, ajuster, PDF, accepter", async ({ page, request }) => {
  await page.goto("/prospects");
  await page.getByLabel("Rechercher un prospect").fill("Roches Rouges");
  await page.getByRole("row", { name: /Roches Rouges/ }).click();
  await page.getByRole("link", { name: "Créer une proposition" }).first().click();
  await expect(page).toHaveURL(/\/propositions\/nouvelle\?hotel=/);
  // Offres recommandées pré-cochées selon les douleurs
  await expect(page.getByRole("checkbox", { name: "Standard téléphonique IA" })).toBeChecked();
  await page.getByRole("checkbox", { name: "Chatbot réservation site et WhatsApp" }).uncheck();
  await page.getByRole("checkbox", { name: "Emails pré-séjour et post-séjour automatisés" }).uncheck();
  await page.getByLabel("Titre").fill("Programme Roches Rouges");
  await page.getByRole("button", { name: "Créer la proposition" }).click();
  await expect(page).toHaveURL(/\/propositions\/[0-9a-f-]{36}$/);

  // 2500 + 1800 + 1200 + 2500 = 8000 ; 290 + 150 + 90 + 150 = 680
  await expect(page.getByTestId("total-setup")).toContainText("8 000,00");
  await expect(page.getByTestId("total-mensuel")).toContainText("680,00");
  await page.getByLabel("Remise (%)").fill("10");
  await page.locator('[data-ligne="0"]').getByLabel("Prix mise en place").fill("3000");
  await expect(page.getByTestId("total-setup")).toContainText("7 650,00");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByText("Proposition enregistrée")).toBeVisible();

  const id = page.url().split("/").pop();
  const pdf = await request.get(`/api/propositions/${id}/pdf`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");

  await page.getByRole("button", { name: "Marquer envoyée" }).click();
  await expect(page.getByText("Envoyée", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Acceptée" }).click();
  await expect(page.getByText("Client et automatisations créés")).toBeVisible();
  await page.getByRole("link", { name: /Domaine des Roches Rouges/ }).click();
  await expect(page.getByText("Client", { exact: true })).toBeVisible();
});
