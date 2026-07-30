/**
 * Test-only helpers for balance history.
 *
 * This module must never be imported from production code.  It exists solely
 * to provide realistic-looking fixture data for unit tests and Storybook
 * stories.  Production code that needs balance history should read from the
 * real IndexedDB store via `balanceCache.ts`.
 */

import type { BalanceSnapshot } from "@/src/lib/balanceHistory";

/**
 * Generate an array of synthetic balance snapshots for use in tests and
 * Storybook stories. The returned snapshots carry no real on-chain provenance
 * and must not be rendered to users as actual history.
 */
export function generateMockBalanceHistory(days: number = 30): BalanceSnapshot[] {
  const snapshots: BalanceSnapshot[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * dayMs;
    const baseBalance = 10000 + Math.random() * 5000;
    const trend = (days - i) * 100; // upward trend

    snapshots.push({
      id: `mock-${timestamp}`,
      timestamp,
      totalBalance: Math.round(baseBalance + trend),
      tokenBalances: {
        USDC: Math.round((baseBalance + trend) * 0.7),
        XLM: Math.round((baseBalance + trend) * 0.3),
      },
      streamCount: Math.floor(3 + Math.random() * 5),
    });
  }

  return snapshots;
}
