/**
 * Stream health status utility.
 *
 * Derives a rich health label from raw StreamData. The label drives badge
 * colours, alert banners, and action availability across the app.
 *
 * Priority order (highest wins):
 *   1. Cancelled  – explicit cancellation always overrides everything.
 *   2. Paused     – paused always overrides time-based calculations.
 *   3. Expired    – stream is over (endTime has passed) and not paused.
 *   4. Expiring Soon – stream ends within the next EXPIRING_SOON_THRESHOLD_MS.
 *   5. Active     – stream is running normally.
 */

/** Threshold (ms) before end time when we call a stream "Expiring Soon". */
export const EXPIRING_SOON_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export type StreamHealthStatus =
  | "Active"
  | "Expiring Soon"
  | "Expired"
  | "Paused"
  | "Cancelled";

/**
 * Minimum shape needed to compute health. Both `StreamData` (sorostream.ts)
 * and any future on-chain type satisfy this interface.
 */
export interface HealthStreamInput {
  status: "Active" | "Cancelled" | "Ended" | "Paused";
  endTime: string; // ISO-8601
  startTime?: string; // ISO-8601 (optional, used for cliff logic)
  cliffTime?: string; // ISO-8601 (optional)
}

/**
 * Compute the display health status for a stream.
 *
 * @param stream  Raw stream data (any object with the fields above).
 * @param now     Current timestamp in ms — injectable for deterministic tests.
 *                Defaults to `Date.now()`.
 * @returns       One of the five StreamHealthStatus values.
 */
export function getStreamHealth(
  stream: HealthStreamInput,
  now: number = Date.now(),
): StreamHealthStatus {
  // 1. Cancelled always wins
  if (stream.status === "Cancelled") return "Cancelled";

  // 2. Paused always wins over time-based calculations
  if (stream.status === "Paused") return "Paused";

  const endMs = new Date(stream.endTime).getTime();

  // Guard: if endTime is unparseable, treat as Expired to avoid silent bugs
  if (isNaN(endMs)) return "Expired";

  // 3. Stream has already ended (endTime in the past, or status === "Ended")
  if (stream.status === "Ended" || now >= endMs) return "Expired";

  // 4. Stream ends within the next 24 hours
  if (endMs - now <= EXPIRING_SOON_THRESHOLD_MS) return "Expiring Soon";

  // 5. Normal running state
  return "Active";
}

/**
 * Badge colour mapping — Tailwind classes keyed by StreamHealthStatus.
 * Import this alongside getStreamHealth to keep badge styling co-located with
 * the logic.
 */
export const HEALTH_BADGE_CLASSES: Record<StreamHealthStatus, string> = {
  Active: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400",
  "Expiring Soon": "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-400",
  Expired: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
  Paused: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400",
  Cancelled: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400",
};
