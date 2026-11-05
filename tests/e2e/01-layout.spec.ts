import { expect, test } from "@playwright/test";

const PAGES = [
  ["Dashboard", "/dashboard"],
  ["Pipeline", "/pipeline"],
  ["Prospects", "/prospects"],
  ["Agenda", "/agenda"],
  ["Propositions", "/propositions"],
  ["Clients", "/clients"],
  ["Bibliothèque", "/bibliotheque"],
  ["Objectifs", "/objectifs"],
  ["Paramètres", "/parametres"],
] as const;

test("la sidebar mène à toutes les pages", async ({ page }) => {
  await page.goto("/dashboard");
  const nav = page.locator("aside nav");
  for (const [titre, href] of PAGES) {
    await nav.getByRole("link", { name: titre }).click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("bascule en mode sombre", async ({ page }) => {
  await page.goto("/dashboard");
  await page.locator("aside").getByRole("button", { name: "Changer de thème" }).click();
  await page.getByRole("menuitem", { name: "Sombre" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.locator("aside").getByRole("button", { name: "Changer de thème" }).click();
  await page.getByRole("menuitem", { name: "Clair" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("un utilisateur connecté est renvoyé de /connexion vers le dashboard", async ({ page }) => {
  await page.goto("/connexion");
  await expect(page).toHaveURL(/\/dashboard/);
});
