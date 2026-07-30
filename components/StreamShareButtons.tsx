"use client";

import { useCallback } from "react";
import { useToast } from "@/src/lib/toast";

interface StreamShareButtonsProps {
  /** Stream ID used to construct the deep-link URL. */
  streamId: string;
  /**
   * Optional share text prefix for Twitter/X and Telegram.
   * Defaults to "Check out this SoroStream payment stream!"
   */
  shareText?: string;
}

/**
 * StreamShareButtons
 *
 * Displays sharing options below stream metadata on the stream detail page:
 *   1. Copy Link  — copies the full deep-link URL to clipboard, shows a success toast.
 *   2. Twitter/X  — opens a pre-filled tweet in a new tab.
 *   3. Telegram   — opens the Telegram share dialog in a new tab.
 *   4. Share      — invokes the native Web Share API when available (mobile browsers);
 *                   falls back silently to clipboard copy when unavailable.
 *
 * All buttons are keyboard-accessible and include proper ARIA labels.
 */
export default function StreamShareButtons({
  streamId,
  shareText = "Check out this SoroStream payment stream!",
}: StreamShareButtonsProps) {
  const { addToast } = useToast();

  /** Build the full canonical URL for this stream. */
  const getStreamUrl = useCallback((): string => {
    if (typeof window === "undefined") return `/stream/${streamId}`;
    return `${window.location.origin}/stream/${streamId}`;
  }, [streamId]);

  // ── Copy Link ──────────────────────────────────────────────────────────────
  const handleCopyLink = useCallback(async () => {
    const url = getStreamUrl();

    // Modern Clipboard API
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      try {
        await navigator.clipboard.writeText(url);
        addToast("Link copied to clipboard!", "success");
        return;
      } catch {
        // Fall through to execCommand fallback
      }
    }

    // Legacy execCommand fallback
    try {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        addToast("Link copied to clipboard!", "success");
      } else {
        addToast("Could not copy — please copy the URL manually.", "error");
      }
    } catch {
      addToast("Could not copy — please copy the URL manually.", "error");
    }
  }, [getStreamUrl, addToast]);

  // ── Twitter/X ──────────────────────────────────────────────────────────────
  const handleTwitterShare = useCallback(() => {
    const url = getStreamUrl();
    const tweet = encodeURIComponent(`${shareText}\n${url}`);
    window.open(
      `https://twitter.com/intent/tweet?text=${tweet}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [getStreamUrl, shareText]);

  // ── Telegram ───────────────────────────────────────────────────────────────
  const handleTelegramShare = useCallback(() => {
    const url = getStreamUrl();
    const text = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(url);
    window.open(
      `https://t.me/share/url?url=${encodedUrl}&text=${text}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [getStreamUrl, shareText]);

  // ── Web Share API (native OS share sheet) ─────────────────────────────────
  const handleNativeShare = useCallback(async () => {
    const url = getStreamUrl();

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `SoroStream — Stream #${streamId}`,
          text: shareText,
          url,
        });
        // navigator.share resolves when the user completes or dismisses the
        // share sheet — we only show a toast on explicit success.
      } catch (err) {
        // AbortError means the user dismissed the share sheet — that's fine.
        if (err instanceof Error && err.name !== "AbortError") {
          addToast("Share failed. Try the copy button instead.", "error");
        }
      }
    } else {
      // Fallback: copy to clipboard on browsers/desktops without Web Share API
      await handleCopyLink();
    }
  }, [getStreamUrl, streamId, shareText, handleCopyLink, addToast]);

  /** Whether the native Web Share API is available in this environment. */
  const hasNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <section aria-labelledby="share-heading" className="print-hidden">
      <h2
        id="share-heading"
        className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3"
      >
        Share this stream
      </h2>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Share options">
        {/* ── Copy Link ── */}
        <button
          type="button"
          onClick={handleCopyLink}
          aria-label="Copy stream link to clipboard"
          className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white text-sm px-4 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          {/* Clipboard icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy Link
        </button>

        {/* ── Twitter / X ── */}
        <button
          type="button"
          onClick={handleTwitterShare}
          aria-label="Share on Twitter / X"
          className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 active:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          {/* X (Twitter) logo */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Twitter / X
        </button>

        {/* ── Telegram ── */}
        <button
          type="button"
          onClick={handleTelegramShare}
          aria-label="Share on Telegram"
          className="inline-flex items-center gap-2 bg-[#2AABEE] hover:bg-[#1a9fd4] active:bg-[#1390c0] text-white text-sm px-4 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2AABEE] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          {/* Telegram paper-plane icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          Telegram
        </button>

        {/* ── Native Share (shown on all; falls back to copy on desktop) ── */}
        <button
          type="button"
          onClick={handleNativeShare}
          aria-label={
            hasNativeShare ? "Share using device share menu" : "Copy link to clipboard"
          }
          className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white text-sm px-4 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          {/* Share / upload icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.51" />
          </svg>
          {hasNativeShare ? "Share" : "Share"}
        </button>
      </div>
    </section>
  );
}
