"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { StreamData } from "@/src/lib/sorostream";

interface StreamExpiryAlertsProps {
  streams: StreamData[];
  /** The wallet address of the current user (to identify received streams). */
  currentAddress: string;
}

const DISMISS_KEY = "sorostream-expiry-dismissed";

function getDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed as string[]);
  } catch {}
  return new Set();
}

function saveDismissed(ids: Set<string>): void {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

export default function StreamExpiryAlerts({ streams, currentAddress }: StreamExpiryAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => getDismissed());

  const now = Date.now();
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const TWENTY_FOUR_HOURS_MS = 24 * ONE_HOUR_MS;

  const alerts = useMemo(() => {
    return streams
      .filter((s) => {
        // Only received (not sent) streams for this user
        if (s.recipient !== currentAddress) return false;
        // Only active streams
        if (s.status !== "Active") return false;
        const endMs = new Date(s.endTime).getTime();
        // Don't show already expired streams
        if (endMs <= now) return false;
        // Only streams expiring within 24h
        return endMs - now <= TWENTY_FOUR_HOURS_MS;
      })
      .filter((s) => !dismissed.has(s.id))
      .map((s) => {
        const endMs = new Date(s.endTime).getTime();
        const msLeft = endMs - now;
        const isUrgent = msLeft <= ONE_HOUR_MS;
        const minutesLeft = Math.floor(msLeft / 60_000);
        const hoursLeft = Math.floor(msLeft / ONE_HOUR_MS);

        let timeLabel: string;
        if (minutesLeft < 60) {
          timeLabel = `${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}`;
        } else {
          timeLabel = `${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""}`;
        }

        return { stream: s, isUrgent, timeLabel };
      })
      .sort((a, b) => {
        const aEnd = new Date(a.stream.endTime).getTime();
        const bEnd = new Date(b.stream.endTime).getTime();
        return aEnd - bEnd; // most urgent first
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streams, currentAddress, dismissed]);

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-2" role="region" aria-label="Stream expiry alerts">
      {alerts.map(({ stream, isUrgent, timeLabel }) => (
        <div
          key={stream.id}
          role="alert"
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl px-4 py-3 border ${
            isUrgent
              ? "bg-red-900/40 border-red-700 text-red-200"
              : "bg-amber-900/40 border-amber-700 text-amber-200"
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            {/* Icon */}
            <span
              aria-hidden="true"
              className={`mt-0.5 shrink-0 text-lg ${isUrgent ? "text-red-400" : "text-amber-400"}`}
            >
              {isUrgent ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {isUrgent ? "⚠ Urgent:" : "⏰"} Stream #{stream.id} expires in{" "}
                <span className="font-bold">{timeLabel}</span>
              </p>
              <p className="text-xs opacity-80 mt-0.5 truncate">
                From{" "}
                <span className="font-mono">
                  {stream.sender.slice(0, 6)}…{stream.sender.slice(-4)}
                </span>{" "}
                · {(stream.deposit / 10_000_000).toFixed(2)} {stream.token}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/stream/${stream.id}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isUrgent
                  ? "bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-400"
                  : "bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-400"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Claim Now
            </Link>
            <button
              onClick={() => dismiss(stream.id)}
              aria-label={`Dismiss expiry alert for stream #${stream.id}`}
              className={`p-1.5 rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isUrgent
                  ? "hover:bg-red-700/50 text-red-300 focus-visible:ring-red-400"
                  : "hover:bg-amber-700/50 text-amber-300 focus-visible:ring-amber-400"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
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
      ))}
    </div>
  );
}
