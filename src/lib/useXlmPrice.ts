"use client";
/**
 * useXlmPrice — fetches and caches the XLM/USD price on the client.
 *
 * Returns:
 *   { price: number | null, loading: boolean }
 *
 * `price` is null only when the feed is genuinely unreachable.
 * The hook re-fetches every 5 minutes to stay fresh.
 */
import { useEffect, useState } from "react";
import { getXlmUsdPrice } from "./xlmPrice";

const REFRESH_INTERVAL_MS = 5 * 60 * 1_000;

export function useXlmPrice(): { price: number | null; loading: boolean } {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const p = await getXlmUsdPrice();
      if (!cancelled) {
        setPrice(p);
        setLoading(false);
      }
    }

    void refresh();

    const interval = setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { price, loading };
}
