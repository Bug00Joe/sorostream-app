"use client";
/**
 * FederationName — asynchronously resolves a Stellar public key to its
 * federation name and renders it inline alongside the address.
 *
 * - Does NOT block page load; renders the raw address immediately.
 * - Appends the resolved name (e.g. "alice*stellar.org") once available.
 * - Silently omits federation name if lookup fails or finds no record.
 * - Results are cached per session via the federation service.
 *
 * Props:
 *   address  — Stellar public key (G…)
 *   truncate — when true, truncates the address to GBAM…XDRL format (default: false)
 */
import { useEffect, useState } from "react";
import { resolveFederationName } from "@/src/lib/federation";

interface FederationNameProps {
  address: string;
  truncate?: boolean;
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function FederationName({
  address,
  truncate = false,
}: FederationNameProps) {
  const [fedName, setFedName] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;

    resolveFederationName(address).then((name) => {
      if (!cancelled) setFedName(name);
    });

    return () => { cancelled = true; };
  }, [address]);

  const displayAddress = truncate ? truncateAddress(address) : address;

  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <span className="font-mono">{displayAddress}</span>
      {fedName && (
        <span
          className="text-green-600 dark:text-green-400 text-xs font-medium bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded"
          title={`Federation address: ${fedName}`}
          aria-label={`Federation name: ${fedName}`}
        >
          {fedName}
        </span>
      )}
    </span>
  );
}
