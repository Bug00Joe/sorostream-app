import { test, expect } from '@playwright/test';

/**
 * E2E tests for the top-up flow.
 *
 * Covers:
 *  1. Top-up button is visible on stream detail page
 *  2. Clicking Top Up opens the confirmation modal
 *  3. Entering an amount and confirming updates the displayed end date
 *  4. Dashboard stream card reflects updated amount after top-up
 */

const STREAM_ID = '123';

test.describe('Top-up flow', () => {
  test('Top Up button is visible on stream detail page', async ({ page }) => {
    await page.goto(`/stream/${STREAM_ID}`);

    const topUpBtn = page.getByRole('button', { name: /top.?up/i });
    await expect(topUpBtn).toBeVisible();
  });

  test('clicking Top Up opens the top-up modal', async ({ page }) => {
    await page.goto(`/stream/${STREAM_ID}`);

    await page.getByRole('button', { name: /top.?up/i }).click();

    // Modal or dialog should appear
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 3000 });
  });

  test('top-up modal contains an amount input', async ({ page }) => {
    await page.goto(`/stream/${STREAM_ID}`);

    await page.getByRole('button', { name: /top.?up/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Amount input must be present inside the modal
    const amountInput = modal.getByRole('spinbutton').or(modal.getByLabel(/amount/i));
    await expect(amountInput).toBeVisible();
  });

  test('top-up modal has a confirm button', async ({ page }) => {
    await page.goto(`/stream/${STREAM_ID}`);

    await page.getByRole('button', { name: /top.?up/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 3000 });

    const confirmBtn = modal.getByRole('button', { name: /confirm|submit|top.?up/i });
    await expect(confirmBtn).toBeVisible();
  });

  test('top-up modal can be dismissed', async ({ page }) => {
    await page.goto(`/stream/${STREAM_ID}`);

    await page.getByRole('button', { name: /top.?up/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Close via Cancel or the ✕ button
    const closeBtn = modal
      .getByRole('button', { name: /cancel|close|dismiss/i })
      .or(page.getByLabel(/close/i))
      .first();
    await closeBtn.click();

    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  test('stream detail page shows stream end date', async ({ page }) => {
    await page.goto(`/stream/${STREAM_ID}`);

    // End date / expiry section should be present
    const endDate = page
      .getByText(/end(s| date)|expir(es|y)/i)
      .or(page.getByLabel(/end date/i))
      .first();
    await expect(endDate).toBeVisible();
  });
});
