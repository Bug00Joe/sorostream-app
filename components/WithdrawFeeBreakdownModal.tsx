"use client";
/**
 * WithdrawFeeBreakdownModal
 *
 * Shows a fee breakdown table before the user signs a withdrawal:
 *   Claimable Amount   | 1,234.5600000 USDC
 *   Protocol Fee (0.5%)| 6.1728000 USDC
 *   Amount to Receive  | 1,228.3872000 USDC
 *
 * - Fetches the current on-chain fee rate before display.
 * - Zero-fee configurations show "No fee" instead of "0.0000000 USDC".
 * - Requires the user to type the exact claimable amount before confirming
 *   (mirrors the existing WithdrawConfirmModal pattern for large withdrawals).
 * - Works for both single and batch withdrawals (pass `isBatch` and `streamCount`).
 */
import { useState, useEffect, useRef } from "react";
import {
  getFeeConfig,
  calcWithdrawBreakdown,
  formatStellarAmount,
} from "@/src/lib/sorostream";

interface WithdrawFeeBreakdownModalProps {
  /** Claimable amount in stroops */
  claimableStroops: number;
  /** Token symbol, e.g. "USDC" */
  token: string;
  /** Whether this is a batch withdrawal (changes modal copy) */
  isBatch?: boolean;
  /** Number of streams in the batch (only used when isBatch is true) */
  streamCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

interface BreakdownState {
  status: "loading" | "ready" | "error";
  claimable: number;
  fee: number;
  net: number;
  feePercent: number;
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <tr
      className={
        highlight
          ? "bg-green-900/20 border-t border-green-800"
          : "border-t border-gray-700"
      }
    >
      <td className="py-2.5 pr-4 text-sm text-gray-400 whitespace-nowrap">{label}</td>
      <td
        className={`py-2.5 text-right font-mono text-sm font-medium ${
          highlight ? "text-green-300" : "text-white"
        }`}
      >
        {value}
      </td>
    </tr>
  );
}

export default function WithdrawFeeBreakdownModal({
  claimableStroops,
  token,
  isBatch = false,
  streamCount = 1,
  onConfirm,
  onCancel,
}: WithdrawFeeBreakdownModalProps) {
  const [breakdown, setBreakdown] = useState<BreakdownState>({
    status: "loading",
    claimable: claimableStroops,
    fee: 0,
    net: claimableStroops,
    feePercent: 0,
  });

  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch fee config and compute breakdown on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { basisPoints } = await getFeeConfig();
        if (cancelled) return;
        const calc = calcWithdrawBreakdown(claimableStroops, basisPoints);
        setBreakdown({ status: "ready", ...calc });
      } catch {
        if (!cancelled) setBreakdown((prev) => ({ ...prev, status: "error" }));
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [claimableStroops]);

  // Focus input once fee data is loaded
  useEffect(() => {
    if (breakdown.status === "ready") {
      inputRef.current?.focus();
    }
  }, [breakdown.status]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const claimableDisplay = formatStellarAmount(claimableStroops);
  const isZeroFee = breakdown.feePercent === 0;
  const matches = typed === claimableDisplay;

  const title = isBatch
    ? `Confirm batch withdrawal (${streamCount} stream${streamCount !== 1 ? "s" : ""})`
    : "Confirm withdrawal";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fee-breakdown-title"
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md space-y-5 shadow-2xl border border-gray-700">
        {/* Header */}
        <div>
          <h2 id="fee-breakdown-title" className="text-lg font-semibold text-white mb-1">
            {title}
          </h2>
          <p className="text-gray-400 text-sm">
            Review the fee breakdown before signing the transaction.
          </p>
        </div>

        {/* Fee breakdown table */}
        {breakdown.status === "loading" ? (
          <div className="flex items-center gap-3 text-gray-400 text-sm py-2">
            <svg
              className="animate-spin h-4 w-4 text-green-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Fetching fee rate…
          </div>
        ) : breakdown.status === "error" ? (
          <p className="text-red-400 text-sm py-2">
            Could not fetch fee config. Proceed with caution or try again.
          </p>
        ) : (
          <div className="rounded-lg bg-gray-900 border border-gray-700 px-4 overflow-hidden">
            <table className="w-full" aria-label="Withdrawal fee breakdown">
              <tbody>
                <Row
                  label="Claimable Amount"
                  value={`${claimableDisplay} ${token}`}
                />
                <Row
                  label={
                    isZeroFee
                      ? "Protocol Fee"
                      : `Protocol Fee (${breakdown.feePercent.toFixed(2)}%)`
                  }
                  value={
                    isZeroFee ? (
                      <span className="text-gray-400 not-italic font-normal text-xs">
                        No fee
                      </span>
                    ) : (
                      `${formatStellarAmount(breakdown.fee)} ${token}`
                    )
                  }
                />
                <Row
                  label="Amount to Receive"
                  value={`${formatStellarAmount(breakdown.net)} ${token}`}
                  highlight
                />
              </tbody>
            </table>
          </div>
        )}

        {/* Confirmation input — user must type the exact claimable amount */}
        <div>
          <label
            htmlFor="fee-confirm-input"
            className="text-gray-200 text-sm font-medium block mb-1"
          >
            Type <span className="font-mono text-white">{claimableDisplay}</span> to confirm
          </label>
          <input
            id="fee-confirm-input"
            ref={inputRef}
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={claimableDisplay}
            autoComplete="off"
            disabled={breakdown.status !== "ready"}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-describedby="fee-confirm-hint"
          />
          {typed.length > 0 && !matches && (
            <p id="fee-confirm-hint" className="text-red-400 text-xs mt-1" role="alert">
              Amount doesn&apos;t match.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-600 text-gray-300 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!matches || breakdown.status !== "ready"}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            Confirm Withdrawal
          </button>
        </div>
      </div>
    </div>
  );
}
