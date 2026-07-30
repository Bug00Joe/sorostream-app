"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts, type ShortcutGroup } from "@/src/lib/useKeyboardShortcuts";
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";

interface GlobalShortcutsContextValue {
  openHelp: () => void;
  registerShortcuts: (groups: ShortcutGroup[]) => void;
  unregisterShortcuts: (groups: ShortcutGroup[]) => void;
  helpOpen: boolean;
}

const GlobalShortcutsContext = createContext<GlobalShortcutsContextValue | undefined>(undefined);

export function useGlobalShortcuts() {
  const ctx = useContext(GlobalShortcutsContext);
  if (!ctx) throw new Error("useGlobalShortcuts must be used within GlobalShortcutsProvider");
  return ctx;
}

const SEQUENCE_TIMEOUT_MS = 500;

/**
 * Key sequence tracker for multi-key shortcuts (e.g. G → D, G → S).
 * Returns true when a complete sequence is matched.
 */
function useKeySequence() {
  const bufferRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const clear = useCallback(() => {
    bufferRef.current = [];
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const checkSequence = useCallback(
    (key: string): "d" | "s" | "h" | null => {
      const lower = key.toLowerCase();
      const buf = bufferRef.current;

      if (lower === "g") {
        buf.push("g");
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(clear, SEQUENCE_TIMEOUT_MS);
        return null;
      }

      if (buf.length === 1 && buf[0] === "g") {
        clear();
        if (lower === "d") return "d";
        if (lower === "s") return "s";
        if (lower === "h") return "h";
        return null;
      }

      clear();
      return null;
    },
    [clear],
  );

  return { checkSequence, clearSequence: clear };
}

export function GlobalShortcutsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  const [pageGroups, setPageGroups] = useState<ShortcutGroup[]>([]);
  const { checkSequence, clearSequence } = useKeySequence();

  // Merge global shortcuts with page-specific groups for the help modal
  const allGroups: ShortcutGroup[] = useMemo(() => {
    const globalGroup: ShortcutGroup = {
      title: "Global",
      shortcuts: [
        { key: "d", description: "Go to Dashboard", action: () => {} },
        { key: "s", description: "Go to Streams", action: () => {} },
        { key: "h", description: "Go to Home", action: () => {} },
        { key: "n", description: "New stream", action: () => {} },
        { key: "/", description: "Open search", action: () => {} },
        { key: "?", shift: true, description: "Toggle keyboard shortcuts help", action: () => {} },
        { key: "Escape", description: "Close modals / clear state", action: () => {} },
      ].map((s) => ({
        ...s,
        action: () => {},
        ignoreWhenEditing: s.key !== "Escape",
      })),
    };
    // Track which global shortcuts have descriptions matching "Go to ..."
    // to produce the special label for G-chords
    const chordShortcuts = [
      { keys: "G then D", desc: "Go to Dashboard" },
      { keys: "G then S", desc: "Go to Streams" },
      { keys: "G then H", desc: "Go to Home" },
    ];
    const chordGroup: ShortcutGroup = {
      title: "Navigation (sequences)",
      shortcuts: chordShortcuts.map((c) => ({
        key: c.keys,
        description: c.desc,
        action: () => {},
      })),
    };
    return [globalGroup, chordGroup, ...pageGroups];
  }, [pageGroups]);

  // Global keyboard shortcuts
  const globalShortcuts: ShortcutGroup[] = useMemo(
    () => [
      {
        title: "_global",
        shortcuts: [
          {
            key: "n",
            description: "New stream",
            action: () => router.push("/stream/new"),
          },
          {
            key: "?",
            shift: true,
            description: "Toggle keyboard shortcuts help",
            action: () => setHelpOpen((v) => !v),
          },
          {
            key: "Escape",
            description: "Close help",
            action: () => {
              setHelpOpen(false);
              clearSequence();
            },
            ignoreWhenEditing: false,
          },
        ],
      },
    ],
    [router, clearSequence],
  );

  useKeyboardShortcuts(globalShortcuts);

  // Sequence handler (G D, G S, G H)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName ?? "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const seq = checkSequence(e.key);
      if (seq === "d") {
        e.preventDefault();
        router.push("/dashboard");
      } else if (seq === "s") {
        e.preventDefault();
        router.push("/stream/new");
      } else if (seq === "h") {
        e.preventDefault();
        router.push("/");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [checkSequence, router]);

  const openHelp = useCallback(() => setHelpOpen(true), []);

  const registerShortcuts = useCallback((groups: ShortcutGroup[]) => {
    setPageGroups((prev) => [...prev, ...groups]);
  }, []);

  const unregisterShortcuts = useCallback((groups: ShortcutGroup[]) => {
    setPageGroups((prev) => {
      const titles = new Set(groups.map((g) => g.title));
      return prev.filter((g) => !titles.has(g.title));
    });
  }, []);

  const value = useMemo(
    () => ({ openHelp, registerShortcuts, unregisterShortcuts, helpOpen }),
    [openHelp, registerShortcuts, unregisterShortcuts, helpOpen],
  );

  return (
    <GlobalShortcutsContext.Provider value={value}>
      {children}
      <KeyboardShortcutsHelp
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        groups={allGroups}
      />
    </GlobalShortcutsContext.Provider>
  );
}
