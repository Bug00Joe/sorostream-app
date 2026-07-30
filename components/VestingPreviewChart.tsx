"use client";

import { useMemo } from "react";
import { useTheme } from "@/src/lib/theme";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { calculateVestingSchedule } from "@/src/lib/vestingSchedule";

interface VestingPreviewChartProps {
  amount: string; // in user-facing units (e.g., "100" for USDC)
  durationSeconds: number;
  cliffSeconds?: number;
  token?: string; // for display only
}

interface ChartPoint {
  time: string;
  vested: number;
  timestamp: number;
}

export default function VestingPreviewChart({
  amount,
  durationSeconds,
  cliffSeconds,
  token = "USDC",
}: VestingPreviewChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { chartData, totalAmount, startTime, endTime, cliffTime } = useMemo(() => {
    if (!amount || durationSeconds <= 0) {
      return { chartData: [], totalAmount: 0, startTime: 0, endTime: 0, cliffTime: 0 };
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { chartData: [], totalAmount: 0, startTime: 0, endTime: 0, cliffTime: 0 };
    }

    // Convert to stroops (assuming USDC/token with 7 decimals)
    const stroops = Math.floor(numAmount * 10_000_000);

    // Calculate time points
    const now = Math.floor(Date.now() / 1000);
    const start = now;
    const end = start + durationSeconds;
    const cliff = cliffSeconds ? start + cliffSeconds : 0;

    // Calculate vesting schedule
    const { points } = calculateVestingSchedule(
      stroops,
      start,
      end,
      cliff > start && cliff < end ? cliff : 0,
      30, // 30 data points for smooth curve
    );

    // Format points for display
    const formatted: ChartPoint[] = points.map((p) => ({
      time: new Date(p.time * 1000).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      vested: p.claimable / 10_000_000, // convert back to user-facing units
      timestamp: p.time,
    }));

    return {
      chartData: formatted,
      totalAmount: numAmount,
      startTime: start,
      endTime: end,
      cliffTime: cliff,
    };
  }, [amount, durationSeconds, cliffSeconds]);

  if (chartData.length === 0) {
    return null;
  }

  const formatAmount = (value: number) => {
    return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toFixed(2);
  };

  const cliffIndex = cliffTime > 0 ? chartData.findIndex((p) => p.timestamp >= cliffTime) : -1;

  return (
    <section
      aria-labelledby="vesting-preview-heading"
      className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full max-w-full overflow-hidden"
    >
      <h2
        id="vesting-preview-heading"
        className="text-lg font-semibold mb-4 text-gray-900 dark:text-white"
      >
        Vesting Preview
      </h2>

      <div className="w-full max-w-full overflow-hidden">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? "#374151" : "#e5e7eb"}
          />
          <XAxis
            dataKey="time"
            stroke={isDark ? "#9CA3AF" : "#6b7280"}
            tick={{ fill: isDark ? "#9CA3AF" : "#6b7280", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatAmount}
            stroke={isDark ? "#9CA3AF" : "#6b7280"}
            tick={{ fill: isDark ? "#9CA3AF" : "#6b7280", fontSize: 12 }}
            width={60}
            tickLine={false}
            label={{ value: token, angle: -90, position: "insideLeft", offset: 10 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1F2937" : "#ffffff",
              border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
              borderRadius: "8px",
              color: isDark ? "#F9FAFB" : "#111827",
              fontSize: "13px",
            }}
            labelFormatter={(label) => `${label}`}
            formatter={(value: any) => {
              const num = Number(value);
              return [`${num.toFixed(2)} ${token}`, "Vested"];
            }}
          />
          <Line
            type="monotone"
            dataKey="vested"
            stroke="#10B981"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#10B981" }}
            isAnimationActive={true}
          />

          {/* Cliff reference line */}
          {cliffTime > 0 && cliffIndex >= 0 && (
            <ReferenceLine
              x={chartData[cliffIndex].time}
              stroke="#F59E0B"
              strokeDasharray="5 5"
              strokeWidth={1}
              label={{
                value: "Cliff",
                position: "top",
                fill: "#F59E0B",
                fontSize: 12,
                fontWeight: "bold",
              }}
            />
          )}

          {/* End reference line */}
          <ReferenceLine
            x={chartData[chartData.length - 1].time}
            stroke="#8B5CF6"
            strokeDasharray="5 5"
            strokeWidth={1}
            label={{
              value: "End",
              position: "top",
              fill: "#8B5CF6",
              fontSize: 12,
              fontWeight: "bold",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>

      {/* Legend and info */}
      <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Cumulative vesting over time</span>
        </div>
        {cliffTime > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-px bg-amber-500" style={{ width: "12px" }} />
            <span>Cliff period ends here</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-3 h-px bg-purple-500" style={{ width: "12px" }} />
          <span>Linear vesting period ends</span>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Total Amount</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {totalAmount.toFixed(2)} {token}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Duration</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {(() => {
                if (durationSeconds >= 86400) {
                  const days = Math.floor(durationSeconds / 86400);
                  return `${days} day${days > 1 ? "s" : ""}`;
                }
                if (durationSeconds >= 3600) {
                  const hours = Math.floor(durationSeconds / 3600);
                  return `${hours} hour${hours > 1 ? "s" : ""}`;
                }
                const minutes = Math.floor(durationSeconds / 60);
                return `${minutes} min${minutes > 1 ? "s" : ""}`;
              })()}
            </p>
          </div>
          {cliffTime > 0 && (
            <div>
              <p className="text-gray-600 dark:text-gray-400">Cliff Duration</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {(() => {
                  if (cliffSeconds! >= 86400) {
                    const days = Math.floor(cliffSeconds! / 86400);
                    return `${days} day${days > 1 ? "s" : ""}`;
                  }
                  if (cliffSeconds! >= 3600) {
                    const hours = Math.floor(cliffSeconds! / 3600);
                    return `${hours} hour${hours > 1 ? "s" : ""}`;
                  }
                  const minutes = Math.floor(cliffSeconds! / 60);
                  return `${minutes} min${minutes > 1 ? "s" : ""}`;
                })()}
              </p>
            </div>
          )}
          <div>
            <p className="text-gray-600 dark:text-gray-400">Flow Rate</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {(totalAmount / (durationSeconds / 86400)).toFixed(4)} {token}/day
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
