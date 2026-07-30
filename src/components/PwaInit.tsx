"use client";
/**
 * PwaInit — mounts once in the root layout.
 * Registers the service worker and captures the beforeinstallprompt event.
 * Renders nothing — side-effects only.
 */
import { useEffect } from "react";
import { registerServiceWorker, captureDeferredPrompt } from "@/src/lib/pwa";

export default function PwaInit() {
  useEffect(() => {
    void registerServiceWorker();
    captureDeferredPrompt();
  }, []);

  return null;
}
