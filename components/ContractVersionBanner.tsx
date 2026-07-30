"use client";
/**
 * ContractVersionBanner — sticky banner shown when the deployed SoroStream
 * contract's version doesn't match the version this build expects
 * (NEXT_PUBLIC_CONTRACT_VERSION). Prompts the user to refresh so they pick
 * up the client code built against the new contract.
 */
import { useContractVersion } from "@/src/lib/useContractVersion";

export default function ContractVersionBanner() {
  const { mismatch } = useContractVersion();

  if (!mismatch) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-14 z-40 w-full bg-amber-900/90 border-b border-amber-700 text-amber-100 text-sm text-center py-2 px-4 flex items-center justify-center gap-3 flex-wrap"
    >
      <span>
        <span className="font-semibold">⚠ Update available</span> — A new
        version of the SoroStream contract is available. Please refresh.
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="bg-amber-700 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        Refresh
      </button>
    </div>
  );
}
