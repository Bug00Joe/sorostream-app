import path from 'path';
import { test, expect } from '@playwright/test';

/**
 * E2E tests for batch stream creation via CSV upload.
 *
 * Route: /stream/batch
 *
 * Fixture files (e2e/fixtures/):
 *   batch-streams-valid.csv          — 3 valid rows (USDC/XLM/USDC)
 *   batch-streams-invalid.csv        — 3 invalid rows (bad address, negative amount, zero duration)
 *   batch-streams-missing-columns.csv — missing required columns (headerError path)
 *
 * Acceptance criteria covered:
 *   ✓ Test uploads a valid CSV fixture file
 *   ✓ Preview table shows correct recipient, amount, and duration for each row
 *   ✓ Batch transaction submitted successfully (TransactionStepper reaches Done)
 *   ✓ 3 new streams visible in the dashboard after submission
 *   ✓ Invalid CSV shows validation errors per row
 *   ✓ CSV with missing required columns shows a file-level error
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Absolute path to a fixture CSV file. */
function fixture(name: string): string {
  return path.join(__dirname, 'fixtures', name);
}

// ---------------------------------------------------------------------------
// Happy path: valid CSV → preview → submit → dashboard
// ---------------------------------------------------------------------------

test.describe('CSV Batch Stream — happy path', () => {
  test('uploads valid CSV, shows correct preview rows, submits, and redirects to dashboard', async ({
    page,
  }) => {
    await page.goto('/stream/batch');

    // ── 1. Verify page heading ──────────────────────────────────────────
    await expect(page.locator('h1')).toContainText('Batch Stream Creation');

    // ── 2. Upload the valid CSV ─────────────────────────────────────────
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(fixture('batch-streams-valid.csv'));

    // ── 3. Wait for the preview table to appear ─────────────────────────
    const previewTable = page.getByLabel('Batch stream preview table');
    await expect(previewTable).toBeVisible({ timeout: 5000 });

    // ── 4. Verify the row count summary ─────────────────────────────────
    await expect(page.getByText(/3 rows? parsed/i)).toBeVisible();
    await expect(page.getByText(/3 valid/i)).toBeVisible();

    // ── 5. Verify preview table content for each row ────────────────────
    //
    // Row 1: GBKL...KLHA, 100, 1d, USDC
    const row1 = page.locator('tbody tr').nth(0);
    await expect(row1.locator('td').nth(1)).toContainText('GBKL');   // recipient truncated
    await expect(row1.locator('td').nth(2)).toContainText('100');    // amount
    await expect(row1.locator('td').nth(3)).toContainText('1d');     // duration
    await expect(row1.locator('td').nth(4)).toContainText('USDC');   // token
    await expect(row1.locator('td').nth(5)).toContainText('Valid');  // status badge

    // Row 2: GDQN...TL3, 50, 1h, XLM
    const row2 = page.locator('tbody tr').nth(1);
    await expect(row2.locator('td').nth(1)).toContainText('GDQN');
    await expect(row2.locator('td').nth(2)).toContainText('50');
    await expect(row2.locator('td').nth(3)).toContainText('1h');
    await expect(row2.locator('td').nth(4)).toContainText('XLM');
    await expect(row2.locator('td').nth(5)).toContainText('Valid');

    // Row 3: GCEZ...RV2, 200, 7d, USDC
    const row3 = page.locator('tbody tr').nth(2);
    await expect(row3.locator('td').nth(1)).toContainText('GCEZ');
    await expect(row3.locator('td').nth(2)).toContainText('200');
    await expect(row3.locator('td').nth(3)).toContainText('7d');
    await expect(row3.locator('td').nth(4)).toContainText('USDC');
    await expect(row3.locator('td').nth(5)).toContainText('Valid');

    // ── 6. Submit the batch ──────────────────────────────────────────────
    const submitBtn = page.getByRole('button', { name: /create 3 streams/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // ── 7. Transaction stepper appears and progresses ───────────────────
    await expect(
      page.getByLabel('Batch transaction in progress'),
    ).toBeVisible({ timeout: 5000 });

    // Wait for "Done" state — stepper completion is indicated by the success text
    await expect(page.getByText(/3 streams? created/i)).toBeVisible({ timeout: 15000 });

    // ── 8. Redirect to dashboard ─────────────────────────────────────────
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // ── 9. Dashboard shows at least 3 stream cards ───────────────────────
    // Wait for skeleton to disappear
    await page.waitForTimeout(500);
    const streamArticles = page.locator('[role="article"]');
    const count = await streamArticles.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Invalid CSV: every row has a validation error
// ---------------------------------------------------------------------------

test.describe('CSV Batch Stream — per-row validation errors', () => {
  test('shows Invalid badge and error text for every invalid row', async ({ page }) => {
    await page.goto('/stream/batch');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(fixture('batch-streams-invalid.csv'));

    const previewTable = page.getByLabel('Batch stream preview table');
    await expect(previewTable).toBeVisible({ timeout: 5000 });

    // Row count: 3 rows parsed, 0 valid, 3 invalid
    await expect(page.getByText(/3 rows? parsed/i)).toBeVisible();
    await expect(page.getByText(/3 invalid/i)).toBeVisible();

    // All three rows should show "Invalid" status badge
    const invalidBadges = page.getByText('Invalid');
    await expect(invalidBadges.first()).toBeVisible();
    expect(await invalidBadges.count()).toBe(3);

    // Row 1: bad recipient address error
    const row1 = page.locator('tbody tr').nth(0);
    await expect(row1).toContainText(/valid Stellar/i);

    // Row 2: negative amount error
    const row2 = page.locator('tbody tr').nth(1);
    await expect(row2).toContainText(/positive number/i);

    // Row 3: zero duration error
    const row3 = page.locator('tbody tr').nth(2);
    await expect(row3).toContainText(/positive integer/i);

    // Submit button should NOT be present (no valid rows)
    const submitBtn = page.getByRole('button', { name: /create/i }).filter({ hasNotText: /reset/i });
    await expect(submitBtn).not.toBeVisible();
  });

  test('shows Invalid badge for the invalid row while valid rows show Valid badge (mixed file)', async ({
    page,
  }) => {
    await page.goto('/stream/batch');

    // Build a CSV with 2 valid rows and 1 invalid row on-the-fly using the
    // setInputFiles bytes API so we don't need a third fixture file.
    const csvContent = [
      'recipient,amount,duration_seconds,token',
      'GBKLYONWFBQFBFZK6HMTXQZJNBKQEXZ3PJOVXNKZXVTV4FQXVMKLKHA,100,86400,USDC',
      'not-a-key,50,3600,XLM',                         // invalid
      'GDQNY3PBOJOKYZSRMK2S7LHHGWZIUISD4QORETLMXEWXBI7KFZZMKTL3,200,604800,USDC',
    ].join('\n');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'mixed.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await expect(page.getByLabel('Batch stream preview table')).toBeVisible({ timeout: 5000 });

    // Row count summary
    await expect(page.getByText(/3 rows? parsed/i)).toBeVisible();
    await expect(page.getByText(/2 valid/i)).toBeVisible();
    await expect(page.getByText(/1 invalid/i)).toBeVisible();

    // Row 2 (index 1) is the invalid one
    const row2 = page.locator('tbody tr').nth(1);
    await expect(row2.locator('td').nth(5)).toContainText('Invalid');

    // The create button should show 2 streams (only valid rows)
    await expect(
      page.getByRole('button', { name: /create 2 streams/i }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Invalid CSV: missing required columns → file-level error
// ---------------------------------------------------------------------------

test.describe('CSV Batch Stream — file-level validation errors', () => {
  test('shows file-level error when required columns are missing', async ({ page }) => {
    await page.goto('/stream/batch');

    await page.locator('input[type="file"]').setInputFiles(
      fixture('batch-streams-missing-columns.csv'),
    );

    // File-level error element with role="alert"
    const errorMsg = page.locator('#csv-file-error');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
    await expect(errorMsg).toContainText(/missing required columns/i);
    await expect(errorMsg).toContainText(/duration_seconds/i);
    await expect(errorMsg).toContainText(/token/i);

    // Preview table should NOT appear
    await expect(page.getByLabel('Batch stream preview table')).not.toBeVisible();
  });

  test('shows error when a non-CSV file is uploaded', async ({ page }) => {
    await page.goto('/stream/batch');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'streams.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('this is not a csv'),
    });

    const errorMsg = page.locator('#csv-file-error');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
    await expect(errorMsg).toContainText(/\.csv/i);
  });

  test('Reset button clears the file and preview', async ({ page }) => {
    await page.goto('/stream/batch');

    await page.locator('input[type="file"]').setInputFiles(
      fixture('batch-streams-valid.csv'),
    );

    await expect(page.getByLabel('Batch stream preview table')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /reset/i }).click();

    // Preview table disappears after reset
    await expect(page.getByLabel('Batch stream preview table')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Navigation smoke test
// ---------------------------------------------------------------------------

test.describe('CSV Batch Stream — navigation', () => {
  test('page is reachable and shows the heading', async ({ page }) => {
    await page.goto('/stream/batch');
    await expect(page.locator('h1')).toContainText('Batch Stream Creation');
  });

  test('required columns hint is visible in the page description', async ({ page }) => {
    await page.goto('/stream/batch');
    await expect(
      page.getByText(/recipient, amount, duration_seconds, token/i),
    ).toBeVisible();
  });
});
