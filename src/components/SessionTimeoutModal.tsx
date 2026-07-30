"use client";

import React, { useRef, useEffect, useState } from "react";
import { useWallet } from "@/src/context/WalletContext";

export function SessionTimeoutModal() {
  const { showSessionWarning1Min, sessionTimeRemaining, extendSession, disconnect } = useWallet();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Format remaining time
  const formatTimeRemaining = (ms: number | null): string => {
    if (!ms) return "0s";
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  // Handle Extend Session
  const handleExtend = async () => {
    setIsLoading(true);
    try {
      await extendSession();
    } catch (err) {
      console.error("Failed to extend session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Focus trap: keep focus within modal when open
  useEffect(() => {
    if (!showSessionWarning1Min) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Don't allow escape - this is blocking
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showSessionWarning1Min]);

  if (!showSessionWarning1Min) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-timeout-title"
        className="bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full border border-red-700"
      >
        {/* Header with icon */}
        <div className="bg-red-900/40 border-b border-red-700 p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-400"
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
            <div>
              <h2 id="session-timeout-title" className="text-lg font-semibold text-white">
                Session Expiring Soon
              </h2>
              <p className="text-xs text-red-300 mt-1">
                Your wallet session will expire in{" "}
                <span className="font-mono font-bold">{formatTimeRemaining(sessionTimeRemaining)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-300">
            To continue using SoroStream, you can either:
          </p>
          <ul className="text-sm text-gray-300 space-y-2 ml-4">
            <li className="flex gap-2">
              <span className="text-green-400 font-bold">•</span>
              <span>
                <strong>Extend Session:</strong> Refresh your wallet connection to continue
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>
                <strong>Disconnect:</strong> Sign out and reconnect later
              </span>
            </li>
          </ul>

          {/* Warning */}
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 mt-4">
            <p className="text-xs text-red-300">
              ⚠️ <strong>Warning:</strong> If your session expires, you may lose unsaved form data and will need to reconnect.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="border-t border-gray-700 p-6 space-y-3">
          <button
            onClick={handleExtend}
            disabled={isLoading}
            className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-900 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 inline-flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Extending...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
                Extend Session
              </>
            )}
          </button>

          <button
            onClick={disconnect}
            disabled={isLoading}
            className="w-full border border-gray-600 hover:border-gray-500 hover:bg-gray-700 disabled:opacity-50 text-gray-300 py-3 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
          >
            Disconnect
          </button>
        </div>

        {/* Countdown indicator */}
        <div className="bg-gray-700/50 px-6 py-2 border-t border-gray-700 flex items-center justify-between text-xs">
          <span className="text-gray-400">Auto-expires in</span>
          <span className="font-mono font-bold text-red-400 animate-pulse">
            {formatTimeRemaining(sessionTimeRemaining)}
          </span>
        </div>
      </div>
    </div>
  );
}
