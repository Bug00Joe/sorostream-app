/**
 * RPC client wrapper with 429 rate-limit detection, exponential backoff,
 * and a live-countdown toast notification.
 *
 * Usage:
 *   const data = await rpcFetch(() => sorobanRpc.getContractData(...));
 *
 * - Detects HTTP 429 responses (or errors whose message contains "429" or
 *   "rate limit" / "rate-limit").
 * - Shows a non-blocking "Rate limited — retrying in Xs" toast that
 *   counts down in real time.
 * - Retries with exponential backoff (2, 4, 8 … up to 60 seconds).
 * - Resolves normally on success; re-throws after the final attempt.
 */

const MAX_RETRIES = 6;
const BASE_DELAY_MS = 2_000;
const MAX_DELAY_MS = 60_000;

/** Compute the capped exponential backoff delay for a given attempt index. */
function backoffMs(attempt: number): number {
  return Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
}

/** Returns true when an error looks like a 429 / rate-limit response. */
function isRateLimitError(err: unknown): boolean {
  if (err instanceof Response || (err && typeof err === "object" && "status" in err)) {
    return (err as { status: number }).status === 429;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /429|rate.?limit/i.test(msg);
}

/** Pause for `ms` milliseconds while firing countdown callbacks each second. */
function wait(
  ms: number,
  onTick: (secondsLeft: number) => void,
): Promise<void> {
  return new Promise((resolve) => {
    let remaining = Math.ceil(ms / 1000);
    onTick(remaining);

    const ticker = setInterval(() => {
      remaining -= 1;
      onTick(remaining);
      if (remaining <= 0) {
        clearInterval(ticker);
        resolve();
      }
    }, 1_000);
  });
}

export interface RpcClientOptions {
  /**
   * Called once per rate-limit event with the number of seconds to wait.
   * Receives subsequent tick updates until the backoff expires.
   * Use this to drive a toast countdown.
   */
  onRateLimit?: (secondsLeft: number, attempt: number) => void;
  /** Called once the retry succeeds after a rate-limit delay. */
  onRetrySuccess?: () => void;
}

/**
 * Wrap any async RPC call with automatic rate-limit retry + countdown callbacks.
 *
 * @param fn     The async function to call (will be retried on 429).
 * @param opts   Callbacks to display progress to the user.
 */
export async function rpcFetch<T>(
  fn: () => Promise<T>,
  opts: RpcClientOptions = {},
): Promise<T> {
  const { onRateLimit, onRetrySuccess } = opts;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) {
        onRetrySuccess?.();
      }
      return result;
    } catch (err) {
      const isLast = attempt === MAX_RETRIES;

      if (isRateLimitError(err) && !isLast) {
        const delay = backoffMs(attempt);
        await wait(delay, (secondsLeft) => {
          onRateLimit?.(secondsLeft, attempt);
        });
        // Continue to next attempt
      } else {
        throw err;
      }
    }
  }

  // TypeScript needs this; the loop above always throws on the last attempt.
  throw new Error("rpcFetch: exceeded max retries");
}
