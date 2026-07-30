"use client";

import { useState, useCallback } from "react";

interface CopyButtonProps {
  value: string;
  label?: string;
}

/**
 * Attempts to copy `text` using the modern Clipboard API when available and
 * permitted.  Falls back to the legacy execCommand approach for browsers that
 * block navigator.clipboard (e.g. Firefox in certain permission contexts).
 * Returns true on success, false when neither method is available.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  // Modern async Clipboard API — requires a secure context and user permission.
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or API unavailable — fall through to execCommand.
    }
  }

  // Legacy execCommand fallback (works in Firefox without clipboard permission).
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    // Keep the element off-screen so it doesn't affect layout or scroll.
    textarea.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

export default function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Neither API worked — prompt the user to copy manually.
      setFailed(true);
      setTimeout(() => setFailed(false), 3000);
    }
  }, [value]);

  const ariaLabel = copied ? "Copied" : failed ? "Copy failed — copy manually" : label;

  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors shrink-0"
      aria-label={ariaLabel}
      title={failed ? `Copy manually: ${value}` : undefined}
    >
      {copied ? (
        /* Success: checkmark */
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : failed ? (
        /* Failed: warning icon — user should copy manually via the tooltip */
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600 dark:text-yellow-400">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ) : (
        /* Default: clipboard icon */
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}
