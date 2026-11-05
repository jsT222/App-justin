import { expect, test, type Page } from "@playwright/test";

async function glisser(page: Page, hotel: string, colonne: string) {
  const carte = page.locator(`[data-hotel="${hotel}"]`);
  const cible = page.locator(`[data-etape="${colonne}"]`);
  await cible.scrollIntoViewIfNeeded();
  const a = (await carte.boundingBox())!;
  const b = (await cible.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + 10);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 10, a.y + 20, { steps: 5 });
  await page.mouse.move(b.x + b.width / 2, b.y + 80, { steps: 15 });
  await page.mouse.up();
}

test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 3400, height: 1000 } });

test("colonnes, totaux et glisser-déposer", async ({ page }) => {
  await page.goto("/pipeline");
  for (const c of ["Nouveau", "Contacté", "RDV planifié", "Audit fait", "Proposition envoyée", "Négociation", "Gagné", "Perdu"]) {
    await expect(page.locator(`[data-etape="${c}"]`)).toBeVisible();
  }
  // Négociation : Grand Hôtel de la Rade, 5500 + 12×480 = 11 260 €
  await expect(page.locator('[data-etape="Négociation"] [data-total]')).toContainText("11 260");

  await glisser(page, "Hôtel du Petit Port", "Contacté");
  await expect(page.locator('[data-etape="Contacté"] [data-hotel="Hôtel du Petit Port"]')).toBeVisible();
  await expect(page.getByText("Étape : Contacté")).toBeVisible();
});

test("passage en Perdu demande la raison, annulation possible", async ({ page }) => {
  await page.goto("/pipeline");
  await glisser(page, "Résidence Azur Village", "Perdu");
  await expect(page.getByRole("heading", { name: /comme perdu/ })).toBeVisible();
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(page.locator('[data-etape="Nouveau"] [data-hotel="Résidence Azur Village"]')).toBeVisible();

  await glisser(page, "Résidence Azur Village", "Perdu");
  await page.getByRole("radio", { name: "Prix" }).click();
  await page.getByRole("button", { name: "Marquer comme perdu" }).click();
  await expect(page.locator('[data-etape="Perdu"] [data-hotel="Résidence Azur Village"]')).toBeVisible();
});

test("passage en Gagné crée la fiche client", async ({ page }) => {
  await page.goto("/pipeline");
  await glisser(page, "Grand Hôtel de la Rade", "Gagné");
  await expect(page.getByText("La fiche client a été créée")).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-etape="Gagné"] [data-hotel="Grand Hôtel de la Rade"]')).toBeVisible();
  await page.locator('[data-hotel="Grand Hôtel de la Rade"]').getByRole("link", { name: "Grand Hôtel de la Rade" }).click();
  await expect(page.getByText("Client", { exact: true })).toBeVisible();
});
