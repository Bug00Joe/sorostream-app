"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "sorostream-delegates";

interface Delegate {
  address: string;
  addedAt: string;
  /** Stream IDs this delegate can manage (empty = all streams) */
  streamIds: string[];
}

function loadDelegates(): Delegate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Delegate[]) : [];
  } catch {
    return [];
  }
}

function saveDelegates(list: Delegate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function truncateAddr(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function DelegatesSection() {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setDelegates(loadDelegates());
  }, []);

  function validate(addr: string): string {
    if (!addr.trim()) return "Address is required.";
    if (!/^G[A-Z2-7]{55}$/.test(addr.trim()))
      return "Must be a valid Stellar public key (starts with G, 56 chars).";
    if (delegates.some((d) => d.address === addr.trim()))
      return "This address is already a delegate.";
    return "";
  }

  async function handleAdd() {
    const err = validate(input);
    if (err) { setInputError(err); return; }
    setAdding(true);
    // Simulate SDK call
    await new Promise((r) => setTimeout(r, 500));
    const next: Delegate[] = [
      ...delegates,
      { address: input.trim(), addedAt: new Date().toISOString(), streamIds: [] },
    ];
    saveDelegates(next);
    setDelegates(next);
    setInput("");
    setInputError("");
    setAdding(false);
  }

  function handleRevoke(address: string) {
    const next = delegates.filter((d) => d.address !== address);
    saveDelegates(next);
    setDelegates(next);
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 space-y-4 mb-8">
      <div>
        <h2 className="text-lg font-semibold">Delegation Management</h2>
        <p className="text-gray-400 text-sm mt-1">
          Grant other addresses the ability to manage your streams on your behalf.
        </p>
      </div>

      {/* Add delegate */}
      <div className="space-y-2">
        <label htmlFor="delegate-address" className="text-gray-200 text-sm font-medium block">
          Delegate Address
        </label>
        <div className="flex gap-2">
          <input
            id="delegate-address"
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setInputError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") void handleAdd(); }}
            placeholder="G… (Stellar public key)"
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            aria-invalid={!!inputError}
            aria-describedby={inputError ? "delegate-input-error" : undefined}
          />
          <button
            onClick={() => void handleAdd()}
            disabled={adding}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            {adding ? "Adding…" : "Add Delegate"}
          </button>
        </div>
        {inputError && (
          <p id="delegate-input-error" className="text-red-400 text-xs">{inputError}</p>
        )}
      </div>

      {/* Current delegates */}
      {delegates.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">No delegates added yet.</p>
      ) : (
        <ul className="space-y-2">
          {delegates.map((d) => (
            <li
              key={d.address}
              className="flex items-center gap-3 bg-gray-700/50 rounded-lg px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-mono truncate" title={d.address}>
                  {truncateAddr(d.address)}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {d.streamIds.length > 0
                    ? `Can manage streams: ${d.streamIds.join(", ")}`
                    : "Can manage all streams"}
                </p>
              </div>
              <button
                onClick={() => handleRevoke(d.address)}
                className="text-red-400 hover:text-red-300 text-sm px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
                aria-label={`Revoke delegate ${d.address}`}
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
