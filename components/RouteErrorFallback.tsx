"use client";

import { useEffect } from "react";

interface RouteErrorFallbackProps {
  title?: string;
  description?: string;
  error?: Error & { digest?: string };
  onRetry?: () => void;
}

export function RouteErrorFallback({
  title = "Something went wrong",
  description = "The page hit an unexpected error. You can retry this view without reloading the whole app.",
  error,
  onRetry,
}: RouteErrorFallbackProps) {
  useEffect(() => {
    if (error) {
      console.error("[RouteErrorFallback]", error);
    }
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-red-800/60 bg-red-950/40 px-6 py-8 text-center shadow-lg"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">Route error</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-3 text-sm text-gray-300">{description}</p>
      {error?.message ? (
        <p className="mt-3 max-w-md break-all rounded-lg bg-black/20 px-3 py-2 font-mono text-xs text-red-200">
          {error.message}
        </p>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
