"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { getMockStreams, getMockStreamHistory } from "@/src/lib/sorostream";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: "Stream" | "Transaction";
  href: string;
}

interface ResultGroup {
  category: SearchResult["category"];
  results: SearchResult[];
}

const DEBOUNCE_MS = 300;

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce input
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setSelectedIndex(-1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Build Fuse index from streams and history
  const fuse = useMemo(() => {
    const streams = getMockStreams();
    const streamItems = streams.map((s) => ({
      id: s.id,
      title: `${s.token} Stream — ${s.sender} → ${s.recipient}`,
      subtitle: `${s.status} · ${s.deposit / 10_000_000} ${s.token}`,
      category: "Stream" as const,
      href: `/stream/${s.id}`,
    }));

    const historyItems = streams.flatMap((s) => {
      const entries = getMockStreamHistory(s.id);
      // Do not index synthesised history entries — only real on-chain
      // events should appear in search results. The isMock flag identifies
      // entries that were generated client-side without a real txHash.
      const realEntries = entries.filter((e) => !e.isMock);
      return realEntries.map((e, i) => ({
        id: `${s.id}-history-${i}`,
        title: `${e.type} — ${e.amount ? Number(e.amount) / 10_000_000 : ""} ${s.token}`,
        subtitle: `${s.sender} → ${s.recipient} · ${new Date(e.timestamp).toLocaleDateString()}`,
        category: "Transaction" as const,
        href: `/stream/${s.id}`,
      }));
    });

    const allItems = [...streamItems, ...historyItems];
    return new Fuse(allItems, {
      keys: [
        { name: "title", weight: 2 },
        { name: "subtitle", weight: 1 },
      ],
      threshold: 0.4,
      minMatchCharLength: 1,
    });
    // Rebuild index when streams change — for now, static
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return fuse.search(debouncedQuery.trim()).slice(0, 20).map((r) => r.item);
  }, [debouncedQuery, fuse]);

  const grouped: ResultGroup[] = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const r of results) {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    }
    return Object.entries(groups).map(([category, items]) => ({
      category: category as SearchResult["category"],
      results: items,
    }));
  }, [results]);

  // Flatten results for keyboard navigation
  const flatResults = useMemo(
    () => grouped.flatMap((g) => g.results),
    [grouped],
  );

  const navigateTo = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      setDebouncedQuery("");
      setSelectedIndex(-1);
      router.push(href);
    },
    [router],
  );

  // Keyboard navigation within results dropdown
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < flatResults.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : flatResults.length - 1,
        );
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        navigateTo(flatResults[selectedIndex].href);
      } else if (e.key === "Escape") {
        if (query) {
          setQuery("");
        } else {
          setOpen(false);
          inputRef.current?.blur();
        }
      }
    },
    [flatResults, selectedIndex, navigateTo, query],
  );

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLElement>("[data-result-index]");
    items[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-global-search]")) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Open search on "/" keypress (from global shortcut)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const showDropdown = open && (query || results.length > 0);

  return (
    <div className="relative" data-global-search>
      <button
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        aria-label="Open search"
        title="Search streams and transactions (/)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span>Search</span>
        <kbd className="text-gray-500 dark:text-gray-600 border border-gray-300 dark:border-gray-700 rounded px-1 leading-none">
          /
        </kbd>
      </button>

      {showDropdown && (
        <div className="fixed inset-0 z-40 flex items-start justify-center pt-16 sm:pt-20">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-50 w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 mx-4 max-h-[70vh] flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-500 dark:text-gray-400 shrink-0"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search streams, transactions, addresses…"
                className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none"
                aria-label="Search streams and transactions"
                aria-autocomplete="list"
                aria-controls="global-search-results"
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            <div
              ref={listRef}
              id="global-search-results"
              className="overflow-y-auto p-2 space-y-1"
              role="listbox"
              aria-label="Search results"
            >
              {debouncedQuery.trim() && flatResults.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No results found for &quot;{debouncedQuery}&quot;</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                grouped.map((group) => (
                  <div key={group.category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {group.category}
                    </div>
                    {group.results.map((item, i) => {
                      const flatIndex = flatResults.indexOf(item);
                      return (
                        <ResultRow
                          key={item.id}
                          item={item}
                          selected={flatIndex === selectedIndex}
                          index={flatIndex}
                          onSelect={navigateTo}
                        />
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {flatResults.length > 0 && (
              <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <kbd className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1 rounded text-xs">↑↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1 rounded text-xs">Enter</kbd> Open
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1 rounded text-xs">Esc</kbd> Close
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultRow({
  item,
  selected,
  index,
  onSelect,
}: {
  item: SearchResult;
  selected: boolean;
  index: number;
  onSelect: (href: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && ref.current) {
      ref.current.scrollIntoView({ block: "nearest" });
    }
  }, [selected]);

  return (
    <div
      ref={ref}
      data-result-index={index}
      role="option"
      aria-selected={selected}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        selected
          ? "bg-green-700/40 text-white"
          : "text-gray-300 hover:bg-gray-700"
      }`}
      onClick={() => onSelect(item.href)}
      onMouseEnter={() => {
        // no-op, keyboard nav only
      }}
    >
      <CategoryIcon category={item.category} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
      </div>
      <span
        className={`text-xs px-1.5 py-0.5 rounded ${
          item.category === "Stream"
            ? "bg-blue-900/50 text-blue-300"
            : "bg-purple-900/50 text-purple-300"
        }`}
      >
        {item.category}
      </span>
    </div>
  );
}

function CategoryIcon({ category }: { category: SearchResult["category"] }) {
  if (category === "Stream") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-blue-400 shrink-0"
        aria-hidden="true"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-purple-400 shrink-0"
      aria-hidden="true"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
