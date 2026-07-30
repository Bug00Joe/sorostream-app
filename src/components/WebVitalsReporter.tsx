"use client";

import { useEffect } from "react";
import { registerVitals } from "@/src/lib/vitals";

/**
 * Mounts web-vitals collectors on the client.
 * Renders nothing — purely a side-effect component.
 * Mount once inside RootLayout.
 */
export default function WebVitalsReporter() {
  useEffect(() => {
    registerVitals().catch((err) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[WebVitalsReporter] Failed to register vitals:", err);
      }
    });
  }, []);

  return null;
}
