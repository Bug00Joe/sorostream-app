/**
 * Web Vitals collection and reporting
 *
 * Collects Core Web Vitals (LCP, FID, CLS, TTFB, FCP, INP) using the
 * web-vitals package and reports them via navigator.sendBeacon to a
 * configurable endpoint.
 *
 * ## Wiring up a reporting endpoint
 *
 * 1. Set NEXT_PUBLIC_VITALS_ENDPOINT in your .env.local:
 *
 *      NEXT_PUBLIC_VITALS_ENDPOINT=https://your-api.example.com/vitals
 *
 * 2. The endpoint will receive POST requests with JSON bodies:
 *
 *      {
 *        "name": "LCP",
 *        "value": 1234.5,
 *        "rating": "good",
 *        "delta": 1234.5,
 *        "id": "v3-1234567890-1234567890",
 *        "navigationType": "navigate"
 *      }
 *
 * 3. If sendBeacon is unavailable (e.g. server-side), reporting is skipped
 *    silently and the value is still console-logged in development.
 *
 * ## Alert thresholds (per Google / web.dev)
 *
 * | Metric | Good        | Needs Improvement | Poor        |
 * |--------|-------------|-------------------|-------------|
 * | LCP    | ≤ 2500 ms   | ≤ 4000 ms         | > 4000 ms   |
 * | FID    | ≤ 100 ms    | ≤ 300 ms          | > 300 ms    |
 * | CLS    | ≤ 0.1       | ≤ 0.25            | > 0.25      |
 * | TTFB   | ≤ 800 ms    | ≤ 1800 ms         | > 1800 ms   |
 * | FCP    | ≤ 1800 ms   | ≤ 3000 ms         | > 3000 ms   |
 * | INP    | ≤ 200 ms    | ≤ 500 ms          | > 500 ms    |
 *
 * Set alerts on your analytics backend to fire when `rating === "poor"` for
 * any metric, or when the p75 value exceeds the "Needs Improvement" threshold.
 */

import type { Metric } from "web-vitals";

/** POST a single metric to the configured endpoint via sendBeacon */
function sendToEndpoint(metric: Metric): void {
  const endpoint = process.env.NEXT_PUBLIC_VITALS_ENDPOINT;
  if (!endpoint) return;

  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
  } else if (typeof fetch !== "undefined") {
    // Fallback for environments without sendBeacon
    fetch(endpoint, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {
      // Best-effort — don't let vitals reporting errors surface to users
    });
  }
}

function handleMetric(metric: Metric): void {
  // Always console-log in development so devs can see values locally
  if (process.env.NODE_ENV === "development") {
    const { name, value, rating } = metric;
    const formatted =
      name === "CLS" ? value.toFixed(4) : `${Math.round(value)} ms`;
    console.log(`[Web Vitals] ${name}: ${formatted} (${rating})`);
  }

  sendToEndpoint(metric);
}

/**
 * Register all web-vitals collectors.
 * Call once from a client component — dynamic import keeps this out of the
 * server bundle entirely.
 */
export async function registerVitals(): Promise<void> {
  const { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } = await import(
    "web-vitals"
  );

  onCLS(handleMetric);
  onFCP(handleMetric);
  onFID(handleMetric);
  onINP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);
}
