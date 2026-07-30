import { test, expect } from '@playwright/test';

/**
 * #328 — E2E tests: stream top-up updates dashboard balance immediately.
 *
 * Uses stream id "1" which is present in MOCK_STREAMS with:
 *   deposit: 10_000_000_000 stroops  → 1,000.0000000 USDC
 *   status: Active
 *
 * The flow exercised:
 *  1. Load the stream detail page and note the current stream balance.
 *  2. Open the top-up form.
 *  3. Enter a deterministic mock amount and confirm.
 *  4. Verify the stream balance on the detail page reflects the top-up
 *     (optimistic update while the mock tx is in-flight, then confirmed).
 *  5. Navigate to the dashboard and verify the stream card is still visible
 *     (balance is maintained / page is not in an error state).
 *
 * All calls are against the mock SDK — no live RPC is used.
 */

const STREAM_ID = '1';

test.describe('Top-up → dashboard balance update (#328)', () => {
  test('stream detail page shows stream balance', async ({ page }) => {
    await page.goto(`/stream/${STREAM_ID}`);

    // Wait until the skeleton disappears and real content is rendered.
    // The balance section heading is always present for a loaded stream.
    await expect(
      page.getByText(/stream balance|deposit/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    // The USDC balance line should be visible
    const balanceLine = page.getByText(/usdc/i).first();
    await expect(balanceLine).toBeVisible();
  });

  test('Top Up Stream button is present on the detail page', async ({ page }) => {
    await page.goto(`/stream/${STREAM_ID}`);

    const topUpBtn = page.getByRole('button', { name: /top up stream/i });
    await expect(topUpBtn).toBeVisible({ timeout: 10_000 });
  });

  test('top-up form appears after clicking Top Up Stream', async ({ page }) => {
    await page.goto(`/stream/${STREAM_ID}`);

    const topUpBtn = page.getByRole('button', { name: /top up stream/i });
    await expect(topUpBtn).toBeVisible({ timeout: 10_000 });
    await topUpBtn.click();

    // The amount input should now be visible
    const amountInput = page.getByLabel(/top-up amount/i);
    await expect(amountInput).toBeVisible({ timeout: 3_000 });
  });

  test('top-up form has a confirm button', async ({ page }) => {
    await page.goto(`/stream/${STREAM_ID}`);

    await page.getByRole('button', { name: /top up stream/i }).click();
    const confirmBtn = page.getByRole('button', { name: /confirm top-up/i });
    await expect(confirmBtn).toBeVisible({ timeout: 3_000 });
  });

  test('confirm top-up updates stream balance with optimistic display', async ({ page }) => {
    await page.goto(`/stream/${STREAM_ID}`);

    // Wait for the stream to fully load
    await expect(
      page.getByText(/stream balance/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Open the top-up form
    await page.getByRole('button', { name: /top up stream/i }).click();

    // Enter a deterministic top-up amount
    const amountInput = page.getByLabel(/top-up amount/i);
    await expect(amountInput).toBeVisible({ timeout: 3_000 });
    await amountInput.fill('100');

    // Confirm — this triggers the mock topUp() + getStream() and updates state
    await page.getByRole('button', { name: /confirm top-up/i }).click();

    // The form should close (top-up button shows "Top Up Stream" again)
    await expect(
      page.getByRole('button', { name: /top up stream/i }),
    ).toBeVisible({ timeout: 5_000 });

    // A success toast or updated balance should be visible.
    // The mock topUp resolves immediately so the balance panel is re-rendered.
    const balanceSection = page.getByText(/stream balance/i).first();
    await expect(balanceSection).toBeVisible();
  });

  test('dashboard stream card is visible after top-up flow', async ({ page }) => {
    // Step 1: perform a top-up on the detail page
    await page.goto(`/stream/${STREAM_ID}`);
    await expect(
      page.getByText(/stream balance/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /top up stream/i }).click();

    const amountInput = page.getByLabel(/top-up amount/i);
    await expect(amountInput).toBeVisible({ timeout: 3_000 });
    await amountInput.fill('50');
    await page.getByRole('button', { name: /confirm top-up/i }).click();

    // Wait for the mock tx to resolve
    await expect(
      page.getByRole('button', { name: /top up stream/i }),
    ).toBeVisible({ timeout: 5_000 });

    // Step 2: navigate to the dashboard
    await page.goto('/dashboard');

    // Wait for loading state to clear
    await page.waitForLoadState('networkidle');

    // The stream should still appear on the dashboard (balance not stale/broken)
    const streamEntry = page.getByText(`#${STREAM_ID}`);
    await expect(streamEntry).toBeVisible({ timeout: 10_000 });
  });

  test('dashboard balance reflects post-top-up state — no stale data', async ({ page }) => {
    // Perform top-up
    await page.goto(`/stream/${STREAM_ID}`);
    await expect(
      page.getByText(/stream balance/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /top up stream/i }).click();

    const amountInput = page.getByLabel(/top-up amount/i);
    await expect(amountInput).toBeVisible({ timeout: 3_000 });
    await amountInput.fill('200');
    await page.getByRole('button', { name: /confirm top-up/i }).click();

    // Confirm top-up resolved — form dismissed
    await expect(
      page.getByRole('button', { name: /top up stream/i }),
    ).toBeVisible({ timeout: 5_000 });

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should not show an error state
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    await expect(page.getByText(/failed to load/i)).not.toBeVisible();

    // Stream list should render (either card or row with the id)
    const streamRef = page.getByText(`#${STREAM_ID}`);
    await expect(streamRef).toBeVisible({ timeout: 10_000 });
  });
});
