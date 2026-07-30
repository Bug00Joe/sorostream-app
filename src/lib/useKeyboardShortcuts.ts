"use client";

import { useEffect, useCallback, type RefObject } from "react";

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
  /** If true, prevent default browser behavior. Defaults to true. */
  preventDefault?: boolean;
  /** Only trigger when a specific element is focused (e.g. search input). */
  targetRef?: RefObject<HTMLElement | null>;
  /** If set, only trigger when no input/textarea/select is focused (unless targetRef is set). */
  ignoreWhenEditing?: boolean;
}

export interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

export function useKeyboardShortcuts(groups: ShortcutGroup[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const group of groups) {
        for (const shortcut of group.shortcuts) {
          const ctrlOrMeta = e.ctrlKey || e.metaKey;
          if (
            e.key === shortcut.key &&
            !!shortcut.ctrl === ctrlOrMeta &&
            !!shortcut.alt === e.altKey &&
            !!shortcut.shift === e.shiftKey
          ) {
            if (shortcut.targetRef) {
              if (document.activeElement !== shortcut.targetRef.current) continue;
            } else if (shortcut.ignoreWhenEditing !== false) {
              const tag = document.activeElement?.tagName ?? "";
              if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") continue;
            }
            e.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    },
    [groups],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
