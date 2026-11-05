import { rechargerDemo } from "./helpers";
import { expect, test } from "@playwright/test";

test.beforeAll(rechargerDemo);

test("dashboard : KPIs, relances, activité, saisonnalité", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: "Prospects actifs" })).toContainText("15");
  await expect(page.getByRole("link", { name: "MRR" })).toContainText("590");
  await expect(page.getByText("Taux de conversion").locator("..").locator("..")).toContainText("60");
  await expect(page.getByText(/en retard/).first()).toBeVisible();
  await expect(page.getByText("Les 6 derniers mois")).toBeVisible();
  await expect(page.getByText("Upsell").first()).toBeVisible();

  const compteur = page.getByTestId("activite-appels");
  const avant = Number((await compteur.innerText()).split("/")[0]);
  const reponse = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/dashboard"));
  await page.getByRole("button", { name: "+1 appel" }).click();
  await reponse;
  await expect(compteur).toContainText(`${avant + 1}`);
  await page.reload();
  await expect(page.getByTestId("activite-appels")).toContainText(`${avant + 1}`);

  // Marquer une relance comme faite
  const premiere = page.getByRole("button", { name: /Marquer « .* » comme fait/ }).first();
  const nom = await premiere.getAttribute("aria-label");
  await premiere.click();
  await expect(page.getByRole("button", { name: nom! })).toHaveCount(0);
});
