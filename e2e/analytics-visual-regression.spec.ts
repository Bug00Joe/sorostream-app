import { test, expect } from "@playwright/test";

/**
 * Visual regression test for the VestingChart (stream analytics) in light & dark themes.
 *
 * The app uses an in-memory mock store with Date.now()-based timestamps,
 * so we freeze the clock to a fixed instant for reproducible baselines.
 *
 * Update baselines when the chart styling changes intentionally:
 *   npx playwright test e2e/analytics-visual-regression.spec.ts --update-snapshots
 */

const FIXED_NOW = new Date("2026-07-15T12:00:00Z").getTime();

test.describe("Analytics chart visual regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(FIXED_NOW);
  });

  test("vesting chart matches light theme baseline", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => {
      localStorage.setItem("theme", "light");
    });
    await page.goto("/stream/1");

    const chart = page.locator('section[aria-labelledby="vesting-chart-heading"]');
    await expect(chart).toBeVisible();

    await expect(chart).toHaveScreenshot("vesting-chart-light.png", {
      animations: "disabled",
    });
  });

  test("vesting chart matches dark theme baseline", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      localStorage.setItem("theme", "dark");
    });
    await page.goto("/stream/1");

    const chart = page.locator('section[aria-labelledby="vesting-chart-heading"]');
    await expect(chart).toBeVisible();

    await expect(chart).toHaveScreenshot("vesting-chart-dark.png", {
      animations: "disabled",
    });
  });
});
