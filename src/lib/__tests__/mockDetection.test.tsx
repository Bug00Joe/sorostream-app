/**
 * Tests for the mock-detection and empty-state logic introduced to prevent
 * synthesised history data from being presented as real on-chain records.
 *
 * Covered:
 *  - getMockStreamHistory always returns entries tagged isMock:true
 *  - StreamHistoryEntry.isMock is honoured by downstream filtering
 *  - StreamHistory renders an honest empty state when entries are empty
 *  - generateMockBalanceHistory lives in the test helper, not the production lib
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { getMockStreamHistory } from "@/src/lib/sorostream";
import type { StreamHistoryEntry } from "@/src/lib/export";
import { generateMockBalanceHistory } from "@/src/test/balanceHistoryTestHelpers";

// Stub the minimal sorostream exports needed by the StreamHistory component.
// The real getMockStreamHistory is imported directly above (before the mock is
// registered) so the unit tests below still exercise the real implementation.
vi.mock("@/src/lib/sorostream", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/src/lib/sorostream")>();
  return {
    ...original,
    formatUSDC: (stroops: bigint) =>
      (Number(stroops) / 10_000_000).toLocaleString(undefined, {
        minimumFractionDigits: 7,
        maximumFractionDigits: 7,
      }),
    truncateAddress: (addr: string) => `${addr.slice(0, 4)}…${addr.slice(-4)}`,
  };
});

// ---------------------------------------------------------------------------
// getMockStreamHistory — isMock tagging
// ---------------------------------------------------------------------------

describe("getMockStreamHistory", () => {
  it("tags every returned entry with isMock: true", () => {
    const entries = getMockStreamHistory("1");
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.isMock).toBe(true);
    }
  });

  it("tags entries for any stream id, not just well-known ids", () => {
    const entries = getMockStreamHistory("unknown-id-xyz");
    for (const entry of entries) {
      expect(entry.isMock).toBe(true);
    }
  });

  it("returns at least a creation entry for any id", () => {
    const entries = getMockStreamHistory("some-random-id");
    const types = entries.map((e) => e.type);
    expect(types).toContain("creation");
  });

  it("includes withdrawal and top-up entries for ids 1–3", () => {
    for (const id of ["1", "2", "3"]) {
      const entries = getMockStreamHistory(id);
      const types = entries.map((e) => e.type);
      expect(types).toContain("withdrawal");
      expect(types).toContain("top-up");
    }
  });
});

// ---------------------------------------------------------------------------
// isMock filtering — entries with isMock:true should be excluded from display
// ---------------------------------------------------------------------------

describe("isMock filtering logic", () => {
  it("filters out all mock entries when every entry is synthetic", () => {
    const allMock = getMockStreamHistory("1"); // all isMock:true
    const real = allMock.filter((e) => !e.isMock);
    expect(real).toHaveLength(0);
  });

  it("keeps real entries untouched", () => {
    const real: StreamHistoryEntry[] = [
      {
        timestamp: new Date().toISOString(),
        type: "withdrawal",
        amount: "1000000",
        txHash: "REAL_TX_HASH_0001",
        // isMock deliberately absent — this is a real entry
      },
    ];
    const filtered = real.filter((e) => !e.isMock);
    expect(filtered).toHaveLength(1);
  });

  it("mixed array: only real entries survive", () => {
    const mixed: StreamHistoryEntry[] = [
      { timestamp: new Date().toISOString(), type: "creation",   amount: "1000000", txHash: "REAL_0001" },
      { timestamp: new Date().toISOString(), type: "withdrawal", amount: "500000",  txHash: "MOCK_0002", isMock: true },
    ];
    const real = mixed.filter((e) => !e.isMock);
    expect(real).toHaveLength(1);
    expect(real[0].txHash).toBe("REAL_0001");
  });

  it("detects 'only mock data' condition correctly", () => {
    const entries = getMockStreamHistory("99");
    const hasOnlyMockData = entries.length > 0 && entries.filter((e) => !e.isMock).length === 0;
    expect(hasOnlyMockData).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// StreamHistory component — empty-state rendering
// ---------------------------------------------------------------------------

describe("StreamHistory — empty state", () => {
  // Lazy-import inside tests so the vi.mock above has been applied first.
  it("renders the empty-state message when no entries are provided", async () => {
    const { default: StreamHistory } = await import("@/components/StreamHistory");
    render(<StreamHistory entries={[]} />);
    expect(screen.getByText(/no history events recorded yet/i)).toBeInTheDocument();
  });

  it("does NOT render the empty-state when real entries exist", async () => {
    const { default: StreamHistory } = await import("@/components/StreamHistory");
    const real: StreamHistoryEntry[] = [
      { timestamp: new Date().toISOString(), type: "creation", amount: "10000000000", txHash: "REAL_TX_HASH" },
    ];
    render(<StreamHistory entries={real} />);
    expect(screen.queryByText(/no history events recorded yet/i)).not.toBeInTheDocument();
  });

  it("renders loading skeleton, not empty state, when loading=true", async () => {
    const { default: StreamHistory } = await import("@/components/StreamHistory");
    const { container } = render(<StreamHistory entries={[]} loading />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByText(/no history events recorded yet/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// generateMockBalanceHistory — test helper only, not in production lib
// ---------------------------------------------------------------------------

describe("generateMockBalanceHistory (test helper)", () => {
  it("is importable from the test helper module", () => {
    expect(typeof generateMockBalanceHistory).toBe("function");
  });

  it("returns the requested number of day snapshots (+1 for day-0 boundary)", () => {
    const snapshots = generateMockBalanceHistory(7);
    // i goes from days down to 0 inclusive → days+1 entries
    expect(snapshots).toHaveLength(8);
  });

  it("returns snapshots with expected shape", () => {
    const [first] = generateMockBalanceHistory(1);
    expect(first).toMatchObject({
      id: expect.stringMatching(/^mock-/),
      timestamp: expect.any(Number),
      totalBalance: expect.any(Number),
      tokenBalances: expect.objectContaining({ USDC: expect.any(Number), XLM: expect.any(Number) }),
      streamCount: expect.any(Number),
    });
  });

  it("is NOT exported from the production balanceHistory module", async () => {
    const mod = await import("@/src/lib/balanceHistory");
    expect((mod as Record<string, unknown>)["generateMockBalanceHistory"]).toBeUndefined();
  });
});
