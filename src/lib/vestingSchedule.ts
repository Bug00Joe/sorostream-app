/**
 * Vesting schedule calculator — pure, UI-free, testable in isolation.
 *
 * Amounts are in stroops (1 XLM = 10_000_000 stroops).
 * Times are Unix timestamps in seconds.
 */

export interface VestingPoint {
  /** Unix timestamp (seconds) at which this sample was taken. */
  time: number;
  /** Cumulative stroops claimable at this point in time. */
  claimable: number;
}

export interface VestingScheduleResult {
  /** Ordered samples across the full vesting window. */
  points: VestingPoint[];
}

/**
 * Calculate a vesting schedule as a series of time/claimable samples.
 *
 * Linear vesting: tokens accrue at a constant rate from `startTime`
 * (or `cliffTime` if a cliff is set) to `endTime`.
 *
 * Before the cliff nothing is claimable. At the cliff the recipient
 * can claim everything accrued from `startTime` to `cliffTime` in one
 * go, then continues to vest linearly until `endTime`.
 *
 * @param totalAmount   Total stroops to vest over the full period.
 * @param startTime     Unix timestamp (s) when vesting begins.
 * @param endTime       Unix timestamp (s) when vesting finishes.
 * @param cliffTime     Unix timestamp (s) of the cliff (0 = no cliff).
 * @param sampleCount   Number of evenly-spaced data points to generate (default 50).
 */
export function calculateVestingSchedule(
  totalAmount: number,
  startTime: number,
  endTime: number,
  cliffTime: number = 0,
  sampleCount: number = 50,
): VestingScheduleResult {
  if (totalAmount <= 0 || endTime <= startTime || sampleCount < 2) {
    return { points: [] };
  }

  const duration = endTime - startTime;
  const effectiveCliff = cliffTime > startTime && cliffTime < endTime ? cliffTime : 0;

  const points: VestingPoint[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const time = startTime + (duration * i) / (sampleCount - 1);

    let claimable: number;
    if (effectiveCliff > 0 && time < effectiveCliff) {
      claimable = 0;
    } else {
      const elapsed = time - startTime;
      claimable = Math.floor((totalAmount * elapsed) / duration);
    }

    points.push({ time: Math.round(time), claimable });
  }

  return { points };
}
