"use client";
/**
 * ArchiveBanner — shown on the dashboard when there are archived streams.
 * Displays the count and links to /archive.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { getArchivedStreams } from "@/src/lib/sorostream";

export default function ArchiveBanner() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getArchivedStreams().length);
  }, []);

  if (count === 0) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-center justify-between gap-4 rounded-xl bg-gray-800 border border-gray-700 px-4 py-3 text-sm"
    >
      <span className="text-gray-300">
        <span className="font-semibold text-white">{count}</span> stream
        {count !== 1 ? "s have" : " has"} been moved to the archive.
      </span>
      <Link
        href="/archive"
        className="shrink-0 text-green-400 hover:text-green-300 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
      >
        View archive →
      </Link>
    </div>
  );
}
