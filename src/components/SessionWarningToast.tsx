"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/src/context/WalletContext";

export function SessionWarningToast() {
  const { showSessionWarning5Min } = useWallet();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when warning changes
  useEffect(() => {
    setDismissed(false);
  }, [showSessionWarning5Min]);

  if (!showSessionWarning5Min || dismissed) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-6 right-6 z-40 max-w-sm animate-slide-in-right"
    >
      <div className="bg-amber-900/80 border border-amber-700 rounded-lg shadow-lg p-4 backdrop-blur-sm">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="h-5 w-5 text-amber-400 animate-pulse"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-amber-50">
              Wallet session expiring soon
            </h3>
            <p className="mt-1 text-xs text-amber-200">
              Your wallet session will expire in 5 minutes. A modal will appear before it expires.
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss session warning"
            className="flex-shrink-0 text-amber-300 hover:text-amber-50 transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
