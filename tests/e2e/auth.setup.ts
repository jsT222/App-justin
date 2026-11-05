import { expect, test as setup } from "@playwright/test";

setup("connexion du compte de test", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const motDePasse = process.env.E2E_PASSWORD;
  if (!email || !motDePasse) throw new Error("Définir E2E_EMAIL et E2E_PASSWORD");

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/connexion/);

  // Mauvais mot de passe
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByText("Email ou mot de passe incorrect.")).toBeVisible();

  // Bon mot de passe
  await page.getByLabel("Mot de passe").fill(motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: "tests/e2e/.auth/session.json" });
});
