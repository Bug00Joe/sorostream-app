"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { StreamData } from "@/src/lib/sorostream";

interface PortfolioSummaryCardProps {
  streams: StreamData[];
  walletAddress: string | null;
}

const SECONDS_PER_MONTH = 2592000;

function formatMonthly(stroopsPerSecond: number): string {
  const monthly = (stroopsPerSecond * SECONDS_PER_MONTH) / 10_000_000;
  return monthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PortfolioSummaryCard({ streams, walletAddress }: PortfolioSummaryCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { outflow, inflow } = useMemo(() => {
    const active = streams.filter((s) => s.status === "Active");
    let out = 0;
    let inn = 0;
    for (const s of active) {
      if (walletAddress && s.sender.includes(walletAddress.slice(0, 5))) {
        out += s.flowRate;
      } else if (walletAddress && s.recipient.includes(walletAddress.slice(0, 5))) {
        inn += s.flowRate;
      } else {
        // fallback when no wallet — don't count
      }
    }
    return { outflow: out, inflow: inn };
  }, [streams, walletAddress]);

  const net = inflow - outflow;

  function applyFilter(type: "outflow" | "inflow" | "net") {
    const params = new URLSearchParams(searchParams.toString());
    // Toggle: if already set to this filter clear it
    if (params.get("flowFilter") === type) {
      params.delete("flowFilter");
    } else {
      params.set("flowFilter", type);
    }
    router.replace(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
      <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">
        Monthly Portfolio Summary
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {/* Outflow */}
        <button
          onClick={() => applyFilter("outflow")}
          className="flex flex-col items-start p-3 rounded-lg bg-gray-700/50 hover:bg-red-900/20 border border-transparent hover:border-red-700/40 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          title="Click to filter outgoing streams"
        >
          <span className="text-xs text-gray-400 mb-1">Monthly Outflow</span>
          <span className="text-lg font-bold text-red-400 font-mono">
            {outflow > 0 ? `-${formatMonthly(outflow)}` : "0.00"}
          </span>
        </button>

        {/* Inflow */}
        <button
          onClick={() => applyFilter("inflow")}
          className="flex flex-col items-start p-3 rounded-lg bg-gray-700/50 hover:bg-green-900/20 border border-transparent hover:border-green-700/40 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          title="Click to filter incoming streams"
        >
          <span className="text-xs text-gray-400 mb-1">Monthly Inflow</span>
          <span className="text-lg font-bold text-green-400 font-mono">
            {inflow > 0 ? `+${formatMonthly(inflow)}` : "0.00"}
          </span>
        </button>

        {/* Net */}
        <button
          onClick={() => applyFilter("net")}
          className="flex flex-col items-start p-3 rounded-lg bg-gray-700/50 hover:bg-blue-900/20 border border-transparent hover:border-blue-700/40 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title="Click to see net flow"
        >
          <span className="text-xs text-gray-400 mb-1">Net Monthly</span>
          <span
            className={`text-lg font-bold font-mono ${
              net > 0 ? "text-green-400" : net < 0 ? "text-red-400" : "text-gray-300"
            }`}
          >
            {net > 0
              ? `+${formatMonthly(net)}`
              : net < 0
              ? `-${formatMonthly(Math.abs(net))}`
              : "0.00"}
          </span>
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Based on active streams only. Values estimated over 30 days.
      </p>
    </div>
  );
}
