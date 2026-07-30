"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/src/lib/analytics";

/**
 * Tracks page views automatically when mounted
 */
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent({ type: 'page_view', page: pathname });
  }, [pathname]);

  return null;
}
