"use client";

/**
 * FreighterInstallPrompt
 *
 * Shown in place of the Connect Wallet button when the Freighter browser
 * extension is not detected. Detects the user's browser and surfaces the
 * correct store link (Chrome Web Store or Firefox Add-ons), with a fallback
 * to both links for any other browser.
 *
 * Acceptance criteria:
 *  ✓ CTA shown when extension is not detected
 *  ✓ Links to Chrome Web Store / Firefox Add-ons with browser-detected correct link
 *  ✓ Short explanation copy explaining wallet purpose
 *  ✓ CTA replaced with Connect Wallet after extension is detected / installed
 */

/** Chrome Web Store listing for the Freighter extension. */
const CHROME_STORE_URL =
  "https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk";

/** Firefox Add-ons listing for the Freighter extension. */
const FIREFOX_ADDONS_URL =
  "https://addons.mozilla.org/en-US/firefox/addon/freighter/";

type BrowserHint = "chrome" | "firefox" | "other";

/** Best-effort UA sniff — only used to pre-select the install link. */
function detectBrowser(): BrowserHint {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  // Firefox must be checked before Chrome because some Firefox builds include
  // "chrome" in the UA string via compatibility shims.
  if (ua.includes("firefox") || ua.includes("fxios")) return "firefox";
  if (
    ua.includes("chrome") ||
    ua.includes("chromium") ||
    ua.includes("crios") ||
    ua.includes("edg/") ||
    ua.includes("brave")
  )
    return "chrome";
  return "other";
}

interface FreighterInstallPromptProps {
  /** Extra Tailwind classes to apply to the root element. */
  className?: string;
  /**
   * When `compact` is true the prompt renders in a smaller pill style,
   * matching the compact Connect button used in the NavHeader.
   */
  compact?: boolean;
}

export default function FreighterInstallPrompt({
  className = "",
  compact = false,
}: FreighterInstallPromptProps) {
  const browser = detectBrowser();

  // ── Compact (nav) variant ────────────────────────────────────────────────
  if (compact) {
    const href =
      browser === "firefox"
        ? FIREFOX_ADDONS_URL
        : browser === "chrome"
        ? CHROME_STORE_URL
        : CHROME_STORE_URL; // default to Chrome store for unknown browsers

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Install Freighter wallet extension"
        className={`inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${className}`}
      >
        {/* Wallet icon */}
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 12h2" />
          <path d="M2 7l5-4h10l5 4" />
        </svg>
        Install Freighter
      </a>
    );
  }

  // ── Full (standalone / modal) variant ────────────────────────────────────
  return (
    <div
      className={`rounded-xl border border-amber-500/40 bg-amber-950/30 dark:bg-amber-900/20 p-5 space-y-4 ${className}`}
      role="region"
      aria-label="Freighter wallet not detected"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Wallet icon */}
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400"
          aria-hidden="true"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 12h2" />
            <path d="M2 7l5-4h10l5 4" />
          </svg>
        </span>
        <div>
          <h3 className="text-sm font-semibold text-amber-300">
            Freighter wallet not detected
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-400">
            SoroStream uses{" "}
            <strong className="text-gray-200">Freighter</strong> — a free
            browser extension — to sign transactions directly from your Stellar
            account. No seed phrase is sent to our servers.
          </p>
        </div>
      </div>

      {/* Install CTA — browser-detected primary link */}
      {browser !== "other" ? (
        <a
          href={browser === "firefox" ? FIREFOX_ADDONS_URL : CHROME_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Install Freighter from the ${browser === "firefox" ? "Firefox Add-ons" : "Chrome Web Store"}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          {browser === "firefox" ? (
            /* Firefox logo mark */
            <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          ) : (
            /* Chrome / generic store icon */
            <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 3a7 7 0 1 1 0 14A7 7 0 0 1 12 5z" />
            </svg>
          )}
          Install Freighter for{" "}
          {browser === "firefox" ? "Firefox" : "Chrome"}
        </a>
      ) : (
        /* Unknown browser — show both links */
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-400">Choose your browser:</p>
          <div className="flex gap-2">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Install Freighter from the Chrome Web Store"
              className="flex-1 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-2 text-center text-xs font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              Chrome / Brave
            </a>
            <a
              href={FIREFOX_ADDONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Install Freighter from Firefox Add-ons"
              className="flex-1 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-2 text-center text-xs font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              Firefox
            </a>
          </div>
        </div>
      )}

      {/* Footer hint */}
      <p className="text-xs text-gray-500">
        After installing, refresh this page and click{" "}
        <strong className="text-gray-300">Connect Wallet</strong>.
      </p>
    </div>
  );
}
