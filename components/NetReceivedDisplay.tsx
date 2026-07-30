"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/src/lib/i18n";
import { getFeeConfig, calcWithdrawBreakdown } from "@/src/lib/sorostream";

interface NetReceivedDisplayProps {
  amount: string;
  tokenSymbol: string;
  isCustomToken?: boolean;
}

/**
 * Displays the net amount the recipient will receive after protocol fees.
 * Automatically fetches current fee configuration from the contract.
 */
export default function NetReceivedDisplay({
  amount,
  tokenSymbol,
  isCustomToken = false,
}: NetReceivedDisplayProps) {
  const t = useTranslations("stream_new");
  const [feeBasisPoints, setFeeBasisPoints] = useState<number>(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState(false);

  // Load fee config when amount changes or on mount
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setFeeBasisPoints(0);
      return;
    }

    let active = true;
    setFeeLoading(true);
    setFeeError(false);

    getFeeConfig()
      .then(({ basisPoints }) => {
        if (active) {
          setFeeBasisPoints(basisPoints);
        }
      })
      .catch(() => {
        if (active) {
          setFeeError(true);
          setFeeBasisPoints(0);
        }
      })
      .finally(() => {
        if (active) setFeeLoading(false);
      });

    return () => {
      active = false;
    };
  }, [amount]);

  // Calculate net amount
  const amountNum = parseFloat(amount) || 0;
  if (amountNum <= 0) {
    return null;
  }

  const amountStroops = Math.round(amountNum * 10_000_000);
  const { fee, net, feePercent } = calcWithdrawBreakdown(
    amountStroops,
    feeBasisPoints
  );

  const netDisplay = (net / 10_000_000)
    .toFixed(7)
    .replace(/\.?0+$/, "");
  const feeDisplay = (fee / 10_000_000)
    .toFixed(7)
    .replace(/\.?0+$/, "") || "0";
  const tokenLabel = isCustomToken ? "tokens" : tokenSymbol;

  return (
    <div className="mt-3 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-blue-300 text-sm font-medium">
          {t("net_received_label")}
        </span>
        {feeLoading ? (
          <span className="text-gray-400 text-sm animate-pulse">Loading…</span>
        ) : feeError ? (
          <span className="text-gray-400 text-sm italic">Fee config unavailable</span>
        ) : (
          <span className="text-blue-200 font-mono text-sm font-medium">
            {netDisplay} {tokenLabel}
          </span>
        )}
      </div>
      <div className="text-xs text-blue-400/70">
        {feeError ? (
          "Could not load fee information"
        ) : (
          <>
            {t("net_received_fee_desc", { fee_percent: feePercent.toString() })}
            {feeDisplay !== "0" && ` (${feeDisplay} ${tokenLabel} fee)`}
          </>
        )}
      </div>
    </div>
  );
}
