import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StreamErrorBoundary } from '../StreamErrorBoundary';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A child that throws synchronously when `shouldThrow` is true. */
function Bomb({ shouldThrow = false, message = 'boom' }: { shouldThrow?: boolean; message?: string }) {
  if (shouldThrow) throw new Error(message);
  return <p>All good</p>;
}

/**
 * React calls console.error for every caught error boundary throw.
 * Suppress those so the test output stays clean.
 */
function suppressConsoleError() {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  return spy;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StreamErrorBoundary', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = suppressConsoleError();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders children normally when no error is thrown', () => {
    render(
      <StreamErrorBoundary section="Stream Timeline">
        <Bomb shouldThrow={false} />
      </StreamErrorBoundary>,
    );

    expect(screen.getByText('All good')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('catches a thrown error and shows the section-specific fallback UI', () => {
    render(
      <StreamErrorBoundary section="Transaction History">
        <Bomb shouldThrow message="fetch failed" />
      </StreamErrorBoundary>,
    );

    // The fallback container should be visible
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();

    // Section name should appear in the message
    expect(screen.getByText(/Transaction History/i)).toBeInTheDocument();

    // The error message from the thrown error should be visible
    expect(screen.getByText(/fetch failed/i)).toBeInTheDocument();
  });

  it('shows a Retry button in the fallback UI', () => {
    render(
      <StreamErrorBoundary section="Live Counter">
        <Bomb shouldThrow />
      </StreamErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('clears the error and re-renders children when Retry is clicked', () => {
    // Use a wrapper that holds the "shouldThrow" flag in React state so we
    // can flip it to false before clicking Retry, giving the boundary a
    // healthy child to render on the next pass.
    let setThrow!: (v: boolean) => void;

    function Wrapper() {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      setThrow = setShouldThrow;
      return (
        <StreamErrorBoundary section="Stream Timeline">
          <Bomb shouldThrow={shouldThrow} message="transient error" />
        </StreamErrorBoundary>
      );
    }

    render(<Wrapper />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Fix the underlying problem first, then click Retry to reset the boundary.
    setThrow(false);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('reports the error to console.error', () => {
    // Restore the mock so we can assert on it, but keep it silent.
    consoleSpy.mockRestore();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <StreamErrorBoundary section="Live Counter">
        <Bomb shouldThrow message="chart render failed" />
      </StreamErrorBoundary>,
    );

    // console.error is called by both React internals AND our componentDidCatch.
    // We assert our specific call signature is present.
    const ourCall = consoleSpy.mock.calls.find((args) =>
      String(args[0]).includes('[StreamErrorBoundary]'),
    );
    expect(ourCall).toBeDefined();
    expect(String(ourCall?.[0])).toContain('Live Counter');
    expect(ourCall?.[1]).toBeInstanceOf(Error);
    expect((ourCall?.[1] as Error).message).toBe('chart render failed');
  });

  it('resets automatically when resetKey changes (simulates navigation away and back)', () => {
    const { rerender } = render(
      <StreamErrorBoundary section="Stream Timeline" resetKey="stream-1">
        <Bomb shouldThrow message="initial error" />
      </StreamErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Simulate navigating to a different stream (resetKey changes).
    rerender(
      <StreamErrorBoundary section="Stream Timeline" resetKey="stream-2">
        <Bomb shouldThrow={false} />
      </StreamErrorBoundary>,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('keeps independent boundaries isolated — one section crashing does not affect siblings', () => {
    render(
      <div>
        <StreamErrorBoundary section="Stream Timeline">
          <Bomb shouldThrow message="timeline crashed" />
        </StreamErrorBoundary>
        <StreamErrorBoundary section="Transaction History">
          <p>History OK</p>
        </StreamErrorBoundary>
      </div>,
    );

    // First boundary shows error UI.
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Stream Timeline/i)).toBeInTheDocument();

    // Second boundary is unaffected.
    expect(screen.getByText('History OK')).toBeInTheDocument();
  });
});
