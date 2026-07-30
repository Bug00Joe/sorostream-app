"use client";

import { useRef } from "react";
import type { ShortcutGroup } from "@/src/lib/useKeyboardShortcuts";
import { useFocusTrap } from "@/src/lib/useFocusTrap";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
  groups: ShortcutGroup[];
}

export default function KeyboardShortcutsHelp({
  open,
  onClose,
  groups,
}: KeyboardShortcutsHelpProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, open);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-help-title"
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 space-y-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="shortcuts-help-title" className="text-lg font-semibold text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close keyboard shortcuts help"
          >
            &times;
          </button>
        </div>

        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            <div className="space-y-2">
              {group.shortcuts.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{shortcut.description}</span>
                  <kbd className="inline-flex items-center gap-1 bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded font-mono">
                    {shortcut.ctrl && <span className="text-[10px]">⌘</span>}
                    {shortcut.alt && <span className="text-[10px]">⌥</span>}
                    {shortcut.shift && <span className="text-[10px]">⇧</span>}
                    {shortcut.key.includes(" ") ? (
                      <span>{shortcut.key}</span>
                    ) : (
                      <span className="uppercase">
                        {shortcut.key === " " ? "Space" : shortcut.key}
                      </span>
                    )}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="text-xs text-gray-500 text-center pt-2">
          Press <kbd className="bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded font-mono text-xs">?</kbd> to toggle this help at any time.
        </p>
      </div>
    </div>
  );
}
