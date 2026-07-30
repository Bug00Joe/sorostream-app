import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider, useToast } from '../toast';

// ---------------------------------------------------------------------------
// Helper: renders ToastProvider with a child that exposes toast controls
// ---------------------------------------------------------------------------

interface ToastControls {
  add: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  upsert: (
    key: string,
    msg: string,
    type?: 'success' | 'error' | 'info' | 'warning',
    action?: { label: string; onClick: () => void },
  ) => void;
  remove: (id: number) => void;
}

let controls: ToastControls;

function ControlConsumer() {
  const { addToast, upsertPersistentToast, removeToast } = useToast();
  controls = {
    add: addToast,
    upsert: upsertPersistentToast,
    remove: removeToast,
  };
  return null;
}

function renderToasts() {
  return render(
    <ToastProvider>
      <ControlConsumer />
    </ToastProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ToastProvider — addToast', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('renders a toast with the given message', () => {
    renderToasts();
    act(() => { controls.add('Hello world', 'success'); });
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('applies the correct background class for each type', () => {
    renderToasts();

    act(() => { controls.add('ok', 'success'); });
    expect(screen.getByRole('alert')).toHaveClass('bg-green-600');
  });

  it('auto-dismisses after 4 seconds', () => {
    renderToasts();
    act(() => { controls.add('bye', 'info'); });
    expect(screen.getByText('bye')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.queryByText('bye')).not.toBeInTheDocument();
  });

  it('can be manually dismissed before 4 seconds', () => {
    renderToasts();
    act(() => { controls.add('dismiss me', 'info'); });

    fireEvent.click(screen.getByRole('button', { name: /dismiss notification/i }));
    expect(screen.queryByText('dismiss me')).not.toBeInTheDocument();
  });
});

describe('ToastProvider — upsertPersistentToast', () => {
  it('creates a persistent toast and renders the message', () => {
    renderToasts();
    act(() => { controls.upsert('key-1', 'Pending…', 'warning'); });
    expect(screen.getByText('Pending…')).toBeInTheDocument();
  });

  it('updates the message in-place on subsequent calls with the same key', () => {
    renderToasts();
    act(() => { controls.upsert('key-2', 'Step 1'); });
    act(() => { controls.upsert('key-2', 'Step 2'); });

    expect(screen.queryByText('Step 1')).not.toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    // Only one toast should exist for the same key
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('does not auto-dismiss', () => {
    vi.useFakeTimers();
    renderToasts();
    act(() => { controls.upsert('key-3', 'Stays here', 'info'); });

    act(() => { vi.advanceTimersByTime(10_000); });
    expect(screen.getByText('Stays here')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('can be dismissed via removeToast', () => {
    renderToasts();
    let toastId!: number;
    act(() => {
      toastId = controls.upsert('key-4', 'Remove me', 'info') as unknown as number;
    });
    act(() => { controls.remove(toastId); });
    expect(screen.queryByText('Remove me')).not.toBeInTheDocument();
  });
});

describe('ToastProvider — upsertPersistentToast with action', () => {
  it('renders the action button with the given label', () => {
    renderToasts();
    const onClick = vi.fn();
    act(() => {
      controls.upsert('key-undo', 'Cancelling in 5s…', 'warning', {
        label: 'Undo',
        onClick,
      });
    });

    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('calls the action onClick when the button is clicked', () => {
    renderToasts();
    const onClick = vi.fn();
    act(() => {
      controls.upsert('key-undo-2', 'Cancelling…', 'warning', {
        label: 'Undo',
        onClick,
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('preserves the action when message is updated via upsert', () => {
    renderToasts();
    const onClick = vi.fn();

    act(() => {
      controls.upsert('key-undo-3', 'Cancelling in 5s…', 'warning', {
        label: 'Undo',
        onClick,
      });
    });
    // Update message only (no new action passed)
    act(() => {
      controls.upsert('key-undo-3', 'Cancelling in 4s…', 'warning');
    });

    // Message updated
    expect(screen.getByText('Cancelling in 4s…')).toBeInTheDocument();
    // Undo button still present
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('replaces the action when a new one is passed on upsert', () => {
    renderToasts();
    const firstClick = vi.fn();
    const secondClick = vi.fn();

    act(() => {
      controls.upsert('key-undo-4', 'msg', 'warning', {
        label: 'Undo',
        onClick: firstClick,
      });
    });
    act(() => {
      controls.upsert('key-undo-4', 'msg', 'warning', {
        label: 'Retry',
        onClick: secondClick,
      });
    });

    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retryBtn);
    expect(secondClick).toHaveBeenCalledTimes(1);
    expect(firstClick).not.toHaveBeenCalled();
  });
});
