import { describe, expect, it } from "vitest";
import { calculateTotalValueLocked, type TvlStreamLike } from "../sorostream";

describe("calculateTotalValueLocked", () => {
  it("sums only active stream deposits", () => {
    const streams: TvlStreamLike[] = [
      { status: "Active", deposit: 1_000_000_000 },
      { status: "Active", deposit: 2_500_000_000 },
      { status: "Cancelled", deposit: 999_000_000 },
    ];

    expect(calculateTotalValueLocked(streams)).toBe(3_500_000_000);
  });

  it("excludes cancelled deposits from TVL", () => {
    const streams: TvlStreamLike[] = [
      { status: "Active", deposit: 2_000_000_000 },
      { status: "Cancelled", deposit: 8_000_000_000 },
      { status: "Ended", deposit: 4_000_000_000 },
    ];

    expect(calculateTotalValueLocked(streams)).toBe(2_000_000_000);
  });

  it("subtracts withdrawn stroops from active streams", () => {
    const streams: TvlStreamLike[] = [
      { status: "Active", deposit: 5_000_000_000, withdrawnStroops: 750_000_000 },
      { status: "Active", deposit: 1_250_000_000, withdrawnStroops: 250_000_000 },
    ];

    expect(calculateTotalValueLocked(streams)).toBe(5_250_000_000);
  });
});
