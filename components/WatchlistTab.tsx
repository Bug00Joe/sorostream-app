"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { sorostream, claimableNow, getMockStream } from "@/src/lib/sorostream";

const STORAGE_KEY = "sorostream-watchlist";

interface WatchedStream {
  id: string;
  addedAt: string;
}

interface StreamInfo {
  id: string;
  status: string;
  claimable: string;
  endTime: string | null;
}

function loadWatchlist(): WatchedStream[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WatchedStream[]) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(list: WatchedStream[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function timeRemaining(endTimeIso: string): string {
  const ms = new Date(endTimeIso).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h remaining`;
  }
  return `${h}h ${m}m remaining`;
}

export default function WatchlistTab() {
  const [watchlist, setWatchlist] = useState<WatchedStream[]>([]);
  const [streamInfo, setStreamInfo] = useState<Record<string, StreamInfo>>({});
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setWatchlist(loadWatchlist());
  }, []);

  const fetchInfo = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const results: Record<string, StreamInfo> = {};
    for (const id of ids) {
      try {
        const stream = await sorostream.getStream(id);
        results[id] = {
          id,
          status: stream?.status ?? "Unknown",
          claimable: stream ? claimableNow(stream) : "0",
          endTime: stream?.endTime ?? null,
        };
      } catch {
        results[id] = { id, status: "Error", claimable: "0", endTime: null };
      }
    }
    setStreamInfo((prev) => ({ ...prev, ...results }));
  }, []);

  useEffect(() => {
    if (watchlist.length === 0) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    const ids = watchlist.map((w) => w.id);
    void fetchInfo(ids);
    pollRef.current = setInterval(() => void fetchInfo(ids), 10_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [watchlist, fetchInfo]);

  function handleAdd() {
    const id = input.trim();
    if (!id) { setInputError("Stream ID is required."); return; }
    if (watchlist.some((w) => w.id === id)) {
      setInputError("Already watching this stream.");
      return;
    }
    const next: WatchedStream[] = [...watchlist, { id, addedAt: new Date().toISOString() }];
    saveWatchlist(next);
    setWatchlist(next);
    setInput("");
    setInputError("");
  }

  function handleRemove(id: string) {
    const next = watchlist.filter((w) => w.id !== id);
    saveWatchlist(next);
    setWatchlist(next);
    setStreamInfo((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  function formatClaimable(raw: string): string {
    const n = parseInt(raw, 10);
    if (isNaN(n)) return "0.00";
    return (n / 10_000_000).toFixed(4);
  }

  return (
    <div className="space-y-4">
      {/* Add stream */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setInputError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          placeholder="Paste a stream ID to watch…"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          aria-label="Stream ID to watch"
          aria-describedby={inputError ? "watchlist-input-error" : undefined}
        />
        <button
          onClick={handleAdd}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          Watch
        </button>
      </div>
      {inputError && (
        <p id="watchlist-input-error" className="text-red-400 text-xs">{inputError}</p>
      )}

      <p className="text-xs text-gray-500">
        Watched streams update every 10 seconds. No wallet connection required.
      </p>

      {/* List */}
      {watchlist.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm">No streams watched yet.</p>
          <p className="text-gray-500 text-xs mt-1">Paste a stream ID above to start monitoring it.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {watchlist.map(({ id }) => {
            const info = streamInfo[id];
            return (
              <li key={id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-mono">#{id}</span>
                    {info && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          info.status === "Active"
                            ? "bg-green-900/40 text-green-400"
                            : info.status === "Ended"
                            ? "bg-gray-700 text-gray-400"
                            : info.status === "Cancelled"
                            ? "bg-red-900/30 text-red-400"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {info.status}
                      </span>
                    )}
                  </div>
                  {info ? (
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>Claimable: <span className="text-white font-mono">{formatClaimable(info.claimable)}</span></span>
                      {info.endTime && (
                        <span>{timeRemaining(info.endTime)}</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Loading…</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(id)}
                  className="text-gray-500 hover:text-red-400 text-xs transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
                  aria-label={`Remove stream ${id} from watchlist`}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
