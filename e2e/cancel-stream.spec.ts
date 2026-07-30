import { test, expect } from '@playwright/test';

/**
 * E2E tests for the stream cancel flow.
 *
 * Covers:
 *  1. Cancel button opens the confirmation modal
 *  2. "Go Back" (dismiss) closes the modal without changing stream status
 *  3. "Yes, Cancel" confirms cancellation, stream transitions to Cancelled
 *     on the detail page and on the dashboard
 *
 * Uses stream #1 from the Soroban sandbox mock data — it is always Active.
 */

const STREAM_ID = '1';
const STREAM_URL = `/stream/${STREAM_ID}`;

test.describe('Cancel Stream – confirmation modal', () => {
  test('Cancel button opens the confirmation modal', async ({ page }) => {
    await page.goto(STREAM_URL);

    // Wait for stream detail to load (heading visible)
    await expect(page.locator('h1')).toContainText(`Stream #${STREAM_ID}`);

    // Click Cancel — should open the modal
    await page.getByRole('button', { name: /^cancel$/i }).click();

    // Modal should be visible with its title
    const dialog = page.getByRole('dialog', { name: /cancel stream/i });
    await expect(dialog).toBeVisible();

    // Modal should contain the irreversibility warning
    await expect(dialog).toContainText(/irreversible/i);

    // Both action buttons should be present
    await expect(dialog.getByRole('button', { name: /go back/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /yes, cancel/i })).toBeVisible();
  });

  test('Dismiss (Go Back) closes modal with no state change', async ({ page }) => {
    await page.goto(STREAM_URL);
    await expect(page.locator('h1')).toContainText(`Stream #${STREAM_ID}`);

    // Verify stream is Active before doing anything
    const statusBadge = page.getByTestId('stream-status');
    await expect(statusBadge).toHaveText('Active');

    // Open the cancel modal
    await page.getByRole('button', { name: /^cancel$/i }).click();
    const dialog = page.getByRole('dialog', { name: /cancel stream/i });
    await expect(dialog).toBeVisible();

    // Click Go Back
    await dialog.getByRole('button', { name: /go back/i }).click();

    // Modal should be gone
    await expect(dialog).not.toBeVisible();

    // Stream status must still be Active
    await expect(statusBadge).toHaveText('Active');

    // Cancel button should still be available (no undo state, no grace period)
    await expect(page.getByRole('button', { name: /^cancel$/i })).toBeVisible();
  });

  test('Confirming cancel transitions stream to Cancelled on detail page', async ({ page }) => {
    await page.goto(STREAM_URL);
    await expect(page.locator('h1')).toContainText(`Stream #${STREAM_ID}`);

    // Verify Active before cancel
    const statusBadge = page.getByTestId('stream-status');
    await expect(statusBadge).toHaveText('Active');

    // Open and confirm the cancel modal
    await page.getByRole('button', { name: /^cancel$/i }).click();
    const dialog = page.getByRole('dialog', { name: /cancel stream/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /yes, cancel/i }).click();

    // Modal should close immediately
    await expect(dialog).not.toBeVisible();

    // Grace period countdown toast should appear
    const countdownToast = page.getByRole('alert').filter({ hasText: /Cancelling stream/i });
    await expect(countdownToast).toBeVisible({ timeout: 3000 });

    // Wait for the 5-second grace period to expire and the cancel to be submitted
    // (grace period is CANCEL_GRACE_SECONDS = 5)
    await expect(
      page.getByRole('alert').filter({ hasText: /Stream cancelled/i }),
    ).toBeVisible({ timeout: 10000 });

    // Status badge on detail page should now show Cancelled
    await expect(statusBadge).toHaveText('Cancelled', { timeout: 5000 });
  });

  test('Confirming cancel transitions stream to Cancelled on dashboard', async ({ page }) => {
    await page.goto(STREAM_URL);
    await expect(page.locator('h1')).toContainText(`Stream #${STREAM_ID}`);

    // Open and confirm the cancel modal
    await page.getByRole('button', { name: /^cancel$/i }).click();
    const dialog = page.getByRole('dialog', { name: /cancel stream/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /yes, cancel/i }).click();

    // Wait for the cancellation success toast
    await expect(
      page.getByRole('alert').filter({ hasText: /Stream cancelled/i }),
    ).toBeVisible({ timeout: 10000 });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Find the stream card for stream #1 — its status badge should say Cancelled
    const streamCard = page.getByRole('article', { name: `Stream ${STREAM_ID}` });
    await expect(streamCard).toBeVisible({ timeout: 5000 });
    await expect(streamCard.getByLabel(/status/i)).toHaveText('Cancelled');
  });

  test('Undo during grace period keeps stream Active', async ({ page }) => {
    await page.goto(STREAM_URL);
    await expect(page.locator('h1')).toContainText(`Stream #${STREAM_ID}`);

    const statusBadge = page.getByTestId('stream-status');
    await expect(statusBadge).toHaveText('Active');

    // Open and confirm the cancel modal
    await page.getByRole('button', { name: /^cancel$/i }).click();
    const dialog = page.getByRole('dialog', { name: /cancel stream/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /yes, cancel/i }).click();

    // Wait for countdown toast to appear
    const countdownToast = page.getByRole('alert').filter({ hasText: /Cancelling stream/i });
    await expect(countdownToast).toBeVisible({ timeout: 3000 });

    // Click Undo in the toast before the 5 seconds expire
    await page.getByRole('button', { name: /undo/i }).first().click();

    // "Cancellation undone" info toast should appear
    await expect(
      page.getByRole('alert').filter({ hasText: /Cancellation undone/i }),
    ).toBeVisible({ timeout: 3000 });

    // Stream status must remain Active
    await expect(statusBadge).toHaveText('Active');
  });
});
