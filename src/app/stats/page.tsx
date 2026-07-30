"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from "recharts";
import { getProtocolStats, type ProtocolStats } from "@/src/lib/sorostream";

/** Auto-refresh interval in milliseconds. */
const POLL_INTERVAL_MS = 30_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function stroopsToDisplay(stroops: number): string {
  const val = stroops / 10_000_000;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(2)}K`;
  return val.toFixed(2);
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading protocol statistics">
      {/* Header */}
      <div className="h-8 bg-gray-700 rounded w-48 mb-2" />
      <div className="h-4 bg-gray-700 rounded w-72" />

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-5 space-y-3">
            <div className="h-3 bg-gray-700 rounded w-24" />
            <div className="h-7 bg-gray-600 rounded w-16" />
            <div className="h-12 bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sparkline ────────────────────────────────────────────────────────────────

interface SparklineProps {
  data: number[];
  color: string;
  label: string;
}

function Sparkline({ data, color, label }: SparklineProps) {
  const chartData = data.map((v, i) => ({ index: i, value: v }));
  return (
    <div aria-label={`${label} trend chart`} role="img">
      <ResponsiveContainer width="100%" height={48}>
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Tooltip
            content={() => null}
            cursor={false}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#grad-${color.replace("#", "")})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  subvalue?: string;
  sparkData?: number[];
  sparkColor?: string;
  icon: string;
}

function StatCard({ label, value, subvalue, sparkData, sparkColor = "#22c55e", icon }: StatCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">{icon}</span>
        <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      {subvalue && <p className="text-xs text-gray-500">{subvalue}</p>}
      {sparkData && sparkData.length > 1 && (
        <Sparkline data={sparkData} color={sparkColor} label={label} />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getProtocolStats();
      setStats(data);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError("Unable to fetch protocol statistics. Retrying…");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  // Polling: auto-refresh every 30 seconds without page reload
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchStats();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-gray-900 text-white p-4 sm:p-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
              >
                ← Home
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Protocol Statistics</h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time metrics from the SoroStream smart contract.
              No wallet required.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <p className="text-xs text-gray-500 tabular-nums">
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            <button
              onClick={() => { setLoading(true); void fetchStats(); }}
              disabled={loading}
              aria-label="Refresh statistics"
              className="inline-flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={loading ? "animate-spin" : ""}
                aria-hidden="true"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-2 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm"
          >
            <span aria-hidden="true">⚠️</span>
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !stats && <StatsSkeleton />}

        {/* Stats grid */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total Value Locked"
              value={`${stroopsToDisplay(stats.tvlStroops)} USDC`}
              subvalue={`${(stats.tvlStroops / 10_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`}
              sparkData={stats.tvlHistory}
              sparkColor="#22c55e"
              icon="💰"
            />
            <StatCard
              label="Active Streams"
              value={stats.activeStreams.toLocaleString()}
              sparkData={stats.activeStreamsHistory}
              sparkColor="#3b82f6"
              icon="🌊"
            />
            <StatCard
              label="Total Streams Created"
              value={stats.totalStreams.toLocaleString()}
              icon="📋"
            />
            <StatCard
              label="Total Withdrawn"
              value={`${stroopsToDisplay(stats.totalWithdrawnStroops)} USDC`}
              subvalue="All-time"
              icon="📤"
            />
            <StatCard
              label="Unique Senders"
              value={stats.uniqueSenders.toLocaleString()}
              icon="👤"
            />
            <StatCard
              label="Unique Recipients"
              value={stats.uniqueRecipients.toLocaleString()}
              icon="📬"
            />
          </div>
        )}

        {/* Polling indicator */}
        <p className="mt-8 text-center text-xs text-gray-600">
          Auto-refreshes every 30 seconds · Data from Soroban RPC + indexer
        </p>
      </div>
    </main>
  );
}
