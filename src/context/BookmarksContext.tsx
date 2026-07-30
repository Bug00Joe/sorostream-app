"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useWallet } from "@/src/context/WalletContext";

const MAX_BOOKMARKS = 20;

interface BookmarksContextValue {
  bookmarkedIds: Set<string>;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => void;
}

const BookmarksContext = createContext<BookmarksContextValue | undefined>(undefined);

function storageKey(address: string | null): string | null {
  return address ? `sorostream-bookmarks-${address}` : null;
}

function loadBookmarks(address: string | null): Set<string> {
  const key = storageKey(address);
  if (!key || typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveBookmarks(address: string | null, ids: Set<string>): void {
  const key = storageKey(address);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore storage errors (private browsing, quota)
  }
}

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const { address } = useWallet();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setBookmarkedIds(loadBookmarks(address));
  }, [address]);

  const toggleBookmark = useCallback(
    (id: string) => {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (next.size >= MAX_BOOKMARKS) return prev;
          next.add(id);
        }
        saveBookmarks(address, next);
        return next;
      });
    },
    [address],
  );

  const isBookmarked = useCallback(
    (id: string) => bookmarkedIds.has(id),
    [bookmarkedIds],
  );

  const value = useMemo(
    () => ({ bookmarkedIds, isBookmarked, toggleBookmark }),
    [bookmarkedIds, isBookmarked, toggleBookmark],
  );

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error("useBookmarks must be used within BookmarksProvider");
  return ctx;
}
