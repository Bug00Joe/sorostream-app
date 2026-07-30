"use client";

import CopyButton from "@/components/CopyButton";
import FiatDisplay from "@/components/FiatDisplay";
import { truncateAddress, formatStellarAmount } from "@/src/lib/sorostream";
import FederationName from "@/components/FederationName";
import { useBookmarks } from "@/src/context/BookmarksContext";
import StreamTagChips from "@/components/StreamTagChips";

interface StreamCardProps {
  id?: string;
  sender?: string;
  recipient?: string;
  flowRate?: number;
  status?: string;
  deposit?: number;
  selected?: boolean;
  onToggle?: (id: string) => void;
  /** Unix timestamp (seconds). When set and > now, a "Scheduled" badge is shown. */
  scheduledStartTime?: number;
}

export default function StreamCard({
  id = "",
  sender = "",
  recipient = "",
  flowRate = 0,
  status = "Active",
  deposit = 0,
  selected = false,
  onToggle,
  scheduledStartTime,
}: StreamCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(id);

  const isScheduled =
    typeof scheduledStartTime === "number" &&
    scheduledStartTime > Math.floor(Date.now() / 1000);

  /** Convert stroops → XLM (display value). */
  const toXlm = (val: number) => (val / 10_000_000).toFixed(2);
  const flowXlm = flowRate / 10_000_000;
  const depositXlm = deposit / 10_000_000;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3 border ${
        selected ? "border-green-500" : "border-gray-200 dark:border-gray-700"
      }`}
      role="article"
      aria-label={`Stream ${id}`}
      aria-current={selected ? "true" : undefined}
    >
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-2">
          {onToggle && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggle(id)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 accent-green-500 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              aria-label={`Select stream ${id}`}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <span className="text-gray-500 dark:text-gray-400 text-xs">Stream #{id}</span>
          <CopyButton value={id} label="Copy stream ID" />
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); toggleBookmark(id); }}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark stream"}
            aria-pressed={bookmarked}
            className={`text-base leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded ${
              bookmarked ? "text-yellow-500 dark:text-yellow-400" : "text-gray-400 dark:text-gray-600 hover:text-yellow-500 dark:hover:text-yellow-400"
            }`}
          >
            {bookmarked ? "★" : "☆"}
          </button>
          {isScheduled && (
            <span
              className="text-xs px-2 py-1 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700 flex items-center gap-1"
              aria-label="Scheduled stream"
              title={`Starts ${new Date((scheduledStartTime ?? 0) * 1000).toLocaleString()}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" aria-hidden="true" />
              Scheduled
            </span>
          )}
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              status === "Active"
                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
            aria-label={`Status: ${status}`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="text-sm">
        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
          From:{" "}
          <span className="text-gray-900 dark:text-white">
            <FederationName address={sender} truncate />
          </span>
          <CopyButton value={sender} label="Copy sender address" />
        </p>
        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
          To:{" "}
          <span className="text-gray-900 dark:text-white">
            <FederationName address={recipient} truncate />
          </span>
          <CopyButton value={recipient} label="Copy recipient address" />
        </p>

        <p className="text-gray-600 dark:text-gray-400">
          Flow:{" "}
          <span className="text-green-600 dark:text-green-400">
            {toXlm(flowRate)} XLM/sec
            <FiatDisplay xlmAmount={flowXlm} />
          </span>
        </p>

        <p className="text-gray-600 dark:text-gray-400">
          Total:{" "}
          <span className="text-gray-900 dark:text-white">
            {toXlm(deposit)} XLM
            <FiatDisplay xlmAmount={depositXlm} />
          </span>
        </p>
      </div>

      {/* Tag chips */}
      <StreamTagChips streamId={id} />
    </div>
  );
}
