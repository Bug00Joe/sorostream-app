/**
 * SoroStream Service Worker
 *
 * Strategy:
 *   - App shell (HTML, JS, CSS, icons, manifest): Cache-first with network fallback.
 *   - API / RPC calls (soroban RPC, coingecko, stellar.expert): Network-first, no cache.
 *   - Offline fallback: serve the cached root "/" when a navigation fails.
 */

const CACHE_NAME = "sorostream-v1";

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

/** URLs that should always go to the network (never cached). */
const NETWORK_ONLY_PATTERNS = [
  /soroban.*\.stellar\.org/,
  /coingecko\.com/,
  /stellar\.expert/,
  /api\./,
];

function isNetworkOnly(url) {
  return NETWORK_ONLY_PATTERNS.some((re) => re.test(url));
}

// ── Install: pre-cache app shell ────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate: purge old caches ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch: cache-first for assets, network-first for API ────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  // Only handle GET requests.
  if (request.method !== "GET") return;

  // Never cache RPC/API calls.
  if (isNetworkOnly(url)) return;

  // Navigation requests: try network, fall back to cached "/".
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/")),
    );
    return;
  }

  // Static assets: cache-first.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          // Cache only successful same-origin responses.
          if (
            response.ok &&
            response.type === "basic" &&
            !isNetworkOnly(url)
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }),
    ),
  );
});
