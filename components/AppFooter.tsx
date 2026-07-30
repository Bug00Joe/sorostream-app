"use client";

import { useState, useRef, useEffect } from "react";
import CopyButton from "@/components/CopyButton";
import { useNetwork, NETWORK_CONFIG } from "@/src/lib/network";
import { useContractVersion } from "@/src/context/ContractVersionContext";

/** Truncate a Stellar address to first 6 + … + last 6 characters. */
function truncateAddress(address: string): string {
  if (!address || address.length <= 16) return address;
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

/**
 * AppFooter
 *
 * Displays the current network name, a truncated contract address with a
 * tooltip showing the full address and a copy button, and the deployed
 * contract version string.
 *
 * - Updates reactively whenever the NetworkProvider's `network` changes.
 * - Shows a skeleton pulse while the version is being fetched.
 * - Gracefully shows "unknown" if the version fetch fails.
 */
export default function AppFooter() {
  const { network } = useNetwork();
  const { version, loading } = useContractVersion();

  const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID ?? "";
  const networkLabel = NETWORK_CONFIG[network]?.label ?? network;

  // ── Tooltip state ──────────────────────────────────────────────────────────
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!tooltipOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setTooltipOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [tooltipOpen]);

  // Close tooltip on Escape
  useEffect(() => {
    if (!tooltipOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setTooltipOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [tooltipOpen]);

  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
        {/* Left: branding */}
        <span className="font-semibold text-gray-700 dark:text-gray-300 select-none">
          SoroStream
        </span>

        {/* Center: network + contract + version */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Network badge */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              network === "mainnet"
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
            }`}
            aria-label={`Connected to ${networkLabel}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                network === "mainnet" ? "bg-green-500" : "bg-yellow-500"
              }`}
              aria-hidden="true"
            />
            {networkLabel}
          </span>

          {/* Contract address with tooltip */}
          {contractId ? (
            <div className="relative inline-flex items-center gap-1">
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setTooltipOpen((v) => !v)}
                aria-expanded={tooltipOpen}
                aria-haspopup="dialog"
                aria-label="Show full contract address"
                className="font-mono hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 rounded"
              >
                {truncateAddress(contractId)}
              </button>

              {tooltipOpen && (
                <div
                  ref={tooltipRef}
                  role="dialog"
                  aria-label="Full contract address"
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-max max-w-xs sm:max-w-sm bg-gray-800 dark:bg-gray-700 text-white rounded-lg shadow-xl px-3 py-2.5 text-xs"
                >
                  <p className="font-semibold text-gray-300 mb-1 text-[10px] uppercase tracking-wide">
                    Contract Address
                  </p>
                  <div className="flex items-center gap-1.5 font-mono break-all">
                    <span>{contractId}</span>
                    <CopyButton value={contractId} label="Copy contract address" />
                  </div>
                  {/* Arrow */}
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800 dark:border-t-gray-700"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
          ) : (
            <span className="font-mono text-gray-400 dark:text-gray-600 italic">
              no contract
            </span>
          )}

          {/* Version */}
          <span className="flex items-center gap-1">
            <span className="text-gray-400 dark:text-gray-600" aria-hidden="true">
              v
            </span>
            {loading ? (
              <span
                className="inline-block h-3 w-14 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"
                aria-label="Loading contract version"
              />
            ) : (
              <span aria-label={`Contract version ${version ?? "unknown"}`}>
                {version ?? "unknown"}
              </span>
            )}
          </span>
        </div>

        {/* Right: copyright */}
        <span className="text-gray-400 dark:text-gray-600">
          © {new Date().getFullYear()} SoroStream
        </span>
      </div>
    </footer>
  );
}
