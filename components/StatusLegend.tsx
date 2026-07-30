"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "sorostream-legend-open";

const STATUSES = [
  {
    name: "Active",
    symbol: "●",
    colorClass: "bg-green-900 text-green-400",
    description: "Stream is live and funds are flowing to the recipient.",
  },
  {
    name: "Ended",
    symbol: "■",
    colorClass: "bg-gray-700 text-gray-400",
    description: "Stream reached its end date and is no longer active.",
  },
  {
    name: "Cancelled",
    symbol: "✕",
    colorClass: "bg-gray-700 text-gray-400",
    description: "Stream was cancelled before completing.",
  },
];

export default function StatusLegend() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setOpen(JSON.parse(stored) as boolean);
    } catch {
      // ignore
    }
  }, []);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className="mb-4 bg-gray-800 rounded-xl border border-gray-700">
      <button
        onClick={toggle}
        aria-expanded={open}
        aria-controls="status-legend-panel"
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-200 hover:bg-gray-700/50 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="text-green-400">◉</span>
          Stream Status Legend
        </span>
        <span
          aria-hidden="true"
          className="text-gray-400 transition-transform duration-200"
          style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <dl id="status-legend-panel" className="px-4 pb-4 flex flex-wrap gap-4">
          {STATUSES.map(({ name, symbol, colorClass, description }) => (
            <div key={name} className="flex items-start gap-3 min-w-[180px] flex-1">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${colorClass}`}
                aria-hidden="true"
              >
                {symbol} {name}
              </span>
              <div>
                <dt className="sr-only">{name}</dt>
                <dd className="text-xs text-gray-400 leading-snug">{description}</dd>
              </div>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
