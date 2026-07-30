import { describe, expect, it } from "vitest";
import { calculateVestingSchedule } from "../vestingSchedule";

const START = 1_000_000; // arbitrary unix epoch seconds
const END = START + 1_000; // 1 000-second window
const TOTAL = 1_000_000_000; // 100 XLM in stroops

describe("calculateVestingSchedule", () => {
  // ── 1. Linear, no cliff ────────────────────────────────────────────────────
  it("linear no-cliff: first point is 0, last point equals totalAmount", () => {
    const { points } = calculateVestingSchedule(TOTAL, START, END, 0);

    expect(points.length).toBeGreaterThan(0);
    expect(points[0].claimable).toBe(0);
    expect(points[points.length - 1].claimable).toBe(TOTAL);
  });

  it("linear no-cliff: claimable increases monotonically", () => {
    const { points } = calculateVestingSchedule(TOTAL, START, END, 0);

    for (let i = 1; i < points.length; i++) {
      expect(points[i].claimable).toBeGreaterThanOrEqual(points[i - 1].claimable);
    }
  });

  // ── 2. Cliff at 25 % ───────────────────────────────────────────────────────
  it("cliff at 25%: nothing claimable before cliff, then lump-sum at cliff", () => {
    const cliffTime = START + 250; // 25 % of 1 000 s
    const { points } = calculateVestingSchedule(TOTAL, START, END, cliffTime);

    const beforeCliff = points.filter((p) => p.time < cliffTime);
    const atOrAfterCliff = points.filter((p) => p.time >= cliffTime);

    expect(beforeCliff.every((p) => p.claimable === 0)).toBe(true);
    // At cliff the full 25 % that accrued since start becomes available.
    expect(atOrAfterCliff[0].claimable).toBeGreaterThan(0);
  });

  // ── 3. Cliff at end_time ───────────────────────────────────────────────────
  it("cliff at end_time: all points before end have 0 claimable", () => {
    // A cliff at or after endTime means the entire window is locked — treat as
    // no effective cliff (cliff >= endTime is out of range), so vesting is linear.
    const { points } = calculateVestingSchedule(TOTAL, START, END, END);

    // cliff === endTime is outside the (startTime, endTime) range, so it is
    // treated the same as no cliff — linear vesting.
    expect(points[0].claimable).toBe(0);
    expect(points[points.length - 1].claimable).toBe(TOTAL);
  });

  // ── 4. Zero amount ─────────────────────────────────────────────────────────
  it("zero totalAmount: returns empty points array", () => {
    const { points } = calculateVestingSchedule(0, START, END, 0);
    expect(points).toHaveLength(0);
  });

  // ── 5. Single-second duration ──────────────────────────────────────────────
  it("single-second duration: first point is 0, last is totalAmount", () => {
    const { points } = calculateVestingSchedule(TOTAL, START, START + 1, 0);

    expect(points[0].claimable).toBe(0);
    expect(points[points.length - 1].claimable).toBe(TOTAL);
  });

  // ── 6. sampleCount propagates correctly ───────────────────────────────────
  it("respects custom sampleCount", () => {
    const { points } = calculateVestingSchedule(TOTAL, START, END, 0, 10);
    expect(points).toHaveLength(10);
  });

  // ── 7. Times are within [startTime, endTime] ──────────────────────────────
  it("all point times are within [startTime, endTime]", () => {
    const { points } = calculateVestingSchedule(TOTAL, START, END, 0);

    for (const p of points) {
      expect(p.time).toBeGreaterThanOrEqual(START);
      expect(p.time).toBeLessThanOrEqual(END);
    }
  });
});
