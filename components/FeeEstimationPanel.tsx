"use client";

import { useEffect, useState } from "react";
import { simulateTransactionFee, type FeeEstimate } from "@/src/lib/sorostream";

type FeeState =
  | { status: "loading" }
  | { status: "success"; estimate: FeeEstimate }
  | { status: "error" };

interface FeeEstimationPanelProps {
  /** Set to true to trigger/reset the simulation (e.g. when the review step becomes visible). */
  active: boolean;
}

/**
 * Displays a pre-sign Soroban RPC fee estimate.
 * Shows a skeleton while the simulation is in flight and a graceful fallback on error.
 */
export default function FeeEstimationPanel({ active }: FeeEstimationPanelProps) {
  const [feeState, setFeeState] = useState<FeeState>({ status: "loading" });

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    setFeeState({ status: "loading" });

    simulateTransactionFee()
      .then((estimate) => {
        if (!cancelled) setFeeState({ status: "success", estimate });
      })
      .catch(() => {
        if (!cancelled) setFeeState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="bg-gray-750 border border-gray-600 rounded-lg p-4 space-y-3"
      aria-label="Estimated transaction fee"
      aria-live="polite"
      aria-busy={feeState.status === "loading"}
    >
      <div className="flex items-center gap-2 mb-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-400 flex-shrink-0"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
          Estimated Network Fee
        </span>
      </div>

      {feeState.status === "loading" && (
        <div className="space-y-2 animate-pulse" aria-label="Loading fee estimate">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-700 rounded w-28" />
            <div className="h-3 bg-gray-700 rounded w-20" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-700 rounded w-24" />
            <div className="h-3 bg-gray-700 rounded w-20" />
          </div>
          <div className="border-t border-gray-700 pt-2 flex justify-between items-center">
            <div className="h-4 bg-gray-600 rounded w-20" />
            <div className="h-4 bg-gray-600 rounded w-24" />
          </div>
          <p className="text-xs text-gray-500 text-center">Simulating transaction…</p>
        </div>
      )}

      {feeState.status === "error" && (
        <p className="text-xs text-yellow-400 text-center py-1">
          Fee estimate unavailable — you may still proceed.
        </p>
      )}

      {feeState.status === "success" && (
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between items-center text-gray-400">
            <span>Inclusion fee</span>
            <span className="font-mono text-white">{feeState.estimate.inclusionFeeLumens} XLM</span>
          </div>
          <div className="flex justify-between items-center text-gray-400">
            <span>Resource fee</span>
            <span className="font-mono text-white">{feeState.estimate.resourceFeeLumens} XLM</span>
          </div>
          <div className="border-t border-gray-600 pt-2 flex justify-between items-center font-semibold">
            <span className="text-gray-200">Total fee</span>
            <span className="font-mono text-blue-300">{feeState.estimate.totalFeeLumens} XLM</span>
          </div>
          <p className="text-xs text-gray-500 text-center pt-1">
            Simulated via Soroban RPC — actual fee may vary slightly.
          </p>
        </div>
      )}
    </div>
  );
}
