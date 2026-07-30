import { expect, test } from "@playwright/test";

/**
 * E2E coverage for wallet disconnect/reconnect flows on the dashboard.
 *
 * The test uses a Freighter-shaped mock so we can switch the connected
 * address deterministically without depending on a browser extension.
 */

const WALLET_A = "GBAMBOEP23456789012345678901234567890ABCDEF";
const WALLET_B = "GDEFXYZ023456789012345678901234567890ABCDEF";
const WALLET_A_STREAMS = ["1", "2", "3", "4", "6", "7"];
const WALLET_B_STREAMS = ["2", "5", "8"];

async function installMockFreighter(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const win = window as Window & {
      freighter?: {
        getPublicKey: () => Promise<string>;
        signTransaction: (xdr: string) => Promise<string>;
      };
    };

    win.freighter = {
      async getPublicKey() {
        return localStorage.getItem("sorostream_mock_wallet_address") ?? "";
      },
      async signTransaction(xdr: string) {
        return xdr;
      },
    };
  });
}

async function setMockWallet(page: import("@playwright/test").Page, address: string) {
  await page.evaluate((nextAddress) => {
    localStorage.setItem("sorostream_wallet_connected", "true");
    localStorage.setItem("sorostream_wallet_type", "freighter");
    localStorage.setItem("sorostream_mock_wallet_address", nextAddress);
  }, address);
}

async function getVisibleStreamIds(page: import("@playwright/test").Page) {
  const texts = await page.locator('[role="listitem"]').allTextContents();
  return texts
    .map((text) => {
      const match = text.match(/Stream #(\d+)/);
      return match?.[1] ?? null;
    })
    .filter((id): id is string => id !== null);
}

test.describe("Wallet reconnect clears stale dashboard data", () => {
  test.beforeEach(async ({ page }) => {
    await installMockFreighter(page);
  });

  test("shows only wallet B streams after switching from wallet A", async ({ page }) => {
    await setMockWallet(page, WALLET_A);
    await page.goto("/dashboard");

    const streamList = page.getByTestId("stream-list");
    await expect(streamList).toBeVisible({ timeout: 5000 });

    const walletAIds = (await getVisibleStreamIds(page)).sort();
    expect(walletAIds).toEqual(WALLET_A_STREAMS);

    await page.getByRole("button", { name: /disconnect wallet/i }).click();
    await expect(page.getByText(/no streams yet/i)).toBeVisible();

    await setMockWallet(page, WALLET_B);
    await page.reload();

    await expect(streamList).toBeVisible({ timeout: 5000 });

    const walletBIds = (await getVisibleStreamIds(page)).sort();
    expect(walletBIds).toEqual(WALLET_B_STREAMS);
    for (const id of ["1", "3", "4", "6", "7"]) {
      expect(walletBIds).not.toContain(id);
    }
  });

  test("reconnecting wallet A restores wallet A streams", async ({ page }) => {
    await setMockWallet(page, WALLET_A);
    await page.goto("/dashboard");

    const streamList = page.getByTestId("stream-list");
    await expect(streamList).toBeVisible({ timeout: 5000 });
    expect((await getVisibleStreamIds(page)).sort()).toEqual(WALLET_A_STREAMS);

    await page.getByRole("button", { name: /disconnect wallet/i }).click();
    await expect(page.getByText(/no streams yet/i)).toBeVisible();

    await setMockWallet(page, WALLET_B);
    await page.reload();
    await expect(streamList).toBeVisible({ timeout: 5000 });
    expect((await getVisibleStreamIds(page)).sort()).toEqual(WALLET_B_STREAMS);

    await page.getByRole("button", { name: /disconnect wallet/i }).click();
    await expect(page.getByText(/no streams yet/i)).toBeVisible();

    await setMockWallet(page, WALLET_A);
    await page.reload();

    await expect(streamList).toBeVisible({ timeout: 5000 });
    expect((await getVisibleStreamIds(page)).sort()).toEqual(WALLET_A_STREAMS);
  });
});
