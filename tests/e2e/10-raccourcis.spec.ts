import { expect, test } from "@playwright/test";

test("raccourcis clavier", async ({ page }) => {
  await page.goto("/dashboard");
  await page.locator("h1").click();

  // G puis P / G puis L / G puis A / G puis C / G puis D
  for (const [touche, url, titre] of [["p", "/pipeline", "Pipeline"], ["l", "/prospects", "Prospects"], ["a", "/agenda", "Agenda"], ["c", "/clients", "Clients"], ["d", "/dashboard", "Bonjour"]]) {
    await page.keyboard.press("g");
    await page.keyboard.press(touche);
    await expect(page).toHaveURL(new RegExp(`${url}`));
    await expect(page.locator("h1")).toContainText(titre);
  }

  // ? → aide
  await page.keyboard.press("Shift+?");
  await expect(page.getByRole("heading", { name: "Raccourcis clavier" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // N → nouveau prospect
  await page.keyboard.press("n");
  await expect(page.getByRole("heading", { name: "Nouveau prospect" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // R → nouvelle relance
  await page.keyboard.press("r");
  await expect(page.getByRole("heading", { name: "Nouvelle relance" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Ctrl+K → palette, recherche d'un hôtel
  await page.keyboard.press("Control+k");
  await page.getByPlaceholder("Rechercher un hôtel, une page, une action…").fill("mimosa");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Villa Mimosa" })).toBeVisible();

  // / sur la liste → focus de la recherche
  await page.goto("/prospects");
  await page.locator("h1").click();
  await page.keyboard.press("/");
  await expect(page.getByLabel("Rechercher un prospect")).toBeFocused();
});

test("bouton flottant + note", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Ajouter" }).last().click();
  await page.getByRole("menuitem", { name: "Note" }).click();
  await page.getByRole("combobox", { name: "Hôtel de la note" }).click();
  await page.getByRole("option", { name: /Le Cap Bleu/ }).click();
  await page.getByLabel("Contenu de l'échange").fill("Note via le bouton flottant");
  await page.getByLabel("Contenu de l'échange").press("Control+Enter");
  await expect(page.getByText("Note ajoutée")).toBeVisible();
});
