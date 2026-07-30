"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import { useWallet } from "@/src/context/WalletContext";
import {
  getSnapshots,
  saveSnapshot,
  shouldSnapshot,
  type BalanceSnapshot,
} from "@/src/lib/balanceCache";

type TimeRange = "1D" | "7D" | "30D" | "90D" | "ALL";

const RANGE_MS: Record<TimeRange, number> = {
  "1D": 24 * 60 * 60 * 1000,
  "7D": 7 * 24 * 60 * 60 * 1000,
  "30D": 30 * 24 * 60 * 60 * 1000,
  "90D": 90 * 24 * 60 * 60 * 1000,
  ALL: Infinity,
};

interface ChartPoint {
  time: number;
  [asset: string]: number | string;
}

interface PortfolioSummary {
  startValue: number;
  endValue: number;
  absoluteChange: number;
  percentChange: number;
}

function formatAmount(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function computeSummary(
  points: ChartPoint[],
  asset: string
): PortfolioSummary | null {
  if (points.length < 2) return null;

  const start = points[0][asset];
  const end = points[points.length - 1][asset];

  if (typeof start !== "number" || typeof end !== "number") return null;

  const absoluteChange = end - start;
  const percentChange =
    start !== 0 ? (absoluteChange / Math.abs(start)) * 100 : 0;

  return { startValue: start, endValue: end, absoluteChange, percentChange };
}

const ASSET_COLORS: Record<string, string> = {
  XLM: "#22C55E",
  USDC: "#3B82F6",
};

export default function PortfolioChart() {
  const { address, balanceRefreshTrigger } = useWallet();
  const [range, setRange] = useState<TimeRange>("30D");
  const [snapshots, setSnapshots] = useState<BalanceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSnapshots = useCallback(async () => {
    if (!address) {
      setSnapshots([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getSnapshots(address);
      setSnapshots(data);
    } catch {
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void loadSnapshots();
  }, [loadSnapshots, balanceRefreshTrigger]);

  useEffect(() => {
    if (!address) return;
    const walletAddress = address;

    let cancelled = false;

    async function maybeSnapshot() {
      if (cancelled) return;

      const save = await shouldSnapshot(walletAddress);
      if (!save) return;

      try {
        const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet";
        const horizonUrl =
          network === "public" || network === "mainnet"
            ? "https://horizon.stellar.org"
            : network === "futurenet"
              ? "https://horizon-futurenet.stellar.org"
              : "https://horizon-testnet.stellar.org";

        const response = await fetch(
          `${horizonUrl}/accounts/${walletAddress}`
        );
        if (!response.ok) return;

        const payload = (await response.json()) as {
          balances?: {
            asset_type: string;
            asset_code?: string;
            balance: string;
          }[];
        };

        const balances: Record<string, number> = {};
        for (const balance of payload.balances ?? []) {
          const code =
            balance.asset_type === "native"
              ? "XLM"
              : balance.asset_code ?? "UNKNOWN";
          balances[code] = parseFloat(balance.balance);
        }

        if (Object.keys(balances).length > 0 && !cancelled) {
          await saveSnapshot({
            address: walletAddress,
            timestamp: new Date().toISOString(),
            balances,
          });
          void loadSnapshots();
        }
      } catch {
        // Ignore Horizon errors and keep the last rendered chart.
      }
    }

    void maybeSnapshot();
    const interval = setInterval(maybeSnapshot, 60 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [address, loadSnapshots]);

  const filteredPoints = useMemo(() => {
    const rangeMs = RANGE_MS[range];
    const cutoff = Date.now() - rangeMs;

    return snapshots
      .filter(
        (snapshot) =>
          rangeMs === Infinity ||
          new Date(snapshot.timestamp).getTime() >= cutoff
      )
      .map((snapshot) => {
        const point: ChartPoint = {
          time: new Date(snapshot.timestamp).getTime(),
        };
        for (const [asset, value] of Object.entries(snapshot.balances)) {
          point[asset] = value;
        }
        return point;
      })
      .sort((a, b) => a.time - b.time);
  }, [snapshots, range]);

  const assets = useMemo(() => {
    const set = new Set<string>();
    for (const point of filteredPoints) {
      for (const key of Object.keys(point)) {
        if (key !== "time") set.add(key);
      }
    }
    return Array.from(set);
  }, [filteredPoints]);

  const summaries = useMemo(() => {
    const result: Record<string, PortfolioSummary | null> = {};
    for (const asset of assets) {
      result[asset] = computeSummary(filteredPoints, asset);
    }
    return result;
  }, [assets, filteredPoints]);

  if (!address) {
    return null;
  }

  const ranges: TimeRange[] = ["1D", "7D", "30D", "90D", "ALL"];

  return (
    <section
      aria-labelledby="portfolio-chart-heading"
      className="bg-gray-800 rounded-xl p-4 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2
            id="portfolio-chart-heading"
            className="text-lg font-semibold text-white"
          >
            Portfolio Performance
          </h2>
          <p className="text-xs text-gray-400">
            Hourly snapshots of the connected wallet&apos;s balances.
          </p>
        </div>
        <div className="flex gap-1" role="radiogroup" aria-label="Time range">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              role="radio"
              aria-checked={range === r}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                range === r
                  ? "bg-green-700 border-green-600 text-white"
                  : "border-gray-700 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {assets.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-4">
          {assets.map((asset) => {
            const summary = summaries[asset];
            if (!summary) return null;
            const positive = summary.percentChange >= 0;

            return (
              <div key={asset} className="flex items-center gap-3 text-sm">
                <span className="text-gray-400">{asset}:</span>
                <span className="font-mono font-semibold text-white">
                  {formatAmount(summary.endValue)}
                </span>
                <span
                  className={`font-mono text-xs ${
                    positive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {positive ? "+" : ""}
                  {formatAmount(summary.absoluteChange)} (
                  {summary.percentChange.toFixed(2)}%)
                </span>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredPoints.length < 2 ? (
        <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
          <div className="text-center">
            <p>No balance data yet for this time range.</p>
            <p className="text-xs text-gray-500 mt-1">
              Snapshots are recorded hourly while the dashboard is open.
            </p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={filteredPoints}
            margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              tickFormatter={formatDate}
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatAmount}
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              width={60}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#F9FAFB",
                fontSize: "13px",
              }}
              labelFormatter={(label) => formatDate(label as number)}
              formatter={(value: unknown, name: unknown) => [
                `${formatAmount(Number(value))} ${String(name)}`,
                String(name),
              ]}
            />
            {assets.length > 1 && (
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "#9CA3AF" }}
              />
            )}
            {assets.map((asset) => (
              <Line
                key={asset}
                type="monotone"
                dataKey={asset}
                stroke={ASSET_COLORS[asset] ?? "#A855F7"}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: ASSET_COLORS[asset] ?? "#A855F7",
                }}
                name={asset}
              />
            ))}
            {filteredPoints.length > 0 && assets.length > 0 && (
              <ReferenceDot
                x={filteredPoints[filteredPoints.length - 1].time}
                y={
                  filteredPoints[filteredPoints.length - 1][
                    assets[0]
                  ] as number
                }
                r={6}
                fill={ASSET_COLORS[assets[0]] ?? "#22C55E"}
                stroke="#F9FAFB"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}

      <p className="text-xs text-gray-400 mt-2 text-center">
        Current balance snapshots are cached locally and expire after 90 days.
      </p>
    </section>
  );
}
