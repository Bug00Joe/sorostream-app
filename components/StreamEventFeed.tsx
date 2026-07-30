"use client";

import { useEffect, useRef, useState } from "react";
import { sorostream, simulateNewEvent, truncateAddress, type StreamEvent } from "@/src/lib/sorostream";

const typeConfig: Record<StreamEvent["type"], { label: string; icon: string; color: string }> = {
  creation: { label: "New Stream", icon: "◉", color: "text-gray-400" },
  withdrawal: { label: "Withdrawal", icon: "↓", color: "text-green-400" },
  "top-up": { label: "Top-up", icon: "↑", color: "text-blue-400" },
  cancellation: { label: "Cancelled", icon: "✕", color: "text-red-400" },
  alert: { label: "Alert", icon: "⚠", color: "text-yellow-400" },
};

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function StreamEventFeed() {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await sorostream.getEvents();
        setEvents(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = simulateNewEvent();
      setEvents((prev) => [newEvent, ...prev].slice(0, 50));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [events, autoScroll]);

  const handleScroll = () => {
    if (!feedRef.current) return;
    const { scrollTop } = feedRef.current;
    setAutoScroll(scrollTop < 50);
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          Live Events
        </h2>
        <span className="text-[10px] text-gray-400">auto-updates</span>
      </div>
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="overflow-y-auto max-h-80 space-y-1 p-2"
        role="log"
        aria-live="polite"
        aria-label="Stream event feed"
      >
        {loading ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-700" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-24 bg-gray-700 rounded" />
                  <div className="h-2 w-16 bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No events yet</p>
        ) : (
          events.map((event) => {
            const config = typeConfig[event.type];
            return (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-700/50 transition-colors"
              >
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs ${config.color}`}>
                  {config.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">
                    <span className="font-medium">{config.label}</span>
                    <span className="text-gray-400"> on Stream #{event.streamId}</span>
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {event.amount ? `${truncateAddress(event.txHash)} · ${formatRelativeTime(event.timestamp)}` : formatRelativeTime(event.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
