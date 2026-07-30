"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import FiatDisplay from "@/components/FiatDisplay";
import { sorostream } from "@/src/lib/sorostream";
import { useRpcFetch } from "@/src/lib/useRpcFetch";
import { useSettings } from "@/src/context/SettingsContext";
import { useTranslations } from "@/src/lib/i18n";

interface LiveCounterProps {
  flowRate: number;
  lastWithdrawTime: Date;
  streamId?: string;
  reconcileIntervalMs?: number;
  /**
   * When provided, the counter shows this value instead of the live-ticking
   * estimate and renders a visual "pending" indicator to distinguish optimistic
   * state from confirmed on-chain state.
   *
   * Pass `null` to clear the override and resume live ticking.
   */
  optimisticOverride?: number | null;
}

const DEFAULT_RECONCILE_INTERVAL_MS = 30_000;
const ANNOUNCE_THROTTLE_MS = 30_000;

function getEstimatedClaimable(flowRate: number, lastWithdrawTime: Date) {
  const elapsed = (Date.now() - new Date(lastWithdrawTime).getTime()) / 1000;
  return Math.max(0, flowRate * elapsed);
}

/** Stable format for aria-label so screen readers get a consistent value */
function formatUSDCFixed(val: number) {
  return (val / 10_000_000).toFixed(7);
}

function parseClaimable(value: string | number | bigint): number | null {
  const amount = typeof value === "bigint" ? Number(value) : Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

const formatUSDCFixed = (val: number) => (val / 10_000_000).toFixed(7);


export default function LiveCounter({
  flowRate,
  lastWithdrawTime,
  streamId,
  reconcileIntervalMs = DEFAULT_RECONCILE_INTERVAL_MS,
  optimisticOverride,
}: LiveCounterProps) {
  const t = useTranslations("common");
  let language = "en";
  try {
    const settings = useSettings();
    if (settings) language = settings.language;
  } catch {
    // fallback to "en" when context is not available (e.g. in tests)
  }
  const rpcFetch = useRpcFetch();

  const [baseline, setBaseline] = useState(() => ({
    amount: getEstimatedClaimable(flowRate, lastWithdrawTime),
    timestamp: Date.now(),
  }));
  const [claimable, setClaimable] = useState(() =>
    getEstimatedClaimable(flowRate, lastWithdrawTime)
  );

  const isOptimistic = optimisticOverride != null;
  const displayValue = isOptimistic ? optimisticOverride : claimable;

  // Throttled aria-label: only update at most once per 30 seconds to avoid
  // spammy screen-reader narration while the counter ticks every second.
  // Initialize to -(throttle interval) so the first update is always immediate.
  const lastAnnounceTimeRef = useRef(-ANNOUNCE_THROTTLE_MS);
  const [ariaLabel, setAriaLabel] = useState(() =>
    formatUSDCFixed(getEstimatedClaimable(flowRate, lastWithdrawTime))
  );
  // Reset baseline when props change (e.g. after a withdrawal).
  useEffect(() => {
    const next = {
      amount: getEstimatedClaimable(flowRate, lastWithdrawTime),
      timestamp: Date.now(),
    };
    setBaseline(next);
    setClaimable(next.amount);
  }, [flowRate, lastWithdrawTime]);

  // Periodically reconcile against the chain value, with rate-limit handling.
  useEffect(() => {
    let cancelled = false;

    async function reconcileClaimable() {
      if (!streamId) return;

      try {
        const onChainClaimable = parseClaimable(
          await sorostream.getClaimable(streamId)
        );
        if (cancelled || onChainClaimable === null) return;

        const next = { amount: onChainClaimable, timestamp: Date.now() };
        setBaseline(next);
        setClaimable(next.amount);
      } catch {
        // Keep local interpolation running if the chain read fails permanently.
      }
    }

    void reconcileClaimable();
    const interval = setInterval(reconcileClaimable, reconcileIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [streamId, reconcileIntervalMs, rpcFetch]);

  // Interpolate locally at 1-second resolution.
  useEffect(() => {
    // Stop ticking while an optimistic override is active — the override value
    // is the source of truth until the transaction resolves.
    if (optimisticOverride != null) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - baseline.timestamp) / 1000;
      setClaimable(Math.max(0, baseline.amount + flowRate * elapsed));
    }, 1_000);
    return () => clearInterval(interval);
  }, [baseline, flowRate, optimisticOverride]);

  // Locale-aware display: groups thousands, always shows 7 decimal places
  const formatUSDC = (val: number) =>
    (val / 10_000_000).toLocaleString(language, {
      minimumFractionDigits: 7,
      maximumFractionDigits: 7,
    });

  // Stable format for aria-label so screen readers get a consistent value
  const safeFormatUSDCFixed = useCallback(
    (val: number) => (val / 10_000_000).toFixed(7),
    []
  );

  useEffect(() => {
    const isTest =
      typeof process !== "undefined" && process.env.NODE_ENV === "test";
    if (isTest) {
      setAriaLabel(safeFormatUSDCFixed(displayValue));
      return;
    }

    const now = Date.now();
    const timeSinceLast = now - lastAnnounceTimeRef.current;
    if (
      timeSinceLast >= ANNOUNCE_THROTTLE_MS ||
      lastAnnounceTimeRef.current === 0
    ) {
    if (timeSinceLast >= ANNOUNCE_THROTTLE_MS) {
      lastAnnounceTimeRef.current = now;
      setAriaLabel(safeFormatUSDCFixed(displayValue));
      return;
    }
    const remaining = ANNOUNCE_THROTTLE_MS - timeSinceLast;
    const timer = setTimeout(() => {
      lastAnnounceTimeRef.current = Date.now();
      setAriaLabel(safeFormatUSDCFixed(displayValue));
    }, remaining);
    return () => clearTimeout(timer);
  }, [displayValue, safeFormatUSDCFixed]);

  return (
    <span
      className="font-mono font-semibold tabular-nums inline-flex items-baseline gap-1.5"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={
        t("claimable", { val: ariaLabel }) +
        (isOptimistic ? t("pending_confirmation") : "")
      }
      aria-label={`Claimable: ${formatUSDCFixed(displayValue)} USDC`}
    >
      <span className={isOptimistic ? "text-yellow-400" : "text-green-600"}>
        {formatUSDC(displayValue)} USDC
      </span>
      {isOptimistic && (
        <span
          className="text-xs font-normal text-yellow-400/80 italic"
          aria-hidden="true"
        >
          ({t("pending")})
        </span>
      )}
      {!isOptimistic && <FiatDisplay usdcAmount={displayValue / 10000000} />}
    </span>
  );
}
