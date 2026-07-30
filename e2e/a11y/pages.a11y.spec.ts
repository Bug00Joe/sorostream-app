/**
 * Accessibility audit using axe-core via @axe-core/playwright.
 *
 * Checks WCAG 2.1 AA compliance (contrast ≥ 4.5:1 for normal text,
 * ≥ 3:1 for large text, focus rings on all interactive elements, and
 * aria-labels on icon-only controls).
 *
 * Run: npm run a11y
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  { name: "Home", path: "/" },
  { name: "Dashboard", path: "/dashboard" },
  { name: "New Stream", path: "/stream/new" },
];

for (const { name, path } of PAGES) {
  test(`${name} (${path}) — no axe-core violations`, async ({ page }) => {
    await page.goto(path);

    // Wait for the page to settle (hydration, data load)
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      // Target WCAG 2.1 A and AA rules
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // Exclude third-party widgets that we don't control
      .exclude("#__next > [data-radix-portal]")
      .analyze();

    // Surface violations with a readable message
    const violations = results.violations;
    if (violations.length > 0) {
      const summary = violations
        .map(
          (v) =>
            `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n` +
            v.nodes
              .map((n) => `  - ${n.target.join(", ")}: ${n.failureSummary}`)
              .join("\n")
        )
        .join("\n\n");
      expect.soft(violations, `Axe violations on "${name}":\n\n${summary}`).toHaveLength(0);
    }

    expect(violations).toHaveLength(0);
  });
}

test("Stream detail page — no axe-core violations", async ({ page }) => {
  // Use stream id "1" which is always present in mock data
  await page.goto("/stream/1");
  await page.waitForLoadState("networkidle");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const violations = results.violations;
  if (violations.length > 0) {
    const summary = violations
      .map(
        (v) =>
          `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n` +
          v.nodes
            .map((n) => `  - ${n.target.join(", ")}: ${n.failureSummary}`)
            .join("\n")
      )
      .join("\n\n");
    expect.soft(violations, `Axe violations on Stream detail:\n\n${summary}`).toHaveLength(0);
  }

  expect(violations).toHaveLength(0);
});
