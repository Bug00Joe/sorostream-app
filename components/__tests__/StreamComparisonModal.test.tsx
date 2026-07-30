import { describe, it, expect } from "vitest";

describe("Stream Comparison Feature", () => {
  // Test 1: Verify the component exists and exports
  it("should export StreamComparisonModal component", async () => {
    const module = await import("@/components/StreamComparisonModal");
    expect(module.default).toBeDefined();
  });

  // Test 2: Verify stream detail imports are correct
  it("should have correct imports in stream detail page", async () => {
    // This is a simple validation that the file exists
    const streamDetailPath = "/workspaces/sorostream-app/src/app/stream/[id]/page.tsx";
    const fs = await import("fs/promises");
    const content = await fs.readFile(streamDetailPath, "utf-8");
    
    expect(content).toContain("StreamComparisonModal");
    expect(content).toContain("getStreamsForWallet");
    expect(content).toContain("showComparisonModal");
    expect(content).toContain("allStreams");
  });

  // Test 3: Verify translation keys exist
  it("should have all translation keys for stream comparison", async () => {
    const locales = await import("@/src/locales/en.json");
    const translations = locales.default;
    
    const expectedKeys = [
      "compare",
      "compare_modal_title",
      "compare_select_stream",
      "compare_choose_stream",
      "compare_search_placeholder",
      "compare_no_streams_found",
      "compare_single_stream",
      "compare_parameter",
      "compare_current_stream",
      "compare_comparison_stream",
      "compare_stream_id",
      "compare_status",
      "compare_recipient",
      "compare_amount",
      "compare_flow_rate",
      "compare_start_date",
      "compare_end_date",
      "compare_duration",
      "compare_auto_renew",
      "compare_days",
      "compare_close",
      "compare_button_tooltip",
    ];

    expectedKeys.forEach((key) => {
      expect(translations.stream_detail[key]).toBeDefined();
    });
  });
});
