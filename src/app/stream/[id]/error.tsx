"use client";

import { RouteErrorFallback } from "@/components/RouteErrorFallback";

export default function StreamRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
      <RouteErrorFallback
        title="Stream details unavailable"
        description="We could not load this stream view. You can retry the request without reloading the whole app."
        error={error}
        onRetry={reset}
      />
    </div>
  );
}
