import { rechargerDemo } from "./helpers";
import { expect, test } from "@playwright/test";

test.beforeAll(rechargerDemo);

const suffixe = Date.now().toString().slice(-6);

test.describe.configure({ mode: "serial" });

test("liste : recherche, filtres, tri, export", async ({ page }) => {
  await page.goto("/prospects");
  await expect(page.getByRole("heading", { name: "Prospects" })).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(21); // en-tête + 20 hôtels de démo

  await page.getByLabel("Rechercher un prospect").fill("mimosa");
  await expect(page.getByRole("row")).toHaveCount(2);
  await page.getByRole("button", { name: "Réinitialiser" }).click();

  await page.getByRole("button", { name: "Étape" }).first().click();
  await page.getByRole("menuitemcheckbox", { name: "Gagné" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("row")).toHaveCount(4);
  await page.getByRole("button", { name: "Réinitialiser" }).click();

  const telechargement = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter" }).click();
  expect((await telechargement).suggestedFilename()).toMatch(/^prospects-.*\.csv$/);
});

test("création, doublon, fiche complète", async ({ page }) => {
  await page.goto("/prospects");
  await page.getByRole("button", { name: "Nouveau prospect" }).click();
  await page.getByLabel("Nom *").fill("Villa Mimosa");
  await page.getByLabel("Ville").fill("Antibes");
  await page.getByLabel("Nom *").focus();
  await expect(page.getByText("Doublon possible")).toBeVisible();

  const nom = `Hôtel E2E ${suffixe}`;
  await page.getByLabel("Nom *").fill(nom);
  await page.getByLabel("Ville").fill("Fréjus");
  await page.getByLabel("Nombre de chambres").fill("42");
  await page.getByRole("radio", { name: "4 étoiles" }).click();
  await page.getByRole("button", { name: "Ajouter le prospect" }).click();
  await expect(page).toHaveURL(/\/prospects\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: nom })).toBeVisible();

  // Note avec Ctrl+Entrée
  await page.getByLabel("Contenu de l'échange").fill("Premier repérage sur Google Maps");
  await page.getByLabel("Contenu de l'échange").press("Control+Enter");
  await expect(page.getByText("Premier repérage sur Google Maps")).toBeVisible();

  // Contact
  await page.getByRole("button", { name: "Ajouter" }).first().click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Prénom").fill("Léa");
  await dlg.getByLabel("Nom", { exact: true }).fill("Durand");
  await dlg.getByLabel("Téléphone").fill("04 94 00 00 00");
  await dlg.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Léa Durand")).toBeVisible();
  await expect(page.getByRole("link", { name: "Appeler 04 94 00 00 00" }).first()).toHaveAttribute("href", "tel:0494000000");

  // Touche E → édition
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("e");
  await expect(page.getByRole("heading", { name: `Modifier ${nom}` })).toBeVisible();
  await page.getByLabel("Mise en place estimée (€)").fill("3000");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("3 000 €").first()).toBeVisible();

  // Passage à « Contacté » → séquence J+3/7/14
  await page.getByRole("button", { name: "→ Contacté" }).click();
  await expect(page.getByText("Séquence J+3")).toBeVisible();
  await expect(page.getByText("Séquence J+14")).toBeVisible();

  // Relance manuelle
  await page.getByRole("button", { name: "Relance", exact: true }).click();
  await page.getByLabel("Titre").fill("Envoyer la plaquette");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Envoyer la plaquette")).toBeVisible();

  // Perdu → raison
  await page.getByRole("button", { name: "Changer d'étape" }).click();
  await page.getByRole("menuitem", { name: "Perdu" }).click();
  await page.getByRole("radio", { name: "Timing" }).click();
  await page.getByRole("button", { name: "Marquer comme perdu" }).click();
  await expect(page.getByText("Perdu — Timing")).toBeVisible();

  // Suppression
  await page.getByRole("button", { name: "Plus d'actions" }).first().click();
  await page.getByRole("menuitem", { name: "Supprimer l'hôtel" }).click();
  await page.getByRole("button", { name: "Supprimer" }).click();
  await expect(page).toHaveURL(/\/prospects$/);
});

test("import CSV Google Maps avec doublons", async ({ page }) => {
  await page.goto("/prospects");
  await page.getByRole("button", { name: "Importer" }).click();
  await page.getByLabel("Fichier CSV").setInputFiles("tests/e2e/fixtures/google-maps.csv");
  await expect(page.getByText("3 hôtel(s) détecté(s)")).toBeVisible();
  await expect(page.getByText("1 doublon(s)")).toBeVisible();
  await page.getByRole("button", { name: "Importer 2 prospect(s)" }).click();
  await expect(page.getByText("2 prospect(s) importé(s)")).toBeVisible();
  await page.getByLabel("Rechercher un prospect").fill("Test Import");
  await expect(page.getByRole("row")).toHaveCount(3);
  await expect(page.getByRole("row", { name: /Alpha/ })).toContainText("Nice");
});
