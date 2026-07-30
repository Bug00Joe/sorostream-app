"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  sorostream,
  claimableNow,
  getMockStream,
  type StreamData,
} from "@/src/lib/sorostream";

/** Auto-refresh interval in ms. */
const REFRESH_INTERVAL_MS = 30_000;

type Theme = "light" | "dark";
type ShowMode = "claimable" | "progress" | "both";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toXlm(stroops: number, decimals = 4) {
  return (stroops / 10_000_000).toFixed(decimals);
}

function streamProgress(stream: StreamData): number {
  const start = new Date(stream.startTime).getTime();
  const end = new Date(stream.endTime).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function EmbedSkeleton({ theme }: { theme: Theme }) {
  const bg = theme === "dark" ? "bg-gray-800" : "bg-gray-100";
  const bar = theme === "dark" ? "bg-gray-700" : "bg-gray-300";
  return (
    <div className={`${bg} animate-pulse rounded-xl p-4 space-y-3`} aria-label="Loading stream widget">
      <div className={`h-3 ${bar} rounded w-24`} />
      <div className={`h-5 ${bar} rounded w-16`} />
      <div className={`h-2 ${bar} rounded`} />
    </div>
  );
}

// ── Widget card ───────────────────────────────────────────────────────────────

interface EmbedWidgetProps {
  stream: StreamData;
  theme: Theme;
  show: ShowMode;
}

function EmbedWidget({ stream, theme, show }: EmbedWidgetProps) {
  const isDark = theme === "dark";

  const claimableStroops = Number(claimableNow(stream));
  const progress = streamProgress(stream);

  const cardBg = isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const progressBg = isDark ? "bg-gray-700" : "bg-gray-200";
  const progressFill = "bg-green-500";
  const linkColor = isDark ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-700";

  return (
    <div
      className={`${cardBg} border rounded-xl p-4 space-y-3 shadow-sm font-sans text-sm`}
      role="region"
      aria-label={`SoroStream stream ${stream.id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wide ${textSecondary}`}>
          SoroStream
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            stream.status === "Active"
              ? "bg-green-900/40 text-green-400 border border-green-800"
              : "bg-gray-700 text-gray-400 border border-gray-600"
          }`}
        >
          {stream.status}
        </span>
      </div>

      <div className={`font-mono text-xs ${textSecondary} truncate`}>
        Stream #{stream.id}
      </div>

      {/* Claimable balance */}
      {(show === "claimable" || show === "both") && (
        <div>
          <p className={`text-xs mb-0.5 ${textSecondary}`}>Claimable now</p>
          <p className={`text-xl font-bold tabular-nums ${textPrimary}`}>
            {toXlm(claimableStroops)} USDC
          </p>
        </div>
      )}

      {/* Progress bar */}
      {(show === "progress" || show === "both") && (
        <div>
          <div className="flex justify-between mb-1">
            <span className={`text-xs ${textSecondary}`}>Progress</span>
            <span className={`text-xs font-mono ${textPrimary}`}>{progress}%</span>
          </div>
          <div
            className={`w-full ${progressBg} rounded-full overflow-hidden`}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Stream ${progress}% complete`}
          >
            <div
              className={`${progressFill} h-2 rounded-full transition-all duration-700`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={`flex justify-between mt-1 text-[10px] ${textSecondary}`}>
            <span>Start: {new Date(stream.startTime).toLocaleDateString()}</span>
            <span>End: {new Date(stream.endTime).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      {/* Footer link */}
      <a
        href={`/stream/${stream.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-xs ${linkColor} transition-colors`}
      >
        View on SoroStream ↗
      </a>
    </div>
  );
}

// ── Live widget wrapper (polls every 30s) ─────────────────────────────────────

function LiveEmbedWidget({ id, theme, show }: { id: string; theme: Theme; show: ShowMode }) {
  const [stream, setStream] = useState<StreamData | null>(() => getMockStream(id));
  const [loading, setLoading] = useState(!getMockStream(id));
  const [notFound, setNotFound] = useState(false);

  const fetchStream = useCallback(async () => {
    try {
      const data = await sorostream.getStream(id);
      if (!data) { setNotFound(true); return; }
      setStream(data);
    } catch {
      // silently keep previous data on refresh errors
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchStream();
    const interval = setInterval(() => void fetchStream(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStream]);

  if (loading) return <EmbedSkeleton theme={theme} />;
  if (notFound || !stream) {
    const bg = theme === "dark" ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-500";
    return (
      <div className={`${bg} border rounded-xl p-4 text-xs text-center`}>
        Stream not found.
      </div>
    );
  }

  return <EmbedWidget stream={stream} theme={theme} show={show} />;
}

// ── Page (bare — no nav/footer/wallet bar) ────────────────────────────────────

function EmbedPageContent({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();

  const rawTheme = searchParams.get("theme");
  const theme: Theme = rawTheme === "light" ? "light" : "dark";

  const rawShow = searchParams.get("show");
  const show: ShowMode =
    rawShow === "claimable" ? "claimable" :
    rawShow === "progress"  ? "progress"  : "both";

  const isDark = theme === "dark";

  return (
    <div className={`${isDark ? "dark" : ""} p-3`}>
      <LiveEmbedWidget id={params.id} theme={theme} show={show} />
    </div>
  );
}

export default function EmbedStreamPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<EmbedSkeleton theme="dark" />}>
      <EmbedPageContent params={params} />
    </Suspense>
  );
}
