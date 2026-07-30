/**
 * PWA utilities: service worker registration and install prompt management.
 *
 * The install prompt is deferred until the user has engaged with the app for
 * at least MIN_ENGAGEMENT_MS (2 minutes), respecting the beforeinstallprompt
 * event so we never show it before the browser decides the app is installable.
 */

export const MIN_ENGAGEMENT_MS = 2 * 60 * 1_000; // 2 minutes

/** Registers the service worker. Safe to call on every page load. */
export async function registerServiceWorker(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    // Log only in dev — keep prod console clean.
    if (process.env.NODE_ENV === "development") {
      console.debug("[SW] registered:", reg.scope);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[SW] registration failed:", err);
    }
  }
}

// ── beforeinstallprompt capture ──────────────────────────────────────────────

type DeferredPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let _deferredPrompt: DeferredPromptEvent | null = null;
const _listeners = new Set<(e: DeferredPromptEvent | null) => void>();

/** Call once at app startup to capture the browser's install prompt event. */
export function captureDeferredPrompt(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // prevent automatic mini-infobar
    _deferredPrompt = e as DeferredPromptEvent;
    _listeners.forEach((fn) => fn(_deferredPrompt));
  });

  window.addEventListener("appinstalled", () => {
    _deferredPrompt = null;
    _listeners.forEach((fn) => fn(null));
  });
}

export function onInstallPromptChange(
  fn: (e: DeferredPromptEvent | null) => void,
): () => void {
  _listeners.add(fn);
  // Fire immediately with current value.
  fn(_deferredPrompt);
  return () => _listeners.delete(fn);
}

/** Trigger the browser's native install dialog. Returns the outcome. */
export async function triggerInstallPrompt(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!_deferredPrompt) return "unavailable";
  await _deferredPrompt.prompt();
  const { outcome } = await _deferredPrompt.userChoice;
  _deferredPrompt = null;
  _listeners.forEach((fn) => fn(null));
  return outcome;
}
