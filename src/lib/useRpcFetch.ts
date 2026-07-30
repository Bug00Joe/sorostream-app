"use client";
/**
 * useRpcFetch — React hook that wraps rpcFetch with toast notifications.
 *
 * On a 429 rate-limit it shows:
 *   "Rate limited — retrying in Xs"
 * The message updates every second as the countdown progresses.
 * On successful retry the toast is dismissed and a brief success notice shown.
 */
import { useCallback, useRef } from "react";
import { rpcFetch, type RpcClientOptions } from "./rpcClient";
import { useToast } from "./toast";

const RATE_LIMIT_TOAST_KEY = "rpc-rate-limit";

export function useRpcFetch() {
  const { upsertPersistentToast, removeToast, addToast } = useToast();
  const activeToastId = useRef<number | null>(null);

  const fetch = useCallback(
    <T>(fn: () => Promise<T>): Promise<T> => {
      const opts: RpcClientOptions = {
        onRateLimit(secondsLeft, attempt) {
          const msg =
            secondsLeft > 0
              ? `Rate limited — retrying in ${secondsLeft}s`
              : "Rate limited — retrying…";
          const id = upsertPersistentToast(
            `${RATE_LIMIT_TOAST_KEY}-${attempt}`,
            msg,
            "warning",
          );
          activeToastId.current = id;
        },
        onRetrySuccess() {
          if (activeToastId.current !== null) {
            removeToast(activeToastId.current);
            activeToastId.current = null;
          }
          addToast("Request succeeded after rate-limit retry", "success");
        },
      };

      return rpcFetch(fn, opts);
    },
    [upsertPersistentToast, removeToast, addToast],
  );

  return fetch;
}
