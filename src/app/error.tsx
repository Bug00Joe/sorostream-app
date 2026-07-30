"use client";

import { RouteErrorFallback } from "@/components/RouteErrorFallback";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-6 text-center">
        <RouteErrorFallback
          title="Something went wrong"
          description="The app hit an unexpected error. You can retry this view without reloading the browser."
          error={error}
          onRetry={reset}
        />
      </body>
    </html>
  );
}
