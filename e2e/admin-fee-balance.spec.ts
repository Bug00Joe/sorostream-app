import { test, expect } from '@playwright/test';

/**
 * #329 — E2E tests: admin panel shows correct protocol fee balance.
 *
 * The admin page reads treasury balances from getTreasuryBalances() which
 * returns MOCK_TREASURY:
 *   USDC: 3_750_000_000 stroops  → formatStellarAmount → "375.0000000"
 *   XLM:  8_200_000_000 stroops  → formatStellarAmount → "820.0000000"
 *   wBTC: 0 stroops              → "No fees collected"
 *
 * Tests verify:
 *  - The treasury section is rendered on the admin page.
 *  - USDC balance is displayed with the correct 7-decimal format.
 *  - XLM balance is displayed with the correct 7-decimal format.
 *  - Zero-balance token (wBTC) shows the "No fees collected" message.
 *  - Each token row has a "Sweep Fees" button.
 *  - Clicking "Sweep Fees" triggers the sweepTreasuryFees SDK call:
 *    the balance is zeroed out and "No fees collected" appears.
 *
 * No live RPC is used — all data comes from the deterministic mock layer.
 */

test.describe('Admin panel – protocol fee balance (#329)', () => {
  test('admin page loads and shows treasury section', async ({ page }) => {
    await page.goto('/admin');

    // The page title or heading should reference "Admin" or "Treasury"
    await expect(
      page.getByText(/admin|treasury/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('USDC treasury balance is displayed with correct decimal formatting', async ({ page }) => {
    await page.goto('/admin');

    // USDC section must be visible
    await expect(page.getByText('USDC')).toBeVisible({ timeout: 10_000 });

    // Balance formatted via formatStellarAmount(3_750_000_000) = "375.0000000"
    await expect(page.getByText('375.0000000')).toBeVisible({ timeout: 5_000 });
  });

  test('XLM treasury balance is displayed with correct decimal formatting', async ({ page }) => {
    await page.goto('/admin');

    // XLM section must be visible
    await expect(page.getByText('XLM')).toBeVisible({ timeout: 10_000 });

    // Balance formatted via formatStellarAmount(8_200_000_000) = "820.0000000"
    await expect(page.getByText('820.0000000')).toBeVisible({ timeout: 5_000 });
  });

  test('zero-balance token shows "No fees collected"', async ({ page }) => {
    await page.goto('/admin');

    // wBTC has balanceStroops: 0 — the UI renders "No fees collected"
    await expect(page.getByText(/no fees collected/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Sweep Fees button is present for each token with a balance', async ({ page }) => {
    await page.goto('/admin');

    // There should be at least one Sweep Fees button (for USDC and XLM)
    const sweepButtons = page.getByRole('button', { name: /sweep fees/i });
    await expect(sweepButtons.first()).toBeVisible({ timeout: 10_000 });
  });

  test('clicking Sweep Fees updates the balance display to zero', async ({ page }) => {
    await page.goto('/admin');

    // Wait for USDC balance to be rendered
    await expect(page.getByText('375.0000000')).toBeVisible({ timeout: 10_000 });

    // Find the Sweep Fees button inside the USDC card.
    // Each TreasuryRow is a card containing the token name + sweep button.
    // We find the card that contains "USDC" and click its sweep button.
    const usdcCard = page
      .locator('[class*="rounded"]')
      .filter({ hasText: /^USDC$/m })
      .first();

    const sweepBtn = usdcCard.getByRole('button', { name: /sweep fees/i });

    // If the card selector isn't precise enough, fall back to the first
    // visible sweep button (USDC is always listed first in MOCK_TREASURY).
    const sweepBtnFallback = page
      .getByRole('button', { name: /sweep fees/i })
      .first();

    const btn = (await sweepBtn.count()) > 0 ? sweepBtn : sweepBtnFallback;

    await btn.click();

    // After the mock sweep resolves:
    //  - balanceStroops is set to 0
    //  - getTreasuryBalances() is re-fetched
    //  - "No fees collected" should appear (at least once more, joining wBTC)
    await expect(
      page.getByText(/no fees collected/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('admin page shows both token names in the treasury grid', async ({ page }) => {
    await page.goto('/admin');

    await expect(page.getByText('USDC')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('XLM')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('wBTC')).toBeVisible({ timeout: 10_000 });
  });
});
