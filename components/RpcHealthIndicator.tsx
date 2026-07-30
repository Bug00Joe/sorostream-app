"use client";
/**
 * RpcHealthIndicator — a coloured dot in the NavHeader showing RPC status.
 *
 * States:
 *   green  — healthy (latency within threshold)
 *   yellow — degraded (latency > threshold, default 2 s)
 *   red    — unreachable
 *   gray   — unknown (initial load)
 *
 * A tooltip appears on hover/focus with the last-check timestamp and latency.
 * A full-width banner is rendered when the RPC has been unreachable for > 60 s.
 */
import { useId } from "react";
import { useRpcHealth, type RpcStatus } from "@/src/lib/useRpcHealth";

// ── Visual helpers ──────────────────────────────────────────────────────────

const STATUS_COLOR: Record<RpcStatus, string> = {
  unknown: "bg-gray-500",
  healthy: "bg-green-400",
  degraded: "bg-yellow-400",
  unreachable: "bg-red-500",
};

const STATUS_PULSE: Record<RpcStatus, string> = {
  unknown: "",
  healthy: "",
  degraded: "animate-pulse",
  unreachable: "animate-pulse",
};

const STATUS_LABEL: Record<RpcStatus, string> = {
  unknown: "RPC status unknown",
  healthy: "RPC healthy",
  degraded: "RPC degraded — high latency",
  unreachable: "RPC unreachable",
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── Banner ──────────────────────────────────────────────────────────────────

export function RpcUnreachableBanner() {
  const { status, showBanner } = useRpcHealth();

  if (!showBanner || status !== "unreachable") return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full bg-red-900/80 border-b border-red-700 text-red-100 text-sm text-center py-2 px-4"
    >
      <span className="font-semibold">⚠ RPC unreachable</span> — the Soroban
      RPC endpoint has been offline for more than 60 seconds. Some features may
      not work until it recovers.
    </div>
  );
}

// ── Indicator dot + tooltip ─────────────────────────────────────────────────

export default function RpcHealthIndicator() {
  const { status, latencyMs, lastChecked } = useRpcHealth();
  const tooltipId = useId();

  const dotColor = STATUS_COLOR[status];
  const pulse = STATUS_PULSE[status];
  const ariaLabel = STATUS_LABEL[status];

  const tooltipLines: string[] = [];
  if (lastChecked) tooltipLines.push(`Last checked: ${formatTime(lastChecked)}`);
  if (latencyMs !== null) tooltipLines.push(`Latency: ${latencyMs} ms`);
  if (status === "degraded") tooltipLines.push("High latency detected");
  if (status === "unreachable") tooltipLines.push("Endpoint not responding");

  return (
    <div className="relative group flex items-center">
      {/* Accessible dot button */}
      <button
        type="button"
        aria-label={ariaLabel}
        aria-describedby={tooltipId}
        className="flex items-center justify-center w-6 h-6 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
      >
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor} ${pulse}`}
          aria-hidden="true"
        />
      </button>

      {/* Tooltip — appears on hover or keyboard focus */}
      {tooltipLines.length > 0 && (
        <div
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute right-0 top-8 z-50 hidden group-hover:block group-focus-within:block min-w-max rounded-lg bg-gray-700 px-3 py-2 shadow-xl text-xs text-gray-100 space-y-0.5 border border-gray-600"
        >
          <p className="font-semibold text-white capitalize">{status}</p>
          {tooltipLines.map((line) => (
            <p key={line} className="text-gray-300">
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
