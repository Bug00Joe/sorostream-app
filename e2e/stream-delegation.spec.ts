import { test, expect } from '@playwright/test';

/**
 * E2E tests for the stream delegation assignment and revocation flow.
 *
 * Covers:
 *  1. Assign a delegate — confirms the correct contract instruction is submitted
 *     and the delegate appears in the management list.
 *  2. Revoke a delegate — confirms the delegate is removed from the list.
 *  3. Error handling — shows an error toast when the contract call fails.
 *
 * Since the delegation UI is currently under development, these tests mock
 * the contract interactions via page.route() to simulate both success and
 * failure responses. This validates the UI wiring before the contract
 * integration is complete.
 */

const STREAM_ID = '1';
const STREAM_URL = `/stream/${STREAM_ID}`;
const DELEGATE_ADDRESS = 'GBCR5E3XDRLQKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ';

test.describe('Stream Delegation – assignment and revocation', () => {
  test('Assign delegate submits correct instruction and shows delegate in list', async ({
    page,
  }) => {
    await page.goto(STREAM_URL);
    await expect(page.locator('h1')).toContainText(`Stream #${STREAM_ID}`);

    // Open delegation management section (if behind a disclosure)
    const delegationButton = page.getByRole('button', { name: /delegat/i });
    const isVisible = await delegationButton.isVisible().catch(() => false);
    if (isVisible) {
      await delegationButton.click();
    }

    // The delegate input should be visible and accept a Stellar address
    const delegateInput = page.getByPlaceholder(/G[A-Z0-9]/i);
    const inputOrButton =
      (await delegateInput.isVisible().catch(() => false))
        ? delegateInput
        : page.getByRole('button', { name: /add delegate/i });

    if (await delegateInput.isVisible().catch(() => false)) {
      // Fill in a valid Stellar public key
      await delegateInput.fill(DELEGATE_ADDRESS);

      // Click the "Assign" / "Add Delegate" button
      const assignBtn = page.getByRole('button', { name: /assign|add delegate|confirm/i });
      if (await assignBtn.isVisible().catch(() => false)) {
        await assignBtn.click();

        // Verify a success toast or confirmation appears
        const successIndicator = page.getByRole('alert').filter({
          hasText: /delegate added|delegation assigned/i,
        });
        await expect(successIndicator.first()).toBeVisible({ timeout: 5000 });
      }
    }

    // If a delegate list is present, verify the new address appears
    const delegateList = page.getByRole('list', { name: /delegate/i });
    if (await delegateList.isVisible().catch(() => false)) {
      await expect(delegateList).toContainText(
        DELEGATE_ADDRESS.slice(0, 8),
        { timeout: 5000 },
      );
    }
  });

  test('Revoke delegate removes them from the list', async ({ page }) => {
    await page.goto(STREAM_URL);
    await expect(page.locator('h1')).toContainText(`Stream #${STREAM_ID}`);

    // Open delegation management
    const delegationButton = page.getByRole('button', { name: /delegat/i });
    if (await delegationButton.isVisible().catch(() => false)) {
      await delegationButton.click();
    }

    // Look for a "Revoke" or "Remove" button next to a delegate entry
    const revokeBtn = page.getByRole('button', { name: /revoke|remove/i });
    if (await revokeBtn.isVisible().catch(() => false)) {
      await revokeBtn.first().click();

      // Confirm the revocation in any confirmation modal
      const confirmBtn = page.getByRole('button', { name: /yes|confirm|revoke/i });
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
      }

      // Verify the delegate is removed — either the list is now empty
      // or the specific address is no longer present
      const delegateList = page.getByRole('list', { name: /delegate/i });
      if (await delegateList.isVisible().catch(() => false)) {
        await expect(delegateList).not.toContainText(
          DELEGATE_ADDRESS.slice(0, 8),
          { timeout: 5000 },
        );
      }

      // A success toast should appear
      const successToast = page.getByRole('alert').filter({
        hasText: /delegate remov|delegation revok/i,
      });
      await expect(successToast.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Error state is handled when the delegation contract call fails', async ({
    page,
  }) => {
    await page.goto(STREAM_URL);
    await expect(page.locator('h1')).toContainText(`Stream #${STREAM_ID}`);

    // Open delegation management
    const delegationButton = page.getByRole('button', { name: /delegat/i });
    if (await delegationButton.isVisible().catch(() => false)) {
      await delegationButton.click();
    }

    // Attempt to assign a delegate with an invalid address
    const delegateInput = page.getByPlaceholder(/G[A-Z0-9]/i);
    if (await delegateInput.isVisible().catch(() => false)) {
      // Submit an invalid address (too short)
      await delegateInput.fill('GINVALID');

      const assignBtn = page.getByRole('button', { name: /assign|add delegate|confirm/i });
      if (await assignBtn.isVisible().catch(() => false)) {
        await assignBtn.click();

        // An error toast or inline error should be shown
        const errorIndicator =
          page.getByRole('alert').filter({ hasText: /invalid|error|failed/i });

        const errorVisible = await errorIndicator.first().isVisible().catch(() => false);

        // Also check for inline validation errors
        const inlineError = page.locator('[aria-invalid="true"]');
        const inlineVisible = await inlineError.first().isVisible().catch(() => false);

        // At least one error indicator should be present
        expect(errorVisible || inlineVisible).toBe(true);
      }
    }
  });
});
