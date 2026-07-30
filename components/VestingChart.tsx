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
  ReferenceDot,
  CartesianGrid,
} from "recharts";
import type { StreamData } from "@/src/lib/sorostream";
import type { StreamHistoryEntry } from "@/src/lib/export";

interface VestingChartProps {
  stream: StreamData;
  history: StreamHistoryEntry[];
}

interface ChartPoint {
  time: number;
  vested: number;
}

export default function VestingChart({ stream, history }: VestingChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { chartData, nowTime, deposit, flowRate, startTime, endTime } = useMemo(() => {
    const start = new Date(stream.startTime).getTime();
    const end = new Date(stream.endTime).getTime();
    const flow = Number(stream.flowRate);
    const dep = Number(stream.deposit);
    const now = Date.now();
    const numPoints = 30;
    const points: ChartPoint[] = [];
    for (let i = 0; i < numPoints; i++) {
      const t = start + (end - start) * (i / (numPoints - 1));
      const elapsedSeconds = Math.max(0, (t - start) / 1000);
      const vested = Math.min(flow * elapsedSeconds, dep);
      points.push({ time: t, vested });
    }
    return { chartData: points, nowTime: now, deposit: dep, flowRate: flow, startTime: start, endTime: end };
  }, [stream]);

  const fmtDate = (ms: number) =>
    new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const fmtAmount = (v: number) => (v / 10_000_000).toFixed(2);

  const withdrawalEvents = useMemo(
    () => history.filter((e) => e.type === "withdrawal"),
    [history],
  );

  const nowElapsed = Math.max(0, (nowTime - startTime) / 1000);
  const nowVested = Math.min(flowRate * nowElapsed, deposit);

  return (
    <section aria-labelledby="vesting-chart-heading" className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      <h2 id="vesting-chart-heading" className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Vesting Curve
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
          <XAxis
            dataKey="time"
            tickFormatter={fmtDate}
            stroke={isDark ? "#9CA3AF" : "#6b7280"}
            tick={{ fill: isDark ? "#9CA3AF" : "#6b7280", fontSize: 12 }}
            domain={[startTime, endTime]}
            type="number"
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtAmount}
            stroke={isDark ? "#9CA3AF" : "#6b7280"}
            tick={{ fill: isDark ? "#9CA3AF" : "#6b7280", fontSize: 12 }}
            width={60}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1F2937" : "#ffffff",
              border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
              borderRadius: "8px",
              color: isDark ? "#F9FAFB" : "#111827",
              fontSize: "13px",
            }}
            labelFormatter={(label) => fmtDate(label as number)}
            formatter={(value: any) => [`${fmtAmount(Number(value))} USDC`, "Vested"]}
          />
          <Line
            type="monotone"
            dataKey="vested"
            stroke="#22C55E"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#22C55E" }}
          />
          {withdrawalEvents.map((event, idx) => {
            const t = new Date(event.timestamp).getTime();
            return (
              <ReferenceLine
                key={`withdrawal-${idx}`}
                x={t}
                stroke="#EF4444"
                strokeDasharray="4 4"
                label={{
                  value: `${fmtAmount(Number(event.amount))}`,
                  position: "top",
                  fill: "#EF4444",
                  fontSize: 10,
                }}
              />
            );
          })}
          <ReferenceDot
            x={nowTime}
            y={nowVested}
            r={6}
            fill="#22C55E"
            stroke={isDark ? "#F9FAFB" : "#ffffff"}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        &#x25CF; Current position &mdash; Dashed red lines indicate withdrawals
      </p>
    </section>
  );
}
