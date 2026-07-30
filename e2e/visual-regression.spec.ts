import { test, expect } from "@playwright/test";

/**
 * Visual regression test for the create-stream form in dark mode.
 *
 * Update the baseline when the form's styling changes intentionally:
 *   npx playwright test e2e/visual-regression.spec.ts --update-snapshots
 */

test.describe("Create Stream visual regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      localStorage.setItem("theme", "dark");
    });
  });

  test("matches the dark-mode baseline", async ({ page }) => {
    await page.goto("/stream/new");

    const form = page.locator("main");
    await expect(form).toBeVisible();

    await expect(form).toHaveScreenshot("create-stream-dark.png", {
      animations: "disabled",
    });
  });
});
