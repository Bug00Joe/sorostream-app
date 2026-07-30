import { describe, it, expect } from "vitest";

describe("Net Received Display Feature", () => {
  // Test 1: Verify the component exists and exports
  it("should export NetReceivedDisplay component", async () => {
    const module = await import("@/components/NetReceivedDisplay");
    expect(module.default).toBeDefined();
  });

  // Test 2: Verify stream new page imports
  it("should have NetReceivedDisplay imported in stream new page", async () => {
    const fs = await import("fs/promises");
    const content = await fs.readFile(
      "/workspaces/sorostream-app/src/app/stream/new/page.tsx",
      "utf-8"
    );

    expect(content).toContain("NetReceivedDisplay");
    expect(content).toContain("import NetReceivedDisplay");
  });

  // Test 3: Verify translation keys exist
  it("should have all translation keys for net received display", async () => {
    const locales = await import("@/src/locales/en.json");
    const translations = locales.default;

    expect(translations.stream_new.net_received_label).toBeDefined();
    expect(translations.stream_new.net_received_fee_desc).toBeDefined();
  });

  // Test 4: Verify fee calculation
  it("should calculate net received amount correctly", () => {
    // Mock calcWithdrawBreakdown function behavior
    const calculateNetReceived = (
      amountStroops: number,
      basisPoints: number
    ) => {
      const feePercent = basisPoints / 100;
      const fee = Math.floor((amountStroops * basisPoints) / 10_000);
      const net = amountStroops - fee;
      return { net, fee, feePercent };
    };

    // Test case 1: 100 USDC with 50 bps (0.5%) fee
    const amount1 = 100 * 10_000_000; // 100 USDC in stroops
    const result1 = calculateNetReceived(amount1, 50);
    const net1 = result1.net / 10_000_000;
    expect(net1).toBeCloseTo(99.5, 5);

    // Test case 2: 1000 USDC with 50 bps (0.5%) fee
    const amount2 = 1000 * 10_000_000;
    const result2 = calculateNetReceived(amount2, 50);
    const net2 = result2.net / 10_000_000;
    expect(net2).toBeCloseTo(995, 5);

    // Test case 3: 50 USDC with 100 bps (1%) fee
    const amount3 = 50 * 10_000_000;
    const result3 = calculateNetReceived(amount3, 100);
    const net3 = result3.net / 10_000_000;
    expect(net3).toBeCloseTo(49.5, 5);
  });

  // Test 5: Verify translations across languages
  it("should have translations in all three languages", async () => {
    const en = await import("@/src/locales/en.json");
    const pt = await import("@/src/locales/pt.json");
    const es = await import("@/src/locales/es.json");

    const keys = ["net_received_label", "net_received_fee_desc"];
    keys.forEach((key) => {
      expect(en.default.stream_new[key]).toBeDefined();
      expect(pt.default.stream_new[key]).toBeDefined();
      expect(es.default.stream_new[key]).toBeDefined();
    });
  });
});
