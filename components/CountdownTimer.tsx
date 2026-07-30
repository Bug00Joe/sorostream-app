"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  endTime: Date | string;
}

function computeRemaining(endTime: Date | string) {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: false,
  };
}

export default function CountdownTimer({ endTime }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() => computeRemaining(endTime));

  useEffect(() => {
    setRemaining(computeRemaining(endTime));
    const interval = setInterval(() => {
      setRemaining(computeRemaining(endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (remaining.expired) {
    return (
      <div className="text-center">
        <p className="text-gray-400 text-sm mb-1">Time Remaining</p>
        <p className="text-red-400 font-mono text-lg font-semibold">Stream ended</p>
      </div>
    );
  }

  const parts: { label: string; value: number }[] = [
    { label: "days", value: remaining.days },
    { label: "hrs", value: remaining.hours },
    { label: "min", value: remaining.minutes },
    { label: "sec", value: remaining.seconds },
  ];

  return (
    <div className="text-center">
      <p className="text-gray-400 text-sm mb-2">Time Remaining</p>
      <div className="flex items-center justify-center gap-3 font-mono" role="timer" aria-label="Time remaining">
        {parts.map((p, i) => (
          <span key={p.label} className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold tabular-nums text-green-400">
              {String(p.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-gray-400">{p.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
