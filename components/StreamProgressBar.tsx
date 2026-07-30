"use client";

import { useMemo } from "react";
import type { StreamData } from "@/src/lib/sorostream";

interface StreamProgressBarProps {
  stream: StreamData;
}

export default function StreamProgressBar({ stream }: StreamProgressBarProps) {
  const { percentage, isCompleted, elapsedText } = useMemo(() => {
    const start = new Date(stream.startTime).getTime();
    const end = new Date(stream.endTime).getTime();
    const now = Date.now();

    const totalDuration = end - start;
    const elapsed = now - start;

    if (totalDuration <= 0) {
      return { percentage: 0, isCompleted: false, elapsedText: "0%" };
    }

    const rawPercentage = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
    const isCompleted = stream.status === "Ended" || stream.status === "Cancelled" || now >= end;
    const finalPercentage = isCompleted ? 100 : rawPercentage;

    return {
      percentage: finalPercentage,
      isCompleted,
      elapsedText: `${Math.round(finalPercentage)}%`,
    };
  }, [stream]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Progress</span>
        <span className={`font-medium ${isCompleted ? "text-green-400" : "text-white"}`}>
          {isCompleted ? "Completed" : elapsedText}
        </span>
      </div>
      <div
        className="relative h-3 bg-gray-700 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Stream progress: ${elapsedText}`}
      >
        <div
          className={`h-full transition-all duration-500 ease-out ${
            isCompleted ? "bg-green-500" : "bg-green-600"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">
        {isCompleted
          ? "Stream has finished"
          : `${Math.round(percentage)}% of total duration elapsed`}
      </p>
    </div>
  );
}
