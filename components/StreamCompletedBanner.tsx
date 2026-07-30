"use client";

import { useEffect, useRef, useState } from "react";

interface StreamCompletedBannerProps {
  /** Stream ID — used in the notification message. */
  streamId: string;
  /** Final claimable amount formatted as a display string (e.g. "12.3456700"). */
  finalAmount: string;
  /** Token symbol (e.g. "USDC", "XLM") for display in amount fields. */
  token?: string;
  /** Called when the user clicks "Claim Final Amount". */
  onClaim: () => void;
  /** True while the claim transaction is in flight. */
  claiming?: boolean;
  /** If true, shows the post-claim completion animation instead of the CTA. */
  claimed?: boolean;
}

/**
 * Banner shown on the stream detail page when `currentTime >= endTime`.
 *
 * Responsibilities:
 *   - Visually distinct "stream completed" state
 *   - "Claim Final Amount" CTA that triggers the withdrawal flow
 *   - Post-claim celebratory animation
 *   - One-shot browser notification (if permission is granted)
 */
export default function StreamCompletedBanner({
  streamId,
  finalAmount,
  token = "USDC",
  onClaim,
  claiming = false,
  claimed = false,
}: StreamCompletedBannerProps) {
  const [showAnim, setShowAnim] = useState(false);
  const notifiedRef = useRef(false);

  // Trigger the completion animation when claimed flips to true.
  useEffect(() => {
    if (claimed) {
      setShowAnim(true);
    }
  }, [claimed]);

  // Send a browser notification once when the banner first mounts (i.e. stream
  // just completed).  We only attempt this if the browser API is available and
  // permission has already been granted — we never prompt for permission here.
  useEffect(() => {
    if (notifiedRef.current) return;
    notifiedRef.current = true;

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("Stream completed 🎉", {
          body: `Stream #${streamId} has finished. You have ${finalAmount} ${token} available to claim.`,
          tag: `sorostream-completed-${streamId}`,
        });
      } catch {
        // Notifications may be blocked by the browser silently.
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (claimed) {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="stream-completed-claimed"
        className={`rounded-xl bg-green-900/40 border border-green-600 p-6 text-center space-y-3 transition-all duration-500 ${
          showAnim ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Celebratory animation */}
        <div className="text-5xl" aria-hidden="true">
          🎉
        </div>
        <p className="text-green-300 font-semibold text-lg">
          All funds claimed!
        </p>
        <p className="text-gray-400 text-sm">
          This stream has been fully settled.{" "}
          <a
            href="/dashboard"
            className="text-green-400 underline hover:text-green-300 transition-colors"
          >
            Back to Dashboard
          </a>
        </p>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="stream-completed-banner"
      className="rounded-xl bg-amber-900/30 border border-amber-600 p-5 space-y-4"
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">
          ✅
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-amber-300 font-semibold text-base leading-snug">
            Stream Completed
          </p>
          <p className="text-gray-300 text-sm mt-0.5">
            This stream has reached its end time. Your final claimable balance
            is ready to withdraw.
          </p>
        </div>
      </div>

      {/* Final amount */}
      <div className="bg-gray-900/50 rounded-lg px-4 py-3 flex justify-between items-center">
        <span className="text-gray-400 text-sm">Final claimable amount</span>
        <span className="text-white font-mono font-semibold">
          {finalAmount} {token}
        </span>
      </div>

      {/* CTA */}
      <button
        onClick={onClaim}
        disabled={claiming}
        data-testid="claim-final-amount-btn"
        className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
      >
        {claiming ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Claiming…
          </span>
        ) : (
          "Claim Final Amount"
        )}
      </button>
    </div>
  );
}
