"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { formatUSDC, truncateAddress } from "@/src/lib/sorostream";
import { useSettings } from "@/src/context/SettingsContext";
import { useTranslations } from "@/src/lib/i18n";
import { formatDateWithTimezone } from "@/src/lib/timezone";

const PAGE_SIZE = 20;

export interface HistoryEntry {
  timestamp: string;
  type: "withdrawal" | "top-up" | "creation" | "cancellation";
  amount: string;
  txHash: string;
}

interface StreamHistoryProps {
  entries: HistoryEntry[];
  loading?: boolean;
}

const typeConfig: Record<
  HistoryEntry["type"],
  { labelKey: "history_created" | "history_withdrawal" | "history_top_up" | "history_cancelled"; icon: string; colorClass: string }
> = {
  creation: { labelKey: "history_created", icon: "◉", colorClass: "text-gray-400 bg-gray-800" },
  withdrawal: {
    labelKey: "history_withdrawal",
    icon: "↓",
    colorClass: "text-green-400 bg-green-900/30",
  },
  "top-up": { labelKey: "history_top_up", icon: "↑", colorClass: "text-blue-400 bg-blue-900/30" },
  cancellation: {
    labelKey: "history_cancelled",
    icon: "✕",
    colorClass: "text-red-400 bg-red-900/30",
  },
};

function formatDate(value: string, language: string): string {
  return formatDateWithTimezone(value, language);
}

export default function StreamHistory({ entries, loading }: StreamHistoryProps) {
  const t = useTranslations("common");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  let language = "en";
  try {
    const settings = useSettings();
    if (settings) language = settings.language;
  } catch {
    // fallback to "en" when context is not available (e.g. in tests)
  }

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [entries]);

  const loadMore = useCallback(() => {
    if (loadingMore || visibleCount >= entries.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, entries.length));
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, visibleCount, entries.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= entries.length) return;

    const observer = new IntersectionObserver(
      (observerEntries) => {
        if (observerEntries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, visibleCount, entries.length]);

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label={t("loading_history")}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4 border border-gray-700 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-700" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-700 rounded" />
                  <div className="h-3 w-32 bg-gray-700 rounded" />
                </div>
              </div>
              <div className="h-4 w-16 bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700">
        <p className="text-gray-400">{t("no_history_events")}</p>
      </div>
    );
  }

  const visibleEntries = entries.slice(0, visibleCount);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-400 px-1 mb-1">
        <span>Total Events</span>
        <span className="font-semibold text-gray-300">{entries.length}</span>
      </div>

      {visibleEntries.map((entry, idx) => {
        const config = typeConfig[entry.type] ?? typeConfig.creation;
        return (
          <div
            key={`${entry.txHash}-${idx}`}
            className={`rounded-lg p-4 border ${config.colorClass}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm">
                  {config.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{t(config.labelKey)}</p>
                  <p className="text-xs text-gray-400">{formatDate(entry.timestamp, language)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">
                  {entry.type === "creation"
                    ? formatUSDC(BigInt(entry.amount))
                    : `${entry.type === "top-up" ? "+" : "-"}${formatUSDC(BigInt(entry.amount))}`}
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  {truncateAddress(entry.txHash)}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {visibleCount < entries.length && (
        <div ref={sentinelRef} className="py-4 text-center">
          {loadingMore ? (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <svg className="animate-spin h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading more events…</span>
            </div>
          ) : (
            <button
              onClick={loadMore}
              className="text-xs text-green-400 hover:text-green-300 font-medium py-1 px-3 rounded bg-gray-800 border border-gray-700"
            >
              Load more
            </button>
          )}
        </div>
      )}

      {visibleCount >= entries.length && entries.length > 0 && (
        <p className="text-center text-xs text-gray-500 py-3 italic">
          You have reached the end of history events
        </p>
      )}
    </div>
  );
}
