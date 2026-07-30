"use client";

import React, { Component, ReactNode } from "react";
import { trackEvent } from "@/src/lib/analytics";

interface Props {
  /** Label shown in the error UI, e.g. "Stream Details", "Transaction History" */
  section: string;
  children: ReactNode;
  /** Optional key that, when changed, resets the boundary (e.g. pass the route param) */
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Per-section error boundary for the stream detail page.
 *
 * Wrap each independent section so a single rendering failure doesn't
 * crash the entire page. Reports errors to the console and to analytics
 * (when the analytics module is initialised).
 */
export class StreamErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const { section } = this.props;

    // Always surface the error in the console with full stack context.
    console.error(`[StreamErrorBoundary] Section "${section}" threw:`, error, info.componentStack);

    // Best-effort analytics report — silently skipped if not initialised.
    try {
      trackEvent({ type: "page_view", page: `error:stream:${section.toLowerCase().replace(/\s+/g, "_")}` });
    } catch {
      // trackEvent may warn if analytics isn't initialised; that's fine here.
    }
  }

  /**
   * Respond to a `resetKey` change by clearing the error state so the
   * section re-renders when the user navigates away and back.
   */
  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    // We stash the last seen resetKey so we can detect a change.
    // We use a hidden field to avoid polluting the public state type.
    const s = state as State & { _lastResetKey?: string | number };
    if (props.resetKey !== undefined && props.resetKey !== s._lastResetKey) {
      return { hasError: false, error: null, _lastResetKey: props.resetKey } as Partial<State>;
    }
    return null;
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { section, children } = this.props;

    if (!hasError) return children;

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="rounded-xl border border-red-800 bg-red-950/40 p-6 text-center space-y-3"
      >
        <p className="text-sm font-semibold text-red-400">
          Failed to load {section}
        </p>
        {error?.message && (
          <p className="text-xs text-red-300/70 font-mono break-all">{error.message}</p>
        )}
        <button
          onClick={this.handleRetry}
          className="mt-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Retry
        </button>
      </div>
    );
  }
}
