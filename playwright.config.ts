import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

/**
 * Tests E2E. Nécessitent un compte de test :
 *   E2E_EMAIL=... E2E_PASSWORD=... npm run test:e2e
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], storageState: "tests/e2e/.auth/session.json" },
      dependencies: ["setup"],
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], storageState: "tests/e2e/.auth/session.json" },
      dependencies: ["setup"],
      testMatch: /mobile\.spec\.ts/,
    },
  ],
});
