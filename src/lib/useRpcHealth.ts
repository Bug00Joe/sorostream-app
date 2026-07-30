"use client";
/**
 * useRpcHealth — polls the active RPC endpoint every 30 seconds
 * and exposes the current health status, latency, and last-checked timestamp.
 *
 * Status thresholds are configurable via env vars:
 *   NEXT_PUBLIC_RPC_DEGRADED_MS  — latency (ms) above which status → "degraded"  (default: 2000)
 *   NEXT_PUBLIC_RPC_UNREACHABLE_BANNER_S — seconds unreachable before banner shows (default: 60)
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNetwork } from "@/src/lib/network";

export type RpcStatus = "unknown" | "healthy" | "degraded" | "unreachable";

export interface RpcHealthState {
  status: RpcStatus;
  latencyMs: number | null;
  lastChecked: Date | null;
  showBanner: boolean;
}

const POLL_INTERVAL_MS = 30_000;

function getDegradedThreshold(): number {
  const raw = process.env.NEXT_PUBLIC_RPC_DEGRADED_MS;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2_000;
}

function getBannerThreshold(): number {
  const raw = process.env.NEXT_PUBLIC_RPC_UNREACHABLE_BANNER_S;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
}

export function useRpcHealth(): RpcHealthState {
  const { rpcUrl } = useNetwork();
  const [status, setStatus] = useState<RpcStatus>("unknown");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  /** Timestamp (ms) when the RPC first became unreachable in the current run. */
  const unreachableSinceRef = useRef<number | null>(null);

  const checkHealth = useCallback(async () => {
    const degradedThreshold = getDegradedThreshold();
    const bannerThresholdMs = getBannerThreshold() * 1_000;

    const start = performance.now();
    try {
      // Use a lightweight JSON-RPC ping (getHealth) to probe the endpoint.
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth", params: [] }),
        signal: AbortSignal.timeout(8_000),
      });

      const elapsed = performance.now() - start;

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Successful response
      unreachableSinceRef.current = null;
      setLatencyMs(Math.round(elapsed));
      setLastChecked(new Date());
      setShowBanner(false);
      setStatus(elapsed > degradedThreshold ? "degraded" : "healthy");
    } catch {
      const elapsed = performance.now() - start;
      setLatencyMs(Math.round(elapsed));
      setLastChecked(new Date());

      // Track how long we've been unreachable
      if (unreachableSinceRef.current === null) {
        unreachableSinceRef.current = Date.now();
      }

      const unreachableDurationMs = Date.now() - unreachableSinceRef.current;
      setShowBanner(unreachableDurationMs >= bannerThresholdMs);
      setStatus("unreachable");
    }
  }, [rpcUrl]);

  // Run immediately on mount and whenever rpcUrl changes, then poll.
  useEffect(() => {
    void checkHealth();
    const interval = setInterval(() => void checkHealth(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return { status, latencyMs, lastChecked, showBanner };
}
